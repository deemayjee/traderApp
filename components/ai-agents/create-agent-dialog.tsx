"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { generateUUID } from "@/lib/utils/uuid"

export type AIAgentType = "Technical Analysis" | "On-chain Analysis" | "Macro Analysis"

export interface AIAgent {
  id: string
  name: string
  type: AIAgentType
  description: string
  active: boolean
  accuracy: number
  signals: number
  lastSignal: string
  custom: boolean
  riskTolerance: number
  focusAssets: string[]
  indicators: string[]
}

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAgent: (agent: AIAgent) => void
}

export function CreateAgentDialog({ open, onOpenChange, onCreateAgent }: CreateAgentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("technical")
  const [description, setDescription] = useState("")
  const [riskTolerance, setRiskTolerance] = useState([50])
  const [focusAssets, setFocusAssets] = useState<string[]>(["BTC", "ETH"])
  const [indicators, setIndicators] = useState<string[]>(["RSI", "MACD", "Moving Averages"])

  const assetOptions = ["BTC", "ETH", "SOL", "AVAX", "LINK", "DOT"]
  const indicatorOptions = ["RSI", "MACD", "Moving Averages", "Bollinger Bands", "Volume", "Support/Resistance"]

  const typeOptions = [
    { value: "technical", label: "Technical Analysis" },
    { value: "onchain", label: "On-chain Analysis" },
    { value: "macro", label: "Macro Analysis" },
    { value: "sentiment", label: "Sentiment Analysis" },
    { value: "custom", label: "Custom Strategy" },
  ]

  const getTypeLabel = (value: string) => {
    return typeOptions.find((option) => option.value === value)?.label || value
  }

  const toggleAsset = (asset: string) => {
    setFocusAssets((prev) => (prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]))
  }

  const toggleIndicator = (indicator: string) => {
    setIndicators((prev) => (prev.includes(indicator) ? prev.filter((i) => i !== indicator) : [...prev, indicator]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newAgent: AIAgent = {
        id: generateUUID(),
        name,
        type: getTypeLabel(type) as AIAgentType,
        description,
        active: true,
        accuracy: Math.floor(Math.random() * 10) + 85, // Random accuracy between 85-95%
        signals: 0,
        lastSignal: "Just created",
        custom: true,
        riskTolerance: riskTolerance[0],
        focusAssets,
        indicators,
      }

      onCreateAgent(newAgent)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating agent:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName("")
    setType("technical")
    setDescription("")
    setRiskTolerance([50])
    setFocusAssets(["BTC", "ETH"])
    setIndicators(["RSI", "MACD", "Moving Averages"])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New AI Agent</DialogTitle>
          <DialogDescription>
            Configure your custom AI trading agent to analyze markets and generate signals based on your preferences.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agent-name" className="text-right">
                Agent Name
              </Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agent-type" className="text-right">
                Agent Type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="agent-type" className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Risk Tolerance</Label>
              <div className="col-span-3 space-y-2">
                <Slider value={riskTolerance} onValueChange={setRiskTolerance} max={100} step={1} />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Conservative</span>
                  <span>Moderate</span>
                  <span>Aggressive</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Focus Assets</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
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

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Indicators</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name || !description}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Agent"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
