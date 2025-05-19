"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { AIAgent } from "./create-agent-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, LineChart as LineChartIcon, AlertCircle } from "lucide-react"
import { TrendingUp } from "lucide-react"
import { Percent } from "lucide-react"

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
  type TimePeriod = "24h" | "7d" | "30d" | "90d"
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7d")
  const [selectedMetric, setSelectedMetric] = useState("accuracy")

  // Process signals data for the selected time period
  const processData = () => {
    const now = new Date()
    const periodMs: Record<TimePeriod, number> = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    }

    const filteredSignals = signals
      .filter(signal => signal.agentId === agent.id)
      .filter(signal => {
        const signalDate = new Date(signal.timestamp)
        return now.getTime() - signalDate.getTime() <= periodMs[timePeriod]
      })

    // Group signals by day
    const groupedData = filteredSignals.reduce((acc, signal) => {
      const date = new Date(signal.timestamp).toISOString().split("T")[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          signals: 0,
          success: 0,
          profit: 0,
        }
      }
      acc[date].signals++
      if (signal.result === "Success") {
        acc[date].success++
        acc[date].profit += signal.profit || 0
      }
      return acc
    }, {})

    // Convert to array and calculate metrics
    return Object.values(groupedData)
      .map((day: any) => ({
        date: day.date,
        accuracy: day.signals > 0 ? (day.success / day.signals) * 100 : 0,
        profit: day.profit,
        signals: day.signals,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const data = processData()

  return (
    <Card className="border-gray-200 shadow-lg rounded-xl">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-xl font-bold">Performance Analysis</CardTitle>
          <div className="flex items-center space-x-4">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accuracy">Accuracy</SelectItem>
                <SelectItem value="profit">Profit</SelectItem>
                <SelectItem value="signals">Signals</SelectItem>
              </SelectContent>
            </Select>
            <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
              <TabsList className="bg-gray-100 border border-gray-200 dark:bg-muted/80 dark:border-gray-800">
                <TabsTrigger value="24h" className="data-[state=active]:bg-white dark:data-[state=active]:bg-background dark:data-[state=active]:text-white">24h</TabsTrigger>
                <TabsTrigger value="7d" className="data-[state=active]:bg-white dark:data-[state=active]:bg-background dark:data-[state=active]:text-white">7d</TabsTrigger>
                <TabsTrigger value="30d" className="data-[state=active]:bg-white dark:data-[state=active]:bg-background dark:data-[state=active]:text-white">30d</TabsTrigger>
                <TabsTrigger value="90d" className="data-[state=active]:bg-white dark:data-[state=active]:bg-background dark:data-[state=active]:text-white">90d</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center bg-background rounded-lg border border-dashed border-gray-300 mb-6">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-500">
              <LineChartIcon className="h-12 w-12 mb-2 text-gray-400" />
              <div className="font-semibold mb-1">No Data Available</div>
              <div className="text-sm">There are no signals or performance data for this period.</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date)
                    return timePeriod === "24h" 
                      ? d.toLocaleTimeString([], { hour: "2-digit" })
                      : d.toLocaleDateString([], { month: "short", day: "numeric" })
                  }}
                />
                <YAxis 
                  tickFormatter={(value) => 
                    selectedMetric === "profit" 
                      ? `${value}%` 
                      : selectedMetric === "accuracy"
                      ? `${value}%`
                      : value
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-gray-500">
                            Accuracy: {data.accuracy.toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-500">
                            Profit: {data.profit.toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-500">
                            Signals: {data.signals}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg flex flex-col items-center shadow-sm border border-gray-200">
            <Percent className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-base text-gray-500 mb-1">Average Accuracy</p>
            <p className="text-2xl font-bold">
              {data.length > 0
                ? `${(data.reduce((acc, d) => acc + d.accuracy, 0) / data.length).toFixed(1)}%`
                : "N/A"}
            </p>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg flex flex-col items-center shadow-sm border border-gray-200">
            <BarChart3 className="h-6 w-6 text-purple-500 mb-2" />
            <p className="text-base text-gray-500 mb-1">Total Profit</p>
            <p className="text-2xl font-bold">
              {data.length > 0
                ? `${data.reduce((acc, d) => acc + d.profit, 0).toFixed(1)}%`
                : "N/A"}
            </p>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg flex flex-col items-center shadow-sm border border-gray-200">
            <TrendingUp className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-base text-gray-500 mb-1">Total Signals</p>
            <p className="text-2xl font-bold">
              {data.reduce((acc, d) => acc + d.signals, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
