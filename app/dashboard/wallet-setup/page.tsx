"use client"

import { useState } from "react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { HyperliquidWalletSetup } from "@/components/auth/hyperliquid-wallet-setup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function WalletSetupPage() {
  const { user } = useWalletAuth()
  const router = useRouter()
  const [setupComplete, setSetupComplete] = useState(false)

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p>Please connect your wallet to continue.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (setupComplete) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <CardTitle>Setup Complete!</CardTitle>
            </div>
            <CardDescription>
              Your Hyperliquid wallet is now connected and ready for trading.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Wallet Created Successfully</span>
              </div>
              <p className="text-sm text-green-700">
                Your new EVM wallet has been created and stored securely. You can now:
              </p>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li>• Create AI trading agents</li>
                <li>• Start paper trading immediately</li>
                <li>• Fund your wallet for real trading</li>
                <li>• Monitor live positions and performance</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50">
              <h4 className="font-medium text-blue-800 mb-2">💡 Next Steps:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. <strong>Start Paper Trading</strong> - Test your strategies risk-free</li>
                <li>2. <strong>Create AI Agents</strong> - Set up automated trading bots</li>
                <li>3. <strong>Fund Your Wallet</strong> - Add USDC for real trading</li>
                <li>4. <strong>Go Live</strong> - Enable real money trading when ready</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link href="/ai-agents">Create AI Agent</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Create Trading Wallet</h1>
        <p className="text-muted-foreground">
          We'll create a secure EVM wallet for you to trade on Hyperliquid
        </p>
        
        <div className="flex justify-center gap-2 mt-4">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Auto-Generated Wallet
          </Badge>
          <Badge variant="outline">
            Secure & Encrypted
          </Badge>
        </div>
      </div>

      <HyperliquidWalletSetup 
        onSetupComplete={() => setSetupComplete(true)}
        onCancel={() => router.push('/dashboard')}
      />
    </div>
  )
} 