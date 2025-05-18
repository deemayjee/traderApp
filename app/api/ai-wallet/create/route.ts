import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Keypair } from "@solana/web3.js"
import { encrypt } from "@/lib/crypto"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { userWallet } = await req.json()

    if (!userWallet) {
      return NextResponse.json(
        { error: "User wallet address is required" },
        { status: 400 }
      )
    }

    // Set current wallet address for RLS policies
    const { error: rlsError } = await supabase.rpc('set_current_wallet_address', {
      wallet_address: userWallet
    })

    if (rlsError) {
      console.error('Error setting RLS policy:', rlsError)
      return NextResponse.json(
        { error: "Failed to set wallet permissions" },
        { status: 500 }
      )
    }

    // Check if wallet already exists
    const { data: existingWallet, error: fetchError } = await supabase
      .from('ai_wallets')
      .select('*')
      .eq('wallet_address', userWallet)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing wallet:', fetchError)
      return NextResponse.json(
        { error: "Failed to check existing wallet" },
        { status: 500 }
      )
    }

    if (existingWallet) {
      return NextResponse.json(
        { error: "AI wallet already exists" },
        { status: 400 }
      )
    }

    // Fetch user by wallet_address to get user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', userWallet)
      .single()

    if (userError || !user) {
      console.error('Error fetching user for AI wallet:', userError)
      return NextResponse.json(
        { error: "Failed to fetch user for AI wallet" },
        { status: 500 }
      )
    }

    // Generate new keypair
    const keypair = Keypair.generate()
    const privateKey = Buffer.from(keypair.secretKey).toString('base64')

    // Encrypt private key
    const encryptedPrivateKey = await encrypt(privateKey)

    // Store wallet in database
    const { data: wallet, error: insertError } = await supabase
      .from('ai_wallets')
      .insert({
        user_id: user.id,
        wallet_address: userWallet,
        ai_wallet_address: keypair.publicKey.toString(),
        public_key: keypair.publicKey.toString(),
        encrypted_private_key: encryptedPrivateKey
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing AI wallet:', insertError)
      return NextResponse.json(
        { error: "Failed to store AI wallet" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      wallet: {
        address: wallet.ai_wallet_address,
        privateKey: privateKey // Only return private key once during creation
      }
    })
  } catch (error) {
    console.error('Error creating AI wallet:', error)
    return NextResponse.json(
      { error: "Failed to create AI wallet" },
      { status: 500 }
    )
  }
} 