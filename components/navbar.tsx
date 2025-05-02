"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink, Twitter, Menu } from "lucide-react"
import { ThemeToggleSimple } from "@/components/theme-toggle"
import { WalletButton } from "@/components/wallet-button"

export function Navbar() {
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
          <WalletButton />
        </nav>

        <div className="md:hidden flex items-center space-x-4">
          <ThemeToggleSimple />
          <WalletButton />
          <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted">
            <Menu size={18} />
          </Button>
        </div>
      </div>
    </header>
  )
}
