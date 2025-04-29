import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Toggle follow for a user
export async function POST(req: Request) {
  try {
    const { followId, followerAddress } = await req.json()
    
    if (!followId || !followerAddress) {
      return NextResponse.json(
        { error: 'Both wallet addresses are required' },
        { status: 400 }
      )
    }
    
    // Cannot follow yourself
    if (followId === followerAddress) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }
    
    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('community_follows')
      .select()
      .eq('follower_wallet', followerAddress)
      .eq('following_wallet', followId)
      .maybeSingle()
      
    if (checkError) {
      console.error('Error checking follow status:', checkError)
      return NextResponse.json(
        { error: checkError.message },
        { status: 500 }
      )
    }
    
    let result
    
    if (existingFollow) {
      // Unfollow: delete the existing follow
      const { error: unfollowError } = await supabase
        .from('community_follows')
        .delete()
        .eq('follower_wallet', followerAddress)
        .eq('following_wallet', followId)
        
      if (unfollowError) {
        console.error('Error unfollowing:', unfollowError)
        return NextResponse.json(
          { error: unfollowError.message },
          { status: 500 }
        )
      }
      
      result = { following: false }
    } else {
      // Follow: insert a new follow
      const { error: followError } = await supabase
        .from('community_follows')
        .insert({
          follower_wallet: followerAddress,
          following_wallet: followId,
          created_at: new Date().toISOString()
        })
        
      if (followError) {
        console.error('Error following user:', followError)
        return NextResponse.json(
          { error: followError.message },
          { status: 500 }
        )
      }
      
      result = { following: true }
    }
    
    // Get updated stats from the stats table
    const { data: stats, error: statsError } = await supabase
      .from('community_user_follow_stats')
      .select('followers_count, following_count')
      .eq('wallet_address', followId)
      .single()
      
    if (statsError) {
      console.error('Error getting follow stats:', statsError)
    }
    
    return NextResponse.json({
      ...result,
      followerCount: stats?.followers_count || 0,
      followingCount: stats?.following_count || 0
    })
  } catch (error) {
    console.error('Error in POST /api/community/follow:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// Get following/follower status and counts
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const walletAddress = searchParams.get('walletAddress')
    const currentUserAddress = searchParams.get('currentUserAddress')
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    // Get stats from the stats table
    const { data: stats, error: statsError } = await supabase
      .from('community_user_follow_stats')
      .select('followers_count, following_count')
      .eq('wallet_address', walletAddress)
      .single()
      
    if (statsError) {
      console.error('Error getting follow stats:', statsError)
      return NextResponse.json(
        { error: 'Error fetching follow statistics' },
        { status: 500 }
      )
    }

    // Check if current user follows this user
    let isFollowing = false
    if (currentUserAddress && currentUserAddress !== walletAddress) {
      const { data: followData, error: followError } = await supabase
        .from('community_follows')
        .select()
        .eq('follower_wallet', currentUserAddress)
        .eq('following_wallet', walletAddress)
        .maybeSingle()

      if (followError) {
        console.error('Error checking follow status:', followError)
      } else {
        isFollowing = !!followData
      }
    }
    
    return NextResponse.json({
      followerCount: stats?.followers_count || 0,
      followingCount: stats?.following_count || 0,
      isFollowing
    })
  } catch (error) {
    console.error('Error in GET /api/community/follow:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 