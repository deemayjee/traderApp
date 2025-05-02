// User Profile Settings
export interface UserProfile {
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

// User Preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  email_notifications: boolean
  push_notifications: boolean
  created_at: string
  updated_at: string
}

// Dashboard Preferences
export interface DashboardPreferences {
  id: string
  user_id: string
  show_portfolio_widget: boolean
  show_market_widget: boolean
  show_signals_widget: boolean
  show_news_widget: boolean
  show_ai_widget: boolean
  created_at: string
  updated_at: string
}

// Notification Settings
export interface NotificationSettings {
  price_alerts: boolean
  market_updates: boolean
  news_updates: boolean
  social_mentions: boolean
  email_frequency: 'instant' | 'daily' | 'weekly'
  created_at: string
  updated_at: string
}

// Trading Preferences
export interface TradingPreferences {
  id: string
  user_id: string
  default_exchange: string
  default_timeframe: string
  risk_level: string
  max_leverage: number
  show_portfolio_value: boolean
  show_trading_history: boolean
  show_holdings: boolean
  created_at: string
  updated_at: string
}

// Security Settings
export interface SecuritySettings {
  id: string
  user_id: string
  two_factor_enabled: boolean
  api_access_enabled: boolean
  api_key?: string
  api_secret?: string
  api_passphrase?: string
  api_key_created_at?: string
  api_key_last_used?: string
  active_sessions: any[]
  created_at: string
  updated_at: string
}

// Subscription Settings
export interface SubscriptionSettings {
  id: string
  user_id: string
  plan: string
  status: string
  expiry?: string
  price?: number
  billing_cycle: string
  created_at: string
  updated_at: string
}

// Combined settings type for convenience
export interface UserSettings {
  profile: UserProfile
  preferences: UserPreferences
  dashboard: DashboardPreferences
  notifications: NotificationSettings
  trading: TradingPreferences
  security: SecuritySettings
  subscription: SubscriptionSettings
} 