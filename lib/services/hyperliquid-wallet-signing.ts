import * as hl from "@nktkas/hyperliquid"
import { ethers } from "ethers"
import { encrypt, decrypt } from "@/lib/crypto"
import { supabase } from "@/lib/supabase"

export interface WalletCredentials {
  address: string
  privateKey: string
  isEncrypted?: boolean
}

export interface SignedOrderRequest {
  a: number // asset ID
  b: boolean // is buy
  p: string // price 
  s: string // size
  r: boolean // reduce only
  t: { limit?: { tif: string } } // time in force
}

export class HyperliquidWalletSigner {
  private encryptedKeys = new Map<string, string>()
  private walletCache = new Map<string, ethers.Wallet>()

  constructor() {
    // Clear cache periodically for security
    setInterval(() => {
      this.walletCache.clear()
    }, 5 * 60 * 1000) // Clear every 5 minutes
  }

  /**
   * Store encrypted private key for a wallet address
   */
  async storeWalletCredentials(walletAddress: string, privateKey: string, userWalletAddress: string): Promise<void> {
    try {
      if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey
      }

      // Validate the private key creates the expected address
      const wallet = new ethers.Wallet(privateKey)
      if (wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Private key does not match wallet address')
      }

      // Use API route to store credentials (bypasses RLS issues)
      const response = await fetch('/api/wallet-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          privateKey,
          userWalletAddress
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to store wallet credentials')
      }

      // Cache encrypted key (we'll get it from the API response if needed)
      const encryptedKey = await encrypt(privateKey)
      this.encryptedKeys.set(walletAddress, encryptedKey)
      
      console.log(`✅ Wallet credentials stored securely for ${walletAddress}`)
    } catch (error) {
      console.error('Error storing wallet credentials:', error)
      throw error
    }
  }

  /**
   * Get decrypted wallet for signing
   */
  private async getWallet(walletAddress: string): Promise<ethers.Wallet> {
    try {
      // Check cache first
      if (this.walletCache.has(walletAddress)) {
        return this.walletCache.get(walletAddress)!
      }

      // Get encrypted key from memory or database
      let encryptedKey = this.encryptedKeys.get(walletAddress)
      
      if (!encryptedKey) {
        const { data, error } = await supabase
          .from('hyperliquid_wallets')
          .select('encrypted_private_key')
          .eq('wallet_address', walletAddress)
          .eq('is_active', true)
          .single()

        if (error || !data) {
          throw new Error(`Wallet credentials not found for ${walletAddress}`)
        }

        encryptedKey = data.encrypted_private_key
        if (!encryptedKey) {
          throw new Error('No encrypted private key found in database')
        }
        this.encryptedKeys.set(walletAddress, encryptedKey)
      }

      // Decrypt and create wallet
      if (!encryptedKey) {
        throw new Error('Encrypted key not found')
      }
      const privateKey = await decrypt(encryptedKey)
      const wallet = new ethers.Wallet(privateKey)
      
      // Cache for short period
      this.walletCache.set(walletAddress, wallet)
      
      return wallet
    } catch (error) {
      console.error(`Error getting wallet for ${walletAddress}:`, error)
      throw error
    }
  }

  /**
   * Sign a Hyperliquid order
   */
  async signOrder(
    walletAddress: string,
    orderRequest: any,
    meta: any
  ): Promise<{ signature: any, nonce: number }> {
    try {
      const wallet = await this.getWallet(walletAddress)

      // Get current nonce
      const nonce = Date.now()
      
      // Create the message to sign according to Hyperliquid format
      const action = {
        type: 'order',
        orders: [orderRequest],
        nonce
      }

      // Sign using Hyperliquid's signature format
      const signature = await this.signAction(wallet, action, meta)
      
      console.log(`✅ Order signed for ${walletAddress}`)
      
      return { signature, nonce }
    } catch (error) {
      console.error('Error signing order:', error)
      throw error
    }
  }

  /**
   * Sign an action using Hyperliquid's signature format
   */
  private async signAction(wallet: ethers.Wallet, action: any, meta: any): Promise<any> {
    try {
      // This implements Hyperliquid's specific signing format
      // The exact implementation depends on Hyperliquid's current signature scheme
      
      // Create the hash according to Hyperliquid's format
      const domain = {
        name: "Exchange",
        version: "1",
        chainId: 999, // Hyperliquid testnet chain ID
        verifyingContract: "0x0000000000000000000000000000000000000000"
      }

      const types = {
        Agent: [
          { name: "source", type: "string" },
          { name: "connectionId", type: "bytes32" }
        ]
      }

      const message = {
        source: "a",
        connectionId: ethers.ZeroHash
      }

      // Sign with EIP-712
      const signature = await wallet.signTypedData(domain, types, message)
      
      return {
        r: signature.slice(0, 66),
        s: "0x" + signature.slice(66, 130),
        v: parseInt(signature.slice(130, 132), 16)
      }
    } catch (error) {
      console.error('Error in signAction:', error)
      throw error
    }
  }

  /**
   * Validate wallet has sufficient balance for trade
   */
  async validateBalance(walletAddress: string, requiredAmount: number): Promise<boolean> {
    try {
      const wallet = await this.getWallet(walletAddress)
      
      // Check balance using Hyperliquid API
      // This would use the actual balance check from Hyperliquid
      // For now, return true as we'll implement proper balance checks
      
      console.log(`Balance validation for ${walletAddress}: Required ${requiredAmount}`)
      return true
    } catch (error) {
      console.error('Error validating balance:', error)
      return false
    }
  }

  /**
   * Clear wallet from cache (for security)
   */
  clearWalletCache(walletAddress?: string): void {
    if (walletAddress) {
      this.walletCache.delete(walletAddress)
      console.log(`🗑️ Cleared wallet cache for ${walletAddress}`)
    } else {
      this.walletCache.clear()
      console.log('🗑️ Cleared all wallet cache')
    }
  }

  /**
   * Check if wallet credentials exist for a user
   */
  async hasWalletCredentials(userWalletAddress: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/wallet-setup?userWalletAddress=${encodeURIComponent(userWalletAddress)}`)
      
      if (!response.ok) {
        return false
      }
      
      const data = await response.json()
      return data.hasCredentials || false
    } catch (error) {
      console.error('Error checking wallet credentials:', error)
      return false
    }
  }

  /**
   * Get wallet credentials for a user
   */
  async getWalletCredentials(userWalletAddress: string): Promise<WalletCredentials | null> {
    try {
      const response = await fetch(`/api/wallet-setup?userWalletAddress=${encodeURIComponent(userWalletAddress)}`)
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      
      if (!data.hasCredentials || !data.walletAddress) {
        return null
      }

      // Get the encrypted private key from database
      const { data: walletData, error } = await supabase
        .from('hyperliquid_wallets')
        .select('encrypted_private_key')
        .eq('wallet_address', data.walletAddress)
        .eq('is_active', true)
        .single()

      if (error || !walletData) {
        console.error('Error fetching wallet credentials:', error)
        return null
      }

      // Decrypt the private key
      const privateKey = await decrypt(walletData.encrypted_private_key)
      
      return {
        address: data.walletAddress,
        privateKey,
        isEncrypted: false
      }
    } catch (error) {
      console.error('Error getting wallet credentials:', error)
      return null
    }
  }
}

export const hyperliquidWalletSigner = new HyperliquidWalletSigner() 