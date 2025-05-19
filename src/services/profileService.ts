import { supabaseAdmin } from '@/lib/supabase/server-admin';

interface UserProfile {
  id: string;
  wallet_address: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  last_active: string;
  created_at: string;
  updated_at: string;
  user_preferences?: {
    theme: string;
    language: string;
    currency: string;
  };
  notification_settings?: {
    email_notifications: boolean;
    push_notifications: boolean;
    price_alerts: boolean;
    transaction_alerts: boolean;
  };
  trading_preferences?: {
    default_exchange: string;
    default_pair: string;
    slippage_tolerance: number;
  };
  security_settings?: {
    two_factor_auth: boolean;
    session_timeout: number;
  };
  subscription_settings?: {
    subscription_tier: string;
    payment_methods: any[];
  };
}

export const updateProfile = async (profileData: Partial<UserProfile>) => {
  try {
    // Update the main profile data
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        display_name: profileData.display_name,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profileData.id)
      .select(`
        *,
        user_preferences (*),
        notification_settings (*),
        trading_preferences (*),
        security_settings (*),
        subscription_settings (*)
      `)
      .single();

    if (error) throw error;

    // Update user preferences if provided
    if (profileData.user_preferences) {
      const { error: preferencesError } = await supabaseAdmin
        .from('user_preferences')
        .update(profileData.user_preferences)
        .eq('wallet_address', data.wallet_address);

      if (preferencesError) throw preferencesError;
    }

    // Update notification settings if provided
    if (profileData.notification_settings) {
      const { error: notificationError } = await supabaseAdmin
        .from('notification_settings')
        .update(profileData.notification_settings)
        .eq('wallet_address', data.wallet_address);

      if (notificationError) throw notificationError;
    }

    // Update trading preferences if provided
    if (profileData.trading_preferences) {
      const { error: tradingError } = await supabaseAdmin
        .from('trading_preferences')
        .update(profileData.trading_preferences)
        .eq('wallet_address', data.wallet_address);

      if (tradingError) throw tradingError;
    }

    // Update security settings if provided
    if (profileData.security_settings) {
      const { error: securityError } = await supabaseAdmin
        .from('security_settings')
        .update(profileData.security_settings)
        .eq('wallet_address', data.wallet_address);

      if (securityError) throw securityError;
    }

    // Update subscription settings if provided
    if (profileData.subscription_settings) {
      const { error: subscriptionError } = await supabaseAdmin
        .from('subscription_settings')
        .update(profileData.subscription_settings)
        .eq('wallet_address', data.wallet_address);

      if (subscriptionError) throw subscriptionError;
    }

    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}; 