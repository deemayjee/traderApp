import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userWallet = searchParams.get("userWallet")
    console.log("Received request for user wallet:", userWallet)

    if (!userWallet) {
      return NextResponse.json(
        { error: "User wallet address is required" },
        { status: 400 }
      )
    }

    // Fetch active copy trades with trader information
    const { data: trades, error } = await supabaseAdmin
      .from("copy_trades")
      .select(`
        id,
        trader_wallet,
        allocation,
        max_slippage,
        stop_loss,
        status,
        traders (
          name
        )
      `)
      .eq("user_wallet", userWallet)
      .eq("status", "active")

    console.log("Database query result:", { trades, error })

    if (error) {
      console.error("Error fetching active copy trades:", error)
      return NextResponse.json(
        { error: "Failed to fetch active copy trades" },
        { status: 500 }
      )
    }

    // Transform the data to include trader name
    const formattedTrades = trades.map((trade: any) => ({
      id: trade.id,
      trader_wallet: trade.trader_wallet,
      trader_name: trade.traders?.name || `Trader ${trade.trader_wallet.slice(0, 4)}...${trade.trader_wallet.slice(-4)}`,
      allocation: trade.allocation,
      max_slippage: trade.max_slippage,
      stop_loss: trade.stop_loss,
      status: trade.status
    }))

    console.log("Formatted trades response:", formattedTrades)

    return NextResponse.json({
      trades: formattedTrades
    })
  } catch (error) {
    console.error("Error in active copy trades endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 