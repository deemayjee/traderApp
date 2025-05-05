"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, Send, Trash2 } from "lucide-react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { useToast } from "@/components/ui/use-toast"
import { useUserProfile } from "@/contexts/user-profile-context"
import { getUserDisplayInfo } from "@/lib/utils/user-display"
import { Input } from '@/components/ui/input'
import { formatDistanceToNow } from 'date-fns'

export interface Comment {
  id: string
  content: string
  author: {
    address: string
    username: string
    avatar?: string
  }
  likes: string[]
  createdAt: string
  userLiked?: boolean
}

interface PostCommentsProps {
  postId: string
  comments: Comment[]
  onAddComment: (postId: string, comment: Comment) => Promise<void>
  onLikeComment: (postId: string, commentId: string) => Promise<void>
  onDeleteComment: (postId: string, commentId: string) => Promise<void>
  currentUserAddress?: string
  profile?: {
    username: string
    avatar_url?: string
  }
}

export function PostComments({
  postId,
  comments,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  currentUserAddress,
  profile
}: PostCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    if (!currentUserAddress) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const comment: Comment = {
        id: Date.now().toString(),
        content: newComment,
        author: {
          address: currentUserAddress,
          username: profile?.username || currentUserAddress.slice(0, 6) + '...' + currentUserAddress.slice(-4),
          avatar: profile?.avatar_url || undefined
        },
        likes: [],
        createdAt: new Date().toISOString()
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
    if (!currentUserAddress) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }
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
    if (!currentUserAddress) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }
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
              <AvatarImage src={comment.author?.avatar || undefined} />
              <AvatarFallback>
                {comment.author?.username?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.author.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
                {currentUserAddress === comment.author.address && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm">{comment.content}</p>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1"
                  onClick={() => handleLikeComment(comment.id)}
                >
                  <ThumbsUp
                    className={`h-4 w-4 ${
                      Array.isArray(comment.likes) && comment.likes.includes(currentUserAddress || '')
                        ? 'fill-blue-500 text-blue-500'
                        : ''
                    }`}
                  />
                  <span className="text-xs">
                    {Array.isArray(comment.likes) ? comment.likes.length : 0} {Array.isArray(comment.likes) && comment.likes.length === 1 ? 'like' : 'likes'}
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
