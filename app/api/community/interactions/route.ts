import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"

// Simplified auth function
async function getAuthUser() {
  // In a real implementation, you would get the user from your auth system
  // For now, we'll return a mock user
  return { wallet: "0x1234567890abcdef" }
}

// Handle all community interactions
export async function POST(request: Request) {
  try {
    // Get user from auth
    const user = await getAuthUser()
    if (!user?.wallet) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    
    if (!body.action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    switch (body.action) {
      case 'like_post':
        return handleLikePost(user.wallet, body)
      case 'unlike_post':
        return handleUnlikePost(user.wallet, body)
      case 'comment':
        return handleAddComment(user.wallet, body)
      case 'like_comment':
        return handleLikeComment(user.wallet, body)
      case 'unlike_comment':
        return handleUnlikeComment(user.wallet, body)
      case 'follow_user':
        return handleFollowUser(user.wallet, body)
      case 'unfollow_user':
        return handleUnfollowUser(user.wallet, body)
      case 'follow_topic':
        return handleFollowTopic(user.wallet, body)
      case 'unfollow_topic':
        return handleUnfollowTopic(user.wallet, body)
      case 'share_post':
        return handleSharePost(user.wallet, body)
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in POST /api/community/interactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Like a post
async function handleLikePost(userWallet: string, body: any) {
  if (!body.post_id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
  }

  try {
    // Check if post exists
    const { data: postCheck } = await supabaseAdmin
      .from('community_posts')
      .select('id')
      .eq('id', body.post_id)
      .single()

    if (!postCheck) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if already liked
    const { data: existingLike } = await supabaseAdmin
      .from('community_post_likes')
      .select('id')
      .eq('post_id', body.post_id)
      .eq('user_wallet', userWallet)
      .single()

    if (existingLike) {
      return NextResponse.json({ 
        success: true, 
        message: "Post already liked",
        id: existingLike.id
      })
    }

    // Add like
    const { data, error } = await supabaseAdmin
      .from('community_post_likes')
      .insert({
        post_id: body.post_id,
        user_wallet: userWallet
      })
      .select()
      .single()

    if (error) {
      console.error("Error liking post:", error)
      return NextResponse.json({ error: "Failed to like post" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in handleLikePost:", error)
    return NextResponse.json({ error: "Failed to like post" }, { status: 500 })
  }
}

// Unlike a post
async function handleUnlikePost(userWallet: string, body: any) {
  if (!body.post_id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
  }

  try {
    // Delete the like
    const { error } = await supabaseAdmin
      .from('community_post_likes')
      .delete()
      .eq('post_id', body.post_id)
      .eq('user_wallet', userWallet)

    if (error) {
      console.error("Error unliking post:", error)
      return NextResponse.json({ error: "Failed to unlike post" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in handleUnlikePost:", error)
    return NextResponse.json({ error: "Failed to unlike post" }, { status: 500 })
  }
}

// Add a comment
async function handleAddComment(userWallet: string, body: any) {
  if (!body.post_id || !body.content) {
    return NextResponse.json({ error: "Post ID and content are required" }, { status: 400 })
  }

  try {
    // Check if post exists
    const { data: postCheck } = await supabaseAdmin
      .from('community_posts')
      .select('id')
      .eq('id', body.post_id)
      .single()

    if (!postCheck) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Add comment
    const { data, error } = await supabaseAdmin
      .from('community_comments')
      .insert({
        post_id: body.post_id,
        author_wallet: userWallet,
        content: body.content
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding comment:", error)
      return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
    }

    // Get user info for the comment
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select(`
        username,
        avatar_url
      `)
      .eq('wallet_address', userWallet)
      .single()

    // Format response with user data
    const commentWithUser = {
      ...data,
      author: userData?.username || 'Anonymous',
      avatar: userData?.avatar_url || '/placeholder.svg',
      handle: `@${userData?.username || userWallet.substring(0, 8)}`
    }

    return NextResponse.json({ success: true, data: commentWithUser })
  } catch (error) {
    console.error("Error in handleAddComment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}

// Like a comment
async function handleLikeComment(userWallet: string, body: any) {
  if (!body.comment_id) {
    return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
  }

  try {
    // Check if comment exists
    const { data: commentCheck } = await supabaseAdmin
      .from('community_comments')
      .select('id')
      .eq('id', body.comment_id)
      .single()

    if (!commentCheck) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if already liked
    const { data: existingLike } = await supabaseAdmin
      .from('community_comment_likes')
      .select('id')
      .eq('comment_id', body.comment_id)
      .eq('user_wallet', userWallet)
      .single()

    if (existingLike) {
      return NextResponse.json({ 
        success: true, 
        message: "Comment already liked",
        id: existingLike.id
      })
    }

    // Add like
    const { data, error } = await supabaseAdmin
      .from('community_comment_likes')
      .insert({
        comment_id: body.comment_id,
        user_wallet: userWallet
      })
      .select()
      .single()

    if (error) {
      console.error("Error liking comment:", error)
      return NextResponse.json({ error: "Failed to like comment" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in handleLikeComment:", error)
    return NextResponse.json({ error: "Failed to like comment" }, { status: 500 })
  }
}

// Unlike a comment
async function handleUnlikeComment(userWallet: string, body: any) {
  if (!body.comment_id) {
    return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
  }

  try {
    // Delete the like
    const { error } = await supabaseAdmin
      .from('community_comment_likes')
      .delete()
      .eq('comment_id', body.comment_id)
      .eq('user_wallet', userWallet)

    if (error) {
      console.error("Error unliking comment:", error)
      return NextResponse.json({ error: "Failed to unlike comment" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in handleUnlikeComment:", error)
    return NextResponse.json({ error: "Failed to unlike comment" }, { status: 500 })
  }
}

// Follow a user
async function handleFollowUser(userWallet: string, body: any) {
  if (!body.following_wallet) {
    return NextResponse.json({ error: "Following wallet is required" }, { status: 400 })
  }

  if (userWallet === body.following_wallet) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
  }

  try {
    // Check if already following
    const { data: existingFollow } = await supabaseAdmin
      .from('community_follows')
      .select('id')
      .eq('follower_wallet', userWallet)
      .eq('following_wallet', body.following_wallet)
      .single()

    if (existingFollow) {
      return NextResponse.json({ 
        success: true, 
        message: "Already following this user",
        id: existingFollow.id
      })
    }

    // Add follow
    const { data, error } = await supabaseAdmin
      .from('community_follows')
      .insert({
        follower_wallet: userWallet,
        following_wallet: body.following_wallet
      })
      .select()
      .single()

    if (error) {
      console.error("Error following user:", error)
      return NextResponse.json({ error: "Failed to follow user" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in handleFollowUser:", error)
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 })
  }
}

// Unfollow a user
async function handleUnfollowUser(userWallet: string, body: any) {
  if (!body.following_wallet) {
    return NextResponse.json({ error: "Following wallet is required" }, { status: 400 })
  }

  try {
    // Delete the follow
    const { error } = await supabaseAdmin
      .from('community_follows')
      .delete()
      .eq('follower_wallet', userWallet)
      .eq('following_wallet', body.following_wallet)

    if (error) {
      console.error("Error unfollowing user:", error)
      return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in handleUnfollowUser:", error)
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 })
  }
}

// Follow a topic
async function handleFollowTopic(userWallet: string, body: any) {
  if (!body.topic_id) {
    return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
  }

  try {
    // Check if topic exists
    const { data: topicCheck } = await supabaseAdmin
      .from('community_topics')
      .select('id')
      .eq('id', body.topic_id)
      .single()

    if (!topicCheck) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Check if already following
    const { data: existingFollow } = await supabaseAdmin
      .from('community_topic_follows')
      .select('id')
      .eq('user_wallet', userWallet)
      .eq('topic_id', body.topic_id)
      .single()

    if (existingFollow) {
      return NextResponse.json({ 
        success: true, 
        message: "Already following this topic",
        id: existingFollow.id
      })
    }

    // Add follow
    const { data, error } = await supabaseAdmin
      .from('community_topic_follows')
      .insert({
        user_wallet: userWallet,
        topic_id: body.topic_id
      })
      .select()
      .single()

    if (error) {
      console.error("Error following topic:", error)
      return NextResponse.json({ error: "Failed to follow topic" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in handleFollowTopic:", error)
    return NextResponse.json({ error: "Failed to follow topic" }, { status: 500 })
  }
}

// Unfollow a topic
async function handleUnfollowTopic(userWallet: string, body: any) {
  if (!body.topic_id) {
    return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
  }

  try {
    // Delete the follow
    const { error } = await supabaseAdmin
      .from('community_topic_follows')
      .delete()
      .eq('user_wallet', userWallet)
      .eq('topic_id', body.topic_id)

    if (error) {
      console.error("Error unfollowing topic:", error)
      return NextResponse.json({ error: "Failed to unfollow topic" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in handleUnfollowTopic:", error)
    return NextResponse.json({ error: "Failed to unfollow topic" }, { status: 500 })
  }
}

// Share a post
async function handleSharePost(userWallet: string, body: any) {
  if (!body.post_id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
  }

  if (!body.platform) {
    body.platform = 'internal' // Default to internal share if platform not specified
  }

  try {
    // Check if post exists
    const { data: postCheck } = await supabaseAdmin
      .from('community_posts')
      .select('id')
      .eq('id', body.post_id)
      .single()

    if (!postCheck) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Add share
    const { data, error } = await supabaseAdmin
      .from('community_shares')
      .insert({
        post_id: body.post_id,
        user_wallet: userWallet,
        platform: body.platform
      })
      .select()
      .single()

    if (error) {
      console.error("Error sharing post:", error)
      return NextResponse.json({ error: "Failed to share post" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in handleSharePost:", error)
    return NextResponse.json({ error: "Failed to share post" }, { status: 500 })
  }
} 