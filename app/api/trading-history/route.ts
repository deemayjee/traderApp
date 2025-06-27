import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server-admin'

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json()

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not available' },
        { status: 500 }
      )
    }

    switch (action) {
      case 'record_trade':
        return await recordTrade(data)
      case 'update_trade_status':
        return await updateTradeStatus(data)
      case 'record_position_update':
        return await recordPositionUpdate(data)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in POST /api/trading-history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const walletAddress = searchParams.get('walletAddress')
    const timeframe = searchParams.get('timeframe') || '7d'
    const action = searchParams.get('action')

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not available' },
        { status: 500 }
      )
    }

    switch (action) {
      case 'agent_trades':
        return await getAgentTrades(agentId, timeframe)
      case 'agent_performance':
        return await getAgentPerformance(agentId, timeframe)
      case 'position_history':
        return await getPositionHistory(walletAddress, timeframe)
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in GET /api/trading-history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function recordTrade(tradeData: any) {
  const { error } = await supabaseAdmin!
    .from('trade_records')
    .insert({
      agent_id: tradeData.agentId,
      wallet_address: tradeData.walletAddress,
      order_id: tradeData.orderId,
      symbol: tradeData.symbol,
      side: tradeData.side,
      size: tradeData.size,
      price: tradeData.price,
      execution_price: tradeData.executionPrice,
      fee: tradeData.fee || 0,
      timestamp: tradeData.timestamp,
      confidence: tradeData.confidence,
      reason: tradeData.reason,
      status: tradeData.status || 'open'
    })

  if (error) {
    console.error('Error recording trade:', error)
    return NextResponse.json(
      { error: 'Failed to record trade' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

async function updateTradeStatus(updateData: any) {
  const { error } = await supabaseAdmin!
    .from('trade_records')
    .update({
      status: updateData.status,
      pnl: updateData.pnl,
      updated_at: new Date().toISOString()
    })
    .eq('order_id', updateData.orderId)

  if (error) {
    console.error('Error updating trade status:', error)
    return NextResponse.json(
      { error: 'Failed to update trade status' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

async function recordPositionUpdate(positionData: any) {
  const { error } = await supabaseAdmin!
    .from('position_history')
    .insert({
      wallet_address: positionData.walletAddress,
      symbol: positionData.symbol,
      size: positionData.size,
      entry_price: positionData.entryPrice,
      current_price: positionData.currentPrice,
      unrealized_pnl: positionData.unrealizedPnl,
      realized_pnl: positionData.realizedPnl,
      leverage: positionData.leverage,
      side: positionData.side,
      timestamp: positionData.timestamp,
      agent_id: positionData.agentId
    })

  if (error) {
    console.error('Error recording position update:', error)
    return NextResponse.json(
      { error: 'Failed to record position update' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

async function getAgentTrades(agentId: string | null, timeframe: string) {
  if (!agentId) {
    return NextResponse.json(
      { error: 'Agent ID is required' },
      { status: 400 }
    )
  }

  const timeframMs = getTimeframeMs(timeframe)
  const cutoffTime = new Date(Date.now() - timeframMs).toISOString()

  const { data, error } = await supabaseAdmin!
    .from('trade_records')
    .select('*')
    .eq('agent_id', agentId)
    .gte('created_at', cutoffTime)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching agent trades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent trades' },
      { status: 500 }
    )
  }

  return NextResponse.json({ trades: data || [] })
}

async function getAgentPerformance(agentId: string | null, timeframe: string) {
  if (!agentId) {
    return NextResponse.json(
      { error: 'Agent ID is required' },
      { status: 400 }
    )
  }

  const timeframMs = getTimeframeMs(timeframe)
  const cutoffTime = new Date(Date.now() - timeframMs).toISOString()

  const { data: trades, error } = await supabaseAdmin!
    .from('trade_records')
    .select('*')
    .eq('agent_id', agentId)
    .gte('created_at', cutoffTime)

  if (error) {
    console.error('Error fetching agent performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent performance' },
      { status: 500 }
    )
  }

  // Calculate performance metrics
  const totalTrades = trades?.length || 0
  const closedTrades = trades?.filter(t => t.status === 'closed') || []
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0)
  
  const totalPnl = trades?.reduce((sum, t) => sum + (t.pnl || 0), 0) || 0
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0
  const avgTradeSize = trades?.reduce((sum, t) => sum + (t.size * t.execution_price), 0) / totalTrades || 0

  return NextResponse.json({
    performance: {
      totalPnl,
      winRate,
      totalTrades,
      avgTradeSize,
      trades: trades || []
    }
  })
}

async function getPositionHistory(walletAddress: string | null, timeframe: string) {
  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    )
  }

  const timeframMs = getTimeframeMs(timeframe)
  const cutoffTime = new Date(Date.now() - timeframMs).toISOString()

  const { data, error } = await supabaseAdmin!
    .from('position_history')
    .select('*')
    .eq('wallet_address', walletAddress)
    .gte('created_at', cutoffTime)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching position history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch position history' },
      { status: 500 }
    )
  }

  return NextResponse.json({ positions: data || [] })
}

function getTimeframeMs(timeframe: string): number {
  switch (timeframe) {
    case '1h': return 60 * 60 * 1000
    case '1d': return 24 * 60 * 60 * 1000
    case '7d': return 7 * 24 * 60 * 60 * 1000
    case '30d': return 30 * 24 * 60 * 60 * 1000
    default: return 7 * 24 * 60 * 60 * 1000
  }
} 