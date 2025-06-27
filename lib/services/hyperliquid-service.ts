import { AIAgent } from "@/components/ai-agents/create-agent-dialog"

export interface HyperliquidMarketData {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  funding: number
  openInterest: number
  timestamp: number
}

export interface HyperliquidPosition {
  symbol: string
  size: number
  entryPrice: number
  unrealizedPnl: number
  realizedPnl: number
  leverage: number
  side: 'long' | 'short'
}

export interface HyperliquidOrder {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  size: number
  price: number
  type: 'market' | 'limit'
  status: 'pending' | 'filled' | 'cancelled'
  timestamp: number
}

export interface AgentTradeSignal {
  agentId: string
  symbol: string
  action: 'buy' | 'sell' | 'close'
  confidence: number
  size: number
  price?: number
  reason: string
  timestamp:Number
}

export interface HyperliquidAsset {
  name: string
  szDecimals: number
  maxLeverage: number
  onlyIsolated?: boolean
  isDelisted?: boolean
}

export interface HyperliquidMetadata {
  universe: HyperliquidAsset[]
  marginTables: Array<[number, any]>
}

export interface TradingPair {
  symbol: string
  name: string
  maxLeverage: number
  isIsolatedOnly?: boolean
  isDelisted?: boolean
}

class HyperliquidService {
  private readonly API_BASE = 'https://api.hyperliquid.xyz'
  private wsUrl = 'wss://api.hyperliquid.xyz/ws'
  private activeConnections = new Map<string, WebSocket>()

  async getMetadata(): Promise<HyperliquidMetadata> {
    try {
      const response = await fetch(`${this.API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meta'
        })
      })
      
      if (!response.ok) {
        throw new Error(`Hyperliquid API error: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch Hyperliquid metadata:', error)
      // Return fallback data with popular pairs
      return {
        universe: [
          { name: 'BTC', szDecimals: 5, maxLeverage: 50 },
          { name: 'ETH', szDecimals: 4, maxLeverage: 50 },
          { name: 'SOL', szDecimals: 2, maxLeverage: 20 },
          { name: 'AVAX', szDecimals: 1, maxLeverage: 20 },
          { name: 'DOGE', szDecimals: 0, maxLeverage: 20 }
        ],
        marginTables: []
      }
    }
  }
  
  async getTradingPairs(): Promise<TradingPair[]> {
    const metadata = await this.getMetadata()
    
    return metadata.universe
      .filter(asset => !asset.isDelisted) // Filter out delisted assets
      .map(asset => ({
        symbol: `${asset.name}-USD`,
        name: asset.name,
        maxLeverage: asset.maxLeverage,
        isIsolatedOnly: asset.onlyIsolated || false,
        isDelisted: asset.isDelisted || false
      }))
      .sort((a, b) => {
        // Sort by popularity - BTC, ETH first, then alphabetically
        const popularPairs = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'AVAX-USD']
        const aIndex = popularPairs.indexOf(a.symbol)
        const bIndex = popularPairs.indexOf(b.symbol)
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        return a.symbol.localeCompare(b.symbol)
      })
  }
  
  async getAssetContexts() {
    try {
      const response = await fetch(`${this.API_BASE}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'metaAndAssetCtxs'
        })
      })
      
      if (!response.ok) {
        throw new Error(`Hyperliquid API error: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch Hyperliquid asset contexts:', error)
      return null
    }
  }

  async getMarketData(symbols: string[]): Promise<HyperliquidMarketData[]> {
    try {
      // Mock data for now - replace with actual Hyperliquid API calls
      return symbols.map(symbol => ({
        symbol,
        price: Math.random() * 1000 + 1000,
        change24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 10000000,
        funding: (Math.random() - 0.5) * 0.1,
        openInterest: Math.random() * 1000000,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Error fetching market data:', error)
      throw new Error('Failed to fetch market data from Hyperliquid')
    }
  }

  async getPositions(userAddress: string): Promise<HyperliquidPosition[]> {
    try {
      // Mock data - replace with actual API call
      return [
        {
          symbol: 'ETH',
          size: 1.5,
          entryPrice: 2500,
          unrealizedPnl: 150.25,
          realizedPnl: 0,
          leverage: 3,
          side: 'long'
        }
      ]
    } catch (error) {
      console.error('Error fetching positions:', error)
      throw new Error('Failed to fetch positions from Hyperliquid')
    }
  }

  async placeOrder(order: Omit<HyperliquidOrder, 'id' | 'status' | 'timestamp'>): Promise<HyperliquidOrder> {
    try {
      // Mock order placement - replace with actual API call
      const newOrder: HyperliquidOrder = {
        ...order,
        id: `order_${Date.now()}`,
        status: 'pending',
        timestamp: Date.now()
      }
      
      console.log('Placing order on Hyperliquid:', newOrder)
      return newOrder
    } catch (error) {
      console.error('Error placing order:', error)
      throw new Error('Failed to place order on Hyperliquid')
    }
  }

  async executeAgentTrade(agent: AIAgent, signal: AgentTradeSignal): Promise<HyperliquidOrder> {
    try {
      // Calculate max position size based on risk tolerance
      const maxPositionSize = agent.riskTolerance * 100 // Simple calculation based on risk tolerance
      
      // Validate signal against agent configuration
      if (signal.size > maxPositionSize) {
        throw new Error(`Trade size exceeds maximum position size of $${maxPositionSize}`)
      }

      // Calculate actual position size based on risk management
      const positionSize = Math.min(signal.size, maxPositionSize)
      
      const order: Omit<HyperliquidOrder, 'id' | 'status' | 'timestamp'> = {
        symbol: signal.symbol,
        side: signal.action as 'buy' | 'sell',
        size: positionSize,
        price: signal.price || 0, // Use market price if not specified
        type: signal.price ? 'limit' : 'market'
      }

      return await this.placeOrder(order)
    } catch (error) {
      console.error('Error executing agent trade:', error)
      throw error
    }
  }

  subscribeToMarketData(symbols: string[], callback: (data: HyperliquidMarketData) => void): () => void {
    const ws = new WebSocket(this.wsUrl)
    const connectionId = `market_${Date.now()}`
    
    ws.onopen = () => {
      console.log('Connected to Hyperliquid WebSocket')
      // Subscribe to market data for specified symbols
      ws.send(JSON.stringify({
        method: 'subscribe',
        params: {
          channel: 'trades',
          symbols
        }
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.channel === 'trades') {
          callback(data.data)
        }
      } catch (error) {
        console.error('Error parsing WebSocket data:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.activeConnections.set(connectionId, ws)

    // Return cleanup function
    return () => {
      ws.close()
      this.activeConnections.delete(connectionId)
    }
  }

  async getAgentPerformance(agentId: string, timeframe: '1h' | '1d' | '7d' | '30d' = '1d'): Promise<{
    totalPnl: number
    winRate: number
    totalTrades: number
    avgTradeSize: number
    sharpeRatio: number
    maxDrawdown: number
  }> {
    try {
      // Mock performance data - replace with actual database queries
      return {
        totalPnl: Math.random() * 1000 - 500,
        winRate: Math.random() * 40 + 50, // 50-90%
        totalTrades: Math.floor(Math.random() * 100),
        avgTradeSize: Math.random() * 500 + 100,
        sharpeRatio: Math.random() * 2,
        maxDrawdown: Math.random() * -20
      }
    } catch (error) {
      console.error('Error fetching agent performance:', error)
      throw new Error('Failed to fetch agent performance data')
    }
  }

  async trainAgent(agent: AIAgent, historicalData: any[]): Promise<{
    trainingAccuracy: number
    backtestResults: any
    optimizedParameters: any
  }> {
    try {
      // Mock training process - replace with actual ML training
      console.log(`Training agent ${agent.name} with ${historicalData.length} data points`)
      
      // Simulate training delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return {
        trainingAccuracy: Math.random() * 20 + 75, // 75-95%
        backtestResults: {
          totalReturn: Math.random() * 50 + 10,
          winRate: Math.random() * 30 + 60,
          sharpeRatio: Math.random() * 2 + 1
        },
        optimizedParameters: {
          indicators: agent.indicators,
          focusAssets: agent.focusAssets,
          riskTolerance: agent.riskTolerance * (Math.random() * 0.4 + 0.8)
        }
      }
    } catch (error) {
      console.error('Error training agent:', error)
      throw new Error('Failed to train agent')
    }
  }

  disconnect(): void {
    this.activeConnections.forEach((ws, id) => {
      ws.close()
    })
    this.activeConnections.clear()
  }
}

export const hyperliquidService = new HyperliquidService() 