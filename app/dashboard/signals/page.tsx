"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, AlertTriangle, Brain, Loader2, Trash2 } from "lucide-react"
import {
  fetchCryptoMarkets,
  generateRealSignals,
  type CryptoAlert,
  type CryptoSignal,
} from "@/lib/api/crypto-api"
import { CreateAlertDialog } from "@/components/dashboard/create-alert-dialog"
import { generateUUID } from "@/lib/utils/uuid"
import { TradingAlerts } from "@/components/dashboard/trading-alerts"
import { SignalsFilter, type SignalsFilters } from "@/components/dashboard/signals-filter"
import { useWebSocket } from '@/lib/services/websocket-service'
import { SignalValidator, type ValidationResult } from '@/lib/services/signal-validation'
import { signalStorage } from '@/lib/services/signal-storage'
import { useNotifications, createSignalNotification, createRiskNotification } from '@/lib/services/notification-service'
import { toast } from "@/components/ui/use-toast"
import { SignalFilterToggle } from "@/components/dashboard/signal-toggle-filter"
import { EditAlertDialog } from '@/components/dashboard/edit-alert-dialog'
import { useWalletAuth } from "@/components/auth/wallet-context"
import { fetchAlerts, createAlert, updateAlert, deleteAlert } from "@/lib/services/alert-supabase"
import { SignalMonitor } from "@/lib/services/signal-monitor"
import type { FC } from 'react'

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

const SignalsPage: FC = () => {
  const [alerts, setAlerts] = useState<CryptoAlert[]>([])
  const [signals, setSignals] = useState<CryptoSignal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSignalTab, setActiveSignalTab] = useState("all")
  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false)
  const [cryptoOptions, setCryptoOptions] = useState<
    Array<{ id: string; name: string; symbol: string; price: number }>
  >([])
  const [filters, setFilters] = useState<SignalsFilters>({
    cryptos: [],
    confidence: null,
    timeframe: null,
    agents: [],
  })
  const [editingAlert, setEditingAlert] = useState<CryptoAlert | null>(null)
  const [isEditAlertOpen, setIsEditAlertOpen] = useState(false)
  const [aiInsights, setAiInsights] = useState<Insight[]>([])
  const { user } = useWalletAuth();
  const walletAddress = user?.address;

  // Initialize services
  const webSocket = useWebSocket()
  const { addNotification } = useNotifications()
  const signalValidator = new SignalValidator()
  const signalMonitorRef = useRef<SignalMonitor | null>(null)

  // Connect to WebSocket on mount
  useEffect(() => {
    webSocket.connect()
    return () => webSocket.disconnect()
  }, [])

  // Initialize signal monitor
  useEffect(() => {
    signalMonitorRef.current = new SignalMonitor(
      (updatedSignals) => {
        // Only update if signals have actually changed
        setSignals(prev => {
          if (JSON.stringify(prev) === JSON.stringify(updatedSignals)) return prev;
          return updatedSignals;
        });
      },
      (notification) => addNotification(notification)
    )
    signalMonitorRef.current.start()

    return () => {
      signalMonitorRef.current?.stop()
    }
  }, []) // Empty dependency array since we only want to initialize once

  // Update signal monitor with new signals
  useEffect(() => {
    if (signalMonitorRef.current) {
      signalMonitorRef.current.updateSignals(signals)
    }
  }, [signals]) // Only update when signals change

  // Update signal monitor with price updates
  useEffect(() => {
    if (signalMonitorRef.current && webSocket.lastPrice) {
      Object.entries(webSocket.lastPrice).forEach(([symbol, price]) => {
        signalMonitorRef.current?.updatePrice(symbol, price)
      })
    }
  }, [webSocket.lastPrice]) // Only update when prices change

  // On mount, check if signals exist in the database. Only generate if empty.
  useEffect(() => {
    let isMounted = true;

    const checkAndFetchSignals = async () => {
      setIsLoading(true);
      try {
        // Fetch signals from DB
        const response = await fetch('/api/signals?limit=10');
        if (!response.ok) throw new Error('Failed to fetch signals');
        const data = await response.json();

        if (isMounted) {
          if (data.signals && data.signals.length > 0) {
            // If signals exist, set them and do NOT generate new ones
            setSignals(data.signals);
          } else {
            // If no signals, generate and then fetch again
            const cryptoIds = ["BTC", "ETH", "SOL", "BNB", "AVAX"];
            await generateRealSignals(cryptoIds);
            // Wait for signals to be saved
            await new Promise(res => setTimeout(res, 2000));
            // Fetch again
            const resp2 = await fetch('/api/signals?limit=10');
            const data2 = await resp2.json();
            if (data2.signals) setSignals(data2.signals);
          }
        }
      } catch (error) {
        if (isMounted) setError(error instanceof Error ? error.message : 'Failed to load signals');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAndFetchSignals();

    return () => { isMounted = false; };
  }, []);

  // Separate effect for fetching market data - run every 5 minutes
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchMarketData = async () => {
      try {
        if (!isMounted) return;

        const cryptoData = await fetchCryptoMarkets()
        console.log('Fetched crypto market data:', cryptoData)

        if (isMounted) {
          setCryptoOptions(
            cryptoData.map((crypto) => ({
              id: crypto.id,
              name: crypto.name,
              symbol: crypto.symbol.toUpperCase(),
              price: crypto.priceValue,
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching market data:', error)
      }
    }

    const scheduleNextFetch = () => {
      timeoutId = setTimeout(() => {
        fetchMarketData()
        scheduleNextFetch()
      }, 300000) // Fetch every 5 minutes
    }

    // Initial fetch
    fetchMarketData()
    scheduleNextFetch()

    return () => {
      isMounted = false;
      clearTimeout(timeoutId)
    }
  }, []) // Empty dependency array - only run once on mount

  // Get unique cryptocurrencies from signals for filter options
  const availableCryptos = useMemo(() => {
    const cryptoSet = new Set<string>()
    signals.forEach((signal) => cryptoSet.add(signal.symbol))
    return Array.from(cryptoSet)
  }, [signals])

  // Filter signals based on active tab and filters
  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      // Filter by tab (Buy/Sell/All)
      if (activeSignalTab !== "all" && signal.type.toLowerCase() !== activeSignalTab) {
        return false
      }

      // Filter by cryptocurrency
      if (filters.cryptos.length > 0 && !filters.cryptos.includes(signal.symbol)) {
        return false
      }

      // Filter by agent
      if (filters.agents.length > 0 && !filters.agents.includes(signal.agent)) {
        return false
      }

      // Filter by confidence
      if (filters.confidence !== null && signal.confidence < filters.confidence) {
        return false
      }

      // Filter by timeframe
      if (filters.timeframe !== null) {
        // Simple timeframe filtering logic - can be enhanced
        if (filters.timeframe === "24h" && !signal.time.includes("h")) {
          return false
        } else if (filters.timeframe === "1w" && signal.time.includes("d") && Number.parseInt(signal.time) > 7) {
          return false
        } else if (filters.timeframe === "1m" && signal.time.includes("d") && Number.parseInt(signal.time) > 30) {
          return false
        }
      }

      return true
    })
  }, [signals, activeSignalTab, filters])

  // Fetch alerts from Supabase on mount or when walletAddress changes
  useEffect(() => {
    if (!walletAddress) return;
    fetchAlerts(walletAddress)
      .then(setAlerts)
      .catch((error) => {
        console.error('Error fetching alerts:', error)
        toast({
          title: 'Error',
          description: 'Failed to load alerts from database.',
          variant: 'destructive',
        })
      })
  }, [walletAddress])

  // Fetch AI insights on page load
  useEffect(() => {
    const fetchExistingInsights = async () => {
      const res = await fetch('/api/ai-insights?limit=3');
      const data = await res.json();
      if (data.insights) {
        setAiInsights(data.insights.map((i: AIInsightResponse) => ({
          symbol: i.symbol,
          insight: i.insight_text,
          confidence: i.confidence,
          timestamp: i.timestamp,
        })));
      }
    };
    fetchExistingInsights();
  }, []);

  // Create alert in Supabase
  const handleCreateAlert = async (newAlert: Omit<CryptoAlert, "id">) => {
    try {
      console.log('DEBUG: walletAddress', walletAddress)
      console.log('DEBUG: newAlert', newAlert)
      if (!walletAddress) throw new Error('No wallet address')
      const created = await createAlert({ ...newAlert, wallet_address: walletAddress }, walletAddress)
      console.log('DEBUG: createAlert response', created)
      setAlerts(prev => [created, ...prev])
      addNotification(
        createSignalNotification(
          'New Alert Created',
          `Created new alert for ${created.symbol}`,
          'medium',
          created
        )
      )
    } catch (error) {
      console.error('Error creating alert:', error)
      toast({
        title: "Error",
        description: "Failed to create alert. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Edit alert in Supabase
  const handleSaveEditedAlert = async (updatedAlert: CryptoAlert) => {
    try {
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

  // Delete alert in Supabase
  const handleDeleteAlert = async (id: string) => {
    try {
      if (!walletAddress) throw new Error('No wallet address')
      await deleteAlert(id, walletAddress)
      setAlerts(prev => prev.filter(alert => alert.id !== id))
      addNotification(
        createSignalNotification(
          'Alert Deleted',
          'Alert has been deleted successfully',
          'medium'
        )
      )
    } catch (error) {
      console.error('Error deleting alert:', error)
      toast({
        title: "Error",
        description: "Failed to delete alert. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Toggle alert active state in Supabase
  const handleToggleAlert = async (id: string) => {
    try {
      const alert = alerts.find(a => a.id === id)
      if (!alert) return
      const updated = await updateAlert({ ...alert, active: !alert.active })
      setAlerts(prev => prev.map(a => a.id === updated.id ? updated : a))
    } catch (error) {
      console.error('Error toggling alert:', error)
      toast({
        title: "Error",
        description: "Failed to toggle alert. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: SignalsFilters) => {
    setFilters(newFilters)
  }

  // Handle deleting a signal
  const handleDeleteSignal = async (signalId: string) => {
    setSignals((prevSignals) => prevSignals.filter((signal) => signal.id !== signalId))
    await signalStorage.updateSignalStatus(signalId, 'invalidated')
  }

  // Handle editing an alert
  const handleEditAlert = (alert: CryptoAlert) => {
    setEditingAlert(alert)
    setIsEditAlertOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="border-gray-200">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Signals & Alerts</h1>
          <p className="text-sm text-gray-500">Manage your trading signals and price alerts</p>
        </div>

        <div className="flex items-center space-x-3">
          <SignalsFilter
            onFilterChange={handleFilterChange}
            activeFilters={filters}
            availableCryptos={availableCryptos}
          />
          <Button className="" onClick={() => setIsCreateAlertOpen(true)}>
            <Plus size={16} className="mr-2" /> Create Alert
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-background border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Trading Signals</CardTitle>
                <SignalFilterToggle 
                  value={activeSignalTab} 
                  onValueChange={setActiveSignalTab} 
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredSignals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No signals found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSignals.map((signal) => (
                    <div key={signal.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{signal.agent}</h3>
                              <Badge
                                className={`ml-2 ${
                                  signal.type === "Buy" ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                                }`}
                              >
                                {signal.type}
                              </Badge>
                              <Badge className="ml-2 bg-muted text-muted-foreground">{signal.symbol}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{signal.signal}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteSignal(signal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="font-medium">{signal.price}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Time</p>
                          <p className="font-medium">{signal.time}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Confidence</p>
                          <p className="font-medium">{signal.confidence}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Result</p>
                          {signal.profit ? (
                            <p
                              className={`font-medium ${
                                signal.profit.startsWith("+") ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {signal.profit}
                            </p>
                          ) : (
                            <p className="font-medium text-muted-foreground">-</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4 border-border">
                View All Signals
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <TradingAlerts
            alerts={alerts}
            onDeleteAlert={handleDeleteAlert}
            onCreateAlert={() => setIsCreateAlertOpen(true)}
            onToggleAlert={handleToggleAlert}
            onEditAlert={handleEditAlert}
          />

          <Card className="bg-background border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-muted-foreground" />
                <CardTitle className="text-xl">AI Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <div key={`insight-${index}`} className="flex items-start space-x-3">
                    <div className="mt-1">
                      {index === 0 && <Brain className="h-5 w-5 text-green-600" />}
                      {index === 1 && <TrendingUp className="h-5 w-5 text-blue-600" />}
                      {index === 2 && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">
                        {insight.symbol} Market Insight
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">{insight.insight}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(insight.timestamp).toLocaleString()} • {insight.confidence} confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateAlertDialog
        open={isCreateAlertOpen}
        onOpenChange={setIsCreateAlertOpen}
        onCreateAlert={handleCreateAlert}
        cryptoOptions={cryptoOptions}
        walletAddress={walletAddress || ''}
      />

      <EditAlertDialog
        open={isEditAlertOpen}
        onOpenChange={setIsEditAlertOpen}
        alert={editingAlert}
        onEditAlert={handleSaveEditedAlert}
        cryptoOptions={cryptoOptions}
      />
    </>
  )
}

export default SignalsPage
