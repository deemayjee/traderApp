import { NextResponse } from 'next/server'
import { SettingsService } from '@/lib/services/settings-service'

export const dynamic = 'force-dynamic' // This ensures the route is dynamic

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const address = url.searchParams.get('address')
    const currentUserAddress = url.searchParams.get('currentUserAddress')
    
    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const settingsService = new SettingsService(true) // Use server-side Supabase client
    
    // Get user profile data
    const { data: profile, error: profileError } = await settingsService.getSupabase()
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
    const { data: stats, error: statsError } = await settingsService.getSupabase()
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
      const { data: followData, error: followError } = await settingsService.getSupabase()
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