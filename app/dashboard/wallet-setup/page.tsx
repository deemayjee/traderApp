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
                <span className="font-medium text-green-800">Trading Enabled</span>
              </div>
              <p className="text-sm text-green-700">
                Your wallet credentials are stored securely and encrypted. You can now:
              </p>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li>• Create AI trading agents</li>
                <li>• Enable automated trading</li>
                <li>• Monitor live positions</li>
                <li>• Track performance metrics</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50">
              <h4 className="font-medium text-blue-800 mb-2">💡 Next Steps:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. <strong>Start with Paper Trading</strong> - Test without real money</li>
                <li>2. <strong>Create Your First Agent</strong> - Set up an AI trading bot</li>
                <li>3. <strong>Monitor Performance</strong> - Watch your agent's decisions</li>
                <li>4. <strong>Gradually Go Live</strong> - Enable real trading when ready</li>
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
        <h1 className="text-3xl font-bold mb-2">Enable Real Money Trading</h1>
        <p className="text-muted-foreground">
          Add your Hyperliquid wallet to start automated trading with real funds
        </p>
        
        <div className="flex justify-center gap-2 mt-4">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Paper Trading Mode Active
          </Badge>
          <Badge variant="outline">
            Testnet Environment
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