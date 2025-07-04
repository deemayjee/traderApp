"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, LineChart, Wallet, TrendingUp, Brain, Zap, LogOut, Activity, Shield } from "lucide-react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { useUserProfile } from "@/contexts/user-profile-context"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, logout } = useWalletAuth()
  const { profile } = useUserProfile()

  const menuItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Wallet Setup",
      href: "/dashboard/wallet-setup",
      icon: <Shield className="h-5 w-5" />,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "AI Agents",
      href: "/ai-agents",
      icon: <Brain className="h-5 w-5" />,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Agent Training",
      href: "/ai-agents/train",
      icon: <Zap className="h-5 w-5" />,
      gradient: "from-amber-500 to-orange-500"
    },
    {
      title: "Live Trading",
      href: "/dashboard/live-trading",
      icon: <Activity className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      title: "Automation",
      href: "/ai-agents/automation",
      icon: <Zap className="h-5 w-5" />,
      gradient: "from-orange-500 to-red-500"
    },
  ]

  return (
    <div className="flex flex-col h-screen w-64 bg-background border-r border-border">
      {/* User Profile */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg?height=48&width=48"} alt={profile?.username || "Wallet"} />
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold">
                {(profile?.username?.charAt(0) || user?.address?.charAt(0) || "W").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Connected Wallet</p>
            <p className="text-xs text-muted-foreground font-mono">
              {user?.address 
                ? `${user.address.substring(0, 6)}...${user.address.substring(user.address.length - 4)}` 
                : 'Loading...'}
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => logout()}
          variant="outline"
          size="sm"
          className="w-full transition-all duration-200"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-foreground shadow-lg border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
                )}
                
                {/* Icon with gradient background when active */}
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                  isActive 
                    ? `bg-gradient-to-br ${item.gradient} shadow-lg` 
                    : "bg-muted/50 group-hover:bg-muted"
                )}>
                  <div className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.icon}
                  </div>
                </div>
                
                <span className="flex-1">{item.title}</span>
                
                {/* Hover effect */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-muted/0 to-transparent group-hover:via-muted/20 transition-all duration-200"></div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
