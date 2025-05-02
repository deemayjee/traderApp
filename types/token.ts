export interface TokenAccount {
  mint: string
  amount: number
  decimals: number
  metadata?: {
    name: string
    symbol: string
    image?: string
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