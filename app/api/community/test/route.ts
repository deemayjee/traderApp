import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // This ensures the route is dynamic

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test 1: Check if community_posts table exists
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('id')
      .limit(1)
    
    if (postsError) {
      console.error('Error accessing community_posts table:', postsError)
      return NextResponse.json(
        { error: 'Failed to access community_posts table', details: postsError.message },
        { status: 500 }
      )
    }
    
    // Test 2: Check if users table exists and has the correct relationship
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('wallet_address')
      .limit(1)
    
    if (usersError) {
      console.error('Error accessing users table:', usersError)
      return NextResponse.json(
        { error: 'Failed to access users table', details: usersError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection and tables are accessible',
      postsCount: posts?.length || 0,
      usersCount: users?.length || 0
    })
  } catch (error) {
    console.error('Error in test endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 