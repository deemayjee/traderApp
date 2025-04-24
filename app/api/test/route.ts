import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test the connection with a simple query
    const { data, error } = await supabase.from('users').select('count')
    
    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({ error: 'Failed to connect to Supabase' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully connected to Supabase',
      data 
    })
  } catch (error) {
    console.error('Error testing Supabase connection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 