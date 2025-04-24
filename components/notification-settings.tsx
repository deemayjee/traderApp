"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useNotifications } from "@/contexts/notification-context"
import { Bell, Mail, Globe, TrendingUp, BarChart3, Info } from "lucide-react"

export function NotificationSettings() {
  const { preferences, updatePreferences } = useNotifications()

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Configure how and when you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Delivery Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <Label htmlFor="in-app" className="font-normal">
                  In-app Notifications
                </Label>
              </div>
              <Switch
                id="in-app"
                checked={preferences.inApp}
                onCheckedChange={(checked) => updatePreferences({ inApp: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <Label htmlFor="browser" className="font-normal">
                  Browser Notifications
                </Label>
              </div>
              <Switch
                id="browser"
                checked={preferences.browser}
                onCheckedChange={(checked) => updatePreferences({ browser: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <Label htmlFor="email" className="font-normal">
                  Email Notifications
                </Label>
              </div>
              <Switch
                id="email"
                checked={preferences.email}
                onCheckedChange={(checked) => updatePreferences({ email: checked })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Types</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <Label htmlFor="signal-alerts" className="font-normal">
                  Signal Alerts
                </Label>
              </div>
              <Switch
                id="signal-alerts"
                checked={preferences.signalAlerts}
                onCheckedChange={(checked) => updatePreferences({ signalAlerts: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                <Label htmlFor="performance-alerts" className="font-normal">
                  Performance Alerts
                </Label>
              </div>
              <Switch
                id="performance-alerts"
                checked={preferences.performanceAlerts}
                onCheckedChange={(checked) => updatePreferences({ performanceAlerts: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-gray-500" />
                <Label htmlFor="system-alerts" className="font-normal">
                  System Alerts
                </Label>
              </div>
              <Switch
                id="system-alerts"
                checked={preferences.systemAlerts}
                onCheckedChange={(checked) => updatePreferences({ systemAlerts: checked })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
