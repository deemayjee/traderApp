import { BaseSettingsService } from "./base-settings"
import type { UserPreferences } from "@/lib/types/settings"

export class PreferenceSettingsService extends BaseSettingsService<UserPreferences> {
  constructor() {
    super('user_preferences')
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return this.get(userId)
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    return this.update(userId, preferences)
  }

  async createUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    return this.create(userId, preferences)
  }
} 