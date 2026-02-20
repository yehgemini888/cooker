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

  // 註冊
  async function signUp(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) throw err
      return data
    } catch (err: any) {
      error.value = err.message
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
      error.value = err.message
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
      
      // 登出成功後重置 userStore 的數據加載標志
      const userStore = useUserStore()
      userStore.resetDataLoaded()
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
