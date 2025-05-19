import { NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"
import { createClient } from "@supabase/supabase-js"
import { TokenLockService } from "@/lib/services/token-lock"
import { AIWalletService } from "@/lib/services/ai-wallet-service"

// Initialize Solana connection
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
    const body = await req.json()
    const { userWallet, copyTradeId } = body

    if (!userWallet || !copyTradeId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Get the copy trade details
    const { data: copyTrade, error: tradeError } = await supabase
      .from("copy_trades")
      .select("*")
      .eq("id", copyTradeId)
      .single()

    if (tradeError || !copyTrade) {
      console.error("Error fetching copy trade:", tradeError)
      return NextResponse.json(
        { error: "Failed to fetch copy trade" },
        { status: 500 }
      )
    }

    // Verify the trade belongs to the user
    if (copyTrade.wallet_address !== userWallet) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Check if lock period has passed
    const currentTime = Date.now()
    const endDate = new Date(copyTrade.end_date).getTime()
    
    if (currentTime < endDate) {
      return NextResponse.json(
        { 
          error: "Tokens are still locked", 
          remainingDays: Math.ceil((endDate - currentTime) / (24 * 60 * 60 * 1000))
        },
        { status: 400 }
      )
    }

    // Get AI wallet keypair
    const { keypair } = await AIWalletService.getAIWallet(userWallet)

    // Release the tokens
    const signature = await tokenLockService.releaseTokens(
      copyTrade.pda_address,
      copyTrade.token_address,
      copyTrade.ai_wallet_address, // Send back to AI wallet
      keypair,
      copyTrade.lock_period
    )

    // Update trade status
    const { error: updateError } = await supabase
      .from("copy_trades")
      .update({ 
        status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("id", copyTradeId)

    if (updateError) {
      console.error("Error updating trade status:", updateError)
      // Don't fail the whole process if status update fails
    }

    return NextResponse.json({
      message: "Tokens released successfully",
      signature,
      details: {
        tokenAddress: copyTrade.token_address,
        tokenSymbol: copyTrade.token_symbol,
        amount: copyTrade.ai_amount,
        aiWalletAddress: copyTrade.ai_wallet_address
      }
    })

  } catch (error: any) {
    console.error("Error releasing tokens:", error)
    return NextResponse.json(
      { error: "Failed to release tokens", details: error.message },
      { status: 500 }
    )
  }
} 