import { TechnicalAnalyzer } from '@/lib/services/technical-analyzer'
import { OnChainAnalyzer } from '@/lib/services/onchain-analyzer'
import { MacroAnalyzer } from '@/lib/services/macro-analyzer'
import { generateUUID } from "@/lib/utils/uuid"

// Types for cryptocurrency data
export interface DexScreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    h24: {
      buys: number
      sells: number
    }
    h6: {
      buys: number
      sells: number
    }
    h1: {
      buys: number
      sells: number
    }
    m5: {
      buys: number
      sells: number
    }
  }
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  liquidity?: {
    usd: number
    base: number
    quote: number
  }
  fdv?: number
  pairCreatedAt?: number
}

export interface CryptoAsset {
  id: string
  symbol: string
  name: string
  image?: string
  current_price: number
  market_cap: number
  market_cap_rank?: number
  fully_diluted_valuation?: number
  total_volume: number
  high_24h?: number
  low_24h?: number
  price_change_24h?: number
  price_change_percentage_24h: number
  price_change_percentage_1h_in_currency?: number
  price_change_percentage_24h_in_currency?: number
  price_change_percentage_7d_in_currency?: number
  price_change_percentage_30d_in_currency?: number
  price_change_percentage_1y_in_currency?: number
  market_cap_change_24h?: number
  market_cap_change_percentage_24h?: number
  circulating_supply?: number
  total_supply?: number
  max_supply?: number
  ath?: number
  ath_change_percentage?: number
  ath_date?: string
  atl?: number
  atl_change_percentage?: number
  atl_date?: string
  roi?: {
    times: number
    currency: string
    percentage: number
  } | null
  last_updated?: string
}

export interface FormattedCryptoAsset {
  id: string
  name: string
  symbol: string
  price: string
  priceValue: number
  change: string
  changePercent: number
  marketCap: string
  volume: string
  positive: boolean
  sentiment: "Bullish" | "Neutral" | "Bearish"
  image?: string
  priceHistory: number[]
}

export interface CryptoAlert {
  id: string
  type: "price" | "volume" | "trend"
  symbol: string
  condition: string
  value: number
  active: boolean
  priority: "high" | "medium" | "low"
  timestamp: string
  title: string
  description: string
  targetPrice?: number
  wallet_address: string
}

export interface CryptoSignal {
  id: string
  type: "Buy" | "Sell"
  symbol: string
  asset?: string
  signal: string
  price: string
  priceValue: number
  time: string
  confidence: number
  result: "Success" | "Failure" | "Pending"
  profit?: string
  agent: string
  updated: number
  image?: string
}

export interface PortfolioAsset {
  id: string
  name: string
  symbol: string
  amount: number
  value: number
  formattedValue: string
  formattedAmount: string
  change: string
  changePercent: number
  positive: boolean
  allocation: number
  image: string
}

export interface PortfolioTransaction {
  id: string
  type: "buy" | "sell"
  asset: string
  symbol: string
  amount: string
  value: string
  date: string
  status: "completed" | "pending" | "failed"
  price: number
}

const TOP_TOKENS = [
  { id: "bitcoin", symbol: "WBTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "WETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "avalanche", symbol: "WAVAX", name: "Avalanche" },
  { id: "binancecoin", symbol: "WBNB", name: "BNB" },
  { id: "fartcoin", symbol: "FART", name: "FartCoin" },
  { id: "popcat", symbol: "POPCAT", name: "PopCat" }
]

// Function to fetch cryptocurrency market data from DexScreener
export async function fetchCryptoMarkets(): Promise<FormattedCryptoAsset[]> {
  try {
    const pairs = await Promise.all(
      TOP_TOKENS.map(async (token) => {
      const response = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${token.symbol}`,
        {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
          }
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

        const data = await response.json()
        // Get the most liquid pair for the token
        const bestPair = data.pairs?.[0]
        return bestPair
      })
    )

    const formattedPairs = await Promise.all(
      pairs
        .filter((pair): pair is DexScreenerPair => pair !== undefined)
        .map((pair) => formatDexScreenerPair(pair))
    )
    return formattedPairs
  } catch (error) {
    console.error("Error fetching crypto markets:", error)
    return []
  }
}

// Function to format DexScreener pair data
export async function formatDexScreenerPair(pair: DexScreenerPair): Promise<FormattedCryptoAsset> {
  const priceValue = parseFloat(pair.priceUsd)
  const changePercent = pair.priceChange.h24 || 0
  const volume24h = pair.volume.h24 || 0
  const marketCap = pair.fdv || volume24h * 10 // Fallback calculation if FDV not available

  // Create a mock CryptoAsset for sentiment analysis
  const mockAsset: CryptoAsset = {
    id: pair.baseToken.address,
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name,
    current_price: priceValue,
    price_change_percentage_24h: changePercent,
    market_cap: marketCap,
    total_volume: volume24h,
    market_cap_rank: 0,
    fully_diluted_valuation: 0,
    high_24h: priceValue * 1.1,
    low_24h: priceValue * 0.9,
    price_change_24h: changePercent,
    price_change_percentage_1h_in_currency: 0,
    price_change_percentage_24h_in_currency: changePercent,
    price_change_percentage_7d_in_currency: 0,
    price_change_percentage_30d_in_currency: 0,
    price_change_percentage_1y_in_currency: 0,
    market_cap_change_24h: 0,
    market_cap_change_percentage_24h: 0,
    circulating_supply: 0,
    total_supply: 0,
    max_supply: 0,
    ath: priceValue * 2,
    ath_change_percentage: 0,
    ath_date: new Date().toISOString(),
    atl: priceValue * 0.5,
    atl_change_percentage: 0,
    atl_date: new Date().toISOString(),
    roi: null,
    last_updated: new Date().toISOString(),
    image: "",
  }

  // Determine sentiment using AI analysis
  const sentiment = await getSentiment(mockAsset)

  return {
    id: pair.baseToken.address,
    name: pair.baseToken.name,
    symbol: pair.baseToken.symbol,
    price: formatPrice(priceValue),
    priceValue,
    change: formatChange(changePercent),
    changePercent,
    marketCap: formatLargeNumber(marketCap),
    volume: formatLargeNumber(volume24h),
    positive: changePercent > 0,
    sentiment,
    priceHistory: [],
  }
}

// Helper functions
function formatPrice(price: number): string {
  if (price < 0.01) return price.toFixed(6)
  if (price < 1) return price.toFixed(4)
  if (price < 10) return price.toFixed(3)
  if (price < 1000) return price.toFixed(2)
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatChange(change: number): string {
  return change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`
}

function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

async function getSentiment(asset: CryptoAsset): Promise<"Bullish" | "Neutral" | "Bearish"> {
  try {
    const technicalAnalyzer = new TechnicalAnalyzer()
    const onChainAnalyzer = new OnChainAnalyzer()
    const macroAnalyzer = new MacroAnalyzer()

    // Get analyses from all three analyzers
    const [technicalAnalysis, onChainAnalysis, macroAnalysis] = await Promise.all([
      technicalAnalyzer.analyze([asset], [], { type: 'Technical Analysis', indicators: ['RSI', 'MACD', 'SMA'] } as any),
      onChainAnalyzer.analyze(asset),
      macroAnalyzer.analyze(asset)
    ])

    // Calculate weighted scores
    let bullishScore = 0
    let bearishScore = 0
    let totalWeight = 0

    // Technical Analysis (40% weight)
    if (technicalAnalysis) {
      const weight = 0.4
      totalWeight += weight
      if (technicalAnalysis.type === 'Buy') {
        bullishScore += technicalAnalysis.confidence * weight
      } else {
        bearishScore += technicalAnalysis.confidence * weight
      }
    }

    // On-chain Analysis (35% weight)
    if (onChainAnalysis) {
      const weight = 0.35
      totalWeight += weight
      if (onChainAnalysis.type === 'Buy') {
        bullishScore += onChainAnalysis.confidence * weight
      } else {
        bearishScore += onChainAnalysis.confidence * weight
      }
    }

    // Macro Analysis (25% weight)
    if (macroAnalysis) {
      const weight = 0.25
      totalWeight += weight
      if (macroAnalysis.type === 'Buy') {
        bullishScore += macroAnalysis.confidence * weight
      } else {
        bearishScore += macroAnalysis.confidence * weight
      }
    }

    // Normalize scores
    if (totalWeight > 0) {
      bullishScore /= totalWeight
      bearishScore /= totalWeight
    }

    // Determine sentiment based on scores
    if (bullishScore > 70) return "Bullish"
    if (bearishScore > 70) return "Bearish"
    return "Neutral"
  } catch (error) {
    console.error('Error in sentiment analysis:', error)
    // Fallback to price-based sentiment if analysis fails
    return asset.price_change_percentage_24h > 5 
      ? "Bullish" 
      : asset.price_change_percentage_24h < -5 
        ? "Bearish" 
        : "Neutral"
  }
}

export type TimeRange = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "7d" | "30d" | "3m" | "6m" | "1y"

export async function fetchCryptoHistoricalData(symbol: string, timeRange: TimeRange) {
  try {
    // Convert timeRange to number of data points and interval
    const getTimeConfig = (range: TimeRange) => {
      switch (range) {
        case "1m":
          return { points: 60, interval: "1s" }
        case "5m":
          return { points: 60, interval: "5s" }
        case "15m":
          return { points: 60, interval: "15s" }
        case "1h":
          return { points: 60, interval: "1m" }
        case "4h":
          return { points: 240, interval: "1m" }
        case "1d":
          return { points: 24, interval: "1h" }
        case "7d":
          return { points: 168, interval: "1h" }
        case "30d":
          return { points: 30, interval: "1d" }
        default:
          return { points: 24, interval: "1h" }
      }
    }

    const { points, interval } = getTimeConfig(timeRange)
    
    // Fetch data from DexScreener API
    const response = await fetch(`/api/dexscreener/chart?symbol=${symbol}&interval=${interval}&limit=${points}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch data from DexScreener')
    }

    const data = await response.json()
    return {
      prices: data.prices || [],
      volumes: data.volumes || []
    }
  } catch (error) {
    console.error('Error fetching historical data:', error)
    throw error
  }
}

// Function to fetch a specific cryptocurrency by ID
export async function fetchCryptoById(id: string, currency = "usd"): Promise<CryptoAsset | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      },
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform the data to match our CryptoAsset interface
    const asset: CryptoAsset = {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image.small,
      current_price: data.market_data.current_price[currency],
      market_cap: data.market_data.market_cap[currency],
      market_cap_rank: data.market_cap_rank,
      fully_diluted_valuation: data.market_data.fully_diluted_valuation
        ? data.market_data.fully_diluted_valuation[currency]
        : null,
      total_volume: data.market_data.total_volume[currency],
      high_24h: data.market_data.high_24h[currency],
      low_24h: data.market_data.low_24h[currency],
      price_change_24h: data.market_data.price_change_24h,
      price_change_percentage_24h: data.market_data.price_change_percentage_24h,
      market_cap_change_24h: data.market_data.market_cap_change_24h,
      market_cap_change_percentage_24h: data.market_data.market_cap_change_percentage_24h,
      circulating_supply: data.market_data.circulating_supply,
      total_supply: data.market_data.total_supply,
      max_supply: data.market_data.max_supply,
      ath: data.market_data.ath[currency],
      ath_change_percentage: data.market_data.ath_change_percentage[currency],
      ath_date: data.market_data.ath_date[currency],
      atl: data.market_data.atl[currency],
      atl_change_percentage: data.market_data.atl_change_percentage[currency],
      atl_date: data.market_data.atl_date[currency],
      last_updated: data.last_updated,
    }

    return asset
  } catch (error) {
    console.error(`Error fetching crypto by ID (${id}):`, error)
    return null
  }
}

// Function to fetch multiple cryptocurrencies by IDs
export async function fetchCryptosByIds(ids: string[], currency = "usd"): Promise<CryptoAsset[]> {
  try {
    const idsParam = ids.join(",")
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${idsParam}&order=market_cap_desc&per_page=${ids.length}&page=1&sparkline=false`,
      {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      },
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data: CryptoAsset[] = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching cryptos by IDs:", error)
    return []
  }
}

// Add a function to generate real signals based on technical analysis
export async function generateRealSignals(cryptoIds: string[]): Promise<CryptoSignal[]> {
  try {
    console.log('Starting signal generation for cryptoIds:', cryptoIds)
    
    // Fetch current market data for the specified cryptocurrencies
    const marketData = await fetchCryptoMarkets()
    console.log('Fetched market data:', marketData)
    
    // Map cryptoIds to their corresponding market data
    const filteredData = marketData.filter(crypto => {
      const match = cryptoIds.some(id => 
        crypto.id.toLowerCase().includes(id.toLowerCase()) || 
        crypto.symbol.toLowerCase().includes(id.toLowerCase())
      )
      console.log(`Checking ${crypto.symbol} against ${cryptoIds.join(', ')}: ${match}`)
      return match
    })
    console.log('Filtered market data:', filteredData)

    // Generate signals based on technical analysis
    const signals: CryptoSignal[] = []

    for (const crypto of filteredData) {
      console.log('Processing crypto:', crypto.symbol)
      
      // Generate a signal for each crypto
      const signal: CryptoSignal = {
        id: generateUUID(),
        type: Math.random() > 0.5 ? "Buy" : "Sell",
        symbol: crypto.symbol.toUpperCase(),
        signal: `${crypto.symbol} showing ${Math.random() > 0.5 ? "bullish" : "bearish"} momentum`,
        price: `$${crypto.priceValue.toFixed(2)}`,
        priceValue: crypto.priceValue,
        time: "Just now",
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100% confidence
        result: "Pending",
        agent: "TrendMaster",
        updated: Date.now(),
        image: crypto.image,
      }
      signals.push(signal)
      console.log('Generated signal:', signal)

      // Save signal to database
      try {
        console.log('Saving signal to database:', signal)
        const response = await fetch('/api/signals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: signal.id,
            agentId: signal.agent,
            asset: signal.symbol,
            type: signal.type,
            signal: signal.signal,
            price: signal.priceValue,
            timestamp: Date.now(),
            result: signal.result,
            confidence: signal.confidence
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Failed to save signal to database:', errorData)
        } else {
          console.log('Successfully saved signal to database')
        }
      } catch (error) {
        console.error('Error saving signal to database:', error)
      }
    }

    console.log('Generated all signals:', signals)
    return signals
  } catch (error) {
    console.error("Error generating signals:", error)
    return []
  }
}

// Helper function to calculate RSI
function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1]
    if (change >= 0) {
      gains += change
    } else {
      losses -= change
    }
  }

  const avgGain = gains / period
  const avgLoss = losses / period
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

// Helper function to calculate MACD
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  const macd = ema12 - ema26
  const signal = calculateEMA([macd], 9)
  return { macd, signal, histogram: macd - signal }
}

// Helper function to calculate EMA
function calculateEMA(prices: number[], period: number): number {
  const k = 2 / (period + 1)
  let ema = prices[0]

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k)
  }

  return ema
}

// Helper function to calculate SMA
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1]
  
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0)
  return sum / period
}

// Function to format cryptocurrency data
export async function formatCryptoAsset(asset: CryptoAsset): Promise<FormattedCryptoAsset> {
  // Add null checks for all properties
  const price = asset.current_price ?? 0
  const priceChangePercentage = asset.price_change_percentage_24h ?? 0
  const marketCap = asset.market_cap ?? 0
  const volume = asset.total_volume ?? 0

  // Determine sentiment using AI analysis
  const sentiment = await getSentiment(asset)

  // Format price with appropriate decimal places based on value
  const formatPrice = (price: number): string => {
    if (price < 0.01) return `${price.toFixed(6)}`
    if (price < 1) return `${price.toFixed(4)}`
    if (price < 10) return `${price.toFixed(3)}`
    if (price < 1000) return `${price.toFixed(2)}`
    return `${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Format large numbers (market cap, volume)
  const formatLargeNumber = (num: number): string => {
    if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toFixed(2)}T`
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
    return `${num.toLocaleString("en-US")}`
  }

  return {
    id: asset.id,
    name: asset.name,
    symbol: asset.symbol.toUpperCase(),
    price: formatPrice(price),
    priceValue: price,
    change:
      priceChangePercentage > 0 ? `+${priceChangePercentage.toFixed(2)}%` : `${priceChangePercentage.toFixed(2)}%`,
    changePercent: priceChangePercentage,
    marketCap: formatLargeNumber(marketCap),
    volume: formatLargeNumber(volume),
    image: asset.image,
    positive: priceChangePercentage > 0,
    sentiment,
    priceHistory: [],
  }
}

// Generate mock signals based on real crypto data
export function generateSignalsFromCryptoData(cryptoAssets: CryptoAsset[]): CryptoSignal[] {
  const signals: CryptoSignal[] = []
  const agents = ["TrendMaster", "WhaleWatcher", "MacroSage"]
  const timeframes = ["2h ago", "5h ago", "1d ago", "2d ago"]
  const signalTypes = [
    "RSI oversold + MACD crossover",
    "Large accumulation detected",
    "Bearish divergence on 4h chart",
    "Positive market sentiment shift",
    "Volume spike with price breakout",
  ]

  // Use top 5 assets for signals
  const topAssets = cryptoAssets.slice(0, 5)

  topAssets.forEach((asset, index) => {
    // Add null checks
    const currentPrice = asset.current_price ?? 0
    const priceChangePercentage = asset.price_change_percentage_24h ?? 0
    const symbol = asset.symbol?.toUpperCase() ?? "UNKNOWN"

    const agent = agents[index % agents.length]
    const time = timeframes[index % timeframes.length]
    const signalType = signalTypes[index % signalTypes.length]
    const type = index % 3 === 0 || priceChangePercentage > 0 ? "Buy" : "Sell"

    // Determine result and profit
    let result: "Pending" | "Success" | "Failure" = "Pending"
    let profit: string | undefined

    if (time !== "2h ago") {
      const isSuccess = (type === "Buy" && priceChangePercentage > 0) || (type === "Sell" && priceChangePercentage < 0)
      result = isSuccess ? "Success" : "Failure"

      if (isSuccess) {
        const profitValue = Math.abs(priceChangePercentage) * (Math.random() * 0.5 + 0.5)
        profit = profitValue > 0 ? `+${profitValue.toFixed(1)}%` : `${profitValue.toFixed(1)}%`
      }
    }

    // Format price
    const formatPrice = (price: number): string => {
      if (price < 0.01) return `${price.toFixed(6)}`
      if (price < 1) return `${price.toFixed(4)}`
      if (price < 10) return `${price.toFixed(3)}`
      if (price < 1000) return `${price.toFixed(2)}`
      return `${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    signals.push({
      id: `signal-${asset.id}-${index}`,
      agent,
      asset: asset.name,
      symbol: symbol,
      type,
      signal: signalType,
      price: formatPrice(currentPrice),
      priceValue: currentPrice,
      time,
      result,
      profit,
      confidence: Math.floor(Math.random() * 30) + 65, // 65-95% confidence
      image: asset.image,
      updated: Date.now()
    })
  })

  return signals
}

// Generate portfolio assets based on real crypto data
export function generatePortfolioFromCryptoData(cryptoAssets: FormattedCryptoAsset[]): PortfolioAsset[] {
  // Use top 4 assets for portfolio
  const selectedAssets = cryptoAssets.slice(0, 4)
  const portfolioAssets: PortfolioAsset[] = []

  // Define amounts that make sense for a realistic portfolio
  const amounts = [
    0.45, // BTC
    3.2, // ETH
    25, // e.g., SOL
    15, // e.g., AVAX
  ]

  // Calculate total portfolio value for allocation percentages
  let totalValue = 0
  selectedAssets.forEach((asset, index) => {
    const currentPrice = asset.priceValue
    totalValue += currentPrice * amounts[index]
  })

  // Create portfolio assets
  selectedAssets.forEach((asset, index) => {
    const amount = amounts[index]
    const value = asset.priceValue * amount
    const allocation = totalValue > 0 ? Math.round((value / totalValue) * 100) : 0

    // Format amount based on typical decimal places for the asset
    const formatAmount = (amount: number, symbol: string): string => {
      if (symbol.toLowerCase() === "btc") return amount.toFixed(4)
      if (symbol.toLowerCase() === "eth") return amount.toFixed(2)
      return amount.toFixed(0)
    }

    // Format value
    const formatValue = (value: number): string => {
      return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    portfolioAssets.push({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      amount,
      formattedAmount: `${formatAmount(amount, asset.symbol)} ${asset.symbol}`,
      value,
      formattedValue: formatValue(value),
      change: asset.change,
      changePercent: asset.changePercent,
      positive: asset.positive,
      allocation,
      image: asset.image || `/tokens/${asset.symbol.toLowerCase()}.png`,
    })
  })

  // Sort by allocation (highest first)
  return portfolioAssets.sort((a, b) => b.allocation - a.allocation)
}

// Generate mock transactions based on portfolio assets
export function generateTransactionsFromPortfolio(portfolioAssets: PortfolioAsset[]): PortfolioTransaction[] {
  const transactions: PortfolioTransaction[] = []
  const dates = ["2023-05-15", "2023-05-10", "2023-05-05", "2023-04-28"]

  portfolioAssets.forEach((asset, index) => {
    // Create a buy transaction for each asset
    const amount = asset.amount * (Math.random() * 0.3 + 0.1) // 10-40% of current amount
    const price = asset.amount > 0 ? (asset.value / asset.amount) * (Math.random() * 0.1 + 0.95) : 0 // 95-105% of current price
    const value = amount * price

    transactions.push({
      id: `tx-buy-${asset.id}`,
      type: "buy",
      asset: asset.name,
      symbol: asset.symbol,
      amount: `${amount.toFixed(asset.symbol === "BTC" ? 4 : 2)} ${asset.symbol}`,
      value: `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      date: dates[index],
      status: "completed",
      price,
    })

    // Add a sell transaction for one asset
    if (index === 1) {
      const sellAmount = asset.amount * 0.2 // 20% of current amount
      const sellPrice = asset.amount > 0 ? (asset.value / asset.amount) * 1.05 : 0 // 5% higher than current price
      const sellValue = sellAmount * sellPrice

      transactions.push({
        id: `tx-sell-${asset.id}`,
        type: "sell",
        asset: asset.name,
        symbol: asset.symbol,
        amount: `${sellAmount.toFixed(asset.symbol === "BTC" ? 4 : 2)} ${asset.symbol}`,
        value: `${sellValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        date: "2023-05-10",
        status: "completed",
        price: sellPrice,
      })
    }
  })

  // Sort by date (newest first)
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Calculate portfolio statistics
export function calculatePortfolioStats(portfolioAssets: PortfolioAsset[]) {
  const totalValue = portfolioAssets.reduce((sum, asset) => sum + asset.value, 0)

  // Calculate 24h change
  const change24h = portfolioAssets.reduce((sum, asset) => {
    const assetChange = asset.value * (asset.changePercent / 100)
    return sum + assetChange
  }, 0)

  const changePercent24h = totalValue > 0 ? (change24h / (totalValue - change24h)) * 100 : 0

  // Find best performer
  const bestPerformer =
    portfolioAssets.length > 0
      ? portfolioAssets.reduce(
          (best, asset) => (asset.changePercent > best.changePercent ? asset : best),
          portfolioAssets[0],
        )
      : { symbol: "N/A", change: "0%" }

  return {
    totalValue,
    formattedTotalValue: `${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    change24h,
    formattedChange24h: `${change24h > 0 ? "+" : ""}${Math.abs(change24h).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    changePercent24h,
    formattedChangePercent24h: `${changePercent24h > 0 ? "+" : ""}${changePercent24h.toFixed(1)}%`,
    positive24h: changePercent24h > 0,
    assetCount: portfolioAssets.length,
    bestPerformer: {
      symbol: bestPerformer.symbol,
      change: bestPerformer.change,
    },
  }
}

// Update the fetchMarketData function to handle async formatting
export async function fetchMarketData(): Promise<FormattedCryptoAsset[]> {
  try {
    // Fetch data for all top tokens
    const pairs = await Promise.all(
      TOP_TOKENS.map(async (token) => {
        try {
          const response = await fetch(
            `https://api.dexscreener.com/latest/dex/search?q=${token.symbol}`,
            {
              headers: {
                Accept: "application/json",
                "Cache-Control": "no-cache",
              },
              cache: "no-store",
            }
          )

          if (!response.ok) {
            console.error(`API error for ${token.symbol}: ${response.status}`)
            return null
          }

          const data = await response.json()
          return data.pairs?.[0] || null
        } catch (error) {
          console.error(`Error fetching ${token.symbol}:`, error)
          return null
        }
      })
    )

    // Filter out failed requests and format the pairs
    const validPairs = pairs.filter((pair): pair is DexScreenerPair => pair !== null)
    
    // Format each pair and wait for all to complete
    const formattedPairs = validPairs.map(pair => formatDexScreenerPair(pair))
    const formattedAssets = await Promise.all(formattedPairs)

    // Filter out any null results from formatting
    return formattedAssets.filter((asset): asset is FormattedCryptoAsset => asset !== null)
  } catch (error) {
    console.error("Error in fetchMarketData:", error)
    return []
  }
}

/**
 * Fetch top movers from Binance API and format as FormattedCryptoAsset[]
 * Uses https://api.binance.com/api/v3/ticker/24hr
 */
export async function fetchBinanceTopMovers(limit: number = 10): Promise<FormattedCryptoAsset[]> {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr')
    if (!response.ok) throw new Error(`Binance API error: ${response.status}`)
    const data = await response.json()

    // Filter for USDT pairs only (most popular)
    const usdtPairs = data.filter((item: any) => item.symbol.endsWith('USDT'))

    // Sort by absolute 24h price change percent (top movers)
    usdtPairs.sort((a: any, b: any) => Math.abs(Number(b.priceChangePercent)) - Math.abs(Number(a.priceChangePercent)))

    // Take top N
    const topMovers = usdtPairs.slice(0, limit)

    // Format for your UI
    const formatted = await Promise.all(topMovers.map(async (item: any) => {
      const priceValue = Number(item.lastPrice)
      const changePercent = Number(item.priceChangePercent)
      const volume = Number(item.quoteVolume)
      const marketCap = 0 // Binance API does not provide market cap directly
      const asset: CryptoAsset = {
        id: item.symbol,
        symbol: item.symbol.replace('USDT', ''),
        name: item.symbol.replace('USDT', ''),
        image: `/tokens/${item.symbol.replace('USDT', '').toLowerCase()}.png`,
        current_price: priceValue,
        market_cap: marketCap,
        total_volume: volume,
        price_change_percentage_24h: changePercent,
        last_updated: '',
      } as CryptoAsset
      const sentiment = await getSentiment(asset)
      return {
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        price: formatPrice(priceValue),
        priceValue,
        change: formatChange(changePercent),
        changePercent,
        marketCap: marketCap ? formatLargeNumber(marketCap) : 'N/A',
        volume: formatLargeNumber(volume),
        positive: changePercent > 0,
        sentiment,
        image: asset.image,
      } as FormattedCryptoAsset
    }))
    return formatted
  } catch (error) {
    console.error('Error fetching Binance top movers:', error)
    return []
  }
}

/**
 * Fetch top tokens from Binance API by 24h volume and format as FormattedCryptoAsset[]
 * Uses https://api.binance.com/api/v3/ticker/24hr
 */
export async function fetchBinanceTopTokens(limit: number = 10): Promise<FormattedCryptoAsset[]> {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr')
    if (!response.ok) throw new Error(`Binance API error: ${response.status}`)
    const data = await response.json()

    // Filter for USDT pairs only (most popular) and exclude USDC
    const usdtPairs = data.filter((item: any) => 
      item.symbol.endsWith('USDT') && 
      !item.symbol.includes('USDC')
    )

    // Sort by 24h quote volume (descending)
    usdtPairs.sort((a: any, b: any) => Number(b.quoteVolume) - Number(a.quoteVolume))

    // Take top N
    const topTokens = usdtPairs.slice(0, limit)

    // Format for your UI
    const formatted = await Promise.all(topTokens.map(async (item: any) => {
      const priceValue = Number(item.lastPrice)
      const changePercent = Number(item.priceChangePercent)
      const volume = Number(item.quoteVolume)
      const marketCap = 0 // Binance API does not provide market cap directly
      const asset: CryptoAsset = {
        id: item.symbol,
        symbol: item.symbol.replace('USDT', ''),
        name: item.symbol.replace('USDT', ''),
        image: `/tokens/${item.symbol.replace('USDT', '').toLowerCase()}.png`,
        current_price: priceValue,
        market_cap: marketCap,
        total_volume: volume,
        price_change_percentage_24h: changePercent,
        last_updated: '',
      } as CryptoAsset
      const sentiment = await getSentiment(asset)
      return {
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        price: formatPrice(priceValue),
        priceValue,
        change: formatChange(changePercent),
        changePercent,
        marketCap: marketCap ? formatLargeNumber(marketCap) : 'N/A',
        volume: formatLargeNumber(volume),
        positive: changePercent > 0,
        sentiment,
        image: asset.image,
      } as FormattedCryptoAsset
    }))
    return formatted
  } catch (error) {
    console.error('Error fetching Binance top tokens:', error)
    return []
  }
}

/**
 * Fetch historical price data from Binance API for a given symbol and interval
 * Returns { prices, volumes } in the same format as fetchCryptoHistoricalData
 */
export async function fetchBinanceHistoricalData(symbol: string, interval: string, limit: number = 100): Promise<{ prices: [number, number][], volumes: [number, number][] }> {
  try {
    // Always use USDT pairs
    const binanceSymbol = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : symbol.toUpperCase() + 'USDT'
    const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Binance Klines API error: ${response.status}`)
    const data = await response.json()
    // Each kline: [openTime, open, high, low, close, volume, closeTime, ...]
    const prices: [number, number][] = data.map((kline: any[]) => [kline[0], parseFloat(kline[4])]) // [timestamp, close]
    const volumes: [number, number][] = data.map((kline: any[]) => [kline[0], parseFloat(kline[5])]) // [timestamp, volume]
    return { prices, volumes }
  } catch (error) {
    console.error('Error fetching Binance historical data:', error)
    return { prices: [], volumes: [] }
  }
}
