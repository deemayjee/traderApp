import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type User = {
  wallet: string;
  username?: string;
  email?: string;
  profile?: any;
}

export async function auth(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return null
    }
    
    // Get the wallet address from Supabase auth
    const walletAddress = session.user.id
    
    // Get user profile info
    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        wallet_address,
        username,
        email,
        user_profiles (*)
      `)
      .eq('wallet_address', walletAddress)
      .single()
    
    if (error || !userData) {
      console.error('Error fetching user data:', error)
      // Still return the basic user with wallet
      return {
        wallet: walletAddress
      }
    }
    
    return {
      wallet: userData.wallet_address,
      username: userData.username,
      email: userData.email,
      profile: userData.user_profiles
    }
  } catch (error) {
    console.error('Error in auth function:', error)
    return null
  }
} 