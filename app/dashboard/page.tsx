"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TopPerformers } from "@/components/dashboard/top-performers"
import { SimplePriceChart } from "@/components/dashboard/simple-price-chart"
import { AIInsights } from "@/components/dashboard/ai-insights"
import { CommunitySignals } from "@/components/dashboard/community-signals"
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview"
import { TradingAlerts } from "@/components/dashboard/trading-alerts"
import { MarketOverview } from "@/components/dashboard/market-overview"
import { Loader2 } from "lucide-react"
import {
  fetchCryptoMarkets,
  formatCryptoAsset,
  generateAlertsFromCryptoData,
  generatePortfolioFromCryptoData,
  generateSignalsFromCryptoData,
  type FormattedCryptoAsset,
  type CryptoAlert,
  type CryptoSignal,
  type PortfolioAsset,
} from "@/lib/api/crypto-api"
import { MOCK_CRYPTO_DATA } from "@/lib/api/mock-crypto-data"
import { CreateAlertDialog } from "@/components/dashboard/create-alert-dialog"

// Add a state to track chart errors
export default function Dashboard() {
  const [marketData, setMarketData] = useState<FormattedCryptoAsset[]>([])
  const [topPerformers, setTopPerformers] = useState<FormattedCryptoAsset[]>([])
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([])
  const [alerts, setAlerts] = useState<CryptoAlert[]>([])
  const [signals, setSignals] = useState<CryptoSignal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useSimpleChart, setUseSimpleChart] = useState(false)
  const [showCreateAlert, setShowCreateAlert] = useState(false)

  const handleToggleAlert = (id: string) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === id ? { ...alert, active: !alert.active } : alert
      )
    )
  }

  const handleDeleteAlert = (id: string) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id))
  }

  // Add error handling for the chart
  useEffect(() => {
    const handleChartError = () => {
      console.log("Chart error detected, switching to simple chart")
      setUseSimpleChart(true)
    }

    window.addEventListener("error", handleChartError)

    return () => {
      window.removeEventListener("error", handleChartError)
    }
  }, [])

  // Update the useEffect for fetching data to handle errors better
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch market data
        const cryptoData = await fetchCryptoMarkets("usd", 10)
        const formattedData = cryptoData.map(formatCryptoAsset)
        setMarketData(formattedData.slice(0, 5))

        // Sort by price change for top performers
        const sortedByChange = [...formattedData].sort((a, b) => b.changePercent - a.changePercent)
        setTopPerformers(sortedByChange.slice(0, 5))

        // Generate portfolio data
        const portfolio = generatePortfolioFromCryptoData(cryptoData)
        setPortfolioAssets(portfolio)

        setError(null)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please try again later.")
        // Set empty data
        setMarketData([])
        setTopPerformers([])
        setPortfolioAssets([])
        setAlerts([])
        setSignals([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreateAlert = () => {
    setShowCreateAlert(true)
  }

  // Force simple chart for now to ensure it works
  const chartComponent = <SimplePriceChart />

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  // Update the error display to show a warning instead of an error when using mock data
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
            {marketData.length > 0 && <MarketOverview marketData={marketData} className="mt-6" />}
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

        <div className="mt-6">
          <CommunitySignals />
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
          {marketData.length > 0 && <MarketOverview marketData={marketData} className="mt-6" />}
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

      <div className="mt-6">
        <CommunitySignals />
      </div>

      <CreateAlertDialog open={showCreateAlert} onOpenChange={setShowCreateAlert} />
    </>
  )
}
