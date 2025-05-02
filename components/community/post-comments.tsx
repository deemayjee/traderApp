"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, Send, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from '@/components/ui/input'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
  id: string
  content: string
  author: string
  avatar: string | null
  created_at: string
  likes: number
  liked: boolean
}

interface PostCommentsProps {
  postId: string
  comments: Comment[]
  onAddComment: (postId: string, comment: Comment) => Promise<void>
  onLikeComment: (postId: string, commentId: string) => Promise<void>
  onDeleteComment: (postId: string, commentId: string) => Promise<void>
}

export function PostComments({
  postId,
  comments,
  onAddComment,
  onLikeComment,
  onDeleteComment,
}: PostCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const comment: Comment = {
        id: Date.now().toString(),
        content: newComment,
        author: 'Anonymous',
        avatar: null,
        created_at: new Date().toISOString(),
        likes: 0,
        liked: false
      }
      await onAddComment(postId, comment)
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    try {
      await onLikeComment(postId, commentId)
    } catch (error) {
      console.error('Error liking comment:', error)
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive"
      })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await onDeleteComment(postId, commentId)
      toast({
        title: "Comment Deleted",
        description: "Your comment has been deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          disabled={isSubmitting}
        />
        <Button
          size="icon"
          onClick={handleAddComment}
          disabled={isSubmitting || !newComment.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.avatar || undefined} />
              <AvatarFallback>{comment.author.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm">{comment.content}</p>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1"
                  onClick={() => handleLikeComment(comment.id)}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-xs">
                    {comment.likes} {comment.likes === 1 ? 'like' : 'likes'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
