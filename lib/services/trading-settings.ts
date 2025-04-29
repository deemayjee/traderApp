import { BaseSettingsService } from "./base-settings"
import type { TradingPreferences } from "@/lib/types/settings"

export class TradingSettingsService extends BaseSettingsService<TradingPreferences> {
  constructor() {
    super('trading_preferences')
  }

  async getTradingPreferences(userId: string): Promise<TradingPreferences | null> {
    return this.get(userId)
  }

  async updateTradingPreferences(userId: string, preferences: Partial<TradingPreferences>): Promise<TradingPreferences | null> {
    return this.update(userId, preferences)
  }

  async createTradingPreferences(userId: string, preferences: Partial<TradingPreferences>): Promise<TradingPreferences | null> {
    return this.create(userId, preferences)
  }
} 