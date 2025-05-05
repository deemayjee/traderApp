import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server-admin'

// Toggle like on a post
export async function POST(request: Request) {
  try {
    const { postId, walletAddress } = await request.json()
    
    if (!postId || !walletAddress) {
      return NextResponse.json(
        { error: 'Post ID and wallet address are required' },
        { status: 400 }
      )
    }

    // Check if the user has already liked the post
    const { data: existingLike, error: checkError } = await supabaseAdmin
      .from('community_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('wallet_address', walletAddress)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing like:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing like' },
        { status: 500 }
      )
    }

    let liked = false
    let count = 0

    if (existingLike) {
      // Unlike the post
      const { error: deleteError } = await supabaseAdmin
        .from('community_post_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error deleting like:', deleteError)
        return NextResponse.json(
          { error: 'Failed to unlike post' },
          { status: 500 }
        )
      }

      // Get updated like count
      const { count: likeCount, error: countError } = await supabaseAdmin
        .from('community_post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

      if (countError) {
        console.error('Error getting like count:', countError)
        return NextResponse.json(
          { error: 'Failed to get like count' },
          { status: 500 }
        )
      }

      count = likeCount || 0
    } else {
      // Like the post
      const { error: insertError } = await supabaseAdmin
        .from('community_post_likes')
        .insert({
          post_id: postId,
          wallet_address: walletAddress
        })

      if (insertError) {
        console.error('Error inserting like:', insertError)
        return NextResponse.json(
          { error: 'Failed to like post' },
          { status: 500 }
        )
      }

      // Get updated like count
      const { count: likeCount, error: countError } = await supabaseAdmin
        .from('community_post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

      if (countError) {
        console.error('Error getting like count:', countError)
        return NextResponse.json(
          { error: 'Failed to get like count' },
          { status: 500 }
        )
      }

      count = likeCount || 0
      liked = true
    }

    return NextResponse.json({ 
      success: true, 
      liked,
      count
    })
  } catch (error) {
    console.error('Error in likes API:', error)
    return NextResponse.json(
      { error: 'Failed to process like' },
      { status: 500 }
    )
  }
}

// Toggle like on a comment
export async function PUT(req: Request) {
  try {
    const data = await req.json()
    const walletAddress = data.walletAddress
    const { commentId } = data
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 401 }
      )
    }
    
    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      )
    }
    
    // Check if the user already liked this comment
    const { data: existingLike, error: checkError } = await supabaseAdmin
      .from('community_comment_likes')
      .select()
      .eq('wallet_address', walletAddress)
      .eq('comment_id', commentId)
      .maybeSingle()
      
    if (checkError) {
      console.error('Error checking comment like:', checkError)
      return NextResponse.json(
        { error: checkError.message },
        { status: 500 }
      )
    }
    
    let result
    
    if (existingLike) {
      // Unlike: delete the existing like
      const { error: unlikeError } = await supabaseAdmin
        .from('community_comment_likes')
        .delete()
        .eq('wallet_address', walletAddress)
        .eq('comment_id', commentId)
        
      if (unlikeError) {
        console.error('Error unliking comment:', unlikeError)
        return NextResponse.json(
          { error: unlikeError.message },
          { status: 500 }
        )
      }
      
      result = { liked: false }
    } else {
      // Like: insert a new like
      const { error: likeError } = await supabaseAdmin
        .from('community_comment_likes')
        .insert({
          wallet_address: walletAddress,
          comment_id: commentId,
          created_at: new Date().toISOString()
        })
        
      if (likeError) {
        console.error('Error liking comment:', likeError)
        return NextResponse.json(
          { error: likeError.message },
          { status: 500 }
        )
      }
      
      result = { liked: true }
    }
    
    // Get updated like count
    const { data: likeCount, error: countError } = await supabaseAdmin
      .from('community_comment_likes')
      .select('id', { count: 'exact' })
      .eq('comment_id', commentId)
      
    if (countError) {
      console.error('Error getting comment like count:', countError)
    }
    
    return NextResponse.json({
      ...result,
      count: likeCount?.length || 0
    })
  } catch (error) {
    console.error('Error in PUT /api/community/likes:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 