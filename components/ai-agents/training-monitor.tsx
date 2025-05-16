import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { TrainingMetrics } from '@/lib/services/ai-agent-service'

interface TrainingMonitorProps {
  jobId: string
  onComplete?: () => void
}

export function TrainingMonitor({ jobId, onComplete }: TrainingMonitorProps) {
  const [metrics, setMetrics] = useState<TrainingMetrics[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<TrainingMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/training/${jobId}`)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'metrics') {
        setCurrentMetrics(data.metrics)
        setMetrics(prev => [...prev, data.metrics])
      } else if (data.type === 'error') {
        setError(data.message)
      } else if (data.type === 'complete') {
        onComplete?.()
      }
    }

    ws.onerror = (event) => {
      setError('WebSocket connection error')
    }

    return () => {
      ws.close()
    }
  }, [jobId, onComplete])

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">Training Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!currentMetrics) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Initializing Training...</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={0} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Training Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Learning Progress</p>
              <Progress value={currentMetrics.learningProgress} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Win Rate</p>
                <p className="text-2xl font-bold">{currentMetrics.winRate.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium">Profit Factor</p>
                <p className="text-2xl font-bold">{currentMetrics.profitFactor.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Sharpe Ratio</p>
                <p className="text-2xl font-bold">{currentMetrics.sharpeRatio.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Max Drawdown</p>
                <p className="text-2xl font-bold">{currentMetrics.maxDrawdown.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="currentEpoch" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="winRate" stroke="#8884d8" name="Win Rate" />
                <Line type="monotone" dataKey="profitFactor" stroke="#82ca9d" name="Profit Factor" />
                <Line type="monotone" dataKey="sharpeRatio" stroke="#ffc658" name="Sharpe Ratio" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trading Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Total Trades</p>
              <p className="text-2xl font-bold">{currentMetrics.totalTrades}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Successful Trades</p>
              <p className="text-2xl font-bold">{currentMetrics.successfulTrades}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Profit</p>
              <p className="text-2xl font-bold">{currentMetrics.totalProfit.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium">Current Epoch</p>
              <p className="text-2xl font-bold">{currentMetrics.currentEpoch}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 