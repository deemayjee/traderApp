import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Settings, ArrowUpRight, StopCircle } from "lucide-react"

export function ActiveCopies() {
  const copies = [
    {
      trader: {
        name: "Alex Thompson",
        handle: "@alexthompson",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      allocation: "$1,000",
      profit: "+$187.40",
      profitPercent: "+18.74%",
      positive: true,
      copiedTrades: 24,
      successRate: 83,
      startDate: "May 15, 2023",
    },
    {
      trader: {
        name: "Sarah Chen",
        handle: "@sarahtrader",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      allocation: "$750",
      profit: "+$92.25",
      profitPercent: "+12.3%",
      positive: true,
      copiedTrades: 18,
      successRate: 72,
      startDate: "June 3, 2023",
    },
  ]

  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Active Copy Trades</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {copies.length > 0 ? (
          <>
            {copies.map((copy, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={copy.trader.avatar || "/placeholder.svg"} alt={copy.trader.name} />
                      <AvatarFallback>{copy.trader.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{copy.trader.name}</p>
                      <p className="text-xs text-gray-500">{copy.trader.handle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {copy.profit} ({copy.profitPercent})
                    </p>
                    <p className="text-xs text-gray-500">Since {copy.startDate}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Allocation</p>
                    <p className="font-medium">{copy.allocation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Copied Trades</p>
                    <p className="font-medium">{copy.copiedTrades}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Success Rate</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={copy.successRate} className="h-1 flex-1" />
                      <span className="text-xs font-medium">{copy.successRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between">
                  <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-gray-900 p-0">
                    View details <ArrowUpRight size={12} className="ml-1" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs border-gray-200">
                    <StopCircle size={14} className="mr-1" /> Stop Copying
                  </Button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">You are not copying any traders yet.</p>
            <Button className="mt-4 bg-black text-white hover:bg-gray-800">Start Copy Trading</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
