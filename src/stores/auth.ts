import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { useUserStore } from './user'
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  // 初始化：監聽 Auth 狀態變化
  async function initialize() {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, skipping auth initialization')
      initialized.value = true
      return
    }
    try {
      // 1. 取得當前 session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      session.value = currentSession
      user.value = currentSession?.user ?? null

      // 2. 監聽後續變化
      supabase.auth.onAuthStateChange((_event: AuthChangeEvent, newSession: Session | null) => {
        session.value = newSession
        user.value = newSession?.user ?? null
      })
    } catch (err: any) {
      console.error('Auth initialization error:', err)
      error.value = err.message
    } finally {
      initialized.value = true
    }
  }

  // 錯誤訊息中文化
  function translateAuthError(message: string): string {
    const errorMap: Record<string, string> = {
      'User already registered': '此電子郵件已被註冊，請直接登入',
      'Invalid login credentials': '電子郵件或密碼錯誤，請重新確認',
      'Email not confirmed': '請先至信箱確認您的電子郵件後再登入',
      'Password should be at least 6 characters': '密碼至少需要 6 個字元',
      'Unable to validate email address: invalid format': '請輸入有效的電子郵件地址',
      'Email link is invalid or has expired': '確認連結已失效，請重新註冊',
      'Token has expired or is invalid': '連結已失效，請重新操作',
      'Too many requests': '操作過於頻繁，請稍後再試',
      'Signup is disabled': '目前不開放新帳號註冊',
    }
    for (const [key, value] of Object.entries(errorMap)) {
      if (message.includes(key)) return value
    }
    return message
  }

  // 註冊
  async function signUp(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const redirectUrl = `${window.location.origin}${import.meta.env.BASE_URL}`
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      })
      if (err) throw err
      // 若 identities 為空陣列，表示 email 已被註冊
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('User already registered')
      }
      return data
    } catch (err: any) {
      error.value = translateAuthError(err.message)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 登入
  async function signIn(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      // 立即設定 user，不等 onAuthStateChange 回呼
      session.value = data.session
      user.value = data.user
      return data
    } catch (err: any) {
      error.value = translateAuthError(err.message)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function signOut() {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase.auth.signOut()
      if (err) throw err
      
      // 登出成功後清空本地數據
      user.value = null
      session.value = null
      
      // 登出成功後清空所有使用者資料（含 localStorage）
      const userStore = useUserStore()
      userStore.clearAllData()
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return { 
    user, 
    session, 
    loading, 
    error, 
    initialized,
    isLoggedIn, 
    initialize, 
    signUp, 
    signIn, 
    signOut 
  }
})
