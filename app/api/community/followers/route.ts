import { NextResponse } from "next/server"
import { SettingsService } from "@/lib/services/settings-service"
import { getUserDisplayInfo } from '@/lib/utils/user-display'
import type { UserProfile } from "@/lib/types/settings"

interface ProfileData {
  wallet_address: string
  username: string | null
  avatar_url: string | null
  bio: string | null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const settingsService = new SettingsService(true) // Use server-side Supabase client

    // Get followers from community_follows table
    const { data: followers, error: followersError } = await settingsService.getSupabase()
      .from('community_follows')
      .select('follower_wallet')
      .eq('following_wallet', walletAddress)

    if (followersError) {
      throw followersError
    }

    if (!followers || followers.length === 0) {
      return NextResponse.json({ followers: [] })
    }

    // Get user profiles for all followers
    const followerWallets = followers.map(f => f.follower_wallet)
    const { data: profiles, error: profilesError } = await settingsService.getSupabase()
      .from('user_profiles')
      .select('wallet_address, username, avatar_url, bio')
      .in('wallet_address', followerWallets)

    if (profilesError) {
      throw profilesError
    }

    // Format the response with user display info
    const formattedFollowers = (profiles || []).map(profile => {
      const userInfo = getUserDisplayInfo({
        id: profile.wallet_address,
        user_id: profile.wallet_address,
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        timezone: 'UTC',
        public_profile: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserProfile, profile.wallet_address)
      
      return {
        ...profile,
        name: userInfo.name,
        handle: userInfo.handle,
        avatar: userInfo.avatar
      }
    })

    return NextResponse.json({ followers: formattedFollowers })
  } catch (error) {
    console.error('Error in GET /api/community/followers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 