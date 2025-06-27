"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Loader2, AlertTriangle, Wallet, DollarSign, TrendingUp, Shield, Zap, Brain, Bot } from "lucide-react"
import { generateUUID } from "@/lib/utils/uuid"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { hyperliquidWalletService } from "@/lib/services/hyperliquid-wallet-service"
import { toast } from "sonner"
import { hyperliquidService, TradingPair } from '@/lib/services/hyperliquid-service'
import { agentSupabase } from "@/lib/services/agent-supabase"

export type AIAgentType = "Technical Analysis" | "On-chain Analysis" | "Macro Analysis"

export interface AIAgent {
  id: string
  name: string
  type: AIAgentType
  description: string
  active?: boolean
  accuracy?: number
  signals?: number
  lastSignal?: string
  custom?: boolean
  riskTolerance?: number
  focusAssets: string[]
  indicators?: string[]
  // New Hyperliquid trading properties
  walletAddress?: string
  tradingEnabled?: boolean
  maxPositionSize: number
  maxDailyLoss?: number
  stopLoss?: number
  takeProfit?: number
  leverage: number
  tradingPairs: string[]
  autoTrade?: boolean
  // Additional properties for new interface
  strategy?: string
  dailyLossLimit?: number
  stopLossPercentage?: number
  takeProfitPercentage?: number
  isActive?: boolean
  totalPnl?: number
  winRate?: number
  totalTrades?: number
  createdAt?: string
}

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgentCreated?: (agent: AIAgent) => void
}

export function CreateAgentDialog({ open, onOpenChange, onAgentCreated }: CreateAgentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [walletBalance, setWalletBalance] = useState<string>("0")
  const { user } = useWalletAuth()

  // Basic Configuration
  const [name, setName] = useState("")
  const [type, setType] = useState("technical")
  const [description, setDescription] = useState("")
  const [riskTolerance, setRiskTolerance] = useState([50])
  const [focusAssets, setFocusAssets] = useState<string[]>(["BTC", "ETH"])
  const [indicators, setIndicators] = useState<string[]>(["RSI", "MACD", "Moving Averages"])

  // Trading Configuration
  const [tradingEnabled, setTradingEnabled] = useState(true)
  const [autoTrade, setAutoTrade] = useState(false)
  const [maxPositionSize, setMaxPositionSize] = useState([1000])
  const [maxDailyLoss, setMaxDailyLoss] = useState([500])
  const [stopLoss, setStopLoss] = useState([5])
  const [takeProfit, setTakeProfit] = useState([15])
  const [leverage, setLeverage] = useState([3])
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([])
  const [selectedTradingPairs, setSelectedTradingPairs] = useState<string[]>([])

  const hyperliquidPairs = [
    "ETH-USD", "BTC-USD", "SOL-USD", "AVAX-USD", "LINK-USD", "DOT-USD",
    "MATIC-USD", "ADA-USD", "UNI-USD", "AAVE-USD", "SUSHI-USD", "COMP-USD"
  ]

  const assetOptions = ["BTC", "ETH", "SOL", "AVAX", "LINK", "DOT", "MATIC", "ADA"]
  const indicatorOptions = ["RSI", "MACD", "Moving Averages", "Bollinger Bands", "Volume", "Support/Resistance"]

  const typeOptions = [
    { value: "technical", label: "Technical Analysis", description: "Chart patterns, indicators, price action" },
    { value: "onchain", label: "On-chain Analysis", description: "Wallet flows, DeFi metrics, network activity" },
    { value: "macro", label: "Macro Analysis", description: "Market sentiment, news, macro trends" },
    { value: "arbitrage", label: "Arbitrage", description: "Cross-exchange price differences" },
    { value: "market-making", label: "Market Making", description: "Provide liquidity and capture spread" },
  ]

  const [loading, setLoading] = useState(false)
  const [loadingPairs, setLoadingPairs] = useState(false)
  const [formData, setFormData] = useState<Partial<AIAgent>>({
    name: '',
    description: '',
    strategy: 'trend_following',
    maxPositionSize: 100,
    dailyLossLimit: 50,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    leverage: 1,
    focusAssets: [],
    tradingPairs: [],
    isActive: false,
    riskTolerance: 50
  })

  const [riskAcknowledged, setRiskAcknowledged] = useState(false)

  useEffect(() => {
    if (user?.address && open) {
      checkWalletBalance()
      loadTradingPairs()
    }
  }, [user?.address, open])

  const checkWalletBalance = async () => {
    if (!user?.address) return
    try {
      const balance = await hyperliquidWalletService.getWalletBalance(user.address)
      setWalletBalance(balance)
    } catch (error) {
      console.error("Error checking wallet balance:", error)
      toast.error("Failed to check wallet balance")
    }
  }

  const loadTradingPairs = async () => {
    setLoadingPairs(true)
    try {
      const pairs = await hyperliquidService.getTradingPairs()
      setTradingPairs(pairs)
    } catch (error) {
      console.error('Failed to load trading pairs:', error)
      // Use fallback pairs if API fails
      setTradingPairs([
        { symbol: 'BTC-USD', name: 'BTC', maxLeverage: 50, isIsolatedOnly: false },
        { symbol: 'ETH-USD', name: 'ETH', maxLeverage: 50, isIsolatedOnly: false },
        { symbol: 'SOL-USD', name: 'SOL', maxLeverage: 20, isIsolatedOnly: false },
        { symbol: 'AVAX-USD', name: 'AVAX', maxLeverage: 20, isIsolatedOnly: false },
        { symbol: 'DOGE-USD', name: 'DOGE', maxLeverage: 20, isIsolatedOnly: false }
      ])
    } finally {
      setLoadingPairs(false)
    }
  }

  const getTypeLabel = (value: string) => {
    return typeOptions.find((option) => option.value === value)?.label || value
  }

  const toggleAsset = (asset: string) => {
    setFocusAssets((prev) => (prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]))
  }

  const toggleIndicator = (indicator: string) => {
    setIndicators((prev) => (prev.includes(indicator) ? prev.filter((i) => i !== indicator) : [...prev, indicator]))
  }

  const toggleTradingPair = (pair: string) => {
    setSelectedTradingPairs((prev) => (prev.includes(pair) ? prev.filter((p) => p !== pair) : [...prev, pair]))
  }

  const validateAgent = (): boolean => {
    if (!name.trim()) {
      toast.error("Agent name is required")
      return false
    }
    if (!user?.address) {
      toast.error("Wallet must be connected to create trading agents")
      return false
    }
    if (tradingEnabled && maxPositionSize[0] > parseFloat(walletBalance) * 1000) {
      toast.error("Max position size exceeds wallet balance")
      return false
    }
    if (selectedTradingPairs.length === 0) {
      toast.error("At least one trading pair must be selected")
      return false
    }
    return true
  }

  const handleInputChange = useCallback((field: keyof AIAgent, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleStepNavigation = (step: number) => {
    setCurrentStep(step)
  }

  const handleCreateAgent = async () => {
    setIsSubmitting(true)
    try {
      // Map strategy to type for database compatibility
      const getTypeFromStrategy = (strategy: string): AIAgentType => {
        switch (strategy) {
          case 'technical':
          case 'trend_following':
            return 'Technical Analysis'
          case 'onchain':
            return 'On-chain Analysis'
          case 'macro':
            return 'Macro Analysis'
          default:
            return 'Technical Analysis'
        }
      }

      // Deploy agent to Hyperliquid
      const newAgent: AIAgent = {
        id: `agent_${Date.now()}`,
        name: formData.name || 'Unnamed Agent',
        type: getTypeFromStrategy(formData.strategy || 'technical'),
        description: formData.description || '',
        strategy: formData.strategy || 'trend_following',
        maxPositionSize: formData.maxPositionSize || 100,
        dailyLossLimit: formData.dailyLossLimit || 50,
        stopLossPercentage: formData.stopLossPercentage || 5,
        takeProfitPercentage: formData.takeProfitPercentage || 10,
        leverage: formData.leverage || 1,
        focusAssets: formData.focusAssets || [],
        tradingPairs: formData.tradingPairs || [],
        active: true, // Enable the agent by default
        isActive: true, // Enable automation by default
        riskTolerance: formData.riskTolerance || 50,
        indicators: ['RSI', 'MACD'], // Default indicators
        totalPnl: 0,
        winRate: 0,
        totalTrades: 0,
        createdAt: new Date().toISOString()
      }

      // Save agent to database
      if (user?.address) {
        await agentSupabase.saveAgent(newAgent, user.address)
        toast.success('Agent created successfully!')
      }
      
      onAgentCreated?.(newAgent)
      onOpenChange(false)
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        strategy: 'trend_following',
        maxPositionSize: 100,
        dailyLossLimit: 50,
        stopLossPercentage: 5,
        takeProfitPercentage: 10,
        leverage: 1,
        focusAssets: [],
        tradingPairs: [],
        isActive: false,
        riskTolerance: 50
      })
      setRiskAcknowledged(false)
      setCurrentStep(1)
    } catch (error) {
      console.error('Failed to create agent:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 3) {
      handleCreateAgent()
    }
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <span>Deploy AI Trading Agent</span>
          </DialogTitle>
          <DialogDescription>
            Create an intelligent trading agent that will monitor Hyperliquid markets and execute trades automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Wallet Status */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Connected Wallet</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : "Not connected"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{parseFloat(walletBalance).toFixed(4)} HYPE</p>
                <p className="text-sm text-muted-foreground">Available Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Progress */}
        <div className="flex items-center justify-center space-x-4 py-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  currentStep > step ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleFormSubmit}>
          {/* Step 1: Basic Configuration */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Basic Configuration</h3>
                <p className="text-sm text-muted-foreground">Set up your agent's identity and analysis type</p>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="agent-name" className="text-right">
                    Agent Name
                  </Label>
                  <Input
                    id="agent-name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Alpha Scalper Pro"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="agent-type" className="text-right">
                    Strategy Type
                  </Label>
                  <div className="col-span-3">
                    <Select value={formData.strategy} onValueChange={(value) => handleInputChange('strategy', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select strategy type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="col-span-3"
                    placeholder="Brief description of your trading strategy"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Focus Assets</Label>
                  <div className="col-span-3 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      What cryptocurrencies should your AI analyze?
                    </p>
                    
                    <Select 
                      value="" 
                      onValueChange={(value) => {
                        if (value && !formData.focusAssets?.includes(value)) {
                          const updated = [...(formData.focusAssets || []), value]
                          handleInputChange('focusAssets', updated)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assets to analyze..." />
                      </SelectTrigger>
                      <SelectContent>
                        {assetOptions
                          .filter(asset => !formData.focusAssets?.includes(asset))
                          .map((asset) => (
                            <SelectItem key={asset} value={asset}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{asset}</span>
                                <Badge variant="outline" className="text-xs">
                                  Crypto
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {formData.focusAssets && formData.focusAssets.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Selected Assets ({formData.focusAssets.length}):</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.focusAssets.map((asset) => (
                            <div key={asset} className="flex items-center gap-1 bg-green-50 dark:bg-green-950 rounded-md px-3 py-1.5 border">
                              <span className="text-sm font-medium">{asset}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"
                                onClick={() => {
                                  const updated = formData.focusAssets?.filter(a => a !== asset) || []
                                  handleInputChange('focusAssets', updated)
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Indicators</Label>
                  <div className="col-span-3 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Which technical indicators should your AI use?
                    </p>
                    
                    <Select 
                      value="" 
                      onValueChange={(value) => {
                        if (value && !formData.indicators?.includes(value)) {
                          const updated = [...(formData.indicators || []), value]
                          handleInputChange('indicators', updated)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select technical indicators..." />
                      </SelectTrigger>
                      <SelectContent>
                        {indicatorOptions
                          .filter(indicator => !formData.indicators?.includes(indicator))
                          .map((indicator) => (
                            <SelectItem key={indicator} value={indicator}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{indicator}</span>
                                <Badge variant="outline" className="text-xs">
                                  Technical
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {formData.indicators && formData.indicators.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Selected Indicators ({formData.indicators.length}):</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.indicators.map((indicator) => (
                            <div key={indicator} className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950 rounded-md px-3 py-1.5 border">
                              <span className="text-sm font-medium">{indicator}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"
                                onClick={() => {
                                  const updated = formData.indicators?.filter(i => i !== indicator) || []
                                  handleInputChange('indicators', updated)
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Trading Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Trading Configuration</h3>
                <p className="text-sm text-muted-foreground">Configure trading parameters and risk management</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="font-medium">Enable Live Trading</Label>
                      <p className="text-sm text-muted-foreground">Allow agent to execute real trades</p>
                    </div>
                  </div>
                  <Switch checked={tradingEnabled} onCheckedChange={setTradingEnabled} />
                </div>

                {tradingEnabled && (
                  <>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <div>
                          <Label className="font-medium">Auto-Trading</Label>
                          <p className="text-sm text-muted-foreground">Execute trades automatically without approval</p>
                        </div>
                      </div>
                      <Switch checked={autoTrade} onCheckedChange={setAutoTrade} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Max Position Size</Label>
                        <div className="space-y-2">
                          <Slider 
                            value={maxPositionSize} 
                            onValueChange={setMaxPositionSize} 
                            max={5000} 
                            min={100}
                            step={100} 
                          />
                          <div className="text-center text-sm text-muted-foreground">
                            ${maxPositionSize[0]}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Max Daily Loss</Label>
                        <div className="space-y-2">
                          <Slider 
                            value={maxDailyLoss} 
                            onValueChange={setMaxDailyLoss} 
                            max={2000} 
                            min={50}
                            step={50} 
                          />
                          <div className="text-center text-sm text-muted-foreground">
                            ${maxDailyLoss[0]}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Stop Loss %</Label>
                        <div className="space-y-2">
                          <Slider 
                            value={stopLoss} 
                            onValueChange={setStopLoss} 
                            max={20} 
                            min={1}
                            step={0.5} 
                          />
                          <div className="text-center text-sm text-muted-foreground">
                            {stopLoss[0]}%
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Take Profit %</Label>
                        <div className="space-y-2">
                          <Slider 
                            value={takeProfit} 
                            onValueChange={setTakeProfit} 
                            max={50} 
                            min={5}
                            step={1} 
                          />
                          <div className="text-center text-sm text-muted-foreground">
                            {takeProfit[0]}%
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Leverage</Label>
                        <div className="space-y-2">
                          <Slider 
                            value={leverage} 
                            onValueChange={setLeverage} 
                            max={10} 
                            min={1}
                            step={1} 
                          />
                          <div className="text-center text-sm text-muted-foreground">
                            {leverage[0]}x
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Trading Pairs</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Which markets should your AI trade on?
                      </p>
                      
                      {loadingPairs ? (
                        <div className="flex items-center justify-center p-4 border rounded-lg">
                          <div className="text-sm text-muted-foreground">Loading trading pairs...</div>
                        </div>
                      ) : (
                        <Select 
                          value="" 
                          onValueChange={(value) => {
                            if (value && !formData.tradingPairs?.includes(value)) {
                              const updated = [...(formData.tradingPairs || []), value]
                              handleInputChange('tradingPairs', updated)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select trading pairs to add..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {tradingPairs
                              .filter(pair => !formData.tradingPairs?.includes(pair.symbol))
                              .map((pair) => (
                                <SelectItem 
                                  key={pair.symbol} 
                                  value={pair.symbol}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-medium">{pair.symbol}</span>
                                    <div className="flex items-center gap-2 ml-4">
                                      <Badge variant="outline" className="text-xs">
                                        Max {pair.maxLeverage}x
                                      </Badge>
                                      {pair.isIsolatedOnly && (
                                        <Badge variant="secondary" className="text-xs">
                                          Isolated
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      {formData.tradingPairs && formData.tradingPairs.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <Label className="text-sm font-medium">Selected Pairs ({formData.tradingPairs.length}):</Label>
                          <div className="flex flex-wrap gap-2">
                            {formData.tradingPairs.map((pair) => {
                              const pairData = tradingPairs.find(p => p.symbol === pair)
                              return (
                                <div key={pair} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950 rounded-md px-3 py-1.5 border">
                                  <span className="text-sm font-medium">{pair}</span>
                                  {pairData && (
                                    <Badge variant="outline" className="text-xs ml-1">
                                      {pairData.maxLeverage}x
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 ml-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"
                                    onClick={() => {
                                      const updated = formData.tradingPairs?.filter(p => p !== pair) || []
                                      handleInputChange('tradingPairs', updated)
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Risk Management */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Risk Management</h3>
                <p className="text-sm text-muted-foreground">Final risk settings and deployment confirmation</p>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Risk Tolerance</Label>
                <div className="col-span-3 space-y-2">
                  <Slider 
                    value={[formData.riskTolerance || 50]} 
                    onValueChange={(value) => handleInputChange('riskTolerance', value[0])} 
                    max={100} 
                    step={1} 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Conservative</span>
                    <span>Moderate</span>
                    <span>Aggressive</span>
                  </div>
                  <div className="text-center text-sm font-medium">
                    {formData.riskTolerance || 50}% Risk Level
                  </div>
                </div>
              </div>

              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                    Risk Disclosure
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-amber-800 dark:text-amber-200">
                  <ul className="space-y-1 list-disc list-inside mb-4">
                    <li>AI trading involves significant financial risk</li>
                    <li>Past performance does not guarantee future results</li>
                    <li>You may lose all or part of your investment</li>
                    <li>Leverage amplifies both gains and losses</li>
                    <li>Market volatility can result in rapid losses</li>
                  </ul>
                  <div className="flex items-center space-x-2 pt-2 border-t border-amber-200">
                    <Checkbox 
                      id="risk-acknowledgment"
                      checked={riskAcknowledged}
                      onCheckedChange={(checked) => setRiskAcknowledged(checked === true)}
                    />
                    <Label 
                      htmlFor="risk-acknowledgment" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      I understand and acknowledge these risks
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Agent Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Agent Name:</span>
                    <span className="font-medium">{formData.name || "Unnamed Agent"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Strategy:</span>
                    <span className="font-medium">{getTypeLabel(formData.strategy || 'trend_following')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Position:</span>
                    <span className="font-medium">${formData.maxPositionSize || 100}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Daily Loss:</span>
                    <span className="font-medium">${formData.dailyLossLimit || 50}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trading Pairs:</span>
                    <span className="font-medium">{formData.tradingPairs?.length || 0} pairs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-Trading:</span>
                    <Badge variant={autoTrade ? "default" : "secondary"}>
                      {autoTrade ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting || !riskAcknowledged}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying Agent...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Deploy AI Agent
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
