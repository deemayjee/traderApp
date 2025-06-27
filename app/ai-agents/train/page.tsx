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
  AlertTriangle,
  Play,
  Pause as PauseIcon
} from 'lucide-react'
import Link from 'next/link'
import { agentSupabase } from '@/lib/services/agent-supabase'
import { useWalletAuth } from '@/components/auth/wallet-context'
import type { AIAgent } from '@/components/ai-agents/create-agent-dialog'
import { TrainingConfig } from "@/components/ai-agents/training-config"
import { TrainingMonitor } from "@/components/ai-agents/training-monitor"
import { hyperliquidService } from "@/lib/services/hyperliquid-service"
import { toast } from "sonner"

interface TrainingSession {
  id: string
  agentId: string
  agentName: string
  status: 'running' | 'completed' | 'failed' | 'queued'
  accuracy: number
  epochs: number
  currentEpoch: number
  loss: number
  backtestPnL: number
  winRate: number
  startTime: string
  endTime?: string
  dataSize: number
  strategy: string
}

interface TrainingMetrics {
  totalSessions: number
  activeSessions: number
  averageAccuracy: number
  successRate: number
  totalAgents: number
  trainedAgents: number
}

export default function TrainingPage() {
  const { user } = useWalletAuth()
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [showTrainingConfig, setShowTrainingConfig] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<TrainingMetrics>({
    totalSessions: 0,
    activeSessions: 0,
    averageAccuracy: 0,
    successRate: 0,
    totalAgents: 0,
    trainedAgents: 0
  })

  useEffect(() => {
    if (!user?.address) return
    
    const loadTrainingData = async () => {
      try {
        setIsLoading(true)
        
        // Load user's agents
        const userAgents = await agentSupabase.getAllAgents(user.address)
        setAgents(userAgents)
        
        // Generate training sessions from agents
        const sessions = await generateTrainingSessions(userAgents)
        setTrainingSessions(sessions)
        
        // Calculate metrics
        const calculatedMetrics = calculateTrainingMetrics(sessions, userAgents)
        setMetrics(calculatedMetrics)
        
      } catch (error) {
        console.error('Error loading training data:', error)
        toast.error('Failed to load training data')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTrainingData()
  }, [user?.address])

  const generateTrainingSessions = async (agents: AIAgent[]): Promise<TrainingSession[]> => {
    // For now, generate mock sessions based on agents
    // In a real implementation, this would query a training database
    return agents.map((agent, index) => ({
      id: `session-${agent.id}-${index}`,
      agentId: agent.id,
      agentName: agent.name,
      status: agent.active ? 'completed' : 'queued' as 'running' | 'completed' | 'failed' | 'queued',
      accuracy: agent.accuracy || Math.random() * 30 + 70,
      epochs: 100,
      currentEpoch: agent.active ? 100 : Math.floor(Math.random() * 50),
      loss: Math.random() * 0.1 + 0.01,
      backtestPnL: (Math.random() - 0.5) * 1000,
      winRate: agent.accuracy || Math.random() * 30 + 60,
      startTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      endTime: agent.active ? new Date().toISOString() : undefined,
      dataSize: Math.floor(Math.random() * 10000) + 5000,
      strategy: agent.type || 'Technical Analysis'
    }))
  }

  const calculateTrainingMetrics = (sessions: TrainingSession[], agents: AIAgent[]): TrainingMetrics => {
    const activeSessions = sessions.filter(s => s.status === 'running').length
    const completedSessions = sessions.filter(s => s.status === 'completed')
    const avgAccuracy = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + s.accuracy, 0) / completedSessions.length
      : 0
    const successRate = sessions.length > 0
      ? (completedSessions.length / sessions.length) * 100
      : 0
    const trainedAgents = agents.filter(a => a.active).length

    return {
      totalSessions: sessions.length,
      activeSessions,
      averageAccuracy: avgAccuracy,
      successRate,
      totalAgents: agents.length,
      trainedAgents
    }
  }

  const handleStartTraining = async (agent: AIAgent, config?: any) => {
    if (!user?.address) {
      toast.error("Please connect your wallet first")
      return
    }
    
    try {
      setIsTraining(true)
      
      // Start training session
      const trainingResult = await hyperliquidService.trainAgent(agent, [])
      
      // Create new training session
      const newSession: TrainingSession = {
        id: `session-${agent.id}-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.name,
        status: 'running',
        accuracy: 0,
        epochs: config?.epochs || 100,
        currentEpoch: 0,
        loss: 1.0,
        backtestPnL: 0,
        winRate: 0,
        startTime: new Date().toISOString(),
        dataSize: config?.dataSize || 10000,
        strategy: agent.type || 'Technical Analysis'
      }
      
      setTrainingSessions(prev => [newSession, ...prev])
      toast.success(`Training started for ${agent.name}`)
      
      // Simulate training progress
      simulateTraining(newSession)
      
    } catch (error) {
      console.error('Error starting training:', error)
      toast.error('Failed to start training')
    } finally {
      setIsTraining(false)
      setShowTrainingConfig(false)
    }
  }

  const simulateTraining = (session: TrainingSession) => {
    const interval = setInterval(() => {
      setTrainingSessions(prev => prev.map(s => {
        if (s.id === session.id && s.status === 'running') {
          const newEpoch = Math.min(s.currentEpoch + 1, s.epochs)
          const progress = newEpoch / s.epochs
          
          const updatedSession = {
            ...s,
            currentEpoch: newEpoch,
            accuracy: 50 + progress * 30 + Math.random() * 10,
            loss: 1.0 - progress * 0.9 + Math.random() * 0.1,
            winRate: 40 + progress * 30 + Math.random() * 15,
            backtestPnL: (progress - 0.5) * 2000 + Math.random() * 500
          }
          
          if (newEpoch >= s.epochs) {
            updatedSession.status = 'completed'
            updatedSession.endTime = new Date().toISOString()
            clearInterval(interval)
            toast.success(`Training completed for ${s.agentName}`)
          }
          
          return updatedSession
        }
        return s
      }))
    }, 2000) // Update every 2 seconds for demo
  }

  const handleStopTraining = (sessionId: string) => {
    setTrainingSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: 'failed', endTime: new Date().toISOString() }
        : session
    ))
    toast.info("Training stopped")
  }

  const getStatusIcon = (status: TrainingSession['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'queued': return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusColor = (status: TrainingSession['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'queued': return 'bg-amber-100 text-amber-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading training data...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
          <CardContent>
            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to access agent training
            </p>
            <Button asChild>
              <Link href="/auth/login">Connect Wallet</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Agent Training
          </h1>
          <p className="text-lg text-muted-foreground">
            Train and optimize your AI trading agents for maximum performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowTrainingConfig(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Brain className="w-4 h-4 mr-2" />
            Train New Agent
          </Button>
        </div>
      </div>

      {/* Training Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{metrics.totalSessions}</p>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Training</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.activeSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold text-green-600">{metrics.averageAccuracy.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.successRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedAgent && (
        <Tabs value="overview" className="space-y-6">
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
            {selectedAgent && (
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
                      {getStatusIcon(selectedAgent.status)}
                      <div>
                        <p className="font-medium">Training Session #{selectedAgent.id.slice(-6)}</p>
                        <p className="text-sm text-muted-foreground">
                          Started {new Date(selectedAgent.startTime || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(selectedAgent.status)}>
                      {selectedAgent.status.charAt(0).toUpperCase() + selectedAgent.status.slice(1)}
                    </Badge>
                  </div>
                  
                  {selectedAgent.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{selectedAgent.currentEpoch}/{selectedAgent.epochs}</span>
                      </div>
                      <Progress value={selectedAgent.currentEpoch / selectedAgent.epochs} />
                      <p className="text-sm text-muted-foreground">
                        Epoch {selectedAgent.currentEpoch} of {selectedAgent.epochs}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                      <p className="text-lg font-semibold">{selectedAgent.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Profit Factor</p>
                      <p className="text-lg font-semibold">{selectedAgent.profitFactor.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sharpe Ratio</p>
                      <p className="text-lg font-semibold">{selectedAgent.sharpeRatio.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                      <p className="text-lg font-semibold">{selectedAgent.maxDrawdown.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    {selectedAgent.status === 'queued' && (
                      <Button asChild>
                        <Link href={`/ai-agents/${selectedAgent.id}/train`}>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Start Training
                        </Link>
                      </Button>
                    )}
                    {selectedAgent.status === 'running' && (
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