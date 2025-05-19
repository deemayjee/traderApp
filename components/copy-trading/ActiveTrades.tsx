import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReleaseTokensButton } from "./ReleaseTokensButton"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface CopyTrade {
  id: string
  token_symbol: string
  token_address: string
  ai_amount: number
  start_date: string
  end_date: string
  status: string
  entry_price: number
  ai_wallet_address: string
  pda_address: string
}

interface ActiveTradesProps {
  userWallet: string
}

export function ActiveTrades({ userWallet }: ActiveTradesProps) {
  const [trades, setTrades] = useState<CopyTrade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchTrades = async () => {
    try {
      const response = await fetch(`/api/copy-trading/active?userWallet=${userWallet}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trades')
      }

      setTrades(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch active trades",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades()
  }, [userWallet])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No active copy trades found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {trades.map((trade) => (
        <Card key={trade.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{trade.token_symbol}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {trade.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Amount</div>
                <div className="text-right">{trade.ai_amount} {trade.token_symbol}</div>
                
                <div className="text-muted-foreground">Entry Price</div>
                <div className="text-right">${trade.entry_price.toFixed(6)}</div>
                
                <div className="text-muted-foreground">Start Date</div>
                <div className="text-right">
                  {new Date(trade.start_date).toLocaleDateString()}
                </div>
                
                <div className="text-muted-foreground">End Date</div>
                <div className="text-right">
                  {new Date(trade.end_date).toLocaleDateString()}
                </div>
              </div>

              <ReleaseTokensButton
                userWallet={userWallet}
                copyTradeId={trade.id}
                endDate={trade.end_date}
                tokenSymbol={trade.token_symbol}
                amount={trade.ai_amount}
                onRelease={fetchTrades}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 