"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Plus, Download, Upload, BarChart3, PieChart as PieChartIcon, Loader2 } from "lucide-react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
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
  const { user, isAuthenticated } = useWalletAuth()
  // Create a direct Solana connection using Helius RPC if available
  const connection = useMemo(() => new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta"),
    {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      httpHeaders: {
        'Content-Type': 'application/json',
      },
      wsEndpoint: undefined,
      fetchMiddleware: (url, options, fetch) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(fetch(url, options))
          }, 100)
        })
      }
    }
  ), []) // Only create connection once

  const [assets, setAssets] = useState<ProcessedTokenAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  // Memoize filtered assets to prevent unnecessary recalculations
  const filteredAssets = useMemo(() => 
    assets.filter((asset) => {
      if (activeTab === "all") return true
      if (activeTab === "tokens") return true
      if (activeTab === "nfts") return false
      return true
    }),
    [assets, activeTab]
  )

  // Memoize portfolio stats to prevent unnecessary recalculations
  const portfolioStats = useMemo(() => {
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

    return {
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
  }, [assets])

  // Fetch token holdings
  useEffect(() => {
    let mounted = true // Track if component is mounted

    const fetchTokenHoldings = async () => {
      if (!isAuthenticated || !user?.address) {
        console.log("Wallet not connected:", { isAuthenticated, address: user?.address })
        if (mounted) setIsLoading(false)
        return
      }

      try {
        if (mounted) {
          setIsLoading(true)
          setError(null)
        }

        console.log("Fetching token holdings for address:", user.address)
        const walletAddress = new PublicKey(user.address)
        
        // Batch requests for SOL balance and token accounts
        const [solBalance, tokenAccounts] = await Promise.all([
          connection.getBalance(walletAddress),
          connection.getParsedTokenAccountsByOwner(walletAddress, {
            programId: TOKEN_PROGRAM_ID,
          })
        ])

        if (!mounted) return // Don't update state if component unmounted

        const solBalanceInSOL = solBalance / 1e9
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

        console.log("Token accounts fetched:", tokenAccounts.value.length)

        // Filter out accounts with zero balance
        const tokenHoldings = tokenAccounts.value
          .filter(account => {
            const amount = account.account.data.parsed.info.tokenAmount
            const hasBalance = amount.uiAmount > 0
            if (!hasBalance) {
              console.log("Filtered out zero balance account:", account.account.data.parsed.info.mint)
            }
            return hasBalance
          })

        console.log("Token holdings after filtering:", tokenHoldings.length)

        // Process tokens in batches to avoid rate limits
        const batchSize = 5
        const enrichedHoldings: (ProcessedTokenAccount | null)[] = []
        
        for (let i = 0; i < tokenHoldings.length; i += batchSize) {
          if (!mounted) return // Don't continue if component unmounted
          
          const batch = tokenHoldings.slice(i, i + batchSize)
          
          // Get all mint addresses in this batch
          const mintAddresses = batch.map(account => account.account.data.parsed.info.mint)
          
          // Batch fetch metadata and prices for all tokens in this batch
          const [metadataBatch, priceBatch] = await Promise.all([
            Promise.all(mintAddresses.map(mint => getTokenMetadata(mint))),
            Promise.all(mintAddresses.map(mint => getTokenPrice(mint)))
          ])
          
          const batchResults = await Promise.all(
            batch.map((account, index) => {
              try {
                const info = account.account.data.parsed.info
                const mintAddress = info.mint
                console.log("Processing token:", mintAddress)

                const metadata = metadataBatch[index]
                const price = priceBatch[index]

                const tokenAmount = Number(info.tokenAmount.amount)
                const value = calculateTokenValue(tokenAmount, price.price, metadata.decimals)

                console.log("Token processed:", {
                  mint: mintAddress,
                  name: metadata.name,
                  amount: tokenAmount,
                  decimals: metadata.decimals,
                  price: price.price,
                  value: value
                })

                return {
                  mint: mintAddress,
                  amount: tokenAmount,
                  decimals: metadata.decimals,
                  metadata,
                  price,
                  value,
                  formattedAmount: `${info.tokenAmount.uiAmount} ${metadata.symbol}`,
                  formattedValue: `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  change: `${price.priceChange24h > 0 ? '+' : ''}${price.priceChange24h.toFixed(2)}%`,
                  changePercent: price.priceChange24h,
                  positive: price.priceChange24h > 0,
                  allocation: 0
                }
              } catch (error) {
                console.error("Error processing token:", error)
                return null
              }
            })
          )
          enrichedHoldings.push(...batchResults)
          
          // Add delay between batches
          if (i + batchSize < tokenHoldings.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        if (!mounted) return // Don't update state if component unmounted

        // Filter out tokens with zero or negative value
        const validHoldings = enrichedHoldings.filter(
          (holding): holding is ProcessedTokenAccount => holding !== null && holding.value > 0
        )

        // Calculate total value including SOL
        const totalValue = validHoldings.reduce((sum, asset) => sum + asset.value, 0) + solValue
        console.log('Total portfolio value:', totalValue)

        // Calculate allocations
        const allAssets = [solTokenAccount, ...validHoldings].map(asset => ({
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

        if (mounted) {
          setAssets(allAssets)
          setError(null)
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Error fetching token holdings:", err)
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch token holdings")
          setIsLoading(false)
        }
      }
    }

    fetchTokenHoldings()

    // Cleanup function
    return () => {
      mounted = false
    }
  }, [isAuthenticated, user?.address, connection])

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">Please connect your wallet to view your portfolio</p>
        <Button onClick={() => window.location.href = "/dashboard"}>Connect Wallet</Button>
      </div>
    )
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
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-gray-500">Track your crypto assets and performance</p>
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
              {portfolioStats.bestPerformer.change.startsWith('+') ? (
                <ArrowUp size={16} className="text-green-600" />
              ) : (
                <ArrowDown size={16} className="text-red-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold mt-2">{portfolioStats.bestPerformer.symbol}</h2>
            <p className={`text-sm ${portfolioStats.bestPerformer.change.startsWith('+') ? "text-green-600" : "text-red-600"} flex items-center mt-1`}>
              {portfolioStats.bestPerformer.change.startsWith('+') ? (
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
                <TabsList className="bg-gray-100 dark:bg-muted border border-gray-200 dark:border-gray-800">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card dark:data-[state=active]:text-white">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="tokens" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card dark:data-[state=active]:text-white">
                    Tokens
                  </TabsTrigger>
                  <TabsTrigger value="nfts" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card dark:data-[state=active]:text-white">
                    NFTs
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAssets.map((asset) => (
                  <div key={asset.mint} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{asset.metadata.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {asset.formattedAmount} (${asset.formattedValue})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${asset.positive ? 'text-green-500' : 'text-red-500'}`}>{asset.change}</p>
                        <p className="text-sm text-muted-foreground">{asset.allocation.toFixed(2)}% of portfolio</p>
                      </div>
                    </div>
                  </div>
                ))}
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

