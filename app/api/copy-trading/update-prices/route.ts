import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"
import { Connection, PublicKey } from "@solana/web3.js"

// Jupiter API endpoints
const JUPITER_PRICE_API = "https://price.jup.ag/v4/price"
const SOL_MINT = "So11111111111111111111111111111111111111112"

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      )
    }

    // Get all active trades
    const { data: activeTrades, error: activeTradesError } = await supabaseAdmin
      .from("copy_trades")
      .select("*")
      .eq("status", "active")

    if (activeTradesError) {
      console.error("Error fetching active trades:", activeTradesError)
      return NextResponse.json(
        { error: "Error fetching active trades" },
        { status: 500 }
      )
    }

    console.log("Found active trades:", activeTrades.length)

    // Update prices for each trade
    for (const trade of activeTrades) {
      try {
        // Get current price from Jupiter
        const currentPrice = await getJupiterPrice(trade.token_address)
        console.log(`Price for ${trade.token_address}:`, currentPrice)
        
        // Update the trade with new price
        const { error: updateError } = await supabaseAdmin
          .from("copy_trades")
          .update({ current_price: currentPrice })
          .eq("id", trade.id)

        if (updateError) {
          console.error(`Error updating price for trade ${trade.id}:`, updateError)
        } else {
          console.log(`Successfully updated price for trade ${trade.id}`)
        }
      } catch (error) {
        console.error(`Error processing trade ${trade.id}:`, error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating prices:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function getJupiterPrice(tokenAddress: string): Promise<number> {
  try {
    // Fetch price from Jupiter API
    const response = await fetch(`${JUPITER_PRICE_API}?ids=${tokenAddress}&vsToken=${SOL_MINT}`)
    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Jupiter price response:", data)

    if (!data.data || !data.data[tokenAddress]) {
      throw new Error(`No price data for token ${tokenAddress}`)
    }

    // Jupiter returns price in SOL, so we need to convert to USD
    const priceInSol = data.data[tokenAddress].price
    const solPrice = data.data[SOL_MINT]?.price || 0

    // Calculate price in USD
    const priceInUsd = priceInSol * solPrice

    return priceInUsd
  } catch (error) {
    console.error("Error fetching Jupiter price:", error)
    throw error
  }
} 