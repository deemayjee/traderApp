import { NextResponse } from "next/server"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      )
    }

    // Initialize Solana connection
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com")

    // Get wallet balance
    const publicKey = new PublicKey(address)
    const balance = await connection.getBalance(publicKey)
    
    // Convert lamports to SOL
    const balanceInSol = balance / LAMPORTS_PER_SOL

    return NextResponse.json({
      balance: balanceInSol,
      address
    })
  } catch (error) {
    console.error("Error fetching wallet balance:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch wallet balance" },
      { status: 500 }
    )
  }
} 