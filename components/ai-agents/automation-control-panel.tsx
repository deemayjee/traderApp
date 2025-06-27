"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Play, 
  Square, 
  Settings, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  DollarSign,
  Zap,
  Brain
} from "lucide-react"
import { aiTradingAutomation, AutomationConfig, TradingSignal } from "@/lib/services/ai-trading-automation"
import { agentSupabase } from "@/lib/services/agent-supabase"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { toast } from "@/hooks/use-toast"
import { PositionsPanel } from "./positions-panel"

export function AutomationControlPanel() {
  const { user } = useWalletAuth()
  const [isAutomationRunning, setIsAutomationRunning] = useState(false)
  const [automationStatus, setAutomationStatus] = useState({
    isRunning: false,
    activeAgents: 0,
    enabledAgents: 0,
    positionMonitoring: {
      isMonitoring: false,
      activePositions: 0,
      totalPnl: 0
    }
  })
  const [recentSignals, setRecentSignals] = useState<TradingSignal[]>([])
  const [config, setConfig] = useState<AutomationConfig>({
    enabled: false,
    maxPositionSize: 1000,
    maxDailyLoss: 500,
    maxOpenPositions: 3,
    minConfidenceLevel: 70,
    allowedSymbols: ['BTC-USD', 'ETH-USD', 'SOL-USD'],
    tradingHours: {
      start: '00:00',
      end: '23:59',
      timezone: 'UTC'
    }
  })

  useEffect(() => {
    // Update status every 5 seconds
    const statusInterval = setInterval(() => {
      const status = aiTradingAutomation.getAutomationStatus()
      setAutomationStatus(status)
      setIsAutomationRunning(status.isRunning)

      // Get recent signals
      const signals = aiTradingAutomation.getLastSignals()
      setRecentSignals(signals.slice(0, 10))
    }, 5000)

    return () => clearInterval(statusInterval)
  }, [])

  const handleStartAutomation = async () => {
    if (!user?.address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    try {
      await aiTradingAutomation.startAutomation(user.address)
      setIsAutomationRunning(true)
      toast({
        title: "Automation Started",
        description: "AI trading automation is now active",
      })
    } catch (error) {
      console.error('Error starting automation:', error)
      toast({
        title: "Failed to Start",
        description: "Could not start automation",
        variant: "destructive"
      })
    }
  }

  const handleStopAutomation = async () => {
    try {
      await aiTradingAutomation.stopAutomation()
      setIsAutomationRunning(false)
      toast({
        title: "Automation Stopped",
        description: "AI trading automation has been stopped",
      })
    } catch (error) {
      console.error('Error stopping automation:', error)
      toast({
        title: "Failed to Stop",
        description: "Could not stop automation",
        variant: "destructive"
      })
    }
  }

  const handleConfigChange = (field: keyof AutomationConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getSignalBadgeColor = (action: string) => {
    switch (action) {
      case 'buy': return 'default'
      case 'sell': return 'destructive'
      case 'close': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isAutomationRunning ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-2xl font-bold">{isAutomationRunning ? 'ACTIVE' : 'STOPPED'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStatus.enabledAgents}</div>
            <p className="text-xs text-muted-foreground">
              of {automationStatus.activeAgents} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signals</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentSignals.length}</div>
            <p className="text-xs text-muted-foreground">
              last 30 seconds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStatus.positionMonitoring.activePositions}</div>
            <p className="text-xs text-muted-foreground">
              {automationStatus.positionMonitoring.totalPnl >= 0 ? '+' : ''}
              {formatCurrency(automationStatus.positionMonitoring.totalPnl)} P&L
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Control Panel */}
      <Tabs defaultValue="control" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="control">Control</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="control">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Automation Control
              </CardTitle>
              <CardDescription>
                Start or stop AI trading automation for your agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!user?.address && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Wallet Required</AlertTitle>
                  <AlertDescription>
                    Please connect your wallet to enable trading automation.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {isAutomationRunning ? 'Automation Active' : 'Automation Stopped'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isAutomationRunning 
                      ? `${automationStatus.enabledAgents} agents are actively trading`
                      : 'AI agents are not making trades automatically'
                    }
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const agents = await agentSupabase.getAllAgents()
                        if (agents.length > 0) {
                          const testResult = await aiTradingAutomation.testSignalGeneration(agents[0].id, user?.address)
                          console.log('🧪 Signal generation test results:', testResult)
                          toast({
                            title: "Signal Test Complete",
                            description: `Generated ${testResult.signals.length} signals. Check console for details.`
                          })
                        } else {
                          toast({
                            title: "No Agents",
                            description: "Create an agent first to test signal generation",
                            variant: "destructive"
                          })
                        }
                      } catch (error) {
                        console.error('Test failed:', error)
                        toast({
                          title: "Test Failed",
                          description: "Check console for error details",
                          variant: "destructive"
                        })
                      }
                    }}
                    disabled={!user?.address}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    Test Signals
                  </Button>

                  <Button
                    size="lg"
                    onClick={isAutomationRunning ? handleStopAutomation : handleStartAutomation}
                    disabled={!user?.address}
                    className={isAutomationRunning ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    {isAutomationRunning ? (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        Stop Automation
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Automation
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Quick Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Active Agents:</span>
                      <span className="font-medium">{automationStatus.enabledAgents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Max Position Size:</span>
                      <span className="font-medium">{formatCurrency(config.maxPositionSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Daily Loss Limit:</span>
                      <span className="font-medium">{formatCurrency(config.maxDailyLoss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Min Confidence:</span>
                      <span className="font-medium">{config.minConfidenceLevel}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Trading Hours</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Start Time:</span>
                      <span className="font-medium">{config.tradingHours.start}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">End Time:</span>
                      <span className="font-medium">{config.tradingHours.end}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Timezone:</span>
                      <span className="font-medium">{config.tradingHours.timezone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Current Status:</span>
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        24/7 Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation Settings
              </CardTitle>
              <CardDescription>
                Configure risk limits and trading parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxPositionSize">Max Position Size ($)</Label>
                    <Input
                      id="maxPositionSize"
                      type="number"
                      value={config.maxPositionSize}
                      onChange={(e) => handleConfigChange('maxPositionSize', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxDailyLoss">Max Daily Loss ($)</Label>
                    <Input
                      id="maxDailyLoss"
                      type="number"
                      value={config.maxDailyLoss}
                      onChange={(e) => handleConfigChange('maxDailyLoss', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxOpenPositions">Max Open Positions</Label>
                    <Input
                      id="maxOpenPositions"
                      type="number"
                      value={config.maxOpenPositions}
                      onChange={(e) => handleConfigChange('maxOpenPositions', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="minConfidenceLevel">Min Confidence Level (%)</Label>
                    <Input
                      id="minConfidenceLevel"
                      type="number"
                      min="0"
                      max="100"
                      value={config.minConfidenceLevel}
                      onChange={(e) => handleConfigChange('minConfidenceLevel', parseInt(e.target.value))}
                    />
                    <Progress value={config.minConfidenceLevel} className="mt-2" />
                  </div>

                  <div className="space-y-2">
                    <Label>Trading Hours</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="time"
                        value={config.tradingHours.start}
                        onChange={(e) => handleConfigChange('tradingHours', {
                          ...config.tradingHours,
                          start: e.target.value
                        })}
                      />
                      <Input
                        type="time"
                        value={config.tradingHours.end}
                        onChange={(e) => handleConfigChange('tradingHours', {
                          ...config.tradingHours,
                          end: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Allowed Symbols</Label>
                    <div className="flex flex-wrap gap-2">
                      {config.allowedSymbols.map(symbol => (
                        <Badge key={symbol} variant="secondary">
                          {symbol}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Recent Trading Signals
              </CardTitle>
              <CardDescription>
                Live signals generated by your AI agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentSignals.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No recent signals</p>
                  <p className="text-sm text-muted-foreground">
                    {isAutomationRunning ? 'Waiting for agents to generate signals...' : 'Start automation to see signals'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSignals.map((signal, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant={getSignalBadgeColor(signal.action)}>
                          {signal.action.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-semibold">{signal.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            Size: {signal.size} | Confidence: {signal.confidence}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {signal.reasoning}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(signal.timestamp).toLocaleTimeString()}
                        </p>
                        <Progress value={signal.confidence} className="w-20 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions">
          <PositionsPanel />
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-Time Monitoring
              </CardTitle>
              <CardDescription>
                Monitor automation performance and system health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Monitoring Dashboard</AlertTitle>
                  <AlertDescription>
                    Real-time monitoring of agent performance, risk metrics, and system status.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">API Connection:</span>
                          <Badge variant="default">Connected</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">WebSocket:</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Database:</span>
                          <Badge variant="default">Online</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Risk Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Daily P&L:</span>
                          <Badge variant="outline">Within Limits</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Open Positions:</span>
                          <Badge variant="outline">Normal</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Risk Level:</span>
                          <Badge variant="outline">Low</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 