"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Loader2, RefreshCw } from "lucide-react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

// Jupiter API endpoints
const JUPITER_API = "https://quote-api.jup.ag/v6"
const SOL_MINT = "So11111111111111111111111111111111111111112"

interface TradeStats {
  totalAllocation: number
  totalProfit: number
  activeTrades: number
  totalTrades: number
  profitChange: number
  userPNL: number
  aiPNL: number
}

interface Trade {
  id: string
  token_address: string
  entry_price: number
  user_amount: number
  ai_amount: number
}

export function CopyTradingStats() {
  const [stats, setStats] = useState<TradeStats>({
    totalAllocation: 0,
    totalProfit: 0,
    activeTrades: 0,
    totalTrades: 0,
    profitChange: 0,
    userPNL: 0,
    aiPNL: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useWalletAuth()
  const { toast } = useToast()

  // Add refresh interval state
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  const getTokenPrice = async (tokenAddress: string): Promise<number> => {
    try {
      const timestamp = Date.now()
      const priceResponse = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}?t=${timestamp}`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      )

      if (!priceResponse.ok) {
        console.error("Price response error:", await priceResponse.text())
        throw new Error(`DexScreener API error: ${priceResponse.statusText}`)
      }

      const priceData = await priceResponse.json()
      console.log("DexScreener price response:", priceData)

      if (!priceData.pairs || priceData.pairs.length === 0) {
        console.error("No pairs found for token:", tokenAddress)
        throw new Error(`No price data for token ${tokenAddress}`)
      }

      // Get the first SOL pair
      const solPair = priceData.pairs.find((pair: any) => 
        pair.quoteToken.symbol === 'SOL' || 
        pair.baseToken.symbol === 'SOL'
      )

      if (!solPair) {
        console.error("No SOL pair found for token:", tokenAddress)
        throw new Error(`No SOL pair found for token ${tokenAddress}`)
      }

      // Get the price in SOL
      let priceInSol: number
      if (solPair.quoteToken.symbol === 'SOL') {
        priceInSol = Number(solPair.priceUsd)
      } else {
        priceInSol = 1 / Number(solPair.priceUsd)
      }

      console.log("Price calculation details:", {
        pair: solPair.pairAddress,
        priceUsd: solPair.priceUsd,
        quoteToken: solPair.quoteToken.symbol,
        baseToken: solPair.baseToken.symbol,
        calculatedPrice: priceInSol,
        timestamp: new Date().toISOString()
      })

      if (isNaN(priceInSol)) {
        console.error("Invalid price data:", solPair)
        throw new Error("Invalid price data")
      }

      return priceInSol
    } catch (error) {
      console.error("Error fetching token price:", error)
      return 0
    }
  }

  const calculatePNL = async (trades: Trade[]) => {
    let totalAllocation = 0
    let userPNL = 0
    let aiPNL = 0

    for (const trade of trades) {
      try {
        console.log("Processing trade:", trade)
        const currentPrice = await getTokenPrice(trade.token_address)
        
        // If entry price is null, fetch it from the API
        let entryPrice = Number(trade.entry_price)
        if (!entryPrice) {
          // Make a request to get the entry price from the API
          const entryResponse = await fetch(`/api/copy-trading/trade-entry-price?tradeId=${trade.id}`)
          if (entryResponse.ok) {
            const entryData = await entryResponse.json()
            entryPrice = entryData.entryPrice
          } else {
            // If we can't get the entry price, use current price but log a warning
            console.warn(`No entry price found for trade ${trade.id}, using current price`)
            entryPrice = currentPrice
          }
        }

        const userAmount = Number(trade.user_amount)
        const aiAmount = Number(trade.ai_amount)

        console.log("Trade values:", {
          currentPrice,
          entryPrice,
          userAmount,
          aiAmount
        })

        // Calculate PNL based on price change
        const priceChange = currentPrice - entryPrice
        const userTradePNL = priceChange * userAmount
        const aiTradePNL = priceChange * aiAmount

        userPNL += userTradePNL
        aiPNL += aiTradePNL
        totalAllocation += userAmount

        console.log(`Trade ${trade.id} PNL calculation:`, {
          tokenAddress: trade.token_address,
          currentPrice,
          entryPrice,
          priceChange,
          userAmount,
          aiAmount,
          userTradePNL,
          aiTradePNL
        })
      } catch (error) {
        console.error(`Error calculating PNL for trade ${trade.id}:`, error)
      }
    }

    return { totalAllocation, userPNL, aiPNL }
  }

  const fetchStats = async () => {
    if (!user?.wallet?.address) return

    try {
      setIsLoading(true)
      // Add cache-busting timestamp to prevent stale data
      const timestamp = Date.now()
      const response = await fetch(`/api/copy-trading/stats?wallet=${user.wallet.address}&t=${timestamp}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trade stats')
      }

      const data = await response.json()

      // Calculate PNL using current prices
      const { totalAllocation, userPNL, aiPNL } = await calculatePNL(data.activeTrades)

      const newStats = {
        totalAllocation,
        totalProfit: userPNL + aiPNL,
        activeTrades: data.activeTrades.length,
        totalTrades: data.totalTrades,
        profitChange: data.profitChange,
        userPNL,
        aiPNL
      }
      setStats(newStats)
      setLastUpdate(timestamp)
    } catch (error) {
      console.error('Error fetching trade stats:', error)
      toast({
        title: "Error",
        description: "Failed to fetch trade statistics",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Reduce refresh interval to 30 seconds
  useEffect(() => {
    fetchStats()
    const intervalId = setInterval(fetchStats, 30000)
    return () => clearInterval(intervalId)
  }, [user?.wallet?.address]) // Remove toast from dependencies

  // Add manual refresh button
  const handleRefresh = () => {
    fetchStats()
  }

  const formatValue = (value: number) => {
    if (isNaN(value)) return "0.00";
    const formatted = value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
    return formatted;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  // Memoize the stats data to prevent unnecessary recalculations
  const statsData = useMemo(() => [
    {
      label: "Total Allocation",
      value: `${formatValue(stats.totalAllocation)} SOL`,
      change: formatPercentage(stats.profitChange),
      positive: stats.profitChange >= 0,
    },
    {
      label: "Your PNL",
      value: `${formatValue(stats.userPNL)} SOL`,
      change: stats.totalAllocation > 0 
        ? formatPercentage((stats.userPNL / stats.totalAllocation) * 100)
        : "0.00%",
      positive: stats.userPNL >= 0,
    },
    {
      label: "AI PNL",
      value: `${formatValue(stats.aiPNL)} SOL`,
      change: stats.totalAllocation > 0
        ? formatPercentage((stats.aiPNL / stats.totalAllocation) * 100)
        : "0.00%",
      positive: stats.aiPNL >= 0,
    },
    {
      label: "Active Trades",
      value: stats.activeTrades.toString(),
      change: "Current",
      positive: true,
    },
  ], [stats]) // Only recalculate when stats change

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground">Copy Trading Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((_, index) => (
              <div 
                key={index} 
                className="bg-muted/50 border border-border rounded-lg p-3 animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-foreground">Copy Trading Stats</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(lastUpdate).toLocaleTimeString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statsData.map((stat, index) => (
            <div 
              key={index} 
              className="bg-muted/50 border border-border rounded-lg p-3 hover:bg-muted/80 transition-colors"
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className={`text-xs flex items-center ${stat.positive ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {stat.positive ? (
                  <ArrowUp size={12} className="mr-1" />
                ) : (
                  <ArrowDown size={12} className="mr-1" />
                )}
                {stat.change}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
