"use client"

import { useState, useEffect } from "react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { AIWalletCreator } from "@/components/copytrading/ai-wallet-creator"
import { ActiveCopyTrades } from "@/components/copytrading/active-copy-trades"
import { CopyTradingStats } from "@/components/copytrading/copytrading-stats"

interface CopyTrade {
  id: string
  tokenAddress: string
  tokenSymbol: string
  userAmount: number
  aiAmount: number
  lockPeriod: number
  startDate: Date
  endDate: Date
  status: "active" | "completed" | "cancelled"
}

interface TokenMetadata {
  name: string
  symbol: string
  decimals: number
}

export default function CopyTradingPage() {
  const { user } = useWalletAuth()
  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenName, setTokenName] = useState("")
  const [isLoadingToken, setIsLoadingToken] = useState(false)
  const [userAmount, setUserAmount] = useState("")
  const [aiAmount, setAiAmount] = useState("0.5") // Default AI amount
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchTokenMetadata = async (address: string) => {
    if (!address) return
    
    setIsLoadingToken(true)
    try {
      // Try Jupiter API first
      const jupiterResponse = await fetch(`https://token.jup.ag/all`)
      const jupiterTokens = await jupiterResponse.json()
      const token = jupiterTokens.find((t: any) => t.address === address)
      
      if (token) {
        setTokenName(token.name)
        setTokenSymbol(token.symbol)
        return
      }

      // If not found in Jupiter, try Raydium
      const raydiumResponse = await fetch(`https://api.raydium.io/v2/sdk/token/raydium.mainnet.json`)
      const raydiumData = await raydiumResponse.json()
      const raydiumToken = raydiumData.official.find((t: any) => t.mint === address) || 
                          raydiumData.unOfficial.find((t: any) => t.mint === address)
      
      if (raydiumToken) {
        setTokenName(raydiumToken.name)
        setTokenSymbol(raydiumToken.symbol)
        return
      }

      // If not found in either, clear the fields
      setTokenName("")
      setTokenSymbol("")
      toast.error("Token not found in Jupiter or Raydium")
    } catch (error) {
      console.error("Error fetching token metadata:", error)
      toast.error("Failed to fetch token information")
      setTokenName("")
      setTokenSymbol("")
    }
    setIsLoadingToken(false)
  }

  // Debounce token address changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tokenAddress) {
        fetchTokenMetadata(tokenAddress)
      }
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [tokenAddress])

  const handleStartCopyTrade = async () => {
    if (!user?.wallet?.address) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!tokenAddress || !tokenSymbol || !userAmount) {
      toast.error("Please fill in all required fields")
      return
    }

    setShowConfirmation(true)
  }

  const handleConfirmCopyTrade = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/copy-trading/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputTokenAddress: "So11111111111111111111111111111111111111112", // SOL
          outputTokenAddress: tokenAddress,
          inputTokenSymbol: "SOL",
          outputTokenSymbol: tokenSymbol,
          inputAmount: parseFloat(userAmount),
          inputDecimals: 9,
          outputDecimals: 9,
          aiAmount: parseFloat(aiAmount),
          userWallet: user?.wallet?.address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start copy trade")
      }

      toast.success("Copy trade started successfully!")
      setShowConfirmation(false)
      
      // Reset form
      setTokenAddress("")
      setTokenSymbol("")
      setUserAmount("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start copy trade")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">AI Copy Trading</h1>
          <p className="text-muted-foreground">
            Create your AI trading partner and start copy trading with confidence
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-6">
          <AIWalletCreator />
        </div>

        <CopyTradingStats />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Start New Copy Trade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenAddress">Token Address</Label>
                <Input
                  id="tokenAddress"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="Enter token address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tokenSymbol">Token</Label>
                <Input
                  id="tokenSymbol"
                  value={tokenName ? `${tokenName} (${tokenSymbol})` : tokenSymbol}
                  placeholder={isLoadingToken ? "Loading..." : "e.g., Wrapped SOL (SOL)"}
                  disabled={isLoadingToken}
                />
                {isLoadingToken && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Fetching token information...
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userAmount">Your Amount (SOL)</Label>
                <Input
                  id="userAmount"
                  type="number"
                  value={userAmount}
                  onChange={(e) => setUserAmount(e.target.value)}
                  placeholder="Enter amount in SOL"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aiAmount">AI Copy Amount (SOL)</Label>
                <Input
                  id="aiAmount"
                  type="number"
                  value={aiAmount}
                  onChange={(e) => setAiAmount(e.target.value)}
                  placeholder="Enter AI copy amount"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleStartCopyTrade}
                disabled={!user?.wallet?.address}
              >
                Start Copy Trade
              </Button>
            </CardContent>
          </Card>

          <ActiveCopyTrades />
        </div>
      </div>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Copy Trade</DialogTitle>
            <DialogDescription>
              Please review your copy trade details before proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Trade Details</h4>
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Token:</span> {tokenSymbol}
                </p>
                <p className="text-sm font-mono">
                  <span className="text-muted-foreground">Address:</span> {tokenAddress}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Your Amount:</span> {userAmount} SOL
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">AI Copy Amount:</span> {aiAmount} SOL
                </p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                The AI will copy your trade with the specified amount. Make sure you have enough SOL in your wallet.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCopyTrade} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
