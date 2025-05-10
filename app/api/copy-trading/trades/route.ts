import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const traderWallet = searchParams.get("trader")

    if (!traderWallet) {
      return NextResponse.json(
        { error: "Trader wallet address is required" },
        { status: 400 }
      )
    }

    // Fetch recent trades
    const { data: trades, error: tradesError } = await supabaseAdmin
      .from("copy_trades")
      .select(`
        id,
        trades (
          id,
          timestamp,
          type,
          amount,
          price,
          status,
          profit
        )
      `)
      .eq("trader_wallet", traderWallet)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50)

    if (tradesError) {
      return NextResponse.json(
        { error: "Error fetching trades" },
        { status: 500 }
      )
    }

    // Fetch performance stats
    const { data: stats, error: statsError } = await supabaseAdmin
      .from("copy_trade_performance")
      .select("*")
      .eq("copy_trade_id", trades[0]?.id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single()

    if (statsError && statsError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Error fetching performance stats" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      trades: trades[0]?.trades || [],
      stats: stats || {
        total_trades: 0,
        successful_trades: 0,
        failed_trades: 0,
        total_profit: 0,
        win_rate: 0,
        average_profit: 0,
      },
    })
  } catch (error) {
    console.error("Error fetching trade data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 