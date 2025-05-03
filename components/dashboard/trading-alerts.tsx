"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Bell, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"

interface CryptoAlert {
  id: string
  type: 'price' | 'volume' | 'trend'
  symbol: string
  condition: string
  value: number
  active: boolean
  priority: 'high' | 'medium' | 'low'
  timestamp: string
}

interface TradingAlertsProps {
  alerts: CryptoAlert[]
  onCreateAlert: () => void
  onDeleteAlert: (id: string) => void
  onToggleAlert: (id: string) => void
  isPreview?: boolean
}

export function TradingAlerts({ 
  alerts, 
  onCreateAlert, 
  onDeleteAlert, 
  onToggleAlert,
  isPreview = false 
}: TradingAlertsProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Trading Alerts
        </CardTitle>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium leading-none">
                    {alert.symbol}
                  </p>
                  <Badge variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'secondary' : 'outline'}>
                    {alert.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {alert.type}: {alert.condition} {alert.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={alert.active}
                  onCheckedChange={() => onToggleAlert(alert.id)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteAlert(alert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete alert</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
        {isPreview ? (
          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/signals">
                View All Alerts
              </Link>
            </Button>
            <Button className="w-full" onClick={onCreateAlert}>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </div>
        ) : (
          <Button className="w-full mt-4" onClick={onCreateAlert}>
            <Plus className="mr-2 h-4 w-4" />
            Create Alert
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
