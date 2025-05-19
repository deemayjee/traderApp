"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Copy, Lock as LockIcon, Unlock as UnlockIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SellToken } from "@/components/copytrading/sell-token"
import { useWalletTokens } from "@/hooks/use-wallet-tokens"
import { Connection, PublicKey } from "@solana/web3.js"
import { TokenLockService } from "@/lib/services/token-lock"
import { ReleaseTokensButton } from "@/components/copy-trading/ReleaseTokensButton"

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
  lock_id?: string
  pda_address?: string
  locked_amount: number
}

interface ProcessedTokenAccount {
  mint: string;
  amount: number;
  decimals: number;
  formattedAmount: string;
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
  const { assets: walletAssets } = useWalletTokens()
  const [lockStatuses, setLockStatuses] = useState<Record<string, boolean>>({})
  const [lockTimes, setLockTimes] = useState<Record<string, number>>({})
  const [selectedPosition, setSelectedPosition] = useState<'user' | 'ai'>('user')

  const ITEMS_PER_PAGE = 3

  // Initialize Solana connection
  const connection = new Connection(
    process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com"
  );
  const tokenLockService = new TokenLockService(connection);

  const fetchTrades = async () => {
    if (!user?.wallet?.address) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/copy-trading/active?userWallet=${user.wallet.address}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trades')
      }

      setTrades(data.trades)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch trades",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades()
  }, [user?.wallet?.address])

  useEffect(() => {
    const fetchLockStatuses = async () => {
      const statuses: Record<string, boolean> = {};
      const times: Record<string, number> = {};
      
      for (const trade of trades) {
        if (trade.pda_address && trade.token_address) {
          try {
            // Check if the lock period has ended based on end_date
            const currentTime = Date.now();
            const endTime = new Date(trade.end_date).getTime();
            const isLocked = currentTime < endTime;
            statuses[trade.id] = isLocked;

            // Calculate remaining time in days
            const remainingTime = Math.max(0, (endTime - currentTime) / (24 * 60 * 60 * 1000));
            times[trade.id] = remainingTime;
          } catch (error) {
            console.error(`Error checking lock status for trade ${trade.id}:`, error);
            // Default to locked if there's an error
            statuses[trade.id] = true;
            times[trade.id] = 0;
          }
        }
      }
      
      setLockStatuses(statuses);
      setLockTimes(times);
    };

    if (trades.length > 0) {
      fetchLockStatuses();
      // Refresh lock statuses every minute
      const intervalId = setInterval(fetchLockStatuses, 60000);
      return () => clearInterval(intervalId);
    }
  }, [trades]);

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

  const formatAmount = (amount: number, decimals: number = 4) => {
    if (amount === 0) return "0.00";
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.min(decimals, 8),
      useGrouping: true
    });
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

  // Update the asset finding code to use proper typing
  const findAsset = (tokenAddress: string): ProcessedTokenAccount | undefined => {
    return walletAssets.find((asset: ProcessedTokenAccount) => asset.mint === tokenAddress)
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
    <div>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Active Copy Trades</CardTitle>
              <CardDescription>Monitor your current copy trading activities</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="text-sm border rounded-md px-2 py-1 bg-background"
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
                className="flex flex-col p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(trade.status)}
                    <div>
                      <h3 className="font-medium text-lg">{trade.token_symbol}</h3>
                      <p className="text-sm text-muted-foreground">
                        Started {formatDate(trade.created_at)}
                      </p>
                    </div>
                  </div>
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

                {trade.pda_address && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Your Holdings</p>
                          <p className="text-sm text-muted-foreground">Current Position</p>
                        </div>
                        <div className="text-right">
                          {(() => {
                            const asset = findAsset(trade.token_address)
                            return (
                              <p className="font-mono font-medium">{asset?.formattedAmount?.split(' ')[0] || '0'}</p>
                            );
                          })()}
                          <p className="text-sm text-muted-foreground">{trade.token_symbol}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">AI Holdings</p>
                            {trade.pda_address && (
                              <div className="flex items-center gap-1">
                                {lockStatuses[trade.id] ? (
                                  <LockIcon className="h-3 w-3 text-yellow-500" />
                                ) : (
                                  <UnlockIcon className="h-3 w-3 text-green-500" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {lockStatuses[trade.id] 
                                    ? `${Math.ceil(lockTimes[trade.id])} days left`
                                    : 'Unlocked'}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Locked Position</p>
                        </div>
                        <div className="text-right">
                          {(() => {
                            const asset = findAsset(trade.token_address)
                            const aiAmount = trade.locked_amount / 1e6;
                            return (
                              <p className="font-mono font-medium">{formatAmount(aiAmount, 4)}</p>
                            );
                          })()}
                          <p className="text-sm text-muted-foreground">{trade.token_symbol}</p>
                        </div>
                      </div>
                      
                      {trade.pda_address && (
                        <ReleaseTokensButton
                          userWallet={trade.wallet_address}
                          copyTradeId={trade.id}
                          tokenSymbol={trade.token_symbol}
                          amount={trade.ai_amount}
                          decimals={walletAssets.find(asset => asset.mint === trade.token_address)?.decimals ?? 9}
                          endDate={trade.end_date}
                          onRelease={() => {
                            // Refresh the trades list after successful release
                            fetchTrades()
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-muted-foreground">Trade ID:</span>
                        <span className="ml-2 font-mono">{trade.id?.slice(0, 8) || 'N/A'}...</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">PDA:</span>
                        <span className="ml-2 font-mono">{trade.pda_address ? truncateAddress(trade.pda_address) : 'N/A'}</span>
                      </div>
                    </div>
                    {trade.pda_address && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(trade.pda_address as string)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-full max-w-xs"
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

      {/* Sell Token Modal */}
      <Dialog open={showSellModal} onOpenChange={setShowSellModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell {selectedTrade?.token_symbol}</DialogTitle>
            <DialogDescription>
              Choose which position you want to sell
            </DialogDescription>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedPosition === 'user' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPosition('user')}
                >
                  <h4 className="font-medium mb-2">Your Position</h4>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const asset = findAsset(selectedTrade.token_address)
                      return `Amount: ${asset?.formattedAmount || '0'} ${selectedTrade.token_symbol}`;
                    })()}
                  </p>
                </div>
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedPosition === 'ai' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPosition('ai')}
                >
                  <h4 className="font-medium mb-2">AI Position</h4>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const asset = findAsset(selectedTrade.token_address)
                      const aiAmount = selectedTrade.locked_amount / 1e6;
                      return `Amount: ${formatAmount(aiAmount, 4)} ${selectedTrade.token_symbol}`;
                    })()}
                  </p>
                  {lockStatuses[selectedTrade.id] && (
                    <p className="text-sm text-yellow-500 mt-1">
                      Locked for {Math.ceil(lockTimes[selectedTrade.id])} more days
                    </p>
                  )}
                </div>
              </div>

              {selectedPosition && (
                <SellToken
                  tokenBalance={{
                    mint: selectedTrade.token_address,
                    amount: (walletAssets.find(asset => asset.mint === selectedTrade.token_address)?.amount || 0),
                    decimals: 9, // Assuming 9 decimals for most tokens
                    symbol: selectedTrade.token_symbol
                  }}
                  hideTitle
                  hideDescription
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 