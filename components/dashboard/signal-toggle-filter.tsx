"use client"

import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface SignalFilterToggleProps {
  value: string
  onValueChange: (value: string) => void
}

export function SignalFilterToggle({ value, onValueChange }: SignalFilterToggleProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-0.5">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(value) => {
          if (value) onValueChange(value)
        }}
        className="bg-transparent border-none"
      >
        <ToggleGroupItem
          value="all"
          className={`rounded-md px-4 py-1.5 text-sm font-medium ${
            value === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-transparent text-muted-foreground"
          }`}
        >
          All
        </ToggleGroupItem>
        <ToggleGroupItem
          value="buy"
          className={`rounded-md px-4 py-1.5 text-sm font-medium ${
            value === "buy"
              ? "bg-primary text-primary-foreground"
              : "bg-transparent text-muted-foreground"
          }`}
        >
          Buy
        </ToggleGroupItem>
        <ToggleGroupItem
          value="sell"
          className={`rounded-md px-4 py-1.5 text-sm font-medium ${
            value === "sell"
              ? "bg-primary text-primary-foreground"
              : "bg-transparent text-muted-foreground"
          }`}
        >
          Sell
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
} 