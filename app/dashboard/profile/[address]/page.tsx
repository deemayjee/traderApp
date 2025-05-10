"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  UserCheck, 
  UserPlus, 
  Link as LinkIcon, 
  Twitter, 
  Globe, 
  MessageSquare,
  Calendar,
  Activity,
  Users,
  ThumbsUp,
  Share2
} from "lucide-react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { getUserDisplayInfo } from "@/lib/utils/user-display"
import type { UserProfile } from "@/lib/types/settings"

interface ExtendedUserProfile extends UserProfile {
  wallet_address: string
  followers_count: number
  following_count: number
  posts_count: number
  is_following?: boolean
  website?: string
  twitter?: string
  joined_date?: string
  badges?: string[]
}

interface Post {
  id: string
  content: string
  author: {
    username: string
    avatar?: string
  }
  handle: string
  createdAt: string
  likes: number
  comments: number
  shares: number
}

export default function ProfilePage() {
  const params = useParams()
  const { user } = useWalletAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState<ExtendedUserProfile[]>([])
  const [following, setFollowing] = useState<ExtendedUserProfile[]>([])
  const [activeTab, setActiveTab] = useState("posts")
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async () => {
    if (!params.address) return

    try {
      setIsLoading(true)
      
      // Fetch profile data
      const response = await fetch(`/api/community/profile?address=${params.address}`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      const profileData = await response.json()
      setProfile(profileData)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch user's posts
  const fetchPosts = async () => {
    if (!params.address) return
    try {
      const response = await fetch(`/api/community/posts?walletAddress=${params.address}`)
      if (!response.ok) throw new Error('Failed to fetch posts')
      const data = await response.json()
      // Filter posts to only those by the profile user
      const userPosts = (data.posts || []).filter((post: any) => post.walletAddress === params.address)
      setPosts(userPosts)
      // Update post count in profile
      setProfile(prev => prev ? { ...prev, posts_count: userPosts.length } : prev)
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  // Fetch followers
  const fetchFollowers = async () => {
    if (!params.address) return
    try {
      const response = await fetch(`/api/community/followers?walletAddress=${params.address}`)
      if (!response.ok) throw new Error('Failed to fetch followers')
      const data = await response.json()
      setFollowers(data.followers)
    } catch (error) {
      console.error('Error fetching followers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load followers. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Fetch following
  const fetchFollowing = async () => {
    if (!params.address) return
    try {
      const response = await fetch(`/api/community/following?walletAddress=${params.address}`)
      if (!response.ok) throw new Error('Failed to fetch following')
      const data = await response.json()
      setFollowing(data.following)
    } catch (error) {
      console.error('Error fetching following:', error)
      toast({
        title: 'Error',
        description: 'Failed to load following. Please try again.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchPosts()
  }, [params.address])

  useEffect(() => {
    if (activeTab === "followers") {
      fetchFollowers()
    } else if (activeTab === "following") {
      fetchFollowing()
    }
  }, [activeTab])

  const handleFollow = async () => {
    if (!user?.address || !profile) return

    try {
      const response = await fetch('/api/community/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followId: profile.wallet_address,
          followerAddress: user.address,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to follow user')
      }

      const data = await response.json()
      
      // Update profile with new follow status and counts
      setProfile(prev => {
        if (!prev) return prev
        return {
          ...prev,
          is_following: data.following,
          followers_count: data.followerCount,
          following_count: data.followingCount
        }
      })

      toast({
        title: data.following ? 'Following' : 'Unfollowed',
        description: data.following 
          ? `You are now following ${getUserDisplayInfo(profile, profile.wallet_address).name}`
          : `You unfollowed ${getUserDisplayInfo(profile, profile.wallet_address).name}`,
      })
    } catch (error) {
      console.error('Error following user:', error)
      toast({
        title: 'Error',
        description: 'Failed to follow user. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return <div>Profile not found</div>
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage 
                    src={profile.avatar_url || "/placeholder.svg"} 
                    alt={profile.username || "User"} 
                  />
                  <AvatarFallback>
                    {profile.username?.charAt(0)?.toUpperCase() || profile.wallet_address.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-2xl font-bold">
                      {getUserDisplayInfo(profile, profile.wallet_address).name}
                    </h2>
                    {profile.badges?.map((badge) => (
                      <Badge key={badge} variant="secondary">{badge}</Badge>
                    ))}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {getUserDisplayInfo(profile, profile.wallet_address).handle}
                  </p>
                  
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">{profile.bio}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Globe className="h-4 w-4" />
                      <span>Website</span>
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Twitter className="h-4 w-4" />
                      <span>@{profile.twitter}</span>
                    </a>
                  )}
                  {profile.joined_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {format(new Date(profile.joined_date), 'MMMM yyyy')}</span>
                    </span>
                  )}
                </div>

                {user?.address && user.address !== profile.wallet_address && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => window.location.href = `/messages/${profile.wallet_address}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      className={profile.is_following ? "bg-muted" : ""}
                      onClick={handleFollow}
                    >
                      {profile.is_following ? (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-semibold">{profile.posts_count}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold">{profile.followers_count}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold">{profile.following_count}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="posts" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Posts
                  </TabsTrigger>
                  <TabsTrigger value="followers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Followers
                  </TabsTrigger>
                  <TabsTrigger value="following" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Following
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="mt-6 space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="pt-6">
                        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {post.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-4 w-4" />
                            {post.shares}
                          </span>
                          <span className="ml-auto">
                            {post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy') : ''}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="followers" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followers.map((follower) => {
                      const userInfo = getUserDisplayInfo(follower, follower.wallet_address)
                      return (
                        <Card key={follower.wallet_address} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarImage src={follower.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {userInfo.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">
                                  {userInfo.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {userInfo.handle}
                                </p>
                                {follower.bio && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {follower.bio.length > 50 ? `${follower.bio.substring(0, 50)}...` : follower.bio}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="following" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {following.map((followed) => {
                      const userInfo = getUserDisplayInfo(followed, followed.wallet_address)
                      return (
                        <Card key={followed.wallet_address} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarImage src={followed.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {userInfo.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">
                                  {userInfo.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {userInfo.handle}
                                </p>
                                {followed.bio && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {followed.bio.length > 50 ? `${followed.bio.substring(0, 50)}...` : followed.bio}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 