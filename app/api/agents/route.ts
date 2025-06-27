import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server-admin'
import type { AIAgent } from '@/components/ai-agents/create-agent-dialog'

export async function POST(request: Request) {
  try {
    const { agent, wallet_address } = await request.json()

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not available' },
        { status: 500 }
      )
    }

    const { error } = await supabaseAdmin
      .from('ai_agents')
      .upsert({
        id: agent.id || undefined,
        name: agent.name,
        type: agent.type,
        description: agent.description,
        is_active: agent.active !== undefined ? agent.active : agent.isActive !== undefined ? agent.isActive : true,
        wallet_address: wallet_address,
        configuration: {
          custom: agent.custom,
          riskTolerance: agent.riskTolerance,
          focusAssets: agent.focusAssets,
          indicators: agent.indicators,
          maxPositionSize: agent.maxPositionSize,
          leverage: agent.leverage,
          tradingPairs: agent.tradingPairs,
          tradingEnabled: agent.tradingEnabled,
          strategy: agent.strategy,
        },
        performance_metrics: {
          accuracy: agent.accuracy,
          signals: agent.signals,
          lastSignal: agent.lastSignal,
          totalPnl: agent.totalPnl,
          winRate: agent.winRate,
          totalTrades: agent.totalTrades,
        },
      }, {
        onConflict: 'id'
      })

    if (error) {
      console.error('Error saving agent:', error)
      return NextResponse.json(
        { error: 'Failed to save agent' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get('wallet_address')
    const active = searchParams.get('active')

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not available' },
        { status: 500 }
      )
    }

    let query = supabaseAdmin
      .from('ai_agents')
      .select('*')

    if (wallet_address) {
      query = query.eq('wallet_address', wallet_address)
    }

    if (active === 'true') {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching agents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      )
    }

    return NextResponse.json({ agents: data })
  } catch (error) {
    console.error('Error in GET /api/agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('id')
    const wallet_address = searchParams.get('wallet_address')

    if (!agentId || !wallet_address) {
      return NextResponse.json(
        { error: 'Agent ID and wallet address are required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not available' },
        { status: 500 }
      )
    }

    const { error } = await supabaseAdmin
      .from('ai_agents')
      .delete()
      .eq('id', agentId)
      .eq('wallet_address', wallet_address)

    if (error) {
      console.error('Error deleting agent:', error)
      return NextResponse.json(
        { error: 'Failed to delete agent' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 