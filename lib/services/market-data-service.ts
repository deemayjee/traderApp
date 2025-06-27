import { hyperliquidService, type HyperliquidMarketData } from './hyperliquid-service'
import type { FormattedCryptoAsset } from '@/lib/types/hyperliquid-types'

export class MarketDataService {
  private updateInterval: NodeJS.Timeout | null = null
  private subscribers: ((data: FormattedCryptoAsset[]) => void)[] = []

  constructor() {
    // Use the singleton instance
  }

  async getMarketData(): Promise<FormattedCryptoAsset[]> {
    try {
      // Get trading pairs and market data from Hyperliquid
      const tradingPairs = await hyperliquidService.getTradingPairs()
      const symbols = tradingPairs.map(pair => pair.symbol)
      const marketData = await hyperliquidService.getMarketData(symbols)
      return this.formatHyperliquidData(marketData)
    } catch (error) {
      console.error('Failed to fetch market data:', error)
      return []
    }
  }

  private formatHyperliquidData(marketData: HyperliquidMarketData[]): FormattedCryptoAsset[] {
    return marketData.map((data, index) => {
      const currentPrice = data.price
      const changePercent = data.change24h
      const change = (currentPrice * changePercent) / 100

      return {
        id: data.symbol.toLowerCase(),
        name: data.symbol.replace('-USD', ''),
        symbol: data.symbol.replace('-USD', ''),
        price: this.formatPrice(currentPrice),
        priceValue: currentPrice,
        change: this.formatChange(change),
        changePercent,
        marketCap: this.formatLargeNumber(data.openInterest * currentPrice),
        volume: this.formatLargeNumber(data.volume24h),
        positive: changePercent >= 0,
        sentiment: this.getSentiment(changePercent),
        image: `/crypto-icons/${data.symbol.toLowerCase().replace('-usd', '')}.png`,
        priceHistory: this.generateMockPriceHistory(currentPrice, changePercent)
      }
    })
  }

  private formatPrice(price: number): string {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else if (price >= 1) {
      return `$${price.toFixed(4)}`
    } else {
      return `$${price.toFixed(6)}`
    }
  }

  private formatChange(change: number): string {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${this.formatPrice(Math.abs(change))}`
  }

  private formatLargeNumber(num: number): string {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  private getSentiment(changePercent: number): "Bullish" | "Neutral" | "Bearish" {
    if (changePercent > 5) return "Bullish"
    if (changePercent < -5) return "Bearish"
    return "Neutral"
  }

  private generateMockPriceHistory(currentPrice: number, changePercent: number): number[] {
    const points = 24 // 24 hours of data
    const history: number[] = []
    const startPrice = currentPrice / (1 + changePercent / 100)
    
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1)
      const volatility = (Math.random() - 0.5) * 0.02 // 2% random volatility
      const price = startPrice + (currentPrice - startPrice) * progress + currentPrice * volatility
      history.push(Math.max(0, price))
    }
    
    return history
  }

  startRealTimeUpdates(interval: number = 30000) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }

    this.updateInterval = setInterval(async () => {
      try {
        const data = await this.getMarketData()
        this.notifySubscribers(data)
      } catch (error) {
        console.error('Failed to update market data:', error)
      }
    }, interval)
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  subscribe(callback: (data: FormattedCryptoAsset[]) => void) {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback)
    }
  }

  private notifySubscribers(data: FormattedCryptoAsset[]) {
    this.subscribers.forEach(callback => callback(data))
  }

  async getAssetBySymbol(symbol: string): Promise<FormattedCryptoAsset | null> {
    try {
      const marketData = await hyperliquidService.getMarketData([symbol])
      if (!marketData || marketData.length === 0) return null
      
      const formatted = this.formatHyperliquidData(marketData)
      return formatted[0] || null
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error)
      return null
    }
  }

  async getPriceHistory(symbol: string, timeframe: string = '1h'): Promise<number[]> {
    // For now, return mock data since Hyperliquid doesn't provide historical charts
    // In a real implementation, you'd store price data over time
    const current = await this.getAssetBySymbol(symbol)
    if (!current) return []
    
    return current.priceHistory
  }
} 