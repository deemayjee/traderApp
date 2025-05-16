"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { Loader2, Copy, Check, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WalletCredentials {
  address: string
  privateKey: string
}

export function AIWalletCreator() {
  const [isLoading, setIsLoading] = useState(false)
  const [credentials, setCredentials] = useState<WalletCredentials | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [existingWallet, setExistingWallet] = useState<{ address: string, balance: number } | null>(null)
  const { toast } = useToast()
  const { user } = useWalletAuth()

  // Fetch AI wallet if it exists
  useEffect(() => {
    const fetchAIWallet = async () => {
      if (!user?.wallet?.address) {
        setExistingWallet(null)
        return
      }
      try {
        const response = await fetch(`/api/ai-wallet/get?userWallet=${user.wallet.address}`)
        if (response.ok) {
          const data = await response.json()
          if (data.wallet && data.wallet.address) {
            // Fetch the current balance
            const balanceResponse = await fetch(`/api/wallet/balance?address=${data.wallet.address}`)
            const balanceData = await balanceResponse.json()
            
            setExistingWallet({
              address: data.wallet.address,
              balance: balanceData.balance ?? 0
            })
          } else {
            setExistingWallet(null)
          }
        } else {
          setExistingWallet(null)
        }
      } catch (e) {
        setExistingWallet(null)
      }
    }
    fetchAIWallet()

    // Set up periodic balance refresh
    const intervalId = setInterval(fetchAIWallet, 30000) // Refresh every 30 seconds

    return () => clearInterval(intervalId)
  }, [user?.wallet?.address])

  const handleCreateWallet = async () => {
    try {
      setIsLoading(true)
      
      if (!user?.wallet?.address) {
        toast({
          title: "Error",
          description: "Please connect your wallet first",
          variant: "destructive"
        })
        return
      }

      console.log("Creating wallet for user:", user.wallet.address)

      const response = await fetch("/api/ai-wallet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userWallet: user.wallet.address })
      })

      const data = await response.json()
      console.log("Response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to create AI wallet")
      }

      setCredentials(data.wallet)
      setShowPrivateKey(true)
      toast({
        title: "Success",
        description: "AI wallet created successfully",
      })
    } catch (error) {
      console.error("Error in handleCreateWallet:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create AI wallet",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add a function to check transaction status
  const checkTransactionStatus = async (signature: string) => {
    try {
      const response = await fetch(`/api/transaction/status?signature=${signature}`)
      const data = await response.json()
      
      if (data.status === 'confirmed') {
        return true
      } else if (data.status === 'failed') {
        throw new Error('Transaction failed')
      } else {
        // If still processing, wait and check again
        await new Promise(resolve => setTimeout(resolve, 2000))
        return checkTransactionStatus(signature)
      }
    } catch (error) {
      console.error('Error checking transaction status:', error)
      throw error
    }
  }

  // Add a function to handle copy trade
  const handleCopyTrade = async (tradeData: any) => {
    try {
      setIsLoading(true)
      
      const response = await fetch("/api/copy-trading/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(tradeData)
      })

      const data = await response.json()
      console.log("Copy trade response:", data)

      if (!response.ok) {
        if (data.error === "Insufficient balance") {
          toast({
            title: "Insufficient Balance",
            description: `You need at least ${data.details.required} SOL to execute this trade. Your current balance is ${data.details.available} SOL.`,
            variant: "destructive"
          })
        } else if (data.error === "AI wallet has insufficient balance") {
          toast({
            title: "AI Wallet Needs Funding",
            description: (
              <div className="space-y-2">
                <p>Your AI wallet needs at least {data.details.required} SOL to execute trades.</p>
                <p>Current balance: {data.details.available} SOL</p>
                <p className="text-sm text-muted-foreground">
                  AI Wallet: {data.details.aiWalletAddress}
                </p>
              </div>
            ),
            variant: "destructive"
          })
        } else {
          throw new Error(data.error || "Failed to start copy trade")
        }
        return
      }

      // Check transaction status
      if (data.userTradeSignature) {
        toast({
          title: "Processing",
          description: "Transaction is being processed. This may take a few minutes...",
        })

        try {
          const isConfirmed = await checkTransactionStatus(data.userTradeSignature)
          if (isConfirmed) {
            toast({
              title: "Success",
              description: "Copy trade started successfully",
            })
            // Close modal or update UI as needed
            setShowPrivateKey(false)
          }
        } catch (error) {
          toast({
            title: "Warning",
            description: "Transaction is still processing. You can check its status on Solana Explorer.",
            variant: "default"
          })
          // Open Solana Explorer in a new tab
          window.open(`https://solscan.io/tx/${data.userTradeSignature}`, '_blank')
        }
      }
    } catch (error) {
      console.error("Error in handleCopyTrade:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start copy trade",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied",
        description: "Credentials copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create Pally AI Wallet</CardTitle>
          <CardDescription>
            Create a dedicated wallet for your AI trading partner. Keep your private key safe!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existingWallet ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Wallet Address</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded-md overflow-x-auto">
                    {existingWallet.address}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(existingWallet.address)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Balance</label>
                <div className="p-2 bg-muted rounded-md">
                  {Number(existingWallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SOL
                </div>
              </div>
            </div>
          ) : !credentials ? (
            <Button
              onClick={handleCreateWallet}
              disabled={isLoading || !user?.wallet?.address}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Wallet...
                </>
              ) : !user?.wallet?.address ? (
                "Connect Wallet First"
              ) : (
                "Create Pally AI Wallet"
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Wallet Address</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded-md overflow-x-auto">
                    {credentials.address}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.address)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPrivateKey(true)}
              >
                View Private Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPrivateKey} onOpenChange={setShowPrivateKey}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500 text-lg font-bold">
              <AlertTriangle className="h-5 w-5" />
              Save Your Private Key
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-2">
              <span className="font-semibold text-red-400">Warning:</span> This is the only time you'll see your private key. <br />
              <span className="font-medium">Save it securely.</span> If you lose it, you won't be able to access your AI wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 border-t border-border" />
          {credentials && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Private Key</label>
                <div className="flex items-center gap-2 bg-zinc-900 rounded-md p-2 overflow-x-auto">
                  <code className="flex-1 text-sm break-all select-all">
                    {credentials.privateKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.privateKey)}
                    className="ml-2"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="text-xs text-yellow-400 mt-1">Never share this key with anyone.</div>
              </div>
              <Button
                className="w-full mt-6 font-semibold"
                onClick={() => setShowPrivateKey(false)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "I've Saved My Private Key"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 