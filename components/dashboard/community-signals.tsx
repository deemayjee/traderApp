import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, ThumbsUp, Repeat2, Share2, UserCheck, UserPlus } from "lucide-react"

interface Post {
  id: string
  title: string
  content: string
  author: string
  avatar: string | null
  created_at: string
  likes: number
  liked: boolean
  comments: number
}

const posts: Post[] = [
  {
    id: "1",
    title: "Market Analysis",
    content: "Bitcoin showing strong support at $45k level. RSI indicates potential breakout.",
    author: "Alex Thompson",
    avatar: null,
    created_at: new Date().toISOString(),
    likes: 24,
    liked: false,
    comments: 5
  },
  {
    id: "2",
    title: "Technical Analysis",
    content: "Ethereum forming a bullish pattern on the 4H chart. Watch for a potential move above $3k.",
    author: "Sarah Chen",
    avatar: null,
    created_at: new Date().toISOString(),
    likes: 18,
    liked: false,
    comments: 3
  },
  {
    id: "3",
    title: "Market Update",
    content: "DeFi tokens showing strength as TVL reaches new highs. Keep an eye on AAVE and UNI.",
    author: "Michael Rodriguez",
    avatar: null,
    created_at: new Date().toISOString(),
    likes: 15,
    liked: false,
    comments: 2
  }
]

export function CommunitySignals() {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Community Signals</CardTitle>
          <Tabs defaultValue="trending">
            <TabsList className="bg-muted border border-border">
              <TabsTrigger value="trending" className="data-[state=active]:bg-background">
                Trending
              </TabsTrigger>
              <TabsTrigger value="following" className="data-[state=active]:bg-background">
                Following
              </TabsTrigger>
              <TabsTrigger value="latest" className="data-[state=active]:bg-background">
                Latest
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="bg-card border-border">
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
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {post.author} • {new Date(post.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Badge className="mr-2 bg-muted text-muted-foreground border-border">
                        {Math.floor(Math.random() * 100)}% Accuracy
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 ${post.liked ? "border-border bg-muted" : "border-border"}`}
                      >
                        {post.liked ? (
                          <>
                            <UserCheck size={14} className="mr-1" /> Liked
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} className="mr-1" /> Like
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-foreground">{post.content}</p>
                  <div className="mt-4 flex space-x-4">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <ThumbsUp size={16} className="mr-1" /> {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <MessageSquare size={16} className="mr-1" /> {post.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Repeat2 size={16} className="mr-1" /> {Math.floor(Math.random() * 10)}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Share2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" className="w-full border-border hover:bg-muted">
          Load More
        </Button>
      </CardContent>
    </Card>
  )
}
