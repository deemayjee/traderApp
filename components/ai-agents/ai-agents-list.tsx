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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AIAgentsListProps {
  agents: AIAgent[]
  selectedAgent: AIAgent | null
  onSelectAgent: (agent: AIAgent) => void
  onToggleAgent: (agentId: string, active: boolean) => void
}

export function AIAgentsList({ agents, selectedAgent, onSelectAgent, onToggleAgent }: AIAgentsListProps) {
  const [activeTab, setActiveTab] = useState("my-agents")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const { addNotification, preferences } = useNotifications()

  // Filter and sort agents
  const filteredAgents = agents
    .filter(agent => 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "accuracy":
          return b.accuracy - a.accuracy
        case "signals":
          return b.signals - a.signals
        default:
          return 0
      }
    })

  // Get the icon based on agent type
  const getAgentIcon = (type: string) => {
    if (type.includes("Technical")) return <TrendingUp className="h-5 w-5 text-blue-600" />
    if (type.includes("On-chain")) return <BarChart3 className="h-5 w-5 text-purple-600" />
    return <Brain className="h-5 w-5 text-green-600" />
  }

  // Get accuracy badge color
  const getAccuracyBadgeColor = (accuracy: number) => {
    if (accuracy >= 90) return "bg-green-100 text-green-800"
    if (accuracy >= 80) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const handleToggleAgent = (agent: AIAgent, active: boolean) => {
    onToggleAgent(agent.id, active)
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
              {/*
              <TabsTrigger value="marketplace" className="data-[state=active]:bg-white">
                Marketplace
              </TabsTrigger>
              <TabsTrigger value="community" className="data-[state=active]:bg-white">
                Community
              </TabsTrigger>
              */}
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="accuracy">Accuracy</SelectItem>
              <SelectItem value="signals">Signal Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all \
                ${selectedAgent?.id === agent.id 
                  ? "border-primary bg-primary/10 shadow-lg" 
                  : "border-gray-200 hover:border-gray-300 bg-transparent"}
              `}
              onClick={() => onSelectAgent(agent)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  {getAgentIcon(agent.type)}
                  <div>
                    <h3 className="font-medium">{agent.name}</h3>
                    <p className="text-sm text-gray-500">{agent.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={
                    `${getAccuracyBadgeColor(agent.accuracy)} \
                    ${selectedAgent?.id === agent.id ? 'bg-primary text-primary-foreground' : ''}`
                  }>
                    {agent.accuracy}% Accuracy
                  </Badge>
                  <Switch
                    checked={agent.active}
                    onCheckedChange={(checked) => {
                      handleToggleAgent(agent, checked)
                      event?.stopPropagation()
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={selectedAgent?.id === agent.id ? 'border-primary' : ''}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{agent.description}</p>
              <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {agent.signals} Signals
                </div>
                <div className="flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Last: {agent.lastSignal}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
