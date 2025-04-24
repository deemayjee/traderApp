"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { AIAgent } from "./create-agent-dialog"

interface PerformanceData {
  date: string
  accuracy: number
  profit: number
  signals: number
}

interface AgentPerformanceChartProps {
  agent: AIAgent
  signals: any[]
}

export function AgentPerformanceChart({ agent, signals }: AgentPerformanceChartProps) {
  const agentSignals = signals.filter((signal) => signal.agentId === agent.id)
  const [timeframe, setTimeframe] = useState("1m")

  // Generate mock performance data
  const generatePerformanceData = (days: number): PerformanceData[] => {
    const data: PerformanceData[] = []
    const now = new Date()
    let accuracy = 75 + Math.random() * 10
    let cumulativeProfit = 0
    let signalCount = 0

    for (let i = days; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      // Simulate some randomness but with a trend
      accuracy = Math.max(65, Math.min(95, accuracy + (Math.random() - 0.5) * 2))
      const dailyProfit = (Math.random() - 0.3) * 2 // Slightly biased towards profit
      cumulativeProfit += dailyProfit

      // More signals on some days than others
      const dailySignals = Math.floor(Math.random() * 3)
      signalCount += dailySignals

      data.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        accuracy,
        profit: cumulativeProfit,
        signals: signalCount,
      })
    }

    return data
  }

  // Get data based on selected timeframe
  const getPerformanceData = () => {
    switch (timeframe) {
      case "1w":
        return generatePerformanceData(7)
      case "1m":
        return generatePerformanceData(30)
      case "3m":
        return generatePerformanceData(90)
      default:
        return generatePerformanceData(30)
    }
  }

  const performanceData = getPerformanceData()

  // Calculate summary statistics
  const latestData = performanceData[performanceData.length - 1]
  const averageAccuracy = latestData.accuracy.toFixed(1)
  const totalProfit = latestData.profit.toFixed(2)
  const totalSignals = latestData.signals

  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{agent.name} Performance</CardTitle>
        <Tabs defaultValue="1m" value={timeframe} onValueChange={setTimeframe}>
          <TabsList className="bg-gray-100 border border-gray-200">
            <TabsTrigger value="1w" className="data-[state=active]:bg-white">
              1W
            </TabsTrigger>
            <TabsTrigger value="1m" className="data-[state=active]:bg-white">
              1M
            </TabsTrigger>
            <TabsTrigger value="3m" className="data-[state=active]:bg-white">
              3M
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  // Show fewer ticks for better readability
                  const index = performanceData.findIndex((item) => item.date === value)
                  return index % Math.ceil(performanceData.length / 7) === 0 ? value : ""
                }}
              />
              <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="accuracy"
                name="Accuracy %"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="profit"
                name="Profit %"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
            <p className="text-xs text-gray-500">Avg. Accuracy</p>
            <p className="text-lg font-medium">{averageAccuracy}%</p>
          </div>
          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
            <p className="text-xs text-gray-500">Total Profit</p>
            <p className={`text-lg font-medium ${Number(totalProfit) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {Number(totalProfit) >= 0 ? "+" : ""}
              {totalProfit}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
            <p className="text-xs text-gray-500">Total Signals</p>
            <p className="text-lg font-medium">{totalSignals}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
