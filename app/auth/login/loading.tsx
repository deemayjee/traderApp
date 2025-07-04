import { Bot } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <div className="text-sm text-muted-foreground">Loading PallyTraders...</div>
        <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
          <div className="w-full h-full bg-primary/60 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
