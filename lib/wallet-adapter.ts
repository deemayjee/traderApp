import { PublicKey } from "@solana/web3.js"
import nacl from "tweetnacl"

export class WalletAdapter {
  static async verifySignature(
    walletAddress: string,
    signature: string
  ): Promise<boolean> {
    try {
      const publicKey = new PublicKey(walletAddress)
      const message = "Sign this message to verify your wallet ownership"
      const signatureBytes = Buffer.from(signature, "base64")
      const messageBytes = Buffer.from(message)

      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      )
    } catch (error) {
      console.error("Error verifying signature:", error)
      return false
    }
  }
} 