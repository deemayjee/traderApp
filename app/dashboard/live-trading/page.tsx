"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Bot, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  Play,
  Pause,
  Square,
  Settings,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart,
  Target,
  Shield,
  Zap,
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  ExternalLink,
  Wallet2,
  Timer,
  Layers,
  MonitorSpeaker,
  Gauge
} from "lucide-react"
import { hyperliquidService, HyperliquidPosition, HyperliquidOrder } from "@/lib/services/hyperliquid-service"
import { useWalletAuth } from "@/components/auth/wallet-context"

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

interface AgentCard {
  id: string
  name: string
  status: 'active' | 'paused' | 'error'
  pnl: number
  pnlPercent: number
  trades: number
  winRate: number
  pair: string
  lastAction: string
  timeAgo: string
  riskLevel: 'low' | 'medium' | 'high'
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
  const [metrics, setMetrics] = useState<TradingMetrics>({
    totalValue: 12450.80,
    dailyPnL: 342.15,
    dailyPnLPercent: 2.83,
    activePositions: 7,
    totalTrades: 23,
    winRate: 73.9,
    avgHoldTime: '4m 32s',
    riskScore: 6.2
  })

  const [agents, setAgents] = useState<AgentCard[]>([
    {
      id: '1',
      name: 'Alpha Scalper',
      status: 'active',
      pnl: 156.80,
      pnlPercent: 3.2,
      trades: 8,
      winRate: 87.5,
      pair: 'ETH-USD',
      lastAction: 'LONG @ $2,524',
      timeAgo: '2m',
      riskLevel: 'medium'
    },
    {
      id: '2',
      name: 'Momentum Hunter',
      status: 'active',
      pnl: 89.45,
      pnlPercent: 1.8,
      trades: 5,
      winRate: 80.0,
      pair: 'BTC-USD',
      lastAction: 'SHORT @ $43,200',
      timeAgo: '5m',
      riskLevel: 'high'
    },
    {
      id: '3',
      name: 'Range Master',
      status: 'paused',
      pnl: -23.60,
      pnlPercent: -0.5,
      trades: 3,
      winRate: 33.3,
      pair: 'SOL-USD',
      lastAction: 'CLOSED @ $98.50',
      timeAgo: '12m',
      riskLevel: 'low'
    },
    {
      id: '4',
      name: 'Arbitrage Pro',
      status: 'active',
      pnl: 67.30,
      pnlPercent: 1.4,
      trades: 12,
      winRate: 91.7,
      pair: 'AVAX-USD',
      lastAction: 'LONG @ $24.80',
      timeAgo: '1m',
      riskLevel: 'low'
    }
  ])

  const [positions, setPositions] = useState<LivePosition[]>([
    {
      id: '1',
      symbol: 'ETH-USD',
      side: 'long',
      size: 2.5,
      entryPrice: 2520,
      currentPrice: 2534,
      pnl: 35.00,
      pnlPercent: 1.39,
      leverage: 3,
      margin: 2100,
      liquidationPrice: 2180,
      duration: '3m 45s',
      agent: 'Alpha Scalper'
    },
    {
      id: '2',
      symbol: 'BTC-USD',
      side: 'short',
      size: 0.15,
      entryPrice: 43200,
      currentPrice: 43150,
      pnl: 7.50,
      pnlPercent: 0.12,
      leverage: 5,
      margin: 1296,
      liquidationPrice: 45360,
      duration: '7m 12s',
      agent: 'Momentum Hunter'
    },
    {
      id: '3',
      symbol: 'AVAX-USD',
      side: 'long',
      size: 50,
      entryPrice: 24.80,
      currentPrice: 24.95,
      pnl: 7.50,
      pnlPercent: 0.60,
      leverage: 2,
      margin: 620,
      liquidationPrice: 18.60,
      duration: '1m 30s',
      agent: 'Arbitrage Pro'
    }
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [liveMode, setLiveMode] = useState(true)
  const { user } = useWalletAuth()

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
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${liveMode ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">{liveMode ? 'LIVE' : 'PAUSED'}</span>
            </div>
            <Switch checked={liveMode} onCheckedChange={setLiveMode} />
            <Button variant="outline" className="bg-white dark:bg-slate-800">
              <MonitorSpeaker className="w-4 h-4 mr-2" />
              Stream
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
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                        <div>
                          <h3 className="font-semibold text-sm">{agent.name}</h3>
                          <p className="text-xs text-slate-500">{agent.pair}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getRiskColor(agent.riskLevel)}`}>
                        {agent.riskLevel}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-500">P&L</p>
                        <p className={`font-bold text-sm ${agent.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {agent.pnl >= 0 ? '+' : ''}${agent.pnl}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Win Rate</p>
                        <p className="font-bold text-sm">{agent.winRate}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{agent.lastAction}</span>
                      <span className="text-slate-500">{agent.timeAgo} ago</span>
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