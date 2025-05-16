import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userWallet = searchParams.get('userWallet')

    if (!userWallet) {
      return NextResponse.json(
        { error: "User wallet address is required" },
        { status: 400 }
      )
    }

    // Set current wallet address for RLS policies
    const { error: rlsError } = await supabase.rpc('set_current_wallet_address', {
      wallet_address: userWallet
    })

    if (rlsError) {
      console.error('Error setting RLS policy:', rlsError)
      return NextResponse.json(
        { error: "Failed to set wallet permissions" },
        { status: 500 }
      )
    }

    // Get active copy trades
    const { data: trades, error } = await supabase
      .from('copy_trades')
      .select('*')
      .eq('wallet_address', userWallet)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching copy trades:', error)
      return NextResponse.json(
        { error: "Failed to fetch copy trades" },
        { status: 500 }
      )
    }

    return NextResponse.json({ trades })
  } catch (error) {
    console.error('Error in active copy trades endpoint:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 