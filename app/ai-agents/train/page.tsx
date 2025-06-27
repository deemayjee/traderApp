"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Brain, 
  Loader2, 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3,
  Clock,
  DollarSign,
  Shield,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Settings,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { agentSupabase } from '@/lib/services/agent-supabase'
import { useWalletAuth } from '@/components/auth/wallet-context'
import type { AIAgent } from '@/components/ai-agents/create-agent-dialog'

interface TrainingSession {
  id: string
  agentId: string
  status: 'idle' | 'training' | 'completed' | 'failed'
  progress: number
  metrics: {
    winRate: number
    profitFactor: number
    sharpeRatio: number
    maxDrawdown: number
    totalTrades: number
    currentEpoch: number
    totalEpochs: number
  }
  startTime?: string
  endTime?: string
  duration?: string
}

export default function TrainingPage() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const { user, isAuthenticated } = useWalletAuth()

  useEffect(() => {
    const loadData = async () => {
      if (!user?.address) return
      
      try {
        const userAgents = await agentSupabase.getAllAgents(user.address)
        setAgents(userAgents)
        
        // Mock training sessions data
        const mockSessions: TrainingSession[] = userAgents.map(agent => ({
          id: `session_${agent.id}`,
          agentId: agent.id,
          status: Math.random() > 0.7 ? 'training' : Math.random() > 0.5 ? 'completed' : 'idle',
          progress: Math.floor(Math.random() * 100),
          metrics: {
            winRate: 55 + Math.random() * 25,
            profitFactor: 1.2 + Math.random() * 0.8,
            sharpeRatio: 0.8 + Math.random() * 1.2,
            maxDrawdown: 5 + Math.random() * 15,
            totalTrades: Math.floor(Math.random() * 500) + 100,
            currentEpoch: Math.floor(Math.random() * 80) + 20,
            totalEpochs: 100
          },
          startTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          duration: `${Math.floor(Math.random() * 120) + 30} min`
        }))
        
        setTrainingSessions(mockSessions)
        if (userAgents.length > 0) {
          setSelectedAgent(userAgents[0])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.address])

  const getStatusIcon = (status: TrainingSession['status']) => {
    switch (status) {
      case 'training':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: TrainingSession['status']) => {
    const variants = {
      idle: 'secondary',
      training: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const

    const colors = {
      idle: 'bg-gray-100 text-gray-700',
      training: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700'
    }

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Connect your wallet to access AI agent training features.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <Brain className="mr-2 h-4 w-4" />
                Connect Wallet
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>No Agents Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Create your first AI trading agent to start training and optimization.
            </p>
            <Button asChild className="w-full">
              <Link href="/ai-agents">
                <Brain className="mr-2 h-4 w-4" />
                Create Your First Agent
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedSession = trainingSessions.find(s => s.agentId === selectedAgent?.id)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Agent Training</h1>
          <p className="text-muted-foreground">
            Train and optimize your AI trading agents for better performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedAgent?.id || ''}
            onValueChange={(value) => {
              const agent = agents.find(a => a.id === value)
              setSelectedAgent(agent || null)
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild variant="outline">
            <Link href="/ai-agents">
              <Brain className="mr-2 h-4 w-4" />
              Manage Agents
            </Link>
          </Button>
        </div>
      </div>

      {selectedAgent && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Agent Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {selectedAgent.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Strategy</p>
                    <p className="text-lg font-semibold">{selectedAgent.strategy || 'Trend Following'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      {selectedAgent.isActive ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Trading Pairs</p>
                    <p className="text-lg font-semibold">{selectedAgent.tradingPairs?.length || 0} pairs</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
                    <p className="text-lg font-semibold">{selectedAgent.riskTolerance || 50}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                      <p className="text-2xl font-bold text-green-600">
                        +${selectedAgent.totalPnl?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                      <p className="text-2xl font-bold">
                        {selectedAgent.winRate?.toFixed(1) || '0.0'}%
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                      <p className="text-2xl font-bold">
                        {selectedAgent.totalTrades || 0}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Max Position</p>
                      <p className="text-2xl font-bold">
                        ${selectedAgent.maxPositionSize || 0}
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Training Status */}
            {selectedSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Latest Training Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(selectedSession.status)}
                      <div>
                        <p className="font-medium">Training Session #{selectedSession.id.slice(-6)}</p>
                        <p className="text-sm text-muted-foreground">
                          Started {new Date(selectedSession.startTime || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(selectedSession.status)}
                  </div>
                  
                  {selectedSession.status === 'training' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{selectedSession.progress}%</span>
                      </div>
                      <Progress value={selectedSession.progress} />
                      <p className="text-sm text-muted-foreground">
                        Epoch {selectedSession.metrics.currentEpoch} of {selectedSession.metrics.totalEpochs}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                      <p className="text-lg font-semibold">{selectedSession.metrics.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Profit Factor</p>
                      <p className="text-lg font-semibold">{selectedSession.metrics.profitFactor.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sharpe Ratio</p>
                      <p className="text-lg font-semibold">{selectedSession.metrics.sharpeRatio.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                      <p className="text-lg font-semibold">{selectedSession.metrics.maxDrawdown.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    {selectedSession.status === 'idle' && (
                      <Button asChild>
                        <Link href={`/ai-agents/${selectedAgent.id}/train`}>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Start Training
                        </Link>
                      </Button>
                    )}
                    {selectedSession.status === 'training' && (
                      <Button variant="outline">
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Pause Training
                      </Button>
                    )}
                    <Button variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Training
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/ai-agents/${selectedAgent.id}/train`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle>Training Configuration</CardTitle>
                <p className="text-muted-foreground">
                  Configure training parameters for {selectedAgent.name}
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Advanced Training Interface</h3>
                  <p className="text-muted-foreground mb-6">
                    Access detailed training configuration and monitoring tools
                  </p>
                  <Button asChild>
                    <Link href={`/ai-agents/${selectedAgent.id}/train`}>
                      <Zap className="mr-2 h-4 w-4" />
                      Open Training Interface
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Detailed Analytics Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Advanced performance metrics and charts will be available here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Training Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Advanced Settings</h3>
                  <p className="text-muted-foreground">
                    Global training preferences and optimization settings
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
} 