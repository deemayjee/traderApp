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
  Filler,
} from "chart.js"
import { fetchBinanceHistoricalData } from "@/lib/api/crypto-api"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

interface SimplePriceChartProps {
  selectedCoin: string
  timeRange: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "7d" | "30d"
  onTimeRangeChange?: (range: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "7d" | "30d") => void
}

export function SimplePriceChart({ selectedCoin, timeRange, onTimeRangeChange }: SimplePriceChartProps) {
  const [priceData, setPriceData] = useState<number[]>([])
  const [labels, setLabels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getTimeRangeFromTab = (tab: string): "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "7d" | "30d" => {
    switch (tab) {
      case "1M": return "1m"
      case "5M": return "5m"
      case "15M": return "15m"
      case "1H": return "1h"
      case "4H": return "4h"
      case "1D": return "1d"
      case "7D": return "7d"
      case "30D": return "30d"
      default: return "1d"
    }
  }

  const getTabFromTimeRange = (range: string): string => {
    switch (range) {
      case "1m": return "1M"
      case "5m": return "5M"
      case "15m": return "15M"
      case "1h": return "1H"
      case "4h": return "4H"
      case "1d": return "1D"
      case "7d": return "7D"
      case "30d": return "30D"
      default: return "1D"
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Map timeRange to Binance interval and limit
        const intervalMap: Record<string, { interval: string, limit: number }> = {
          "1m": { interval: "1m", limit: 60 },
          "5m": { interval: "5m", limit: 60 },
          "15m": { interval: "15m", limit: 60 },
          "1h": { interval: "1h", limit: 48 },
          "4h": { interval: "4h", limit: 60 },
          "1d": { interval: "1d", limit: 30 },
          "7d": { interval: "4h", limit: 42 }, // 7d = 42 x 4h
          "30d": { interval: "1d", limit: 30 },
        }
        const { interval, limit } = intervalMap[timeRange] || { interval: "1d", limit: 30 }
        const { prices, volumes } = await fetchBinanceHistoricalData(selectedCoin, interval, limit)
        
        // Format the data for the chart
        const formattedPrices = prices.map(([timestamp, price]: [number, number]) => price)
        const formattedLabels = prices.map(([timestamp]: [number, number]) => {
          const date = new Date(timestamp)
          switch (timeRange) {
            case "1m":
            case "5m":
            case "15m":
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            case "1h":
            case "4h":
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            case "1d":
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            case "7d":
              return date.toLocaleDateString([], { weekday: 'short' })
            case "30d":
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
            default:
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
          }
        })

        setPriceData(formattedPrices)
        setLabels(formattedLabels)
        setError(null)
      } catch (err) {
        console.error("Error fetching coin data:", err)
        setError("Failed to load chart data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    
    // Set up interval to refresh data every 10 seconds
    const interval = setInterval(fetchData, 10000)
    
    return () => clearInterval(interval)
  }, [selectedCoin, timeRange])

  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    if (price < 10) return price.toFixed(3)
    if (price < 1000) return price.toFixed(2)
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const priceChange = priceData.length > 0 
    ? ((priceData[priceData.length - 1] - priceData[0]) / priceData[0]) * 100 
    : 0
  const isPriceUp = priceChange > 0

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
        backgroundColor: isPriceUp 
          ? "rgba(16, 185, 129, 0.1)"
          : "rgba(239, 68, 68, 0.1)",
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgb(156, 163, 175)',
        bodyColor: 'rgb(243, 244, 246)',
        padding: 12,
        borderColor: 'rgba(75, 85, 99, 0.3)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          title: (tooltipItems: any) => {
            return labels[tooltipItems[0].dataIndex]
          },
          label: (context: any) => {
            return `$${formatPrice(context.raw)}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(75, 85, 99, 0.1)',
          tickLength: 0,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: 'rgb(156, 163, 175)',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
        border: {
          display: false,
        },
      },
      y: {
        position: 'right' as const,
        grid: {
          display: true,
          color: 'rgba(75, 85, 99, 0.1)',
          tickLength: 0,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: 'rgb(156, 163, 175)',
          callback: (value: any) => `$${formatPrice(value)}`,
        },
        border: {
          display: false,
        },
      },
    },
  }

  return (
    <Card className="border-border bg-background">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center">
          <CardTitle className="text-lg font-semibold mr-2">Price Chart</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-border">
                {selectedCoin} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem disabled>
                Select a token from the Market Overview
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Tabs 
          defaultValue={getTabFromTimeRange(timeRange)} 
          value={getTabFromTimeRange(timeRange)}
          onValueChange={(value) => onTimeRangeChange?.(getTimeRangeFromTab(value))}
        >
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="1M" className="data-[state=active]:bg-background">1M</TabsTrigger>
            <TabsTrigger value="5M" className="data-[state=active]:bg-background">5M</TabsTrigger>
            <TabsTrigger value="15M" className="data-[state=active]:bg-background">15M</TabsTrigger>
            <TabsTrigger value="1H" className="data-[state=active]:bg-background">1H</TabsTrigger>
            <TabsTrigger value="4H" className="data-[state=active]:bg-background">4H</TabsTrigger>
            <TabsTrigger value="1D" className="data-[state=active]:bg-background">1D</TabsTrigger>
            <TabsTrigger value="7D" className="data-[state=active]:bg-background">1W</TabsTrigger>
            <TabsTrigger value="30D" className="data-[state=active]:bg-background">1M</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold text-foreground">${formatPrice(priceData[priceData.length - 1])}</p>
            <p className={`text-sm ${isPriceUp ? "text-green-500" : "text-red-500"}`}>
              {isPriceUp ? "+" : ""}
              {priceChange.toFixed(2)}%
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="border-border">
              Indicators
            </Button>
            <Button variant="outline" size="sm" className="border-border">
              Compare
            </Button>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <Line data={data} options={options} />
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { label: "Open", value: formatPrice(priceData[0]) },
            { label: "High", value: formatPrice(Math.max(...priceData)) },
            { label: "Low", value: formatPrice(Math.min(...priceData)) },
            { label: "Volume", value: "N/A" },
          ].map((item, index) => (
            <div key={index} className="bg-muted/50 rounded-md p-3 border border-border">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium text-foreground">${item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
