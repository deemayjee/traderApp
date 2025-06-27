"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Brain,
  Zap,
  Target,
  Plus,
  ArrowUp,
  ArrowDown,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { CreateAgentDialog, AIAgent } from "@/components/ai-agents/create-agent-dialog"

// Mock data - replace with real data from your services
const mockAgents: AIAgent[] = [
  {
    id: "agent-1",
    name: "Momentum Master",
    type: "Technical Analysis",
    description: "Trades based on momentum indicators and volume analysis",
    active: true,
    accuracy: 76.8,
    signals: 234,
    lastSignal: "BUY ETH at $2,450",
    custom: true,
    riskTolerance: 70,
    focusAssets: ["ETH", "SOL", "BTC"],
    indicators: ["RSI", "MACD", "Moving Averages"]
  },
  {
    id: "agent-2", 
    name: "Scalp Hunter",
    type: "Technical Analysis",
    description: "High-frequency scalping strategy for quick profits",
    active: false,
    accuracy: 68.2,
    signals: 1456,
    lastSignal: "Training in progress...",
    custom: true,
    riskTolerance: 30,
    focusAssets: ["BTC", "ETH"],
    indicators: ["Bollinger Bands", "Volume"]
  },
  {
    id: "agent-3", 
    name: "DeFi Yield Hunter",
    type: "On-chain Analysis",
    description: "Identifies high-yield opportunities across DeFi protocols",
    active: true,
    accuracy: 84.5,
    signals: 67,
    lastSignal: "YIELD FARM detected: 12.4% APY",
    custom: true,
    riskTolerance: 85,
    focusAssets: ["USDC", "USDT", "DAI"],
    indicators: ["TVL", "Volume", "Liquidity"]
  }
]

// Mock market data
const mockMarketData = [
  { symbol: "BTC", price: 67340, change: 2.4, volume: "1.2B" },
  { symbol: "ETH", price: 2450, change: -1.8, volume: "890M" },
  { symbol: "HYPE", price: 0.85, change: 12.7, volume: "45M" },
  { symbol: "SOL", price: 142, change: 5.2, volume: "320M" }
]

export default function Dashboard() {
  const { user } = useWalletAuth()
  const [agents, setAgents] = useState<AIAgent[]>(mockAgents)
  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [totalPnl, setTotalPnl] = useState(1091.20)
  const [todayPnl, setTodayPnl] = useState(287.45)
  const [openPositions, setOpenPositions] = useState(8)
  const [totalVolume, setTotalVolume] = useState(12450)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      // Could redirect to auth page or show connect wallet modal
      console.log("User not connected")
    }
  }, [user])

  const handleCreateAgent = (newAgent: Omit<AIAgent, "id">) => {
    const agent: AIAgent = {
      ...newAgent,
      id: `agent-${Date.now()}`,
    }
    setAgents(prev => [...prev, agent])
    setShowCreateAgent(false)
  }

  const activeAgents = agents.filter(agent => agent.active)
  const accountValue = 45750.25 // Fixed account value for display
  const portfolioChange = ((totalPnl / accountValue) * 100)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/10">
        <Card className="w-full max-w-lg border-primary/20 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              HyperAgent
            </CardTitle>
            <CardDescription className="text-base">
              Connect your wallet to start autonomous trading with AI
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Link href="/auth/login">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg glow-primary">
                <Zap className="w-5 h-5 mr-2" />
                Connect Wallet
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
      {/* Hero Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-6 py-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    Trading Command Center
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    {activeAgents.length} AI agents actively trading • {openPositions} positions open
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="h-8 px-4 border-green-200 text-green-700 bg-green-50">
                <CheckCircle className="w-4 h-4 mr-2" />
                All Systems Online
              </Badge>
              <Button 
                onClick={() => setShowCreateAgent(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 glow-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Deploy New Agent
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Main Grid Layout */}
        <div className="space-y-6">
          
          {/* Top Section - Portfolio and Quick Stats */}
          <div className="grid grid-cols-12 gap-6">
            {/* Portfolio Overview - Large Card */}
            <div className="col-span-12 lg:col-span-8">
              <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Portfolio Overview
                  </CardTitle>
                  <CardDescription>Your autonomous trading performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Main Portfolio Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-3xl font-bold">${accountValue.toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        {portfolioChange >= 0 ? (
                          <ArrowUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${portfolioChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Today's PnL</p>
                      <p className={`text-3xl font-bold ${todayPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {todayPnl >= 0 ? '+' : ''}${todayPnl.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">24h Volume:</span>
                        <span className="text-sm font-medium">${totalVolume.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-3xl font-bold text-primary">74.2%</p>
                      <Progress value={74.2} className="h-2" />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/ai-agents">
                      <Button variant="outline" className="w-full h-14 flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        <span className="text-xs">Manage Agents</span>
                      </Button>
                    </Link>
                    <Link href="/dashboard/live-trading">
                      <Button variant="outline" className="w-full h-14 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs">Live Trading</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status - Compact */}
            <div className="col-span-12 lg:col-span-4">
              <Card className="border-border/50 h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-col items-center text-center">
                        <span className="text-xs text-muted-foreground mb-1">Hyperliquid API</span>
                        <Badge variant="outline" className="border-green-200 text-green-700 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Online
                        </Badge>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <span className="text-xs text-muted-foreground mb-1">AI Engine</span>
                        <Badge variant="outline" className="border-green-200 text-green-700 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col items-center text-center">
                        <span className="text-xs text-muted-foreground mb-1">Risk Monitor</span>
                        <Badge variant="outline" className="border-green-200 text-green-700 text-xs">
                          <Target className="w-3 h-3 mr-1" />
                          Monitoring
                        </Badge>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <span className="text-xs text-muted-foreground mb-1">Next Rebalance</span>
                        <Badge variant="outline" className="border-blue-200 text-blue-700 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          4m 32s
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Market Overview */}
                  <div className="pt-3 border-t border-border/30">
                    <div className="grid grid-cols-2 gap-3">
                      {mockMarketData.slice(0, 4).map((market) => (
                        <div key={market.symbol} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{market.symbol}</span>
                          <div className={`flex items-center gap-1 ${market.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {market.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            <span className="text-xs font-medium">{market.change >= 0 ? '+' : ''}{market.change}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Active Agents Grid - Now directly below without spacing */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Active AI Agents</CardTitle>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  {activeAgents.length} Active
                </Badge>
              </div>
              <CardDescription>Your autonomous trading agents and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {agents.map((agent) => (
                  <Link key={agent.id} href={`/ai-agents/${agent.id}`}>
                    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                      agent.active 
                        ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent' 
                        : 'border-border/50 opacity-75'
                    }`}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm truncate">{agent.name}</span>
                          </div>
                          <Badge variant={agent.active ? "default" : "secondary"} className="text-xs">
                            {agent.active ? "Live" : "Paused"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Accuracy</span>
                            <span className="font-medium">{agent.accuracy}%</span>
                          </div>
                          <Progress value={agent.accuracy} className="h-1.5" />
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Signals</span>
                            <span>{agent.signals}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {agent.lastSignal}
                          </p>
                        </div>
                        
                        <div className="flex gap-1">
                          {agent.focusAssets.slice(0, 3).map((asset) => (
                            <Badge key={asset} variant="outline" className="text-xs px-2 py-0">
                              {asset}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                
                {/* Create New Agent Card */}
                <Card 
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-dashed border-2 border-primary/30"
                  onClick={() => setShowCreateAgent(true)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full space-y-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Create New Agent</p>
                      <p className="text-xs text-muted-foreground">Deploy autonomous AI trader</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateAgentDialog
        open={showCreateAgent}
        onOpenChange={setShowCreateAgent}
        onCreateAgent={handleCreateAgent}
      />
    </div>
  )
}
