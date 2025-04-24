"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "@/contexts/notification-context"
import { formatDistanceToNow } from "date-fns"
import { NotificationSettings } from "@/components/notification-settings"
import { Trash2 } from "lucide-react"

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications()
  const [activeTab, setActiveTab] = useState("all")

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type === activeTab
  })

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-gray-500">Manage your notifications and preferences</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-gray-200" onClick={markAllAsRead}>
            Mark All as Read
          </Button>
          <Button variant="outline" className="border-gray-200 text-red-600" onClick={clearNotifications}>
            <Trash2 size={16} className="mr-2" /> Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Notification History</CardTitle>
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-gray-100 border border-gray-200">
                    <TabsTrigger value="all" className="data-[state=active]:bg-white">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="data-[state=active]:bg-white">
                      Unread
                    </TabsTrigger>
                    <TabsTrigger value="signal" className="data-[state=active]:bg-white">
                      Signals
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="data-[state=active]:bg-white">
                      Performance
                    </TabsTrigger>
                    <TabsTrigger value="alert" className="data-[state=active]:bg-white">
                      Alerts
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No notifications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`border border-gray-200 rounded-lg p-4 ${notification.read ? "" : "bg-gray-50"}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{notification.title}</h3>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex mt-2">
                        {notification.type === "signal" && (
                          <Badge className="bg-green-100 text-green-600 hover:bg-green-100">Signal</Badge>
                        )}
                        {notification.type === "performance" && (
                          <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">Performance</Badge>
                        )}
                        {notification.type === "alert" && (
                          <Badge className="bg-amber-100 text-amber-600 hover:bg-amber-100">Alert</Badge>
                        )}
                        {notification.type === "system" && (
                          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">System</Badge>
                        )}
                        {!notification.read && (
                          <Badge className="ml-2 bg-blue-100 text-blue-600 hover:bg-blue-100">New</Badge>
                        )}
                        {notification.agentName && (
                          <Badge className="ml-2 bg-purple-100 text-purple-600 hover:bg-purple-100">
                            {notification.agentName}
                          </Badge>
                        )}
                        {notification.asset && (
                          <Badge className="ml-2 bg-gray-100 text-gray-600 hover:bg-gray-100">
                            {notification.asset}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <NotificationSettings />
        </div>
      </div>
    </>
  )
}
