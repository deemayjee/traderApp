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
} from "lucide-react"
import { CreatePostDialog, type Post, type Comment } from "@/components/community/create-post-dialog"
import { PostComments } from "@/components/community/post-comments"
import { useAuth } from "@/components/auth/auth-context"
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

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [topTraders, setTopTraders] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("trending")
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [sharePostId, setSharePostId] = useState<string | null>(null)
  const { user } = useAuth()
  const { addNotification } = useNotifications()

  // Load initial data
  useEffect(() => {
    // In a real app, this would be an API call
    const initialPosts: Post[] = [
      {
        id: "1",
        author: "Alex Thompson",
        handle: "@alexthompson",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
        following: true,
        time: "2h ago",
        content:
          "Just increased my $BTC position by 15%. Technical indicators suggest we might see a breakout above $45K in the next 48 hours. Keep an eye on the 4h chart.",
        likes: 24,
        comments: 7,
        shares: 3,
        accuracy: 92,
        userLiked: false,
        commentsList: [
          {
            id: "c1",
            author: "Sarah Chen",
            handle: "@sarahtrader",
            avatar: "/placeholder.svg?height=40&width=40",
            content: "Great analysis! I've been watching the same pattern. What indicators are you using specifically?",
            time: "1h ago",
            likes: 3,
            userLiked: false,
          },
          {
            id: "c2",
            author: "Michael Rodriguez",
            handle: "@cryptomike",
            avatar: "/placeholder.svg?height=40&width=40",
            content: "I'm seeing the same thing. RSI is looking good too.",
            time: "30m ago",
            likes: 1,
            userLiked: false,
          },
        ],
      },
      {
        id: "2",
        author: "CryptoSage AI",
        handle: "@cryptosage_ai",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
        isAI: true,
        following: true,
        time: "4h ago",
        content:
          "ANALYSIS: $ETH showing bullish divergence on RSI. Volume profile indicates accumulation phase. Target: $2,550 with stop loss at $2,280. Confidence level: 78%",
        likes: 56,
        comments: 12,
        shares: 18,
        accuracy: 87,
        userLiked: false,
        commentsList: [],
      },
      {
        id: "3",
        author: "Sarah Chen",
        handle: "@sarahtrader",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
        following: false,
        time: "6h ago",
        content:
          "My SOL trade from last week is up 22%! The ecosystem growth continues to impress. Looking to take partial profits at $140 and let the rest ride.",
        likes: 56,
        comments: 12,
        shares: 18,
        accuracy: 87,
        userLiked: true,
        commentsList: [],
      },
      {
        id: "4",
        author: "Michael Rodriguez",
        handle: "@cryptomike",
        avatar: "/placeholder.svg?height=40&width=40",
        verified: false,
        following: true,
        time: "8h ago",
        content:
          "$AVAX showing strong momentum after the recent partnership announcement. Setting up for a potential run to $40. My entry was at $32.50 with stops at $30.",
        likes: 31,
        comments: 5,
        shares: 2,
        accuracy: 79,
        userLiked: false,
        commentsList: [],
      },
    ]

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

    setPosts(initialPosts)
    setTopTraders(initialTopTraders)
    setTopics(initialTopics)
  }, [])

  // Handle post creation
  const handlePostCreated = (newPost: Post) => {
    setPosts((prevPosts) => [newPost, ...prevPosts])
    addNotification({
      title: "Post Created",
      message: "Your post has been published to the community",
      type: "system",
    })
  }

  // Handle like/unlike post
  const handleLikePost = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const userLiked = !post.userLiked
          return {
            ...post,
            likes: userLiked ? post.likes + 1 : post.likes - 1,
            userLiked,
          }
        }
        return post
      }),
    )
  }

  // Handle follow/unfollow user
  const handleFollowUser = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const following = !post.following

          // Add notification when following a user
          if (following) {
            addNotification({
              title: `Following ${post.author}`,
              message: `You are now following ${post.author}. You'll receive updates on their posts.`,
              type: "system",
            })
          }

          return {
            ...post,
            following,
          }
        }
        return post
      }),
    )
  }

  // Handle follow/unfollow for top traders
  const handleFollowTrader = (traderHandle: string) => {
    setTopTraders((prevTraders) =>
      prevTraders.map((trader) => {
        if (trader.handle === traderHandle) {
          const following = !trader.following

          // Add notification when following a trader
          if (following) {
            addNotification({
              title: `Following ${trader.name}`,
              message: `You are now following ${trader.name}. You'll receive their trading signals.`,
              type: "system",
            })
          }

          return {
            ...trader,
            following,
            followers: following ? trader.followers + 1 : trader.followers - 1,
          }
        }
        return trader
      }),
    )
  }

  // Handle comment expansion
  const handleExpandComments = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId)
  }

  // Handle adding a comment
  const handleAddComment = (postId: string, comment: Comment) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const updatedCommentsList = [...(post.commentsList || []), comment]
          return {
            ...post,
            comments: post.comments + 1,
            commentsList: updatedCommentsList,
          }
        }
        return post
      }),
    )
  }

  // Handle liking a comment
  const handleLikeComment = (postId: string, commentId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId && post.commentsList) {
          const updatedComments = post.commentsList.map((comment) => {
            if (comment.id === commentId) {
              const userLiked = !comment.userLiked
              return {
                ...comment,
                likes: userLiked ? comment.likes + 1 : comment.likes - 1,
                userLiked,
              }
            }
            return comment
          })
          return {
            ...post,
            commentsList: updatedComments,
          }
        }
        return post
      }),
    )
  }

  // Handle repost
  const handleRepost = (postId: string) => {
    setPosts((prevPosts) => {
      const postToRepost = prevPosts.find((post) => post.id === postId)
      if (!postToRepost) return prevPosts

      // Update the original post's share count
      const updatedPosts = prevPosts.map((post) => (post.id === postId ? { ...post, shares: post.shares + 1 } : post))

      // Create a new post as a repost
      const repost: Post = {
        id: `repost-${Date.now()}`,
        author: user?.name || "Anonymous",
        handle: `@${user?.name?.toLowerCase().replace(/\s+/g, "") || "anonymous"}`,
        avatar: user?.avatar || "/placeholder.svg?height=40&width=40",
        verified: false,
        following: false,
        time: "Just now",
        content: `Reposted from ${postToRepost.author}: ${postToRepost.content}`,
        likes: 0,
        comments: 0,
        shares: 0,
        userLiked: false,
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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-sm text-gray-500">Connect with traders and share insights</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search community..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-64"
            />
          </div>
          <Button className="bg-black text-white hover:bg-gray-800" onClick={() => setIsCreatePostOpen(true)}>
            <MessageSquare size={16} className="mr-2" /> New Post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Feed</CardTitle>
                <Tabs defaultValue="trending" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-gray-100 border border-gray-200">
                    <TabsTrigger value="trending" className="data-[state=active]:bg-white">
                      Trending
                    </TabsTrigger>
                    <TabsTrigger value="following" className="data-[state=active]:bg-white">
                      Following
                    </TabsTrigger>
                    <TabsTrigger value="latest" className="data-[state=active]:bg-white">
                      Latest
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                <Button variant="outline" size="sm" className="border-gray-200 rounded-full">
                  All
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 rounded-full">
                  Bitcoin
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 rounded-full">
                  Ethereum
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 rounded-full">
                  Solana
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 rounded-full">
                  DeFi
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 rounded-full">
                  NFTs
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200 rounded-full">
                  Altcoins
                </Button>
              </div>

              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage src={post.avatar || "/placeholder.svg"} alt={post.author} />
                          <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center">
                                <p className="font-medium">{post.author}</p>
                                {post.verified && (
                                  <Badge variant="outline" className="ml-2 border-blue-200 text-blue-600 bg-blue-50">
                                    Verified
                                  </Badge>
                                )}
                                {post.isAI && (
                                  <Badge variant="outline" className="ml-2 border-gray-300 text-gray-600">
                                    <Robot size={12} className="mr-1" /> AI
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {post.handle} • {post.time}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {post.accuracy && (
                                <Badge className="mr-2 bg-gray-100 text-gray-600 border-gray-200">
                                  {post.accuracy}% Accuracy
                                </Badge>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className={`h-8 ${post.following ? "border-gray-300 bg-gray-100" : "border-gray-200"}`}
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
                          </div>
                          <p className="mt-2 text-gray-700">{post.content}</p>
                          <div className="mt-4 flex space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`${post.userLiked ? "text-blue-600" : "text-gray-500"} hover:text-gray-900`}
                              onClick={() => handleLikePost(post.id)}
                            >
                              <ThumbsUp size={16} className="mr-1" /> {post.likes}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-gray-900"
                              onClick={() => handleExpandComments(post.id)}
                            >
                              <MessageSquare size={16} className="mr-1" /> {post.comments}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-gray-900"
                              onClick={() => handleRepost(post.id)}
                            >
                              <Repeat2 size={16} className="mr-1" /> {post.shares}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
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
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-100">
                Load More
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Top Traders</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Filter size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-4">
                {topTraders.map((trader, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={trader.avatar || "/placeholder.svg"} alt={trader.name} />
                        <AvatarFallback>{trader.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium text-sm">{trader.name}</p>
                          {trader.verified && (
                            <Badge variant="outline" className="ml-2 border-blue-200 text-blue-600 bg-blue-50 text-xs">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{trader.handle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{trader.roi}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 text-xs mt-1 ${
                          trader.following ? "border-gray-300 bg-gray-100" : "border-gray-200"
                        }`}
                        onClick={() => handleFollowTrader(trader.handle)}
                      >
                        {trader.following ? (
                          <>
                            <UserCheck size={12} className="mr-1" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus size={12} className="mr-1" /> Follow
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                View All Traders
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Trending Topics</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                {topics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-6 bg-gray-300 rounded-full"></div>
                      <p className="font-medium text-sm">#{topic.name}</p>
                    </div>
                    <p className="text-xs text-gray-500">{topic.posts} posts</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
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
      <CreatePostDialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen} onPostCreated={handlePostCreated} />

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
                <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12s5.373 12 12 12 12-5.373 12-12zm-6.465-3.192c.37 0 .707.12.98.344.273.227.42.518.42.816 0 .3-.147.59-.42.812-.273.227-.61.344-.98.344-.37 0-.707-.117-.98-.344-.273-.223-.42-.512-.42-.812 0-.298.147-.59.42-.816.273-.227.61-.344.98-.344zm-7.07 0c.37 0 .707.12.98.344.273.227.42.518.42.816 0 .3-.147.59-.42.812-.273.227-.61.344-.98.344-.37 0-.707-.117-.98-.344-.273-.223-.42-.512-.42-.812 0-.298.147-.59.42-.816.273-.227.61-.344.98-.344zM12 20.5c-3.84 0-7.18-1.98-9.14-4.93l.16-.27c.54-.9 1.84-1.5 3.24-1.5.56 0 1.11.09 1.6.27.49.18.9.42 1.2.74.14.15.27.15.41 0 .3-.32.71-.56 1.2-.74.49-.18 1.03-.27 1.59-.27 1.4 0 2.7.6 3.24 1.5.06.09.11.18.16.27-1.96 2.95-5.3 4.93-9.14 4.93z" />
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
