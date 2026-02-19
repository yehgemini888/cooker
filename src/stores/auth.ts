import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => !!user.value)

  // 初始化：監聽 Auth 狀態變化
  async function initialize() {
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
    isLoggedIn, 
    initialize, 
    signUp, 
    signIn, 
    signOut 
  }
})
