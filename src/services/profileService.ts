import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  username: string
  email: string
  avatar_url: string | null
  bio: string | null
  website: string | null
  twitter: string | null
  discord: string | null
  telegram: string | null
  created_at: string
  updated_at: string
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  email_notifications: boolean
  push_notifications: boolean
  created_at: string
  updated_at: string
}

interface NotificationSettings {
  price_alerts: boolean
  market_updates: boolean
  news_updates: boolean
  social_mentions: boolean
  email_frequency: 'instant' | 'daily' | 'weekly'
  created_at: string
  updated_at: string
}

export class ProfileService {
  async getProfile(): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          ...profile,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating profile:', error)
      return null
    }
  }

  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching preferences:', error)
      return null
    }
  }

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          ...preferences,
          updated_at: new Date().toISOString()
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

  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching notification settings:', error)
      return null
    }
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings | null> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating notification settings:', error)
      return null
    }
  }
} 