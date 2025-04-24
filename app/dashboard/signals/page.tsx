"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, AlertTriangle, Brain, Loader2, Trash2 } from "lucide-react"
import {
  fetchCryptoMarkets,
  generateAlertsFromCryptoData,
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

// Separate storage for alerts with proper typing
interface AlertStorage {
  saveAlert(alert: CryptoAlert): Promise<void>;
  getAlerts(): Promise<CryptoAlert[]>;
  deleteAlert(id: string): Promise<void>;
}

const alertStorage: AlertStorage = {
  async saveAlert(alert: CryptoAlert) {
    try {
      const alerts = await this.getAlerts()
      alerts.push(alert)
      localStorage.setItem('alerts', JSON.stringify(alerts))
      console.log('Alert saved successfully:', alert)
    } catch (error) {
      console.error('Error saving alert:', error)
      throw error
    }
  },
  
  async getAlerts(): Promise<CryptoAlert[]> {
    try {
      const alertsJson = localStorage.getItem('alerts')
      return alertsJson ? JSON.parse(alertsJson) : []
    } catch (error) {
      console.error('Error getting alerts:', error)
      return []
    }
  },
  
  async deleteAlert(id: string) {
    try {
      const alerts = await this.getAlerts()
      const filteredAlerts = alerts.filter(alert => alert.id !== id)
      localStorage.setItem('alerts', JSON.stringify(filteredAlerts))
      console.log('Alert deleted successfully:', id)
    } catch (error) {
      console.error('Error deleting alert:', error)
      throw error
    }
  }
}

// Update the component to include alert creation and deletion functionality
export default function SignalsPage() {
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

  // Initialize services
  const webSocket = useWebSocket()
  const { addNotification } = useNotifications()
  const signalValidator = new SignalValidator()

  // Connect to WebSocket on mount
  useEffect(() => {
    webSocket.connect()
    return () => webSocket.disconnect()
  }, [])

  // Monitor price updates and validate signals
  useEffect(() => {
    const validateActiveSignals = async () => {
      const activeSignals = await signalStorage.getActiveSignals()
      
      activeSignals.forEach(async (signal: CryptoSignal) => {
        const currentPrice = webSocket.lastPrice[signal.symbol]
        if (!currentPrice) return

        // Calculate 24h volatility (simplified)
        const volatility24h = 0.02 // This should be calculated from historical data

        const validation: ValidationResult = signalValidator.validateSignal(signal, currentPrice, volatility24h)
        
        if (!validation.isValid) {
          // Invalidate signal
          await signalStorage.updateSignalStatus(signal.id, 'invalidated')
          
          // Notify user
          addNotification(
            createRiskNotification(
              'Signal Invalidated',
              `${signal.symbol} signal invalidated: ${validation.message}`,
              'high',
              { signalId: signal.id }
            )
          )
        }
        
        // Check for significant price movements
        const priceChange = Math.abs(currentPrice - signal.priceValue) / signal.priceValue
        if (priceChange > 0.02) { // 2% price movement
          addNotification(
            createSignalNotification(
              'Significant Price Movement',
              `${signal.symbol} price moved ${(priceChange * 100).toFixed(1)}% from signal price`,
              'medium',
              { signalId: signal.id, priceChange }
            )
          )
        }
      })
    }

    // Validate signals every minute
    const interval = setInterval(validateActiveSignals, 60000)
    return () => clearInterval(interval)
  }, [webSocket.lastPrice])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Define the cryptocurrencies we want to analyze
        const cryptoIds = ["bitcoin", "ethereum", "solana", "binancecoin", "avalanche-2"]

        // Fetch market data for alerts and dropdown options
        const cryptoData = await fetchCryptoMarkets("usd", 10)

        // Prepare crypto options for the create alert dialog
        setCryptoOptions(
          cryptoData.map((crypto) => ({
            id: crypto.id,
            name: crypto.name,
            symbol: crypto.symbol.toUpperCase(),
            price: crypto.current_price,
          }))
        )

        setError(null)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load signals and alerts. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

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

  // Load alerts on component mount
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const savedAlerts = await alertStorage.getAlerts()
        setAlerts(savedAlerts)
      } catch (error) {
        console.error('Error loading alerts:', error)
      }
    }
    loadAlerts()
  }, [])

  // Handle creating a new alert
  const handleCreateAlert = async (newAlert: Omit<CryptoAlert, "id">) => {
    try {
      const alertWithId: CryptoAlert = {
        ...newAlert,
        id: generateUUID(),
      }

      await alertStorage.saveAlert(alertWithId)
      setAlerts(prevAlerts => [alertWithId, ...prevAlerts])
      
      addNotification(
        createSignalNotification(
          'New Alert Created',
          `Created new alert for ${alertWithId.symbol}`,
          'medium',
          alertWithId
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

  // Handle deleting an alert
  const handleDeleteAlert = async (id: string) => {
    try {
      await alertStorage.deleteAlert(id)
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id))
      
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

  // Handle filter changes
  const handleFilterChange = (newFilters: SignalsFilters) => {
    setFilters(newFilters)
  }

  // Handle deleting a signal
  const handleDeleteSignal = async (signalId: string) => {
    setSignals((prevSignals) => prevSignals.filter((signal) => signal.id !== signalId))
    await signalStorage.updateSignalStatus(signalId, 'invalidated')
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
          <Button className="bg-black text-white hover:bg-gray-800" onClick={() => setIsCreateAlertOpen(true)}>
            <Plus size={16} className="mr-2" /> Create Alert
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Trading Signals</CardTitle>
                <Tabs defaultValue="all" value={activeSignalTab} onValueChange={setActiveSignalTab}>
                  <TabsList className="bg-gray-100 border border-gray-200">
                    <TabsTrigger value="all" className="data-[state=active]:bg-white">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="buy" className="data-[state=active]:bg-white">
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="data-[state=active]:bg-white">
                      Sell
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {filteredSignals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No signals match your current filters.</p>
                  <Button
                    variant="outline"
                    className="mt-2 border-gray-200"
                    onClick={() =>
                      setFilters({
                        cryptos: [],
                        confidence: null,
                        timeframe: null,
                        agents: [],
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSignals.map((signal) => (
                    <div key={signal.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-gray-600" />
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{signal.agent}</h3>
                              <Badge
                                className={`ml-2 ${
                                  signal.type === "Buy" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                }`}
                              >
                                {signal.type}
                              </Badge>
                              <Badge className="ml-2 bg-gray-100 text-gray-600">{signal.symbol}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{signal.signal}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={`
                              ${
                                signal.result === "Success"
                                  ? "bg-green-100 text-green-600"
                                  : signal.result === "Failure"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-gray-100 text-gray-600"
                              }
                            `}
                          >
                            {signal.result}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                            onClick={() => handleDeleteSignal(signal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete signal</span>
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500">Price</p>
                          <p className="font-medium">{signal.price}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="font-medium">{signal.time}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Confidence</p>
                          <p className="font-medium">{signal.confidence}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Result</p>
                          {signal.profit ? (
                            <p
                              className={`font-medium ${
                                signal.profit.startsWith("+") ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {signal.profit}
                            </p>
                          ) : (
                            <p className="font-medium text-gray-600">-</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4 border-gray-200">
                View All Signals
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Signal Performance</CardTitle>
                <Tabs defaultValue="week">
                  <TabsList className="bg-gray-100 border border-gray-200">
                    <TabsTrigger value="week" className="data-[state=active]:bg-white">
                      Week
                    </TabsTrigger>
                    <TabsTrigger value="month" className="data-[state=active]:bg-white">
                      Month
                    </TabsTrigger>
                    <TabsTrigger value="year" className="data-[state=active]:bg-white">
                      Year
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] w-full bg-gray-50 rounded-md relative overflow-hidden border border-gray-200">
                <div className="absolute inset-0">
                  <svg viewBox="0 0 100 40" className="h-full w-full">
                    <path
                      d="M0,20 Q10,18 20,25 T40,15 T60,20 T80,10 T100,15"
                      fill="none"
                      stroke="black"
                      strokeWidth="0.5"
                    />
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
                  <p className="text-gray-400 text-sm">Signal performance chart will be displayed here</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                  <p className="text-xs text-gray-500">Success Rate</p>
                  <p className="text-lg font-medium text-green-600">78%</p>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                  <p className="text-xs text-gray-500">Avg. Profit</p>
                  <p className="text-lg font-medium">+3.2%</p>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                  <p className="text-xs text-gray-500">Total Signals</p>
                  <p className="text-lg font-medium">{signals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <TradingAlerts
            alerts={alerts}
            onDeleteAlert={handleDeleteAlert}
            onCreateAlert={() => setIsCreateAlertOpen(true)}
          />

          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-gray-600" />
                <CardTitle className="text-xl">AI Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {signals.slice(0, 3).map((signal, index) => (
                  <div key={`insight-${index}`} className="flex items-start space-x-3">
                    <div className="mt-1">
                      {index === 0 && <Brain className="h-5 w-5 text-green-600" />}
                      {index === 1 && <TrendingUp className="h-5 w-5 text-blue-600" />}
                      {index === 2 && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">
                        {signal.type} {signal.symbol} {index === 0 ? "Signal" : index === 1 ? "Trend" : "Warning"}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">{signal.signal}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {signal.time} • {signal.confidence}% confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" className="w-full border-gray-200">
                View All Insights
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateAlertDialog
        open={isCreateAlertOpen}
        onOpenChange={setIsCreateAlertOpen}
        onCreateAlert={handleCreateAlert}
        cryptoOptions={cryptoOptions}
      />
    </>
  )
}
