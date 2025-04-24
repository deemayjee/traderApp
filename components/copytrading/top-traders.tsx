import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, ArrowUpRight, Filter } from "lucide-react"

export function TopTraders() {
  const traders = [
    {
      name: "Alex Thompson",
      handle: "@alexthompson",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: true,
      roi: "+187.4%",
      winRate: "78%",
      followers: 1245,
      trades: 342,
      risk: "Medium",
    },
    {
      name: "Sarah Chen",
      handle: "@sarahtrader",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: true,
      roi: "+142.8%",
      winRate: "72%",
      followers: 876,
      trades: 215,
      risk: "Low",
    },
    {
      name: "Michael Rodriguez",
      handle: "@cryptomike",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: true,
      roi: "+98.3%",
      winRate: "65%",
      followers: 543,
      trades: 187,
      risk: "High",
    },
    {
      name: "Emma Wilson",
      handle: "@emmatrades",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: false,
      roi: "+76.5%",
      winRate: "62%",
      followers: 321,
      trades: 124,
      risk: "Medium",
    },
  ]

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Top Traders</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-8 border-gray-200">
              <Filter size={14} className="mr-1" /> Filter
            </Button>
            <Tabs defaultValue="roi">
              <TabsList className="bg-gray-100 border border-gray-200">
                <TabsTrigger value="roi" className="text-xs data-[state=active]:bg-white">
                  ROI
                </TabsTrigger>
                <TabsTrigger value="winrate" className="text-xs data-[state=active]:bg-white">
                  Win Rate
                </TabsTrigger>
                <TabsTrigger value="followers" className="text-xs data-[state=active]:bg-white">
                  Followers
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {traders.map((trader, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={trader.avatar || "/placeholder.svg"} alt={trader.name} />
                    <AvatarFallback>{trader.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium">{trader.name}</p>
                      {trader.verified && (
                        <Badge variant="outline" className="ml-2 border-blue-200 text-blue-600 bg-blue-50">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{trader.handle}</p>
                  </div>
                </div>
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Copy size={14} className="mr-1" /> Copy
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500">ROI (30d)</p>
                  <p className="font-medium text-green-600">{trader.roi}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Win Rate</p>
                  <p className="font-medium">{trader.winRate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Followers</p>
                  <p className="font-medium">{trader.followers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Risk Level</p>
                  <Badge
                    className={`
                      ${
                        trader.risk === "Low"
                          ? "bg-green-100 text-green-600"
                          : trader.risk === "Medium"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-red-100 text-red-600"
                      }
                    `}
                  >
                    {trader.risk}
                  </Badge>
                </div>
              </div>

              <Button variant="ghost" size="sm" className="mt-2 text-xs text-gray-600 hover:text-gray-900 p-0">
                View detailed performance <ArrowUpRight size={12} className="ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
