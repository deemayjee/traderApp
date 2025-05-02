"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, LineChart, Bell, Users, Settings, Brain, Copy } from "lucide-react"

export function DashboardSidebar() {
  const pathname = usePathname()

  const menuItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Markets",
      href: "/dashboard/markets",
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      title: "Portfolio",
      href: "/dashboard/portfolio",
      icon: <LineChart className="h-5 w-5" />,
      description: "View your portfolio performance and holdings"
    },
    {
      title: "Signals & Alerts",
      href: "/dashboard/signals",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      title: "Community",
      href: "/dashboard/community",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Copy Trading",
      href: "/copytrading",
      icon: <Copy className="h-5 w-5" />,
    },
    {
      title: "AI Agents",
      href: "/ai-agents",
      icon: <Brain className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex flex-col h-screen border-r border-border bg-background">
      <div className="p-6">
        <Link href="/" className="flex items-center mb-8">
          <span className="text-xl font-bold tracking-tighter">
            Pally<span className="text-muted-foreground">Traders</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">User</p>
            <p className="text-xs text-muted-foreground">
              Welcome to PallyTraders
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                pathname === item.href ? "bg-muted text-foreground" : ""
              )}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
