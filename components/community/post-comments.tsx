"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { generateUUID } from "@/lib/utils/uuid"
import type { Comment } from "./create-post-dialog"

interface PostCommentsProps {
  postId: string
  comments: Comment[]
  onAddComment: (postId: string, comment: Comment) => void
  onLikeComment: (postId: string, commentId: string) => void
}

export function PostComments({ postId, comments, onAddComment, onLikeComment }: PostCommentsProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      // In a real app, this would be an API call to add a comment
      await new Promise((resolve) => setTimeout(resolve, 300))

      const comment: Comment = {
        id: generateUUID(),
        author: user?.name || "Anonymous",
        handle: `@${user?.name?.toLowerCase().replace(/\s+/g, "") || "anonymous"}`,
        avatar: user?.avatar || "/placeholder.svg?height=40&width=40",
        content: newComment,
        time: "Just now",
        likes: 0,
        userLiked: false,
      }

      onAddComment(postId, comment)
      setNewComment("")
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatar || "/placeholder.svg?height=32&width=32"} alt={user?.name || "User"} />
          <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isSubmitting}
            className="mt-2 bg-black text-white hover:bg-gray-800"
            size="sm"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </div>

      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.avatar || "/placeholder.svg?height=32&width=32"} alt={comment.author} />
                <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <p className="font-medium text-sm">{comment.author}</p>
                  <span className="text-xs text-gray-500 ml-2">{comment.handle}</span>
                  <span className="text-xs text-gray-500 ml-2">• {comment.time}</span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-xs mt-1 p-0 h-auto ${comment.userLiked ? "text-blue-600" : "text-gray-500"}`}
                  onClick={() => onLikeComment(postId, comment.id)}
                >
                  <ThumbsUp size={12} className="mr-1" /> {comment.likes > 0 ? comment.likes : "Like"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
