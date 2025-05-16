"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { getTokenMetadata } from "@/lib/api/token-data"

export function CopyTradeSettings() {
  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenName, setTokenName] = useState("")
  const [userAmount, setUserAmount] = useState("")
  const [aiAmount, setAiAmount] = useState("")
  const [isLoadingToken, setIsLoadingToken] = useState(false)
  const { toast } = useToast()
  const { user } = useWalletAuth()

  const handleTokenAddressChange = async (address: string) => {
    setTokenAddress(address)
    if (address) {
      setIsLoadingToken(true)
      try {
        const metadata = await getTokenMetadata(address)
        setTokenSymbol(metadata.symbol)
        setTokenName(metadata.name)
      } catch (error) {
        console.error("Error fetching token metadata:", error)
        setTokenSymbol("")
        setTokenName("")
      } finally {
        setIsLoadingToken(false)
      }
    }
  }

  const handleStartCopyTrade = async () => {
    try {
      if (!user?.wallet?.address) {
        toast({
          title: "Error",
          description: "Please connect your wallet first",
          variant: "destructive"
        })
        return
      }

      const response = await fetch("/api/copy-trading/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
          userWallet: user.wallet.address
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start copy trade")
      }

      toast({
        title: "Success",
        description: "Copy trade started successfully"
      })

      // Reset form
      setTokenAddress("")
      setTokenSymbol("")
      setTokenName("")
      setUserAmount("")
      setAiAmount("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start copy trade",
        variant: "destructive"
      })
    }
  }

  return (
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
            onChange={(e) => handleTokenAddressChange(e.target.value)}
            placeholder="Enter token address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tokenSymbol">Token</Label>
          <Input
            id="tokenSymbol"
            value={tokenName ? `${tokenName} (${tokenSymbol})` : tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            placeholder={isLoadingToken ? "Loading..." : "e.g., Wrapped SOL (SOL)"}
            disabled={isLoadingToken}
          />
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
  )
} 