"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, AlertTriangle, CheckCircle, Eye, EyeOff, ExternalLink } from "lucide-react"
import { useWalletAuth } from "./wallet-context"
import { hyperliquidWalletSigner } from "@/lib/services/hyperliquid-wallet-signing"
import { useToast } from "@/hooks/use-toast"

interface HyperliquidWalletSetupProps {
  onSetupComplete?: () => void
  onCancel?: () => void
}

export function HyperliquidWalletSetup({ onSetupComplete, onCancel }: HyperliquidWalletSetupProps) {
  const { user } = useWalletAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [formData, setFormData] = useState({
    privateKey: '',
    walletAddress: '',
    confirmAddress: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasExistingWallet, setHasExistingWallet] = useState<boolean | null>(null)

  // Check if user already has Hyperliquid wallet setup
  useEffect(() => {
    const checkExistingWallet = async () => {
      if (user?.address) {
        try {
          const exists = await hyperliquidWalletSigner.hasWalletCredentials(user.address)
          setHasExistingWallet(exists)
        } catch (error) {
          console.error('Error checking existing wallet:', error)
        }
      }
    }
    checkExistingWallet()
  }, [user?.address])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate private key format
    if (!formData.privateKey) {
      newErrors.privateKey = 'Private key is required'
    } else if (!formData.privateKey.startsWith('0x') || formData.privateKey.length !== 66) {
      newErrors.privateKey = 'Private key must be a valid 64-character hex string starting with 0x'
    }

    // Validate wallet address format
    if (!formData.walletAddress) {
      newErrors.walletAddress = 'Wallet address is required'
    } else if (!formData.walletAddress.startsWith('0x') || formData.walletAddress.length !== 42) {
      newErrors.walletAddress = 'Wallet address must be a valid Ethereum address starting with 0x'
    }

    // Validate address confirmation
    if (formData.walletAddress !== formData.confirmAddress) {
      newErrors.confirmAddress = 'Wallet addresses do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user?.address) {
      return
    }

    setIsLoading(true)

    try {
      // Store the encrypted credentials
      await hyperliquidWalletSigner.storeWalletCredentials(
        formData.walletAddress,
        formData.privateKey,
        user.address
      )

      toast({
        title: "Wallet Setup Complete!",
        description: "Your Hyperliquid trading credentials have been stored securely.",
        variant: "default"
      })

      // Clear form data for security
      setFormData({
        privateKey: '',
        walletAddress: '',
        confirmAddress: ''
      })

      onSetupComplete?.()
      
    } catch (error) {
      console.error('Error storing wallet credentials:', error)
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to store wallet credentials",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (hasExistingWallet === true) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle>Hyperliquid Wallet Connected</CardTitle>
          </div>
          <CardDescription>
            You already have a Hyperliquid trading wallet configured for this account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Trading Enabled</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Ready for Live Trading
            </Badge>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onCancel} variant="outline" className="w-full">
            Close
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Hyperliquid Wallet Setup
        </CardTitle>
        <CardDescription>
          Add your Hyperliquid trading credentials to enable real money trading.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">Wallet Setup</TabsTrigger>
            <TabsTrigger value="guide">Setup Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Notice:</strong> Your private key will be encrypted and stored securely. 
                Never share your private key with anyone. Only add keys from wallets you control.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="walletAddress">Hyperliquid Wallet Address</Label>
                <Input
                  id="walletAddress"
                  type="text"
                  placeholder="0x1234567890abcdef..."
                  value={formData.walletAddress}
                  onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                  className={errors.walletAddress ? "border-red-500" : ""}
                />
                {errors.walletAddress && (
                  <p className="text-sm text-red-500">{errors.walletAddress}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmAddress">Confirm Wallet Address</Label>
                <Input
                  id="confirmAddress"
                  type="text"
                  placeholder="0x1234567890abcdef..."
                  value={formData.confirmAddress}
                  onChange={(e) => setFormData({ ...formData, confirmAddress: e.target.value })}
                  className={errors.confirmAddress ? "border-red-500" : ""}
                />
                {errors.confirmAddress && (
                  <p className="text-sm text-red-500">{errors.confirmAddress}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key</Label>
                <div className="relative">
                  <Input
                    id="privateKey"
                    type={showPrivateKey ? "text" : "password"}
                    placeholder="0x1234567890abcdef..."
                    value={formData.privateKey}
                    onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                    className={errors.privateKey ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.privateKey && (
                  <p className="text-sm text-red-500">{errors.privateKey}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Setting Up..." : "Add Wallet"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Step 1: Get Your Hyperliquid Wallet</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  You need a Hyperliquid wallet with an EVM-compatible private key.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://app.hyperliquid.xyz" target="_blank" rel="noopener noreferrer">
                    Open Hyperliquid <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Step 2: Export Private Key</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Connect your wallet to Hyperliquid</li>
                  <li>• Export the private key from MetaMask, Trust Wallet, etc.</li>
                  <li>• Ensure it's in EVM format (starts with 0x)</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Step 3: Fund Your Wallet</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Deposit USDC to your Hyperliquid wallet</li>
                  <li>• Start with small amounts for testing</li>
                  <li>• Verify deposits before trading</li>
                </ul>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Tips:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Use a dedicated wallet for trading</li>
                    <li>• Keep private keys secure and never share them</li>
                    <li>• Start with testnet for practice</li>
                    <li>• Monitor your positions regularly</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 