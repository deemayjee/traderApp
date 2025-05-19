import { supabaseAdmin } from '@/lib/supabase/server-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database client not available',
        details: 'Supabase admin client is not initialized'
      }, { status: 500 })
    }

    // Test the connection with a simple query to ai_signals table
    const { data, error } = await supabaseAdmin
      .from('ai_signals')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({ 
        error: 'Failed to connect to Supabase',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully connected to Supabase',
      tableExists: true,
      data 
    })
  } catch (error) {
    console.error('Error testing Supabase connection:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 