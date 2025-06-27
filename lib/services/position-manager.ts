import { createClient } from '@supabase/supabase-js'
import { hyperliquidService, TradingResult, OrderRequest } from './hyperliquid-service'
import { tradingHistoryService, TradeRecord } from './trading-history-service'

export interface Position {
  id: string
  agentId: string
  walletAddress: string
  orderId: string
  symbol: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  currentPrice: number
  unrealizedPnl: number
  stopLossPrice?: number
  takeProfitPrice?: number
  stopLossPercentage: number
  takeProfitPercentage: number
  status: 'open' | 'closed' | 'stop_loss_triggered' | 'take_profit_triggered'
  openTime: number
  closeTime?: number
  leverage: number
}

export interface PositionUpdate {
  positionId: string
  currentPrice: number
  unrealizedPnl: number
  timestamp: number
}

export interface RiskSettings {
  stopLossPercentage: number
  takeProfitPercentage: number
  trailingStopEnabled: boolean
  trailingStopPercentage?: number
  maxHoldTime?: number // in milliseconds
}

class PositionManager {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  private monitoringInterval: NodeJS.Timeout | null = null
  private activePositions = new Map<string, Position>()
  private isMonitoring = false

  /**
   * Start position monitoring for all active positions
   */
  async startPositionMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Position monitoring already running')
      return
    }

    console.log('🔍 Starting position monitoring...')
    this.isMonitoring = true

    // Load existing open positions
    await this.loadOpenPositions()

    // Start monitoring loop (every 10 seconds)
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.monitorAllPositions()
      } catch (error) {
        console.error('Error in position monitoring cycle:', error)
      }
    }, 10000) // 10 seconds

    console.log('✅ Position monitoring started')
  }

  /**
   * Stop position monitoring
   */
  async stopPositionMonitoring(): Promise<void> {
    if (!this.isMonitoring) return

    console.log('🛑 Stopping position monitoring...')
    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    console.log('✅ Position monitoring stopped')
  }

  /**
   * Open a new position with stop loss and take profit
   */
  async openPosition(
    agentId: string,
    walletAddress: string,
    orderId: string,
    symbol: string,
    side: 'buy' | 'sell',
    size: number,
    entryPrice: number,
    riskSettings: RiskSettings
  ): Promise<Position> {
    const positionSide: 'long' | 'short' = side === 'buy' ? 'long' : 'short'
    
    // Calculate stop loss and take profit prices
    const stopLossPrice = this.calculateStopLossPrice(entryPrice, positionSide, riskSettings.stopLossPercentage)
    const takeProfitPrice = this.calculateTakeProfitPrice(entryPrice, positionSide, riskSettings.takeProfitPercentage)

    const position: Position = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      walletAddress,
      orderId,
      symbol,
      side: positionSide,
      size,
      entryPrice,
      currentPrice: entryPrice,
      unrealizedPnl: 0,
      stopLossPrice,
      takeProfitPrice,
      stopLossPercentage: riskSettings.stopLossPercentage,
      takeProfitPercentage: riskSettings.takeProfitPercentage,
      status: 'open',
      openTime: Date.now(),
      leverage: 1
    }

    // Store in database
    await this.savePosition(position)
    
    // Add to active monitoring
    this.activePositions.set(position.id, position)

    console.log(`📈 Position opened: ${position.side.toUpperCase()} ${position.size} ${position.symbol} at $${position.entryPrice}`)
    console.log(`   Stop Loss: $${stopLossPrice?.toFixed(4)} (-${riskSettings.stopLossPercentage}%)`)
    console.log(`   Take Profit: $${takeProfitPrice?.toFixed(4)} (+${riskSettings.takeProfitPercentage}%)`)

    return position
  }

  /**
   * Monitor all active positions for stop loss and take profit triggers
   */
  private async monitorAllPositions(): Promise<void> {
    if (this.activePositions.size === 0) return

    console.log(`🔍 Monitoring ${this.activePositions.size} active positions...`)

    for (const [positionId, position] of this.activePositions) {
      try {
        await this.monitorPosition(position)
      } catch (error) {
        console.error(`Error monitoring position ${positionId}:`, error)
      }
    }
  }

  /**
   * Monitor a single position for stop loss and take profit
   */
  private async monitorPosition(position: Position): Promise<void> {
    // Get current market price
    const marketData = await hyperliquidService.getMarketData([position.symbol])
    if (!marketData || marketData.length === 0) {
      console.warn(`No market data available for ${position.symbol}`)
      return
    }

    const currentPrice = marketData[0].price
    const previousPrice = position.currentPrice
    
    // Calculate unrealized PnL
    const unrealizedPnl = this.calculateUnrealizedPnl(
      position.entryPrice,
      currentPrice,
      position.size,
      position.side
    )

    // Update position data
    position.currentPrice = currentPrice
    position.unrealizedPnl = unrealizedPnl

    // Check for stop loss trigger
    if (position.stopLossPrice && this.isStopLossTriggered(position, currentPrice)) {
      console.log(`🛑 STOP LOSS TRIGGERED for ${position.symbol}!`)
      console.log(`   Entry: $${position.entryPrice}, Current: $${currentPrice}, Stop: $${position.stopLossPrice}`)
      console.log(`   Loss: $${unrealizedPnl.toFixed(2)} (${((unrealizedPnl / (position.entryPrice * position.size)) * 100).toFixed(2)}%)`)
      
      await this.closePosition(position, 'stop_loss_triggered', currentPrice)
      return
    }

    // Check for take profit trigger
    if (position.takeProfitPrice && this.isTakeProfitTriggered(position, currentPrice)) {
      console.log(`🎯 TAKE PROFIT TRIGGERED for ${position.symbol}!`)
      console.log(`   Entry: $${position.entryPrice}, Current: $${currentPrice}, Target: $${position.takeProfitPrice}`)
      console.log(`   Profit: $${unrealizedPnl.toFixed(2)} (${((unrealizedPnl / (position.entryPrice * position.size)) * 100).toFixed(2)}%)`)
      
      await this.closePosition(position, 'take_profit_triggered', currentPrice)
      return
    }

    // Log position status if price changed significantly
    if (Math.abs(currentPrice - previousPrice) / previousPrice > 0.005) { // 0.5% change
      const pnlPercent = (unrealizedPnl / (position.entryPrice * position.size)) * 100
      console.log(`📊 ${position.symbol} ${position.side.toUpperCase()}: $${currentPrice.toFixed(4)} | PnL: $${unrealizedPnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`)
    }

    // Update position in database
    await this.updatePositionPnl(position.id, currentPrice, unrealizedPnl)
  }

  /**
   * Close a position (stop loss, take profit, or manual)
   */
  private async closePosition(
    position: Position, 
    reason: 'stop_loss_triggered' | 'take_profit_triggered' | 'manual_close',
    closePrice: number
  ): Promise<void> {
    try {
      // Calculate final PnL
      const realizedPnl = this.calculateUnrealizedPnl(
        position.entryPrice,
        closePrice,
        position.size,
        position.side
      )

      // Execute closing order
      const closingOrderRequest: OrderRequest = {
        symbol: position.symbol,
        side: position.side === 'long' ? 'sell' : 'buy', // Opposite side to close
        orderType: 'Market',
        size: position.size,
        reduceOnly: true
      }

      console.log(`🔄 Executing closing order for ${position.symbol}...`)
      const result: TradingResult = await hyperliquidService.placeOrder(
        closingOrderRequest,
        position.walletAddress
      )

      if (result.success) {
        // Update position status
        position.status = reason
        position.closeTime = Date.now()
        position.currentPrice = closePrice
        position.unrealizedPnl = realizedPnl

        // Update in database
        await this.updatePositionStatus(position.id, reason, closePrice, realizedPnl)

        // Update original trade record
        await this.updateTradeRecord(position.orderId, realizedPnl, 'closed')

        // Remove from active monitoring
        this.activePositions.delete(position.id)

        console.log(`✅ Position closed: ${position.symbol} ${position.side.toUpperCase()}`)
        console.log(`   Final PnL: $${realizedPnl.toFixed(2)}`)
        console.log(`   Reason: ${reason.replace('_', ' ').toUpperCase()}`)

      } else {
        console.error(`❌ Failed to close position: ${result.error}`)
      }

    } catch (error) {
      console.error(`Error closing position ${position.id}:`, error)
    }
  }

  /**
   * Calculate stop loss price based on entry price and percentage
   */
  private calculateStopLossPrice(entryPrice: number, side: 'long' | 'short', stopLossPercentage: number): number {
    if (side === 'long') {
      return entryPrice * (1 - stopLossPercentage / 100)
    } else {
      return entryPrice * (1 + stopLossPercentage / 100)
    }
  }

  /**
   * Calculate take profit price based on entry price and percentage
   */
  private calculateTakeProfitPrice(entryPrice: number, side: 'long' | 'short', takeProfitPercentage: number): number {
    if (side === 'long') {
      return entryPrice * (1 + takeProfitPercentage / 100)
    } else {
      return entryPrice * (1 - takeProfitPercentage / 100)
    }
  }

  /**
   * Calculate unrealized PnL for a position
   */
  private calculateUnrealizedPnl(entryPrice: number, currentPrice: number, size: number, side: 'long' | 'short'): number {
    if (side === 'long') {
      return (currentPrice - entryPrice) * size
    } else {
      return (entryPrice - currentPrice) * size
    }
  }

  /**
   * Check if stop loss should be triggered
   */
  private isStopLossTriggered(position: Position, currentPrice: number): boolean {
    if (!position.stopLossPrice) return false

    if (position.side === 'long') {
      return currentPrice <= position.stopLossPrice
    } else {
      return currentPrice >= position.stopLossPrice
    }
  }

  /**
   * Check if take profit should be triggered
   */
  private isTakeProfitTriggered(position: Position, currentPrice: number): boolean {
    if (!position.takeProfitPrice) return false

    if (position.side === 'long') {
      return currentPrice >= position.takeProfitPrice
    } else {
      return currentPrice <= position.takeProfitPrice
    }
  }

  /**
   * Load all open positions from database
   */
  private async loadOpenPositions(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('positions')
        .select('*')
        .eq('status', 'open')

      if (error) throw error

      for (const positionData of data || []) {
        const position: Position = {
          id: positionData.id,
          agentId: positionData.agent_id,
          walletAddress: positionData.wallet_address,
          orderId: positionData.order_id,
          symbol: positionData.symbol,
          side: positionData.side,
          size: positionData.size,
          entryPrice: positionData.entry_price,
          currentPrice: positionData.current_price,
          unrealizedPnl: positionData.unrealized_pnl,
          stopLossPrice: positionData.stop_loss_price,
          takeProfitPrice: positionData.take_profit_price,
          stopLossPercentage: positionData.stop_loss_percentage,
          takeProfitPercentage: positionData.take_profit_percentage,
          status: positionData.status,
          openTime: positionData.open_time,
          closeTime: positionData.close_time,
          leverage: positionData.leverage || 1
        }

        this.activePositions.set(position.id, position)
      }

      console.log(`📋 Loaded ${this.activePositions.size} open positions for monitoring`)
    } catch (error) {
      console.error('Error loading open positions:', error)
    }
  }

  /**
   * Save position to database
   */
  private async savePosition(position: Position): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('positions')
        .insert({
          id: position.id,
          agent_id: position.agentId,
          wallet_address: position.walletAddress,
          order_id: position.orderId,
          symbol: position.symbol,
          side: position.side,
          size: position.size,
          entry_price: position.entryPrice,
          current_price: position.currentPrice,
          unrealized_pnl: position.unrealizedPnl,
          stop_loss_price: position.stopLossPrice,
          take_profit_price: position.takeProfitPrice,
          stop_loss_percentage: position.stopLossPercentage,
          take_profit_percentage: position.takeProfitPercentage,
          status: position.status,
          open_time: position.openTime,
          leverage: position.leverage
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving position:', error)
    }
  }

  /**
   * Update position PnL in database
   */
  private async updatePositionPnl(positionId: string, currentPrice: number, unrealizedPnl: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('positions')
        .update({
          current_price: currentPrice,
          unrealized_pnl: unrealizedPnl,
          updated_at: new Date().toISOString()
        })
        .eq('id', positionId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating position PnL:', error)
    }
  }

  /**
   * Update position status when closed
   */
  private async updatePositionStatus(
    positionId: string, 
    status: string, 
    closePrice: number, 
    realizedPnl: number
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('positions')
        .update({
          status,
          current_price: closePrice,
          unrealized_pnl: realizedPnl,
          close_time: Date.now(),
          updated_at: new Date().toISOString()
        })
        .eq('id', positionId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating position status:', error)
    }
  }

  /**
   * Update trade record with final PnL
   */
  private async updateTradeRecord(orderId: string, pnl: number, status: string): Promise<void> {
    try {
      await tradingHistoryService.updateTrade(orderId, { pnl, status })
    } catch (error) {
      console.error('Error updating trade record:', error)
    }
  }

  /**
   * Get all positions for an agent
   */
  async getAgentPositions(agentId: string): Promise<Position[]> {
    const positions: Position[] = []
    
    for (const position of this.activePositions.values()) {
      if (position.agentId === agentId) {
        positions.push(position)
      }
    }
    
    return positions
  }

  /**
   * Get all positions for a wallet
   */
  async getWalletPositions(walletAddress: string): Promise<Position[]> {
    const positions: Position[] = []
    
    for (const position of this.activePositions.values()) {
      if (position.walletAddress === walletAddress) {
        positions.push(position)
      }
    }
    
    return positions
  }

  /**
   * Manually close a position
   */
  async manualClosePosition(positionId: string): Promise<boolean> {
    const position = this.activePositions.get(positionId)
    if (!position) {
      console.error(`Position ${positionId} not found`)
      return false
    }

    await this.closePosition(position, 'manual_close', position.currentPrice)
    return true
  }

  /**
   * Get position monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean
    activePositions: number
    totalPnl: number
  } {
    let totalPnl = 0
    for (const position of this.activePositions.values()) {
      totalPnl += position.unrealizedPnl
    }

    return {
      isMonitoring: this.isMonitoring,
      activePositions: this.activePositions.size,
      totalPnl
    }
  }
}

export const positionManager = new PositionManager() 