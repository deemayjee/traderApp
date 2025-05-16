"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CopyTrade {
  id: string
  user_id: string
  wallet_address: string
  ai_wallet_address: string
  token_address: string
  token_symbol: string
  user_amount: number
  ai_amount: number
  lock_period: number
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'cancelled'
  user_trade_signature?: string
  ai_trade_signature?: string
  entry_price?: number
  exit_price?: number
  current_price?: number
  user_pnl?: number
  ai_pnl?: number
  created_at: string
  updated_at: string
}

export function ActiveCopyTrades() {
  const [trades, setTrades] = useState<CopyTrade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useWalletAuth()

  useEffect(() => {
    const fetchTrades = async () => {
      if (!user?.wallet?.address) return

      try {
        const response = await fetch(`/api/copy-trading/active?userWallet=${user.wallet.address}`)
        if (!response.ok) {
          throw new Error('Failed to fetch active trades')
        }

        const data = await response.json()
        setTrades(data.trades)
      } catch (error) {
        console.error('Error fetching active trades:', error)
        toast({
          title: "Error",
          description: "Failed to fetch active trades",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrades()
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchTrades, 30000)

    return () => clearInterval(intervalId)
  }, [user?.wallet?.address, toast])

  const getStatusBadge = (status: CopyTrade['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Active</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500">Completed</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500">Cancelled</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Helper function to truncate wallet addresses
  function truncateAddress(address: string) {
    if (!address) return '';
    return address.length > 12
      ? `${address.slice(0, 4)}...${address.slice(-6)}`
      : address;
  }

  // Helper function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied",
        description: "Wallet address copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Active Copy Trades</CardTitle>
          <CardDescription>Loading your active copy trades...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (trades.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Active Copy Trades</CardTitle>
          <CardDescription>You don't have any active copy trades</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p>Start copying trades to see them here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Active Copy Trades</CardTitle>
        <CardDescription>Your current copy trading activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="flex flex-col space-y-2 p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusBadge(trade.status)}
                  <span className="text-sm text-muted-foreground">
                    {formatDate(trade.created_at)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {trade.user_trade_signature && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://solscan.io/tx/${trade.user_trade_signature}`, '_blank')}
                    >
                      View User Transaction
                    </Button>
                  )}
                  {trade.ai_trade_signature && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://solscan.io/tx/${trade.ai_trade_signature}`, '_blank')}
                    >
                      View AI Transaction
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">User Wallet</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded-md overflow-x-auto break-all max-w-[180px]">
                      {truncateAddress(trade.wallet_address)}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(trade.wallet_address)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI Wallet</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded-md overflow-x-auto break-all max-w-[180px]">
                      {truncateAddress(trade.ai_wallet_address)}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(trade.ai_wallet_address)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Token</p>
                  <p className="text-sm text-muted-foreground">
                    {trade.token_symbol}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-sm text-muted-foreground">
                    {formatAmount(trade.user_amount)} SOL
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">AI Amount</p>
                  <p className="text-sm text-muted-foreground">
                    {formatAmount(trade.ai_amount)} SOL
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Entry Price</p>
                  <p className="text-sm text-muted-foreground">
                    {trade.entry_price ? formatAmount(trade.entry_price) : 'N/A'}
                  </p>
                </div>
              </div>

              {trade.status === 'completed' && trade.end_date && (
                <div className="flex items-center space-x-2 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Completed at {formatDate(trade.end_date)}</span>
                </div>
              )}

              {trade.status === 'cancelled' && (
                <div className="flex items-center space-x-2 text-sm text-red-500">
                  <XCircle className="h-4 w-4" />
                  <span>Trade cancelled</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 