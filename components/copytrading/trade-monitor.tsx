import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';

interface Trade {
  id: string
  timestamp: number
  type: "buy" | "sell"
  token: string
  amount: number
  price: number
  status: "pending" | "completed" | "failed"
  profit?: number
}

interface TradeMonitorProps {
  traderAddress: string
  allocation: number
  maxSlippage: number
  stopLoss: number
}

// Initialize Solana connection
const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Get WebSocket URL from environment variable
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://your-websocket-server.com';

export function TradeMonitor({ traderAddress, allocation, maxSlippage, stopLoss }: TradeMonitorProps) {
  const { publicKey, signTransaction } = useWallet();
  const [trades, setTrades] = useState<Trade[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [performance, setPerformance] = useState({
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    totalProfit: 0,
    winRate: 0,
    averageProfit: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null)

  // WebSocket connection for real-time trade updates
  useEffect(() => {
    if (!isMonitoring) {
      setIsLoading(false)
      return
    }

    toast.info("Started monitoring trades for this trader.")
    setIsLoading(true)
    if (loadingTimeout.current) clearTimeout(loadingTimeout.current)
    loadingTimeout.current = setTimeout(() => {
      if (trades.length === 0) setIsLoading(false)
    }, 5000)

    let ws: WebSocket | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const reconnectDelay = 3000 // 3 seconds

    const connectWebSocket = () => {
      try {
        console.log("Attempting to connect to WebSocket:", WS_URL)
        
        ws = new WebSocket(WS_URL)

        ws.onopen = () => {
          console.log("WebSocket connected successfully")
          reconnectAttempts = 0 // Reset reconnect attempts on successful connection
          ws?.send(JSON.stringify({
            type: "subscribe",
            traderAddress,
          }))
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            console.log("Received WebSocket message:", message)

            // Handle different message types
            switch (message.type) {
              case 'subscribed':
                console.log("Successfully subscribed to trader:", message.traderAddress)
                break
              case 'trade':
                if (message.data) {
                  console.log("Received trade data:", message.data)
                  handleNewTrade(message.data)
                }
                break
              case 'error':
                console.error("WebSocket error message:", message.message)
                setError(message.message)
                toast.error(message.message)
                break
              default:
                console.log("Unknown message type:", message.type)
            }
            setIsLoading(false)
          } catch (error) {
            console.error("Error parsing WebSocket message:", error)
          }
        }

        ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          setError("Connection error. Retrying...")
          toast.error("WebSocket connection error. Retrying in 3s...")
        }

        ws.onclose = () => {
          console.log("WebSocket connection closed")
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)
            setTimeout(connectWebSocket, reconnectDelay)
          } else {
            console.error("Max reconnection attempts reached")
            setError("Failed to establish WebSocket connection after multiple attempts")
            toast.error("Failed to establish connection. Please try again later.")
            setIsMonitoring(false)
          }
        }
      } catch (error) {
        console.error("Error creating WebSocket connection:", error)
        setError("Failed to create WebSocket connection")
        toast.error("Failed to create connection. Please try again later.")
        setIsMonitoring(false)
      }
    }

    connectWebSocket()

    return () => {
      if (ws) {
        ws.close()
      }
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current)
      }
      toast.info("Stopped monitoring trades for this trader.")
    }
  }, [isMonitoring, traderAddress])

  const executeTrade = async (trade: any, allocation: number, maxSlippage: number, stopLoss: number) => {
    try {
      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not connected');
      }

      console.log('Executing trade:', {
        trade,
        allocation,
        maxSlippage,
        stopLoss
      });

      // Call the API to get the transaction
      const response = await fetch('/api/copy-trading/execute-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trade,
          allocation,
          maxSlippage,
          stopLoss
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute trade');
      }

      if (!data.success || !data.transaction) {
        throw new Error('Invalid response from server');
      }

      // Deserialize the transaction
      const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'));

      // Sign the transaction with Phantom
      const signed = await signTransaction(transaction);

      // Send the signed transaction
      const signature = await connection.sendRawTransaction(signed.serialize());
      console.log('Transaction sent:', signature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);
      console.log('Transaction confirmed:', confirmation);

      // Update trade status in database
      const updateResponse = await fetch('/api/copy-trading/update-trade-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tradeId: trade.id,
          status: 'completed',
          signature
        })
      });

      if (!updateResponse.ok) {
        console.error('Failed to update trade status');
      }

      return {
        success: true,
        signature,
        allocation: data.allocation,
        originalAllocation: data.originalAllocation
      };

    } catch (error) {
      console.error('Error in executeTrade:', error);
      throw error;
    }
  };

  const handleNewTrade = async (trade: any) => {
    try {
      if (!publicKey) {
        toast.error('Please connect your wallet first');
        return;
      }

      // Validate trade data
      if (!trade || !trade.type || !trade.token || !trade.amount) {
        console.error('Invalid trade data:', trade);
        toast.error('Invalid trade data received');
        return;
      }

      console.log('Processing new trade:', trade);

      // Execute the trade
      const result = await executeTrade(
        trade,
        allocation,
        maxSlippage,
        stopLoss
      );

      console.log('Trade executed successfully:', result);

      // Show success message
      toast.success(`Trade executed successfully! Signature: ${result.signature.slice(0, 8)}...`);

      // Update UI or state as needed
      setTrades(prev => [...prev, { ...trade, status: "completed" }])
      updatePerformance(trade)

    } catch (error) {
      console.error('Error in handleNewTrade:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('Insufficient balance')) {
          toast.error('Insufficient balance for trade');
        } else if (error.message.includes('Wallet not connected')) {
          toast.error('Please connect your wallet first');
        } else {
          toast.error(`Trade execution failed: ${error.message}`);
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  const updatePerformance = (trade: Trade) => {
    setPerformance(prev => {
      const newTotalTrades = prev.totalTrades + 1
      const newSuccessfulTrades = trade.status === "completed" ? prev.successfulTrades + 1 : prev.successfulTrades
      const newFailedTrades = trade.status === "failed" ? prev.failedTrades + 1 : prev.failedTrades
      const newTotalProfit = prev.totalProfit + (trade.profit || 0)
      const newWinRate = (newSuccessfulTrades / newTotalTrades) * 100
      const newAverageProfit = newTotalProfit / newTotalTrades

      return {
        totalTrades: newTotalTrades,
        successfulTrades: newSuccessfulTrades,
        failedTrades: newFailedTrades,
        totalProfit: newTotalProfit,
        winRate: newWinRate,
        averageProfit: newAverageProfit,
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Trade Monitor</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isMonitoring && isLoading && trades.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></span>
            <span className="text-muted-foreground">Waiting for trades...</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Trades</p>
            <p className="text-2xl font-bold">{performance.totalTrades}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{performance.winRate.toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Profit</p>
            <p className="text-2xl font-bold">
              {performance.totalProfit >= 0 ? (
                <span className="text-green-600">+{performance.totalProfit.toFixed(2)} SOL</span>
              ) : (
                <span className="text-red-600">{performance.totalProfit.toFixed(2)} SOL</span>
              )}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Average Profit</p>
            <p className="text-2xl font-bold">
              {performance.averageProfit >= 0 ? (
                <span className="text-green-600">+{performance.averageProfit.toFixed(2)} SOL</span>
              ) : (
                <span className="text-red-600">{performance.averageProfit.toFixed(2)} SOL</span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Recent Trades</h3>
          <div className="space-y-2">
            {trades.slice(-5).reverse().map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {trade.type === "buy" ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {trade.type.toUpperCase()} {trade.token}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trade.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{trade.amount} {trade.token}</p>
                  <p className="text-sm text-muted-foreground">
                    {trade.status === "completed" ? (
                      <span className="text-green-600">Completed</span>
                    ) : trade.status === "failed" ? (
                      <span className="text-red-600">Failed</span>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 