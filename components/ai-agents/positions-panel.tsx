"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useWalletAuth } from '@/components/auth/wallet-context'
import { positionManager, Position } from '@/lib/services/position-manager'
import { TrendingUp, TrendingDown, X, Target, Shield, DollarSign, Clock } from 'lucide-react'

interface PositionsPanelProps {
  agentId?: string
  showAgentFilter?: boolean
}

export function PositionsPanel({ agentId, showAgentFilter = false }: PositionsPanelProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [closingPosition, setClosingPosition] = useState<string | null>(null)
  const { user } = useWalletAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadPositions()
    
    // Refresh positions every 10 seconds
    const interval = setInterval(loadPositions, 10000)
    return () => clearInterval(interval)
  }, [agentId, user?.address])

  const loadPositions = async () => {
    if (!user?.address) return

    try {
      let positionsData: Position[]
      
      if (agentId) {
        positionsData = await positionManager.getAgentPositions(agentId)
      } else {
        positionsData = await positionManager.getWalletPositions(user.address)
      }
      
      setPositions(positionsData)
    } catch (error) {
      console.error('Error loading positions:', error)
      toast({
        title: "Error",
        description: "Failed to load positions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClosePosition = async (positionId: string) => {
    setClosingPosition(positionId)
    
    try {
      const success = await positionManager.manualClosePosition(positionId)
      
      if (success) {
        toast({
          title: "Position Closed",
          description: "Position has been closed successfully",
        })
        await loadPositions()
      } else {
        toast({
          title: "Error",
          description: "Failed to close position",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error closing position:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setClosingPosition(null)
    }
  }

  const getPositionStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500'
      case 'closed': return 'bg-gray-500'
      case 'stop_loss_triggered': return 'bg-red-500'
      case 'take_profit_triggered': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600'
    if (pnl < 0) return 'text-red-600'
    return 'text-gray-600'
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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const calculatePnlPercentage = (position: Position) => {
    const totalValue = position.entryPrice * position.size
    return (position.unrealizedPnl / totalValue) * 100
  }

  const calculateDistanceToStopLoss = (position: Position) => {
    if (!position.stopLossPrice) return 0
    const distance = Math.abs(position.currentPrice - position.stopLossPrice)
    return (distance / position.currentPrice) * 100
  }

  const calculateDistanceToTakeProfit = (position: Position) => {
    if (!position.takeProfitPrice) return 0
    const distance = Math.abs(position.takeProfitPrice - position.currentPrice)
    return (distance / position.currentPrice) * 100
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
          <CardDescription>Loading positions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
          <CardDescription>
            {agentId ? 'No active positions for this agent' : 'No active positions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start trading to see your positions here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0)
  const totalValue = positions.reduce((sum, pos) => sum + (pos.entryPrice * pos.size), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Active Positions ({positions.length})
        </CardTitle>
        <CardDescription>
          Monitor your positions with automatic stop loss and take profit
        </CardDescription>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Total P&L</div>
            <div className={`text-lg font-bold ${getPnlColor(totalPnl)}`}>
              {formatCurrency(totalPnl)}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalValue > 0 ? `${((totalPnl / totalValue) * 100).toFixed(2)}%` : '0%'}
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Total Value</div>
            <div className="text-lg font-bold">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-xs text-muted-foreground">
              {positions.length} position{positions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {positions.map((position) => {
            const pnlPercentage = calculatePnlPercentage(position)
            const stopLossDistance = calculateDistanceToStopLoss(position)
            const takeProfitDistance = calculateDistanceToTakeProfit(position)
            
            return (
              <div key={position.id} className="border rounded-lg p-4 space-y-3">
                {/* Position Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getPositionStatusColor(position.status)}>
                      {position.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {position.side === 'long' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-semibold">
                        {position.side.toUpperCase()} {position.symbol}
                      </span>
                    </div>
                  </div>
                  
                  {position.status === 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClosePosition(position.id)}
                      disabled={closingPosition === position.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {closingPosition === position.id ? (
                        "Closing..."
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Close
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Position Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Size</div>
                    <div className="font-medium">{position.size}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Entry Price</div>
                    <div className="font-medium">${formatPrice(position.entryPrice)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Current Price</div>
                    <div className="font-medium">${formatPrice(position.currentPrice)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">P&L</div>
                    <div className={`font-medium ${getPnlColor(position.unrealizedPnl)}`}>
                      {formatCurrency(position.unrealizedPnl)}
                      <span className="text-xs ml-1">
                        ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Risk Management */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Risk Management</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Stop Loss */}
                    {position.stopLossPrice && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-red-500" />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span>Stop Loss</span>
                            <span className="text-red-600">
                              ${formatPrice(position.stopLossPrice)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stopLossDistance.toFixed(2)}% away
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Take Profit */}
                    {position.takeProfitPrice && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-green-500" />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span>Take Profit</span>
                            <span className="text-green-600">
                              ${formatPrice(position.takeProfitPrice)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {takeProfitDistance.toFixed(2)}% away
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Position Timeline */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Opened: {formatTime(position.openTime)}</span>
                  {position.closeTime && (
                    <span>• Closed: {formatTime(position.closeTime)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 