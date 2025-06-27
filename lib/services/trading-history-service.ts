import { createClient } from '@supabase/supabase-js'

export interface TradeRecord {
  id?: string
  agentId: string
  walletAddress: string
  orderId: string
  symbol: string
  side: 'buy' | 'sell'
  size: number
  price: number
  executionPrice: number
  fee: number
  timestamp: number
  confidence?: number
  reason?: string
  pnl?: number
  status: 'open' | 'closed' | 'cancelled'
  createdAt?: string
  updatedAt?: string
}

export interface PositionHistory {
  id?: string
  walletAddress: string
  symbol: string
  size: number
  entryPrice: number
  currentPrice: number
  unrealizedPnl: number
  realizedPnl: number
  leverage: number
  side: 'long' | 'short'
  timestamp: number
  agentId?: string
  createdAt?: string
}

export interface AgentPerformanceSnapshot {
  id?: string
  agentId: string
  date: string
  totalPnl: number
  realizedPnl: number
  unrealizedPnl: number
  winRate: number
  totalTrades: number
  winningTrades: number
  avgTradeSize: number
  maxDrawdown: number
  sharpeRatio: number
  voltility: number
  createdAt?: string
}

class TradingHistoryService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Store trade record
  async recordTrade(trade: Omit<TradeRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<TradeRecord> {
    try {
      const response = await fetch('/api/trading-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record_trade',
          data: trade
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record trade')
      }

      // Return the trade record (API doesn't return the created record, so we'll return the input with a generated ID)
      return { ...trade, id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` } as TradeRecord
    } catch (error) {
      console.error('Error recording trade:', error)
      throw new Error('Failed to record trade')
    }
  }

  // Update trade status and PnL
  async updateTrade(orderId: string, updates: Partial<TradeRecord>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('trade_records')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('order_id', orderId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating trade:', error)
      throw new Error('Failed to update trade')
    }
  }

  // Get trades for an agent
  async getAgentTrades(
    agentId: string, 
    timeframe?: '1h' | '1d' | '7d' | '30d',
    limit?: number
  ): Promise<TradeRecord[]> {
    try {
      let query = this.supabase
        .from('trade_records')
        .select('*')
        .eq('agent_id', agentId)
        .order('timestamp', { ascending: false })

      if (timeframe) {
        const timeframMs = this.getTimeframeMs(timeframe)
        const cutoffTime = new Date(Date.now() - timeframMs).toISOString()
        query = query.gte('created_at', cutoffTime)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching agent trades:', error)
      return []
    }
  }

  // Store position update
  async recordPositionUpdate(position: Omit<PositionHistory, 'id' | 'createdAt'>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('position_history')
        .insert([position])

      if (error) throw error
    } catch (error) {
      console.error('Error recording position update:', error)
      // Don't throw - position updates are frequent and we don't want to break the app
    }
  }

  // Get position history
  async getPositionHistory(
    walletAddress: string,
    symbol?: string,
    timeframe?: '1h' | '1d' | '7d' | '30d'
  ): Promise<PositionHistory[]> {
    try {
      let query = this.supabase
        .from('position_history')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('timestamp', { ascending: false })

      if (symbol) {
        query = query.eq('symbol', symbol)
      }

      if (timeframe) {
        const timeframMs = this.getTimeframeMs(timeframe)
        const cutoffTime = new Date(Date.now() - timeframMs).toISOString()
        query = query.gte('created_at', cutoffTime)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching position history:', error)
      return []
    }
  }

  // Store daily agent performance snapshot
  async recordAgentPerformance(performance: Omit<AgentPerformanceSnapshot, 'id' | 'createdAt'>): Promise<void> {
    try {
      // Check if snapshot for this agent and date already exists
      const { data: existing } = await this.supabase
        .from('agent_performance_snapshots')
        .select('id')
        .eq('agent_id', performance.agentId)
        .eq('date', performance.date)
        .single()

      if (existing) {
        // Update existing snapshot
        const { error } = await this.supabase
          .from('agent_performance_snapshots')
          .update(performance)
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Insert new snapshot
        const { error } = await this.supabase
          .from('agent_performance_snapshots')
          .insert([performance])

        if (error) throw error
      }
    } catch (error) {
      console.error('Error recording agent performance:', error)
      // Don't throw - this is background tracking
    }
  }

  // Get agent performance history
  async getAgentPerformanceHistory(
    agentId: string,
    timeframe?: '7d' | '30d' | '90d'
  ): Promise<AgentPerformanceSnapshot[]> {
    try {
      let query = this.supabase
        .from('agent_performance_snapshots')
        .select('*')
        .eq('agent_id', agentId)
        .order('date', { ascending: false })

      if (timeframe) {
        const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]
        query = query.gte('date', cutoffDate)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching agent performance history:', error)
      return []
    }
  }

  // Calculate comprehensive PnL for an agent
  async calculateAgentPnL(agentId: string, timeframe?: '1h' | '1d' | '7d' | '30d'): Promise<{
    totalPnl: number
    realizedPnl: number
    unrealizedPnl: number
    winRate: number
    totalTrades: number
    dailyPnl: number[]
    trades: TradeRecord[]
  }> {
    try {
      const trades = await this.getAgentTrades(agentId, timeframe)
      
      let realizedPnl = 0
      let unrealizedPnl = 0
      let winningTrades = 0

      // Calculate realized PnL from closed trades
      const closedTrades = trades.filter(trade => trade.status === 'closed')
      realizedPnl = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
      winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0).length

      // Calculate unrealized PnL from open trades (would need current market prices)
      const openTrades = trades.filter(trade => trade.status === 'open')
      // This would require calling market data service to get current prices
      
      const totalPnl = realizedPnl + unrealizedPnl
      const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0

      // Calculate daily PnL
      const dailyPnl = this.calculateDailyPnl(trades, timeframe)

      return {
        totalPnl,
        realizedPnl,
        unrealizedPnl,
        winRate,
        totalTrades: trades.length,
        dailyPnl,
        trades
      }
    } catch (error) {
      console.error('Error calculating agent PnL:', error)
      throw new Error('Failed to calculate agent PnL')
    }
  }

  private getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case '1h': return 60 * 60 * 1000
      case '1d': return 24 * 60 * 60 * 1000
      case '7d': return 7 * 24 * 60 * 60 * 1000
      case '30d': return 30 * 24 * 60 * 60 * 1000
      default: return 24 * 60 * 60 * 1000
    }
  }

  private calculateDailyPnl(trades: TradeRecord[], timeframe?: string): number[] {
    const timeframMs = timeframe ? this.getTimeframeMs(timeframe) : 7 * 24 * 60 * 60 * 1000
    const days = Math.ceil(timeframMs / (24 * 60 * 60 * 1000))
    const dailyPnl = new Array(days).fill(0)

    trades.forEach(trade => {
      if (trade.pnl && trade.status === 'closed') {
        const daysAgo = Math.floor((Date.now() - trade.timestamp) / (24 * 60 * 60 * 1000))
        if (daysAgo < days) {
          dailyPnl[days - 1 - daysAgo] += trade.pnl
        }
      }
    })

    return dailyPnl
  }

  // Clean up old data (optional - for performance)
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()

      // Clean up old position history (keep trade records for longer)
      await this.supabase
        .from('position_history')
        .delete()
        .lt('createdAt', cutoffDate)

      // Clean up old performance snapshots (older than 1 year)
      const yearCutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      await this.supabase
        .from('agent_performance_snapshots')
        .delete()
        .lt('createdAt', yearCutoff)

    } catch (error) {
      console.error('Error cleaning up old data:', error)
    }
  }
}

export const tradingHistoryService = new TradingHistoryService() 