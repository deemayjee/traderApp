import { supabaseAdmin } from '@/lib/supabase/server-admin'

export async function auth() {
  const { data: { session }, error } = await supabaseAdmin.auth.getSession()
  
  if (error || !session) {
    return null
  }
  
  return session
} 