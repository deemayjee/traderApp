import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, TrendingUp, Percent, BarChart3 } from "lucide-react"
import type { AIAgent } from "./create-agent-dialog"

interface AIAgentPerformanceProps {
  agent: AIAgent
  signals: any[]
}

export function AIAgentPerformance({ agent, signals }: AIAgentPerformanceProps) {
  const agentSignals = signals.filter((signal) => signal.agentId === agent.id)

  return (
    <Card className="border-gray-200 shadow-lg rounded-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Agent Performance</CardTitle>
          <Tabs defaultValue="signals">
            <TabsList className="bg-gray-100 border border-gray-200 dark:bg-muted/80 dark:border-gray-800">
              <TabsTrigger value="signals" className="data-[state=active]:bg-white dark:data-[state=active]:bg-background dark:data-[state=active]:text-white">
                Signals
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-white dark:data-[state=active]:bg-background dark:data-[state=active]:text-white">
                Stats
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-white dark:data-[state=active]:bg-background dark:data-[state=active]:text-white">
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1 flex flex-col items-center">
            <TrendingUp className="h-8 w-8 text-blue-500 mb-2" />
            <div className="text-3xl font-bold">{agentSignals.length}</div>
            <div className="text-sm text-gray-500">Total Signals</div>
          </div>
          <div className="hidden md:block h-16 border-l border-gray-200 mx-6" />
          <div className="flex-1 flex flex-col items-center">
            <Percent className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-3xl font-bold">
              {agentSignals.length > 0
                ? `${Math.round((agentSignals.filter((s) => s.result === "Success").length / agentSignals.length) * 100)}%`
                : "N/A"}
            </div>
            <div className="text-sm text-gray-500">Success Rate</div>
          </div>
          <div className="hidden md:block h-16 border-l border-gray-200 mx-6" />
          <div className="flex-1 flex flex-col items-center">
            <BarChart3 className="h-8 w-8 text-purple-500 mb-2" />
            <div className="text-3xl font-bold">
              {agentSignals.length > 0
                ? `${Math.round(agentSignals.reduce((acc, s) => acc + (s.profit || 0), 0) / agentSignals.length)}%`
                : "N/A"}
            </div>
            <div className="text-sm text-gray-500">Average Profit</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
