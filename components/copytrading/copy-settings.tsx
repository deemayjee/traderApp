"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"
import { toast } from "sonner"

interface CopySettingsProps {
  traderWallet: string
  traderName: string
  onSettingsSaved: (settings: {
    allocation: number
    maxSlippage: number
    stopLoss: number
  }) => void
}

export function CopySettings({ traderWallet, traderName, onSettingsSaved }: CopySettingsProps) {
  const [allocation, setAllocation] = useState(0.01)
  const [maxSlippage, setMaxSlippage] = useState(1)
  const [stopLoss, setStopLoss] = useState(5)

  const handleStartCopying = () => {
    onSettingsSaved({
      allocation,
      maxSlippage,
      stopLoss
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Copy Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Trader Information</Label>
          <div className="space-y-2">
            <Input value={traderName} readOnly />
            <Input value={traderWallet} readOnly className="font-mono" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Allocation (SOL)</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[allocation]}
                onValueChange={([value]) => setAllocation(value)}
                min={0.01}
                max={1}
                step={0.01}
                className="flex-1"
              />
              <span className="text-sm font-medium">{allocation} SOL</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Max Slippage (%)</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[maxSlippage]}
                onValueChange={([value]) => setMaxSlippage(value)}
                min={0.1}
                max={5}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm font-medium">{maxSlippage}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Stop Loss (%)</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[stopLoss]}
                onValueChange={([value]) => setStopLoss(value)}
                min={1}
                max={20}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium">{stopLoss}%</span>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={handleStartCopying}>
          Start Copy Trading
        </Button>
      </CardContent>
    </Card>
  )
} 