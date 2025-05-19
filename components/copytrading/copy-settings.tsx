"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info, CheckCircle2, ArrowRight } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useWalletAuth } from "@/hooks/use-wallet-auth"

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
  const router = useRouter()
  const { user, connectWallet, isConnecting } = useWalletAuth()
  const [allocation, setAllocation] = useState("0.1")
  const [maxSlippage, setMaxSlippage] = useState("1")
  const [stopLoss, setStopLoss] = useState("5")
  const [localTraderName, setLocalTraderName] = useState(traderName || "")
  const [localTraderWallet, setLocalTraderWallet] = useState(traderWallet || "")
  const [errors, setErrors] = useState<{
    allocation?: string
    maxSlippage?: string
    stopLoss?: string
  }>({})
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const validateInputs = () => {
    const newErrors: typeof errors = {}

    // Validate allocation
    const allocationNum = parseFloat(allocation)
    if (isNaN(allocationNum) || allocationNum <= 0) {
      newErrors.allocation = "Allocation must be greater than 0"
    } else if (allocationNum > 10) {
      newErrors.allocation = "Allocation cannot exceed 10 SOL"
    }

    // Validate max slippage
    const slippageNum = parseFloat(maxSlippage)
    if (isNaN(slippageNum) || slippageNum <= 0) {
      newErrors.maxSlippage = "Slippage must be greater than 0"
    } else if (slippageNum > 5) {
      newErrors.maxSlippage = "Slippage cannot exceed 5%"
    }

    // Validate stop loss
    const stopLossNum = parseFloat(stopLoss)
    if (isNaN(stopLossNum) || stopLossNum <= 0) {
      newErrors.stopLoss = "Stop loss must be greater than 0"
    } else if (stopLossNum > 20) {
      newErrors.stopLoss = "Stop loss cannot exceed 20%"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStartCopying = async () => {
    if (!user?.wallet?.address) {
      toast.loading("Connecting wallet...")
      const connected = await connectWallet()
      if (!connected) {
        toast.error("Please connect your wallet first")
        return
      }
      toast.dismiss()
    }

    if (!validateInputs()) {
      toast.error("Please fix the errors before saving")
      return
    }
    setShowConfirmation(true)
  }

  const handleConfirm = async () => {
    if (!user?.wallet?.address) {
      toast.loading("Connecting wallet...")
      const connected = await connectWallet()
      if (!connected) {
        toast.error("Please connect your wallet first")
        return
      }
      toast.dismiss()
    }

    // Double check wallet is connected
    if (!user?.wallet?.address) {
      toast.error("Wallet connection failed. Please try again.")
      return
    }

    setIsStarting(true)
    try {
      const requestBody = {
        traderWallet: localTraderWallet,
        traderName: localTraderName,
        allocation: parseFloat(allocation),
        maxSlippage: parseFloat(maxSlippage),
        stopLoss: parseFloat(stopLoss),
        userWallet: user.wallet.address,
      }
      
      console.log('Sending request with body:', requestBody)

      const response = await fetch("/api/copy-trading/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      console.log('Response:', data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to start copy trading")
      }

      onSettingsSaved({
        allocation: parseFloat(allocation),
        maxSlippage: parseFloat(maxSlippage),
        stopLoss: parseFloat(stopLoss),
      })
      
      toast.success("Copy trading started successfully!")
      
      // Close the confirmation dialog
      setShowConfirmation(false)
      
      // Navigate to the trade monitor page
      router.push(`/copytrading`)
    } catch (error) {
      console.error('Error details:', error)
      toast.error(error instanceof Error ? error.message : "Failed to start copy trading. Please try again.")
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Copy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Trader Information</Label>
            <div className="space-y-2">
              <Input
                value={localTraderName}
                onChange={e => setLocalTraderName(e.target.value)}
                readOnly={!!traderName}
                placeholder="Trader's name (e.g. Ola)"
              />
              <Input
                value={localTraderWallet}
                onChange={e => setLocalTraderWallet(e.target.value)}
                readOnly={!!traderWallet}
                className="font-mono"
                placeholder="Trader's wallet address (e.g. HdkJ...UVG)"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="allocation">Allocation (SOL)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Amount of SOL to allocate for copy trading</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="allocation"
                type="number"
                value={allocation}
                onChange={(e) => setAllocation(e.target.value)}
                min="0.01"
                max="10"
                step="0.01"
                className={errors.allocation ? "border-red-500" : ""}
              />
              {errors.allocation && (
                <p className="text-sm text-red-500">{errors.allocation}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxSlippage">Max Slippage (%)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximum allowed price slippage for trades</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="maxSlippage"
                type="number"
                value={maxSlippage}
                onChange={(e) => setMaxSlippage(e.target.value)}
                min="0.1"
                max="5"
                step="0.1"
                className={errors.maxSlippage ? "border-red-500" : ""}
              />
              {errors.maxSlippage && (
                <p className="text-sm text-red-500">{errors.maxSlippage}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage drop at which to automatically sell</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="stopLoss"
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                min="1"
                max="20"
                step="1"
                className={errors.stopLoss ? "border-red-500" : ""}
              />
              {errors.stopLoss && (
                <p className="text-sm text-red-500">{errors.stopLoss}</p>
              )}
            </div>
          </div>

          <Button className="w-full" onClick={handleStartCopying}>
            Start Copy Trading
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Copy Trading Settings</DialogTitle>
            <DialogDescription>
              Please review your copy trading settings before proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Trader Details</h4>
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Name:</span> {traderName}
                </p>
                <p className="text-sm font-mono">
                  <span className="text-muted-foreground">Wallet:</span> {traderWallet}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Trading Parameters</h4>
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Allocation:</span> {allocation} SOL
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Max Slippage:</span> {maxSlippage}%
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Stop Loss:</span> {stopLoss}%
                </p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Once started, copy trading will automatically execute trades based on the selected trader's activity.
                You can stop copy trading at any time from the dashboard.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isStarting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isStarting}
            >
              {isStarting ? (
                "Starting..."
              ) : (
                <>
                  Confirm & Start
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 