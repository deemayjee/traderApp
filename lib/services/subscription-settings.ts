import { BaseSettingsService } from "./base-settings"
import type { SubscriptionSettings } from "@/lib/types/settings"

export class SubscriptionSettingsService extends BaseSettingsService<SubscriptionSettings> {
  constructor() {
    super('subscription_settings')
  }

  async getSubscriptionSettings(userId: string): Promise<SubscriptionSettings | null> {
    return this.get(userId)
  }

  async updateSubscriptionSettings(userId: string, settings: Partial<SubscriptionSettings>): Promise<SubscriptionSettings | null> {
    return this.update(userId, settings)
  }

  async createSubscriptionSettings(userId: string, settings: Partial<SubscriptionSettings>): Promise<SubscriptionSettings | null> {
    return this.create(userId, settings)
  }
} 