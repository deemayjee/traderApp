import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    // Get wallet address from query parameters
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get('address')
    
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Fetch user data from Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        *,
        wallets (*),
        portfolio (*),
        settings (*)
      `)
      .eq("wallets.address", walletAddress)
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

    try {
      // First, try to get existing user by wallet address
      const { data: existingWallet } = await supabase
        .from('wallets')
        .select('user_id, address')
        .eq('address', body.wallet.address)
        .single()

      let userId;
      
      if (existingWallet) {
        // If wallet exists, get the user
        userId = existingWallet.user_id;
        
        // Update last login timestamp
        await supabase
          .from('users')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      } else {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (insertError) throw insertError
        userId = newUser.id;
        
        // Add wallet
        const { error: walletError } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            address: body.wallet.address,
            chain: body.wallet.chain || 'solana',
            updated_at: new Date().toISOString()
          })

        if (walletError) throw walletError
        
        // Create default settings
        const { error: settingsError } = await supabase
          .from('settings')
          .insert({
            user_id: userId,
            notifications: true,
            theme: 'light',
            updated_at: new Date().toISOString()
          })

        if (settingsError) throw settingsError

        // Create empty portfolio
        const { error: portfolioError } = await supabase
          .from('portfolio')
          .insert({
            user_id: userId,
            updated_at: new Date().toISOString()
          })

        if (portfolioError) throw portfolioError
      }

      // Return the user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          wallets (*),
          portfolio (*),
          settings (*)
        `)
        .eq('id', userId)
        .single()

      if (userError) throw userError

      return NextResponse.json(userData)
    } catch (error) {
      console.error('Database operation failed:', error)
      return NextResponse.json({ error: "Database operation failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in POST /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 