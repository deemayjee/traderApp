"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Loader2 } from "lucide-react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { type CryptoAsset } from "@/lib/api/crypto-api"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

interface SimplePriceChartProps {
  selectedCoin: string
  timeRange: "1d" | "7d" | "30d" | "1y"
}

export function SimplePriceChart({ selectedCoin, timeRange }: SimplePriceChartProps) {
  const [timeframe, setTimeframe] = useState("1D")
  const [selectedCoinData, setSelectedCoinData] = useState<CryptoAsset | null>(null)
  const [priceData, setPriceData] = useState<number[]>([])
  const [labels, setLabels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const timeframes = ["1H", "4H", "1D", "1W", "1M"]
  const coins = [
    { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
    { id: "ethereum", symbol: "ETH", name: "Ethereum" },
    { id: "solana", symbol: "SOL", name: "Solana" },
    { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  ]

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${selectedCoin}/market_chart?vs_currency=usd&days=${
            timeRange === "1d" ? 1 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 365
          }`,
        )
        const data = await response.json()
        const prices = data.prices.map((price: [number, number]) => price[1])
        const timestamps = data.prices.map((price: [number, number]) =>
          new Date(price[0]).toLocaleDateString(),
        )
        setPriceData(prices)
        setLabels(timestamps)
        setError(null)
      } catch (err) {
        console.error("Error fetching coin data:", err)
        setError("Failed to load chart data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedCoin, timeRange])

  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    if (price < 10) return price.toFixed(3)
    if (price < 1000) return price.toFixed(2)
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const priceChangePercent = selectedCoinData?.price_change_percentage_24h || 0
  const isPriceUp = priceChangePercent > 0

  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-gray-200">
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="border-gray-200">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const data = {
    labels,
    datasets: [
      {
        label: "Price",
        data: priceData,
        borderColor: isPriceUp ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)",
        tension: 0.1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  }

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
                <DropdownMenuItem key={coin.id} onClick={() => setSelectedCoinData(coin as CryptoAsset)}>
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
            <p className="text-2xl font-bold">${formatPrice(priceData[priceData.length - 1])}</p>
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
          <Line data={data} options={options} />
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          {selectedCoinData && [
            { label: "Open", value: formatPrice(selectedCoinData.current_price - selectedCoinData.price_change_24h) },
            { label: "High", value: formatPrice(selectedCoinData.high_24h) },
            { label: "Low", value: formatPrice(selectedCoinData.low_24h) },
            { label: "Volume", value: `${(selectedCoinData.total_volume / 1000000000).toFixed(1)}B` },
          ].map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-md p-3 border border-gray-200">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-sm font-medium">${item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
