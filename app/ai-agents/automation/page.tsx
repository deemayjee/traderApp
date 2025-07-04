"use client"

import { AutomationControlPanel } from "@/components/ai-agents/automation-control-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lightbulb, Zap, ShieldCheck, TrendingUp } from "lucide-react"

export default function AutomationPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">AI Trading Automation</h1>
            <p className="text-muted-foreground text-lg mt-2">
              Let your AI agents trade automatically 24/7 with advanced risk management
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Zap className="mr-1 h-3 w-3" />
            Beta
          </Badge>
        </div>
      </div>

      {/* Getting Started Card */}
      <Card className="border-slate-300 bg-gradient-to-br from-amber-50 to-orange-100/50 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-amber-900 font-medium">
            Before enabling automation:
          </div>
          
          {/* Checklist Items */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
              <span className="text-sm text-amber-800">Create and configure your AI agents with different strategies</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
              <span className="text-sm text-amber-800">Set appropriate risk limits (start with small position sizes)</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
              <span className="text-sm text-amber-800">Ensure your wallet is connected and has sufficient balance</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
              <span className="text-sm text-amber-800">Monitor the automation regularly, especially during the first few hours</span>
            </div>
          </div>

          {/* Warning */}
          <Alert className="bg-amber-50 border-amber-200">
            <ShieldCheck className="h-3 w-3 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800">
              Start with small position sizes and monitor closely. You can always adjust settings later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Main Automation Panel */}
      <AutomationControlPanel />

      {/* Footer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
            <CardDescription>
              The automation flow from signal to execution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Market Analysis</p>
                  <p className="text-xs text-muted-foreground">Agents analyze real-time market data and price movements</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-green-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Signal Generation</p>
                  <p className="text-xs text-muted-foreground">AI generates trading signals with confidence scores</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-purple-600">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Risk Validation</p>
                  <p className="text-xs text-muted-foreground">System checks signals against your risk limits</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-orange-600">4</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Trade Execution</p>
                  <p className="text-xs text-muted-foreground">Valid signals are executed as real trades on Hyperliquid</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Safety Features</CardTitle>
            <CardDescription>
              Built-in protections for your trading capital
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Loss Limit</span>
                <Badge variant="outline">$500 Default</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Max Open Positions</span>
                <Badge variant="outline">3 Concurrent</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence Threshold</span>
                <Badge variant="outline">70% Minimum</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Position Size Limit</span>
                <Badge variant="outline">$1000 Max</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Emergency Stop</span>
                <Badge variant="outline">One-Click</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Symbol Whitelist</span>
                <Badge variant="outline">BTC, ETH, SOL</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 