import axios from 'axios'
import { fetchCryptoMarkets, fetchCryptoMarketChart } from '@/lib/api/crypto-api'
import type { CryptoAsset } from '@/lib/api/crypto-api'

export interface MarketData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  high_24h: number
  low_24h: number
  last_updated: string
}

export interface MarketChartData {
  prices: [number, number][]
  market_caps: [number, number][]
  total_volumes: [number, number][]
}

// Cache configuration
const CACHE_TTL = 60000 // 1 minute
const RATE_LIMIT = 20 // requests per minute
const RATE_LIMIT_WINDOW = 60000 // 1 minute

interface CacheEntry {
  data: any
  timestamp: number
}

interface RateLimitEntry {
  count: number
  timestamp: number
}

class MarketDataService {
  private static instance: MarketDataService
  private cache: Map<string, CacheEntry>
  private rateLimits: Map<string, RateLimitEntry>
  private requestQueue: Array<() => Promise<void>>
  private isProcessingQueue: boolean

  private constructor() {
    this.cache = new Map()
    this.rateLimits = new Map()
    this.requestQueue = []
    this.isProcessingQueue = false
  }

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService()
    }
    return MarketDataService.instance
  }

  private async checkRateLimit(key: string): Promise<boolean> {
    const now = Date.now()
    const limit = this.rateLimits.get(key)

    if (!limit || now - limit.timestamp > RATE_LIMIT_WINDOW) {
      this.rateLimits.set(key, { count: 1, timestamp: now })
      return true
    }

    if (limit.count < RATE_LIMIT) {
      limit.count++
      return true
    }

    return false
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return

    this.isProcessingQueue = true
    try {
      const request = this.requestQueue.shift()
      if (request) {
        await request()
      }
    } finally {
      this.isProcessingQueue = false
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000) // Process next request after 1 second
      }
    }
  }

  private async queueRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const cached = await this.getFromCache<T>(key)
          if (cached) {
            resolve(cached)
            return
          }

          const canProceed = await this.checkRateLimit(key)
          if (!canProceed) {
            // If rate limited, retry after delay
            setTimeout(() => this.queueRequest(key, request).then(resolve).catch(reject), 5000)
            return
          }

          const result = await request()
          this.setCache(key, result)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.processQueue()
    })
  }

  async getMarketData(): Promise<CryptoAsset[]> {
    const key = 'market_data'
    return this.queueRequest(key, async () => {
      try {
        console.log('Fetching market data...')
        const data = await fetchCryptoMarkets()
        console.log('Market data fetched successfully:', data.length, 'assets')
        return data
      } catch (error) {
        console.error('Error fetching market data:', error)
        // Return cached data if available, even if expired
        const cached = await this.getFromCache<CryptoAsset[]>(key)
        if (cached) {
          console.log('Using cached market data')
          return cached
        }
        throw error
      }
    })
  }

  async getMarketChart(coinId: string, days: string = '7'): Promise<any> {
    const key = `market_chart_${coinId}_${days}`
    return this.queueRequest(key, async () => {
      try {
        console.log(`Fetching chart data for ${coinId}...`)
        const data = await fetchCryptoMarketChart(coinId, 'usd', days)
        console.log(`Chart data fetched successfully for ${coinId}`)
        return data
      } catch (error) {
        console.error(`Error fetching chart for ${coinId}:`, error)
        const cached = await this.getFromCache<any>(key)
        if (cached) {
          console.log(`Using cached chart data for ${coinId}`)
          return cached
        }
        throw error
      }
    })
  }

  // WebSocket connection with reconnection logic
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 5000 // 5 seconds

  connectWebSocket() {
    if (this.ws) return

    try {
      this.ws = new WebSocket('wss://ws.coingecko.com/api/v3')
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.ws = null
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      this.attemptReconnect()
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.connectWebSocket()
    }, delay)
  }

  private handleWebSocketMessage(data: any) {
    // Update cache with new data
    if (data.type === 'price_update') {
      const key = `market_data_${data.coin_id}`
      this.setCache(key, data)
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export const marketDataService = MarketDataService.getInstance() 