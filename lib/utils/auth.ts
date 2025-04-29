import { PublicKey } from "@solana/web3.js"
import { verify } from "@noble/ed25519"
import { decode } from "bs58"

export async function verifySignature(request: Request) {
  const publicKey = request.headers.get("x-public-key")
  const signature = request.headers.get("x-signature")
  const message = request.headers.get("x-message")

  if (!publicKey || !signature || !message) {
    return { publicKey: null, signature: null }
  }

  try {
    const pubKey = new PublicKey(publicKey)
    const sigBytes = decode(signature)
    const msgBytes = new TextEncoder().encode(message)

    const isValid = await verify(sigBytes, msgBytes, pubKey.toBytes())
    if (!isValid) {
      return { publicKey: null, signature: null }
    }

    return { publicKey: publicKey, signature }
  } catch (error) {
    console.error("Error verifying signature:", error)
    return { publicKey: null, signature: null }
  }
} 