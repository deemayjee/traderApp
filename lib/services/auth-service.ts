import { supabase } from "@/lib/supabase"

export class AuthService {
  async signInWithWallet(walletAddress: string) {
    try {
      // Set the wallet address for RLS policies
      const { error } = await supabase.rpc('set_wallet_address', { address: walletAddress })
      if (error) throw error
    } catch (error) {
      console.error("Error setting wallet address:", error)
      throw error
    }
  }

  async signOut() {
    // No need to do anything for sign out since we're not using Supabase auth
  }
} 