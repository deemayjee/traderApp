import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server-admin'
import type { Signal } from '@/lib/services/agent-supabase'

export async function POST(request: Request) {
  try {
    const signal: Signal = await request.json()
    console.log('Received signal to save:', signal)

    if (!supabaseAdmin) {
      console.error('Database client not available')
      return NextResponse.json(
        { error: 'Database client not available' },
        { status: 500 }
      )
    }

    // Map the signal to match the database schema
    const dbSignal = {
      id: signal.id,
      agent_id: signal.agentId,
      asset: signal.asset,
      type: signal.type,
      signal: signal.signal,
      price: signal.price,
      timestamp: new Date(signal.timestamp).toISOString(),
      result: signal.result || 'Pending',
      profit: signal.profit,
      confidence: signal.confidence,
      time: signal.time || "Just now"
    }

    const { data, error } = await supabaseAdmin
      .from('ai_signals')
      .upsert(dbSignal)
      .select()

    if (error) {
      console.error('Error saving signal:', error)
      return NextResponse.json(
        { error: 'Failed to save signal', details: error.message },
        { status: 500 }
      )
    }

    console.log('Successfully saved signal:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST /api/signals:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const limit = searchParams.get('limit')

    console.log('Fetching signals with params:', { agentId, limit })

    if (!supabaseAdmin) {
      console.error('Database client not available')
      return NextResponse.json(
        { error: 'Database client not available' },
        { status: 500 }
      )
    }

    let query = supabaseAdmin
      .from('ai_signals')
      .select('*')
      .order('timestamp', { ascending: false })

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching signals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch signals', details: error.message },
        { status: 500 }
      )
    }

    // Map the database response to match the Signal interface
    const mappedSignals = data?.map(signal => ({
      id: signal.id,
      agentId: signal.agent_id,
      asset: signal.asset,
      type: signal.type,
      signal: signal.signal,
      price: signal.price,
      timestamp: new Date(signal.timestamp).getTime(),
      result: signal.result,
      profit: signal.profit,
      confidence: signal.confidence,
      time: signal.time || "Just now"
    })) || []

    console.log('Successfully fetched signals:', mappedSignals.length)
    return NextResponse.json({ signals: mappedSignals })
  } catch (error) {
    console.error('Error in GET /api/signals:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 