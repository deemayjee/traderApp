import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tradeId = searchParams.get('tradeId')

    if (!tradeId) {
      return NextResponse.json(
        { error: "Trade ID is required" },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    // Get the trade details
    const { data: trade, error } = await supabaseAdmin
      .from('copy_trades')
      .select('entry_price')
      .eq('id', tradeId)
      .single()

    if (error) {
      console.error("Error fetching trade:", error)
      return NextResponse.json(
        { error: "Failed to fetch trade" },
        { status: 500 }
      )
    }

    if (!trade) {
      return NextResponse.json(
        { error: "Trade not found" },
        { status: 404 }
      )
    }

    // Return the entry price
    return NextResponse.json({ entryPrice: trade.entry_price })
  } catch (error) {
    console.error("Error in trade entry price endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 