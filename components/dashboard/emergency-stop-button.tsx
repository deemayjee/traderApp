"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  StopCircle, 
  Shield, 
  Activity,
  DollarSign,
  TrendingDown
} from "lucide-react"
import { aiTradingAutomation } from "@/lib/services/ai-trading-automation"
import { hyperliquidService } from "@/lib/services/hyperliquid-service"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { toast } from "@/hooks/use-toast"

interface EmergencyStopButtonProps {
  className?: string
}

export function EmergencyStopButton({ className = "" }: EmergencyStopButtonProps) {
  const { user } = useWalletAuth()
  const [isStopping, setIsStopping] = useState(false)
  const [riskMetrics, setRiskMetrics] = useState({
    activeAgents: 0,
    openPositions: 0,
    totalExposure: 0,
    dailyPnL: 0
  })

  const handleEmergencyStop = async () => {
    if (!user?.address) {
      toast({
        title: "Error",
        description: "Wallet not connected",
        variant: "destructive"
      })
      return
    }

    setIsStopping(true)

    try {
      // 1. Stop all automation
      await aiTradingAutomation.stopAutomation()

      // 2. Get current positions
      const positions = await hyperliquidService.getPositions(user.address)

      // 3. Close all open positions (if any)
      for (const position of positions) {
        if (position.size > 0) {
          try {
            await hyperliquidService.placeOrder({
              symbol: position.symbol,
              side: position.side === 'long' ? 'sell' : 'buy',
              orderType: 'Market',
              size: position.size,
              reduceOnly: true
            }, user.address)
          } catch (error) {
            console.error(`Failed to close position ${position.symbol}:`, error)
          }
        }
      }

      toast({
        title: "Emergency Stop Activated",
        description: `Stopped automation and closed ${positions.length} positions`,
      })

    } catch (error) {
      console.error('Emergency stop failed:', error)
      toast({
        title: "Emergency Stop Failed",
        description: "Please manually close positions and check automation status",
        variant: "destructive"
      })
    } finally {
      setIsStopping(false)
    }
  }

  return (
    <Card className={`border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100/50 shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
          <Shield className="h-4 w-4 text-slate-600" />
          Emergency Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Status */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Active Agents:</span>
            <Badge variant="outline" className="text-xs">
              {riskMetrics.activeAgents}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Open Positions:</span>
            <Badge variant="outline" className="text-xs">
              {riskMetrics.openPositions}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Exposure:</span>
            <Badge variant="outline" className="text-xs">
              ${riskMetrics.totalExposure.toFixed(0)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Daily P&L:</span>
            <Badge 
              variant={riskMetrics.dailyPnL >= 0 ? "default" : "destructive"} 
              className="text-xs"
            >
              {riskMetrics.dailyPnL >= 0 ? '+' : ''}${riskMetrics.dailyPnL.toFixed(0)}
            </Badge>
          </div>
        </div>

        {/* Emergency Stop Button */}
        <Button
          onClick={handleEmergencyStop}
          disabled={isStopping || !user?.address}
          variant="destructive"
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          {isStopping ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Stopping All Trading...
            </>
          ) : (
            <>
              <StopCircle className="mr-2 h-4 w-4" />
              EMERGENCY STOP
            </>
          )}
        </Button>

        {/* Warning */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-3 w-3 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800">
            This will immediately stop all AI agents and attempt to close open positions using market orders.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
} 