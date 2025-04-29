import { BaseSettingsService } from "./base-settings"
import type { NotificationSettings } from "@/lib/types/settings"

export class NotificationSettingsService extends BaseSettingsService<NotificationSettings> {
  constructor() {
    super('notification_settings')
  }

  async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    return this.get(userId)
  }

  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<NotificationSettings | null> {
    return this.update(userId, settings)
  }

  async createNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<NotificationSettings | null> {
    return this.create(userId, settings)
  }
} 