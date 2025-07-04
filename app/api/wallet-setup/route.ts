import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/crypto'
import { ethers } from 'ethers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create service role client for bypassing RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, privateKey, userWalletAddress } = await request.json()

    // Validate input
    if (!walletAddress || !privateKey || !userWalletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate private key format
    let formattedPrivateKey = privateKey
    if (!formattedPrivateKey.startsWith('0x')) {
      formattedPrivateKey = '0x' + formattedPrivateKey
    }

    // Validate the private key creates the expected address
    const wallet = new ethers.Wallet(formattedPrivateKey)
    if (wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Private key does not match wallet address' },
        { status: 400 }
      )
    }

    // Encrypt the private key
    const encryptedKey = await encrypt(formattedPrivateKey)

    // Store in database using service role (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('hyperliquid_wallets')
      .upsert({
        wallet_address: walletAddress,
        user_wallet_address: userWalletAddress,
        encrypted_private_key: encryptedKey,
        is_active: true,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to store wallet credentials: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet credentials stored successfully'
    })

  } catch (error) {
    console.error('Wallet setup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 