import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encrypt, decrypt } from '@/lib/crypto'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userWalletAddress = searchParams.get('userWalletAddress')

    if (!userWalletAddress) {
      return NextResponse.json(
        { error: 'Missing userWalletAddress parameter' },
        { status: 400 }
      )
    }

    console.log('🔍 Checking for existing wallet for user:', userWalletAddress)

    // Check if user has existing wallet credentials
    const { data, error } = await supabaseAdmin
      .from('hyperliquid_wallets')
      .select('wallet_address, balance_usd, created_at')
      .eq('user_wallet_address', userWalletAddress)
      .eq('is_active', true)
      .single()

    const hasCredentials = !error && !!data

    console.log('📊 Database query result:', { data, error, hasCredentials })

    return NextResponse.json({
      hasCredentials,
      walletAddress: data?.wallet_address || null,
      balance: data?.balance_usd || 0,
      createdAt: data?.created_at || null
    })

  } catch (error) {
    console.error('Error checking wallet credentials:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userWalletAddress } = await request.json()

    // Validate input
    if (!userWalletAddress) {
      return NextResponse.json(
        { error: 'Missing userWalletAddress' },
        { status: 400 }
      )
    }

    // Check if user already has a wallet
    const { data: existingWallet } = await supabaseAdmin
      .from('hyperliquid_wallets')
      .select('wallet_address')
      .eq('user_wallet_address', userWalletAddress)
      .eq('is_active', true)
      .single()

    if (existingWallet) {
      return NextResponse.json({
        success: true,
        message: 'Wallet already exists',
        walletAddress: existingWallet.wallet_address,
        isNew: false
      })
    }

    // Generate a new EVM wallet
    const wallet = ethers.Wallet.createRandom()
    const privateKey = wallet.privateKey
    const walletAddress = wallet.address

    // Encrypt the private key
    const encryptedKey = await encrypt(privateKey)

    // Store in database using service role (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('hyperliquid_wallets')
      .insert({
        wallet_address: walletAddress,
        user_wallet_address: userWalletAddress,
        encrypted_private_key: encryptedKey,
        is_active: true,
        is_testnet: process.env.HYPERLIQUID_TESTNET === 'true',
        balance_usd: 0,
        created_at: new Date().toISOString(),
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
      message: 'EVM wallet created successfully',
      walletAddress,
      privateKey, // Only return this once for user to save
      isNew: true
    })

  } catch (error) {
    console.error('Wallet creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userWalletAddress = searchParams.get('userWalletAddress')

    if (!userWalletAddress) {
      return NextResponse.json(
        { error: 'Missing userWalletAddress parameter' },
        { status: 400 }
      )
    }

    console.log('🗑️ Deleting existing wallet for user:', userWalletAddress)

    // Delete existing wallet
    const { error } = await supabaseAdmin
      .from('hyperliquid_wallets')
      .delete()
      .eq('user_wallet_address', userWalletAddress)

    if (error) {
      console.error('Error deleting wallet:', error)
      return NextResponse.json(
        { error: `Failed to delete wallet: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Wallet deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Wallet deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting wallet:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userWalletAddress } = await request.json()

    if (!userWalletAddress) {
      return NextResponse.json(
        { error: 'Missing userWalletAddress parameter' },
        { status: 400 }
      )
    }

    console.log('🔑 Exporting private key for user:', userWalletAddress)

    // Get the encrypted private key
    const { data, error } = await supabaseAdmin
      .from('hyperliquid_wallets')
      .select('encrypted_private_key, wallet_address')
      .eq('user_wallet_address', userWalletAddress)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Decrypt the private key
    const privateKey = await decrypt(data.encrypted_private_key)

    return NextResponse.json({
      success: true,
      walletAddress: data.wallet_address,
      privateKey
    })

  } catch (error) {
    console.error('Error exporting private key:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 