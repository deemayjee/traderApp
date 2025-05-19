import { NextResponse } from "next/server"
import { getWalletBalance } from "@/lib/solana"

export async function POST(request: Request) {
  try {
    const authToken = request.headers.get("Authorization")?.split(" ")[1]
    if (!authToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get the wallet address from the request body
    const { walletAddress } = await request.json()
    if (!walletAddress) {
      return NextResponse.json(
        { error: "No wallet address provided" },
        { status: 400 }
      )
    }

    const balance = await getWalletBalance(walletAddress)

    // Check if balance is at least 0.02 SOL
    if (balance < 0.02) {
      return NextResponse.json(
        { error: "Insufficient balance. Your wallet needs at least 0.02 SOL to start copy trading." },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error verifying wallet balance:", error)
    return NextResponse.json(
      { error: "Failed to verify wallet balance" },
      { status: 500 }
    )
  }
} 