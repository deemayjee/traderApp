"use client"

import { useState, useEffect } from "react"
import { AIAgentsHeader } from "@/components/ai-agents/ai-agents-header"
import { AIAgentsList } from "@/components/ai-agents/ai-agents-list"
import { AIAgentConfiguration } from "@/components/ai-agents/ai-agent-configuration"
import { AIAgentPerformance } from "@/components/ai-agents/ai-agent-performance"
import { CreateAgentDialog, type AIAgent } from "@/components/ai-agents/create-agent-dialog"
import { GenerateSignalDialog } from "@/components/ai-agents/generate-signal-dialog"
import { AgentPerformanceChart } from "@/components/ai-agents/agent-performance-chart"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { aiAgentService } from "@/lib/services/ai-agent-service"
import { agentSupabase } from "@/lib/services/agent-supabase"
import { useNotifications } from "@/lib/services/notification-service"
import { useWalletAuth } from "@/components/auth/wallet-context"

export default function AIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isGenerateSignalOpen, setIsGenerateSignalOpen] = useState(false)
  const [signals, setSignals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addNotification } = useNotifications()
  const { user } = useWalletAuth()
  const walletAddress = user?.address

  useEffect(() => {
    if (!walletAddress) return
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        const savedAgents = await agentSupabase.getAllAgents(walletAddress)
        if (savedAgents.length === 0) {
          const defaultAgents: AIAgent[] = [
            {
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
              name: "TrendMaster",
              type: "Technical Analysis" as const,
              description: "Specialized in identifying trend reversals and breakouts using technical indicators.",
              active: true,
              accuracy: 0,
              signals: 0,
              lastSignal: "Never",
              custom: true,
              riskTolerance: 65,
              focusAssets: ["BTC", "ETH", "SOL"],
              indicators: ["RSI", "MACD", "Moving Averages"],
            },
            {
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
              name: "WhaleWatcher",
              type: "On-chain Analysis" as const,
              description: "Monitors large transactions and wallet movements to predict market impacts.",
              active: true,
              accuracy: 0,
              signals: 0,
              lastSignal: "Never",
              custom: true,
              riskTolerance: 70,
              focusAssets: ["BTC", "ETH", "LINK"],
              indicators: ["Volume", "Support/Resistance"],
            },
            {
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
              name: "MacroSage",
              type: "Macro Analysis" as const,
              description: "Analyzes macroeconomic factors and their impact on crypto markets.",
              active: false,
              accuracy: 0,
              signals: 0,
              lastSignal: "Never",
              custom: false,
              riskTolerance: 50,
              focusAssets: ["BTC", "ETH", "AVAX", "DOT"],
              indicators: ["Moving Averages", "Volume"],
            },
          ]
          for (const agent of defaultAgents) {
            await agentSupabase.saveAgent(agent, walletAddress)
          }
          setAgents(defaultAgents)
          setSelectedAgent(defaultAgents[0])
        } else {
          setAgents(savedAgents)
          setSelectedAgent(savedAgents[0])
        }
        const recentSignals = await agentSupabase.getRecentSignals(50)
        setSignals(recentSignals)
      } catch (error) {
        console.error("Error loading initial data:", error)
        addNotification({
          title: "Error",
          message: "Failed to load AI agents and signals",
          type: "error",
          priority: "high",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [walletAddress])

  const handleCreateAgent = async (newAgent: AIAgent) => {
    if (!walletAddress) {
      addNotification({
        title: "Error",
        message: "Wallet not connected. Please connect your wallet first.",
        type: "error",
        priority: "high",
      })
      return
    }
    try {
      await agentSupabase.saveAgent(newAgent, walletAddress)
      setAgents((prev) => [...prev, newAgent])
      addNotification({
        title: "Success",
        message: `Agent ${newAgent.name} created successfully`,
        type: "success",
        priority: "medium",
      })
    } catch (error) {
      console.error("Error creating agent:", error)
      addNotification({
        title: "Error",
        message: "Failed to create agent",
        type: "error",
        priority: "high",
      })
    }
  }

  const handleSelectAgent = (agent: AIAgent) => {
    setSelectedAgent(agent)
  }

  const handleToggleAgent = async (agentId: string, active: boolean) => {
    if (!walletAddress) {
      addNotification({
        title: "Error",
        message: "Wallet not connected. Please connect your wallet first.",
        type: "error",
        priority: "high",
      })
      return
    }
    try {
      const agent = agents.find((a) => a.id === agentId)
      if (!agent) return
      const updatedAgent = { ...agent, active }
      await agentSupabase.saveAgent(updatedAgent, walletAddress)
      const updatedAgents = agents.map((a) =>
        a.id === agentId ? updatedAgent : a
      )
      setAgents(updatedAgents)
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(updatedAgent)
      }
      addNotification({
        title: "Agent Updated",
        message: `${agent.name} is now ${active ? "active" : "inactive"}`,
        type: "info",
        priority: "low",
      })
    } catch (error) {
      console.error("Error toggling agent:", error)
      addNotification({
        title: "Error",
        message: "Failed to update agent status",
        type: "error",
        priority: "high",
      })
    }
  }

  const handleSignalGenerated = async (signal: any) => {
    if (!walletAddress) {
      addNotification({
        title: "Error",
        message: "Wallet not connected. Please connect your wallet first.",
        type: "error",
        priority: "high",
      })
      return
    }
    try {
      await agentSupabase.saveSignal(signal)
      setSignals((prev) => [signal, ...prev])
      const agent = agents.find((a) => a.id === signal.agentId)
      if (agent) {
        const updatedAgent = {
          ...agent,
          lastSignal: "Just now",
          signals: agent.signals + 1,
        }
        await agentSupabase.saveAgent(updatedAgent, walletAddress)
        const updatedAgents = agents.map((a) =>
          a.id === signal.agentId ? updatedAgent : a
        )
        setAgents(updatedAgents)
        if (selectedAgent?.id === signal.agentId) {
          setSelectedAgent(updatedAgent)
        }
      }
      addNotification({
        title: `New Signal: ${signal.asset} ${signal.type}`,
        message: signal.signal,
        type: "signal",
        priority: "high",
        agentId: signal.agentId,
        signalId: signal.id,
      })
    } catch (error) {
      console.error("Error saving signal:", error)
      addNotification({
        title: "Error",
        message: "Failed to save signal",
        type: "error",
        priority: "high",
      })
    }
  }

  const handleCreateNewAgent = () => {
    if (!walletAddress) {
      addNotification({
        title: "Error",
        message: "Wallet not connected. Please connect your wallet first.",
        type: "error",
        priority: "high",
      })
      return
    }
    setIsCreateDialogOpen(true)
  }

  const handleGenerateSignal = () => {
    if (!walletAddress) {
      addNotification({
        title: "Error",
        message: "Wallet not connected. Please connect your wallet first.",
        type: "error",
        priority: "high",
      })
      return
    }
    setIsGenerateSignalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AIAgentsHeader
        onCreateNewAgent={handleCreateNewAgent}
        onGenerateSignal={handleGenerateSignal}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIAgentsList
            agents={agents}
            selectedAgent={selectedAgent}
            onSelectAgent={handleSelectAgent}
            onToggleAgent={handleToggleAgent}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedAgent && (
            <>
              <AIAgentConfiguration agent={selectedAgent} />
              <AIAgentPerformance agent={selectedAgent} signals={signals} />
              <AgentPerformanceChart agent={selectedAgent} signals={signals} />
            </>
          )}
        </div>
      </div>

      <CreateAgentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateAgent={handleCreateAgent}
      />

      <GenerateSignalDialog
        open={isGenerateSignalOpen}
        onOpenChange={setIsGenerateSignalOpen}
        agent={selectedAgent}
        onSignalGenerated={handleSignalGenerated}
      />
    </div>
  )
}
