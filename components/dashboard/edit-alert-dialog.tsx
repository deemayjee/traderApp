import type React from "react"
import type { CryptoAlert } from "@/lib/api/crypto-api"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"

interface EditAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  alert: CryptoAlert | null
  onEditAlert: (updatedAlert: CryptoAlert) => void
  cryptoOptions?: Array<{ id: string; name: string; symbol: string; price: number }>
}

export function EditAlertDialog({ open, onOpenChange, alert, onEditAlert, cryptoOptions = [] }: EditAlertDialogProps) {
  const [asset, setAsset] = useState(alert?.symbol || "BTC")
  const [alertType, setAlertType] = useState(alert?.type || "price")
  const [condition, setCondition] = useState(alert?.condition || "above")
  const [value, setValue] = useState(alert ? String(alert.value) : "")
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(alert?.priority || 'medium')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (alert) {
      setAsset(alert.symbol)
      setAlertType(alert.type)
      setCondition(alert.condition)
      setValue(String(alert.value))
      setPriority(alert.priority || 'medium')
    }
  }, [alert])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!alert) return
      const updatedAlert: CryptoAlert = {
        ...alert,
        symbol: asset,
        type: alertType as "price" | "volume" | "trend",
        condition,
        value: parseFloat(value),
        priority,
        timestamp: alert.timestamp, // keep original timestamp
        title: `${asset} ${alertType} Alert`,
        description: `${asset} ${alertType} alert when price is ${condition} ${value}`
      }
      onEditAlert(updatedAlert)
      toast({
        title: "Alert updated",
        description: `${asset} ${alertType} alert has been updated.`,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating alert:", error)
      toast({
        title: "Error",
        description: "Failed to update alert. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Alert</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="asset">Asset</Label>
              <Select value={asset} onValueChange={setAsset}>
                <SelectTrigger id="asset">
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="SOL">Solana (SOL)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                  <SelectItem value="XRP">XRP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Alert Type</Label>
              <RadioGroup value={alertType} onValueChange={v => setAlertType(v as "price" | "volume" | "trend")} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="price" id="price" />
                  <Label htmlFor="price">Price</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="volume" id="volume" />
                  <Label htmlFor="volume">Volume</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="trend" id="trend" />
                  <Label htmlFor="trend">Trend</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label>Condition</Label>
              <RadioGroup value={condition} onValueChange={setCondition} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="above" id="above" />
                  <Label htmlFor="above">Above</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="below" id="below" />
                  <Label htmlFor="below">Below</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={alertType === "price" ? "e.g. 50000" : alertType === "volume" ? "e.g. 1000000" : "e.g. uptrend"}
              />
            </div>

            <div className="grid gap-2">
              <Label>Priority</Label>
              <RadioGroup value={priority} onValueChange={v => setPriority(v as 'high' | 'medium' | 'low')} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="priority-high" />
                  <Label htmlFor="priority-high">High</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="priority-medium" />
                  <Label htmlFor="priority-medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="priority-low" />
                  <Label htmlFor="priority-low">Low</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !value}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 