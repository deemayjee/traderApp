"use client"

import { useState, useEffect } from "react"
import { AIAgentsHeader } from "@/components/ai-agents/ai-agents-header"
import { AIAgentsList } from "@/components/ai-agents/ai-agents-list"
import { AIAgentConfiguration } from "@/components/ai-agents/ai-agent-configuration"
import { AIAgentPerformance } from "@/components/ai-agents/ai-agent-performance"
import { CreateAgentDialog, type AIAgent } from "@/components/ai-agents/create-agent-dialog"
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
        setAgents(savedAgents)
        setSelectedAgent(savedAgents[0] || null)
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

  const handleDeleteAgent = async (agentId: string) => {
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
      await agentSupabase.deleteAgent(agentId, walletAddress)
      const updatedAgents = agents.filter((a) => a.id !== agentId)
      setAgents(updatedAgents)
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(updatedAgents[0] || null)
      }
      addNotification({
        title: "Success",
        message: "Agent deleted successfully",
        type: "success",
        priority: "medium",
      })
    } catch (error) {
      console.error("Error deleting agent:", error)
      addNotification({
        title: "Error",
        message: "Failed to delete agent",
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
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIAgentsList
            agents={agents}
            selectedAgent={selectedAgent}
            onSelectAgent={handleSelectAgent}
            onToggleAgent={handleToggleAgent}
            onDeleteAgent={handleDeleteAgent}
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
    </div>
  )
}
