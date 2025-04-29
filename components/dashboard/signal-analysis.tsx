"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowDownRight, ArrowUpRight, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SignalAnalysisProps {
  signalId: string
}

export default function SignalAnalysis({ signalId }: SignalAnalysisProps) {
  // Mock data for the analysis
  const entryPrice = 45000
  const targetPrice = 48000
  const stopLoss = 42000

  const getSuccessRate = (timeframe: string) => {
    const rates: Record<string, number> = {
      "1h": 75,
      "4h": 82,
      "1d": 78,
      "1w": 85
    }
    return rates[timeframe] || 0
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="analysis">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">Signal Summary</h3>
              <p className="text-sm text-gray-600">
                Bullish signal detected based on technical analysis. This signal has historically shown 85% accuracy
                over the past 3 months.
              </p>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Entry Price</div>
                  <div className="font-semibold">${entryPrice.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Target Price</div>
                  <div className="font-semibold flex items-center">
                    ${targetPrice}
                    <ArrowUpRight className="h-4 w-4 text-green-500 ml-1" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Stop Loss</div>
                  <div className="font-semibold">${stopLoss}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Risk Assessment</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Risk Level</span>
                    <span className="font-medium">Medium</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Risk/Reward Ratio</span>
                    <span className="font-medium">1:2.5</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Historical Performance</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>1 Hour Timeframe</span>
                    <span className="font-medium">{getSuccessRate("1h")}%</span>
                  </div>
                  <Progress value={getSuccessRate("1h")} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>4 Hour Timeframe</span>
                    <span className="font-medium">{getSuccessRate("4h")}%</span>
                  </div>
                  <Progress value={getSuccessRate("4h")} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>1 Day Timeframe</span>
                    <span className="font-medium">{getSuccessRate("1d")}%</span>
                  </div>
                  <Progress value={getSuccessRate("1d")} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>1 Week Timeframe</span>
                    <span className="font-medium">{getSuccessRate("1w")}%</span>
                  </div>
                  <Progress value={getSuccessRate("1w")} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indicators" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Technical Indicators</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">RSI (14)</div>
                  <div className="font-semibold">
                    28.5 <span className="text-sm font-normal text-gray-500">(Oversold)</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">MACD</div>
                  <div className="font-semibold">Bullish Crossover</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Moving Averages</div>
                  <div className="font-semibold">Buy (8/4)</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Volume</div>
                  <div className="font-semibold">+32% (Increasing)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 