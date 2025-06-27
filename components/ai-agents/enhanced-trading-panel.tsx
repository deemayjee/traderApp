"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react"
import { hyperliquidService, OrderRequest, TradingResult, PositionUpdate } from "@/lib/services/hyperliquid-service"
import { tradingHistoryService } from "@/lib/services/trading-history-service"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { toast } from "@/hooks/use-toast"

interface EnhancedTradingPanelProps {
  agentId?: string
  agentName?: string
}

export function EnhancedTradingPanel({ agentId, agentName }: EnhancedTradingPanelProps) {
  const { user } = useWalletAuth()
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC-USD")
  const [orderType, setOrderType] = useState<"Market" | "Limit">("Market")
  const [side, setSide] = useState<"buy" | "sell">("buy")
  const [size, setSize] = useState<string>("")
  const [price, setPrice] = useState<string>("")
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [positions, setPositions] = useState<PositionUpdate[]>([])
  const [recentTrades, setRecentTrades] = useState<any[]>([])
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
  const [totalPnL, setTotalPnL] = useState<number>(0)
  const [winRate, setWinRate] = useState<number>(0)

  // Available trading symbols
  const symbols = ["BTC-USD", "ETH-USD", "SOL-USD", "AVAX-USD"]

  useEffect(() => {
    if (!user?.address) return

    // Subscribe to real-time position updates
    const unsubscribePositions = hyperliquidService.subscribeToPositions(
      user.address,
      (update: PositionUpdate) => {
        setPositions(prev => {
          const existing = prev.findIndex(p => p.symbol === update.symbol)
          if (existing >= 0) {
            const newPositions = [...prev]
            newPositions[existing] = update
            return newPositions
          } else {
            return [...prev, update]
          }
        })

        // Record position update in database
        tradingHistoryService.recordPositionUpdate({
          walletAddress: user.address!,
          symbol: update.symbol,
          size: update.size,
          entryPrice: update.entryPrice,
          currentPrice: currentPrices[update.symbol] || update.entryPrice,
          unrealizedPnl: update.unrealizedPnl,
          realizedPnl: update.realizedPnl,
          leverage: update.leverage,
          side: update.side,
          timestamp: update.timestamp,
          agentId: update.agentId
        })
      }
    )

    // Subscribe to real-time price updates
    const unsubscribePrices = hyperliquidService.subscribeToMarketData(
      symbols,
      (data) => {
        setCurrentPrices(prev => ({
          ...prev,
          [data.symbol]: data.price
        }))
      }
    )

    // Load trading history
    loadTradingHistory()

    return () => {
      unsubscribePositions()
      unsubscribePrices()
    }
  }, [user?.address])

  const loadTradingHistory = async () => {
    if (!agentId) return

    try {
      const pnlData = await tradingHistoryService.calculateAgentPnL(agentId, '7d')
      setTotalPnL(pnlData.totalPnl)
      setWinRate(pnlData.winRate)
      setRecentTrades(pnlData.trades.slice(0, 10))
    } catch (error) {
      console.error('Error loading trading history:', error)
    }
  }

  const handlePlaceOrder = async () => {
    if (!user?.address || !size) {
      toast({
        title: "Error",
        description: "Please connect wallet and enter order size",
        variant: "destructive"
      })
      return
    }

    setIsPlacingOrder(true)

    try {
      const orderRequest: OrderRequest = {
        symbol: selectedSymbol,
        side,
        orderType,
        size: parseFloat(size),
        price: orderType === "Limit" ? parseFloat(price) : undefined
      }

      const result: TradingResult = await hyperliquidService.placeOrder(
        orderRequest,
        user.address
      )

      if (result.success) {
        toast({
          title: "Order Placed Successfully",
          description: `${side.toUpperCase()} ${size} ${selectedSymbol} at ${result.executions?.[0]?.price || 'market price'}`,
        })

        // Clear form
        setSize("")
        setPrice("")

        // Reload trading history
        await loadTradingHistory()
      } else {
        toast({
          title: "Order Failed",
          description: result.error || "Failed to place order",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast({
        title: "Order Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PnL</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalPnL)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <Progress value={winRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentTrades.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trade" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trade">Place Order</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>

        <TabsContent value="trade">
          <Card>
            <CardHeader>
              <CardTitle>Place New Order</CardTitle>
              <CardDescription>
                {agentName ? `Trading for agent: ${agentName}` : "Manual trading"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {symbols.map(symbol => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol} {currentPrices[symbol] && `- $${formatPrice(currentPrices[symbol])}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderType">Order Type</Label>
                  <Select value={orderType} onValueChange={(value: "Market" | "Limit") => setOrderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Market">Market</SelectItem>
                      <SelectItem value="Limit">Limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="side">Side</Label>
                  <Select value={side} onValueChange={(value: "buy" | "sell") => setSide(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    type="number"
                    placeholder="0.1"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  />
                </div>

                {orderType === "Limit" && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="price">Limit Price</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="45000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || !size}
                className="w-full"
              >
                {isPlacingOrder ? "Placing Order..." : `Place ${side.toUpperCase()} Order`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
              <CardDescription>Real-time position monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No open positions</p>
              ) : (
                <div className="space-y-4">
                  {positions.map((position, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                          {position.side.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-semibold">{position.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            Size: {position.size} | Entry: ${formatPrice(position.entryPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(position.unrealizedPnl)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {position.leverage}x leverage
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
              <CardDescription>Trade execution history</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTrades.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No recent trades</p>
              ) : (
                <div className="space-y-2">
                  {recentTrades.map((trade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Badge variant={trade.side === 'buy' ? 'default' : 'outline'}>
                          {trade.side.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{trade.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(trade.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${formatPrice(trade.executionPrice || trade.price)}</p>
                        <p className="text-sm text-muted-foreground">Size: {trade.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 