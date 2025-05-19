"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { Loader2 } from "lucide-react"
import { VersionedTransaction } from "@solana/web3.js"
import { Connection } from "@solana/web3.js"
import { useWalletTokens } from "@/hooks/use-wallet-tokens"

interface TokenBalance {
  mint: string
  amount: number
  decimals: number
  symbol: string
}

export function SellToken({ tokenBalance, hideTitle = false, hideDescription = false }: { tokenBalance: TokenBalance, hideTitle?: boolean, hideDescription?: boolean }) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useWalletAuth()
  const { assets, refetch } = useWalletTokens()

  const handleSell = async () => {
    try {
      console.log("Starting sell process...")
      if (!user?.wallet?.address) {
        toast({
          title: "Error",
          description: "Please connect your wallet first",
          variant: "destructive"
        })
        return
      }

      const sellAmount = parseFloat(amount)
      console.log("Sell amount:", sellAmount)
      const tokenBalanceAmount = tokenBalance.amount / Math.pow(10, 6)
      console.log("Token balance:", tokenBalanceAmount)

      if (isNaN(sellAmount) || sellAmount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive"
        })
        return
      }

      const maxAmount = tokenBalance.amount / Math.pow(10, 6)
      console.log("Maximum amount available:", maxAmount)

      if (sellAmount > maxAmount) {
        toast({
          title: "Insufficient Balance",
          description: `You can only sell up to ${maxAmount.toFixed(4)} ${tokenBalance.symbol}. Please enter a smaller amount.`,
          variant: "destructive"
        })
        return
      }

      setIsLoading(true)
      console.log("Getting swap transaction...")

      // First, get the swap transaction
      const response = await fetch("/api/copy-trading/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputTokenAddress: tokenBalance.mint,
          outputTokenAddress: "So11111111111111111111111111111111111111112", // SOL
          inputTokenSymbol: tokenBalance.symbol,
          outputTokenSymbol: "SOL",
          inputAmount: sellAmount,
          inputDecimals: tokenBalance.decimals,
          outputDecimals: 9,
          aiAmount: 0, // No AI trade for selling
          userWallet: user.wallet.address
        })
      })

      console.log("Got response from /api/copy-trading/start")
      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to sell token")
      }

      if (!data.transaction) {
        throw new Error("No transaction data received")
      }

      // Show processing toast
      toast({
        title: "Processing",
        description: "Please approve the transaction in your wallet...",
      })

      // Get the wallet adapter from window
      const { solana } = window as any
      if (!solana?.isPhantom) {
        throw new Error("Phantom wallet not found")
      }

      console.log("Signing transaction...")
      // Deserialize and sign the transaction
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(data.transaction, 'base64')
      )
      console.log("Transaction deserialized")
      
      const signedTransaction = await solana.signTransaction(transaction)
      console.log("Transaction signed")
      
      console.log("Sending transaction...")
      // Send the signed transaction
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
        { commitment: 'confirmed' }
      )
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      console.log("Transaction sent, signature:", signature)
      
      toast({
        title: "Processing",
        description: "Transaction is being processed. This may take a few minutes...",
      })

      console.log("Waiting for confirmation...")
      // Wait for transaction confirmation with timeout
      const confirmation = await Promise.race([
        connection.confirmTransaction(signature, 'confirmed'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timeout')), 30000)
        )
      ]) as { value: { err: any } }

      if (confirmation.value.err) {
        throw new Error("Transaction failed")
      }
      console.log("Transaction confirmed")

      console.log("Sending confirmation request...")
      // Now that we know the transaction is confirmed, proceed with the confirmation request
      const confirmationResponse = await fetch("/api/copy-trading/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userWallet: user.wallet.address,
          signature,
          inputTokenAddress: tokenBalance.mint,
          outputTokenAddress: "So11111111111111111111111111111111111111112",
          inputTokenSymbol: tokenBalance.symbol,
          outputTokenSymbol: "SOL",
          inputAmount: sellAmount,
          inputDecimals: tokenBalance.decimals,
          outputDecimals: 9,
          aiAmount: 0
        })
      })

      console.log("Got confirmation response")
      const confirmationData = await confirmationResponse.json()
      console.log("Confirmation data:", confirmationData)

      if (!confirmationResponse.ok) {
        throw new Error(confirmationData.error || "Failed to confirm transaction")
      }

      console.log("Sale completed successfully")
      toast({
        title: "🎉 Trade Successful!",
        description: `Successfully sold ${sellAmount} ${tokenBalance.symbol} for SOL`,
        duration: 5000, // Show for 5 seconds
        className: "bg-green-50 border-green-200",
      })
      
      // Reset form and refresh balances
      setAmount("")
      setIsLoading(false) // Explicitly set loading to false before refetch
      await refetch()
      
      // Force a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error("Error in handleSell:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sell token",
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        {!hideTitle && <CardTitle>Sell {tokenBalance.symbol}</CardTitle>}
        {!hideDescription && <CardDescription>
          Sell your {tokenBalance.symbol} tokens for SOL
        </CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount to Sell</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={isLoading}
              />
              <span className="text-sm text-muted-foreground">{tokenBalance.symbol}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((tokenBalance.amount / Math.pow(10, 6) * 0.25).toFixed(4))}
                disabled={isLoading}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((tokenBalance.amount / Math.pow(10, 6) * 0.5).toFixed(4))}
                disabled={isLoading}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((tokenBalance.amount / Math.pow(10, 6) * 0.75).toFixed(4))}
                disabled={isLoading}
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((tokenBalance.amount / Math.pow(10, 6)).toFixed(4))}
                disabled={isLoading}
              >
                100%
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Available: {(tokenBalance.amount / Math.pow(10, 6)).toLocaleString(undefined, { maximumFractionDigits: 4 })} {tokenBalance.symbol}
            </p>
          </div>
          <Button
            onClick={handleSell}
            disabled={isLoading || !amount || !user?.wallet?.address}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Selling...
              </>
            ) : !user?.wallet?.address ? (
              "Connect Wallet First"
            ) : (
              "Sell Token"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 