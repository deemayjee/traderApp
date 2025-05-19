import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"

export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      )
    }

    // Fetch active trades
    const { data: activeTrades, error: activeTradesError } = await supabaseAdmin
      .from("copy_trades")
      .select("id, token_address, entry_price, user_amount, ai_amount")
      .eq("wallet_address", wallet)
      .eq("status", "active")

    if (activeTradesError) {
      console.error("Error fetching active trades:", activeTradesError)
      return NextResponse.json(
        { error: "Error fetching active trades" },
        { status: 500 }
      )
    }

    // Fetch total trades count
    const { count: totalTrades, error: countError } = await supabaseAdmin
      .from("copy_trades")
      .select("*", { count: "exact", head: true })
      .eq("wallet_address", wallet)

    if (countError) {
      console.error("Error fetching total trades count:", countError)
      return NextResponse.json(
        { error: "Error fetching total trades count" },
        { status: 500 }
      )
    }

    // Calculate profit change (comparing current period with previous period)
    const currentPeriod = new Date()
    currentPeriod.setDate(currentPeriod.getDate() - 7) // Last 7 days

    const previousPeriod = new Date(currentPeriod)
    previousPeriod.setDate(previousPeriod.getDate() - 7) // 7 days before that

    const { data: recentTrades, error: recentTradesError } = await supabaseAdmin
      .from("copy_trades")
      .select("user_pnl, created_at")
      .eq("wallet_address", wallet)
      .gte("created_at", previousPeriod.toISOString())

    if (recentTradesError) {
      console.error("Error fetching recent trades:", recentTradesError)
      return NextResponse.json(
        { error: "Error fetching recent trades" },
        { status: 500 }
      )
    }

    const currentPeriodProfit = recentTrades
      .filter(trade => new Date(trade.created_at) >= currentPeriod)
      .reduce((sum, trade) => sum + (Number(trade.user_pnl) || 0), 0)

    const previousPeriodProfit = recentTrades
      .filter(trade => 
        new Date(trade.created_at) >= previousPeriod && 
        new Date(trade.created_at) < currentPeriod
      )
      .reduce((sum, trade) => sum + (Number(trade.user_pnl) || 0), 0)

    const profitChange = previousPeriodProfit !== 0
      ? ((currentPeriodProfit - previousPeriodProfit) / Math.abs(previousPeriodProfit)) * 100
      : 0

    return NextResponse.json({
      activeTrades,
      totalTrades,
      profitChange
    })
  } catch (error) {
    console.error("Error fetching trade stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 