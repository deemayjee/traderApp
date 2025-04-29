import { BaseSettingsService } from "./base-settings"
import type { DashboardPreferences } from "@/lib/types/settings"

export class DashboardSettingsService extends BaseSettingsService<DashboardPreferences> {
  constructor() {
    super('dashboard_preferences')
  }

  async getDashboardPreferences(userId: string): Promise<DashboardPreferences | null> {
    return this.get(userId)
  }

  async updateDashboardPreferences(userId: string, preferences: Partial<DashboardPreferences>): Promise<DashboardPreferences | null> {
    return this.update(userId, preferences)
  }

  async createDashboardPreferences(userId: string, preferences: Partial<DashboardPreferences>): Promise<DashboardPreferences | null> {
    return this.create(userId, preferences)
  }
} 