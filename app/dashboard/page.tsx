"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TopPerformers } from "@/components/dashboard/top-performers"
import { SimplePriceChart } from "@/components/dashboard/simple-price-chart"
import { AIInsights } from "@/components/dashboard/ai-insights"
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview"
import { TradingAlerts } from "@/components/dashboard/trading-alerts"
import { MarketOverview } from "@/components/dashboard/market-overview"
import { Loader2, Bell } from "lucide-react"
import {
  fetchBinanceTopTokens,
  type FormattedCryptoAsset,
  type CryptoAlert,
  type PortfolioAsset,
} from "@/lib/api/crypto-api"
import { CreateAlertDialog } from "@/components/dashboard/create-alert-dialog"
import { AlertMonitor } from "@/lib/services/alert-monitor"
import { PriceMonitor } from "@/lib/services/price-monitor"
import { toast } from "@/components/ui/use-toast"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { fetchAlerts, createAlert, updateAlert, deleteAlert } from "@/lib/services/alert-supabase"
import { EditAlertDialog } from "@/components/dashboard/edit-alert-dialog"
import { useWalletTokens } from "@/hooks/use-wallet-tokens"

// Define the time range type that matches SimplePriceChart's expectations
type ChartTimeRange = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "7d" | "30d"

// Define the insight type that matches AIInsights' expectations
interface Insight {
  symbol: string
  insight: string
  confidence: "high" | "medium" | "low"
  timestamp: string
}

// Define the AI insight object returned from the API
interface AIInsightResponse {
  symbol: string
  insight_text: string
  confidence: "high" | "medium" | "low"
  timestamp: string
}

// Define the alert type that matches TradingAlerts' expectations
interface TradingAlert {
  id: string
  type: "price" | "volume" | "trend"
  symbol: string
  condition: string
  value: number
  active: boolean
  priority: "high" | "medium" | "low"
  timestamp: string
}

export default function Dashboard() {
  const [marketData, setMarketData] = useState<FormattedCryptoAsset[]>([])
  const [selectedToken, setSelectedToken] = useState<FormattedCryptoAsset | null>(null)
  const [timeRange, setTimeRange] = useState<ChartTimeRange>("1d")
  const [alerts, setAlerts] = useState<CryptoAlert[]>([])
  const [showCreateAlert, setShowCreateAlert] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const alertMonitorRef = useRef<AlertMonitor | null>(null)
  const priceMonitorRef = useRef<PriceMonitor | null>(null)
  const { getWalletAddress } = useWalletAuth()
  const [editingAlert, setEditingAlert] = useState<CryptoAlert | null>(null)
  const [isEditAlertOpen, setIsEditAlertOpen] = useState(false)
  const { assets: walletAssets, isLoading: walletLoading } = useWalletTokens();
  const [highPriorityInsights, setHighPriorityInsights] = useState<Insight[]>([]);
  const marketDataRef = useRef<FormattedCryptoAsset[]>([]);
  marketDataRef.current = marketData;

  // Load alerts from Supabase
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const walletAddress = getWalletAddress()
        if (!walletAddress) return
        const storedAlerts = await fetchAlerts(walletAddress)
        setAlerts(storedAlerts)
      } catch (error) {
        console.error("Error loading alerts:", error)
      }
    }
    loadAlerts()
  }, [getWalletAddress])

  // Memoize the price monitor callback to prevent unnecessary re-renders
  const handlePriceUpdate = useCallback((updatedAssets: FormattedCryptoAsset[]) => {
    setMarketData(prevData => {
      // Only update if there are actual changes
      const hasChanges = updatedAssets.some((newAsset, index) => {
        const oldAsset = prevData[index]
        return oldAsset && (
          newAsset.price !== oldAsset.price ||
          newAsset.change !== oldAsset.change ||
          newAsset.volume !== oldAsset.volume
        )
      })

      return hasChanges ? updatedAssets : prevData
    })

    // Update selected token only if it exists and has changed
    if (selectedToken) {
      const updatedToken = updatedAssets.find(asset => asset.symbol === selectedToken.symbol)
      if (updatedToken && (
        updatedToken.price !== selectedToken.price ||
        updatedToken.change !== selectedToken.change ||
        updatedToken.volume !== selectedToken.volume
      )) {
        setSelectedToken(updatedToken)
      }
    }
  }, [selectedToken])

  useEffect(() => {
    // Initialize alert monitor
    alertMonitorRef.current = new AlertMonitor({
      onAlertTriggered: (alert) => {
        toast({
          title: "Alert Triggered!",
          description: `${alert.symbol} ${alert.type} alert: ${alert.condition} ${alert.value}`,
          action: <Bell className="h-4 w-4" />,
        })
      }
    })

    // Initialize price monitor with memoized callback
    priceMonitorRef.current = new PriceMonitor({
      onPriceUpdate: handlePriceUpdate
    })

    return () => {
      // Cleanup monitors
      alertMonitorRef.current?.stop()
      priceMonitorRef.current?.stop()
    }
  }, [handlePriceUpdate])

  useEffect(() => {
    // Update alert monitor when alerts change
    if (alertMonitorRef.current) {
      alertMonitorRef.current.updateAlerts(alerts)
      const activeAlerts = alerts.filter(alert => alert.active)
      if (activeAlerts.length > 0) {
        alertMonitorRef.current.start(activeAlerts)
      } else {
        alertMonitorRef.current.stop()
      }
    }
  }, [alerts])

  useEffect(() => {
    // Update price monitor when market data changes
    if (priceMonitorRef.current) {
      priceMonitorRef.current.updateAssets(marketData)
    }
  }, [marketData])

  useEffect(() => {
    async function loadMarketData() {
      try {
        setIsLoading(true)
        const data = await fetchBinanceTopTokens(10)
        setMarketData(data)
        
        // Set initial selected token
        if (data.length > 0) {
          setSelectedToken(data[0])
        }

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

  useEffect(() => {
    // Fetch latest insights on page load
    const fetchExistingInsights = async () => {
      const res = await fetch('/api/ai-insights?limit=3');
      const data = await res.json();
      if (data.insights) {
        setHighPriorityInsights(data.insights.map((i: AIInsightResponse) => ({
          symbol: i.symbol,
          insight: i.insight_text,
          confidence: i.confidence,
          timestamp: i.timestamp,
        })));
      }
    };
    fetchExistingInsights();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      const currentMarketData = marketDataRef.current;
      const significantChanges = currentMarketData.filter(token => Math.abs(token.changePercent) > 5).slice(0, 3);
      // Round changePercent for DB consistency
      console.log('[AI Insights] fetchInsights called. Significant changes:', significantChanges.map(t => ({ symbol: t.symbol, changePercent: Math.round(t.changePercent * 100) / 100 })));
      if (significantChanges.length === 0) {
        if (isMounted) setHighPriorityInsights([]);
        return;
      }
      const insights: Insight[] = [];
      for (const token of significantChanges) {
        const symbol = token.symbol;
        const changePercent = Math.round(token.changePercent * 100) / 100;
        const insightText = `Strong ${changePercent > 0 ? 'bullish' : 'bearish'} momentum detected`;
        const confidence = 'high';
        // Try to fetch from DB
        const res = await fetch(`/api/ai-insights?symbol=${encodeURIComponent(symbol)}&changePercent=${encodeURIComponent(changePercent)}`);
        const data = await res.json();
        if (data.insight) {
          insights.push({
            symbol,
            insight: data.insight.insight_text,
            confidence: data.insight.confidence,
            timestamp: data.insight.timestamp,
          });
        } else {
          // Not found, create
          const postRes = await fetch('/api/ai-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol, changePercent, insightText, confidence }),
          });
          const postData = await postRes.json();
          if (postData.insight) {
            insights.push({
              symbol,
              insight: postData.insight.insight_text,
              confidence: postData.insight.confidence,
              timestamp: postData.insight.timestamp,
            });
          }
        }
      }
      if (isMounted) setHighPriorityInsights(insights);
    };
    // Set up interval
    const interval = setInterval(async () => {
      await fetchInsights();
      // After generating, fetch the latest insights to display
      const res = await fetch('/api/ai-insights?limit=3');
      const data = await res.json();
      if (data.insights) {
        setHighPriorityInsights(data.insights.map((i: AIInsightResponse) => ({
          symbol: i.symbol,
          insight: i.insight_text,
          confidence: i.confidence,
          timestamp: i.timestamp,
        })));
      }
    }, 60 * 60 * 1000); // every hour
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTokenSelect = (token: FormattedCryptoAsset) => {
    setSelectedToken(token)
  }

  const handleTimeRangeChange = (newRange: ChartTimeRange) => {
    setTimeRange(newRange)
  }

  const handleCreateAlert = () => {
    setShowCreateAlert(true)
  }

  const handleCreateAlertSubmit = async (newAlert: Omit<CryptoAlert, "id">) => {
    try {
      const walletAddress = getWalletAddress()
      if (!walletAddress) throw new Error('No wallet address')
      const created = await createAlert(newAlert, walletAddress)
      setAlerts(prev => [...prev, created])
      setShowCreateAlert(false)
      toast({
        title: "Alert created",
        description: `${created.symbol} ${created.type} alert when ${created.condition} ${created.value} has been created.`,
      })
    } catch (error) {
      console.error("Error creating alert:", error)
      toast({
        title: "Error",
        description: "Failed to create alert. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const walletAddress = getWalletAddress()
      if (!walletAddress) throw new Error('No wallet address')
      await deleteAlert(alertId, walletAddress)
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      toast({
        title: "Alert deleted",
        description: "Alert has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting alert:", error)
      toast({
        title: "Error",
        description: "Failed to delete alert. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleToggleAlert = async (alertId: string) => {
    try {
      const alert = alerts.find(a => a.id === alertId)
      if (!alert) return
      const updated = await updateAlert({ ...alert, active: !alert.active })
      setAlerts(prev => prev.map(a => a.id === updated.id ? updated : a))
    } catch (error) {
      console.error("Error toggling alert:", error)
      toast({
        title: "Error",
        description: "Failed to toggle alert. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleEditAlert = (alert: CryptoAlert) => {
    setEditingAlert(alert)
    setIsEditAlertOpen(true)
  }

  const handleSaveEditedAlert = async (updatedAlert: CryptoAlert) => {
    try {
      const walletAddress = getWalletAddress()
      if (!walletAddress) throw new Error('No wallet address')
      const updated = await updateAlert({ ...updatedAlert, wallet_address: walletAddress })
      setAlerts(prev => prev.map(a => a.id === updated.id ? updated : a))
      setIsEditAlertOpen(false)
      setEditingAlert(null)
      toast({
        title: 'Alert updated',
        description: `Alert for ${updated.symbol} updated successfully.`
      })
    } catch (error) {
      console.error('Error updating alert:', error)
      toast({
        title: 'Error',
        description: 'Failed to update alert. Please try again.',
        variant: 'destructive',
      })
    }
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

  // Filter alerts to show only high-priority ones on dashboard
  const highPriorityAlerts = useMemo(() => 
    alerts
      .filter(alert => alert.active)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3), // Show only the 3 most recent active alerts
    [alerts]
  )

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
              {walletLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                </div>
              ) : (
                <PortfolioOverview assets={walletAssets} />
              )}
            </div>
          </div>
          <div className="space-y-6">
            <AIInsights insights={highPriorityInsights} isPreview={true} />
            <TradingAlerts 
              alerts={highPriorityAlerts}
              onCreateAlert={handleCreateAlert}
              onDeleteAlert={handleDeleteAlert}
              onToggleAlert={handleToggleAlert}
              onEditAlert={handleEditAlert}
              isPreview={true}
            />
          </div>
        </div>

        <CreateAlertDialog 
          open={showCreateAlert} 
          onOpenChange={setShowCreateAlert}
          onCreateAlert={handleCreateAlertSubmit}
          cryptoOptions={marketData.map(token => ({
            id: token.id,
            name: token.name,
            symbol: token.symbol,
            price: token.priceValue
          }))}
          walletAddress={getWalletAddress() || ''}
        />

        <EditAlertDialog
          open={isEditAlertOpen}
          onOpenChange={setIsEditAlertOpen}
          alert={editingAlert}
          onEditAlert={handleSaveEditedAlert}
          cryptoOptions={marketData.map(token => ({
            id: token.id,
            name: token.name,
            symbol: token.symbol,
            price: token.priceValue
          }))}
        />
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
            {walletLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              </div>
            ) : (
              <PortfolioOverview assets={walletAssets} />
            )}
          </div>
        </div>
        <div className="space-y-6">
          <AIInsights insights={highPriorityInsights} isPreview={true} />
          <TradingAlerts 
            alerts={highPriorityAlerts}
            onCreateAlert={handleCreateAlert}
            onDeleteAlert={handleDeleteAlert}
            onToggleAlert={handleToggleAlert}
            onEditAlert={handleEditAlert}
            isPreview={true}
          />
        </div>
      </div>

      <CreateAlertDialog 
        open={showCreateAlert} 
        onOpenChange={setShowCreateAlert}
        onCreateAlert={handleCreateAlertSubmit}
        cryptoOptions={marketData.map(token => ({
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          price: token.priceValue
        }))}
        walletAddress={getWalletAddress() || ''}
      />

      <EditAlertDialog
        open={isEditAlertOpen}
        onOpenChange={setIsEditAlertOpen}
        alert={editingAlert}
        onEditAlert={handleSaveEditedAlert}
        cryptoOptions={marketData.map(token => ({
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          price: token.priceValue
        }))}
      />
    </>
  )
}
