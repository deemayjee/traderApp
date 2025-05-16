import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  variant?: "default" | "fullscreen" | "inline"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Loading({ variant = "default", size = "md", className }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  const variantClasses = {
    default: "flex items-center justify-center p-4",
    fullscreen: "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm",
    inline: "inline-flex items-center justify-center"
  }

  return (
    <div className={cn(variantClasses[variant], className)}>
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
    </div>
  )
} 