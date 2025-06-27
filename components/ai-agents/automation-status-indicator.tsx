"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Zap, Play, Square } from "lucide-react"
import { aiTradingAutomation } from "@/lib/services/ai-trading-automation"
import Link from "next/link"

interface AutomationStatusIndicatorProps {
  showControls?: boolean
  className?: string
}

export function AutomationStatusIndicator({ showControls = false, className = "" }: AutomationStatusIndicatorProps) {
  const [automationStatus, setAutomationStatus] = useState({
    isRunning: false,
    activeAgents: 0,
    enabledAgents: 0
  })

  useEffect(() => {
    // Update status every 10 seconds
    const updateStatus = () => {
      const status = aiTradingAutomation.getAutomationStatus()
      setAutomationStatus(status)
    }

    updateStatus()
    const interval = setInterval(updateStatus, 10000)

    return () => clearInterval(interval)
  }, [])

  if (showControls) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${automationStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {automationStatus.isRunning ? 'Active' : 'Stopped'}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {automationStatus.enabledAgents} agents
            </Badge>
          </div>

          <div className="flex gap-2">
            <Link href="/ai-agents/automation" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Activity className="mr-1 h-3 w-3" />
                Control Panel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${automationStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
      <Badge variant={automationStatus.isRunning ? "default" : "secondary"} className="text-xs">
        <Zap className="mr-1 h-3 w-3" />
        {automationStatus.isRunning ? 'Auto: ON' : 'Auto: OFF'}
      </Badge>
      {automationStatus.enabledAgents > 0 && (
        <Badge variant="outline" className="text-xs">
          {automationStatus.enabledAgents} active
        </Badge>
      )}
    </div>
  )
} 