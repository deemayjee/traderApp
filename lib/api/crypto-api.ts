// Types for cryptocurrency data
export interface CryptoAsset {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number | null
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number | null
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  last_updated: string
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
  image: string
  positive: boolean
  sentiment: "Bullish" | "Neutral" | "Bearish"
}

export interface CryptoAlert {
  id: string
  type: "price" | "signal" | "whale"
  title: string
  description: string
  active: boolean
  time: string
  asset: string
  symbol: string
  targetPrice?: number
  currentPrice?: number
}

export interface CryptoSignal {
  id: string
  agent: string
  asset: string
  symbol: string
  type: "Buy" | "Sell"
  signal: string
  price: string
  priceValue: number
  time: string
  result: "Pending" | "Success" | "Failure"
  profit?: string
  confidence: number
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

// Function to fetch cryptocurrency market data
export async function fetchCryptoMarkets(
  currency = "usd",
  perPage = 20,
  page = 1,
  sparkline = false,
  order = "market_cap_desc",
): Promise<CryptoAsset[]> {
  const maxRetries = 3
  let retries = 0

  while (retries < maxRetries) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=${order}&per_page=${perPage}&page=${page}&sparkline=${sparkline}`,
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
      retries++
      console.error(`Error fetching crypto markets (attempt ${retries}/${maxRetries}):`, error)

      // Wait before retrying (exponential backoff)
      if (retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
      }
    }
  }

  console.warn("Failed to fetch crypto markets after multiple attempts")
  return []
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

// Add this function to fetch historical price data for a specific cryptocurrency
export async function fetchCryptoHistoricalData(
  id: string,
  days = 14,
  interval = "hourly",
): Promise<{ prices: number[][]; volumes: number[][] }> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`,
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
    return {
      prices: data.prices || [],
      volumes: data.total_volumes || [],
    }
  } catch (error) {
    console.error(`Error fetching historical data for ${id}:`, error)
    // Return empty arrays as fallback
    return { prices: [], volumes: [] }
  }
}

// Add a function to generate real signals based on technical analysis
export async function generateRealSignals(cryptoIds: string[]): Promise<CryptoSignal[]> {
  // Return empty array as we want users to create their own signals
  return []
}

// Function to format cryptocurrency data
export function formatCryptoAsset(asset: CryptoAsset): FormattedCryptoAsset {
  // Add null checks for all properties
  const price = asset.current_price ?? 0
  const priceChangePercentage = asset.price_change_percentage_24h ?? 0
  const marketCap = asset.market_cap ?? 0
  const volume = asset.total_volume ?? 0

  // Determine sentiment based on price change
  let sentiment: "Bullish" | "Neutral" | "Bearish"
  if (priceChangePercentage > 3) {
    sentiment = "Bullish"
  } else if (priceChangePercentage < -3) {
    sentiment = "Bearish"
  } else {
    sentiment = "Neutral"
  }

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
  }
}

// Generate mock alerts based on real crypto data
export function generateAlertsFromCryptoData(cryptoAssets: CryptoAsset[]): CryptoAlert[] {
  const alerts: CryptoAlert[] = []

  // Use only the top 5 assets for alerts
  const topAssets = cryptoAssets.slice(0, 5)

  // Generate price alerts
  topAssets.forEach((asset, index) => {
    // Add null checks
    const currentPrice = asset.current_price ?? 0
    const priceChangePercentage = asset.price_change_percentage_24h ?? 0
    const symbol = asset.symbol?.toUpperCase() ?? "UNKNOWN"

    // Price alert
    const isPriceUp = priceChangePercentage > 0
    const targetPrice = isPriceUp
      ? currentPrice * 1.05 // 5% higher
      : currentPrice * 0.95 // 5% lower

    alerts.push({
      id: `price-${asset.id}`,
      type: "price",
      title: `${symbol} Price Alert`,
      description: `Alert when ${symbol} ${isPriceUp ? "crosses above" : "drops below"} ${targetPrice.toFixed(2)}`,
      active: index % 3 === 0, // Randomly set some as active
      time: `Set ${index + 1} days ago`,
      asset: asset.name,
      symbol: symbol,
      targetPrice,
      currentPrice: currentPrice,
    })

    // Add some other alert types
    if (index === 0) {
      alerts.push({
        id: `signal-${asset.id}`,
        type: "signal",
        title: `${symbol} RSI Alert`,
        description: `Alert when ${symbol} RSI crosses ${isPriceUp ? "above 70" : "below 30"}`,
        active: true,
        time: "Set 1 week ago",
        asset: asset.name,
        symbol: symbol,
      })
    } else if (index === 1) {
      alerts.push({
        id: `whale-${asset.id}`,
        type: "whale",
        title: `${symbol} Whale Alert`,
        description: `Alert on large ${symbol} transactions > $1M`,
        active: false,
        time: "Set 3 days ago",
        asset: asset.name,
        symbol: symbol,
      })
    }
  })

  return alerts
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
    let result: "Pending" | "Success" | "Failure"
    let profit: string | undefined

    if (time === "2h ago") {
      result = "Pending"
    } else {
      const isSuccess = (type === "Buy" && priceChangePercentage > 0) || (type === "Sell" && priceChangePercentage < 0)
      result = isSuccess ? "Success" : "Failure"

      if (result !== "Pending") {
        const profitValue = isSuccess
          ? Math.abs(priceChangePercentage) * (Math.random() * 0.5 + 0.5)
          : -Math.abs(priceChangePercentage) * (Math.random() * 0.5 + 0.5)

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
    })
  })

  return signals
}

// Generate portfolio assets based on real crypto data
export function generatePortfolioFromCryptoData(cryptoAssets: CryptoAsset[]): PortfolioAsset[] {
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
    const currentPrice = asset.current_price ?? 0
    totalValue += currentPrice * amounts[index]
  })

  // Create portfolio assets
  selectedAssets.forEach((asset, index) => {
    // Add null checks
    const currentPrice = asset.current_price ?? 0
    const priceChangePercentage = asset.price_change_percentage_24h ?? 0
    const symbol = asset.symbol?.toUpperCase() ?? "UNKNOWN"

    const amount = amounts[index]
    const value = currentPrice * amount
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
      symbol: symbol,
      amount,
      formattedAmount: `${formatAmount(amount, asset.symbol)} ${symbol}`,
      value,
      formattedValue: formatValue(value),
      change:
        priceChangePercentage > 0 ? `+${priceChangePercentage.toFixed(1)}%` : `${priceChangePercentage.toFixed(1)}%`,
      changePercent: priceChangePercentage,
      positive: priceChangePercentage > 0,
      allocation,
      image: asset.image,
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
    formattedChange24h: `${change24h > 0 ? "+" : ""}${Math.abs(change24h).toLocaleString("en-US", { minimumFractionDigits: 2, minimumFractionDigits: 2 })}`,
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
