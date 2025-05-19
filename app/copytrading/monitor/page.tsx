"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react"
import { toast } from "sonner"

interface Trade {
  id: string
  timestamp: string
  type: "buy" | "sell"
  amount: number
  price: number
  status: "success" | "failed"
  profit?: number
}

interface CopyTradeStats {
  totalTrades: number
  successfulTrades: number
  failedTrades: number
  totalProfit: number
  winRate: number
  averageProfit: number
}

export default function TradeMonitorPage() {
  const searchParams = useSearchParams()
  const traderWallet = searchParams.get("trader")
  const [trades, setTrades] = useState<Trade[]>([])
  const [stats, setStats] = useState<CopyTradeStats>({
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    totalProfit: 0,
    winRate: 0,
    averageProfit: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!traderWallet) {
      setError("No trader selected")
      setIsLoading(false)
      return
    }

    // Fetch initial trade data
    fetchTradeData()

    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || "wss://your-websocket-url")

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "new_trade" && data.traderWallet === traderWallet) {
        handleNewTrade(data.trade)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      toast.error("Lost connection to trade updates")
    }

    return () => {
      ws.close()
    }
  }, [traderWallet])

  const fetchTradeData = async () => {
    try {
      const response = await fetch(`/api/copy-trading/trades?trader=${traderWallet}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch trade data")
      }

      setTrades(data.trades)
      setStats(data.stats)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch trade data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewTrade = (trade: Trade) => {
    setTrades((prevTrades) => [trade, ...prevTrades].slice(0, 50)) // Keep last 50 trades
    updateStats(trade)
  }

  const updateStats = (trade: Trade) => {
    setStats((prevStats) => {
      const newStats = { ...prevStats }
      newStats.totalTrades++
      
      if (trade.status === "success") {
        newStats.successfulTrades++
        if (trade.profit) {
          newStats.totalProfit += trade.profit
        }
      } else {
        newStats.failedTrades++
      }

      newStats.winRate = (newStats.successfulTrades / newStats.totalTrades) * 100
      newStats.averageProfit = newStats.totalProfit / newStats.successfulTrades

      return newStats
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.winRate || 0).toFixed(2)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalProfit || 0) >= 0 ? (
                <span className="text-green-500 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  {(stats.totalProfit || 0).toFixed(4)} SOL
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  {Math.abs(stats.totalProfit || 0).toFixed(4)} SOL
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.averageProfit || 0) >= 0 ? (
                <span className="text-green-500 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  {(stats.averageProfit || 0).toFixed(4)} SOL
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  {Math.abs(stats.averageProfit || 0).toFixed(4)} SOL
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center">
                    <span className="font-medium">
                      {trade.type === "buy" ? "Buy" : "Sell"}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(trade.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Amount: {trade.amount} SOL
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">${trade.price.toFixed(2)}</div>
                    {trade.profit && (
                      <div
                        className={`text-sm ${
                          trade.profit >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {trade.profit >= 0 ? "+" : ""}
                        {trade.profit.toFixed(4)} SOL
                      </div>
                    )}
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs ${
                      trade.status === "success"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {trade.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 