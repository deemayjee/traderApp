import { supabase } from "@/lib/supabase"
import { AuthService } from "./auth-service"

export interface UserPreferences {
  theme: string
  compact_mode: boolean
  show_advanced_charts: boolean
  enable_animations: boolean
}

export interface UserProfile {
  username: string
  bio: string
  avatar_url: string
  timezone: string
  public_profile: boolean
  show_trading_history?: boolean
  display_portfolio_value?: boolean
  email?: string
  password?: string
}

export interface NotificationSettings {
  in_app_notifications: boolean
  email_notifications: boolean
  signal_alerts: boolean
  performance_alerts: boolean
  price_alerts: boolean
  copy_trading_updates: boolean
  community_mentions: boolean
}

export interface SecuritySettings {
  wallet_address: string
  two_factor_enabled: boolean
  login_notifications: boolean
  suspicious_activity_alerts: boolean
  trusted_devices: string[]
  updated_at: string
}

export interface DashboardPreferences {
  show_portfolio_widget: boolean
  show_market_widget: boolean
  show_signals_widget: boolean
  show_news_widget: boolean
  show_ai_widget: boolean
}

export class SettingsService {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  private async ensureAuth(walletAddress: string) {
    await this.authService.signInWithWallet(walletAddress)
  }

  async updatePreferences(walletAddress: string, preferences: Partial<UserPreferences>) {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .upsert({
          wallet_address: walletAddress,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating preferences:", error)
      throw error
    }
  }

  async updateProfile(walletAddress: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      console.log("updateProfile called with:", { 
        walletAddress, 
        data: {
          ...data,
          password: data.password ? '********' : undefined 
        }
      });
      
      // Handle password separately - in a real app, this would hash the password and update it in the auth system
      if (data.password) {
        console.log("Password update requested - in a real app, this would update the hashed password");
        // Remove password from data to avoid storing it in the profile table
        const { password, ...profileData } = data;
        data = profileData;
      }
      
      // First check if a profile already exists for this wallet
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing profile:', checkError);
      }
      
      console.log("Existing profile check result:", existingProfile);
      
      let result;
      
      if (existingProfile) {
        // Update existing profile
        const updateData = {
          ...data,
          updated_at: new Date().toISOString()
        };
        console.log("Final update payload:", updateData);
        
        // Update user_profiles table
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('wallet_address', walletAddress)
          .select()
          .single();
          
        if (error) {
          console.error("Error during profile update:", error);
          throw error;
        }

        // If username is being updated, also update the users table
        if (data.username) {
          console.log("Attempting to update username in users table:", {
            walletAddress,
            username: data.username
          });
          
          const { data: userData, error: userUpdateError } = await supabase
            .from('users')
            .update({ username: data.username })
            .eq('wallet_address', walletAddress)
            .select()
            .single();

          if (userUpdateError) {
            console.error("Error updating username in users table:", userUpdateError);
            throw userUpdateError;
          }

          console.log("Successfully updated users table:", userData);
        }

        result = profile;
      } else {
        // Insert new profile
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .insert({
            wallet_address: walletAddress,
            ...data,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) throw error;

        // If username is being set, also update the users table
        if (data.username) {
          console.log("Attempting to update username in users table:", {
            walletAddress,
            username: data.username
          });
          
          const { data: userData, error: userUpdateError } = await supabase
            .from('users')
            .update({ username: data.username })
            .eq('wallet_address', walletAddress)
            .select()
            .single();

          if (userUpdateError) {
            console.error("Error updating username in users table:", userUpdateError);
            throw userUpdateError;
          }

          console.log("Successfully updated users table:", userData);
        }

        result = profile;
      }
      
      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async updateNotificationSettings(walletAddress: string, settings: Partial<NotificationSettings>): Promise<boolean> {
    try {
      console.log('Updating notification settings for wallet:', walletAddress);
      console.log('Settings to update:', settings);

      // Ensure user is authenticated
      await this.ensureAuth(walletAddress);

      // First check if settings already exist for this wallet
      const { data: existingSettings, error: checkError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing settings:', checkError);
        return false;
      }

      console.log('Existing settings:', existingSettings);

      let result;
      if (existingSettings) {
        // Update existing settings
        console.log('Updating existing settings...');
        const { data, error } = await supabase
          .from('notification_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('wallet_address', walletAddress)
          .select()
          .single();

        if (error) {
          console.error('Error updating notification settings:', error);
          return false;
        }
        console.log('Settings updated successfully:', data);
        result = data;
      } else {
        // Insert new settings
        console.log('Creating new settings...');
        const { data, error } = await supabase
          .from('notification_settings')
          .insert({
            wallet_address: walletAddress,
            ...settings,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating notification settings:', error);
          return false;
        }
        console.log('Settings created successfully:', data);
        result = data;
      }

      return true;
    } catch (error) {
      console.error('Error in updateNotificationSettings:', error);
      return false;
    }
  }

  async updateSecuritySettings(walletAddress: string, settings: Partial<SecuritySettings>) {
    try {
      const { data, error } = await supabase
        .from("security_settings")
        .upsert({
          wallet_address: walletAddress,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating security settings:", error)
      throw error
    }
  }

  async updateDashboardPreferences(walletAddress: string, preferences: Partial<DashboardPreferences>) {
    try {
      const { data, error } = await supabase
        .from("dashboard_preferences")
        .upsert({
          wallet_address: walletAddress,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating dashboard preferences:", error)
      throw error
    }
  }

  async getAllSettings(walletAddress: string) {
    try {
      const [
        preferences,
        profile,
        notifications,
        security,
        dashboard
      ] = await Promise.all([
        this.getPreferences(walletAddress),
        this.getProfile(walletAddress),
        this.getNotificationSettings(walletAddress),
        this.getSecuritySettings(walletAddress),
        this.getDashboardPreferences(walletAddress)
      ])

      return {
        preferences,
        profile,
        notifications,
        security,
        dashboard
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      throw error
    }
  }

  async getProfile(walletAddress: string) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single()

      if (error && error.code !== "PGRST116") throw error
      return data
    } catch (error) {
      console.error("Error fetching profile:", error)
      return null
    }
  }

  private async getPreferences(walletAddress: string) {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single()
    if (error) throw error
    return data
  }

  private async getNotificationSettings(walletAddress: string) {
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single()
    if (error) throw error
    return data
  }

  private async getSecuritySettings(walletAddress: string) {
    const { data, error } = await supabase
      .from("security_settings")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single()
    if (error) throw error
    return data
  }

  private async getDashboardPreferences(walletAddress: string) {
    const { data, error } = await supabase
      .from("dashboard_preferences")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single()
    if (error) throw error
    return data
  }
} 