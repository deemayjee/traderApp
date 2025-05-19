"use client"

import type React from "react"
import type { CryptoAlert } from "@/lib/api/crypto-api"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"

interface CreateAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAlert?: (newAlert: Omit<CryptoAlert, "id">) => void
  cryptoOptions?: Array<{ id: string; name: string; symbol: string; price: number }>
  walletAddress: string
}

export function CreateAlertDialog({ open, onOpenChange, onCreateAlert, cryptoOptions = [], walletAddress }: CreateAlertDialogProps) {
  const [asset, setAsset] = useState("BTC")
  const [alertType, setAlertType] = useState("price")
  const [condition, setCondition] = useState("above")
  const [value, setValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create the alert object
      const newAlert: Omit<CryptoAlert, "id"> = {
        type: alertType as "price" | "volume" | "trend",
        symbol: asset,
        condition,
        value: parseFloat(value),
        active: true,
        priority,
        timestamp: new Date().toISOString(),
        title: `${asset} ${alertType} Alert`,
        description: `${asset} ${alertType} alert when price is ${condition} ${value}`,
        wallet_address: walletAddress
      }

      // Call the onCreateAlert callback if provided
      if (onCreateAlert) {
        await onCreateAlert(newAlert)
      }

      toast({
        title: "Alert created",
        description: `${asset} ${alertType} alert when ${condition} ${value} has been created.`,
      })

      // Reset form and close dialog
      setValue("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating alert:", error)
      toast({
        title: "Error",
        description: "Failed to create alert. Please try again.",
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
          <DialogTitle>Create New Alert</DialogTitle>
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
              <RadioGroup value={alertType} onValueChange={setAlertType} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="price" id="price" />
                  <Label htmlFor="price">Price</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rsi" id="rsi" />
                  <Label htmlFor="rsi">RSI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="volume" id="volume" />
                  <Label htmlFor="volume">Volume</Label>
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
                placeholder={alertType === "price" ? "e.g. 50000" : alertType === "rsi" ? "e.g. 70" : "e.g. 1000000"}
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
              {isSubmitting ? "Creating..." : "Create Alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
