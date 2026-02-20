<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, type IngredientState } from '@/stores/user'
import { useFoodStore } from '@/stores/food'
import { usePantryStore } from '@/stores/pantry'
import { useAuthStore } from '@/stores/auth'
import { getIngredientImageUrl, hasLocalImage } from '@/composables/useIngredientImage'
import type { Ingredient } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const foodStore = useFoodStore()
const pantryStore = usePantryStore()
const authStore = useAuthStore()

async function handleSignOut() {
  await authStore.signOut()
  router.push('/auth')
}

// 編輯模式
const isEditingProfile = ref(false)
const editName = ref(userStore.babyName)
const editBirthday = ref(userStore.birthday)

// 篩選器
const categoryFilter = ref<string>('all')

// 分類選項
const categories = [
  { value: 'all', label: '全部', emoji: '📋' },
  { value: 'grain', label: '穀物', emoji: '🌾' },
  { value: 'vegetable', label: '蔬菜', emoji: '🥬' },
  { value: 'fruit', label: '水果', emoji: '🍎' },
  { value: 'protein', label: '蛋白質', emoji: '🥩' },
  { value: 'dairy', label: '乳製品', emoji: '🥛' },
]

// 食材探索牆：已嘗試排前面，未嘗試排後面
const explorationIngredients = computed(() => {
  let filtered = foodStore.ingredients
  
  // 分類篩選
  if (categoryFilter.value !== 'all') {
    filtered = filtered.filter(ing => ing.category === categoryFilter.value)
  }
  
  // 依嘗試狀態排序：已嘗試 > 未嘗試
  return [...filtered].sort((a, b) => {
    const stateA = userStore.getIngredientState(a.id)
    const stateB = userStore.getIngredientState(b.id)
    
    // 已嘗試排前面
    if (stateA.status === 'tried' && stateB.status !== 'tried') return -1
    if (stateA.status !== 'tried' && stateB.status === 'tried') return 1
    
    return 0
  })
})

// 儲存寶寶資料
function saveProfile() {
  userStore.setBabyInfo(editName.value, editBirthday.value)
  isEditingProfile.value = false
}

// 取消編輯
function cancelEdit() {
  editName.value = userStore.babyName
  editBirthday.value = userStore.birthday
  isEditingProfile.value = false
}

// 導航到食材詳情
function goToIngredient(ingredient: Ingredient) {
  router.push(`/ingredient/${ingredient.id}`)
}

// 取得圖片 URL
function getImageUrl(ingredientId: string, fallbackUrl?: string): string {
  if (hasLocalImage(ingredientId)) {
    return getIngredientImageUrl(ingredientId)
  }
  return fallbackUrl || 'https://placehold.co/200x200/e2e8f0/64748b?text=Food'
}

// 取得食材狀態
function getState(ingredientId: string) {
  return userStore.getIngredientState(ingredientId)
}

// 是否已嘗試
function isTried(ingredientId: string): boolean {
  return getState(ingredientId).status === 'tried'
}

// 是否過敏
function hasAllergy(ingredientId: string): boolean {
  return getState(ingredientId).allergy
}

// 是否在冰箱
function isInPantry(ingredientId: string): boolean {
  return pantryStore.hasItem(ingredientId)
}

// 是否高風險
function isHighRisk(ingredient: Ingredient): boolean {
  return ingredient.allergy_risk === true
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 pb-24">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-20">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="w-10"></div>
          <h1 class="text-xl font-bold text-gray-800">👶 寶寶資料</h1>
          <button
            @click="handleSignOut"
            :disabled="authStore.loading"
            class="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="登出"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-4">
      <!-- 寶寶資料卡片 -->
      <div class="bg-white rounded-2xl shadow-lg p-5 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800">寶寶資訊</h2>
          <button
            v-if="!isEditingProfile"
            @click="isEditingProfile = true"
            class="text-primary-500 hover:text-primary-600 text-sm font-medium"
          >
            ✏️ 編輯
          </button>
        </div>

        <!-- 顯示模式 -->
        <div v-if="!isEditingProfile" class="space-y-3">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-3xl shadow-lg">
              👶
            </div>
            <div>
              <p class="text-xl font-bold text-gray-800">
                {{ userStore.babyName || '點擊編輯設定寶寶資料' }}
              </p>
              <p class="text-gray-500">
                {{ userStore.getAgeDisplay }}
              </p>
            </div>
          </div>

          <!-- 統計數據 -->
          <div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div class="text-center">
              <p class="text-2xl font-bold text-green-500">{{ userStore.triedIngredientsCount }}</p>
              <p class="text-xs text-gray-500">已嘗試</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-red-500">{{ userStore.allergyIngredientsCount }}</p>
              <p class="text-xs text-gray-500">過敏食材</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-500">{{ foodStore.ingredients.length }}</p>
              <p class="text-xs text-gray-500">總食材數</p>
            </div>
          </div>
        </div>

        <!-- 編輯模式 -->
        <div v-else class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">寶寶名稱</label>
            <input
              v-model="editName"
              type="text"
              placeholder="輸入寶寶的名字"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
            <input
              v-model="editBirthday"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div class="flex gap-2">
            <button
              @click="saveProfile"
              class="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              儲存
            </button>
            <button
              @click="cancelEdit"
              class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              取消
            </button>
          </div>
        </div>
      </div>

      <!-- 食材探索牆 -->
      <div class="bg-white rounded-2xl shadow-lg p-5">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🗺️</span>
          <span>食材探索牆</span>
        </h2>
        
        <!-- 分類篩選 -->
        <div class="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          <button
            v-for="cat in categories"
            :key="cat.value"
            @click="categoryFilter = cat.value"
            class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
            :class="categoryFilter === cat.value
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            {{ cat.emoji }} {{ cat.label }}
          </button>
        </div>

        <!-- 食材網格 -->
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="ingredient in explorationIngredients"
            :key="ingredient.id"
            @click="goToIngredient(ingredient)"
            class="relative bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 border"
            :class="{
              'border-green-400': isTried(ingredient.id) && !hasAllergy(ingredient.id),
              'border-red-400': hasAllergy(ingredient.id),
              'border-gray-200': !isTried(ingredient.id) && !hasAllergy(ingredient.id)
            }"
          >
            <!-- Badge 區域：右上角 -->
            <div class="absolute top-1 right-1 flex flex-wrap gap-0.5 z-10 max-w-[60%] justify-end">
              <!-- 冰箱有 -->
              <span
                v-if="isInPantry(ingredient.id)"
                class="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center shadow text-xs"
                title="冰箱有"
              >
                🧊
              </span>
              <!-- 高風險 -->
              <span
                v-if="isHighRisk(ingredient) && !hasAllergy(ingredient.id)"
                class="w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center shadow text-xs"
                title="高過敏風險"
              >
                ⚠️
              </span>
              <!-- 過敏 -->
              <span
                v-if="hasAllergy(ingredient.id)"
                class="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow text-xs animate-pulse"
                title="過敏"
              >
                ❗
              </span>
              <!-- 已嘗試 -->
              <span
                v-if="isTried(ingredient.id)"
                class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow text-xs"
                title="已嘗試"
              >
                ✅
              </span>
            </div>

            <!-- 圖片區域 -->
            <div 
              class="aspect-square p-2 bg-white"
              :class="{
                'grayscale opacity-50': !isTried(ingredient.id),
                '': isTried(ingredient.id)
              }"
            >
              <img
                :src="getImageUrl(ingredient.id, ingredient.imageUrl)"
                :alt="ingredient.name"
                class="w-full h-full object-contain rounded-lg"
                loading="lazy"
                @error="($event.target as HTMLImageElement).src = 'https://placehold.co/200x200/e2e8f0/64748b?text=Food'"
              />
            </div>

            <!-- 名稱 -->
            <div class="p-2 text-center">
              <p 
                class="text-sm font-medium truncate"
                :class="{
                  'text-gray-800': isTried(ingredient.id),
                  'text-gray-400': !isTried(ingredient.id)
                }"
              >
                {{ ingredient.name }}
              </p>
            </div>

            <!-- 底部狀態條 -->
            <div
              class="h-1 w-full"
              :class="{
                'bg-green-500': isTried(ingredient.id) && !hasAllergy(ingredient.id),
                'bg-red-500': hasAllergy(ingredient.id),
                'bg-gray-200': !isTried(ingredient.id) && !hasAllergy(ingredient.id)
              }"
            ></div>
          </div>
        </div>

        <!-- 空狀態 -->
        <div
          v-if="explorationIngredients.length === 0"
          class="text-center py-12 text-gray-500"
        >
          <p class="text-4xl mb-2">🔍</p>
          <p>沒有符合篩選條件的食材</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
