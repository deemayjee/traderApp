import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')
    const currentUserAddress = searchParams.get('currentUserAddress')
    
    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('username, avatar_url, bio, wallet_address')
      .eq('wallet_address', address)
      .single()
    
    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }
    
    // Get follow stats
    const { data: stats, error: statsError } = await supabase
      .from('community_user_follow_stats')
      .select('followers_count, following_count, posts_count')
      .eq('wallet_address', address)
      .single()
    
    if (statsError) {
      console.error('Error fetching stats:', statsError)
    }
    
    // Check if current user follows this profile
    let isFollowing = false
    if (currentUserAddress && currentUserAddress !== address) {
      const { data: followData, error: followError } = await supabase
        .from('community_follows')
        .select()
        .eq('follower_wallet', currentUserAddress)
        .eq('following_wallet', address)
        .maybeSingle()
      
      if (followError) {
        console.error('Error checking follow status:', followError)
      } else {
        isFollowing = !!followData
      }
    }
    
    return NextResponse.json({
      ...profile,
      followers_count: stats?.followers_count || 0,
      following_count: stats?.following_count || 0,
      posts_count: stats?.posts_count || 0,
      is_following: isFollowing
    })
  } catch (error) {
    console.error('Error in GET /api/community/profile:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 