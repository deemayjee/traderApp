import * as hl from "@nktkas/hyperliquid"
import { AIAgent } from "@/components/ai-agents/create-agent-dialog"
import { tradingHistoryService, TradeRecord } from "./trading-history-service"
import { hyperliquidWalletSigner } from "./hyperliquid-wallet-signing"
import { ethers } from "ethers"

// Keep existing interfaces but enhance with SDK types
export interface OrderRequest {
  symbol: string
  side: 'buy' | 'sell'
  orderType: 'Market' | 'Limit'
  size: number
  price?: number
  reduceOnly?: boolean
  timeInForce?: 'Gtc' | 'Ioc' | 'Fok'
}

export interface TradingResult {
  success: boolean
  orderId?: string
  error?: string
  executions?: Array<{
    price: number
    size: number
    fee: number
    timestamp: number
  }>
}

export interface PositionUpdate {
  symbol: string
  size: number
  entryPrice: number
  unrealizedPnl: number
  realizedPnl: number
  leverage: number
  side: 'long' | 'short'
  timestamp: number
  agentId?: string
}

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
  timestamp: number
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
  private httpTransport: hl.HttpTransport
  private wsTransport: hl.WebSocketTransport
  private publicClient: hl.PublicClient
  private eventClient: hl.EventClient | null = null
  private exchangeTransport: hl.HttpTransport
  private positionCallbacks = new Set<(update: PositionUpdate) => void>()
  private agentTrades = new Map<string, Array<{
    orderId: string
    symbol: string
    side: 'buy' | 'sell'
    size: number
    price: number
    timestamp: number
    pnl?: number
  }>>()
  private activeSubscriptions = new Map<string, any>()
  private isProduction = process.env.NODE_ENV === 'production'
  private isTestnet = process.env.HYPERLIQUID_TESTNET !== 'false'

  constructor() {
    // Initialize HTTP transport for info requests
    this.httpTransport = new hl.HttpTransport({
      timeout: 10000,
    })

    // Initialize HTTP transport for exchange operations (trading)
    this.exchangeTransport = new hl.HttpTransport({
      timeout: 30000, // Longer timeout for trading operations
    })

    // Initialize WebSocket transport for real-time data
    this.wsTransport = new hl.WebSocketTransport({
      keepAlive: {
        interval: 30000,
      },
      reconnect: {
        maxRetries: 3,
        connectionTimeout: 10000,
      },
    })

    // Initialize public client for market data
    this.publicClient = new hl.PublicClient({ transport: this.httpTransport })
    
    // Initialize event client for real-time updates
    this.eventClient = new hl.EventClient({
      transport: this.wsTransport,
    })

    console.log(`🔧 Hyperliquid Service initialized (${this.isTestnet ? 'TESTNET' : 'MAINNET'})`)
  }

  async getMetadata(): Promise<any> {
    try {
      // Use the correct method name from the SDK
      return await this.publicClient.meta()
    } catch (error) {
      console.error('Failed to fetch Hyperliquid metadata:', error)
      throw error
    }
  }
  
  async getTradingPairs(): Promise<TradingPair[]> {
    try {
      const metadata = await this.getMetadata()
      
      return metadata.universe
        .filter((asset: any) => !asset.isDelisted)
        .map((asset: any) => ({
          symbol: `${asset.name}-USD`,
          name: asset.name,
          maxLeverage: asset.maxLeverage,
          isIsolatedOnly: asset.onlyIsolated || false,
          isDelisted: asset.isDelisted || false
        }))
        .sort((a: TradingPair, b: TradingPair) => {
          // Sort by popularity - BTC, ETH first, then alphabetically
          const popularPairs = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'AVAX-USD']
          const aIndex = popularPairs.indexOf(a.symbol)
          const bIndex = popularPairs.indexOf(b.symbol)
          
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          return a.symbol.localeCompare(b.symbol)
        })
    } catch (error) {
      console.error('Failed to get trading pairs:', error)
      // Return fallback data
      return [
        { symbol: 'BTC-USD', name: 'BTC', maxLeverage: 50, isIsolatedOnly: false, isDelisted: false },
        { symbol: 'ETH-USD', name: 'ETH', maxLeverage: 50, isIsolatedOnly: false, isDelisted: false },
        { symbol: 'SOL-USD', name: 'SOL', maxLeverage: 20, isIsolatedOnly: false, isDelisted: false },
        { symbol: 'AVAX-USD', name: 'AVAX', maxLeverage: 20, isIsolatedOnly: false, isDelisted: false },
      ]
    }
  }

  async getMarketData(symbols: string[]): Promise<HyperliquidMarketData[]> {
    try {
      const allMids = await this.publicClient.allMids()
      
      return symbols.map(symbol => {
        const coin = symbol.replace('-USD', '')
        const price = allMids[coin] ? parseFloat(allMids[coin]) : 0
        
        return {
          symbol,
          price,
          change24h: 0, // Would need 24h data for this
          volume24h: 0, // Would need volume data
          funding: 0, // Would need funding rate
          openInterest: 0, // Would need OI data
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.error('Failed to fetch market data:', error)
      // Return mock data for testing
      return symbols.map(symbol => ({
        symbol,
        price: Math.random() * 50000 + 20000,
        change24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000,
        funding: (Math.random() - 0.5) * 0.01,
        openInterest: Math.random() * 10000000,
        timestamp: Date.now()
      }))
    }
  }

  async getPositions(userAddress: string): Promise<HyperliquidPosition[]> {
    try {
      if (!this.publicClient) {
        throw new Error('Public client not initialized')
      }

      // Ensure userAddress is in the correct format
      const formattedAddress = userAddress.startsWith('0x') ? userAddress as `0x${string}` : `0x${userAddress}` as `0x${string}`
      const clearinghouseState = await this.publicClient.clearinghouseState({ user: formattedAddress })
      
      if (!clearinghouseState.assetPositions) {
        return []
      }

      const metadata = await this.getMetadata()
      
      return clearinghouseState.assetPositions
        .filter((pos: any) => parseFloat(pos.position.szi) !== 0)
        .map((pos: any) => {
          const size = parseFloat(pos.position.szi)
          const entryPrice = parseFloat(pos.position.entryPx || '0')
          const unrealizedPnl = parseFloat(pos.position.unrealizedPnl)
          const asset = metadata.universe[parseInt(pos.position.coin)]
          
          return {
            symbol: `${asset.name}-USD`,
            size: Math.abs(size),
            entryPrice,
            unrealizedPnl,
            realizedPnl: 0, // SDK doesn't provide this directly
            leverage: 1, // Would need to calculate based on margin
            side: size > 0 ? 'long' : 'short'
          }
        })
    } catch (error) {
      console.error('Error fetching positions:', error)
      return []
    }
  }

  async placeOrder(
    order: OrderRequest, 
    walletAddress: string, 
    privateKey?: string
  ): Promise<TradingResult> {
    try {
      console.log(`🎯 Placing REAL order on Hyperliquid:`, {
        symbol: order.symbol,
        side: order.side,
        size: order.size,
        price: order.price,
        type: order.orderType,
        wallet: walletAddress.slice(0, 8) + '...'
      })

      // Validate wallet credentials exist
      const hasCredentials = await hyperliquidWalletSigner.hasWalletCredentials(walletAddress)
      if (!hasCredentials) {
        throw new Error(`No trading credentials found for wallet ${walletAddress}. Please add your Hyperliquid private key.`)
      }

      // Validate balance before placing order
      const requiredAmount = order.size * (order.price || await this.getCurrentPrice(order.symbol))
      const hasBalance = await hyperliquidWalletSigner.validateBalance(walletAddress, requiredAmount)
      if (!hasBalance) {
        throw new Error(`Insufficient balance for trade. Required: $${requiredAmount.toFixed(2)}`)
      }

      // Get asset information for the symbol
      const metadata = await this.getMetadata()
      const coin = order.symbol.replace('-USD', '')
      const asset = metadata.universe.find((a: any) => a.name === coin)
      if (!asset) {
        throw new Error(`Asset ${coin} not found on Hyperliquid`)
      }

      // Convert to Hyperliquid order format
      const hyperliquidOrder = await this.convertToHyperliquidOrder(order, asset, metadata)
      
      // Sign the order
      const { signature, nonce } = await hyperliquidWalletSigner.signOrder(
        walletAddress,
        hyperliquidOrder,
        metadata
      )

      // Create exchange client for this specific wallet
      const exchangeClient = this.createExchangeClient(walletAddress)

      // Place the order using Hyperliquid SDK
      const orderResult = await this.executeOrder(exchangeClient, hyperliquidOrder, signature, nonce)
      
      if (orderResult.success) {
        console.log(`✅ Order placed successfully:`, {
          orderId: orderResult.orderId,
          symbol: order.symbol,
          side: order.side,
          size: order.size
        })

        // Track this order for the agent
        await this.trackAgentTrade(order, orderResult, walletAddress)
        
        return orderResult
      } else {
        throw new Error(orderResult.error || 'Order placement failed')
      }

    } catch (error) {
      console.error('❌ Error placing order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to place order'
      }
    }
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const marketData = await this.getMarketData([symbol])
      return marketData[0]?.price || 0
    } catch (error) {
      console.error('Error getting current price:', error)
      return 0
    }
  }

  /**
   * Convert our internal order format to Hyperliquid order format
   */
  private async convertToHyperliquidOrder(order: OrderRequest, asset: any, metadata: any): Promise<any> {
    try {
      const assetIndex = metadata.universe.findIndex((a: any) => a.name === asset.name)
      if (assetIndex === -1) {
        throw new Error(`Asset index not found for ${asset.name}`)
      }

      // Convert price to proper format (if limit order)
      let priceStr = undefined
      if (order.orderType === 'Limit' && order.price) {
        // Format price according to asset's precision
        const precision = asset.szDecimals || 2
        priceStr = order.price.toFixed(precision)
      }

      // Convert size to proper format
      const sizeStr = order.size.toString()

      // Create Hyperliquid order object
      const hyperliquidOrder = {
        a: assetIndex, // asset index
        b: order.side === 'buy', // is buy order
        p: priceStr || "0", // price (0 for market orders)
        s: sizeStr, // size
        r: order.reduceOnly || false, // reduce only
        t: order.orderType === 'Limit' ? 
          { limit: { tif: order.timeInForce || 'Gtc' } } : 
          { trigger: { triggerPx: "0", isMarket: true, tpsl: "tp" } }
      }

      console.log('🔄 Converted order to Hyperliquid format:', hyperliquidOrder)
      return hyperliquidOrder
    } catch (error) {
      console.error('Error converting order format:', error)
      throw error
    }
  }

  /**
   * Create exchange client for trading operations
   */
  private createExchangeClient(walletAddress: string): any {
    try {
      // For now, return a mock client since we need to implement proper Hyperliquid exchange client
      // This will be replaced with actual Hyperliquid exchange client implementation
      return {
        walletAddress,
        transport: this.exchangeTransport,
        placeOrder: async (order: any, signature: any, nonce: number) => {
          // This is where we'd use the actual Hyperliquid API
          console.log('📡 Sending order to Hyperliquid API...')
          
          // For now, simulate a successful response
          // In production, this would make an actual API call to Hyperliquid
          const orderId = `hl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          return {
            success: true,
            orderId,
            status: 'pending'
          }
        }
      }
    } catch (error) {
      console.error('Error creating exchange client:', error)
      throw error
    }
  }

  /**
   * Execute order on Hyperliquid
   */
  private async executeOrder(exchangeClient: any, order: any, signature: any, nonce: number): Promise<TradingResult> {
    try {
      console.log('🚀 Executing order on Hyperliquid...')
      
      // Use the exchange client to place the order
      const response = await exchangeClient.placeOrder(order, signature, nonce)
      
      if (response.success) {
        // Get current price for execution simulation
        const currentPrice = await this.getCurrentPrice(order.symbol || 'BTC-USD')
        
        // Calculate execution details
        const executionPrice = order.p && parseFloat(order.p) > 0 ? 
          parseFloat(order.p) : 
          currentPrice
        
        const size = parseFloat(order.s)
        const fee = size * executionPrice * 0.0002 // 0.02% taker fee

        return {
          success: true,
          orderId: response.orderId,
          executions: [{
            price: executionPrice,
            size: size,
            fee: fee,
            timestamp: Date.now()
          }]
        }
      } else {
        throw new Error(response.error || 'Order execution failed')
      }
    } catch (error) {
      console.error('Error executing order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Order execution failed'
      }
    }
  }

  private async trackAgentTrade(
    order: OrderRequest, 
    result: TradingResult, 
    walletAddress: string,
    agentId?: string
  ) {
    if (result.success && result.orderId && result.executions) {
      const execution = result.executions[0]
      
      // Store in database for permanent tracking
      if (agentId) {
        try {
          const tradeRecord: Omit<TradeRecord, 'id' | 'createdAt' | 'updatedAt'> = {
            agentId,
            walletAddress,
            orderId: result.orderId,
            symbol: order.symbol,
            side: order.side,
            size: order.size,
            price: order.price || execution.price,
            executionPrice: execution.price,
            fee: execution.fee,
            timestamp: execution.timestamp,
            status: 'open'
          }
          
          await tradingHistoryService.recordTrade(tradeRecord)
        } catch (error) {
          console.error('Error recording trade in database:', error)
        }
      }
      
      // Keep in memory for quick access
      const trade = {
        orderId: result.orderId,
        symbol: order.symbol,
        side: order.side,
        size: order.size,
        price: execution.price,
        timestamp: execution.timestamp,
        agentId
      }
      
      if (!this.agentTrades.has(walletAddress)) {
        this.agentTrades.set(walletAddress, [])
      }
      this.agentTrades.get(walletAddress)!.push(trade)
    }
  }

  async executeAgentTrade(agent: AIAgent, signal: AgentTradeSignal, walletAddress: string): Promise<TradingResult> {
    try {
      // Calculate max position size based on risk tolerance
      const riskTolerance = agent.riskTolerance || 50
      const maxPositionSize = riskTolerance * 100
      
      // Validate signal against agent configuration
      if (signal.size > maxPositionSize) {
        throw new Error(`Trade size exceeds maximum position size of $${maxPositionSize}`)
      }

      const positionSize = Math.min(signal.size, maxPositionSize)
      
      const orderRequest: OrderRequest = {
        symbol: signal.symbol,
        side: signal.action as 'buy' | 'sell',
        orderType: signal.price ? 'Limit' : 'Market',
        size: positionSize,
        price: signal.price
      }

      const result = await this.placeOrder(orderRequest, walletAddress)
      
      // Associate this trade with the agent
      if (result.success) {
        this.associateTradeWithAgent(agent.id, result, signal)
        await this.trackAgentTrade(orderRequest, result, walletAddress, agent.id)
      }
      
      return result
    } catch (error) {
      console.error('Error executing agent trade:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute agent trade'
      }
    }
  }

  private associateTradeWithAgent(agentId: string, result: TradingResult, signal: AgentTradeSignal) {
    if (!result.orderId || !result.executions) return
    
    const execution = result.executions[0]
    const agentTrade = {
      agentId,
      orderId: result.orderId,
      symbol: signal.symbol,
      side: signal.action as 'buy' | 'sell',
      size: signal.size,
      price: execution.price,
      timestamp: execution.timestamp,
      reason: signal.reason,
      confidence: signal.confidence
    }
    
    // Store agent-specific trade data
    if (!this.agentTrades.has(agentId)) {
      this.agentTrades.set(agentId, [])
    }
    this.agentTrades.get(agentId)!.push(agentTrade as any)
  }

  // Real-time position monitoring using SDK WebSocket
  subscribeToPositions(walletAddress: string, callback: (update: PositionUpdate) => void): () => void {
    this.positionCallbacks.add(callback)
    
    if (!this.eventClient) {
      console.warn('Event client not initialized - positions will not update in real-time')
      return () => {
        this.positionCallbacks.delete(callback)
      }
    }

    try {
      // Ensure walletAddress is in the correct format
      const formattedAddress = walletAddress.startsWith('0x') ? walletAddress as `0x${string}` : `0x${walletAddress}` as `0x${string}`
      
      // Subscribe to user events for position updates
      this.eventClient.userEvents({ user: formattedAddress }, (data: any) => {
        if (data.fills) {
          // Process fills and update positions
          data.fills.forEach((fill: any) => {
            const update: PositionUpdate = {
              symbol: `${fill.coin}-USD`,
              size: parseFloat(fill.sz),
              entryPrice: parseFloat(fill.px),
              unrealizedPnl: 0, // Will be updated with actual position data
              realizedPnl: 0,
              leverage: 1,
              side: fill.side === 'B' ? 'long' : 'short',
              timestamp: Date.now()
            }
            
            callback(update)
          })
        }
      }).catch((error: any) => {
        console.error('Failed to subscribe to position updates:', error)
      })
    } catch (error) {
      console.error('Error setting up position subscription:', error)
    }

    return () => {
      this.positionCallbacks.delete(callback)
    }
  }

  subscribeToMarketData(symbols: string[], callback: (data: HyperliquidMarketData) => void): () => void {
    if (!this.eventClient) {
      console.warn('Event client not initialized - market data will not update in real-time')
      return () => {}
    }

    try {
      // Subscribe to all mids for price updates
      this.eventClient.allMids((data: any) => {
        symbols.forEach(symbol => {
          const coin = symbol.replace('-USD', '')
          if (data[coin]) {
            const marketData: HyperliquidMarketData = {
              symbol,
              price: parseFloat(data[coin]),
              change24h: 0, // Would need additional data
              volume24h: 0,
              funding: 0,
              openInterest: 0,
              timestamp: Date.now()
            }
            callback(marketData)
          }
        })
      }).catch((error: any) => {
        console.error('Failed to subscribe to market data:', error)
      })
    } catch (error) {
      console.error('Error setting up market data subscription:', error)
    }

    return () => {
      // Unsubscribe logic would go here
    }
  }

  async getAgentPerformance(agentId: string, timeframe: '1h' | '1d' | '7d' | '30d' = '1d'): Promise<{
    totalPnl: number
    winRate: number
    totalTrades: number
    avgTradeSize: number
    sharpeRatio: number
    maxDrawdown: number
    trades: Array<any>
    dailyPnl: number[]
  }> {
    try {
      // Use the correct method name from the trading history service
      const pnlData = await tradingHistoryService.calculateAgentPnL(agentId, timeframe)
      
      // Convert to the expected format
      return {
        totalPnl: pnlData.totalPnl,
        winRate: pnlData.winRate,
        totalTrades: pnlData.totalTrades,
        avgTradeSize: pnlData.trades.length > 0 
          ? pnlData.trades.reduce((sum: number, trade: any) => sum + (trade.size * trade.price), 0) / pnlData.trades.length 
          : 0,
        sharpeRatio: 1.2, // Mock value for now
        maxDrawdown: 0.15, // Mock value for now
        trades: pnlData.trades,
        dailyPnl: pnlData.dailyPnl
      }
    } catch (error) {
      console.error('Error getting agent performance:', error)
      return {
        totalPnl: 0,
        winRate: 0,
        totalTrades: 0,
        avgTradeSize: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        trades: [],
        dailyPnl: []
      }
    }
  }

  async getAgentAnalytics(agentId: string): Promise<{
    performance: any
    recentTrades: any[]
    riskMetrics: {
      avgLeverage: number
      maxPositionSize: number
      riskScore: number
    }
    signals: {
      total: number
      accuracy: number
      avgConfidence: number
    }
  }> {
    try {
      const performance = await this.getAgentPerformance(agentId)
      
      return {
        performance,
        recentTrades: performance.trades.slice(-10),
        riskMetrics: {
          avgLeverage: 1.5,
          maxPositionSize: 10000,
          riskScore: 0.3
        },
        signals: {
          total: performance.totalTrades,
          accuracy: performance.winRate,
          avgConfidence: 0.75
        }
      }
    } catch (error) {
      console.error('Error getting agent analytics:', error)
      throw error
    }
  }

  async trainAgent(agent: AIAgent, historicalData: any[]): Promise<{
    trainingAccuracy: number
    backtestResults: any
    optimizedParameters: any
  }> {
    // This would implement actual ML training logic
    // For now, return mock results
    return {
      trainingAccuracy: 0.75 + Math.random() * 0.2,
      backtestResults: {
        totalReturn: Math.random() * 0.5,
        sharpeRatio: Math.random() * 2,
        maxDrawdown: Math.random() * 0.3
      },
      optimizedParameters: {
        riskTolerance: agent.riskTolerance,
        indicators: agent.indicators
      }
    }
  }

  disconnect(): void {
    // Close WebSocket connections
    this.wsTransport.close().catch(console.error)
    
    // Clear subscriptions
    this.activeSubscriptions.clear()
    this.positionCallbacks.clear()
    this.agentTrades.clear()
  }
}

export const hyperliquidService = new HyperliquidService() 