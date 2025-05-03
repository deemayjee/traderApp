import { FormattedCryptoAsset } from "@/lib/api/crypto-api"
import { toast } from "@/components/ui/use-toast"

interface PriceMonitorOptions {
  onPriceUpdate: (updatedAssets: FormattedCryptoAsset[]) => void
}

export class PriceMonitor {
  private ws: WebSocket | null = null
  private assets: FormattedCryptoAsset[] = []
  private onPriceUpdate: (updatedAssets: FormattedCryptoAsset[]) => void
  private symbols: Set<string> = new Set()
  private updateTimeout: NodeJS.Timeout | null = null
  private pendingUpdates: Map<string, any> = new Map()
  private lastUpdateTime: number = 0
  private readonly UPDATE_INTERVAL = 10000 // Update every 10 seconds
  private readonly MIN_PRICE_CHANGE = 0.01 // Only update if price changes by at least 1%

  constructor({ onPriceUpdate }: PriceMonitorOptions) {
    this.onPriceUpdate = onPriceUpdate
  }

  public start(assets: FormattedCryptoAsset[]) {
    this.assets = assets
    this.symbols = new Set(assets.map(asset => `${asset.symbol.toLowerCase()}usdt`))
    
    if (this.ws) {
      this.ws.close()
    }

    // Connect to Binance WebSocket
    this.ws = new WebSocket('wss://stream.binance.com:9443/ws')
    
    this.ws.onopen = () => {
      // Subscribe to ticker streams for all symbols
      const subscribeMessage = {
        method: "SUBSCRIBE",
        params: Array.from(this.symbols).map(symbol => `${symbol}@ticker`),
        id: 1
      }
      this.ws?.send(JSON.stringify(subscribeMessage))
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.e === '24hrTicker') {
        this.queueUpdate(data)
      }
    }

    this.ws.onerror = (error) => {
      toast({
        title: "Price Feed Error",
        description: "Failed to connect to price feed. Prices may not update in real-time.",
        variant: "destructive",
      })
    }

    this.ws.onclose = () => {
      setTimeout(() => this.start(this.assets), 5000)
    }
  }

  private queueUpdate(tickerData: any) {
    const symbol = tickerData.s.toLowerCase().replace('usdt', '')
    this.pendingUpdates.set(symbol, tickerData)

    const now = Date.now()
    if (now - this.lastUpdateTime >= this.UPDATE_INTERVAL) {
      this.processUpdates()
    } else if (!this.updateTimeout) {
      this.updateTimeout = setTimeout(() => this.processUpdates(), this.UPDATE_INTERVAL)
    }
  }

  private processUpdates() {
    if (this.pendingUpdates.size === 0) return

    const updatedAssets = [...this.assets]
    let hasChanges = false

    this.pendingUpdates.forEach((tickerData, symbol) => {
      const currentPrice = parseFloat(tickerData.c)
      const priceChange = parseFloat(tickerData.p)
      const priceChangePercent = parseFloat(tickerData.P)
      const volume = parseFloat(tickerData.v)
      const high24h = parseFloat(tickerData.h)
      const low24h = parseFloat(tickerData.l)

      const assetIndex = updatedAssets.findIndex(asset => 
        asset.symbol.toLowerCase() === symbol
      )

      if (assetIndex !== -1) {
        const asset = updatedAssets[assetIndex]
        const newPrice = currentPrice.toFixed(2)

        // Only update if there's a meaningful change (1% or more)
        const priceDiff = Math.abs((currentPrice - parseFloat(asset.price)) / parseFloat(asset.price) * 100)
        if (priceDiff >= this.MIN_PRICE_CHANGE) {
          updatedAssets[assetIndex] = {
            ...asset,
            price: newPrice,
            priceValue: currentPrice,
            change: `${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`,
            changePercent: priceChangePercent,
            volume: volume.toFixed(2),
            positive: priceChangePercent >= 0,
            sentiment: this.getSentiment(priceChangePercent)
          }
          hasChanges = true
        }
      }
    })

    if (hasChanges) {
      this.onPriceUpdate(updatedAssets)
      this.assets = updatedAssets
    }

    this.pendingUpdates.clear()
    this.updateTimeout = null
    this.lastUpdateTime = Date.now()
  }

  public stop() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
      this.updateTimeout = null
    }
  }

  public updateAssets(assets: FormattedCryptoAsset[]) {
    this.assets = assets
    const newSymbols = new Set(assets.map(asset => `${asset.symbol.toLowerCase()}usdt`))
    
    // If symbols changed, restart the connection
    if (this.symbols.size !== newSymbols.size || 
        Array.from(this.symbols).some(s => !newSymbols.has(s))) {
      this.symbols = newSymbols
      this.start(assets)
    }
  }

  private getSentiment(changePercent: number): "Bullish" | "Neutral" | "Bearish" {
    if (changePercent > 2) return "Bullish"
    if (changePercent < -2) return "Bearish"
    return "Neutral"
  }
} 