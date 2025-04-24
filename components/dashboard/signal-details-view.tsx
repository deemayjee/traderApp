import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, AlertTriangle, Clock, BarChart2, Target, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"

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

interface SignalDetailsViewProps {
  insight: AIInsight
}

export function SignalDetailsView({ insight }: SignalDetailsViewProps) {
  // Generate mock data for the detailed view
  const getEntryPrice = () => {
    const basePrices: Record<string, number> = {
      BTC: 89250,
      ETH: 3450,
      USDT: 1.0,
    }
    return basePrices[insight.asset] || 100
  }

  const getTargetPrice = () => {
    const entryPrice = getEntryPrice()
    return insight.type === "buy"
      ? (entryPrice * (1 + Math.random() * 0.15)).toFixed(2)
      : (entryPrice * (1 - Math.random() * 0.15)).toFixed(2)
  }

  const getStopLoss = () => {
    const entryPrice = getEntryPrice()
    return insight.type === "buy"
      ? (entryPrice * (1 - Math.random() * 0.08)).toFixed(2)
      : (entryPrice * (1 + Math.random() * 0.08)).toFixed(2)
  }

  const getIcon = () => {
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

  const getTypeColor = () => {
    switch (insight.type) {
      case "buy":
        return "text-green-600"
      case "sell":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getSuccessRate = (timeframe: string) => {
    // Generate random success rates based on the insight's accuracy
    const base = insight.accuracy
    const variations: Record<string, number> = {
      "1h": Math.min(100, base + Math.floor(Math.random() * 8)),
      "4h": Math.min(100, base + Math.floor(Math.random() * 5)),
      "1d": base,
      "1w": Math.max(50, base - Math.floor(Math.random() * 10)),
    }
    return variations[timeframe] || base
  }

  const entryPrice = getEntryPrice()
  const targetPrice = getTargetPrice()
  const stopLoss = getStopLoss()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h2 className={`text-xl font-semibold ${getTypeColor()}`}>
              {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} {insight.asset} {insight.signalType}
            </h2>
            <p className="text-gray-600">{insight.description}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1">
          {insight.confidence}% confidence
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Clock size={16} />
        <span>Generated {insight.time} • Valid for next 24 hours</span>
      </div>

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
                {insight.type === "buy" ? "Bullish" : "Bearish"} signal detected based on{" "}
                {insight.description.toLowerCase()}. This signal has historically shown {insight.accuracy}% accuracy
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
                    {insight.type === "buy" ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500 ml-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500 ml-1" />
                    )}
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

          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Recent Similar Signals</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="text-sm">
                    <div className="font-medium">
                      {insight.asset} {insight.type === "buy" ? "Buy" : "Sell"} Signal
                    </div>
                    <div className="text-gray-500">3 days ago</div>
                  </div>
                  <Badge variant={insight.type === "buy" ? "success" : "destructive"}>
                    {insight.type === "buy" ? "+8.2%" : "-5.7%"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="text-sm">
                    <div className="font-medium">
                      {insight.asset} {insight.type === "buy" ? "Buy" : "Sell"} Signal
                    </div>
                    <div className="text-gray-500">2 weeks ago</div>
                  </div>
                  <Badge variant={insight.type === "buy" ? "success" : "destructive"}>
                    {insight.type === "buy" ? "+12.5%" : "-9.3%"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="text-sm">
                    <div className="font-medium">
                      {insight.asset} {insight.type === "buy" ? "Buy" : "Sell"} Signal
                    </div>
                    <div className="text-gray-500">1 month ago</div>
                  </div>
                  <Badge variant={insight.type === "buy" ? "success" : "destructive"}>
                    {insight.type === "buy" ? "+5.8%" : "-7.1%"}
                  </Badge>
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
                    {insight.type === "buy" ? "28.5" : "72.3"}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      {insight.type === "buy" ? "(Oversold)" : "(Overbought)"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">MACD</div>
                  <div className="font-semibold">
                    {insight.type === "buy" ? "Bullish Crossover" : "Bearish Crossover"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Moving Averages</div>
                  <div className="font-semibold">{insight.type === "buy" ? "Buy (8/4)" : "Sell (9/3)"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Volume</div>
                  <div className="font-semibold">
                    {insight.type === "buy" ? "+32% (Increasing)" : "-18% (Decreasing)"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Chart Pattern</h3>
                <BarChart2 className="h-5 w-5 text-gray-500" />
              </div>
              <div className="bg-gray-100 h-48 rounded flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <p>Chart visualization would appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Dismiss</Button>
        <Button>{insight.type === "buy" ? "Create Buy Order" : "Create Sell Order"}</Button>
      </div>
    </div>
  )
}
