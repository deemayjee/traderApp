"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Brain, TrendingUp, Target, Settings } from 'lucide-react'
import type { TrainingConfig } from '@/lib/services/ai-agent-service'

interface TrainingConfigProps {
  onSubmit: (config: TrainingConfig) => void
  isSubmitting?: boolean
}

export function TrainingConfigForm({ onSubmit, isSubmitting }: TrainingConfigProps) {
  const [config, setConfig] = useState<TrainingConfig>({
    trainingPeriod: 30, // days
    initialCapital: 1000,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(config)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="trainingPeriod">Training Period (days)</Label>
              <Input
                id="trainingPeriod"
                type="number"
                min={1}
                max={365}
                value={config.trainingPeriod}
                onChange={(e) => setConfig({
                  ...config,
                  trainingPeriod: parseInt(e.target.value)
                })}
              />
            </div>

            <div>
              <Label htmlFor="initialCapital">Initial Capital (USD)</Label>
              <Input
                id="initialCapital"
                type="number"
                min={100}
                step={100}
                value={config.initialCapital}
                onChange={(e) => setConfig({
                  ...config,
                  initialCapital: parseInt(e.target.value)
                })}
              />
            </div>

            <div>
              <Label htmlFor="maxDrawdown">Maximum Drawdown (%)</Label>
              <Slider
                id="maxDrawdown"
                min={1}
                max={50}
                step={1}
                value={[config.maxDrawdown]}
                onValueChange={([value]) => setConfig({
                  ...config,
                  maxDrawdown: value
                })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {config.maxDrawdown}%
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Target Metrics</h3>
              
              <div>
                <Label htmlFor="winRate">Win Rate (%)</Label>
                <Slider
                  id="winRate"
                  min={50}
                  max={90}
                  step={1}
                  value={[config.targetMetrics.winRate]}
                  onValueChange={([value]) => setConfig({
                    ...config,
                    targetMetrics: {
                      ...config.targetMetrics,
                      winRate: value
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {config.targetMetrics.winRate}%
                </p>
              </div>

              <div>
                <Label htmlFor="profitFactor">Profit Factor</Label>
                <Slider
                  id="profitFactor"
                  min={1}
                  max={3}
                  step={0.1}
                  value={[config.targetMetrics.profitFactor]}
                  onValueChange={([value]) => setConfig({
                    ...config,
                    targetMetrics: {
                      ...config.targetMetrics,
                      profitFactor: value
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {config.targetMetrics.profitFactor.toFixed(1)}
                </p>
              </div>

              <div>
                <Label htmlFor="sharpeRatio">Sharpe Ratio</Label>
                <Slider
                  id="sharpeRatio"
                  min={0.5}
                  max={3}
                  step={0.1}
                  value={[config.targetMetrics.sharpeRatio]}
                  onValueChange={([value]) => setConfig({
                    ...config,
                    targetMetrics: {
                      ...config.targetMetrics,
                      sharpeRatio: value
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {config.targetMetrics.sharpeRatio.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Model Parameters</h3>
              
              <div>
                <Label htmlFor="learningRate">Learning Rate</Label>
                <Input
                  id="learningRate"
                  type="number"
                  min={0.0001}
                  max={0.1}
                  step={0.0001}
                  value={config.learningRate}
                  onChange={(e) => setConfig({
                    ...config,
                    learningRate: parseFloat(e.target.value)
                  })}
                />
              </div>

              <div>
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  min={8}
                  max={128}
                  step={8}
                  value={config.batchSize}
                  onChange={(e) => setConfig({
                    ...config,
                    batchSize: parseInt(e.target.value)
                  })}
                />
              </div>

              <div>
                <Label htmlFor="epochs">Number of Epochs</Label>
                <Input
                  id="epochs"
                  type="number"
                  min={10}
                  max={1000}
                  step={10}
                  value={config.epochs}
                  onChange={(e) => setConfig({
                    ...config,
                    epochs: parseInt(e.target.value)
                  })}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Starting Training...' : 'Start Training'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 