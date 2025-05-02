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
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"

interface UserProfile {
  username?: string
  avatar_url?: string
  bio?: string
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
  created_at: string
  likes: number
  comments: number
  shares: number
}

export default function ProfilePage() {
  const params = useParams()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState<UserProfile[]>([])
  const [following, setFollowing] = useState<UserProfile[]>([])
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
      setPosts(data.posts)
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
    if (!profile) return

    try {
      const response = await fetch('/api/community/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followId: profile.wallet_address,
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
          is_following: !prev.is_following,
          followers_count: data.followerCount || prev.followers_count,
        }
      })

      toast({
        title: profile.is_following ? 'Unfollowed' : 'Following',
        description: profile.is_following 
          ? `You unfollowed ${profile.username || 'this user'}`
          : `You are now following ${profile.username || 'this user'}`,
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
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-lg text-gray-500">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>{profile.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.username || 'Anonymous'}</h1>
                {profile.badges?.map((badge) => (
                  <Badge key={badge} variant="secondary">
                    {badge}
                  </Badge>
                ))}
              </div>
              <p className="text-gray-500">{profile.wallet_address}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profile.bio && <p className="text-gray-700">{profile.bio}</p>}
            
            <div className="flex items-center gap-4">
              <Button
                variant={profile.is_following ? "outline" : "default"}
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
              
              {(profile.website || profile.twitter) && (
                <div className="flex items-center gap-2">
                  {profile.website && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.twitter && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {profile.joined_date ? format(new Date(profile.joined_date), 'MMM yyyy') : 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{profile.followers_count} followers</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{profile.following_count} following</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{profile.posts_count} posts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <p className="text-gray-700">{post.content}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.likes} likes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.comments} comments</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-4 w-4" />
                    <span>{post.shares} shares</span>
                  </div>
                  <div className="ml-auto">
                    {format(new Date(post.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="followers" className="space-y-4">
          {followers.map((follower) => (
            <Card key={follower.wallet_address}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={follower.avatar_url || undefined} />
                    <AvatarFallback>{follower.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{follower.username || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">{follower.wallet_address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          {following.map((followed) => (
            <Card key={followed.wallet_address}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={followed.avatar_url || undefined} />
                    <AvatarFallback>{followed.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{followed.username || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">{followed.wallet_address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
} 