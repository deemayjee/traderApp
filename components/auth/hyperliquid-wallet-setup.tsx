"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  AlertTriangle, 
  Wallet2, 
  Copy, 
  Download, 
  CheckCircle,
  ExternalLink,
  Zap,
  Eye,
  EyeOff
} from "lucide-react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { hyperliquidWalletSigner } from "@/lib/services/hyperliquid-wallet-signing"

interface HyperliquidWalletSetupProps {
  onSetupComplete?: () => void
  onCancel?: () => void
}

export function HyperliquidWalletSetup({ onSetupComplete, onCancel }: HyperliquidWalletSetupProps) {
  const { user } = useWalletAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [hasExistingWallet, setHasExistingWallet] = useState<boolean | null>(null)
  const [walletInfo, setWalletInfo] = useState<{
    walletAddress: string | null
    balance: number
    createdAt: string | null
  } | null>(null)
  const [newWalletData, setNewWalletData] = useState<{
    walletAddress: string
    privateKey: string
  } | null>(null)
  const [hasSavedPrivateKey, setHasSavedPrivateKey] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Check if user already has Hyperliquid wallet setup
  useEffect(() => {
    const checkExistingWallet = async () => {
      if (user?.address) {
        try {
          const response = await fetch(`/api/wallet-setup?userWalletAddress=${encodeURIComponent(user.address)}`)
          if (response.ok) {
            const data = await response.json()
            setHasExistingWallet(data.hasCredentials)
            setWalletInfo({
              walletAddress: data.walletAddress,
              balance: data.balance,
              createdAt: data.createdAt
            })
          }
        } catch (error) {
          console.error('Error checking existing wallet:', error)
        }
      }
    }
    checkExistingWallet()
  }, [user?.address])

  const handleCreateWallet = async () => {
    if (!user?.address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/wallet-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWalletAddress: user.address
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create wallet')
      }

      const data = await response.json()
      
      if (data.isNew) {
        setNewWalletData({
          walletAddress: data.walletAddress,
          privateKey: data.privateKey
        })
        setHasExistingWallet(true)
        setWalletInfo({
          walletAddress: data.walletAddress,
          balance: 0,
          createdAt: new Date().toISOString()
        })
        
        toast({
          title: "Wallet Created!",
          description: "Your new EVM wallet has been created. Please save your private key securely.",
          variant: "default"
        })
      } else {
        setHasExistingWallet(true)
        setWalletInfo({
          walletAddress: data.walletAddress,
          balance: 0,
          createdAt: null
        })
        
        toast({
          title: "Wallet Found!",
          description: "You already have a Hyperliquid wallet set up.",
          variant: "default"
        })
      }
      
    } catch (error) {
      console.error('Error creating wallet:', error)
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to create wallet",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const downloadPrivateKey = () => {
    if (!newWalletData) return
    
    const blob = new Blob([newWalletData.privateKey], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hyperliquid-private-key.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded!",
      description: "Private key saved to your device",
      variant: "default"
    })
  }

  const handleCompleteSetup = () => {
    if (newWalletData && !hasSavedPrivateKey) {
      toast({
        title: "Save Your Private Key",
        description: "Please save your private key before continuing",
        variant: "destructive"
      })
      return
    }
    
    onSetupComplete?.()
  }

  const handleResetWallet = async () => {
    if (!user?.address) return

    setIsResetting(true)
    try {
      const response = await fetch(`/api/wallet-setup?userWalletAddress=${encodeURIComponent(user.address)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reset wallet')
      }

      // Reset state
      setHasExistingWallet(false)
      setWalletInfo(null)
      setNewWalletData(null)
      setHasSavedPrivateKey(false)

      toast({
        title: "Wallet Reset",
        description: "Your existing wallet has been deleted. You can now create a new one.",
        variant: "default"
      })
    } catch (error) {
      console.error('Error resetting wallet:', error)
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset wallet",
        variant: "destructive"
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleExportPrivateKey = async () => {
    if (!user?.address) return

    setIsExporting(true)
    try {
      const response = await fetch('/api/wallet-setup', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWalletAddress: user.address
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export private key')
      }

      const data = await response.json()
      
      // Create download
      const blob = new Blob([data.privateKey], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'hyperliquid-private-key.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Private Key Exported",
        description: "Your private key has been downloaded. Keep it secure!",
        variant: "default"
      })
    } catch (error) {
      console.error('Error exporting private key:', error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export private key",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (hasExistingWallet && walletInfo) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Hyperliquid Wallet Connected
          </CardTitle>
          <CardDescription>
            Your EVM wallet is ready for trading on Hyperliquid.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={walletInfo.walletAddress || ''} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(walletInfo.walletAddress || '', 'Wallet address')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Balance</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  ${walletInfo.balance.toFixed(2)} USD
                </Badge>
              </div>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your wallet is securely stored and ready for trading. You can now create AI agents and start paper trading.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={onSetupComplete} className="flex-1">
              Continue to Trading
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportPrivateKey}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export Private Key"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleResetWallet}
              disabled={isResetting}
            >
              {isResetting ? "Resetting..." : "Reset Wallet"}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet2 className="h-5 w-5" />
          Create Hyperliquid Wallet
        </CardTitle>
        <CardDescription>
          We'll create a secure EVM wallet for you to trade on Hyperliquid.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Wallet</TabsTrigger>
            <TabsTrigger value="info">How It Works</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            {newWalletData ? (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Save your private key securely. You won't be able to see it again.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={newWalletData.walletAddress} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(newWalletData.walletAddress, 'Wallet address')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Private Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type={showPrivateKey ? "text" : "password"}
                        value={newWalletData.privateKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                      >
                        {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(newWalletData.privateKey, 'Private key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadPrivateKey}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="saved-key"
                      checked={hasSavedPrivateKey}
                      onChange={(e) => setHasSavedPrivateKey(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="saved-key" className="text-sm">
                      I have saved my private key securely
                    </Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleCompleteSetup} 
                    disabled={!hasSavedPrivateKey}
                    className="flex-1"
                  >
                    Complete Setup
                  </Button>
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    We generate a new EVM wallet specifically for Hyperliquid trading.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateWallet} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Creating Wallet..." : "Create EVM Wallet"}
                  </Button>
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">🔐 Secure Wallet Creation</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  We generate a new EVM wallet specifically for Hyperliquid trading.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Private key is encrypted and stored securely</li>
                  <li>• Wallet is isolated from your main wallet</li>
                  <li>• Only used for Hyperliquid trading</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">💰 Fund Your Wallet</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  After creation, you'll need to fund your wallet to start trading.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://app.hyperliquid.xyz" target="_blank" rel="noopener noreferrer">
                    Open Hyperliquid <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">🚀 Start Trading</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create AI agents with different strategies</li>
                  <li>• Start with paper trading to test</li>
                  <li>• Monitor performance and adjust settings</li>
                  <li>• Enable real trading when ready</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 