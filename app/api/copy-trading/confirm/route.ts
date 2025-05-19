import { NextResponse } from "next/server"
import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js"
import { createClient } from "@supabase/supabase-js"
import { executeAIWalletCopyTrade } from "@/lib/services/ai-copy-trade"
import { TokenLockService } from "@/lib/services/token-lock"
import { PostgrestError } from "@supabase/supabase-js"
import { AIWalletService } from "@/lib/services/ai-wallet-service"
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"

// Initialize Solana connection with longer commitment
const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com",
  {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000 // 60 seconds
  }
)

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize token lock service
const tokenLockService = new TokenLockService(connection)

export async function POST(req: Request) {
  try {
    console.log("Received copy trade confirmation request")
    const body = await req.json()
    const {
      userWallet,
      signature,
      inputTokenAddress,
      outputTokenAddress,
      inputTokenSymbol,
      outputTokenSymbol,
      inputAmount,
      inputDecimals,
      outputDecimals,
      aiAmount
    } = body

    console.log("Starting transaction confirmation process for signature:", signature)

    // 1. Check if transaction exists first
    let tx = await connection.getTransaction(signature, { 
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    })
    if (!tx) {
      // Try with finalized commitment
      tx = await connection.getTransaction(signature, { 
        commitment: 'finalized',
        maxSupportedTransactionVersion: 0
      })
    }

    if (!tx) {
      console.error("Transaction not found")
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    if (tx.meta?.err) {
      console.error("Transaction failed:", tx.meta.err)
      return NextResponse.json(
        { error: "Transaction failed", details: tx.meta.err },
        { status: 400 }
      )
    }

    // 2. Get AI wallet
    const { data: aiWallet, error: aiWalletError } = await supabase
      .from("ai_wallets")
      .select("*")
      .eq("wallet_address", userWallet)
      .single()

    if (aiWalletError || !aiWallet) {
      console.error("Error fetching AI wallet:", aiWalletError as PostgrestError)
      return NextResponse.json(
        { error: "Failed to fetch AI wallet" },
        { status: 500 }
      )
    }

    try {
      // Check AI wallet balance first
      const aiWalletPubkey = new PublicKey(aiWallet.ai_wallet_address)
      const aiWalletBalance = await connection.getBalance(aiWalletPubkey)
      console.log("AI wallet balance:", aiWalletBalance / LAMPORTS_PER_SOL, "SOL")

      if (aiWalletBalance < LAMPORTS_PER_SOL * 0.01) {
        console.error("AI wallet has insufficient balance")
        return NextResponse.json({
          error: "AI wallet has insufficient balance",
          details: {
            required: 0.01,
            available: aiWalletBalance / LAMPORTS_PER_SOL,
            aiWalletAddress: aiWallet.ai_wallet_address
          }
        }, { status: 400 })
      }

      // Create token lock for AI copy trades
      let lockResult = null;
      
      // Get the AI wallet's token account balance BEFORE the trade
      const tokenMintPubkey = new PublicKey(outputTokenAddress);
      const aiATA = await getAssociatedTokenAddress(tokenMintPubkey, aiWalletPubkey);
      const beforeTradeBalance = await getAccount(connection, aiATA);
      const beforeTradeAmount = Number(beforeTradeBalance.amount);
      
      // Execute the AI trade
      const aiTrade = await executeAIWalletCopyTrade({
        userWallet,
        inputTokenAddress,
        outputTokenAddress,
        aiAmount,
        inputDecimals,
        outputDecimals
      })
      console.log("AI trade executed successfully:", aiTrade)

      if (!aiTrade || !aiTrade.signature) {
        throw new Error("AI trade execution failed - no signature returned")
      }

      // Wait for transaction confirmation with retries
      let aiTx = null;
      let retries = 0;
      const maxRetries = 5;
      const retryDelay = 2000; // 2 seconds

      while (retries < maxRetries) {
        try {
          // Wait for confirmation
          await connection.confirmTransaction(aiTrade.signature, 'confirmed');
          
          // Get transaction details
          aiTx = await connection.getTransaction(aiTrade.signature, { 
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          });

          if (aiTx) {
            break;
          }
        } catch (error) {
          console.log(`Retry ${retries + 1}/${maxRetries} - Waiting for transaction confirmation...`);
        }

        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      if (!aiTx) {
        throw new Error("AI trade transaction not found after multiple retries")
      }

      if (aiTx.meta?.err) {
        throw new Error(`AI trade transaction failed: ${aiTx.meta.err}`)
      }

      // Get the AI wallet's token account balance AFTER the trade
      const afterTradeBalance = await getAccount(connection, aiATA);
      const afterTradeAmount = Number(afterTradeBalance.amount);
      
      // Calculate the exact amount received from this trade
      const tradeReceivedAmount = afterTradeAmount - beforeTradeAmount;
      
      if (tradeReceivedAmount > 0) {
        try {
          console.log("Creating token lock for AI trade with amount:", tradeReceivedAmount, "raw units");
          const { keypair } = await AIWalletService.getAIWallet(userWallet)
          
          lockResult = await tokenLockService.createTokenLock({
            userWallet: aiWallet.ai_wallet_address,
            tokenMint: outputTokenAddress,
            amount: tradeReceivedAmount, // Only lock the amount received from this trade
            lockPeriod: 10, // 10 days lock period
            decimals: outputDecimals
          }, keypair)
          
          console.log("Token lock created:", lockResult)
        } catch (lockError: any) {
          console.error("Error creating token lock:", lockError)
          // Don't fail the whole process if lock creation fails
          // Just log the error and continue
        }
      }

      // Store both trades in the database with lock info
      console.log("Storing trades in database...")
      const startDate = new Date()
      const endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now

      // Get user ID
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", userWallet)
        .single()

      if (userError) {
        console.error("Error finding user:", userError)
        return NextResponse.json(
          { error: "Failed to find user" },
          { status: 500 }
        )
      }

      // Insert the copy trade with lock info
      const { data: copyTrade, error: dbError } = await supabase
        .from("copy_trades")
        .insert({
          user_id: user.id,
          wallet_address: userWallet,
          token_address: outputTokenAddress,
          token_symbol: outputTokenSymbol,
          user_amount: inputAmount,
          ai_amount: aiAmount,
          lock_period: 10,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "active",
          user_trade_signature: signature,
          ai_trade_signature: aiTrade.signature,
          entry_price: aiTrade.price ? aiTrade.price / Math.pow(10, outputDecimals) : 0,
          ai_wallet_address: aiWallet.ai_wallet_address,
          lock_id: lockResult?.lockId,
          pda_address: lockResult?.pdaAddress,
          locked_amount: tradeReceivedAmount
        })
        .select()
        .single()

      if (dbError) {
        console.error("Database error:", dbError)
        return NextResponse.json(
          { error: "Failed to store copy trade" },
          { status: 500 }
        )
      }

      console.log("Copy trade completed successfully")
      return NextResponse.json({
        id: copyTrade.id,
        message: "Copy trade completed successfully",
        details: {
          inputTokenAddress,
          outputTokenAddress,
          inputTokenSymbol,
          outputTokenSymbol,
          inputAmount,
          aiAmount,
          userWallet,
          lockPeriod: 10,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          userTradeSignature: signature,
          aiTradeSignature: aiTrade.signature,
          entryPrice: aiTrade.price ? aiTrade.price / Math.pow(10, outputDecimals) : 0,
          priceImpact: aiTrade.priceImpact,
          liquidityInfo: aiTrade.liquidityInfo,
          lockId: lockResult?.lockId,
          pdaAddress: lockResult?.pdaAddress
        }
      })
    } catch (error: any) {
      console.error("Error in copy trade process:", error)
      return NextResponse.json(
        { error: "Failed to process copy trade", details: error.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error in copy trade confirmation:", error)
    return NextResponse.json(
      { error: "Failed to confirm copy trade", details: error.message },
      { status: 500 }
    )
  }
} 