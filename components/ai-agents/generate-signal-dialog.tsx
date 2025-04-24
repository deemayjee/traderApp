"use client"

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
import { Loader2, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/contexts/notification-context"
import type { AIAgent } from "./create-agent-dialog"

interface GenerateSignalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: AIAgent | null
  onSignalGenerated: (signal: any) => void
}

export function GenerateSignalDialog({ open, onOpenChange, agent, onSignalGenerated }: GenerateSignalDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedSignal, setGeneratedSignal] = useState<any | null>(null)
  const { addNotification, preferences } = useNotifications()

  const generateSignal = async () => {
    if (!agent) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/ai-agents/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: agent.id,
          agentType: agent.type,
          assets: agent.focusAssets,
          indicators: agent.indicators,
          riskTolerance: agent.riskTolerance,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate signal")
      }

      const signal = await response.json()
      setGeneratedSignal(signal)
    } catch (err) {
      console.error("Error generating signal:", err)
      setError("Failed to generate signal. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirm = () => {
    if (generatedSignal && agent) {
      onSignalGenerated(generatedSignal)

      // Send notification if signal alerts are enabled
      if (preferences.signalAlerts) {
        addNotification({
          title: `New Signal: ${generatedSignal.asset} ${generatedSignal.type}`,
          message: generatedSignal.signal,
          type: "signal",
          agentId: agent.id,
          agentName: agent.name,
          signalId: generatedSignal.id,
          asset: generatedSignal.asset,
        })
      }

      onOpenChange(false)
      setGeneratedSignal(null)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setGeneratedSignal(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate AI Signal</DialogTitle>
          <DialogDescription>
            {agent ? `Generate a new trading signal using ${agent.name}` : "Select an agent to generate a signal"}
          </DialogDescription>
        </DialogHeader>

        {agent && (
          <div className="py-4">
            <div className="mb-4">
              <h3 className="font-medium mb-2">Agent Configuration</h3>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm">
                <p>
                  <span className="font-medium">Type:</span> {agent.type}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Risk Tolerance:</span> {agent.riskTolerance}/100
                </p>
                <p className="mt-1">
                  <span className="font-medium">Focus Assets:</span> {agent.focusAssets.join(", ")}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Indicators:</span> {agent.indicators.join(", ")}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            {generatedSignal ? (
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <h3 className="font-medium">{generatedSignal.asset} Signal</h3>
                    <Badge
                      className={`ml-2 ${
                        generatedSignal.type === "Buy" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {generatedSignal.type}
                    </Badge>
                  </div>
                  <Badge className="bg-gray-100 text-gray-600">{generatedSignal.confidence}% confidence</Badge>
                </div>

                <p className="text-sm text-gray-700 mb-3">{generatedSignal.signal}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-medium">
                      $
                      {typeof generatedSignal.price === "number"
                        ? generatedSignal.price.toLocaleString()
                        : generatedSignal.price}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Timeframe</p>
                    <p className="font-medium">{generatedSignal.timeframe}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <Button
                  onClick={generateSignal}
                  disabled={isGenerating}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    "Generate Signal"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {generatedSignal && (
            <Button onClick={handleConfirm} className="bg-black text-white hover:bg-gray-800">
              Confirm & Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
