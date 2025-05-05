import { NextResponse } from "next/server"
import { SettingsService } from "@/lib/services/settings-service"
import { generateUUID } from '@/lib/utils/uuid'

interface User {
  wallet_address: string
  username: string | null
  email: string | null
  avatar_url: string | null
}

interface UserProfile {
  username: string | null
  avatar_url: string | null
  bio: string | null
}

interface Post {
  id: string
  content: string
  image_url: string | null
  tags: string[] | null
  is_ai_generated: boolean
  accuracy_percentage: number | null
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  updated_at: string
  wallet_address: string
  users: User[] | null
  user_profiles: UserProfile[] | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  wallet_address: string
  post_id: string
  users: User[] | null
  user_profiles: UserProfile[] | null
}

// Get posts with pagination, filtering, and sorting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'latest'
    const walletAddress = searchParams.get('walletAddress') || ''

    const settingsService = new SettingsService(true) // Use server-side Supabase client

    // Base query for posts
    let query = settingsService.getSupabase()
      .from('community_posts')
      .select(`
        id,
        content,
        image_url,
        tags,
        is_ai_generated,
        accuracy_percentage,
        likes_count,
        comments_count,
        shares_count,
        created_at,
        updated_at,
        wallet_address,
        users!community_posts_wallet_address_fkey (
          wallet_address,
          username,
          email,
          avatar_url
        )
      `)

    // Apply following filter if tab is 'following' and walletAddress is provided
    if (tab === 'following' && walletAddress) {
      const { data: followingUsers, error: followingError } = await settingsService.getSupabase()
        .from('community_follows')
        .select('following_wallet')
        .eq('follower_wallet', walletAddress)

      if (followingError) {
        throw followingError
      }

      const followingWallets = followingUsers?.map(user => user.following_wallet) || []
      query = query.in('wallet_address', followingWallets)
    }

    // Apply sorting based on tab
    switch (tab) {
      case 'latest':
        query = query.order('created_at', { ascending: false })
        break
      case 'popular':
        query = query.order('likes_count', { ascending: false })
        break
      case 'ai':
        query = query.eq('is_ai_generated', true)
          .order('created_at', { ascending: false })
        break
    }

    const { data: posts, error } = await query

    if (error) {
      throw error
    }

    // Fetch likes for all posts
    const postIds = posts.map(post => post.id)
    
    const { data: likes, error: likesError } = await settingsService.getSupabase()
      .from('community_post_likes')
      .select('post_id, wallet_address')
      .in('post_id', postIds)

    if (likesError) {
      throw likesError
    }

    // Fetch comments for all posts
    const { data: comments, error: commentsError } = await settingsService.getSupabase()
      .from('community_comments')
      .select(`
        id,
        content,
        created_at,
        wallet_address,
        post_id,
        users!community_comments_wallet_address_fkey (
          wallet_address,
          username,
          email,
          avatar_url
        )
      `)
      .in('post_id', postIds)

    if (commentsError) {
      throw commentsError
    }

    // Fetch user profiles for all wallet addresses
    const walletAddresses = posts.map(post => post.wallet_address)
    const { data: profiles, error: profilesError } = await settingsService.getSupabase()
      .from('user_profiles')
      .select('wallet_address, username, avatar_url, bio')
      .in('wallet_address', walletAddresses)
    if (profilesError) {
      throw profilesError
    }

    // Format the response
    const formattedPosts = (posts as unknown as Post[]).map(post => {
      // Find profile for this post
      const profile = profiles.find(p => p.wallet_address === post.wallet_address)
      const username = profile?.username || post.users?.[0]?.username
      const avatarUrl = profile?.avatar_url || post.users?.[0]?.avatar_url || '/placeholder.svg'
      const walletAddress = post.wallet_address

      return {
        id: post.id,
        content: post.content,
        imageUrl: post.image_url,
        tags: post.tags,
        isAiGenerated: post.is_ai_generated,
        accuracyPercentage: post.accuracy_percentage,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        walletAddress: walletAddress,
        author: {
          username: username || `User ${walletAddress.substring(0, 4)}...${walletAddress.substring(-4)}`,
          email: post.users?.[0]?.email || '',
          avatar: avatarUrl
        },
        handle: username 
          ? `@${username.toLowerCase().replace(/\s+/g, "")}` 
          : `@${walletAddress.substring(0, 8)}`,
        engagement: {
          likes: likes?.filter(like => like.post_id === post.id).length || 0,
          comments: comments?.filter(comment => comment.post_id === post.id).length || 0,
          shares: post.shares_count || 0
        }
      }
    })

    return NextResponse.json({ posts: formattedPosts })
  } catch (error) {
    console.error('Error in GET /api/community/posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new post
export async function POST(req: Request) {
  try {
    const settingsService = new SettingsService(true) // Use server-side Supabase client
    const body = await req.json()
    const { content, imageUrl, tags, isAiGenerated, accuracyPercentage, walletAddress } = body

    console.log("Post data:", body)
    
    // Get wallet address from the request
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 401 }
      )
    }
    
    const postData = {
      id: generateUUID(),
      wallet_address: walletAddress,
      content: content,
      image_url: imageUrl,
      tags: tags,
      is_ai_generated: isAiGenerated,
      accuracy_percentage: accuracyPercentage,
      created_at: new Date().toISOString(),
    }
    console.log("Inserting post data:", postData)
    
    const { data: post, error } = await settingsService.getSupabase()
      .from('community_posts')
      .insert(postData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating post:', error)
      console.error('Error details:', JSON.stringify(error))
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    console.log('Successfully created post:', post)
    
    // Get user info from both users and user_profiles tables
    const { data: userData, error: userError } = await settingsService.getSupabase()
      .from('users')
      .select('username, avatar_url')
      .eq('wallet_address', walletAddress)
      .single()
      
    if (userError && userError.code !== "PGRST116") {
      console.error('Error fetching user:', userError)
    }

    // Try to get additional profile data
    const { data: profileData, error: profileError } = await settingsService.getSupabase()
      .from('user_profiles')
      .select('username, avatar_url, bio')
      .eq('wallet_address', walletAddress)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.error('Error fetching profile:', profileError)
    }

    // Combine user and profile data, preferring profile data if available
    const username = profileData?.username || userData?.username
    const avatarUrl = profileData?.avatar_url || userData?.avatar_url || '/placeholder.svg'
    
    return NextResponse.json({
      ...post,
      author: {
        username: username || null,
        email: '',
        avatar: avatarUrl
      },
      avatar: avatarUrl,
      handle: username ? `@${username.toLowerCase().replace(/\s+/g, "")}` : null,
      likes: 0,
      comments: 0,
      shares: 0,
    })
  } catch (error) {
    console.error('Error in POST /api/community/posts:', error)
    console.error('Full error details:', JSON.stringify(error))
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 