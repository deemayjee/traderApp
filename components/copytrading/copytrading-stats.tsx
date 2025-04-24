import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp } from "lucide-react"

export function CopyTradingStats() {
  const stats = [
    {
      label: "Total Allocation",
      value: "$1,750.00",
      change: "+$250.00 (16.7%)",
      positive: true,
    },
    {
      label: "Total Profit",
      value: "$279.65",
      change: "+15.98%",
      positive: true,
    },
    {
      label: "Copied Traders",
      value: "2",
      change: "+1 this month",
      positive: true,
    },
    {
      label: "Copied Trades",
      value: "42",
      change: "+12 this week",
      positive: true,
    },
  ]

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Copy Trading Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-green-600 flex items-center">
                <ArrowUp size={12} className="mr-1" />
                {stat.change}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
