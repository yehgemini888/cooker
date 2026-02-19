import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Auth features will be disabled.')
  // 創建一個 dummy client 以避免應用崩潰
  supabaseInstance = createClient<Database>(
    'https://dummy.supabase.co',
    'dummy-key'
  )
} else {
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

export const supabase = supabaseInstance

// Export types for convenience
export type { Database }
