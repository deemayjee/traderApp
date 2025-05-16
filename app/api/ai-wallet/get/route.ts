import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userWallet = searchParams.get("userWallet")

  if (!userWallet) {
    return NextResponse.json({ error: "userWallet is required" }, { status: 400 })
  }

  // Find the user by wallet address
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", userWallet)
    .single()

  if (userError || !user) {
    return NextResponse.json({ wallet: null })
  }

  // Find the AI wallet for the user (lookup by wallet_address, return ai_wallet_address and balance)
  const { data: aiWallet, error: aiWalletError } = await supabase
    .from("ai_wallets")
    .select("ai_wallet_address, balance")
    .eq("wallet_address", userWallet)
    .single()

  if (aiWalletError || !aiWallet) {
    return NextResponse.json({ wallet: null })
  }

  return NextResponse.json({
    wallet: {
      address: aiWallet.ai_wallet_address,
      balance: aiWallet.balance
    }
  })
} 