"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink, Twitter, Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { NotificationCenter } from "@/components/notification-center"
import { ThemeToggleSimple } from "@/components/theme-toggle"
import { useUserProfile } from "@/contexts/user-profile-context"

export function Navbar() {
  const { user, isAuthenticated, logout } = useWalletAuth()
  const { profile } = useUserProfile()

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold tracking-tighter">
            Pally<span className="text-gray-500">Traders</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link
            href="https://github.com"
            target="_blank"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Github size={16} />
            GitHub
          </Link>
          <Link
            href="https://twitter.com"
            target="_blank"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Twitter size={16} />
            Twitter
          </Link>
          <Button variant="outline" size="sm" className="ml-4 border-border hover:bg-muted">
            Join Telegram <ExternalLink size={14} className="ml-1" />
          </Button>

          <ThemeToggleSimple />

          {isAuthenticated && <NotificationCenter />}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile?.avatar_url || "/placeholder.svg"}
                      alt={profile?.username || "Wallet"}
                    />
                    <AvatarFallback>
                      {profile?.username?.charAt(0)?.toUpperCase() || user?.address?.charAt(0)?.toUpperCase() || "W"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {profile?.username || "My Wallet"}
                </DropdownMenuLabel>
                <DropdownMenuItem className="text-xs opacity-50">
                  {user?.address ? `${user.address.substring(0, 4)}...${user.address.substring(user.address.length - 4)}` : 'Connected'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications">Notifications</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>Disconnect</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/auth/login">Connect Wallet</Link>
            </Button>
          )}
        </nav>

        <div className="md:hidden flex items-center space-x-4">
          <ThemeToggleSimple />
          
          {isAuthenticated && <NotificationCenter />}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile?.avatar_url || "/placeholder.svg"}
                      alt={profile?.username || "Wallet"}
                    />
                    <AvatarFallback>
                      {profile?.username?.charAt(0)?.toUpperCase() || user?.address?.charAt(0)?.toUpperCase() || "W"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-xs opacity-50">
                  {user?.address ? `${user.address.substring(0, 4)}...${user.address.substring(user.address.length - 4)}` : 'Connected'}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications">Notifications</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>Disconnect</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/auth/login">Connect Wallet</Link>
            </Button>
          )}
          <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted">
            <Menu size={18} />
          </Button>
        </div>
      </div>
    </header>
  )
}
