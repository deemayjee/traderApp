import { ProfileSettingsService } from "./profile-settings"
import { PreferenceSettingsService } from "./preference-settings"
import { DashboardSettingsService } from "./dashboard-settings"
import { NotificationSettingsService } from "./notification-settings"
import { TradingSettingsService } from "./trading-settings"
import { SecuritySettingsService } from "./security-settings"
import { SubscriptionSettingsService } from "./subscription-settings"
import type { UserSettings } from "@/lib/types/settings"
import { supabase } from "@/lib/supabase"
import type { UserPreferences } from "@/lib/types/settings"

export class SettingsService {
  private profileService: ProfileSettingsService
  private preferenceService: PreferenceSettingsService
  private dashboardService: DashboardSettingsService
  private notificationService: NotificationSettingsService
  private tradingService: TradingSettingsService
  private securityService: SecuritySettingsService
  private subscriptionService: SubscriptionSettingsService

  constructor() {
    this.profileService = new ProfileSettingsService()
    this.preferenceService = new PreferenceSettingsService()
    this.dashboardService = new DashboardSettingsService()
    this.notificationService = new NotificationSettingsService()
    this.tradingService = new TradingSettingsService()
    this.securityService = new SecuritySettingsService()
    this.subscriptionService = new SubscriptionSettingsService()
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const [
        profile,
        preferences,
        dashboard,
        notifications,
        trading,
        security,
        subscription
      ] = await Promise.all([
        this.profileService.getUserProfile(userId),
        this.preferenceService.getUserPreferences(userId),
        this.dashboardService.getDashboardPreferences(userId),
        this.notificationService.getNotificationSettings(userId),
        this.tradingService.getTradingPreferences(userId),
        this.securityService.getSecuritySettings(userId),
        this.subscriptionService.getSubscriptionSettings(userId)
      ])

      if (!profile || !preferences || !dashboard || !notifications || !trading || !security || !subscription) {
        return null
      }

      return {
        profile,
        preferences,
        dashboard,
        notifications,
        trading,
        security,
        subscription
      }
    } catch (error) {
      console.error("Error getting user settings:", error)
      return null
    }
  }

  // Individual getters
  async getProfile(userId: string) {
    return this.profileService.getUserProfile(userId)
  }

  async getPreferences(walletAddress: string) {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single()

    if (error) {
      console.error("Error fetching preferences:", error)
      return null
    }

    return data
  }

  async getDashboardPreferences(userId: string) {
    return this.dashboardService.getDashboardPreferences(userId)
  }

  async getNotificationSettings(userId: string) {
    return this.notificationService.getNotificationSettings(userId)
  }

  async getTradingPreferences(userId: string) {
    return this.tradingService.getTradingPreferences(userId)
  }

  async getSecuritySettings(userId: string) {
    return this.securityService.getSecuritySettings(userId)
  }

  async getSubscriptionSettings(userId: string) {
    return this.subscriptionService.getSubscriptionSettings(userId)
  }

  // Individual setters
  async updateProfile(userId: string, profile: any) {
    return this.profileService.updateUserProfile(userId, profile)
  }

  async updatePreferences(walletAddress: string, preferences: Partial<UserPreferences>) {
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert({
        wallet_address: walletAddress,
        theme: preferences.theme || 'light',
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Error updating preferences:", error)
      return null
    }

    return data
  }

  async updateDashboardPreferences(userId: string, preferences: any) {
    return this.dashboardService.updateDashboardPreferences(userId, preferences)
  }

  async updateNotificationSettings(userId: string, settings: any) {
    return this.notificationService.updateNotificationSettings(userId, settings)
  }

  async updateTradingPreferences(userId: string, preferences: any) {
    return this.tradingService.updateTradingPreferences(userId, preferences)
  }

  async updateSecuritySettings(userId: string, settings: any) {
    return this.securityService.updateSecuritySettings(userId, settings)
  }

  async updateSubscriptionSettings(userId: string, settings: any) {
    return this.subscriptionService.updateSubscriptionSettings(userId, settings)
  }

  // Specialized methods
  async generateApiKey(userId: string) {
    return this.securityService.generateApiKey(userId)
  }

  async createPreferences(walletAddress: string, preferences: Partial<UserPreferences>) {
    const { data, error } = await supabase
      .from("user_preferences")
      .insert({
        wallet_address: walletAddress,
        theme: preferences.theme || 'light',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating preferences:", error)
      return null
    }

    return data
  }
} 