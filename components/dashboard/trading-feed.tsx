import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ThumbsUp, Repeat2, Share2, BotIcon as Robot } from "lucide-react"

export function TradingFeed() {
  const posts = [
    {
      id: 1,
      author: "Alex Thompson",
      isAI: false,
      avatar: "/placeholder.svg?height=40&width=40",
      time: "2h ago",
      content:
        "Just increased my $BTC position by 15%. Technical indicators suggest we might see a breakout above $45K in the next 48 hours. Keep an eye on the 4h chart.",
      likes: 24,
      comments: 7,
      shares: 3,
    },
    {
      id: 2,
      author: "Pally Traders",
      isAI: true,
      avatar: "/placeholder.svg?height=40&width=40",
      time: "4h ago",
      content:
        "ANALYSIS: $ETH showing bullish divergence on RSI. Volume profile indicates accumulation phase. Target: $2,550 with stop loss at $2,280. Confidence level: 78%",
      likes: 56,
      comments: 12,
      shares: 18,
    },
    {
      id: 3,
      author: "Sarah Chen",
      isAI: false,
      avatar: "/placeholder.svg?height=40&width=40",
      time: "6h ago",
      content:
        "My SOL trade from last week is up 22%! The ecosystem growth continues to impress. Looking to take partial profits at $105 and let the rest ride.",
      likes: 31,
      comments: 5,
      shares: 2,
    },
  ]

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
                    {post.isAI && (
                      <Badge variant="outline" className="ml-2 border-gray-300 text-gray-600">
                        <Robot size={12} className="mr-1" /> AI
                      </Badge>
                    )}
                    <span className="ml-2 text-xs text-gray-500">{post.time}</span>
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
        <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-100">
          Load More
        </Button>
      </CardContent>
    </Card>
  )
}
