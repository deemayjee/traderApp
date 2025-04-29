import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/auth'

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

    const supabase = createClient()

    // Check if the user has already liked the post
    const { data: existingLike } = await supabase
      .from('community_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('wallet_address', walletAddress)
      .single()

    let liked = false
    let count = 0

    if (existingLike) {
      // Unlike the post
      const { error: deleteError } = await supabase
        .from('community_post_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) throw deleteError

      // Get updated like count
      const { count: likeCount } = await supabase
        .from('community_post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

      count = likeCount || 0
    } else {
      // Like the post
      const { error: insertError } = await supabase
        .from('community_post_likes')
        .insert({
          post_id: postId,
          wallet_address: walletAddress
        })

      if (insertError) throw insertError

      // Get updated like count
      const { count: likeCount } = await supabase
        .from('community_post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

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
    
    const supabase = createClient()
    
    // Check if the user already liked this comment
    const { data: existingLike, error: checkError } = await supabase
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
      const { error: unlikeError } = await supabase
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
      const { error: likeError } = await supabase
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
    const { data: likeCount, error: countError } = await supabase
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