"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Settings, Save, HelpCircle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import type { AIAgent, AIAgentType } from "./create-agent-dialog"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { agentSupabase } from "@/lib/services/agent-supabase"
import { useNotifications } from "@/lib/services/notification-service"
import { useWalletAuth } from "@/components/auth/wallet-context"

interface AIAgentConfigurationProps {
  agent: AIAgent
}

export function AIAgentConfiguration({ agent }: AIAgentConfigurationProps) {
  const [name, setName] = useState(agent.name)
  const [type, setType] = useState(agent.type.toLowerCase().replace(" ", "-"))
  const [description, setDescription] = useState(agent.description)
  const [riskTolerance, setRiskTolerance] = useState([agent.riskTolerance])
  const [focusAssets, setFocusAssets] = useState(agent.focusAssets)
  const [indicators, setIndicators] = useState(agent.indicators)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { addNotification } = useNotifications()
  const { user } = useWalletAuth()
  const walletAddress = user?.address

  useEffect(() => {
    setName(agent.name)
    setType(agent.type.toLowerCase().replace(" ", "-"))
    setDescription(agent.description)
    setRiskTolerance([agent.riskTolerance])
    setFocusAssets(agent.focusAssets)
    setIndicators(agent.indicators)
    setHasChanges(false)
  }, [agent])

  const handleSave = async () => {
    if (!walletAddress) {
      addNotification({
        title: "Error",
        message: "Wallet not connected. Please connect your wallet first.",
        type: "error",
        priority: "high",
      })
      return
    }
    setIsSaving(true)
    try {
      const updatedAgent: AIAgent = {
        ...agent,
        name,
        type: type.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase()) as AIAgentType,
        description,
        riskTolerance: riskTolerance[0],
        focusAssets,
        indicators,
      }
      await agentSupabase.saveAgent(updatedAgent, walletAddress)
      setHasChanges(false)
      addNotification({
        title: "Success",
        message: "Agent configuration updated successfully",
        type: "success",
        priority: "medium",
      })
    } catch (error) {
      console.error("Error saving configuration:", error)
      addNotification({
        title: "Error",
        message: "Failed to update agent configuration",
        type: "error",
        priority: "high",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const assetOptions = ["BTC", "ETH", "SOL", "AVAX", "LINK", "DOT"]
  const indicatorOptions = ["RSI", "MACD", "Moving Averages", "Bollinger Bands", "Volume", "Support/Resistance"]

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-gray-600" />
            <CardTitle className="text-lg font-semibold">Agent Configuration</CardTitle>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
            className="ml-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="agent-name">Agent Name</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Choose a descriptive name for your agent</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setHasChanges(true)
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="agent-type">Agent Type</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select the analysis type this agent specializes in</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select 
                value={type} 
                onValueChange={(value) => {
                  setType(value)
                  setHasChanges(true)
                }}
              >
                <SelectTrigger id="agent-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical-analysis">Technical Analysis</SelectItem>
                  <SelectItem value="onchain-analysis">On-chain Analysis</SelectItem>
                  <SelectItem value="macro-analysis">Macro Analysis</SelectItem>
                  <SelectItem value="sentiment-analysis">Sentiment Analysis</SelectItem>
                  <SelectItem value="custom-strategy">Custom Strategy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Describe your agent's strategy and focus areas</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setHasChanges(true)
                }}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Risk Tolerance</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Higher values indicate more aggressive trading strategies</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <Slider
                  value={riskTolerance}
                  onValueChange={(value) => {
                    setRiskTolerance(value)
                    setHasChanges(true)
                  }}
                  min={0}
                  max={100}
                  step={5}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Focus Assets</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select the cryptocurrencies this agent will analyze</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-wrap gap-2">
                {assetOptions.map((asset) => (
                  <Badge
                    key={asset}
                    variant={focusAssets.includes(asset) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const newAssets = focusAssets.includes(asset)
                        ? focusAssets.filter(a => a !== asset)
                        : [...focusAssets, asset]
                      setFocusAssets(newAssets)
                      setHasChanges(true)
                    }}
                  >
                    {asset}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Indicators</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select the technical indicators this agent will use</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {indicatorOptions.map((indicator) => (
                  <div key={indicator} className="flex items-center space-x-2">
                    <Checkbox
                      id={`indicator-${indicator}`}
                      checked={indicators.includes(indicator)}
                      onCheckedChange={() => {
                        const newIndicators = indicators.includes(indicator)
                          ? indicators.filter(i => i !== indicator)
                          : [...indicators, indicator]
                        setIndicators(newIndicators)
                        setHasChanges(true)
                      }}
                    />
                    <Label htmlFor={`indicator-${indicator}`} className="text-sm font-normal">
                      {indicator}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
