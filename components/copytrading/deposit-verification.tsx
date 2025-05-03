"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"
import { usePrivy } from "@privy-io/react-auth"

interface DepositVerificationProps {
  onDepositVerified: () => void
  onWalletAdded: (walletAddress: string, walletName: string) => void
}

export function DepositVerification({ onDepositVerified, onWalletAdded }: DepositVerificationProps) {
  const [isDeposited, setIsDeposited] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [walletName, setWalletName] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const { user, authenticated, getAccessToken } = usePrivy()

  const handleVerifyDeposit = async () => {
    if (!authenticated || !user?.wallet?.address) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsVerifying(true)
    try {
      const token = await getAccessToken()
      const response = await fetch("/api/copy-trading/verify-deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          walletAddress: user.wallet.address
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to verify wallet balance")
      }

      setIsDeposited(true)
      onDepositVerified()
      toast.success("Wallet balance verified successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify wallet balance")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleAddWallet = () => {
    if (!walletAddress || !walletName) {
      toast.error("Please fill in all fields")
      return
    }
    onWalletAdded(walletAddress, walletName)
    toast.success("Trader added successfully!")
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Start Copy Trading</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isDeposited ? (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Step 1: Verify Wallet Balance</h3>
              <p className="text-sm text-muted-foreground">
                To start copy trading, your wallet needs to have at least 0.02 SOL.
              </p>
              <div className="mt-4">
                <p className="text-sm font-medium">Your Wallet Address:</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={user?.wallet?.address || "Connect your wallet"}
                    readOnly
                    className="font-mono"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (user?.wallet?.address) {
                        navigator.clipboard.writeText(user.wallet.address)
                        toast.success("Wallet address copied to clipboard")
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleVerifyDeposit}
              disabled={isVerifying || !authenticated || !user?.wallet?.address}
            >
              {isVerifying ? "Verifying..." : "Verify Wallet Balance"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Step 2: Add Trader Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Enter the wallet address of the trader you want to copy and give it a custom name.
              </p>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Trader Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter wallet address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walletName">Custom Name</Label>
                  <Input
                    id="walletName"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    placeholder="e.g., Top Trader #1"
                  />
                </div>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleAddWallet}
              disabled={!walletAddress || !walletName}
            >
              Add Trader
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 