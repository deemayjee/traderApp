"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/contexts/notification-context"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const router = useRouter()

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)

    // Navigate based on notification type
    if (notification.type === "signal" && notification.agentId) {
      router.push(`/agents/${notification.agentId}`)
    } else if (notification.type === "performance") {
      router.push("/performance")
    }
  }

  return (
    <DropdownMenuContent align="end" className="w-80">
      <DropdownMenuLabel className="flex justify-between items-center">
        <span>Notifications</span>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">No notifications</div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`py-3 cursor-pointer ${notification.read ? "" : "bg-gray-50"}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex flex-col w-full">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm">{notification.title}</span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <div className="flex mt-1">
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
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuGroup>
      {notifications.length > 10 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center" onClick={() => router.push("/notifications")}>
            <span className="text-sm font-medium">View all notifications</span>
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  )
} 