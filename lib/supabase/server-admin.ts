import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Only create the admin client if we're on the server side
let adminClient: ReturnType<typeof createClient<Database>> | null = null

if (typeof window === 'undefined') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'pallytraders-server'
      }
    }
  })
}

export const supabaseAdmin = adminClient 