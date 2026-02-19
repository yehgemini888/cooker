<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()

// Tab 切換
const activeTab = ref<'login' | 'signup'>('login')

// 表單數據
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

// 驗證
const emailError = computed(() => {
  if (!email.value) return ''
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value) ? '' : '請輸入有效的電子郵件'
})

const passwordError = computed(() => {
  if (!password.value) return ''
  return password.value.length >= 6 ? '' : '密碼至少需要 6 個字元'
})

const confirmPasswordError = computed(() => {
  if (activeTab.value === 'login') return ''
  if (!confirmPassword.value) return ''
  return password.value === confirmPassword.value ? '' : '密碼不一致'
})

const isFormValid = computed(() => {
  if (activeTab.value === 'login') {
    return email.value && password.value && !emailError.value && !passwordError.value
  }
  return (
    email.value &&
    password.value &&
    confirmPassword.value &&
    !emailError.value &&
    !passwordError.value &&
    !confirmPasswordError.value
  )
})

// 提交表單
async function handleSubmit() {
  if (!isFormValid.value) return

  try {
    if (activeTab.value === 'login') {
      await authStore.signIn(email.value, password.value)
      // 登入成功後載入雲端資料
      await userStore.loadFromCloud()
      router.push('/profile')
    } else {
      await authStore.signUp(email.value, password.value)
      // 註冊成功提示
      alert('註冊成功！請檢查您的電子郵件以驗證帳戶。')
      // 切換到登入 tab
      activeTab.value = 'login'
      password.value = ''
      confirmPassword.value = ''
    }
  } catch (err: any) {
    console.error('Auth error:', err)
    // 錯誤已經在 authStore.error 中
  }
}

// 切換 Tab
function switchTab(tab: 'login' | 'signup') {
  activeTab.value = tab
  authStore.error = null
  password.value = ''
  confirmPassword.value = ''
}

// 離線模式繼續
function continueOffline() {
  router.push('/profile')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-orange-50 to-green-50 flex flex-col items-center justify-center px-4 py-8">
    <!-- Logo 區域 -->
    <div class="text-center mb-8">
      <div class="text-6xl mb-4">🍼</div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">寶寶副食品助手</h1>
      <p class="text-gray-600">記錄寶寶的飲食探索之旅</p>
    </div>

    <!-- Auth 卡片 -->
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
      <!-- Tab 切換 -->
      <div class="flex border-b border-gray-200">
        <button
          @click="switchTab('login')"
          :class="[
            'flex-1 py-4 text-center font-medium transition-colors',
            activeTab === 'login'
              ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          ]"
        >
          登入
        </button>
        <button
          @click="switchTab('signup')"
          :class="[
            'flex-1 py-4 text-center font-medium transition-colors',
            activeTab === 'signup'
              ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          ]"
        >
          註冊
        </button>
      </div>

      <!-- 表單區域 -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- 錯誤訊息 -->
        <div
          v-if="authStore.error"
          class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          {{ authStore.error }}
        </div>

        <!-- Email 輸入 -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            電子郵件
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            :disabled="authStore.loading"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="your@email.com"
          />
          <p v-if="emailError" class="mt-1 text-sm text-red-600">{{ emailError }}</p>
        </div>

        <!-- 密碼輸入 -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            密碼
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            :disabled="authStore.loading"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="至少 6 個字元"
          />
          <p v-if="passwordError" class="mt-1 text-sm text-red-600">{{ passwordError }}</p>
        </div>

        <!-- 確認密碼（僅註冊時） -->
        <div v-if="activeTab === 'signup'">
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
            確認密碼
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            :disabled="authStore.loading"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="再次輸入密碼"
          />
          <p v-if="confirmPasswordError" class="mt-1 text-sm text-red-600">
            {{ confirmPasswordError }}
          </p>
        </div>

        <!-- 提交按鈕 -->
        <button
          type="submit"
          :disabled="!isFormValid || authStore.loading"
          class="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
        >
          <span v-if="authStore.loading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            處理中...
          </span>
          <span v-else>
            {{ activeTab === 'login' ? '登入' : '註冊' }}
          </span>
        </button>

        <!-- 離線模式 -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">或</span>
          </div>
        </div>

        <button
          type="button"
          @click="continueOffline"
          class="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 transition-all"
        >
          離線模式繼續使用
        </button>
      </form>
    </div>

    <!-- 底部說明 -->
    <div class="mt-8 text-center text-sm text-gray-600 max-w-md">
      <p class="mb-2">💡 提示：</p>
      <ul class="text-left space-y-1 list-disc list-inside">
        <li>登入後可雲端同步資料</li>
        <li>離線模式使用本地儲存</li>
        <li>資料僅存於您的設備或帳戶中</li>
      </ul>
    </div>
  </div>
</template>
