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

    // Get following from community_follows table
    const { data: following, error: followingError } = await settingsService.getSupabase()
      .from('community_follows')
      .select('following_wallet')
      .eq('follower_wallet', walletAddress)

    if (followingError) {
      throw followingError
    }

    if (!following || following.length === 0) {
      return NextResponse.json({ following: [] })
    }

    // Get user profiles for all following users
    const followingWallets = following.map(f => f.following_wallet)
    const { data: profiles, error: profilesError } = await settingsService.getSupabase()
      .from('user_profiles')
      .select('wallet_address, username, avatar_url, bio')
      .in('wallet_address', followingWallets)

    if (profilesError) {
      throw profilesError
    }

    // Format the response with user display info
    const formattedFollowing = (profiles || []).map(profile => {
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

    return NextResponse.json({ following: formattedFollowing })
  } catch (error) {
    console.error('Error in GET /api/community/following:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 