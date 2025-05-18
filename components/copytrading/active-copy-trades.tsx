"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SellToken } from "@/components/copytrading/sell-token"
import { useWalletTokens } from "@/hooks/use-wallet-tokens"

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
  const [selectedTrade, setSelectedTrade] = useState<CopyTrade | null>(null)
  const [showSellModal, setShowSellModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showAll, setShowAll] = useState(false)
  const { toast } = useToast()
  const { user } = useWalletAuth()
  const { assets: walletAssets } = useWalletTokens();

  const ITEMS_PER_PAGE = 3

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

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' 
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortBy === 'amount') {
        return sortOrder === 'desc' 
          ? b.user_amount - a.user_amount
          : a.user_amount - b.user_amount
      }
      return sortOrder === 'desc'
        ? b.status.localeCompare(a.status)
        : a.status.localeCompare(b.status)
    })
  }, [trades, sortBy, sortOrder])

  const paginatedTrades = useMemo(() => {
    if (showAll) return sortedTrades
    return sortedTrades.slice(0, currentPage * ITEMS_PER_PAGE)
  }, [sortedTrades, currentPage, showAll])

  const hasMore = !showAll && paginatedTrades.length < trades.length

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
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Active Copy Trades</CardTitle>
              <CardDescription>Your current copy trading activities</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="text-sm border rounded-md px-2 py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="status">Sort by Status</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {getStatusBadge(trade.status)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium truncate">{trade.token_symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(trade.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatAmount(trade.user_amount)} SOL</p>
                        <p className="text-sm text-muted-foreground">
                          AI: {formatAmount(trade.ai_amount)} SOL
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {trade.status === 'active' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedTrade(trade)
                        setShowSellModal(true)
                      }}
                    >
                      Sell
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Load More
              </Button>
            </div>
          )}

          {!showAll && trades.length > ITEMS_PER_PAGE && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => setShowAll(true)}
              >
                View All ({trades.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSellModal} onOpenChange={setShowSellModal}>
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Sell {selectedTrade?.token_symbol}</DialogTitle>
            <CardDescription>
              You can sell your {selectedTrade?.token_symbol} tokens for SOL below.
            </CardDescription>
          </DialogHeader>
          {selectedTrade && (() => {
            const tokenAsset = walletAssets.find(
              asset => asset.mint.toLowerCase() === selectedTrade.token_address.toLowerCase()
            );
            const sellTokenElement = (
              <SellToken
                tokenBalance={{
                  mint: selectedTrade.token_address,
                  amount: tokenAsset ? tokenAsset.amount : 0,
                  decimals: tokenAsset ? tokenAsset.decimals : 9,
                  symbol: selectedTrade.token_symbol
                }}
                hideTitle
                hideDescription
              />
            );
            return (
              <div className="flex flex-col gap-0">
                <div className="px-6 py-4">
                  {!tokenAsset && (
                    <div className="mb-2 text-sm text-red-500">
                      Warning: You do not have any {selectedTrade.token_symbol} tokens in your wallet.
                    </div>
                  )}
                  {sellTokenElement}
                </div>
                <div className="flex gap-2 px-6 pb-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowSellModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
} 