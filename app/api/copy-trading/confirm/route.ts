import { NextResponse } from "next/server"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createClient } from "@supabase/supabase-js"
import { executeAIWalletCopyTrade } from "@/lib/services/ai-copy-trade"

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
      // If transaction doesn't exist, try to confirm it
      let confirmation;
      let retries = 3;
      while (retries > 0) {
        try {
          console.log(`Attempting to confirm transaction (${retries} retries left)...`)
          confirmation = await connection.confirmTransaction(signature, 'confirmed')
          if (confirmation.value.err) {
            console.error("Transaction failed:", confirmation.value.err)
            return NextResponse.json({ error: "User transaction failed or not confirmed" }, { status: 400 })
          }
          console.log("Transaction confirmed successfully!")
          break;
        } catch (error) {
          console.error(`Confirmation attempt failed:`, error)
          retries--;
          if (retries === 0) {
            // If we've exhausted retries, check one last time if the transaction exists
            tx = await connection.getTransaction(signature, { 
              commitment: 'confirmed',
              maxSupportedTransactionVersion: 0
            })
            if (!tx) {
              tx = await connection.getTransaction(signature, { 
                commitment: 'finalized',
                maxSupportedTransactionVersion: 0
              })
            }
            if (!tx) {
              console.error("Transaction not found after all attempts")
              return NextResponse.json({ 
                error: "Transaction not found. It may have failed or is still processing.",
                signature
              }, { status: 400 })
            }
          }
          console.log(`Waiting 5 seconds before retry ${retries}...`)
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }
    }

    // If we have a transaction, check if it failed
    if (tx?.meta?.err) {
      console.error("Transaction failed:", tx.meta.err)
      return NextResponse.json({ error: "User transaction failed" }, { status: 400 })
    }

    // If this is a regular token sale (aiAmount is 0), we don't need to do AI copy trade
    if (aiAmount === 0) {
      console.log("Regular token sale confirmed, no AI copy trade needed")
      return NextResponse.json({
        message: "Token sale completed successfully",
        details: {
          inputTokenAddress,
          outputTokenAddress,
          inputTokenSymbol,
          outputTokenSymbol,
          inputAmount,
          userWallet,
          signature
        }
      })
    }

    // Only proceed with AI copy trade if aiAmount is greater than 0
    console.log("Starting AI copy trade process...")
    
    // 2. Get AI wallet
    console.log("Fetching AI wallet...")
    const { data: aiWallet, error: aiWalletError } = await supabase
      .from('ai_wallets')
      .select('ai_wallet_address')
      .eq('wallet_address', userWallet)
      .single()

    if (aiWalletError) {
      console.error("Error fetching AI wallet:", aiWalletError)
      return NextResponse.json(
        { error: "Failed to fetch AI wallet" },
        { status: 500 }
      )
    }

    // 3. Execute AI wallet's copy trade
    console.log("Executing AI copy trade...")
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

      // Verify the AI trade transaction
      const aiTx = await connection.getTransaction(aiTrade.signature, { 
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      })
      if (!aiTx) {
        throw new Error("AI trade transaction not found")
      }

      if (aiTx.meta?.err) {
        throw new Error(`AI trade transaction failed: ${aiTx.meta.err}`)
      }

      // Continue with storing trades in database...

      // 4. Store both trades in the database
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

      // Insert the copy trade
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
          ai_wallet_address: aiWallet.ai_wallet_address
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
          liquidityInfo: aiTrade.liquidityInfo
        }
      })
    } catch (error) {
      console.error("Error in /api/copy-trading/confirm:", error)
      const errorResponse = {
        error: error instanceof Error ? error.message : "Failed to confirm and copy trade"
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }
  } catch (error) {
    console.error("Error in /api/copy-trading/confirm:", error)
    const errorResponse = {
      error: error instanceof Error ? error.message : "Failed to confirm and copy trade"
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
} 