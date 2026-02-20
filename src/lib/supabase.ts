import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

let supabaseInstance

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables not set. Auth features will be disabled.')
  supabaseInstance = createClient<Database>('https://placeholder.supabase.co', 'placeholder')
} else {
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })
}

export const supabase = supabaseInstance

// Export types for convenience
export type { Database }
