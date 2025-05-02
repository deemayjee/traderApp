import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ThumbsUp, Repeat2, Share2, BotIcon as Robot } from "lucide-react"

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
    title: "Trading Signal",
    content: "BTC/USD: Long position opened at $45,000. Target: $48,000. Stop loss: $43,500.",
    author: "Alex Thompson",
    avatar: null,
    created_at: new Date().toISOString(),
    likes: 32,
    liked: false,
    comments: 8
  },
  {
    id: "2",
    title: "Market Analysis",
    content: "ETH showing strong momentum after recent network upgrade. Watch for resistance at $3,200.",
    author: "CryptoSage AI",
    avatar: null,
    created_at: new Date().toISOString(),
    likes: 45,
    liked: false,
    comments: 12
  },
  {
    id: "3",
    title: "Trading Update",
    content: "Closed SOL position at $118 for +15% profit. Looking for new entry around $105.",
    author: "Sarah Chen",
    avatar: null,
    created_at: new Date().toISOString(),
    likes: 28,
    liked: false,
    comments: 6
  }
]

export function TradingFeed() {
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Trading Feed</CardTitle>
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
                  <div className="flex items-center">
                    <p className="font-medium">{post.author}</p>
                    <span className="ml-2 text-xs text-gray-500">{post.created_at}</span>
                  </div>
                  <p className="mt-2 text-gray-700">{post.content}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                      <ThumbsUp size={16} className="mr-1" /> {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                      <MessageSquare size={16} className="mr-1" /> {post.comments}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-100">
          Load More
        </Button>
      </CardContent>
    </Card>
  )
}
