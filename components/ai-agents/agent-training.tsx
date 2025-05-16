import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Brain, TrendingUp, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { AIAgent } from "./create-agent-dialog"

interface TrainingConfig {
  trainingPeriod: number
  initialCapital: number
  maxDrawdown: number
  targetMetrics: {
    winRate: number
    profitFactor: number
    sharpeRatio: number
  }
  learningRate: number
  batchSize: number
  epochs: number
}

interface TrainingMetrics {
  currentEpoch: number
  winRate: number
  profitFactor: number
  sharpeRatio: number
  totalTrades: number
  successfulTrades: number
  totalProfit: number
  maxDrawdown: number
  learningProgress: number
}

interface AgentTrainingProps {
  agent: AIAgent
  onTrainingComplete: () => void
}

export function AgentTraining({ agent, onTrainingComplete }: AgentTrainingProps) {
  const [isTraining, setIsTraining] = useState(false)
  const [metrics, setMetrics] = useState<TrainingMetrics | null>(null)
  const [config, setConfig] = useState<TrainingConfig>({
    trainingPeriod: 30,
    initialCapital: 1,
    maxDrawdown: 20,
    targetMetrics: {
      winRate: 60,
      profitFactor: 1.5,
      sharpeRatio: 1.2
    },
    learningRate: 0.001,
    batchSize: 32,
    epochs: 100
  })

  const startTraining = async () => {
    try {
      setIsTraining(true)
      const response = await fetch('/api/ai-agents/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          config
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start training')
      }

      const { jobId } = await response.json()
      
      // Connect to WebSocket for real-time updates
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/training/${jobId}`)
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'metrics') {
          setMetrics(data.metrics)
        } else if (data.type === 'complete') {
          setIsTraining(false)
          onTrainingComplete()
          toast.success('Training completed successfully!')
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast.error('Connection error. Please try again.')
        setIsTraining(false)
      }

      return () => ws.close()
    } catch (error) {
      console.error('Error starting training:', error)
      toast.error('Failed to start training')
      setIsTraining(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Agent Training Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label>Training Period (days)</Label>
              <Input
                type="number"
                value={config.trainingPeriod}
                onChange={(e) => setConfig({
                  ...config,
                  trainingPeriod: parseInt(e.target.value)
                })}
                min={1}
                max={365}
              />
            </div>

            <div className="grid gap-2">
              <Label>Initial Capital (SOL)</Label>
              <Input
                type="number"
                value={config.initialCapital}
                onChange={(e) => setConfig({
                  ...config,
                  initialCapital: parseFloat(e.target.value)
                })}
                min={0.1}
                step={0.1}
              />
            </div>

            <div className="grid gap-2">
              <Label>Max Drawdown (%)</Label>
              <Slider
                value={[config.maxDrawdown]}
                onValueChange={([value]) => setConfig({
                  ...config,
                  maxDrawdown: value
                })}
                min={5}
                max={50}
                step={1}
              />
            </div>

            <div className="grid gap-2">
              <Label>Target Win Rate (%)</Label>
              <Slider
                value={[config.targetMetrics.winRate]}
                onValueChange={([value]) => setConfig({
                  ...config,
                  targetMetrics: {
                    ...config.targetMetrics,
                    winRate: value
                  }
                })}
                min={50}
                max={90}
                step={1}
              />
            </div>

            <div className="grid gap-2">
              <Label>Learning Rate</Label>
              <Input
                type="number"
                value={config.learningRate}
                onChange={(e) => setConfig({
                  ...config,
                  learningRate: parseFloat(e.target.value)
                })}
                min={0.0001}
                max={0.1}
                step={0.0001}
              />
            </div>

            <div className="grid gap-2">
              <Label>Epochs</Label>
              <Input
                type="number"
                value={config.epochs}
                onChange={(e) => setConfig({
                  ...config,
                  epochs: parseInt(e.target.value)
                })}
                min={10}
                max={1000}
                step={10}
              />
            </div>

            <Button
              onClick={startTraining}
              disabled={isTraining}
              className="w-full"
            >
              {isTraining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Training in Progress...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Start Training
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isTraining && metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Training Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{metrics.learningProgress.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.learningProgress} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Win Rate</Label>
                  <div className="text-2xl font-bold">
                    {metrics.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Profit Factor</Label>
                  <div className="text-2xl font-bold">
                    {metrics.profitFactor.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sharpe Ratio</Label>
                  <div className="text-2xl font-bold">
                    {metrics.sharpeRatio.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total Trades</Label>
                  <div className="text-2xl font-bold">
                    {metrics.totalTrades}
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Training in Progress</AlertTitle>
                <AlertDescription>
                  Your agent is learning from historical data. This may take several hours.
                  You can close this window and check back later.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 