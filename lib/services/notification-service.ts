import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationType = "info" | "success" | "warning" | "error" | "signal"
export type NotificationPriority = "low" | "medium" | "high"

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  timestamp: number
  read: boolean
  agentId?: string
  signalId?: string
  data?: any
}

interface NotificationState {
  notifications: Notification[]
  preferences: {
    enabled: boolean
    sound: boolean
    desktop: boolean
    email: boolean
  }
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  updatePreferences: (preferences: Partial<NotificationState["preferences"]>) => void
}

export const useNotifications = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      preferences: {
        enabled: true,
        sound: true,
        desktop: true,
        email: false,
      },
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Math.random().toString(36).substr(2, 9),
              timestamp: Date.now(),
              read: false,
            },
            ...state.notifications,
          ],
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearAll: () => set({ notifications: [] }),
      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
    }),
    {
      name: "notification-storage",
    }
  )
)

// Notification utility functions
export const createSignalNotification = (
  title: string,
  message: string,
  priority: NotificationPriority = 'medium',
  data?: any
) => ({
  type: 'signal' as NotificationType,
  title,
  message,
  priority,
  data,
})

export const createPriceNotification = (
  title: string,
  message: string,
  priority: NotificationPriority = 'low',
  data?: any
) => ({
  type: 'price' as NotificationType,
  title,
  message,
  priority,
  data,
})

export const createRiskNotification = (
  title: string,
  message: string,
  priority: NotificationPriority = 'high',
  data?: any
) => ({
  type: 'risk' as NotificationType,
  title,
  message,
  priority,
  data,
})

export const createSystemNotification = (
  title: string,
  message: string,
  priority: NotificationPriority = 'medium',
  data?: any
) => ({
  type: 'system' as NotificationType,
  title,
  message,
  priority,
  data,
}) 