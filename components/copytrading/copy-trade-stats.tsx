"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useWalletAuth } from "@/components/auth/wallet-context"

interface TradeStats {
  totalTrades: number
  successfulTrades: number
  failedTrades: number
  totalVolume: number
  averagePriceImpact: number
  lastUpdated: string
}

export function CopyTradeStats() {
  const [stats, setStats] = useState<TradeStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useWalletAuth()

  const fetchStats = async () => {
    if (!user?.wallet?.address) return

    try {
      const response = await fetch(`/api/copy-trading/stats?wallet=${user.wallet.address}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch trade stats")
      }

      setStats(data)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch trade stats",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [user?.wallet?.address])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Copy Trade Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Copy Trade Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No statistics available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Copy Trade Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Total Trades</p>
            <p className="text-2xl font-bold">{stats.totalTrades}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Successful Trades</p>
            <p className="text-2xl font-bold text-green-600">{stats.successfulTrades}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Failed Trades</p>
            <p className="text-2xl font-bold text-red-600">{stats.failedTrades}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Total Volume (SOL)</p>
            <p className="text-2xl font-bold">{stats.totalVolume.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Average Price Impact</p>
            <p className="text-2xl font-bold">{stats.averagePriceImpact.toFixed(2)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Last Updated</p>
            <p className="text-sm text-muted-foreground">
              {new Date(stats.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 