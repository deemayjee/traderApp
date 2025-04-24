import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, ThumbsUp, Repeat2, Share2, UserCheck, UserPlus } from "lucide-react"

export function CommunitySignals() {
  const posts = [
    {
      id: 1,
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
    },
    {
      id: 2,
      author: "Sarah Chen",
      handle: "@sarahtrader",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: true,
      following: false,
      time: "4h ago",
      content:
        "My SOL trade from last week is up 22%! The ecosystem growth continues to impress. Looking to take partial profits at $140 and let the rest ride.",
      likes: 56,
      comments: 12,
      shares: 18,
      accuracy: 87,
    },
    {
      id: 3,
      author: "Michael Rodriguez",
      handle: "@cryptomike",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: false,
      following: true,
      time: "6h ago",
      content:
        "$AVAX showing strong momentum after the recent partnership announcement. Setting up for a potential run to $40. My entry was at $32.50 with stops at $30.",
      likes: 31,
      comments: 5,
      shares: 2,
      accuracy: 79,
    },
  ]

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Community Signals</CardTitle>
          <Tabs defaultValue="trending">
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
      <CardContent className="space-y-4">
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
                      </div>
                      <p className="text-xs text-gray-500">
                        {post.handle} • {post.time}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Badge className="mr-2 bg-gray-100 text-gray-600 border-gray-200">
                        {post.accuracy}% Accuracy
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 ${post.following ? "border-gray-300 bg-gray-100" : "border-gray-200"}`}
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
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                      <ThumbsUp size={16} className="mr-1" /> {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                      <MessageSquare size={16} className="mr-1" /> {post.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                      <Repeat2 size={16} className="mr-1" /> {post.shares}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                      <Share2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-100">
          Load More
        </Button>
      </CardContent>
    </Card>
  )
}
