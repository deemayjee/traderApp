"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  ThumbsUp,
  Repeat2,
  Share2,
  Search,
  UserCheck,
  UserPlus,
  Filter,
  BotIcon as Robot,
  X,
  Trash2,
} from "lucide-react"
import { CreatePostDialog, type Post } from "@/components/community/create-post-dialog"
import { PostComments, type Comment } from "@/components/community/post-comments"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { useNotifications } from "@/contexts/notification-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { getRelativeTime } from "@/lib/utils/date-formatter"
import { useRouter } from "next/navigation"
import { SettingsService } from "@/lib/services/settings-service"
import { NewsFeed } from "@/components/copytrading/news-feed"
import Link from "next/link"

// Extend the Post type if needed
type ExtendedPost = {
  id: string;
  author: string | { username: string; email: string; avatar: string | null };
  handle: string;
  avatar: string;
  verified?: boolean;
  isAI?: boolean;
  following?: boolean;
  time: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  accuracy?: number;
  userLiked?: boolean;
  userRetweeted?: boolean;
  commentsList?: Comment[];
  userId?: string;
  walletAddress?: string;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<ExtendedPost[]>([])
  const [topTraders, setTopTraders] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("latest")
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [sharePostId, setSharePostId] = useState<string | null>(null)
  const [userStats, setUserStats] = useState({
    followingCount: 0,
    followersCount: 0,
    postsCount: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useWalletAuth()
  const { addNotification } = useNotifications()
  const { toast } = useToast()
  const router = useRouter()
  const settingsService = new SettingsService(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [isLiking, setIsLiking] = useState<string | null>(null)

  // Fetch profile data
  const fetchProfile = async () => {
    if (user?.address) {
      try {
        const profile = await settingsService.getProfile(user.address)
        if (profile) {
          setProfileData(profile)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }
  }

  // Load initial data
  useEffect(() => {
    if (user?.address) {
      fetchPosts()
      fetchUserStats()
      fetchProfile()
    }
    
    // Load initial top traders and topics
    const initialTopTraders = [
      {
        name: "Alex Thompson",
        handle: "@alexthompson",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
        roi: "+187.4%",
        followers: 1245,
        following: true,
      },
      {
        name: "Sarah Chen",
        handle: "@sarahtrader",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
        roi: "+142.8%",
        followers: 876,
        following: false,
      },
      {
        name: "Michael Rodriguez",
        handle: "@cryptomike",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: false,
        roi: "+98.3%",
        followers: 543,
        following: true,
      },
    ]

    const initialTopics = [
      { name: "Bitcoin", posts: 1245 },
      { name: "Ethereum", posts: 876 },
      { name: "DeFi", posts: 543 },
      { name: "NFTs", posts: 321 },
      { name: "Altcoins", posts: 210 },
    ]

    setTopTraders(initialTopTraders)
    setTopics(initialTopics)
  }, [])

  // Load posts
  const fetchPosts = async () => {
    setIsLoading(true)
    if (!user?.address) return
    
    try {
      const response = await fetch(`/api/community/posts?tab=${activeTab}&walletAddress=${user?.address || ""}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch posts')
      }
      
      const data = await response.json()
      
      // Process posts to ensure they have the right format
      const processedPosts = data.posts?.map((post: any) => ({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        tags: post.tags,
        isAiGenerated: post.isAiGenerated,
        accuracy: post.accuracyPercentage,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        walletAddress: post.walletAddress,
        author: post.author,
        handle: post.author?.username ? `@${post.author.username.toLowerCase().replace(/\s+/g, "")}` : null,
        avatar: post.author?.avatar || "/placeholder.svg",
        time: post.createdAt ? getRelativeTime(post.createdAt) : "Just now",
        verified: false,
        following: false,
        likes: post.engagement?.likes || post.likes || 0,
        comments: post.engagement?.comments || post.comments_count || 0,
        shares: post.engagement?.shares || post.shares || 0,
        userLiked: false,
        userRetweeted: false,
        commentsList: []
      })) || []
      
      // Get follow status for each post's author
      const postsWithFollowStatus = await Promise.all(
        processedPosts.map(async (post: any) => {
          if (!post.walletAddress || post.walletAddress === user.address) {
            return { ...post, following: false }
          }
          
          const followResponse = await fetch(
            `/api/community/follow?walletAddress=${post.walletAddress}&currentUserAddress=${user.address}`
          )
          if (!followResponse.ok) {
            return { ...post, following: false }
          }
          
          const followData = await followResponse.json()
          return { ...post, following: followData.isFollowing }
        })
      )
      
      setPosts(postsWithFollowStatus)
      
      // Load comments for all posts with comments
      postsWithFollowStatus.forEach(async (post: ExtendedPost) => {
        if (post.comments > 0) {
          await loadCommentsForPost(post.id)
        }
      })
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load posts. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to load comments for a specific post
  const loadCommentsForPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/comments?postId=${postId}&walletAddress=${user?.address || ""}`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      
      const commentsData = await response.json()
      
      // Process comments to ensure they have the right format
      const processedComments = commentsData.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        author: {
          address: comment.walletAddress,
          username: comment.author?.username || comment.username || comment.walletAddress?.slice(0, 6) + '...' + comment.walletAddress?.slice(-4),
          avatar: comment.author?.avatar_url || comment.avatar_url
        },
        likes: Array.isArray(comment.likes) ? comment.likes : [],
        createdAt: comment.createdAt || new Date().toISOString()
      }))
      
      // Update post with comments and correct count
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? { 
                ...p, 
                commentsList: processedComments,
                comments: processedComments.length
              }
            : p
        )
      )
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error)
    }
  }

  // Load user stats
  const fetchUserStats = async () => {
    if (!user?.address) return
    
    try {
      // Get follow stats using wallet address
      const response = await fetch(`/api/community/follow?walletAddress=${user.address}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user stats')
      }
      const data = await response.json()
      
      // Get post count using wallet address
      const postsResponse = await fetch(`/api/community/posts/count?walletAddress=${user.address}`)
      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        console.log('Posts count data:', postsData)
        setUserStats({
          followingCount: data.followingCount || 0,
          followersCount: data.followerCount || 0,
          postsCount: postsData.count || 0
        })
      } else {
        setUserStats({
          followingCount: data.followingCount || 0,
          followersCount: data.followerCount || 0,
          postsCount: 0
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  // Refetch posts when tab changes
  useEffect(() => {
    fetchPosts()
  }, [activeTab])

  // Refetch user stats when user changes
  useEffect(() => {
    if (user?.address) {
      fetchUserStats()
    }
  }, [user?.address])

  // Handle post creation
  const handlePostCreated = (newPost: Post) => {
    // Get author name - handle both string and object formats
    const authorName = typeof newPost.author === 'string' 
      ? newPost.author 
      : newPost.author?.username || 'Anonymous';
      
    // Convert Post to ExtendedPost
    const extendedPost: ExtendedPost = {
      id: newPost.id,
      author: newPost.author,
      handle: newPost.handle || `@${authorName.toLowerCase().replace(/\s+/g, "")}`,
      avatar: newPost.avatar,
      verified: false,
      following: false,
      time: newPost.time || "Just now",
      content: newPost.content,
      likes: newPost.likes,
      comments: newPost.comments,
      shares: newPost.shares || 0,
      userLiked: false,
      userRetweeted: false,
      commentsList: [],
      userId: newPost.userId,
      walletAddress: newPost.walletAddress,
    };
    
    setPosts((prevPosts) => [extendedPost, ...prevPosts]);
    
    // Fetch the latest post count
    fetchUserStats();
    
    addNotification({
      title: "Post Created",
      message: "Your post has been published to the community",
      type: "system",
    });
  }

  // Handle like/unlike post
  const handleLikePost = async (postId: string) => {
    if (!user?.address) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like posts",
        variant: "destructive",
      })
      return
    }
    
    // Prevent multiple like attempts
    if (isLiking === postId) return
    
    try {
      setIsLiking(postId)
      
      // Find the current post state
      const currentPost = posts.find(post => post.id === postId)
      if (!currentPost) return

      // Calculate the new like count
      const currentLikes = currentPost.likes || 0
      const newLikes = currentPost.userLiked ? currentLikes - 1 : currentLikes + 1

      // Optimistically update UI
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: newLikes,
                userLiked: !post.userLiked,
              }
            : post
        )
      )
      
      // Send API request
      const response = await fetch('/api/community/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId,
          walletAddress: user.address 
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to like post')
      }
      
      const data = await response.json()
      
      // Update with actual count from server
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: data.count || newLikes,
                userLiked: data.liked,
              }
            : post
        )
      )
    } catch (error) {
      console.error('Error liking post:', error)
      toast({
        title: 'Error',
        description: 'Failed to like post. Please try again.',
        variant: 'destructive',
      })
      
      // Revert optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: post.likes || 0,
                userLiked: !post.userLiked,
              }
            : post
        )
      )
    } finally {
      setIsLiking(null)
    }
  }

  // Handle follow/unfollow user
  const handleFollowUser = async (postId: string) => {
    if (!user?.address) {
      toast({
        title: "Authentication required",
        description: "Please connect your wallet to follow users",
        variant: "destructive",
      })
      return
    }
    
    // Find the post to get user wallet address
    const post = posts.find(p => p.id === postId)
    if (!post || !post.walletAddress) {
      toast({
        title: 'Error',
        description: 'Cannot find user to follow',
        variant: 'destructive',
      })
      return
    }
    
    try {
      // Optimistically update UI
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.walletAddress === post.walletAddress
            ? { ...p, following: !p.following }
            : p
        )
      )
      
      // Send API request
      const response = await fetch('/api/community/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          followId: post.walletAddress,
          followerAddress: user.address 
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to follow user')
      }
      
      const data = await response.json()
      
      // Update posts with new follow status
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.walletAddress === post.walletAddress
            ? { ...p, following: data.following }
            : p
        )
      )
      
      // Update user stats with both follower and following counts
      setUserStats(prev => ({
        ...prev,
        followingCount: data.userFollowingCount || prev.followingCount,
        followersCount: data.userFollowerCount || prev.followersCount
      }))
      
      // Notification
      addNotification({
        title: data.following ? "Now Following" : "Unfollowed",
        message: data.following 
          ? `You are now following ${typeof post.author === 'string' ? post.author : post.author?.username || 'Anonymous'}`
          : `You unfollowed ${typeof post.author === 'string' ? post.author : post.author?.username || 'Anonymous'}`,
        type: "system",
      })
    } catch (error) {
      console.error('Error following user:', error)
      toast({
        title: 'Error',
        description: 'Failed to follow user. Please try again.',
        variant: 'destructive',
      })
      
      // Revert optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.walletAddress === post.walletAddress
            ? { ...p, following: !p.following }
            : p
        )
      )
    }
  }

  // Handle follow trader (from sidebar)
  const handleFollowTrader = async (traderHandle: string) => {
    if (!user?.address) {
      toast({
        title: "Authentication required",
        description: "Please connect your wallet to follow traders",
        variant: "destructive",
      })
      return
    }
    
    // Find the trader
    const trader = topTraders.find(t => t.handle === traderHandle)
    if (!trader || !trader.walletAddress) {
      toast({
        title: 'Error',
        description: 'Cannot find trader to follow',
        variant: 'destructive',
      })
      return
    }
    
    try {
      // Optimistically update UI
      setTopTraders((prevTraders) =>
        prevTraders.map((t) =>
          t.handle === traderHandle
            ? { ...t, following: !t.following }
            : t
        )
      )
      
      // Send API request
      const response = await fetch('/api/community/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          followId: trader.walletAddress,
          followerAddress: user.address 
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to follow trader')
      }
      
      const data = await response.json()
      
      // Update user stats
      setUserStats(prev => ({
        ...prev,
        followingCount: data.followingCount || prev.followingCount
      }))
      
      // Notification
      addNotification({
        title: trader.following ? "Unfollowed" : "Now Following",
        message: trader.following 
          ? `You unfollowed ${trader.name}`
          : `You are now following ${trader.name}`,
        type: "system",
      })
    } catch (error) {
      console.error('Error following trader:', error)
      toast({
        title: 'Error',
        description: 'Failed to follow trader. Please try again.',
        variant: 'destructive',
      })
      
      // Revert optimistic update
      setTopTraders((prevTraders) =>
        prevTraders.map((t) =>
          t.handle === traderHandle
            ? { ...t, following: !t.following }
            : t
        )
      )
    }
  }

  // Handle expand comments
  const handleExpandComments = async (postId: string) => {
    // If already expanded, collapse
    if (expandedPostId === postId) {
      setExpandedPostId(null)
      return
    }
    
    setExpandedPostId(postId)
    
    // Always fetch comments when expanding
    await loadCommentsForPost(postId)
  }

  // Handle add comment
  const handleAddComment = async (postId: string, comment: Comment) => {
    if (!user?.address) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Send API request
      const response = await fetch('/api/community/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId, 
          content: comment.content,
          walletAddress: user.address,
          author: {
            address: user.address,
            username: profileData?.username || user.address.slice(0, 6) + '...' + user.address.slice(-4),
            avatar: profileData?.avatar_url
          }
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add comment')
      }
      
      const newComment = await response.json()
      
      // Update post with new comment
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            const updatedCommentsList = [...(post.commentsList || []), {
              ...newComment,
              author: {
                address: user.address,
                username: profileData?.username || user.address.slice(0, 6) + '...' + user.address.slice(-4),
                avatar: profileData?.avatar_url
              }
            }]
            return {
              ...post,
              commentsList: updatedCommentsList,
              comments: updatedCommentsList.length
            }
          }
          return post
        })
      )
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Handle like comment
  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!user?.address) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like comments",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Find the post and comment
      const post = posts.find(p => p.id === postId)
      if (!post?.commentsList) return
      
      const comment = post.commentsList.find(c => c.id === commentId)
      if (!comment) return
      
      // Optimistically update UI
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id !== postId) return p
          
          const updatedComments = p.commentsList?.map(c => 
            c.id === commentId
              ? {
                  ...c,
                  likes: c.userLiked 
                    ? c.likes.filter(like => like !== user?.address)
                    : [...c.likes, user?.address].filter(Boolean),
                  userLiked: !c.userLiked,
                }
              : c
          ) || []
          
          return {
            ...p,
            commentsList: updatedComments
          }
        })
      )
      
      // Send API request
      const response = await fetch('/api/community/likes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          commentId,
          walletAddress: user.address
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to like comment')
      }
      
      const data = await response.json()
      
      // Update with actual count from server
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id !== postId) return p
          
          const updatedComments = p.commentsList?.map(c => 
            c.id === commentId
              ? {
                  ...c,
                  likes: data.count,
                  userLiked: data.liked,
                }
              : c
          ) || []
          
          return {
            ...p,
            commentsList: updatedComments
          }
        })
      )
    } catch (error) {
      console.error('Error liking comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to like comment. Please try again.',
        variant: 'destructive',
      })
      
      // Revert optimistic update (complex, so we'll just refetch comments)
      handleExpandComments(postId)
    }
  }

  // Handle repost
  const handleRepost = (postId: string) => {
    setPosts((prevPosts) => {
      const postToRepost = prevPosts.find((post) => post.id === postId)
      if (!postToRepost) return prevPosts

      // Update the original post's share count and retweet state
      const updatedPosts = prevPosts.map((post) => 
        post.id === postId 
          ? { 
              ...post, 
              shares: post.shares + 1,
              userRetweeted: !post.userRetweeted
            } 
          : post
      )

      // Get user display info with fallbacks
      const getDisplayName = () => {
        if (profileData?.username) return profileData.username;
        if (user?.name) return user.name;
        if (user?.address) {
          const shortAddress = `${user.address.substring(0, 4)}...${user.address.substring(user.address.length - 4)}`;
          return `User ${shortAddress}`;
        }
        return "Anonymous User";
      };
      
      const getDisplayHandle = () => {
        if (profileData?.username) return `@${profileData.username}`;
        if (user?.name) return `@${user.name.toLowerCase().replace(/\s+/g, "")}`;
        if (user?.address) return `@${user.address.substring(0, 8)}`;
        return "@anonymous";
      };
      
      const displayName = getDisplayName();
      const displayHandle = getDisplayHandle();
      const userAvatar = profileData?.avatar_url || user?.avatar || "/placeholder.svg?height=40&width=40";

      // Create a new post as a repost
      const repost: ExtendedPost = {
        id: `repost-${Date.now()}`,
        author: displayName,
        handle: displayHandle,
        avatar: userAvatar,
        verified: false,
        following: false,
        time: "Just now",
        content: `Reposted from ${postToRepost.author}: ${postToRepost.content}`,
        likes: 0,
        comments: 0,
        shares: 0,
        userLiked: false,
        userRetweeted: false,
        commentsList: [],
        userId: postToRepost.userId,
        walletAddress: postToRepost.walletAddress,
      }

      addNotification({
        title: "Post Reposted",
        message: `You reposted ${postToRepost.author}'s post to your followers`,
        type: "system",
      })

      return [repost, ...updatedPosts]
    })
  }

  // Handle share
  const handleShare = (postId: string) => {
    setSharePostId(postId)
    setShareDialogOpen(true)
  }

  // Handle share confirmation
  const handleShareConfirm = () => {
    if (sharePostId) {
      setPosts((prevPosts) => {
        return prevPosts.map((post) => (post.id === sharePostId ? { ...post, shares: post.shares + 1 } : post))
      })

      addNotification({
        title: "Post Shared",
        message: "The post has been shared successfully",
        type: "system",
      })
    }
    setShareDialogOpen(false)
    setSharePostId(null)
  }

  const handleDeletePost = async (postId: string) => {
    if (!user?.address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.address }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      setPosts(posts.filter(post => post.id !== postId))
      toast({
        title: "Post Deleted",
        description: "Your post has been deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete post',
        variant: "destructive"
      })
    }
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!user?.address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/community/comments?commentId=${commentId}&walletAddress=${user.address}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete comment')
      }

      // Update the UI by removing the deleted comment
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              commentsList: post.commentsList?.filter(comment => comment.id !== commentId) || [],
              comments: (post.commentsList?.filter(comment => comment.id !== commentId).length || 0)
            }
          }
          return post
        })
      )

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete comment',
        variant: "destructive"
      })
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-sm text-gray-500">Connect with traders and share insights</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search community..."
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-card border-gray-200 dark:border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Feed</CardTitle>
                <Tabs defaultValue="latest" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-gray-100 dark:bg-muted border border-gray-200 dark:border-gray-800">
                    <TabsTrigger value="latest" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card">
                      Latest
                    </TabsTrigger>
                    <TabsTrigger value="trending" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card">
                      Trending
                    </TabsTrigger>
                    <TabsTrigger value="following" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card">
                      Following
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-800 rounded-full">
                  All
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-800 rounded-full">
                  Bitcoin
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-800 rounded-full">
                  Ethereum
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-800 rounded-full">
                  Solana
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-800 rounded-full">
                  DeFi
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-800 rounded-full">
                  NFTs
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-800 rounded-full">
                  Altcoins
                </Button>
              </div>

              {/* Post creation trigger at the top */}
              <div 
                className="flex items-center gap-4 border border-gray-200 dark:border-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                onClick={() => setIsCreatePostOpen(true)}
              >
                {user ? (
                  <Avatar>
                    <AvatarImage 
                      src={profileData?.avatar_url || "/placeholder.svg"} 
                      alt={profileData?.username || "User"} 
                    />
                    <AvatarFallback className="text-xl">
                      {(profileData?.username || user?.address?.slice(0, 2) || 'A').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
                <span className="text-gray-500 dark:text-gray-400">What's on your mind?</span>
              </div>

              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="bg-gray-50 dark:bg-card border-gray-200 dark:border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar>
                          <AvatarImage 
                            src={typeof post.author === 'string' ? post.avatar : post.author.avatar || undefined} 
                            alt={typeof post.author === 'string' ? post.author : post.author.username} 
                          />
                          <AvatarFallback>
                            {typeof post.author === 'string' 
                              ? (post.author || '').charAt(0).toUpperCase() 
                              : (post.author?.username || '').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div>
                                <Link 
                                  href={`/dashboard/profile/${post.walletAddress}`}
                                  className="hover:underline"
                                >
                                  <h3 className="font-semibold">
                                    {typeof post.author === 'string' ? post.author : post.author.username}
                                  </h3>
                                  <p className="text-sm text-gray-500">{post.handle}</p>
                                </Link>
                              </div>
                              {post.walletAddress !== user?.address && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`${post.following ? "bg-muted" : ""}`}
                                  onClick={() => handleFollowUser(post.id)}
                                >
                                  {post.following ? (
                                    <>
                                      <UserCheck size={14} className="mr-1" /> Following
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus size={14} className="mr-1" /> Follow
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                            {post.walletAddress === user?.address && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                          <p className="mt-2 text-gray-700 dark:text-gray-300">{post.content}</p>
                          <div className="mt-4 flex space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`${post.userLiked ? "text-red-500 hover:text-red-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
                              onClick={() => handleLikePost(post.id)}
                              disabled={isLiking === post.id}
                            >
                              <ThumbsUp size={16} className={`mr-1 ${post.userLiked ? "fill-red-500" : ""}`} /> {Number(post.likes || 0)}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                              onClick={() => handleExpandComments(post.id)}
                            >
                              <MessageSquare size={16} className="mr-1" /> {Number(post.comments || 0)}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`${post.userRetweeted ? "text-red-500 hover:text-red-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
                              onClick={() => handleRepost(post.id)}
                            >
                              <Repeat2 size={16} className={`mr-1 ${post.userRetweeted ? "fill-red-500" : ""}`} /> {Number(post.shares || 0)}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                                  <Share2 size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleShare(post.id)}>Share via Link</DropdownMenuItem>
                                <DropdownMenuItem>Share to Twitter</DropdownMenuItem>
                                <DropdownMenuItem>Share to Telegram</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {expandedPostId === post.id && (
                            <PostComments
                              postId={post.id}
                              comments={post.commentsList || []}
                              onAddComment={handleAddComment}
                              onLikeComment={handleLikeComment}
                              onDeleteComment={handleDeleteComment}
                              currentUserAddress={user?.address}
                              profile={{
                                username: profileData?.username || '',
                                avatar_url: profileData?.avatar_url
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" className="w-full border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                Load More
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* User Profile Card */}
          <Card className="bg-white dark:bg-card border-gray-200 dark:border-border">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarImage 
                    src={profileData?.avatar_url || "/placeholder.svg"} 
                    alt={profileData?.username || user?.address?.slice(0, 6) || "User"} 
                  />
                  <AvatarFallback className="text-xl">
                    {(profileData?.username || user?.address?.slice(0, 2) || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="font-semibold text-lg mb-1">
                  {profileData?.username || (user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : "Anonymous User")}
                </h3>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {profileData?.username 
                    ? `@${profileData.username.toLowerCase().replace(/\s+/g, "")}` 
                    : (user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : "@anonymous")}
                </p>
                
                <div className="flex items-center justify-center w-full mb-4">
                  <div className="flex flex-col items-center px-4 border-r border-gray-200 dark:border-gray-700">
                    <span className="font-semibold">{userStats.followingCount.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Following</span>
                  </div>
                  <div className="flex flex-col items-center px-4 border-r border-gray-200 dark:border-gray-700">
                    <span className="font-semibold">{userStats.followersCount.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Followers</span>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <span className="font-semibold">{userStats.postsCount.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Posts</span>
                  </div>
                </div>
                
                <Button size="sm" variant="outline" className="w-full" onClick={() => router.push("/dashboard/settings?tab=profile")}>
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg"></CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <NewsFeed />
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card border-gray-200 dark:border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Be respectful and constructive in discussions</p>
                <p>• Do not share financial advice without proper disclaimers</p>
                <p>• No spam, scams, or promotional content</p>
                <p>• Respect others' privacy and personal information</p>
                <p>• Report harmful or suspicious activity</p>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4 text-xs">
                Read Full Guidelines
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Post Dialog */}
      <CreatePostDialog 
        open={isCreatePostOpen} 
        onOpenChange={setIsCreatePostOpen} 
        onPostCreated={handlePostCreated} 
      />

      {/* Share Dialog */}
      <AlertDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Post</AlertDialogTitle>
            <AlertDialogDescription>Choose how you want to share this post with others.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col space-y-3 py-4">
            <Button variant="outline" className="justify-start">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              Share to Twitter
            </Button>
            <Button variant="outline" className="justify-start">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12s5.373 12 12 12 12-5.373 12-12zm-6.465-3.192c.37 0 .707.12.98.344.273.227.42.518.42.816 0 .3-.147.59-.42.812-.273.227-.61.344-.98.344-.37 0-.707-.117-.98-.344-.273-.223-.42-.512-.42-.812 0-.298.147-.59.42-.816.273-.227.61-.344.98-.344zm-7.07 0c.37 0 .707.12.98.344.273.227.42.518.42.816 0 .3-.147.59-.42.812-.273.227-.61.344-.98.344-.37 0-.707-.117-.98-.344-.273-.223-.42-.512-.42-.812 0-.298.147-.59.42-.816.273-.227.61-.344.98-.344zM12 20.5c-3.84 0-7.18-1.98-9.14-4.93l.16-.27c.54-.9 1.84-1.5 3.24-1.5.56 0 1.11.09 1.6.27.49.18.9.42 1.2.74.14.15.27.15.41 0 .3-.32.71-.56 1.2-.74.49-.18 1.03-.27 1.59-.27 1.4 0 2.7.6 3.24 1.5.06.09.11.18.16.27-1.96 2.95-5.3 4.93-9.14 4.93-9.14 4.93z" />
              </svg>
              Share to Telegram
            </Button>
            <Button variant="outline" className="justify-start">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              Share via Email
            </Button>
            <Button variant="outline" className="justify-start">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" />
              </svg>
              Share to Facebook
            </Button>
            <div className="flex items-center border border-gray-200 rounded-md p-2 mt-2">
              <Input
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={`https://pallytraders.com/post/${sharePostId}`}
                readOnly
              />
              <Button variant="ghost" size="sm" className="h-8 px-2">
                Copy
              </Button>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <X size={14} className="mr-1" /> Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleShareConfirm}>
              <Share2 size={14} className="mr-1" /> Share
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
