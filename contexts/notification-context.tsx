"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { generateUUID } from "@/lib/utils/uuid"

export interface Notification {
  id: string
  title: string
  message: string
  type: "signal" | "performance" | "alert" | "system"
  read: boolean
  timestamp: Date
  agentId?: string
  agentName?: string
  signalId?: string
  asset?: string
}

interface NotificationPreferences {
  inApp: boolean
  browser: boolean
  email: boolean
  signalAlerts: boolean
  performanceAlerts: boolean
  systemAlerts: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  preferences: NotificationPreferences
  addNotification: (notification: Omit<Notification, "id" | "read" | "timestamp">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void
}

const defaultPreferences: NotificationPreferences = {
  inApp: true,
  browser: true,
  email: false,
  signalAlerts: true,
  performanceAlerts: true,
  systemAlerts: true,
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const { toast } = useToast()

  // Calculate unread count
  const unreadCount = notifications.filter((notification) => !notification.read).length

  // Load notifications and preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem("notifications")
      const savedPreferences = localStorage.getItem("notificationPreferences")

      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications)
        // Convert string timestamps back to Date objects
        parsedNotifications.forEach((notification: any) => {
          notification.timestamp = new Date(notification.timestamp)
        })
        setNotifications(parsedNotifications)
      }

      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences))
      }
    } catch (error) {
      console.error("Error loading notifications from localStorage:", error)
    }
  }, [])

  // Save notifications and preferences to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("notifications", JSON.stringify(notifications))
    } catch (error) {
      console.error("Error saving notifications to localStorage:", error)
    }
  }, [notifications])

  useEffect(() => {
    try {
      localStorage.setItem("notificationPreferences", JSON.stringify(preferences))
    } catch (error) {
      console.error("Error saving notification preferences to localStorage:", error)
    }
  }, [preferences])

  // Request browser notification permission if enabled
  useEffect(() => {
    if (preferences.browser && "Notification" in window) {
      Notification.requestPermission()
    }
  }, [preferences.browser])

  const addNotification = (notification: Omit<Notification, "id" | "read" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: generateUUID(),
      read: false,
      timestamp: new Date(),
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Show in-app toast notification if enabled
    if (preferences.inApp) {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === "alert" ? "destructive" : "default",
      })
    }

    // Show browser notification if enabled
    if (preferences.browser && "Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
      })
    }

    // In a real app, we would send an email notification here if enabled
    if (preferences.email) {
      console.log("Email notification would be sent:", notification)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newPreferences }))
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
