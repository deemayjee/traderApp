"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Wallet } from "lucide-react"
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <Card className="w-full max-w-md border-gray-200">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Connect Your Wallet</CardTitle>
              <CardDescription className="text-center">
                Connect your wallet to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center">
                <Button
                  className="font-bold py-2 px-6 rounded-full transition-all flex items-center gap-2"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  <Wallet className="h-5 w-5" />
                  {isLoading ? "Connecting..." : "Connect Wallet"}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500 mt-4">
                <p>By connecting your wallet, you agree to our Terms of Service and Privacy Policy</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
