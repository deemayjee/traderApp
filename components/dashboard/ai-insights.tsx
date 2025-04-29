"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface AIInsight {
  id: string
  type: "buy" | "sell" | "hold"
  asset: string
  signalType: string
  description: string
  confidence: number
  accuracy: number
  time: string
  icon: "trend" | "signal" | "warning"
}

export function AIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([
    {
      id: "1",
      type: "buy",
      asset: "BTC",
      signalType: "Signal",
      description: "RSI oversold + MACD crossover",
      confidence: 83,
      accuracy: 84,
      time: "2h ago",
      icon: "signal",
    },
    {
      id: "2",
      type: "buy",
      asset: "ETH",
      signalType: "Trend",
      description: "Large accumulation detected",
      confidence: 77,
      accuracy: 79,
      time: "5h ago",
      icon: "trend",
    },
    {
      id: "3",
      type: "sell",
      asset: "USDT",
      signalType: "Warning",
      description: "Bearish divergence on 4h chart",
      confidence: 87,
      accuracy: 88,
      time: "1d ago",
      icon: "warning",
    },
  ])

  const getIcon = (insight: AIInsight) => {
    switch (insight.icon) {
      case "trend":
        return <TrendingUp className="h-6 w-6 text-blue-500" />
      case "signal":
        return (
          <div className="h-6 w-6 rounded-full border-2 border-green-500 flex items-center justify-center">
            <div className="h-3 w-0.5 bg-green-500" />
            <div className="h-3 w-0.5 bg-green-500 ml-0.5" />
          </div>
        )
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-amber-500" />
      default:
        return <TrendingUp className="h-6 w-6 text-blue-500" />
    }
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">AI Insights</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {/* Placeholder for future functionality */}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => (
          <Card key={insight.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getIcon(insight)}
                  <div>
                    <h3 className="font-medium text-base">
                      {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} {insight.asset}{" "}
                      {insight.signalType}
                    </h3>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
                <div className="bg-muted px-3 py-1 rounded-full text-sm">{insight.confidence}% conf.</div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Historical Accuracy</span>
                  <span className="font-medium">{insight.accuracy}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Link href="/ai-agents" passHref>
          <Button variant="outline" size="lg" className="w-full border-border">
            View All Insights <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
