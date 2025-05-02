"use client"

import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
import { useEffect } from "react"

export function WalletButton() {
  const { login, logout, authenticated, user, ready } = usePrivy()

  useEffect(() => {
    // Force wallet detection on mount
    if (typeof window !== 'undefined') {
      const event = new Event('load')
      window.dispatchEvent(event)
    }
  }, [])

  useEffect(() => {
    console.log("Privy state:", {
      ready,
      authenticated,
      user,
      hasWallet: !!user?.wallet,
      walletAddress: user?.wallet?.address
    })
  }, [ready, authenticated, user])

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="border-border hover:bg-muted flex items-center gap-2"
      onClick={() => {
        console.log("Connect button clicked")
        if (authenticated) {
          logout()
        } else {
          login()
        }
      }}
    >
      <Wallet size={16} />
      {authenticated ? (
        <span className="truncate max-w-[100px]">
          {user?.wallet?.address.slice(0, 4)}...{user?.wallet?.address.slice(-4)}
        </span>
      ) : (
        "Connect Wallet"
      )}
    </Button>
  )
} 