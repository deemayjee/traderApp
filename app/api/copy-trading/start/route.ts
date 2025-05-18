import { NextResponse } from "next/server"
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, VersionedTransaction } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getMint } from "@solana/spl-token"
import { createClient } from "@supabase/supabase-js"
import { getRaydiumQuote, createRaydiumSwapTransaction } from "@/lib/api/raydium"
import { AIWalletService } from "@/lib/services/ai-wallet-service"
import * as nacl from "tweetnacl"
import { executeAIWalletCopyTrade } from "@/lib/services/ai-copy-trade"

// Initialize Solana connection
const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com")

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// SOL mint address
const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112")

// Maximum allowed price impact (5%)
const MAX_PRICE_IMPACT = 0.05

// Minimum required liquidity ratio (trade amount should be less than 10% of total liquidity)
const MIN_LIQUIDITY_RATIO = 0.1

interface TradeParams {
  inputTokenAddress: string
  outputTokenAddress: string
  inputAmount: number
  inputDecimals: number
  outputDecimals: number
}

interface MarketInfo {
  label: string
  lpFee: number
  platformFee: number
}

interface Route {
  inAmount: number
  outAmount: number
  priceImpact: number
  marketInfos: MarketInfo[]
}

interface LiquidityInfo {
  totalLiquidity: number
  availableLiquidity: number
  routes: Route[]
}

interface TradeResult {
  price: number
  priceImpact: number
  liquidityInfo: LiquidityInfo
}

async function validateToken(tokenAddress: string): Promise<{ decimals: number; supply: number }> {
  try {
    const mint = await getMint(connection, new PublicKey(tokenAddress))
    return {
      decimals: mint.decimals,
      supply: Number(mint.supply) / Math.pow(10, mint.decimals)
    }
  } catch (error) {
    throw new Error(`Invalid token address: ${tokenAddress}`)
  }
}

async function checkLiquidity(
  inputMint: PublicKey,
  outputMint: PublicKey,
  amount: number,
  decimals: number
): Promise<LiquidityInfo> {
  try {
    // Get quote with all routes
    const quoteResponse = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toString()}&outputMint=${outputMint.toString()}&amount=${Math.floor(amount * Math.pow(10, decimals))}&slippageBps=100`
    )
    const quoteData = await quoteResponse.json()

    // Check if we have a valid quote response
    if (!quoteData || !quoteData.outAmount) {
      console.error("Jupiter quote error:", quoteData)
      throw new Error("Failed to get quote from Jupiter")
    }

    // Get pool info to determine total liquidity
    const poolInfo = quoteData.routePlan[0]?.swapInfo
    if (!poolInfo) {
      throw new Error("No pool information available")
    }

    // Calculate amounts in human-readable format
    const inAmount = Number(quoteData.inAmount) / Math.pow(10, decimals)
    const outAmount = Number(quoteData.outAmount) / Math.pow(10, decimals)

    // Get the pool's total liquidity by making a larger quote
    const largeAmount = amount * 100 // Try with 100x the amount
    const largeQuoteResponse = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toString()}&outputMint=${outputMint.toString()}&amount=${Math.floor(largeAmount * Math.pow(10, decimals))}&slippageBps=100`
    )
    const largeQuoteData = await largeQuoteResponse.json()

    // If we can get a quote for a larger amount, use that to estimate total liquidity
    let totalLiquidity = amount
    if (largeQuoteData && largeQuoteData.outAmount) {
      const largeInAmount = Number(largeQuoteData.inAmount) / Math.pow(10, decimals)
      totalLiquidity = Math.max(largeInAmount, amount * 10) // Use the larger amount or 10x the requested amount
    } else {
      // If we can't get a larger quote, use a conservative estimate
      totalLiquidity = amount * 10
    }

    console.log("Liquidity calculation:", {
      requestedAmount: amount,
      largeAmount,
      totalLiquidity,
      inAmount,
      outAmount,
      poolInfo
    })

    const routes = [{
      inAmount,
      outAmount,
      priceImpact: Number(quoteData.priceImpactPct) / 100,
      marketInfos: quoteData.routePlan.map((route: any) => ({
        label: route.swapInfo.label || "Jupiter",
        lpFee: route.swapInfo.lpFee || 0,
        platformFee: route.swapInfo.platformFee || 0
      }))
    }]

    return {
      totalLiquidity,
      availableLiquidity: inAmount,
      routes
    }
  } catch (error) {
    console.error("Liquidity check error:", error)
    throw error
  }
}

async function checkPriceImpact(
  inputMint: PublicKey,
  outputMint: PublicKey,
  amount: number,
  decimals: number,
  existingQuote?: any
): Promise<{ priceImpact: number; isSafe: boolean }> {
  try {
    let quoteData;
    
    if (existingQuote) {
      // Use the existing quote if provided
      quoteData = existingQuote;
    } else {
      // Get quote for the requested amount
      const quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toString()}&outputMint=${outputMint.toString()}&amount=${Math.floor(amount * Math.pow(10, decimals))}&slippageBps=100`
      )
      quoteData = await quoteResponse.json()

      if (!quoteData || !quoteData.outAmount) {
        throw new Error("Failed to get quote from Jupiter")
      }
    }

    // Get quote for 1% of the amount to calculate price impact
    const smallAmount = amount * 0.01
    const smallQuoteResponse = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toString()}&outputMint=${outputMint.toString()}&amount=${Math.floor(smallAmount * Math.pow(10, decimals))}&slippageBps=100`
    )
    const smallQuoteData = await smallQuoteResponse.json()

    if (!smallQuoteData || !smallQuoteData.outAmount) {
      throw new Error("Failed to get small quote from Jupiter")
    }

    // Calculate price impact
    const expectedRate = Number(smallQuoteData.outAmount) / (smallAmount * Math.pow(10, decimals))
    const actualRate = Number(quoteData.outAmount) / (amount * Math.pow(10, decimals))
    const priceImpact = Math.abs(1 - (actualRate / expectedRate))

    return {
      priceImpact,
      isSafe: priceImpact <= MAX_PRICE_IMPACT
    }
  } catch (error) {
    console.error("Price impact check error:", error)
    throw error
  }
}

async function executeTrade(
  userWallet: string,
  params: TradeParams,
  isAITrade: boolean = false
) {
  try {
    console.log("Starting trade execution with params:", {
      userWallet,
      params,
      isAITrade
    })

    // Get wallet balance first
    const walletPubkey = new PublicKey(userWallet)
    const balance = await connection.getBalance(walletPubkey)
    const minRequiredBalance = LAMPORTS_PER_SOL * 0.01 // 0.01 SOL minimum required

    if (balance < minRequiredBalance) {
      throw new Error(`Insufficient balance. Required: ${minRequiredBalance / LAMPORTS_PER_SOL} SOL, Available: ${balance / LAMPORTS_PER_SOL} SOL`)
    }

    // Validate tokens
    console.log("Validating tokens...")
    const [inputToken, outputToken] = await Promise.all([
      validateToken(params.inputTokenAddress),
      validateToken(params.outputTokenAddress)
    ])
    console.log("Token validation results:", { inputToken, outputToken })

    // Verify decimals match
    if (inputToken.decimals !== params.inputDecimals) {
      console.warn(`Input token decimals mismatch. Expected ${inputToken.decimals}, got ${params.inputDecimals}. Using token's decimals.`)
      params.inputDecimals = inputToken.decimals
    }
    if (outputToken.decimals !== params.outputDecimals) {
      console.warn(`Output token decimals mismatch. Expected ${outputToken.decimals}, got ${params.outputDecimals}. Using token's decimals.`)
      params.outputDecimals = outputToken.decimals
    }

    // Check liquidity
    console.log("Checking liquidity...")
    const liquidityInfo = await checkLiquidity(
      new PublicKey(params.inputTokenAddress),
      new PublicKey(params.outputTokenAddress),
      params.inputAmount,
      params.inputDecimals
    )
    console.log("Liquidity check results:", liquidityInfo)

    // Verify sufficient liquidity
    if (params.inputAmount > liquidityInfo.availableLiquidity * 1.0001) { // Add 0.01% buffer for floating-point precision
      throw new Error(`Insufficient liquidity. Available: ${liquidityInfo.availableLiquidity}, Required: ${params.inputAmount}`)
    }

    // Check if trade amount is too large relative to total liquidity
    const liquidityRatio = params.inputAmount / liquidityInfo.totalLiquidity
    console.log("Liquidity ratio:", liquidityRatio)
    if (liquidityRatio > MIN_LIQUIDITY_RATIO) {
      throw new Error(`Trade amount too large. Trade is ${(liquidityRatio * 100).toFixed(2)}% of total liquidity. Maximum allowed: ${(MIN_LIQUIDITY_RATIO * 100).toFixed(2)}%`)
    }

    // Check price impact
    console.log("Checking price impact...")
    const { priceImpact, isSafe } = await checkPriceImpact(
      new PublicKey(params.inputTokenAddress),
      new PublicKey(params.outputTokenAddress),
      params.inputAmount,
      params.inputDecimals
    )
    console.log("Price impact check results:", { priceImpact, isSafe })

    if (!isSafe) {
      throw new Error(`Price impact too high: ${(priceImpact * 100).toFixed(2)}%. Maximum allowed: ${(MAX_PRICE_IMPACT * 100).toFixed(2)}%`)
    }

    // Get token mints
    const inputMint = new PublicKey(params.inputTokenAddress)
    const outputMint = new PublicKey(params.outputTokenAddress)
    
    let wallet: PublicKey
    if (isAITrade) {
      console.log("Getting AI wallet...")
      // Set current wallet address for RLS policies
      const { error: rlsError } = await supabase.rpc('set_current_wallet_address', {
        wallet_address: userWallet
      })

      if (rlsError) {
        console.error('Error setting RLS policy:', rlsError)
        throw new Error('Failed to set wallet permissions')
      }

      // Get AI wallet
      const aiWallet = await AIWalletService.getOrCreateAIWallet(userWallet)
      wallet = new PublicKey(aiWallet.walletAddress)
      console.log("AI wallet address:", aiWallet.walletAddress)
    } else {
      wallet = new PublicKey(userWallet)
      console.log("User wallet address:", userWallet)
    }
    
    // Get associated token accounts
    console.log("Getting associated token accounts...")
    const sourceATA = await getAssociatedTokenAddress(
      inputMint,
      wallet
    )
    const destinationATA = await getAssociatedTokenAddress(
      outputMint,
      wallet
    )
    console.log("Token accounts:", { sourceATA: sourceATA.toString(), destinationATA: destinationATA.toString() })

    // Create transaction
    let transaction: Transaction | VersionedTransaction
    let tradeResult: TradeResult = {
      price: 0,
      priceImpact: 0,
      liquidityInfo: {
        totalLiquidity: 0,
        availableLiquidity: 0,
        routes: []
      }
    }

    // Calculate input amount in smallest units
    const inputAmount = Math.floor(params.inputAmount * Math.pow(10, params.inputDecimals))
    console.log("Input amount in smallest units:", inputAmount)

    try {
      console.log("Trying Jupiter swap...")
      // Try Jupiter first with 1% slippage
      const quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toString()}&outputMint=${outputMint.toString()}&amount=${inputAmount}&slippageBps=100`
      )
      const quoteData = await quoteResponse.json()
      console.log("Jupiter quote response:", quoteData)

      if (!quoteData || !quoteData.outAmount) {
        throw new Error("Failed to get quote from Jupiter")
      }

      // Check price impact using the existing quote
      console.log("Checking price impact...")
      const { priceImpact, isSafe } = await checkPriceImpact(
        inputMint,
        outputMint,
        params.inputAmount,
        params.inputDecimals,
        quoteData
      )
      console.log("Price impact check results:", { priceImpact, isSafe })

      if (!isSafe) {
        throw new Error(`Price impact too high: ${(priceImpact * 100).toFixed(2)}%. Maximum allowed: ${(MAX_PRICE_IMPACT * 100).toFixed(2)}%`)
      }

      // Get swap transaction
      console.log("Getting Jupiter swap transaction...")
      const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          quoteResponse: quoteData,
          userPublicKey: wallet.toString(),
          wrapUnwrapSOL: true,
          slippageBps: 100 // 1% slippage
        })
      })
      const swapData = await swapResponse.json()
      console.log("Jupiter swap response:", swapData)

      if (!swapData.swapTransaction) {
        throw new Error("Failed to get swap transaction from Jupiter")
      }

      // Use the versioned transaction directly
      transaction = VersionedTransaction.deserialize(Buffer.from(swapData.swapTransaction, "base64"))

      // Calculate price from quote (normalize both to token units)
      tradeResult = {
        price: (Number(quoteData.outAmount) / Math.pow(10, params.outputDecimals)) / (inputAmount / Math.pow(10, params.inputDecimals)),
        priceImpact: Number(quoteData.priceImpactPct) / 100,
        liquidityInfo: {
          totalLiquidity: Number(quoteData.inAmount) / Math.pow(10, params.inputDecimals),
          availableLiquidity: Number(quoteData.inAmount) / Math.pow(10, params.inputDecimals),
          routes: [{
            inAmount: Number(quoteData.inAmount) / Math.pow(10, params.inputDecimals),
            outAmount: Number(quoteData.outAmount) / Math.pow(10, params.outputDecimals),
            priceImpact: Number(quoteData.priceImpactPct) / 100,
            marketInfos: quoteData.routePlan.map((route: any) => ({
              label: route.swapInfo.label || "Jupiter",
              lpFee: route.swapInfo.lpFee || 0,
              platformFee: route.swapInfo.platformFee || 0
            }))
          }]
        }
      }
    } catch (jupiterError) {
      console.log("Jupiter swap failed, trying Raydium:", jupiterError)

      // Create legacy transaction for Raydium
      transaction = new Transaction()

      // Add create ATA instructions if needed
      console.log("Checking token accounts...")
      const sourceAccountInfo = await connection.getAccountInfo(sourceATA)
      if (!sourceAccountInfo) {
        console.log("Creating source ATA...")
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet,
            sourceATA,
            wallet,
            inputMint
          )
        )
      }

      const destAccountInfo = await connection.getAccountInfo(destinationATA)
      if (!destAccountInfo) {
        console.log("Creating destination ATA...")
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet,
            destinationATA,
            wallet,
            outputMint
          )
        )
      }

      // Try Raydium as fallback with 1% slippage
      const raydiumQuote = await getRaydiumQuote(
        connection,
        inputMint,
        outputMint,
        params.inputAmount,
        params.inputDecimals
      )
      console.log("Raydium quote:", raydiumQuote)

      // Check price impact
      if (raydiumQuote.priceImpact > MAX_PRICE_IMPACT) {
        throw new Error(`Price impact too high: ${(raydiumQuote.priceImpact * 100).toFixed(2)}%. Maximum allowed: ${(MAX_PRICE_IMPACT * 100).toFixed(2)}%`)
      }

      // Create Raydium swap transaction
      console.log("Creating Raydium swap transaction...")
      const raydiumTransaction = await createRaydiumSwapTransaction(
        connection,
        raydiumQuote.poolInfo,
        wallet,
        inputMint,
        outputMint,
        params.inputAmount,
        params.inputDecimals
      )

      // Add Raydium swap instructions
      transaction.add(...raydiumTransaction.instructions)

      // Set price and impact from Raydium quote
      tradeResult = {
        price: raydiumQuote.outputAmount / params.inputAmount,
        priceImpact: raydiumQuote.priceImpact,
        liquidityInfo: {
          totalLiquidity: Number(raydiumQuote.poolInfo.baseMint),
          availableLiquidity: Number(raydiumQuote.poolInfo.baseMint),
          routes: [{
            inAmount: params.inputAmount,
            outAmount: raydiumQuote.outputAmount,
            priceImpact: raydiumQuote.priceImpact,
            marketInfos: [{
              label: "Raydium",
              lpFee: 0.0025, // 0.25% fee
              platformFee: 0
            }]
          }]
        }
      }
    }

    // Sign and send transaction
    console.log("Signing and sending transaction...")
    let txSignature: string | undefined
    let result: {
      signature?: string;
      transaction?: string;
      type?: string;
      amount: number;
      price?: number;
      priceImpact?: number;
      liquidityInfo?: LiquidityInfo;
    }

    if (isAITrade) {
      // Get AI wallet keypair
      const { keypair } = await AIWalletService.getAIWallet(userWallet)
      if (transaction instanceof VersionedTransaction) {
        // For versioned transactions, we need to sign the message hash
        const messageHash = transaction.message.serialize()
        const sig = nacl.sign.detached(messageHash, keypair.secretKey)
        transaction.addSignature(keypair.publicKey, sig)
        txSignature = await connection.sendTransaction(transaction)
      } else {
        txSignature = await connection.sendTransaction(transaction, [keypair])
      }
    } else {
      if (transaction instanceof VersionedTransaction) {
        // For user transactions, we need to return the transaction for frontend signing
        const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64')
        return {
          transaction: serializedTransaction,
          type: 'versioned',
          amount: params.inputAmount
        }
      } else {
        txSignature = await connection.sendTransaction(transaction, [])
      }
    }
    
    if (txSignature) {
      console.log("Transaction sent, signature:", txSignature)
      
      // Try to confirm transaction with a longer timeout
      try {
        const latestBlockhash = await connection.getLatestBlockhash()
        const confirmation = await connection.confirmTransaction({
          signature: txSignature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        })

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`)
        }

        console.log("Transaction confirmed")
      } catch (confirmError) {
        console.warn("Transaction confirmation timeout, but may still succeed:", confirmError)
        // Don't throw here - the transaction might still succeed
      }

      result = {
        signature: txSignature,
        amount: params.inputAmount,
        price: tradeResult.price,
        priceImpact: tradeResult.priceImpact,
        liquidityInfo: tradeResult.liquidityInfo
      }
    } else {
      throw new Error("Failed to send transaction")
    }

    return result
  } catch (error) {
    console.error("Trade execution error:", error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      inputTokenAddress,
      outputTokenAddress,
      inputTokenSymbol,
      outputTokenSymbol,
      inputAmount,
      inputDecimals,
      outputDecimals,
      aiAmount,
      userWallet
    } = body

    // Validate input
    if (!inputTokenAddress || !outputTokenAddress || !inputAmount || !userWallet) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Get a fresh blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')

    // Create the user's transaction
    const transaction = await executeTrade(
      userWallet,
      {
        inputTokenAddress,
        outputTokenAddress,
        inputAmount,
        inputDecimals,
        outputDecimals
      },
      false // isAITrade is always false for token sales
    )

    if (!transaction.transaction) {
      throw new Error("Failed to create transaction")
    }

    // Return the transaction for the user to sign
    return NextResponse.json({
      transaction: transaction.transaction,
      blockhash,
      lastValidBlockHeight,
      type: transaction.type,
      amount: inputAmount
    })
  } catch (error) {
    console.error("Error starting copy trade:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start copy trade" },
      { status: 500 }
    )
  }
}

export { executeTrade } 