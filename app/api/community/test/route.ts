import { supabaseAdmin } from '@/lib/supabase/server-admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // This ensures the route is dynamic

export async function GET() {
  try {
    // Test 1: Check if community_posts table exists
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('community_posts')
      .select('id')
      .limit(1)
    
    if (tableError) {
      console.error('Error accessing community_posts table:', tableError)
      return NextResponse.json(
        { error: 'Failed to access community_posts table' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully connected to Supabase',
      data: tableData 
    })
  } catch (error) {
    console.error('Error testing Supabase connection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 