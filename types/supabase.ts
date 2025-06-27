export type Database = {
  public: {
    Tables: {
      community_posts: {
        Row: {
          id: string
          content: string
          image_url: string | null
          tags: string[] | null
          is_ai_generated: boolean
          accuracy_percentage: number | null
          likes_count: number
          comments_count: number
          shares_count: number
          created_at: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          id?: string
          content: string
          image_url?: string | null
          tags?: string[] | null
          is_ai_generated?: boolean
          accuracy_percentage?: number | null
          likes_count?: number
          comments_count?: number
          shares_count?: number
          created_at?: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          id?: string
          content?: string
          image_url?: string | null
          tags?: string[] | null
          is_ai_generated?: boolean
          accuracy_percentage?: number | null
          likes_count?: number
          comments_count?: number
          shares_count?: number
          created_at?: string
          updated_at?: string
          wallet_address?: string
        }
      }
      community_comments: {
        Row: {
          id: string
          post_id: string
          content: string
          created_at: string
          wallet_address: string
        }
        Insert: {
          id?: string
          post_id: string
          content: string
          created_at?: string
          wallet_address: string
        }
        Update: {
          id?: string
          post_id?: string
          content?: string
          created_at?: string
          wallet_address?: string
        }
      }
      community_post_likes: {
        Row: {
          id: string
          post_id: string
          wallet_address: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          wallet_address: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          wallet_address?: string
          created_at?: string
        }
      }
      community_follows: {
        Row: {
          id: string
          follower_wallet: string
          following_wallet: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_wallet: string
          following_wallet: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_wallet?: string
          following_wallet?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          wallet_address: string
          username: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_agents: {
        Row: {
          id: string
          name: string
          type: string
          description: string | null
          is_active: boolean
          wallet_address: string
          configuration: Record<string, any> | null
          performance_metrics: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          description?: string | null
          is_active?: boolean
          wallet_address: string
          configuration?: Record<string, any> | null
          performance_metrics?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          description?: string | null
          is_active?: boolean
          wallet_address?: string
          configuration?: Record<string, any> | null
          performance_metrics?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 