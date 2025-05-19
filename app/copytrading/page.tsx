"use client"

import { useState, useEffect, useMemo } from "react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { VersionedTransaction } from '@solana/web3.js';

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
  const connection = useMemo(() => new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta"),
    { commitment: 'confirmed' }
  ), []);
  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenName, setTokenName] = useState("")
  const [isLoadingToken, setIsLoadingToken] = useState(false)
  const [userAmount, setUserAmount] = useState("")
  const [aiAmount, setAiAmount] = useState("0.5") // Default AI amount
  const [slippage, setSlippage] = useState("1") // Default slippage of 1%
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [processingMessage, setProcessingMessage] = useState("")
  const [tradeStatus, setTradeStatus] = useState<"user" | "ai" | "complete" | "error">("user")
  const [errorMessage, setErrorMessage] = useState("")

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

  const fetchTokenMetadata = async (address: string) => {
    if (!address) {
      setIsLoadingToken(false)
      return
    }
    
    setIsLoadingToken(true)
    try {
      // Try Jupiter API first
      const jupiterResponse = await fetch(`https://token.jup.ag/all`)
      const jupiterTokens = await jupiterResponse.json()
      const token = jupiterTokens.find((t: any) => t.address === address)
      
      if (token) {
        setTokenName(token.name)
        setTokenSymbol(token.symbol)
        setIsLoadingToken(false)
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
        setIsLoadingToken(false)
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
    } finally {
      setIsLoadingToken(false)
    }
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
    if (!user?.wallet?.address) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsProcessing(true)
    setProcessingMessage("Preparing your trade...")
    setTradeStatus("user")
    setErrorMessage("")
    
    try {
      // Get a fresh blockhash first
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      
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
          inputDecimals: 9, // SOL decimals
          outputDecimals: 9, // Default to 9 for most tokens
          aiAmount: parseFloat(aiAmount),
          slippage: parseFloat(slippage),
          userWallet: user.wallet.address,
          blockhash,
          lastValidBlockHeight
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (data.error?.includes("Price impact too high")) {
          toast.error("Trade amount too large. Please try a smaller amount to reduce price impact.")
          return
        }
        if (data.error?.includes("Insufficient liquidity")) {
          toast.error("Not enough liquidity for this trade. Please try a smaller amount.")
          return
        }
        throw new Error(data.error || "Failed to start copy trade")
      }

      // If we got a transaction back, it needs to be signed by the user
      if (data.transaction) {
        setProcessingMessage("Please approve the transaction in your wallet")
        
        // Deserialize the transaction
        const transaction = VersionedTransaction.deserialize(
          Buffer.from(data.transaction, 'base64')
        )

        // Get the wallet adapter from Privy
        const { solana } = window as any
        if (!solana?.isPhantom) {
          throw new Error("Phantom wallet not found")
        }

        // Sign the transaction using Phantom
        const signedTransaction = await solana.signTransaction(transaction)
        
        // Send the signed transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize())
        
        setProcessingMessage("Processing your trade...")
        
        try {
          // Wait for confirmation with a longer timeout and better error handling
          const confirmation = await Promise.race([
            connection.confirmTransaction({
              signature,
              blockhash,
              lastValidBlockHeight
            }, 'confirmed'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Transaction timeout')), 30000)
            )
          ]) as { value: { err: any } }

          if (confirmation.value.err) {
            // Check for specific Jupiter errors
            const errorCode = confirmation.value.err.toString()
            if (errorCode.includes("0x1771")) {
              throw new Error("Price impact too high. Please try a smaller amount.")
            }
            throw new Error("Transaction failed")
          }

          setTradeStatus("ai")
          setProcessingMessage("Starting AI copy trade...")
          
          // Now that the user's transaction is confirmed, we can proceed with the copy trade
          const copyTradeResponse = await fetch("/api/copy-trading/confirm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              signature,
              userWallet: user.wallet.address,
              inputTokenAddress: "So11111111111111111111111111111111111111112",
              outputTokenAddress: tokenAddress,
              inputTokenSymbol: "SOL",
              outputTokenSymbol: tokenSymbol,
              inputAmount: parseFloat(userAmount),
              inputDecimals: 9,
              outputDecimals: 9,
              aiAmount: parseFloat(aiAmount),
              slippage: parseFloat(slippage)
            })
          })

          const copyTradeData = await copyTradeResponse.json()
          
          if (!copyTradeResponse.ok) {
            setTradeStatus("error")
            setErrorMessage("AI copy trade failed. Your trade was successful, but the AI trade could not be completed. Please try again later.")
            throw new Error(copyTradeData.error || "Failed to complete copy trade")
          }

          // Show success state
          setTradeStatus("complete")
          setIsProcessing(false)
          setShowConfirmation(false)
          setShowSuccess(true)
          
          // Reset form
          setTokenAddress("")
          setTokenSymbol("")
          setUserAmount("")
          setAiAmount("0.5")
          setSlippage("1")
        } catch (error: unknown) {
          if (error instanceof Error && error.message === 'Transaction timeout') {
            setTradeStatus("error")
            setErrorMessage("Transaction is taking longer than expected. Please check your wallet for confirmation.")
          } else {
            setTradeStatus("error")
            setErrorMessage(error instanceof Error ? error.message : "Failed to process trade")
          }
          console.error("Error in transaction confirmation:", error)
        }
      }
    } catch (error) {
      console.error("Error in handleConfirmCopyTrade:", error)
      setTradeStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to start copy trade")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">AI Copy Trading</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create your AI trading partner and start copy trading with confidence. Let our advanced AI system help you make smarter trading decisions.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - AI Wallet Creator and Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4">AI Trading Partner</h2>
              <AIWalletCreator />
            </div>
            
            {/* Stats Overview */}
            <div className="space-y-4">
              <CopyTradingStats />
            </div>
          </div>

          {/* Right Column - Trading Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* New Trade Form */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-xl">Start New Copy Trade</CardTitle>
                <CardDescription>Configure your trade parameters and start copying trades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tokenAddress">Token Address</Label>
                    <Input
                      id="tokenAddress"
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                      placeholder="Enter token address"
                      className="font-mono"
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="slippage"
                      type="number"
                      value={slippage}
                      onChange={(e) => setSlippage(e.target.value)}
                      placeholder="Enter slippage tolerance"
                      min="0.1"
                      max="100"
                      step="0.1"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={() => setSlippage("1")}>
                      Default (1%)
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Higher values may result in worse prices but higher success rate.</p>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleStartCopyTrade}
                  disabled={!user?.wallet?.address}
                  size="lg"
                >
                  Start Copy Trade
                </Button>
              </CardContent>
            </Card>

            {/* Active Trades */}
            <ActiveCopyTrades />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <Dialog open={isProcessing} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">{processingMessage}</p>
            {tradeStatus === "error" && (
              <div className="mt-4 text-center">
                <p className="text-red-500 font-medium">Error</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Trade Successful!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="rounded-full bg-green-100 p-3">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Your trade has been completed successfully!</p>
              {tradeStatus === "complete" ? (
                <p className="text-muted-foreground">The AI copy trade has also been initiated.</p>
              ) : (
                <p className="text-yellow-600">Note: Your trade was successful, but the AI copy trade could not be completed. You can try again later.</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={() => setShowSuccess(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
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
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Token:</span>
                  <span className="font-medium">{tokenSymbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-mono text-sm">{tokenAddress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Your Amount:</span>
                  <span className="font-medium">{userAmount} SOL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">AI Copy Amount:</span>
                  <span className="font-medium">{aiAmount} SOL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Slippage Tolerance:</span>
                  <span className="font-medium">{slippage}%</span>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                The AI will copy your trade with the specified amount. Make sure you have enough SOL in your wallet.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmCopyTrade}>
                Confirm Trade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
