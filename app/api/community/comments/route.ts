import { NextResponse } from 'next/server'
import { SettingsService } from '@/lib/services/settings-service'
import { generateUUID } from '@/lib/utils/uuid'
import { getRelativeTime } from '@/lib/utils/date-formatter'
import { Database } from '@/types/supabase'

type Comment = Database['public']['Tables']['community_comments']['Row']
type User = Database['public']['Tables']['users']['Row']

// Get comments for a post
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    
    const settingsService = new SettingsService(true) // Use server-side Supabase client
    
    // Query the comments table with user data
    const { data: comments, error } = await settingsService.getSupabase()
      .from('community_comments')
      .select(`
        *,
        users!community_comments_wallet_address_fkey (
          username,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!comments) {
      return NextResponse.json([])
    }

    // Process comments to include user info
    const processedComments = comments.map((comment: Comment & { users: User | null }) => {
      const username = comment.users?.username
      const avatarUrl = comment.users?.avatar_url || '/placeholder.svg'
      const walletAddress = comment.wallet_address
      
      return {
        id: comment.id,
        post_id: comment.post_id,
        content: comment.content,
        created_at: comment.created_at,
        time: getRelativeTime(comment.created_at),
        author: {
          username: username || `User ${walletAddress.substring(0, 4)}...${walletAddress.substring(-4)}`,
          address: walletAddress,
          avatar: avatarUrl
        },
        handle: username 
          ? `@${username.toLowerCase().replace(/\s+/g, "")}` 
          : `@${walletAddress.substring(0, 8)}`,
        avatar: avatarUrl,
        likes: 0,
        userLiked: false,
        walletAddress: walletAddress
      }
    })
    
    return NextResponse.json(processedComments)
  } catch (error) {
    console.error('Error in GET /api/community/comments:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// Create a new comment
export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { postId, content, walletAddress } = data
    
    if (!postId || !content || !walletAddress) {
      return NextResponse.json(
        { error: 'Post ID, content, and wallet address are required' },
        { status: 400 }
      )
    }
    
    const settingsService = new SettingsService(true) // Use server-side Supabase client
    
    // Get user info from users table
    const { data: user } = await settingsService.getSupabase()
      .from('users')
      .select('username, avatar_url')
      .eq('wallet_address', walletAddress)
      .single()

    // Create the comment
    const { data: comment, error } = await settingsService.getSupabase()
      .from('community_comments')
      .insert({
        post_id: postId,
        content,
        wallet_address: walletAddress,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Use username and avatar from user data
    const username = user?.username
    const avatarUrl = user?.avatar_url || '/placeholder.svg'
    
    return NextResponse.json({
      id: comment.id,
      post_id: comment.post_id,
      content: comment.content,
      created_at: comment.created_at,
      time: 'Just now',
      author: {
        username: username || `User ${walletAddress.substring(0, 4)}...${walletAddress.substring(-4)}`,
        address: walletAddress,
        avatar: avatarUrl
      },
      handle: username 
        ? `@${username.toLowerCase().replace(/\s+/g, "")}` 
        : `@${walletAddress.substring(0, 8)}`,
      avatar: avatarUrl,
      likes: 0,
      userLiked: false,
      walletAddress: comment.wallet_address
    })
  } catch (error) {
    console.error('Error in POST /api/community/comments:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// Delete a comment
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get('commentId')
    const walletAddress = searchParams.get('walletAddress')
    
    if (!commentId || !walletAddress) {
      return NextResponse.json(
        { error: 'Comment ID and wallet address are required' },
        { status: 400 }
      )
    }
    
    const settingsService = new SettingsService(true) // Use server-side Supabase client
    
    // First verify the comment exists and belongs to the user
    const { data: comment, error: fetchError } = await settingsService.getSupabase()
      .from('community_comments')
      .select('wallet_address')
      .eq('id', commentId)
      .single()
    
    if (fetchError) {
      console.error('Error fetching comment:', fetchError)
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }
    
    // Check if the user owns the comment
    if (comment.wallet_address !== walletAddress) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this comment' },
        { status: 403 }
      )
    }
    
    // Delete the comment
    const { error: deleteError } = await settingsService.getSupabase()
      .from('community_comments')
      .delete()
      .eq('id', commentId)
    
    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/community/comments:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 