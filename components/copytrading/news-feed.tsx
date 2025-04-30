"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  published_on: number
  imageurl: string
  categories: string
  body: string
}

const CATEGORIES = [
  { id: "all", label: "All News" },
  { id: "BTC", label: "Bitcoin" },
  { id: "ETH", label: "Ethereum" },
  { id: "DEFI", label: "DeFi" },
  { id: "NFT", label: "NFTs" },
  { id: "REG", label: "Regulation" },
  { id: "TECH", label: "Technology" },
]

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [showAll, setShowAll] = useState(false)
  const INITIAL_DISPLAY_COUNT = 4

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${filter}`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch news')
        }
        
        const data = await response.json()
        setNews(data.Data)
        setError(null)
      } catch (err) {
        setError('Failed to load news. Please try again later.')
        console.error('Error fetching news:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [filter])

  const displayedNews = showAll ? news : news.slice(0, INITIAL_DISPLAY_COUNT)
  const currentCategory = CATEGORIES.find(cat => cat.id === filter)?.label || "All News"

  return (
    <Card className="border-gray-200 dark:border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold dark:text-white">Latest Crypto News</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-gray-200 dark:border-gray-700">
                <Filter size={14} className="mr-1" /> {currentCategory}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
              {CATEGORIES.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => setFilter(category.id)}
                  className={`dark:text-gray-200 ${filter === category.id ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                >
                  {category.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Loading news...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedNews.map((item) => (
              <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  {item.imageurl && (
                    <img
                      src={item.imageurl}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{item.body}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.source}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDistanceToNow(new Date(item.published_on * 1000))} ago
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 p-0"
                        onClick={() => window.open(item.url, '_blank')}
                      >
                        Read more <ExternalLink size={12} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {news.length > INITIAL_DISPLAY_COUNT && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp size={12} className="mr-1" /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} className="mr-1" /> Show More ({news.length - INITIAL_DISPLAY_COUNT} more)
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 