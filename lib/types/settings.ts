// User Profile Settings
export interface UserProfile {
  id: string
  user_id: string
  name?: string
  email?: string
  bio?: string
  username?: string
  avatar_url?: string
  phone_number?: string
  timezone: string
  public_profile: boolean
  created_at: string
  updated_at: string
}

// User Preferences
export interface UserPreferences {
  id: string
  wallet_address: string
  theme: 'light' | 'dark'
  last_signature?: string
  last_active: string
  nonce?: string
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
  id: string
  user_id: string
  notifications: boolean
  email_notifications: boolean
  push_notifications: boolean
  price_alerts: boolean
  signal_alerts: boolean
  copy_trading_updates: boolean
  community_mentions: boolean
  marketing_communications: boolean
  in_app_notifications: boolean
  browser_notifications: boolean
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