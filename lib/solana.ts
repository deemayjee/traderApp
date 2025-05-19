import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"

// Initialize connection to Solana network
const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com")

export async function getWalletBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    return balance / LAMPORTS_PER_SOL // Convert lamports to SOL
  } catch (error) {
    console.error("Error getting wallet balance:", error)
    throw new Error("Failed to get wallet balance")
  }
} 