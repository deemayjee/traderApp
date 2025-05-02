"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Plus, Download, Upload, BarChart3, PieChart as PieChartIcon, Loader2 } from "lucide-react"
import { getTokenMetadata, getTokenPrice, calculateTokenValue, calculatePortfolioAllocation, TokenMetadata, TokenPrice } from "@/lib/api/token-data"
import { PieChart } from "@/components/PieChart"

interface TokenAccount {
  mint: string
  amount: number
  decimals: number
  metadata?: {
    name: string
    symbol: string
    image: string
  }
  price?: {
    price: number
    priceChange24h: number
  }
  value?: number
  formattedAmount?: string
  formattedValue?: string
  change?: string
  changePercent?: number
  positive?: boolean
  allocation?: number
}

interface ProcessedTokenAccount extends TokenAccount {
  metadata: TokenMetadata
  price: TokenPrice
  value: number
  formattedAmount: string
  formattedValue: string
  change: string
  changePercent: number
  positive: boolean
  allocation: number
}

export default function PortfolioPage() {
  const [assets, setAssets] = useState<ProcessedTokenAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  // Fetch token holdings
  useEffect(() => {
    const fetchTokenHoldings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get SOL balance
        const solBalance = 0 // TODO: Implement balance fetching
        const solBalanceInSOL = 0 // Convert lamports to SOL
        console.log('SOL balance:', { lamports: solBalance, sol: solBalanceInSOL })

        // Get SOL price first
        const solPrice = await getTokenPrice('So11111111111111111111111111111111111111112')
        console.log('SOL price data:', solPrice)
        
        const solValue = solBalanceInSOL * solPrice.price
        console.log('Calculated SOL value:', { 
          balance: solBalanceInSOL,
          price: solPrice.price,
          value: solValue
        })

        // Create SOL token account
        const solTokenAccount: ProcessedTokenAccount = {
          mint: 'So11111111111111111111111111111111111111112',
          amount: solBalance,
          decimals: 9,
          metadata: {
            name: 'Solana',
            symbol: 'SOL',
            image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
            decimals: 9
          },
          price: solPrice,
          value: solValue,
          formattedAmount: `${solBalanceInSOL.toFixed(4)} SOL`,
          formattedValue: `$${solValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: `${solPrice.priceChange24h > 0 ? '+' : ''}${solPrice.priceChange24h.toFixed(2)}%`,
          changePercent: solPrice.priceChange24h,
          positive: solPrice.priceChange24h > 0,
          allocation: 0
        }

        // Calculate total value including SOL
        const totalValue = solValue
        console.log('Total portfolio value:', totalValue)

        // Calculate allocations
        const allAssets = [solTokenAccount].map(asset => ({
          ...asset,
          allocation: totalValue > 0 ? (asset.value / totalValue) * 100 : 0
        }))

        console.log('Final portfolio:', {
          totalValue,
          assetCount: allAssets.length,
          assets: allAssets.map(a => ({
            symbol: a.metadata.symbol,
            value: a.value,
            allocation: a.allocation
          }))
        })

        setAssets(allAssets)
        setError(null)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching token holdings:", err)
        setError("Failed to fetch token holdings. Please try again later.")
        setIsLoading(false)
      }
    }

    fetchTokenHoldings()
  }, [])

  // Filter assets based on active tab
  const filteredAssets = assets.filter((asset) => {
    if (activeTab === "all") return true
    if (activeTab === "tokens") return true
    if (activeTab === "nfts") return false
    return true
  })

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

  // Calculate portfolio stats
  const totalValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0)
  const totalChange24h = assets.reduce((sum, asset) => {
    const assetValue = asset.value || 0
    const assetChange = asset.price?.priceChange24h || 0
    return sum + (assetValue * (assetChange / 100))
  }, 0)
  const totalChangePercent24h = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0

  const bestPerformer = assets.length > 0
    ? assets.reduce((best, asset) => 
        ((asset.price?.priceChange24h || 0) > (best.price?.priceChange24h || 0)) ? asset : best
      )
    : null

  const portfolioStats = {
    formattedTotalValue: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    formattedChange24h: `${totalChange24h >= 0 ? '+' : ''}$${Math.abs(totalChange24h).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    formattedChangePercent24h: `${totalChangePercent24h >= 0 ? '+' : ''}${Math.abs(totalChangePercent24h).toFixed(2)}%`,
    positive24h: totalChangePercent24h > 0,
    assetCount: assets.length,
    bestPerformer: {
      symbol: bestPerformer?.metadata?.symbol || "N/A",
      change: bestPerformer ? `${(bestPerformer.price?.priceChange24h || 0) >= 0 ? '+' : ''}${Math.abs(bestPerformer.price?.priceChange24h || 0).toFixed(2)}%` : "0.00%",
    },
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-gray-500">Track your crypto assets and performance</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-gray-200">
            <Download size={16} className="mr-2" /> Export
          </Button>
          <Button className="bg-black text-white hover:bg-gray-800">
            <Plus size={16} className="mr-2" /> Add Asset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Total Value</p>
              <BarChart3 size={16} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mt-2">{portfolioStats.formattedTotalValue}</h2>
            <p className={`text-sm ${portfolioStats.positive24h ? "text-green-600" : "text-red-600"} flex items-center mt-1`}>
              {portfolioStats.positive24h ? (
                <ArrowUp size={12} className="mr-1" />
              ) : (
                <ArrowDown size={12} className="mr-1" />
              )}
              {portfolioStats.formattedChange24h} ({portfolioStats.formattedChangePercent24h})
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">24h Change</p>
              {portfolioStats.positive24h ? (
                <ArrowUp size={16} className="text-green-600" />
              ) : (
                <ArrowDown size={16} className="text-red-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold mt-2">{portfolioStats.formattedChange24h}</h2>
            <p className={`text-sm ${portfolioStats.positive24h ? "text-green-600" : "text-red-600"} flex items-center mt-1`}>
              {portfolioStats.positive24h ? (
                <ArrowUp size={12} className="mr-1" />
              ) : (
                <ArrowDown size={12} className="mr-1" />
              )}
              {portfolioStats.formattedChangePercent24h}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Assets</p>
              <PieChartIcon className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-bold mt-2">{portfolioStats.assetCount}</h2>
            <p className="text-sm text-gray-500 mt-1">Across {portfolioStats.assetCount} chains</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Best Performer</p>
              {bestPerformer?.positive ? (
                <ArrowUp size={16} className="text-green-600" />
              ) : (
                <ArrowDown size={16} className="text-red-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold mt-2">{portfolioStats.bestPerformer.symbol}</h2>
            <p className={`text-sm ${bestPerformer?.positive ? "text-green-600" : "text-red-600"} flex items-center mt-1`}>
              {bestPerformer?.positive ? (
                <ArrowUp size={12} className="mr-1" />
              ) : (
                <ArrowDown size={12} className="mr-1" />
              )}
              {portfolioStats.bestPerformer.change}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Assets</CardTitle>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-100 border border-gray-200">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="tokens" className="data-[state=active]:bg-white">
                    Tokens
                  </TabsTrigger>
                  <TabsTrigger value="nfts" className="data-[state=active]:bg-white">
                    NFTs
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAssets.map((asset) => (
                  <div key={asset.mint} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={asset.metadata?.image || "/placeholder.svg"}
                          alt={asset.metadata?.name || "Unknown Token"}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{asset.metadata?.name}</p>
                          <p className="text-xs text-gray-500">{asset.formattedAmount}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{asset.formattedValue}</p>
                        <p className={`text-xs flex items-center justify-end ${asset.positive ? "text-green-600" : "text-red-600"}`}>
                          {asset.positive ? (
                            <ArrowUp size={12} className="mr-1" />
                          ) : (
                            <ArrowDown size={12} className="mr-1" />
                          )}
                          {asset.change}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={asset.allocation || 0} className="h-1" />
                      <span className="text-xs text-gray-500">{(asset.allocation || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6 space-x-3">
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Upload size={16} className="mr-2" /> Deposit
                </Button>
                <Button variant="outline" className="border-gray-200">
                  <Download size={16} className="mr-2" /> Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1 row-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart assets={assets} />
              <div className="space-y-2 mt-4">
                {assets.map((asset) => (
                  <div key={asset.mint} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.allocation > 0 ? '#3B82F6' : '#E5E7EB' }} />
                      <span className="text-sm text-gray-500">{asset.metadata.symbol}</span>
                    </div>
                    <span className="text-sm">{asset.allocation.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
