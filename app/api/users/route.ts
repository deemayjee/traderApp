import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    // Get wallet address from query parameters
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get('address')
    
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Fetch user data from Supabase
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*, wallets(*)")
      .eq("wallet_address", walletAddress)
      .single()

    if (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch all related data using wallet_address
    const [
      { data: profile },
      { data: preferences },
      { data: dashboard },
      { data: notifications },
      { data: trading },
      { data: security },
      { data: subscription }
    ] = await Promise.all([
      supabaseAdmin.from("user_profiles").select("*").eq("wallet_address", walletAddress).single(),
      supabaseAdmin.from("user_preferences").select("*").eq("wallet_address", walletAddress).single(),
      supabaseAdmin.from("dashboard_preferences").select("*").eq("wallet_address", walletAddress).single(),
      supabaseAdmin.from("notification_settings").select("*").eq("wallet_address", walletAddress).single(),
      supabaseAdmin.from("trading_preferences").select("*").eq("wallet_address", walletAddress).single(),
      supabaseAdmin.from("security_settings").select("*").eq("wallet_address", walletAddress).single(),
      supabaseAdmin.from("subscription_settings").select("*").eq("wallet_address", walletAddress).single()
    ])

    // Combine all data
    const userData = {
      ...user,
      user_profile: profile,
      user_preferences: preferences,
      dashboard_preferences: dashboard,
      notification_settings: notifications,
      trading_preferences: trading,
      security_settings: security,
      subscription_settings: subscription
    }

    return NextResponse.json(userData)
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

    try {
      // First, try to get existing user by wallet address
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, wallet_address')
        .eq('wallet_address', walletAddress)
        .single()

      let userId;
      
      if (existingUser) {
        // If user exists, get the user ID
        userId = existingUser.id;
        
        // Update last active timestamp
        await supabaseAdmin
          .from('users')
          .update({
            last_active: new Date().toISOString()
          })
          .eq('id', userId)
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
        userId = newUser.id;

        // Create wallet entry
        const { error: walletError } = await supabaseAdmin
          .from('wallets')
          .insert({
            address: walletAddress,
            user_id: userId,
            is_primary: true,
            chain: body.wallet.chain || 'ethereum',
            last_active: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (walletError) throw walletError

        // Check if profile exists before creating
        const { data: existingProfile } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('wallet_address', walletAddress)
          .single()

        if (!existingProfile) {
          // Create user profile only if it doesn't exist
          const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .insert({
              wallet_address: walletAddress,
              last_active: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (profileError) throw profileError
        }

        // Check if preferences exist before creating
        const { data: existingPreferences } = await supabaseAdmin
          .from('user_preferences')
          .select('id')
          .eq('wallet_address', walletAddress)
          .single()

        if (!existingPreferences) {
          // Create user preferences only if they don't exist
          const { error: preferencesError } = await supabaseAdmin
            .from('user_preferences')
            .insert({
              wallet_address: walletAddress,
              theme: 'light',
              language: 'en',
              currency: 'USD',
              last_active: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (preferencesError) throw preferencesError
        }

        // Check if dashboard preferences exist before creating
        const { data: existingDashboard } = await supabaseAdmin
          .from('dashboard_preferences')
          .select('id')
          .eq('wallet_address', walletAddress)
          .single()

        if (!existingDashboard) {
          // Create dashboard preferences only if they don't exist
          const { error: dashboardError } = await supabaseAdmin
            .from('dashboard_preferences')
            .insert({
              wallet_address: walletAddress,
              last_active: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (dashboardError) throw dashboardError
        }

        // Check if notification settings exist before creating
        const { data: existingNotifications } = await supabaseAdmin
          .from('notification_settings')
          .select('id')
          .eq('wallet_address', walletAddress)
          .single()

        if (!existingNotifications) {
          // Create notification settings only if they don't exist
          const { error: notificationError } = await supabaseAdmin
            .from('notification_settings')
            .insert({
              wallet_address: walletAddress,
              email_notifications: true,
              push_notifications: true,
              last_active: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (notificationError) throw notificationError
        }

        // Check if trading preferences exist before creating
        const { data: existingTrading } = await supabaseAdmin
          .from('trading_preferences')
          .select('id')
          .eq('wallet_address', walletAddress)
          .single()

        if (!existingTrading) {
          // Create trading preferences only if they don't exist
          const { error: tradingError } = await supabaseAdmin
            .from('trading_preferences')
            .insert({
              wallet_address: walletAddress,
              last_active: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (tradingError) throw tradingError
        }

        // Check if security settings exist before creating
        const { data: existingSecurity } = await supabaseAdmin
          .from('security_settings')
          .select('id')
          .eq('wallet_address', walletAddress)
          .single()

        if (!existingSecurity) {
          // Create security settings only if they don't exist
          const { error: securityError } = await supabaseAdmin
            .from('security_settings')
            .insert({
              wallet_address: walletAddress,
              last_active: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (securityError) throw securityError
        }

        // Check if subscription settings exist before creating
        const { data: existingSubscription } = await supabaseAdmin
          .from('subscription_settings')
          .select('id')
          .eq('wallet_address', walletAddress)
          .single()

        if (!existingSubscription) {
          // Create subscription settings only if they don't exist
          const { error: subscriptionError } = await supabaseAdmin
            .from('subscription_settings')
            .insert({
              wallet_address: walletAddress,
              last_active: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (subscriptionError) throw subscriptionError
        }
      }

      // Fetch all user data
      const [
        { data: user },
        { data: profile },
        { data: preferences },
        { data: dashboard },
        { data: notifications },
        { data: trading },
        { data: security },
        { data: subscription }
      ] = await Promise.all([
        supabaseAdmin.from("users").select("*, wallets(*)").eq("id", userId).single(),
        supabaseAdmin.from("user_profiles").select("*").eq("wallet_address", walletAddress).single(),
        supabaseAdmin.from("user_preferences").select("*").eq("wallet_address", walletAddress).single(),
        supabaseAdmin.from("dashboard_preferences").select("*").eq("wallet_address", walletAddress).single(),
        supabaseAdmin.from("notification_settings").select("*").eq("wallet_address", walletAddress).single(),
        supabaseAdmin.from("trading_preferences").select("*").eq("wallet_address", walletAddress).single(),
        supabaseAdmin.from("security_settings").select("*").eq("wallet_address", walletAddress).single(),
        supabaseAdmin.from("subscription_settings").select("*").eq("wallet_address", walletAddress).single()
      ])

      // Combine all data
      const userData = {
        ...user,
        user_profile: profile,
        user_preferences: preferences,
        dashboard_preferences: dashboard,
        notification_settings: notifications,
        trading_preferences: trading,
        security_settings: security,
        subscription_settings: subscription
      }

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