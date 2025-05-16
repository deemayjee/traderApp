"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useWalletAuth } from "@/components/auth/wallet-context"

interface CopyTrade {
  id: string
  user_wallet: string
  input_token: string
  output_token: string
  input_amount: number
  ai_amount: number
  status: string
  created_at: string
}

export function ActiveCopies() {
  const [activeCopies, setActiveCopies] = useState<CopyTrade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useWalletAuth()

  const fetchActiveCopies = async () => {
    if (!user?.wallet?.address) return

    try {
      const response = await fetch(`/api/copy-trading/active?wallet=${user.wallet.address}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch active copies")
      }

      setActiveCopies(data)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch active copies",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopCopy = async (copyId: string) => {
    try {
      const response = await fetch(`/api/copy-trading/stop/${copyId}`, {
        method: "POST"
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to stop copy trade")
      }

      toast({
        title: "Success",
        description: "Copy trade stopped successfully"
      })

      // Refresh the list
      fetchActiveCopies()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to stop copy trade",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchActiveCopies()
  }, [user?.wallet?.address])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Copy Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (activeCopies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Copy Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No active copy trades found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Copy Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeCopies.map((copy) => (
            <div
              key={copy.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {copy.input_token} → {copy.output_token}
                </p>
                <p className="text-sm text-muted-foreground">
                  Amount: {copy.input_amount} SOL
                </p>
                <p className="text-sm text-muted-foreground">
                  AI Copy: {copy.ai_amount} SOL
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {copy.status}
                </p>
                <p className="text-sm text-muted-foreground">
                  Started: {new Date(copy.created_at).toLocaleString()}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => handleStopCopy(copy.id)}
              >
                Stop Copy
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
