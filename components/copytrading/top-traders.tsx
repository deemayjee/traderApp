"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, ArrowUpRight, Filter } from "lucide-react"

export function TopTraders() {
  const traders = [
    {
      name: "Alex Thompson",
      address: "0x1234...5678",
      profit: "+18.74%",
      trades: 24,
      successRate: 83,
    },
    {
      name: "Sarah Chen",
      address: "0x8765...4321",
      profit: "+12.3%",
      trades: 18,
      successRate: 72,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Traders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {traders.map((trader) => (
            <div key={trader.address} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt={trader.name} />
                  <AvatarFallback>{trader.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{trader.name}</p>
                  <p className="text-sm text-muted-foreground">{trader.address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">{trader.profit}</p>
                <p className="text-sm text-muted-foreground">{trader.trades} trades</p>
              </div>
              <Button size="sm">Copy</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
