import { BaseSettingsService } from "./base-settings"
import type { SecuritySettings } from "@/lib/types/settings"

export class SecuritySettingsService extends BaseSettingsService<SecuritySettings> {
  constructor() {
    super('security_settings')
  }

  async getSecuritySettings(userId: string): Promise<SecuritySettings | null> {
    return this.get(userId)
  }

  async updateSecuritySettings(userId: string, settings: Partial<SecuritySettings>): Promise<SecuritySettings | null> {
    return this.update(userId, settings)
  }

  async createSecuritySettings(userId: string, settings: Partial<SecuritySettings>): Promise<SecuritySettings | null> {
    return this.create(userId, settings)
  }

  async generateApiKey(userId: string): Promise<SecuritySettings | null> {
    const apiKey = this.generateRandomString(32)
    const apiSecret = this.generateRandomString(64)
    const apiPassphrase = this.generateRandomString(16)

    return this.update(userId, {
      api_key: apiKey,
      api_secret: apiSecret,
      api_passphrase: apiPassphrase,
      api_key_created_at: new Date().toISOString(),
      api_access_enabled: true
    })
  }

  private generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }
} 