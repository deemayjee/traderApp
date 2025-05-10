import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"
import { getWalletBalance } from "@/lib/solana/wallet"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { traderWallet, allocation, maxSlippage, stopLoss, userWallet, traderName } = body

    // Validate required fields
    if (!traderWallet || !allocation || !maxSlippage || !stopLoss || !userWallet) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate allocation is within limits
    if (allocation <= 0 || allocation > 10) {
      return NextResponse.json(
        { error: "Allocation must be between 0 and 10 SOL" },
        { status: 400 }
      )
    }

    // Validate slippage is within limits
    if (maxSlippage <= 0 || maxSlippage > 5) {
      return NextResponse.json(
        { error: "Max slippage must be between 0 and 5%" },
        { status: 400 }
      )
    }

    // Validate stop loss is within limits
    if (stopLoss <= 0 || stopLoss > 20) {
      return NextResponse.json(
        { error: "Stop loss must be between 0 and 20%" },
        { status: 400 }
      )
    }

    // Check if user already has an active copy trade for this trader
    const { data: existingCopy, error: existingError } = await supabaseAdmin
      .from("copy_trades")
      .select("*")
      .eq("user_wallet", userWallet)
      .eq("trader_wallet", traderWallet)
      .eq("status", "active")
      .single()

    if (existingError && existingError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Error checking existing copy trades" },
        { status: 500 }
      )
    }

    if (existingCopy) {
      return NextResponse.json(
        { error: "You are already copying this trader" },
        { status: 400 }
      )
    }

    // Check wallet balance
    const balance = await getWalletBalance(userWallet)
    if (balance < allocation) {
      return NextResponse.json(
        { error: "Insufficient wallet balance" },
        { status: 400 }
      )
    }

    // Get or create trader information
    let trader = null
    const { data: existingTrader, error: traderError } = await supabaseAdmin
      .from("traders")
      .select("*")
      .eq("wallet_address", traderWallet)
      .single()

    if (traderError && traderError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Error fetching trader information" },
        { status: 500 }
      )
    }

    if (!existingTrader) {
      // Create new trader record
      const { data: newTrader, error: createError } = await supabaseAdmin
        .from("traders")
        .insert({
          wallet_address: traderWallet,
          name: traderName || `Trader ${traderWallet.slice(0, 4)}...${traderWallet.slice(-4)}`,
          status: "active",
          total_trades: 0,
          successful_trades: 0,
          failed_trades: 0,
          total_profit: 0,
          win_rate: 0
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating trader:", createError)
        return NextResponse.json(
          { error: "Error creating trader record" },
          { status: 500 }
        )
      }

      trader = newTrader
    } else {
      trader = existingTrader
    }

    // Create copy trade record
    const { data: copyTrade, error: copyError } = await supabaseAdmin
      .from("copy_trades")
      .insert({
        user_wallet: userWallet,
        trader_wallet: traderWallet,
        allocation: allocation,
        max_slippage: maxSlippage,
        stop_loss: stopLoss,
        status: "active",
        started_at: new Date().toISOString(),
        last_trade_at: null,
        total_trades: 0,
        successful_trades: 0,
        failed_trades: 0,
        total_profit: 0,
      })
      .select()
      .single()

    if (copyError) {
      return NextResponse.json(
        { error: "Error creating copy trade" },
        { status: 500 }
      )
    }

    // Create initial performance record
    const { error: performanceError } = await supabaseAdmin
      .from("copy_trade_performance")
      .insert({
        copy_trade_id: copyTrade.id,
        timestamp: new Date().toISOString(),
        total_trades: 0,
        successful_trades: 0,
        failed_trades: 0,
        total_profit: 0,
        win_rate: 0,
        average_profit: 0,
      })

    if (performanceError) {
      console.error("Error creating performance record:", performanceError)
      // Don't return error here as the copy trade was created successfully
    }

    return NextResponse.json({
      success: true,
      message: "Copy trading started successfully",
      data: copyTrade,
    })
  } catch (error) {
    console.error("Error starting copy trading:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 