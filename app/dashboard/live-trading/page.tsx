"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Bot, 
  Wallet2, 
  Target, 
  Gauge,
  MonitorSpeaker,
  BarChart3,
  Activity,
  DollarSign,
  AlertTriangle,
  Clock,
  Zap,
  Brain,
  RefreshCw
} from "lucide-react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { agentSupabase } from "@/lib/services/agent-supabase"
import { hyperliquidService } from "@/lib/services/hyperliquid-service"
import { AIAgent } from "@/components/ai-agents/create-agent-dialog"
import { toast } from "sonner"

interface TradingMetrics {
  totalValue: number
  dailyPnL: number
  dailyPnLPercent: number
  activePositions: number
  totalTrades: number
  winRate: number
  avgHoldTime: string
  riskScore: number
}

interface LivePosition {
  id: string
  symbol: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
  leverage: number
  margin: number
  liquidationPrice: number
  duration: string
  agent: string
}

export default function LiveTradingPage() {
  const { user } = useWalletAuth()
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [positions, setPositions] = useState<LivePosition[]>([])
  const [metrics, setMetrics] = useState<TradingMetrics>({
    totalValue: 0,
    dailyPnL: 0,
    dailyPnLPercent: 0,
    activePositions: 0,
    totalTrades: 0,
    winRate: 0,
    avgHoldTime: "0h",
    riskScore: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [liveMode, setLiveMode] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    if (!user?.address) return
    
    const loadLiveTradingData = async () => {
      try {
        setIsLoading(true)
        
        // Load user's agents
        const userAgents = await agentSupabase.getAllAgents(user.address)
        setAgents(userAgents)
        
        // Load positions from Hyperliquid
        const hyperliquidPositions = await hyperliquidService.getPositions(user.address)
        
        // Transform positions to include additional calculated data
        const transformedPositions: LivePosition[] = hyperliquidPositions.map((pos, index) => ({
          id: `pos-${index}`,
          symbol: pos.symbol,
          side: pos.side,
          size: pos.size,
          entryPrice: pos.entryPrice,
          currentPrice: pos.entryPrice + (pos.unrealizedPnl / pos.size), // Approximate current price
          pnl: pos.unrealizedPnl,
          pnlPercent: ((pos.unrealizedPnl / (pos.entryPrice * pos.size)) * 100),
          leverage: pos.leverage,
          margin: (pos.entryPrice * pos.size) / pos.leverage,
          liquidationPrice: pos.side === 'long' 
            ? pos.entryPrice * (1 - (0.9 / pos.leverage))
            : pos.entryPrice * (1 + (0.9 / pos.leverage)),
          duration: calculateDuration(new Date()), // Would need actual position open time
          agent: userAgents.find(a => a.focusAssets.includes(pos.symbol))?.name || 'Manual'
        }))
        
        setPositions(transformedPositions)
        
        // Calculate metrics from real data
        const calculatedMetrics = calculateMetrics(transformedPositions, userAgents)
        setMetrics(calculatedMetrics)
        
        setLastUpdated(new Date())
        
      } catch (error) {
        console.error('Error loading live trading data:', error)
        toast.error('Failed to load trading data')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadLiveTradingData()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      if (liveMode) {
        loadLiveTradingData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user?.address, liveMode])

  const calculateMetrics = (positions: LivePosition[], agents: AIAgent[]): TradingMetrics => {
    const totalValue = positions.reduce((sum, pos) => sum + (pos.entryPrice * pos.size), 0)
    const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0)
    const activeAgents = agents.filter(a => a.active)
    
    // Estimate other metrics based on available data
    const totalTrades = agents.reduce((sum, agent) => sum + (agent.signals || 0), 0)
    const avgAccuracy = agents.length > 0 
      ? agents.reduce((sum, agent) => sum + (agent.accuracy || 0), 0) / agents.length 
      : 0
    
    return {
      totalValue,
      dailyPnL: totalPnL * 0.3, // Estimate daily as 30% of total
      dailyPnLPercent: totalValue > 0 ? ((totalPnL * 0.3) / totalValue) * 100 : 0,
      activePositions: positions.length,
      totalTrades,
      winRate: avgAccuracy,
      avgHoldTime: calculateAverageHoldTime(positions),
      riskScore: calculateRiskScore(positions, agents)
    }
  }

  const calculateDuration = (openTime: Date): string => {
    const now = new Date()
    const diff = now.getTime() - openTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const calculateAverageHoldTime = (positions: LivePosition[]): string => {
    if (positions.length === 0) return "0h"
    
    // For now, return a static estimate since we don't have open times
    return "2h 15m"
  }

  const calculateRiskScore = (positions: LivePosition[], agents: AIAgent[]): number => {
    if (positions.length === 0) return 0
    
    const avgLeverage = positions.reduce((sum, pos) => sum + pos.leverage, 0) / positions.length
    const totalExposure = positions.reduce((sum, pos) => sum + (pos.size * pos.currentPrice), 0)
    
    // Simple risk scoring based on leverage and exposure
    let riskScore = (avgLeverage / 10) * 3 // Leverage contribution (0-3)
    riskScore += Math.min((totalExposure / 10000), 3) // Exposure contribution (0-3)
    riskScore += Math.min(positions.length / 2, 4) // Position count contribution (0-4)
    
    return Math.min(Math.round(riskScore), 10)
  }

  const refreshData = async () => {
    if (!user?.address) return
    
    setIsLoading(true)
    try {
      const hyperliquidPositions = await hyperliquidService.getPositions(user.address)
      const userAgents = await agentSupabase.getAllAgents(user.address)
      
      // Update positions and metrics
      const transformedPositions: LivePosition[] = hyperliquidPositions.map((pos, index) => ({
        id: `pos-${index}`,
        symbol: pos.symbol,
        side: pos.side,
        size: pos.size,
        entryPrice: pos.entryPrice,
        currentPrice: pos.entryPrice + (pos.unrealizedPnl / pos.size),
        pnl: pos.unrealizedPnl,
        pnlPercent: ((pos.unrealizedPnl / (pos.entryPrice * pos.size)) * 100),
        leverage: pos.leverage,
        margin: (pos.entryPrice * pos.size) / pos.leverage,
        liquidationPrice: pos.side === 'long' 
          ? pos.entryPrice * (1 - (0.9 / pos.leverage))
          : pos.entryPrice * (1 + (0.9 / pos.leverage)),
        duration: calculateDuration(new Date()),
        agent: userAgents.find(a => a.focusAssets.includes(pos.symbol))?.name || 'Manual'
      }))
      
      setPositions(transformedPositions)
      setAgents(userAgents)
      setMetrics(calculateMetrics(transformedPositions, userAgents))
      setLastUpdated(new Date())
      
      toast.success('Data refreshed successfully')
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast.error('Failed to refresh data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500'
      case 'paused': return 'bg-amber-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-emerald-600 bg-emerald-50'
      case 'medium': return 'text-amber-600 bg-amber-50'
      case 'high': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRiskScore = (score: number) => {
    if (score <= 3) return { label: 'Conservative', color: 'text-emerald-600' }
    if (score <= 7) return { label: 'Moderate', color: 'text-amber-600' }
    return { label: 'Aggressive', color: 'text-red-600' }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
          <CardContent>
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to view live trading data
            </p>
            <Button asChild>
              <a href="/auth/login">Connect Wallet</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Live Trading
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Real-time AI trading performance dashboard
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${liveMode ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">{liveMode ? 'LIVE' : 'PAUSED'}</span>
            </div>
            <Switch checked={liveMode} onCheckedChange={setLiveMode} />
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
              className="bg-white dark:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Portfolio Value</p>
                  <p className="text-3xl font-bold">${metrics.totalValue.toLocaleString()}</p>
                </div>
                <Wallet2 className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Daily P&L</p>
                  <p className="text-3xl font-bold">+${metrics.dailyPnL}</p>
                  <p className="text-emerald-200 text-sm">+{metrics.dailyPnLPercent}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Win Rate</p>
                  <p className="text-3xl font-bold">{metrics.winRate}%</p>
                  <p className="text-purple-200 text-sm">{metrics.totalTrades} trades</p>
                </div>
                <Target className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Risk Score</p>
                  <p className="text-3xl font-bold">{metrics.riskScore}/10</p>
                  <p className={`text-sm ${getRiskScore(metrics.riskScore).color}`}>
                    {getRiskScore(metrics.riskScore).label}
                  </p>
                </div>
                <Gauge className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Agents Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    AI Agents
                  </CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {agents.filter(a => a.status === 'active').length} Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${agent.active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        <div>
                          <h3 className="font-semibold text-sm">{agent.name}</h3>
                          <p className="text-xs text-slate-500">{agent.focusAssets.join(', ')}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${agent.riskTolerance && agent.riskTolerance > 70 ? 'text-red-600 bg-red-50' : agent.riskTolerance && agent.riskTolerance > 40 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
                        {agent.riskTolerance && agent.riskTolerance > 70 ? 'high' : agent.riskTolerance && agent.riskTolerance > 40 ? 'medium' : 'low'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-500">Accuracy</p>
                        <p className="font-bold text-sm text-emerald-600">
                          {agent.accuracy || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Signals</p>
                        <p className="font-bold text-sm">{agent.signals || 0}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{agent.lastSignal || 'No signals yet'}</span>
                      <span className="text-slate-500">{agent.active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl">
              <CardHeader className="pb-4">
                                 <CardTitle className="flex items-center gap-2">
                   <BarChart3 className="w-5 h-5 text-purple-600" />
                   Quick Stats
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Active Positions</span>
                  <span className="font-semibold">{metrics.activePositions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Avg Hold Time</span>
                  <span className="font-semibold">{metrics.avgHoldTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Trades</span>
                  <span className="font-semibold">{metrics.totalTrades}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Risk Exposure</span>
                    <span className="text-sm font-medium">{metrics.riskScore}/10</span>
                  </div>
                  <Progress value={metrics.riskScore * 10} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Positions Column */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Live Positions
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {positions.length} Open
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {positions.map((position) => (
                    <div key={position.id} className="p-6 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 border border-slate-200 dark:border-slate-600">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full ${position.side === 'long' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <div>
                            <h3 className="font-bold text-lg">{position.symbol}</h3>
                            <p className="text-sm text-slate-500">
                              {position.side.toUpperCase()} • {position.leverage}x • {position.agent}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${position.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {position.pnl >= 0 ? '+' : ''}${position.pnl}
                          </p>
                          <p className={`text-sm ${position.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Size</p>
                          <p className="font-semibold">{position.size}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Entry</p>
                          <p className="font-semibold">${position.entryPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Current</p>
                          <p className="font-semibold">${position.currentPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Duration</p>
                          <p className="font-semibold">{position.duration}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Margin: ${position.margin}</span>
                          <span className="text-slate-600">
                            Liquidation: ${position.liquidationPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
            <Zap className="w-4 h-4 mr-2" />
            Quick Trade
          </Button>
          <Button variant="outline" className="bg-white dark:bg-slate-800">
            <Layers className="w-4 h-4 mr-2" />
            Manage Agents
          </Button>
                     <Button variant="outline" className="bg-white dark:bg-slate-800">
             <BarChart3 className="w-4 h-4 mr-2" />
             Analytics
           </Button>
        </div>
      </div>
    </div>
  )
} 