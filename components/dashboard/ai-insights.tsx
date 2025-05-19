"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, AlertTriangle, Loader2, Brain } from "lucide-react"
import Link from "next/link"
import { generateSignalsFromCryptoData } from "@/lib/api/crypto-api"
import { fetchCryptosByIds } from "@/lib/api/crypto-api"

interface Insight {
  symbol: string
  insight: string
  confidence: 'high' | 'medium' | 'low'
  timestamp: string
}

interface AIInsightsProps {
  insights: Insight[]
  isPreview?: boolean
}

export function AIInsights({ insights, isPreview = false }: AIInsightsProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          AI Insights
        </CardTitle>
        <Brain className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {insight.symbol}
                </p>
                <p className="text-sm text-muted-foreground">
                  {insight.insight}
                </p>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${
                    insight.confidence === 'high' ? 'text-green-500' :
                    insight.confidence === 'medium' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {insight.confidence} confidence
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(insight.timestamp).toLocaleString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {isPreview && (
          <div className="mt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/signals">
                View All Insights
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
