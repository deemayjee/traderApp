import { BaseSettingsService } from "./base-settings"
import type { UserProfile } from "@/lib/types/settings"

export class ProfileSettingsService extends BaseSettingsService<UserProfile> {
  constructor() {
    super('user_profiles')
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.get(userId)
  }

  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
    return this.update(userId, profile)
  }

  async createUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
    return this.create(userId, profile)
  }
} 