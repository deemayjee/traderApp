"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, Link, AtSign, Hash } from "lucide-react"
import { generateUUID } from "@/lib/utils/uuid"
import { useToast } from "@/components/ui/use-toast"

export interface Post {
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

interface CreatePostDialogProps {
  onPostCreated: (post: Post) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreatePostDialog({ onPostCreated, open, onOpenChange }: CreatePostDialogProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsSubmitting(true)
    
    try {
      const newPost: Post = {
        id: Date.now().toString(),
        title: "",
        content,
        author: "Anonymous",
        avatar: null,
        created_at: new Date().toISOString(),
        likes: 0,
        liked: false,
        comments: 0
      };
      
      onPostCreated(newPost);
      setContent("");
      
      toast({
        title: "Post created",
        description: "Your post has been published successfully",
      });
      
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: "An error occurred while creating your post",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const dialogProps = open !== undefined && onOpenChange !== undefined 
    ? { open, onOpenChange } 
    : {};
    
  const userAvatar = "/placeholder.svg";
  const userDisplayName = "Anonymous";
  const userInitial = "A";

  // Custom trigger element to be used when DialogTrigger is not needed
  const triggerElement = (
    <div className="flex items-center gap-4 mb-6 border border-gray-200 dark:border-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors dark:bg-background">
      <Avatar>
        <AvatarImage src={userAvatar} alt={userDisplayName} />
        <AvatarFallback>{userInitial}</AvatarFallback>
      </Avatar>
      <span className="text-gray-500 dark:text-gray-400">What's on your mind?</span>
    </div>
  );

  return (
    <Dialog {...dialogProps}>
      {/* Always include DialogTrigger in the DOM, but with conditional rendering of its content */}
      {!open && dialogProps.open === undefined ? (
        <DialogTrigger asChild>
          {triggerElement}
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share your thoughts with the community
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-4 mt-4">
          <Avatar>
            <AvatarImage src={userAvatar} alt={userDisplayName} />
            <AvatarFallback>{userInitial}</AvatarFallback>
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
