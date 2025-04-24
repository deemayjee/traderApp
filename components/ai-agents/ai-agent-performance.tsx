import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react"
import type { AIAgent } from "./create-agent-dialog"

interface AIAgentPerformanceProps {
  agent: AIAgent
  signals: any[]
}

export function AIAgentPerformance({ agent, signals }: AIAgentPerformanceProps) {
  const agentSignals = signals.filter((signal) => signal.agentId === agent.id)

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Agent Performance</CardTitle>
          <Tabs defaultValue="signals">
            <TabsList className="bg-gray-100 border border-gray-200">
              <TabsTrigger value="signals" className="data-[state=active]:bg-white">
                Signals
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-white">
                Stats
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-white">
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {agentSignals.map((signal) => (
            <div key={signal.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium">{signal.agent}</h3>
                      <Badge
                        className={`ml-2 ${
                          signal.type === "Buy" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {signal.type}
                      </Badge>
                      <Badge className="ml-2 bg-gray-100 text-gray-600">{signal.asset}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{signal.signal}</p>
                  </div>
                </div>
                <Badge
                  className={`
                    ${
                      signal.result === "Success"
                        ? "bg-green-100 text-green-600"
                        : signal.result === "Failure"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600"
                    }
                  `}
                >
                  {signal.result}
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="font-medium">{signal.price}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-medium">{signal.time}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className="font-medium">{signal.confidence}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Result</p>
                  {signal.profit ? (
                    <p
                      className={`font-medium flex items-center ${
                        signal.profit.startsWith("+") ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {signal.profit.startsWith("+") ? (
                        <ArrowUp size={12} className="mr-1" />
                      ) : (
                        <ArrowDown size={12} className="mr-1" />
                      )}
                      {signal.profit}
                    </p>
                  ) : (
                    <p className="font-medium text-gray-600">-</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Performance</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Signals</p>
              <p className="font-medium">{agentSignals.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="font-medium">
                {agentSignals.length > 0
                  ? `${Math.round(
                      (agentSignals.filter((s) => s.result === "Success").length / agentSignals.length) * 100
                    )}%`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Profit</p>
              <p className="font-medium">
                {agentSignals.length > 0
                  ? `${Math.round(
                      agentSignals.reduce((acc, s) => acc + (s.profit || 0), 0) / agentSignals.length
                    )}%`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
