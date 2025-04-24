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
import { agentStorage } from "@/lib/services/agent-storage"
import { useNotifications } from "@/lib/services/notification-service"

export default function AIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isGenerateSignalOpen, setIsGenerateSignalOpen] = useState(false)
  const [signals, setSignals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addNotification } = useNotifications()

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)

        // Load agents from storage
        const savedAgents = await agentStorage.getAllAgents()
        
        // If no agents exist, create default agents
        if (savedAgents.length === 0) {
          const defaultAgents: AIAgent[] = [
            {
              id: "1",
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
              id: "2",
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
              id: "3",
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

          // Save default agents
          for (const agent of defaultAgents) {
            await agentStorage.saveAgent(agent)
          }
          setAgents(defaultAgents)
          setSelectedAgent(defaultAgents[0])
        } else {
          setAgents(savedAgents)
          setSelectedAgent(savedAgents[0])
        }

        // Load recent signals
        const recentSignals = await agentStorage.getRecentSignals(50)
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
  }, [])

  // Handle agent creation
  const handleCreateAgent = async (newAgent: AIAgent) => {
    try {
      await agentStorage.saveAgent(newAgent)
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

  // Handle agent selection
  const handleSelectAgent = (agent: AIAgent) => {
    setSelectedAgent(agent)
  }

  // Handle agent toggle (active/inactive)
  const handleToggleAgent = async (agentId: string, active: boolean) => {
    try {
      const agent = agents.find((a) => a.id === agentId)
      if (!agent) return

      const updatedAgent = { ...agent, active }
      await agentStorage.saveAgent(updatedAgent)

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

  // Handle signal generation
  const handleSignalGenerated = async (signal: any) => {
    try {
      // Save signal to storage
      await agentStorage.saveSignal(signal)

      // Add the new signal to the list
      setSignals((prev) => [signal, ...prev])

      // Update the agent's last signal time and signal count
      const agent = agents.find((a) => a.id === signal.agentId)
      if (agent) {
        const updatedAgent = {
          ...agent,
          lastSignal: "Just now",
          signals: agent.signals + 1,
        }
        await agentStorage.saveAgent(updatedAgent)

        const updatedAgents = agents.map((a) =>
          a.id === signal.agentId ? updatedAgent : a
        )
        setAgents(updatedAgents)

        if (selectedAgent?.id === signal.agentId) {
          setSelectedAgent(updatedAgent)
        }
      }

      // Send notification
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

  // Handle create new agent button click
  const handleCreateNewAgent = () => {
    setIsCreateDialogOpen(true)
  }

  // Handle generate signal button click
  const handleGenerateSignal = () => {
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
