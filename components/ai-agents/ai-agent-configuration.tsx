"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Settings, Save } from "lucide-react"
import { useState } from "react"
import type { AIAgent } from "./create-agent-dialog"

interface AIAgentConfigurationProps {
  agent: AIAgent
}

export function AIAgentConfiguration({ agent }: AIAgentConfigurationProps) {
  const [name, setName] = useState(agent.name)
  const [description, setDescription] = useState(agent.description)
  const [riskTolerance, setRiskTolerance] = useState([agent.riskTolerance])
  const [focusAssets, setFocusAssets] = useState<string[]>(agent.focusAssets)
  const [indicators, setIndicators] = useState<string[]>(agent.indicators)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Update state when agent changes
  useState(() => {
    setName(agent.name)
    setDescription(agent.description)
    setRiskTolerance([agent.riskTolerance])
    setFocusAssets(agent.focusAssets)
    setIndicators(agent.indicators)
    setHasChanges(false)
  })

  const assetOptions = ["BTC", "ETH", "SOL", "AVAX", "LINK", "DOT"]
  const indicatorOptions = ["RSI", "MACD", "Moving Averages", "Bollinger Bands", "Volume", "Support/Resistance"]

  const toggleAsset = (asset: string) => {
    const newAssets = focusAssets.includes(asset) ? focusAssets.filter((a) => a !== asset) : [...focusAssets, asset]

    setFocusAssets(newAssets)
    setHasChanges(true)
  }

  const toggleIndicator = (indicator: string) => {
    const newIndicators = indicators.includes(indicator)
      ? indicators.filter((i) => i !== indicator)
      : [...indicators, indicator]

    setIndicators(newIndicators)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // In a real app, this would be an API call to update the agent
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update was successful
      setHasChanges(false)
    } catch (error) {
      console.error("Error saving agent configuration:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Settings className="h-5 w-5 mr-2 text-gray-600" />
          <CardTitle className="text-lg font-semibold">Agent Configuration</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Agent Name</Label>
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
          <Label htmlFor="agent-type">Agent Type</Label>
          <Select defaultValue={agent.type.toLowerCase().replace(" ", "-")}>
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
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setHasChanges(true)
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Risk Tolerance</Label>
          <div className="pt-2">
            <Slider
              defaultValue={riskTolerance}
              value={riskTolerance}
              onValueChange={(value) => {
                setRiskTolerance(value)
                setHasChanges(true)
              }}
              max={100}
              step={1}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Conservative</span>
            <span>Moderate</span>
            <span>Aggressive</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Focus Assets</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {assetOptions.map((asset) => (
              <div key={asset} className="flex items-center space-x-2">
                <Checkbox
                  id={`asset-${asset}`}
                  checked={focusAssets.includes(asset)}
                  onCheckedChange={() => toggleAsset(asset)}
                />
                <Label htmlFor={`asset-${asset}`} className="text-sm font-normal">
                  {asset}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Indicators</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {indicatorOptions.map((indicator) => (
              <div key={indicator} className="flex items-center space-x-2">
                <Checkbox
                  id={`indicator-${indicator}`}
                  checked={indicators.includes(indicator)}
                  onCheckedChange={() => toggleIndicator(indicator)}
                />
                <Label htmlFor={`indicator-${indicator}`} className="text-sm font-normal">
                  {indicator}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notification Settings</Label>
          <div className="space-y-2 mt-1">
            {[
              { id: "notify-signals", label: "New Signals" },
              { id: "notify-performance", label: "Performance Updates" },
              { id: "notify-critical", label: "Critical Alerts" },
            ].map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox id={item.id} defaultChecked />
                <Label htmlFor={item.id} className="text-sm font-normal">
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button
          className="w-full bg-black text-white hover:bg-gray-800"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Save Configuration
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
