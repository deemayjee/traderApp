"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Loader2 } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { fetchCryptoById, type CryptoAsset } from "@/lib/api/crypto-api"

interface PriceChartProps {
  initialCoin?: string
}

export function PriceChartRecharts({ initialCoin = "bitcoin" }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState("1D")
  const [selectedCoin, setSelectedCoin] = useState(initialCoin)
  const [coinData, setCoinData] = useState<CryptoAsset | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const timeframes = ["1H", "4H", "1D", "1W", "1M"]
  const coins = [
    { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
    { id: "ethereum", symbol: "ETH", name: "Ethereum" },
    { id: "solana", symbol: "SOL", name: "Solana" },
    { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  ]

  // Fetch coin data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await fetchCryptoById(selectedCoin)
        setCoinData(data)

        // Generate chart data based on the selected timeframe
        generateChartData(data, timeframe)
        setError(null)
      } catch (err) {
        console.error("Error fetching coin data:", err)
        setError("Failed to load chart data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedCoin, timeframe])

  // Generate mock chart data based on current price
  const generateChartData = (data: CryptoAsset, timeframe: string) => {
    if (!data) return

    try {
      const currentPrice = data.current_price
      const priceChange = data.price_change_24h || currentPrice * 0.01 // Fallback if price_change_24h is missing
      const volatility = Math.abs(priceChange / currentPrice) * 2

      // Determine number of data points based on timeframe
      const points =
        timeframe === "1H" ? 60 : timeframe === "4H" ? 48 : timeframe === "1D" ? 24 : timeframe === "1W" ? 7 : 30

      const chartData = []
      let lastPrice = currentPrice - priceChange

      for (let i = 0; i < points; i++) {
        // Create realistic price movements
        const randomChange = (Math.random() - 0.5) * volatility * lastPrice * 0.01
        lastPrice = i === points - 1 ? currentPrice : lastPrice + randomChange

        // Format date based on timeframe
        let date = new Date()
        if (timeframe === "1H") {
          date = new Date(date.getTime() - (points - i) * 60000)
        } else if (timeframe === "4H") {
          date = new Date(date.getTime() - (points - i) * 15 * 60000)
        } else if (timeframe === "1D") {
          date = new Date(date.getTime() - (points - i) * 3600000)
        } else if (timeframe === "1W") {
          date = new Date(date.getTime() - (points - i) * 86400000)
        } else {
          date = new Date(date.getTime() - (points - i) * 86400000)
        }

        // Format time label
        let timeLabel
        if (timeframe === "1H" || timeframe === "4H") {
          timeLabel = `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
        } else if (timeframe === "1D") {
          timeLabel = `${date.getHours()}:00`
        } else {
          timeLabel = `${date.getMonth() + 1}/${date.getDate()}`
        }

        chartData.push({
          time: timeLabel,
          price: Number.parseFloat(lastPrice.toFixed(2)),
          timestamp: date.getTime(),
        })
      }

      setChartData(chartData)
    } catch (error) {
      console.error("Error generating chart data:", error)
      // Create simple fallback data if there's an error
      const fallbackData = Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        price: data.current_price * (0.95 + (i / 24) * 0.1),
        timestamp: Date.now() - (24 - i) * 3600000,
      }))
      setChartData(fallbackData)
    }
  }

  const selectedCoinData = coins.find((coin) => coin.id === selectedCoin)
  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    if (price < 10) return `$${price.toFixed(3)}`
    if (price < 1000) return `$${price.toFixed(2)}`
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const priceChangePercent = coinData?.price_change_percentage_24h || 0
  const isPriceUp = priceChangePercent > 0

  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center">
          <CardTitle className="text-lg font-semibold mr-2">Price Chart</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-gray-200">
                {selectedCoinData?.symbol || "BTC"} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {coins.map((coin) => (
                <DropdownMenuItem key={coin.id} onClick={() => setSelectedCoin(coin.id)}>
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
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="border-gray-200">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">{coinData ? formatPrice(coinData.current_price) : "$0.00"}</p>
                <p className={`text-sm ${isPriceUp ? "text-green-600" : "text-red-600"}`}>
                  {isPriceUp ? "+" : ""}
                  {priceChangePercent.toFixed(2)}% (24h)
                </p>
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

            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPriceUp ? "#10b981" : "#ef4444"} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={isPriceUp ? "#10b981" : "#ef4444"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis
                      domain={["auto", "auto"]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickFormatter={(value) => formatPrice(value)}
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                      labelFormatter={(label) => `Time: ${label}`}
                      contentStyle={{ borderRadius: "0.375rem", border: "1px solid #e5e7eb" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPriceUp ? "#10b981" : "#ef4444"}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No chart data available</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4">
              {coinData &&
                [
                  { label: "Open", value: formatPrice(coinData.current_price - coinData.price_change_24h) },
                  { label: "High", value: formatPrice(coinData.high_24h) },
                  { label: "Low", value: formatPrice(coinData.low_24h) },
                  { label: "Volume", value: `$${(coinData.total_volume / 1000000000).toFixed(1)}B` },
                ].map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
