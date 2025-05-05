import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server-admin'

export const dynamic = 'force-dynamic' // This ensures the route is dynamic

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const walletAddress = url.searchParams.get('walletAddress')
    
    if (!userId && !walletAddress) {
      return NextResponse.json(
        { error: 'User ID or wallet address is required' },
        { status: 400 }
      )
    }
    
    // Try to find the wallet address if only userId is provided
    let userWalletAddress = walletAddress
    if (userId && !walletAddress) {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('wallet_address')
        .eq('id', userId)
        .single()
        
      if (userError) {
        console.error('Error fetching user:', userError)
        return NextResponse.json(
          { error: 'Failed to fetch user data' },
          { status: 500 }
        )
      }
      
      userWalletAddress = user?.wallet_address
    }
    
    if (!userWalletAddress) {
      return NextResponse.json(
        { error: 'No valid wallet address found' },
        { status: 400 }
      )
    }
    
    // Query posts by wallet_address
    const { data, error, count } = await supabaseAdmin
      .from('community_posts')
      .select('id', { count: 'exact' })
      .eq('wallet_address', userWalletAddress)
      
    if (error) {
      console.error('Error fetching post count:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Error in GET /api/community/posts/count:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 