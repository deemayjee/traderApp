"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CopyTradingStats() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Copy Trading Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Profit</p>
            <p className="text-2xl font-bold">0 SOL</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Copies</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 