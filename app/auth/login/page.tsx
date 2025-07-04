"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Wallet, Bot, ArrowLeft, Zap } from "lucide-react"
import { useWalletAuth } from "@/components/auth/wallet-context"

export default function Login() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useWalletAuth()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      console.log("Login button clicked, calling login function...")
      await login()
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err?.message || "Failed to connect wallet. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center animate-pulse">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(104,255,249,0.05),transparent_70%)]" />
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            PallyTraders
          </span>
        </Link>

        <Link href="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-md">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to PallyTraders</h1>
            <p className="text-muted-foreground">
              Connect your wallet to access autonomous trading on Hyperliquid
            </p>
          </div>

          {/* Login Card */}
          <Card className="trading-card border-border/50 backdrop-blur-sm">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-xl">Connect Your Wallet</CardTitle>
              <CardDescription>
                Secure access to your AI trading dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold glow-primary group"
                onClick={handleLogin}
                disabled={isLoading}
              >
                <Wallet className="h-5 w-5 mr-3" />
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Wallet
                    <Zap className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </Button>

              {/* Features */}
              <div className="grid grid-cols-1 gap-3 pt-4 border-t border-border/30">
                <div className="flex items-center text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary/60 rounded-full mr-3" />
                  AI-powered autonomous trading
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary/60 rounded-full mr-3" />
                  Advanced risk management
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary/60 rounded-full mr-3" />
                  Real-time performance tracking
                </div>
              </div>

              {/* Terms */}
              <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
                <p>
                  By connecting your wallet, you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-2">
              Need help connecting your wallet?
            </p>
            <Link href="/help" className="text-sm text-primary hover:underline">
              View wallet setup guide
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
