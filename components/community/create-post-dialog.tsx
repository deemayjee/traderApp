"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { ImageIcon, Link, AtSign, Hash } from "lucide-react"
import { generateUUID } from "@/lib/utils/uuid"

export interface Post {
  id: string
  author: {
    name: string
    avatar: string
  }
  content: string
  timestamp: Date
  likes: number
  comments: number
  isLiked: boolean
}

export function CreatePostDialog({ onPostCreated }: { onPostCreated: (post: Post) => void }) {
  const [content, setContent] = useState("")
  const { user } = useWalletAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!content.trim()) return

    setIsSubmitting(true)
    
    // Create a new post object
    const post: Post = {
      id: generateUUID(),
      author: {
        name: "Anonymous User",
        avatar: "/placeholder.svg",
      },
      content,
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      isLiked: false,
    }

    // Simulate API call delay
    setTimeout(() => {
      onPostCreated(post)
      setContent("")
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center gap-4 mb-6 border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <span className="text-gray-500">What's on your mind?</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share your thoughts with the community
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-4 mt-4">
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <Textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="What's on your mind?" 
            className="flex-1 resize-none h-32"
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button size="sm" variant="outline">
            <ImageIcon className="h-4 w-4 mr-2" />
            Image
          </Button>
          <Button size="sm" variant="outline">
            <Link className="h-4 w-4 mr-2" />
            Link
          </Button>
          <Button size="sm" variant="outline">
            <AtSign className="h-4 w-4 mr-2" />
            Mention
          </Button>
          <Button size="sm" variant="outline">
            <Hash className="h-4 w-4 mr-2" />
            Tag
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!content.trim() || isSubmitting}>
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
