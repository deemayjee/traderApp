"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TopPerformers } from "@/components/dashboard/top-performers"
import { SimplePriceChart } from "@/components/dashboard/simple-price-chart"
import { AIInsights } from "@/components/dashboard/ai-insights"
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview"
import { TradingAlerts } from "@/components/dashboard/trading-alerts"
import { MarketOverview } from "@/components/dashboard/market-overview"
import { Loader2 } from "lucide-react"
import {
  fetchCryptoMarkets,
  generateAlertsFromCryptoData,
  generatePortfolioFromCryptoData,
  type FormattedCryptoAsset,
  type CryptoAlert,
  type PortfolioAsset,
  type TimeRange,
  fetchMarketData,
} from "@/lib/api/crypto-api"
import { CreateAlertDialog } from "@/components/dashboard/create-alert-dialog"

export default function Dashboard() {
  const [marketData, setMarketData] = useState<FormattedCryptoAsset[]>([])
  const [selectedToken, setSelectedToken] = useState<FormattedCryptoAsset | null>(null)
  const [timeRange, setTimeRange] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "7d" | "30d" | "3m" | "6m" | "1y">("1d")
  const [alerts, setAlerts] = useState<CryptoAlert[]>([])
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([])
  const [showCreateAlert, setShowCreateAlert] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMarketData() {
      try {
        setIsLoading(true)
        const data = await fetchMarketData()
        setMarketData(data)
        
        // Set initial selected token
        if (data.length > 0) {
          setSelectedToken(data[0])
        }

        // Generate mock data
        setAlerts(generateAlertsFromCryptoData(data))
        setPortfolioAssets(generatePortfolioFromCryptoData(data))
        setError(null)
      } catch (err) {
        console.error("Error loading market data:", err)
        setError("Failed to load market data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    loadMarketData()
  }, [])

  const handleTokenSelect = (token: FormattedCryptoAsset) => {
    setSelectedToken(token)
  }

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange)
  }

  const handleCreateAlert = () => {
    setShowCreateAlert(true)
  }

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== alertId))
  }

  const handleToggleAlert = (alertId: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId ? { ...alert, active: !alert.active } : alert
      )
    )
  }

  // Get top performers
  const topPerformers = [...marketData]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3)

  // Prepare chart component
  const chartComponent = selectedToken ? (
    <SimplePriceChart 
      selectedCoin={selectedToken.symbol} 
      timeRange={timeRange}
      onTimeRangeChange={handleTimeRangeChange}
    />
  ) : null

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <>
        <DashboardHeader />
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded relative mb-6 mt-6">
          <strong className="font-bold">Note: </strong>
          <span className="block sm:inline">{error}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {chartComponent}
            {marketData.length > 0 && (
              <MarketOverview 
                marketData={marketData} 
                className="mt-6" 
                onTokenSelect={handleTokenSelect}
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {topPerformers.length > 0 && <TopPerformers topCoins={topPerformers} />}
              {portfolioAssets.length > 0 && <PortfolioOverview assets={portfolioAssets} />}
            </div>
          </div>
          <div className="space-y-6">
            <AIInsights />
            <TradingAlerts 
              alerts={alerts}
              onCreateAlert={handleCreateAlert}
              onDeleteAlert={handleDeleteAlert}
              onToggleAlert={handleToggleAlert}
            />
          </div>
        </div>

        <CreateAlertDialog open={showCreateAlert} onOpenChange={setShowCreateAlert} />
      </>
    )
  }

  return (
    <>
      <DashboardHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          {chartComponent}
          {marketData.length > 0 && (
            <MarketOverview 
              marketData={marketData} 
              className="mt-6" 
              onTokenSelect={handleTokenSelect}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {topPerformers.length > 0 && <TopPerformers topCoins={topPerformers} />}
            {portfolioAssets.length > 0 && <PortfolioOverview assets={portfolioAssets} />}
          </div>
        </div>
        <div className="space-y-6">
          <AIInsights />
          <TradingAlerts 
            alerts={alerts}
            onCreateAlert={handleCreateAlert}
            onDeleteAlert={handleDeleteAlert}
            onToggleAlert={handleToggleAlert}
          />
        </div>
      </div>

      <CreateAlertDialog open={showCreateAlert} onOpenChange={setShowCreateAlert} />
    </>
  )
}
