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
import { PostComments } from "@/components/community/post-comments"
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
import { NewsFeed } from "@/components/copytrading/news-feed"
import Link from "next/link"

interface Comment {
  id: string
  content: string
  author: string
  avatar: string | null
  created_at: string
  likes: number
  liked: boolean
}

// Extend the Post type if needed
type ExtendedPost = {
  id: string;
  author: string;
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

  const { addNotification } = useNotifications()
  const { toast } = useToast()
  const router = useRouter()

  // Load posts
  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/community/posts?tab=${activeTab}`)
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
        author: post.author || "Anonymous",
        handle: post.author ? `@${post.author.toLowerCase().replace(/\s+/g, "")}` : "@anonymous",
        avatar: "/placeholder.svg",
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
      
      setPosts(processedPosts)
      
      // Load comments for all posts with comments
      processedPosts.forEach(async (post: ExtendedPost) => {
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
      const response = await fetch(`/api/community/comments?postId=${postId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      
      const commentsData = await response.json()
      
      // Process comments to ensure they have the right format
      const processedComments = commentsData.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        author: comment.author || "Anonymous",
        avatar: null,
        created_at: comment.createdAt || new Date().toISOString(),
        likes: comment.likes || 0,
        liked: false
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
    try {
      const response = await fetch(`/api/community/follow`)
      if (!response.ok) {
        throw new Error('Failed to fetch user stats')
      }
      
      const data = await response.json()
      setUserStats({
        followingCount: data.followingCount || 0,
        followersCount: data.followersCount || 0,
        postsCount: data.postsCount || 0
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  // Load initial data
  useEffect(() => {
    fetchPosts()
    fetchUserStats()
    
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

  // Refetch posts when tab changes
  useEffect(() => {
    fetchPosts()
  }, [activeTab])

  // Handle post creation
  const handlePostCreated = (newPost: Post) => {
    const extendedPost: ExtendedPost = {
      id: newPost.id,
      content: newPost.content,
      author: "Anonymous",
      handle: "@anonymous",
      avatar: "/placeholder.svg",
      time: "Just now",
      verified: false,
      following: false,
      likes: 0,
      comments: 0,
      shares: 0,
      userLiked: false,
      userRetweeted: false,
      commentsList: []
    }
    
    setPosts((prevPosts) => [extendedPost, ...prevPosts])
    setUserStats((prevStats) => ({
      ...prevStats,
      postsCount: prevStats.postsCount + 1
    }))
    
    addNotification({
      type: 'system',
      title: 'Post Created',
      message: 'Your post has been published successfully'
    })
  }

  // Handle like/unlike post
  const handleLikePost = async (postId: string) => {
    try {
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
        body: JSON.stringify({ postId }),
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
    }
  }

  // Handle follow/unfollow user
  const handleFollowUser = async (postId: string) => {
    try {
      // Find the post
      const post = posts.find(p => p.id === postId)
      if (!post) {
        toast({
          title: 'Error',
          description: 'Cannot find post',
          variant: 'destructive',
        })
        return
      }
      
      // Optimistically update UI
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
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
        body: JSON.stringify({ postId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to follow user')
      }
      
      const data = await response.json()
      
      // Update user stats
      setUserStats(prev => ({
        ...prev,
        followingCount: data.followingCount || prev.followingCount,
        followersCount: data.followerCount || prev.followersCount
      }))
      
      // Notification
      addNotification({
        title: post.following ? "Unfollowed" : "Now Following",
        message: post.following 
          ? `You unfollowed ${post.author}`
          : `You are now following ${post.author}`,
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
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { ...p, following: !p.following } 
            : p
        )
      )
    }
  }

  // Handle follow trader (from sidebar)
  const handleFollowTrader = async (traderHandle: string) => {
    try {
      // Find the trader
      const trader = topTraders.find(t => t.handle === traderHandle)
      if (!trader) {
        toast({
          title: 'Error',
          description: 'Cannot find trader',
          variant: 'destructive',
        })
        return
      }
      
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
        body: JSON.stringify({ traderHandle }),
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
          author: {
            username: "Anonymous",
            avatar: "/placeholder.svg"
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
              author: "Anonymous",
              avatar: "/placeholder.svg"
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
    try {
      const response = await fetch(`/api/community/comments/${commentId}/like`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to like comment')
      }
      
      const updatedComment = await response.json()
      
      // Update the comment in the posts state
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                commentsList: (p.commentsList || []).map((c) =>
                  c.id === commentId
                    ? {
                        ...c,
                        likes: updatedComment.likes,
                        liked: updatedComment.liked
                      }
                    : c
                ),
              }
            : p
        )
      )
    } catch (error) {
      console.error('Error liking comment:', error)
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

      // Create a new post as a repost
      const repost: ExtendedPost = {
        id: `repost-${Date.now()}`,
        author: "Anonymous",
        handle: "@anonymous",
        avatar: "/placeholder.svg",
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
    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE',
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
    try {
      const response = await fetch(`/api/community/comments?commentId=${commentId}`, {
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
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="text-gray-500 dark:text-gray-400">What's on your mind?</span>
              </div>

              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="bg-gray-50 dark:bg-card border-gray-200 dark:border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar>
                          <AvatarImage 
                            src={post.avatar} 
                            alt={post.author} 
                          />
                          <AvatarFallback>
                            {post.author.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div>
                                <Link 
                                  href={`/dashboard/profile/${post.id}`}
                                  className="hover:underline"
                                >
                                  <h3 className="font-semibold">
                                    {post.author}
                                  </h3>
                                  <p className="text-sm text-gray-500">{post.handle}</p>
                                </Link>
                              </div>
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
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                          <p className="mt-2 text-gray-700 dark:text-gray-300">{post.content}</p>
                          <div className="mt-4 flex space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`${post.userLiked ? "text-red-500 hover:text-red-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
                              onClick={() => handleLikePost(post.id)}
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
                              onLikeComment={(commentId) => handleLikeComment(post.id, commentId)}
                              onDeleteComment={(commentId) => handleDeleteComment(post.id, commentId)}
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
                    src="/placeholder.svg" 
                    alt="User" 
                  />
                  <AvatarFallback className="text-xl">
                    U
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="font-semibold text-lg mb-1">
                  Anonymous User
                </h3>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  @anonymous
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
