import { createClient } from "@supabase/supabase-js"
import { Keypair } from "@solana/web3.js"
import { encrypt, decrypt } from "../crypto"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class AIWalletService {
  static async getOrCreateAIWallet(userWallet: string) {
    try {
      // Set current wallet address for RLS policies
      const { error: rlsError } = await supabase.rpc('set_current_wallet_address', {
        wallet_address: userWallet
      })

      if (rlsError) {
        console.error('Error setting RLS policy:', rlsError)
        throw new Error('Failed to set wallet permissions')
      }

      // Try to get existing wallet
      const { data: wallet, error: fetchError } = await supabase
        .from('ai_wallets')
        .select('*')
        .eq('wallet_address', userWallet)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching AI wallet:', fetchError)
        throw new Error('Failed to fetch AI wallet')
      }

      if (wallet) {
        return {
          walletAddress: wallet.ai_wallet_address,
          keypair: await this.getKeypair(wallet.encrypted_private_key)
        }
      }

      // If no wallet exists, create a new one
      return await this.createAIWallet(userWallet)
    } catch (error) {
      console.error('Error in getOrCreateAIWallet:', error)
      throw error
    }
  }

  static async getAIWallet(userWallet: string) {
    try {
      // Set current wallet address for RLS policies
      const { error: rlsError } = await supabase.rpc('set_current_wallet_address', {
        wallet_address: userWallet
      })

      if (rlsError) {
        console.error('Error setting RLS policy:', rlsError)
        throw new Error('Failed to set wallet permissions')
      }

      const { data: wallet, error } = await supabase
        .from('ai_wallets')
        .select('*')
        .eq('wallet_address', userWallet)
        .single()

      if (error) {
        console.error('Error fetching AI wallet:', error)
        throw new Error('Failed to fetch AI wallet')
      }

      if (!wallet) {
        throw new Error('AI wallet not found')
      }

      return {
        walletAddress: wallet.ai_wallet_address,
        keypair: await this.getKeypair(wallet.encrypted_private_key)
      }
    } catch (error) {
      console.error('Error in getAIWallet:', error)
      throw error
    }
  }

  private static async createAIWallet(userWallet: string) {
    try {
      // Set current wallet address for RLS policies
      const { error: rlsError } = await supabase.rpc('set_current_wallet_address', {
        wallet_address: userWallet
      })

      if (rlsError) {
        console.error('Error setting RLS policy:', rlsError)
        throw new Error('Failed to set wallet permissions')
      }

      // Fetch user by wallet_address to get user_id
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', userWallet)
        .single()

      if (userError || !user) {
        console.error('Error fetching user for AI wallet:', userError)
        throw new Error('Failed to fetch user for AI wallet')
      }

      const keypair = Keypair.generate()
      const privateKey = Buffer.from(keypair.secretKey).toString('base64')
      const encryptedPrivateKey = await encrypt(privateKey)

      const { data: wallet, error: insertError } = await supabase
        .from('ai_wallets')
        .insert({
          user_id: user.id, // Always provide user_id
          wallet_address: userWallet,
          ai_wallet_address: keypair.publicKey.toString(),
          encrypted_private_key: encryptedPrivateKey
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating AI wallet:', insertError)
        throw new Error('Failed to create AI wallet')
      }

      return {
        walletAddress: wallet.ai_wallet_address,
        keypair
      }
    } catch (error) {
      console.error('Error in createAIWallet:', error)
      throw error
    }
  }

  private static async getKeypair(encryptedPrivateKey: string): Promise<Keypair> {
    try {
      const privateKey = await decrypt(encryptedPrivateKey)
      const secretKey = Buffer.from(privateKey, 'base64')
      return Keypair.fromSecretKey(secretKey)
    } catch (error) {
      console.error('Error decrypting private key:', error)
      throw new Error('Failed to decrypt private key')
    }
  }
} 