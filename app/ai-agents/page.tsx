"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Loader2, Bot, Brain, TrendingUp, Activity, Plus, Search, Filter, BarChart3, Zap, ArrowUpRight, Settings, Trash2 } from "lucide-react"
import { CreateAgentDialog, type AIAgent } from "@/components/ai-agents/create-agent-dialog"
import { aiAgentService } from "@/lib/services/ai-agent-service"
import { agentSupabase } from "@/lib/services/agent-supabase"
import { hyperliquidAgentService } from "@/lib/services/hyperliquid-agent-service"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { toast } from "sonner"
import Link from "next/link"

export default function AIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [signals, setSignals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useWalletAuth()
  const walletAddress = user?.address

  useEffect(() => {
    if (!walletAddress) return
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        const savedAgents = await agentSupabase.getAllAgents(walletAddress)
        setAgents(savedAgents)
        setSelectedAgent(savedAgents[0] || null)
        const recentSignals = await agentSupabase.getRecentSignals(50)
        setSignals(recentSignals)
      } catch (error) {
        console.error("Error loading initial data:", error)
        toast.error("Failed to load AI agents and signals")
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [walletAddress])

  const handleCreateAgent = async (newAgent: AIAgent) => {
    if (!walletAddress) {
      toast.error("Wallet not connected. Please connect your wallet first.")
      return
    }
    try {
      // Agent is already saved to database by the create dialog
      // Deploy agent to Hyperliquid for live trading
      if (newAgent.tradingEnabled) {
        await hyperliquidAgentService.deployAgent(newAgent)
        toast.success(`AI Agent "${newAgent.name}" deployed to Hyperliquid and is now actively trading!`)
      } else {
        toast.success(`AI Agent "${newAgent.name}" created successfully in monitoring mode`)
      }
      
      setAgents((prev) => [...prev, newAgent])
    } catch (error) {
      console.error("Error creating agent:", error)
      toast.error("Failed to deploy AI agent: " + (error as Error).message)
    }
  }

  const handleToggleAgent = async (agentId: string, active: boolean) => {
    if (!walletAddress) {
      toast.error("Wallet not connected. Please connect your wallet first.")
      return
    }
    try {
      const agent = agents.find((a) => a.id === agentId)
      if (!agent) return
      const updatedAgent = { ...agent, active }
      
      // Update in database
      await agentSupabase.saveAgent(updatedAgent, walletAddress)
      
      // Deploy or stop agent on Hyperliquid
      if (active && agent.tradingEnabled) {
        await hyperliquidAgentService.deployAgent(updatedAgent)
        toast.success(`${agent.name} deployed to Hyperliquid and is now actively trading!`)
      } else if (!active) {
        await hyperliquidAgentService.stopAgent(agentId)
        toast.success(`${agent.name} stopped and all positions closed`)
      } else {
        toast.success(`${agent.name} is now ${active ? "monitoring markets" : "inactive"}`)
      }
      
      const updatedAgents = agents.map((a) =>
        a.id === agentId ? updatedAgent : a
      )
      setAgents(updatedAgents)
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(updatedAgent)
      }
    } catch (error) {
      console.error("Error toggling agent:", error)
      toast.error("Failed to update agent status: " + (error as Error).message)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!walletAddress) {
      toast.error("Wallet not connected. Please connect your wallet first.")
      return
    }
    try {
      // Stop agent on Hyperliquid first
      await hyperliquidAgentService.stopAgent(agentId)
      
      // Delete from database
      await agentSupabase.deleteAgent(agentId, walletAddress)
      
      const updatedAgents = agents.filter((a) => a.id !== agentId)
      setAgents(updatedAgents)
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(updatedAgents[0] || null)
      }
      toast.success("Agent deleted successfully and all positions closed")
    } catch (error) {
      console.error("Error deleting agent:", error)
      toast.error("Failed to delete agent: " + (error as Error).message)
    }
  }

  const handleCreateNewAgent = () => {
    if (!walletAddress) {
      toast.error("Wallet not connected. Please connect your wallet first.")
      return
    }
    setIsCreateDialogOpen(true)
  }

  const getAgentIcon = (type: string) => {
    if (type.includes("Technical")) return <TrendingUp className="h-5 w-5" />
    if (type.includes("On-chain")) return <BarChart3 className="h-5 w-5" />
    return <Brain className="h-5 w-5" />
  }

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeAgents = agents.filter(agent => agent.active).length
  const totalSignals = agents.reduce((sum, agent) => sum + (agent.signals || 0), 0)
  const avgAccuracy = agents.length > 0 ? agents.reduce((sum, agent) => sum + (agent.accuracy || 0), 0) / agents.length : 0

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-3xl border border-primary/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                AI-Powered Trading
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              AI Trading Agents
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Deploy sophisticated AI agents that analyze markets 24/7, identify opportunities, and execute trades with precision. 
              Build your automated trading empire.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={handleCreateNewAgent} className="bg-primary hover:bg-primary/90">
                <Plus className="h-5 w-5 mr-2" />
                Create New Agent
              </Button>
              <Link href="/ai-agents/train">
                <Button variant="outline" size="lg" className="border-primary/30 hover:bg-primary/10">
                  <Brain className="h-5 w-5 mr-2" />
                  Train Agents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
                <p className="text-3xl font-bold text-primary">{agents.length}</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-xl">
                <Bot className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                <p className="text-3xl font-bold text-green-600">{activeAgents}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Signals</p>
                <p className="text-3xl font-bold text-blue-600">{totalSignals}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Accuracy</p>
                <p className="text-3xl font-bold text-purple-600">{avgAccuracy.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search agents by name or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="shrink-0">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No AI Agents Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first AI trading agent to get started with automated trading.</p>
            <Button onClick={handleCreateNewAgent}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      agent.type.includes("Technical") ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" :
                      agent.type.includes("On-chain") ? "bg-purple-100 text-purple-600 dark:bg-purple-900/20" :
                      "bg-green-100 text-green-600 dark:bg-green-900/20"
                    }`}>
                      {getAgentIcon(agent.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{agent.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {agent.type}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={agent.active}
                    onCheckedChange={(checked) => handleToggleAgent(agent.id, checked)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
                
                <div className="flex items-center justify-between">
                  <Badge variant={(agent.accuracy || 0) >= 90 ? "default" : (agent.accuracy || 0) >= 80 ? "secondary" : "destructive"}>
                    {agent.accuracy || 0}% Accuracy
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 mr-1" />
                    {agent.signals || 0} signals
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Last signal: {agent.lastSignal}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                    View Details
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateAgentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onAgentCreated={handleCreateAgent}
      />
    </div>
  )
}
