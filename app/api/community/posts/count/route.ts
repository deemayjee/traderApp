import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    
    const supabase = createClient()
    
    // Try to find the wallet address if only userId is provided
    let userWalletAddress = walletAddress
    if (userId && !walletAddress) {
      const { data: user } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', userId)
        .single()
        
      userWalletAddress = user?.wallet_address
    }
    
    // Query posts by wallet_address
    const { data, error, count } = await supabase
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