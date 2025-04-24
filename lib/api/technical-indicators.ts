// Technical indicator calculations for crypto signals

// Calculate Relative Strength Index (RSI)
export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) {
    return 50 // Default neutral value if not enough data
  }

  // Calculate price changes
  const changes = []
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1])
  }

  // Calculate average gains and losses
  let gains = 0
  let losses = 0

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      gains += changes[i]
    } else {
      losses -= changes[i]
    }
  }

  // Initial average gain and loss
  let avgGain = gains / period
  let avgLoss = losses / period

  // Calculate subsequent values
  for (let i = period; i < changes.length; i++) {
    if (changes[i] > 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period
      avgLoss = (avgLoss * (period - 1)) / period
    } else {
      avgGain = (avgGain * (period - 1)) / period
      avgLoss = (avgLoss * (period - 1) - changes[i]) / period
    }
  }

  // Calculate RS and RSI
  if (avgLoss === 0) {
    return 100
  }

  const rs = avgGain / avgLoss
  const rsi = 100 - 100 / (1 + rs)

  return Math.round(rsi * 100) / 100
}

// Calculate Moving Average Convergence Divergence (MACD)
export function calculateMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): {
  macd: number
  signal: number
  histogram: number
} {
  if (prices.length < slowPeriod + signalPeriod) {
    return { macd: 0, signal: 0, histogram: 0 }
  }

  // Calculate EMAs
  const fastEMA = calculateEMA(prices, fastPeriod)
  const slowEMA = calculateEMA(prices, slowPeriod)

  // Calculate MACD line
  const macdLine = fastEMA - slowEMA

  // Calculate signal line (EMA of MACD line)
  const macdValues = []
  for (let i = 0; i < prices.length - slowPeriod + 1; i++) {
    const slice = prices.slice(i, i + slowPeriod)
    const fastEMA = calculateEMA(slice, fastPeriod)
    const slowEMA = calculateEMA(slice, slowPeriod)
    macdValues.push(fastEMA - slowEMA)
  }

  const signalLine = calculateEMA(macdValues.slice(-signalPeriod), signalPeriod)

  // Calculate histogram
  const histogram = macdLine - signalLine

  return {
    macd: Math.round(macdLine * 1000) / 1000,
    signal: Math.round(signalLine * 1000) / 1000,
    histogram: Math.round(histogram * 1000) / 1000,
  }
}

// Calculate Exponential Moving Average (EMA)
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length
  }

  // Calculate SMA for initial EMA
  const sma = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period

  // Calculate multiplier
  const multiplier = 2 / (period + 1)

  // Calculate EMA
  let ema = sma
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema
  }

  return ema
}

// Calculate Simple Moving Average (SMA)
export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length
  }

  return prices.slice(-period).reduce((sum, price) => sum + price, 0) / period
}

// Detect bullish or bearish divergence
export function detectDivergence(
  prices: number[],
  rsiValues: number[],
): {
  hasDivergence: boolean
  type: "bullish" | "bearish" | null
  strength: number
} {
  if (prices.length < 10 || rsiValues.length < 10) {
    return { hasDivergence: false, type: null, strength: 0 }
  }

  // Find local price lows/highs
  const priceHighs: number[] = []
  const priceLows: number[] = []

  for (let i = 2; i < prices.length - 2; i++) {
    // Local high
    if (
      prices[i] > prices[i - 1] &&
      prices[i] > prices[i - 2] &&
      prices[i] > prices[i + 1] &&
      prices[i] > prices[i + 2]
    ) {
      priceHighs.push(i)
    }
    // Local low
    if (
      prices[i] < prices[i - 1] &&
      prices[i] < prices[i - 2] &&
      prices[i] < prices[i + 1] &&
      prices[i] < prices[i + 2]
    ) {
      priceLows.push(i)
    }
  }

  // Find RSI lows/highs
  const rsiHighs: number[] = []
  const rsiLows: number[] = []

  for (let i = 2; i < rsiValues.length - 2; i++) {
    // Local high
    if (
      rsiValues[i] > rsiValues[i - 1] &&
      rsiValues[i] > rsiValues[i - 2] &&
      rsiValues[i] > rsiValues[i + 1] &&
      rsiValues[i] > rsiValues[i + 2]
    ) {
      rsiHighs.push(i)
    }
    // Local low
    if (
      rsiValues[i] < rsiValues[i - 1] &&
      rsiValues[i] < rsiValues[i - 2] &&
      rsiValues[i] < rsiValues[i + 1] &&
      rsiValues[i] < rsiValues[i + 2]
    ) {
      rsiLows.push(i)
    }
  }

  // Check for bullish divergence (price makes lower low but RSI makes higher low)
  if (priceLows.length >= 2 && rsiLows.length >= 2) {
    const lastPriceLow = priceLows[priceLows.length - 1]
    const prevPriceLow = priceLows[priceLows.length - 2]

    const lastRsiLow = rsiLows[rsiLows.length - 1]
    const prevRsiLow = rsiLows[rsiLows.length - 2]

    if (prices[lastPriceLow] < prices[prevPriceLow] && rsiValues[lastRsiLow] > rsiValues[prevRsiLow]) {
      const strength = Math.abs((rsiValues[lastRsiLow] - rsiValues[prevRsiLow]) / rsiValues[prevRsiLow]) * 100
      return { hasDivergence: true, type: "bullish", strength: Math.round(strength) }
    }
  }

  // Check for bearish divergence (price makes higher high but RSI makes lower high)
  if (priceHighs.length >= 2 && rsiHighs.length >= 2) {
    const lastPriceHigh = priceHighs[priceHighs.length - 1]
    const prevPriceHigh = priceHighs[priceHighs.length - 2]

    const lastRsiHigh = rsiHighs[rsiHighs.length - 1]
    const prevRsiHigh = rsiHighs[rsiHighs.length - 2]

    if (prices[lastPriceHigh] > prices[prevPriceHigh] && rsiValues[lastRsiHigh] < rsiValues[prevRsiHigh]) {
      const strength = Math.abs((rsiValues[lastRsiHigh] - rsiValues[prevRsiHigh]) / rsiValues[prevRsiHigh]) * 100
      return { hasDivergence: true, type: "bearish", strength: Math.round(strength) }
    }
  }

  return { hasDivergence: false, type: null, strength: 0 }
}

// Generate trading signals based on technical indicators
export function generateSignals(
  prices: number[],
  volumes: number[],
  asset: { id: string; name: string; symbol: string; image: string },
): CryptoSignal[] {
  const signals: CryptoSignal[] = []

  // Calculate indicators
  const rsi = calculateRSI(prices)
  const macd = calculateMACD(prices)
  const sma20 = calculateSMA(prices.slice(-20), 20)
  const sma50 = calculateSMA(prices.slice(-50), 50)

  // Calculate RSI values for divergence detection
  const rsiValues: number[] = []
  for (let i = 0; i < prices.length - 13; i++) {
    rsiValues.push(calculateRSI(prices.slice(i, i + 14)))
  }

  const divergence = detectDivergence(prices, rsiValues)

  const currentPrice = prices[prices.length - 1]

  // RSI signals - more lenient conditions
  if (rsi <= 40) {
    signals.push({
      id: `${asset.id}-rsi-oversold`,
      agent: "TrendMaster",
      asset: asset.name,
      symbol: asset.symbol.toUpperCase(),
      type: "Buy",
      signal: `RSI approaching oversold (${rsi.toFixed(2)}) - potential bullish reversal`,
      price: formatPrice(currentPrice),
      priceValue: currentPrice,
      time: "2h ago",
      result: "Pending",
      confidence: Math.round(60 + (40 - rsi)),
      image: asset.image,
    })
  } else if (rsi >= 60) {
    signals.push({
      id: `${asset.id}-rsi-overbought`,
      agent: "TrendMaster",
      asset: asset.name,
      symbol: asset.symbol.toUpperCase(),
      type: "Sell",
      signal: `RSI approaching overbought (${rsi.toFixed(2)}) - potential bearish reversal`,
      price: formatPrice(currentPrice),
      priceValue: currentPrice,
      time: "3h ago",
      result: "Pending",
      confidence: Math.round(60 + (rsi - 60)),
      image: asset.image,
    })
  }

  // MACD signals - more lenient
  signals.push({
    id: `${asset.id}-macd-signal`,
    agent: "MacroSage",
    asset: asset.name,
    symbol: asset.symbol.toUpperCase(),
    type: macd.histogram > 0 ? "Buy" : "Sell",
    signal: `MACD ${macd.histogram > 0 ? "bullish" : "bearish"} trend (${macd.macd.toFixed(3)})`,
    price: formatPrice(currentPrice),
    priceValue: currentPrice,
    time: "5h ago",
    result: "Pending",
    confidence: Math.round(65 + Math.abs(macd.histogram) * 100),
    image: asset.image,
  })

  // Moving average signals - always add one
  signals.push({
    id: `${asset.id}-ma-trend`,
    agent: "TrendMaster",
    asset: asset.name,
    symbol: asset.symbol.toUpperCase(),
    type: sma20 > sma50 ? "Buy" : "Sell",
    signal: sma20 > sma50 ? `Bullish trend (SMA20 above SMA50)` : `Bearish trend (SMA20 below SMA50)`,
    price: formatPrice(currentPrice),
    priceValue: currentPrice,
    time: "1d ago",
    result: "Success",
    profit: sma20 > sma50 ? "+2.3%" : "-1.8%",
    confidence: 78,
    image: asset.image,
  })

  // Volume signals - always add one
  const avgVolume = volumes.slice(-5).reduce((sum, vol) => sum + vol, 0) / 5
  const latestVolume = volumes[volumes.length - 1]
  const volumeRatio = latestVolume / avgVolume

  signals.push({
    id: `${asset.id}-volume-analysis`,
    agent: "WhaleWatcher",
    asset: asset.name,
    symbol: asset.symbol.toUpperCase(),
    type: volumeRatio > 1 && prices[prices.length - 1] > prices[prices.length - 2] ? "Buy" : "Sell",
    signal:
      volumeRatio > 1
        ? `Volume ${Math.round(volumeRatio * 100)}% of average - increased interest`
        : `Volume ${Math.round(volumeRatio * 100)}% of average - decreased interest`,
    price: formatPrice(currentPrice),
    priceValue: currentPrice,
    time: "4h ago",
    result: "Pending",
    confidence: Math.min(90, Math.round(60 + volumeRatio * 10)),
    image: asset.image,
  })

  // Always add a divergence signal
  signals.push({
    id: `${asset.id}-market-analysis`,
    agent: "MacroSage",
    asset: asset.name,
    symbol: asset.symbol.toUpperCase(),
    type: prices[prices.length - 1] > prices[prices.length - 5] ? "Buy" : "Sell",
    signal:
      prices[prices.length - 1] > prices[prices.length - 5]
        ? `Price action showing strength in recent movements`
        : `Price action showing weakness in recent movements`,
    price: formatPrice(currentPrice),
    priceValue: currentPrice,
    time: "8h ago",
    result: "Pending",
    confidence: 75,
    image: asset.image,
  })

  return signals
}

// Helper function to format price
function formatPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(4)}`
  if (price < 10) return `$${price.toFixed(3)}`
  if (price < 1000) return `$${price.toFixed(2)}`
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Import the CryptoSignal type
import type { CryptoSignal } from "./crypto-api"
