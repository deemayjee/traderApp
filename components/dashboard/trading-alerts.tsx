"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Plus, Settings, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import type { CryptoAlert } from "@/lib/api/crypto-api"

interface TradingAlertsProps {
  onCreateAlert?: () => void
  alerts: CryptoAlert[]
  onDeleteAlert?: (id: string) => void
  onToggleAlert?: (id: string) => void
}

export function TradingAlerts({ 
  onCreateAlert, 
  alerts = [], 
  onDeleteAlert,
  onToggleAlert 
}: TradingAlertsProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center">
          <Bell className="h-5 w-5 mr-2 text-gray-600" />
          <CardTitle className="text-lg font-semibold">Trading Alerts</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">{alert.title}</h3>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                  <p className="text-xs text-gray-500">{alert.time}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={alert.active} 
                    onCheckedChange={() => onToggleAlert?.(alert.id)} 
                  />
                  {onDeleteAlert && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                      onClick={() => onDeleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete alert</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          size="lg"
          className="w-full border-gray-200 flex items-center justify-center gap-2"
          onClick={onCreateAlert}
        >
          <Plus className="h-5 w-5" /> Create New Alert
        </Button>
      </CardContent>
    </Card>
  )
}
