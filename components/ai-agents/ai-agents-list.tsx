"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, BarChart3, Brain, Settings, ArrowUpRight } from "lucide-react"
import { useState } from "react"
import { useNotifications } from "@/contexts/notification-context"
import type { AIAgent } from "./create-agent-dialog"

interface AIAgentsListProps {
  agents: AIAgent[]
  selectedAgent: AIAgent | null
  onSelectAgent: (agent: AIAgent) => void
  onToggleAgent: (agentId: string, active: boolean) => void
}

export function AIAgentsList({ agents, selectedAgent, onSelectAgent, onToggleAgent }: AIAgentsListProps) {
  const [activeTab, setActiveTab] = useState("my-agents")
  const { addNotification, preferences } = useNotifications()

  // Get the icon based on agent type
  const getAgentIcon = (type: string) => {
    if (type.includes("Technical")) return <TrendingUp className="h-5 w-5 text-blue-600" />
    if (type.includes("On-chain")) return <BarChart3 className="h-5 w-5 text-purple-600" />
    return <Brain className="h-5 w-5 text-green-600" />
  }

  const handleToggleAgent = (agent: AIAgent, active: boolean) => {
    onToggleAgent(agent.id, active)

    // Send notification when agent is activated or deactivated
    if (preferences.systemAlerts) {
      addNotification({
        title: active ? `${agent.name} Activated` : `${agent.name} Deactivated`,
        message: active
          ? `${agent.name} is now active and will generate signals.`
          : `${agent.name} has been deactivated and will not generate signals.`,
        type: "system",
        agentId: agent.id,
        agentName: agent.name,
      })
    }
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">AI Agents</CardTitle>
          <Tabs defaultValue="my-agents" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-gray-100 border border-gray-200">
              <TabsTrigger value="my-agents" className="data-[state=active]:bg-white">
                My Agents
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="data-[state=active]:bg-white">
                Marketplace
              </TabsTrigger>
              <TabsTrigger value="community" className="data-[state=active]:bg-white">
                Community
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`p-4 border rounded-lg cursor-pointer ${
                selectedAgent?.id === agent.id ? "border-black" : "border-gray-200"
              }`}
              onClick={() => onSelectAgent(agent)}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{agent.name}</h3>
                <Switch
                  checked={agent.active}
                  onCheckedChange={(checked) => {
                    handleToggleAgent(agent, checked)
                    // Prevent the click from selecting the agent
                    event?.stopPropagation()
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">{agent.type}</p>
              <p className="text-sm text-gray-500 mt-1">{agent.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
