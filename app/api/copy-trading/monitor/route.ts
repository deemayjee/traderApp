import { NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"
import { createClient } from "@supabase/supabase-js"

// Initialize Solana connection
const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com")

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PositionInfo {
  tokenAddress: string
  tokenSymbol: string
  amount: number
  entryPrice: number
  currentPrice: number
  pnl: number
  pnlPercentage: number
  isLocked: boolean
  lockEndDate?: string
}

async function getTokenPrice(tokenAddress: string): Promise<number> {
  try {
    // Get quote from Jupiter for 1 token
    const quoteResponse = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${tokenAddress}&outputMint=So11111111111111111111111111111111111111112&amount=1000000&slippageBps=50`
    )
    const quoteData = await quoteResponse.json()

    if (!quoteData.data) {
      throw new Error("Failed to get price quote")
    }

    // Calculate price in SOL
    return Number(quoteData.data.outAmount) / 1000000
  } catch (error) {
    console.error("Error getting token price:", error)
    throw error
  }
}

async function getPositionInfo(
  tokenAddress: string,
  tokenSymbol: string,
  amount: number,
  entryPrice: number,
  isAIPosition: boolean,
  lockEndDate?: string
): Promise<PositionInfo> {
  try {
    const currentPrice = await getTokenPrice(tokenAddress)
    const pnl = (currentPrice - entryPrice) * amount
    const pnlPercentage = ((currentPrice - entryPrice) / entryPrice) * 100

    return {
      tokenAddress,
      tokenSymbol,
      amount,
      entryPrice,
      currentPrice,
      pnl,
      pnlPercentage,
      isLocked: isAIPosition,
      lockEndDate
    }
  } catch (error) {
    console.error("Error getting position info:", error)
    throw error
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tradeId = searchParams.get("tradeId")
    const userWallet = searchParams.get("userWallet")

    if (!tradeId || !userWallet) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Get copy trade from database
    const { data: copyTrade, error: dbError } = await supabase
      .from("copy_trades")
      .select("*")
      .eq("id", tradeId)
      .single()

    if (dbError || !copyTrade) {
      return NextResponse.json(
        { error: "Copy trade not found" },
        { status: 404 }
      )
    }

    // Verify user owns this trade
    if (copyTrade.user_wallet !== userWallet) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Get position info for both user and AI
    const [userPosition, aiPosition] = await Promise.all([
      getPositionInfo(
        copyTrade.token_address,
        copyTrade.token_symbol,
        copyTrade.user_amount,
        copyTrade.entry_price,
        false
      ),
      getPositionInfo(
        copyTrade.token_address,
        copyTrade.token_symbol,
        copyTrade.ai_amount,
        copyTrade.entry_price,
        true,
        copyTrade.end_date
      )
    ])

    // Check if AI position is still locked
    const now = new Date()
    const lockEndDate = new Date(copyTrade.end_date)
    const isLocked = now < lockEndDate

    // Update trade status if lock period has ended
    if (!isLocked && copyTrade.status === "active") {
      await supabase
        .from("copy_trades")
        .update({ status: "completed" })
        .eq("id", tradeId)
    }

    return NextResponse.json({
      tradeId: copyTrade.id,
      status: copyTrade.status,
      startDate: copyTrade.start_date,
      endDate: copyTrade.end_date,
      isLocked,
      userPosition,
      aiPosition,
      performance: {
        userPnl: userPosition.pnl,
        userPnlPercentage: userPosition.pnlPercentage,
        aiPnl: aiPosition.pnl,
        aiPnlPercentage: aiPosition.pnlPercentage,
        difference: userPosition.pnl - aiPosition.pnl,
        differencePercentage: userPosition.pnlPercentage - aiPosition.pnlPercentage
      }
    })
  } catch (error) {
    console.error("Error monitoring positions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to monitor positions" },
      { status: 500 }
    )
  }
} 