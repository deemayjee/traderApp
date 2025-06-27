// Hyperliquid-specific types only

export interface HyperliquidAsset {
  name: string
  szDecimals: number
  maxLeverage: number
  onlyIsolated?: boolean
  isDelisted?: boolean
}

export interface TradingPair {
  symbol: string
  name: string
  maxLeverage: number
  isIsolatedOnly?: boolean
  isDelisted?: boolean
}

export interface HyperliquidMarketData {
  coin: string
  dayNtlVlm: string
  funding: string
  open: string
  openInterest: string
  prevDayPx: string
  px: string
  szDecimals: number
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
  updated?: number
  image?: string
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

 