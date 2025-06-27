"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Menu, Bot, Brain, TrendingUp, Activity, Zap } from "lucide-react"
import Link from "next/link"
import { useWalletAuth } from "@/components/auth/wallet-context"
import WalletConnectModal from "@/components/wallet/wallet-connect-modal"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const { user, logout } = useWalletAuth()

  const navigation = [
    { 
      name: "Trading Lab", 
      href: "/dashboard", 
      icon: TrendingUp,
      description: "Real-time trading dashboard"
    },
    { 
      name: "AI Agents", 
      href: "/ai-agents", 
      icon: Bot,
      description: "Create and manage your agents"
    },
    { 
      name: "Training", 
      href: "/ai-agents/train", 
      icon: Brain,
      description: "Train your AI models"
    },
    { 
      name: "Live Trading", 
      href: "/dashboard/live-trading", 
      icon: Activity,
      description: "Monitor live positions"
    },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center group-hover:glow-primary transition-all duration-300">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                HyperAgent
              </span>
              <span className="text-xs text-muted-foreground -mt-1">
                Autonomous Trading
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.name} href={item.href}>
                  <Button 
                    variant="ghost" 
                    className="h-auto px-3 py-2 flex items-center space-x-2 hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
                  >
                    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">{item.name}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="hidden sm:flex border-primary/30 text-primary bg-primary/10">
                  <Bot className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={logout}
                  className="border-border/50 hover:border-primary/50 hover:text-primary"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setShowWalletModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
              >
                <Bot className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}

            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background/95 backdrop-blur">
                <div className="mt-6">
                  <div className="flex flex-col space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="group"
                        >
                          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors">
                            <Icon className="w-5 h-5 text-primary" />
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground group-hover:text-primary">
                                {item.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>

                  {/* Mobile auth */}
                  <div className="mt-6 pt-6 border-t border-border">
                    {user ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-lg">
                          <Bot className="w-4 h-4 text-primary" />
                          <span className="text-sm text-primary font-medium">Wallet Connected</span>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={logout}
                          className="w-full"
                        >
                          Disconnect Wallet
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => {
                          setShowWalletModal(true)
                          setIsOpen(false)
                        }}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        Connect Wallet
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Wallet Connect Modal */}
      <WalletConnectModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </nav>
  )
}
