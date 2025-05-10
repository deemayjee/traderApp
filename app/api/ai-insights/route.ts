import { NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

// Helper to round changePercent for consistency
function roundChangePercent(val: number): number {
  return Math.round(val * 100) / 100;
}

// GET /api/ai-insights?symbol=SOL&changePercent=12.5 or /api/ai-insights?limit=3
export async function GET(req: Request) {
  if (!req.url) {
    return NextResponse.json({ error: 'Missing request URL' }, { status: 400 })
  }
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get('symbol')
  const changePercentRaw = searchParams.get('changePercent')
  const limit = parseInt(searchParams.get('limit') || '3', 10)

  if (!symbol && !changePercentRaw) {
    // Fetch latest N insights
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ insights: data })
  }

  const changePercent = roundChangePercent(parseFloat(changePercentRaw || ''))
  if (!symbol || isNaN(changePercent)) {
    return NextResponse.json({ error: 'Missing symbol or changePercent' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('symbol', symbol)
    .eq('change_percent', changePercent)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ insight: null })
  }
  return NextResponse.json({ insight: data })
}

// POST /api/ai-insights
export async function POST(req: Request) {
  const body = await req.json()
  const { symbol, changePercent: changePercentRaw, insightText, confidence, userId } = body
  const changePercent = roundChangePercent(changePercentRaw)
  if (!symbol || typeof changePercent !== 'number' || !insightText || !confidence) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  // Check if exists
  const { data: existing } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('symbol', symbol)
    .eq('change_percent', changePercent)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()
  if (existing) {
    // Update the existing row with new text/confidence/timestamp
    const { data: updated, error: updateError } = await supabase
      .from('ai_insights')
      .update({
        insight_text: insightText,
        confidence,
        timestamp: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    return NextResponse.json({ insight: updated })
  }
  // Insert new
  const { data, error } = await supabase
    .from('ai_insights')
    .insert([{ symbol, change_percent: changePercent, insight_text: insightText, confidence, user_id: userId }])
    .select()
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ insight: data })
}
