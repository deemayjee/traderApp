import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase configuration error:", {
    url: supabaseUrl ? "exists" : "missing",
    key: supabaseAnonKey ? "exists" : "missing"
  })
  throw new Error("Missing Supabase environment variables. Please check your .env.local file.")
}

// Client for client-side operations (uses anonymous key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'pallycryp-web'
    }
  }
})

// Function to set the current wallet address
export async function setCurrentWalletAddress(walletAddress: string) {
  try {
    const { error } = await supabase.rpc('set_current_wallet_address', {
      wallet_address: walletAddress
    })
    if (error) throw error
  } catch (error) {
    console.error('Error setting current wallet address:', error)
    throw error
  }
}

// Function to get the current wallet address
export async function getCurrentWalletAddress() {
  const { data, error } = await supabase.rpc('get_current_wallet_address')
  if (error) throw error
  return data
}

// Client for server-side operations (uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
}) 