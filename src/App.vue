<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BottomNavigation from '@/components/BottomNavigation.vue'
import AuthView from '@/views/AuthView.vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const authReady = ref(false)
const emailConfirmed = ref(false)

onMounted(async () => {
  // 偵測 PKCE 電子郵件確認回調（?code= 查詢參數）
  const hasCode = new URLSearchParams(window.location.search).has('code')

  try {
    // 最多等 5 秒，避免 Supabase 連線失敗時無限卡住
    await Promise.race([
      (async () => {
        await authStore.initialize()
        if (authStore.isLoggedIn) {
          await userStore.loadFromCloud()
        }
      })(),
      new Promise(resolve => setTimeout(resolve, 5000))
    ])
  } catch (e) {
    console.error('Auth init error:', e)
  }
  authReady.value = true

  // 若是從電子郵件確認連結回來且登入成功，顯示成功提示
  if (hasCode && authStore.isLoggedIn) {
    emailConfirmed.value = true
    setTimeout(() => { emailConfirmed.value = false }, 4000)
  }
})

const showBottomNav = computed(() => {
  const hiddenPaths = ['/ingredient/', '/recipe/', '/wizard', '/auth']
  return !hiddenPaths.some(path => route.path.includes(path))
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
    <!-- 載入中 -->
    <div v-if="!authReady" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-4xl mb-4">🍼</div>
        <div class="text-orange-500 text-lg">載入中...</div>
      </div>
    </div>

    <!-- 未登入：顯示登入/註冊頁面 -->
    <AuthView v-else-if="!authStore.isLoggedIn" />

    <!-- 已登入：顯示主要內容 -->
    <template v-else>
      <!-- 電子郵件確認成功提示 -->
      <Transition name="slide-down">
        <div
          v-if="emailConfirmed"
          class="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-3 bg-green-500 text-white font-medium shadow-lg"
        >
          ✅ 電子郵件確認成功，歡迎使用寶寶副食品助手！
        </div>
      </Transition>
      <RouterView v-slot="{ Component }">
        <KeepAlive :max="6">
          <component :is="Component" :key="$route.name" />
        </KeepAlive>
      </RouterView>
      <BottomNavigation v-if="showBottomNav" />
    </template>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
