import { supabaseAdmin } from '@/lib/supabase/server-admin'
import { NextAuthOptions } from "next-auth"
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type User = {
  wallet: string;
  username?: string;
  email?: string;
  profile?: any;
}

export async function auth(): Promise<User | null> {
  try {
    const { data: { session } } = await supabaseAdmin.auth.getSession()
    
    if (!session?.user) {
      return null
    }
    
    // Get the wallet address from Supabase auth
    const walletAddress = session.user.id
    
    // Get user profile info
    const { data: userData, error } = await supabaseAdmin
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
    let errMsg = 'Unknown error';
    if (typeof error === 'string') errMsg = error;
    else if (error && typeof error === 'object' && 'message' in error) errMsg = (error as any).message;
    else errMsg = String(error);
    console.error('Error in auth function:', errMsg);
    return null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "wallet",
      name: "Wallet",
      type: "credentials",
      credentials: {
        address: { label: "Wallet Address", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.address || !credentials?.signature) {
          return null
        }

        // For now, we'll allow any wallet address with a signature
        // In production, you should verify the signature properly

        return {
          id: credentials.address,
          address: credentials.address,
        }
      },
    },
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.address = user.address
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.address = String(token.address)
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function verifyAuth(token: string): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return user.id
  } catch (error) {
    console.error('Error verifying auth:', error)
    return null
  }
}

export async function getSession() {
  const cookieStore = cookies()
  const supabase = createClient(
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

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error:', error)
    return null
  }
} 