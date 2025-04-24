"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export function PriceChart() {
  const [timeframe, setTimeframe] = useState("1D")
  const [selectedCoin, setSelectedCoin] = useState("BTC")

  const timeframes = ["1H", "4H", "1D", "1W", "1M"]
  const coins = [
    { symbol: "BTC", name: "Bitcoin", price: "$43,256.78", change: "+2.34%" },
    { symbol: "ETH", name: "Ethereum", price: "$2,345.67", change: "+1.23%" },
    { symbol: "SOL", name: "Solana", price: "$138.45", change: "+12.4%" },
    { symbol: "AVAX", name: "Avalanche", price: "$35.78", change: "+8.7%" },
  ]

  const selectedCoinData = coins.find((coin) => coin.symbol === selectedCoin)

  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center">
          <CardTitle className="text-lg font-semibold mr-2">Price Chart</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-gray-200">
                {selectedCoin} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {coins.map((coin) => (
                <DropdownMenuItem key={coin.symbol} onClick={() => setSelectedCoin(coin.symbol)}>
                  {coin.symbol} - {coin.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Tabs defaultValue="1D" value={timeframe} onValueChange={setTimeframe}>
          <TabsList className="bg-gray-100 border border-gray-200">
            {timeframes.map((tf) => (
              <TabsTrigger key={tf} value={tf} className="data-[state=active]:bg-white">
                {tf}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold">{selectedCoinData?.price}</p>
            <p className="text-sm text-green-600">{selectedCoinData?.change} (24h)</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="border-gray-200">
              Indicators
            </Button>
            <Button variant="outline" size="sm" className="border-gray-200">
              Compare
            </Button>
          </div>
        </div>

        {/* Chart placeholder */}
        <div className="h-[300px] w-full bg-gray-50 rounded-md relative overflow-hidden border border-gray-200">
          <div className="absolute inset-0">
            <svg viewBox="0 0 100 40" className="h-full w-full">
              <path d="M0,20 Q10,18 20,25 T40,15 T60,20 T80,10 T100,15" fill="none" stroke="black" strokeWidth="0.5" />
              <path
                d="M0,40 L0,20 Q10,18 20,25 T40,15 T60,20 T80,10 T100,15 L100,40 Z"
                fill="url(#gradient)"
                opacity="0.1"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="black" />
                  <stop offset="100%" stopColor="black" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Interactive chart will be displayed here</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          {["Open", "High", "Low", "Volume"].map((label, index) => (
            <div key={index} className="bg-gray-50 rounded-md p-3 border border-gray-200">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-medium">
                {label === "Volume"
                  ? "$1.2B"
                  : label === "Open"
                    ? "$42,156.32"
                    : label === "High"
                      ? "$43,890.45"
                      : "$41,234.12"}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
