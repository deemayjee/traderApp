import { supabase } from "@/lib/supabase"

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  email_notifications: boolean
  push_notifications: boolean
}

interface UserProfile {
  username: string
  email: string
  avatar_url: string | null
  bio: string | null
  website: string | null
  twitter: string | null
  discord: string | null
  telegram: string | null
}

interface NotificationSettings {
  price_alerts: boolean
  market_updates: boolean
  news_updates: boolean
  social_mentions: boolean
  email_frequency: 'instant' | 'daily' | 'weekly'
}

interface SecuritySettings {
  email_verification: boolean
  device_management: boolean
  session_timeout: number
}

export class SettingsService {
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          ...preferences,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating preferences:', error)
      return null
    }
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      // First check if a profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingProfile) {
        // Update existing profile
        const { data: updatedProfile, error } = await supabase
          .from('user_profiles')
          .update(profileData)
          .select()
          .single()

        if (error) throw error
        return updatedProfile
      } else {
        // Create new profile
        const { data: newProfile, error } = await supabase
          .from('user_profiles')
          .insert([profileData])
          .select()
          .single()

        if (error) throw error
        return newProfile
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      return null
    }
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<boolean> {
    try {
      // First check if settings already exist
      const { data: existingSettings, error: fetchError } = await supabase
        .from('notification_settings')
        .select('*')
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('notification_settings')
          .update(settings)

        if (error) throw error
        return true
      } else {
        // Create new settings
        const { error } = await supabase
          .from('notification_settings')
          .insert([settings])

        if (error) throw error
        return true
      }
    } catch (error) {
      console.error('Error updating notification settings:', error)
      return false
    }
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('security_settings')
        .upsert(settings)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating security settings:', error)
      return false
    }
  }
} 