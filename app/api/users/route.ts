import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"

export async function GET(request: Request) {
  try {
    // Get wallet address from query parameters
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get('address')
    
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database client not available" }, { status: 500 })
    }

    // Fetch user data from Supabase
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single()

    if (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error in GET /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Get request body
    const body = await request.json()
    console.log('Processing request for wallet:', body.wallet)

    if (!body.wallet?.address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const walletAddress = body.wallet.address

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database client not available" }, { status: 500 })
    }

    try {
      // First, try to get existing user by wallet address
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, wallet_address')
        .eq('wallet_address', walletAddress)
        .single()

      let user;
      
      if (existingUser) {
        // If user exists, update last active timestamp
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            last_active: new Date().toISOString()
          })
          .eq('id', existingUser.id)
          .select()
          .single()

        if (updateError) throw updateError
        user = updatedUser
      } else {
        // Create new user
        const { data: newUser, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            wallet_address: walletAddress,
            last_active: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (userError) throw userError
        user = newUser
      }

      return NextResponse.json({ user, success: true })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: 'Database operation failed', 
        details: dbError instanceof Error ? dbError.message : 'Unknown error' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in POST /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 