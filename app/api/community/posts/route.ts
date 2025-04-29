import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { cookies } from "next/headers"
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/auth'
import { generateUUID } from '@/lib/utils/uuid'

// Simplified auth function directly in this file
async function getAuthUser() {
  try {
    const cookieStore = cookies()
    const supabaseAuthCookie = cookieStore.get('sb-auth-token')?.value
    
    if (!supabaseAuthCookie) {
      return null
    }
    
    // Parse the token to get user id
    const token = JSON.parse(supabaseAuthCookie)
    if (!token?.user?.id) {
      return null
    }
    
    const walletAddress = token.user.id
    
    return { wallet: walletAddress }
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

// Get posts with pagination, filtering, and sorting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'latest'
    const walletAddress = searchParams.get('walletAddress') || ''

    const supabase = createClient()

    // Base query for posts
    let query = supabase
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

    // Apply sorting based on tab
    if (tab === 'trending') {
      // Sort by engagement score (likes + comments + shares)
      query = query.order('likes_count', { ascending: false })
                  .order('comments_count', { ascending: false })
                  .order('shares_count', { ascending: false })
    } else {
      // Default sorting by creation date
      query = query.order('created_at', { ascending: false })
    }

    // Apply following filter if tab is 'following' and walletAddress is provided
    if (tab === 'following' && walletAddress) {
      const { data: followingUsers, error: followingError } = await supabase
        .from('community_follows')
        .select('following_wallet')
        .eq('follower_wallet', walletAddress)

      if (followingError) {
        console.error('Error fetching following users:', followingError)
        return NextResponse.json({ error: 'Failed to fetch following users' }, { status: 500 })
      }

      const followingWallets = followingUsers?.map(user => user.following_wallet) || []
      query = query.in('wallet_address', followingWallets)
    }

    // Execute the query
    const { data: posts, error: postsError } = await query

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    // Fetch likes and comments for each post
    const postIds = posts.map(post => post.id)
    
    const { data: likes, error: likesError } = await supabase
      .from('community_post_likes')
      .select('post_id, wallet_address')
      .in('post_id', postIds)

    if (likesError) {
      console.error('Error fetching likes:', likesError)
      return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 })
    }

    const { data: comments, error: commentsError } = await supabase
      .from('community_comments')
      .select('post_id')
      .in('post_id', postIds)

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Format the response
    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      imageUrl: post.image_url,
      tags: post.tags,
      isAiGenerated: post.is_ai_generated,
      accuracyPercentage: post.accuracy_percentage,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      walletAddress: post.wallet_address,
      author: {
        username: post.users?.username || null,
        email: post.users?.email || '',
        avatar: post.users?.avatar_url || null
      },
      handle: post.users?.username ? `@${post.users.username.toLowerCase().replace(/\s+/g, "")}` : null,
      engagement: {
        likes: likes?.filter(like => like.post_id === post.id).length || 0,
        comments: comments?.filter(comment => comment.post_id === post.id).length || 0,
        shares: post.shares_count || 0
      }
    }))

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
    const data = await req.json()
    console.log("Post data:", data)
    
    // Get wallet address from the request
    const walletAddress = data.walletAddress
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 401 }
      )
    }

    const supabase = createClient()
    
    const postData = {
      id: generateUUID(),
      wallet_address: walletAddress,
      content: data.content,
      created_at: new Date().toISOString(),
    }
    console.log("Inserting post data:", postData)
    
    const { data: post, error } = await supabase
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
    
    // Get user info to return with the post
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('wallet_address', walletAddress)
      .single()
      
    if (userError) {
      console.error('Error fetching user:', userError)
    }
    
    return NextResponse.json({
      ...post,
      author: {
        username: userData?.username || null,
        email: userData?.email || '',
        avatar: userData?.avatar_url || null
      },
      avatar: userData?.avatar_url || '/placeholder.svg',
      handle: userData?.username ? `@${userData.username.toLowerCase().replace(/\s+/g, "")}` : null,
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