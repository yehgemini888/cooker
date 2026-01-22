<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFoodStore } from '@/stores/food'
import { useUserStore, type RecipeRating } from '@/stores/user'
import { usePantryStore } from '@/stores/pantry'
import { getIngredientImageUrl as getLocalImageUrl, hasLocalImage } from '@/composables/useIngredientImage'
import type { Ingredient, Recipe } from '@/types'

const route = useRoute()
const router = useRouter()
const foodStore = useFoodStore()
const userStore = useUserStore()
const pantryStore = usePantryStore()

// 取得食譜 ID
const recipeId = computed(() => route.params.id as string)

// 取得食譜資料
const recipe = computed<Recipe | undefined>(() => {
  return foodStore.recipes.find(r => r.id === recipeId.value)
})

// Helper: 取得食材資訊
function getIngredientInfo(id: string): Ingredient {
  const found = foodStore.getIngredientById(id)
  if (found) {
    return found
  }
  return {
    id,
    name: id,
    category: 'other',
    imageUrl: 'https://placehold.co/200x200?text=Food',
  }
}

// Helper: 取得食材圖片 URL
function getIngredientImageUrl(id: string): string {
  if (hasLocalImage(id)) {
    return getLocalImageUrl(id)
  }
  const ingredient = getIngredientInfo(id)
  return ingredient.imageUrl || 'https://placehold.co/200x200/e2e8f0/64748b?text=Food'
}

// 是否已收藏
const isFavorite = computed(() => {
  return recipe.value ? userStore.isFavoriteRecipe(recipe.value.id) : false
})

// 當前評分
const currentRating = computed(() => {
  return recipe.value ? userStore.getRecipeRating(recipe.value.id) : null
})

// 評分選項
const ratingOptions: { value: 'like' | 'normal' | 'dislike'; emoji: string; label: string }[] = [
  { value: 'like', emoji: '😋', label: '愛' },
  { value: 'normal', emoji: '😐', label: '普通' },
  { value: 'dislike', emoji: '🙁', label: '不愛' },
]

// 取得月齡標籤顏色
function getAgeTagColor(minMonth: number): string {
  if (minMonth <= 6) return 'bg-blue-500'
  if (minMonth <= 9) return 'bg-purple-500'
  return 'bg-orange-500'
}

// 返回上一頁
function goBack() {
  router.back()
}

// 切換收藏
function toggleFavorite() {
  if (recipe.value) {
    userStore.toggleFavoriteRecipe(recipe.value.id)
  }
}

// 設定評分
function setRating(rating: RecipeRating) {
  if (recipe.value) {
    // 如果點擊相同評分，則取消
    if (currentRating.value === rating) {
      userStore.setRecipeRating(recipe.value.id, null)
    } else {
      userStore.setRecipeRating(recipe.value.id, rating)
    }
  }
}

// 導航到食材詳情
function goToIngredient(id: string) {
  router.push(`/ingredient/${id}`)
}

// 取得食材狀態標籤
function getIngredientBadges(id: string): { icon: string; label: string; color: string }[] {
  const badges: { icon: string; label: string; color: string }[] = []
  const ingredient = getIngredientInfo(id)
  const state = userStore.getIngredientState(id)
  
  // 冰箱有
  if (pantryStore.hasItem(id)) {
    badges.push({ icon: '🧊', label: '冰箱有', color: 'bg-cyan-100 text-cyan-700' })
  }
  
  // 已嘗試
  if (state.status === 'tried') {
    badges.push({ icon: '✅', label: '已嘗試', color: 'bg-green-100 text-green-700' })
  }
  
  // 過敏
  if (state.allergy) {
    badges.push({ icon: '❗', label: '過敏', color: 'bg-red-100 text-red-700' })
  }
  
  // 高風險
  if (ingredient.allergy_risk) {
    badges.push({ icon: '⚠️', label: '高風險', color: 'bg-orange-100 text-orange-700' })
  }
  
  return badges
}
</script>

<template>
  <div v-if="recipe" class="min-h-screen bg-gray-50">
    <!-- Header 圖片區 -->
    <div class="relative">
      <!-- 返回按鈕 -->
      <button
        @click="goBack"
        class="absolute top-4 left-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-md"
      >
        ←
      </button>

      <!-- 收藏按鈕 -->
      <button
        @click="toggleFavorite"
        class="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-md"
      >
        {{ isFavorite ? '❤️' : '🤍' }}
      </button>

      <!-- 食譜圖片 -->
      <div class="h-56 bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center relative">
        <span class="text-8xl">🍲</span>
        <!-- 漸層遮罩 -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        <!-- 食譜資訊 -->
        <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div class="flex items-center gap-2 mb-2">
            <span
              class="px-3 py-1 rounded-full text-xs font-medium text-white"
              :class="getAgeTagColor(recipe.min_month)"
            >
              {{ recipe.min_month }}-{{ recipe.max_month }}M
            </span>
            <span
              v-for="tag in recipe.nutrition_tags.slice(0, 2)"
              :key="tag"
              class="px-2 py-1 rounded-full text-xs bg-white/20 backdrop-blur"
            >
              {{ tag }}
            </span>
          </div>
          <h1 class="text-2xl font-bold">{{ recipe.title }}</h1>
        </div>
      </div>
    </div>

    <!-- 內容區 -->
    <div class="container mx-auto px-4 py-6 space-y-6">
      <!-- 寶寶愛評分 -->
      <div class="bg-white rounded-2xl p-5 shadow-md">
        <h2 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-xl">👶</span>
          寶寶愛嗎？
        </h2>
        <div class="flex gap-3">
          <button
            v-for="option in ratingOptions"
            :key="option.value"
            @click="setRating(option.value)"
            class="flex-1 py-3 px-4 rounded-xl font-medium transition-all flex flex-col items-center gap-1"
            :class="currentRating === option.value
              ? option.value === 'like'
                ? 'bg-green-100 ring-2 ring-green-500 text-green-700'
                : option.value === 'normal'
                  ? 'bg-gray-100 ring-2 ring-gray-400 text-gray-700'
                  : 'bg-red-100 ring-2 ring-red-500 text-red-700'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'"
          >
            <span class="text-2xl">{{ option.emoji }}</span>
            <span class="text-sm">{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- 所需食材 -->
      <div class="bg-white rounded-2xl p-5 shadow-md">
        <h2 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-xl">🥕</span>
          所需食材 ({{ recipe.ingredient_ids.length }})
        </h2>

        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="id in recipe.ingredient_ids"
            :key="id"
            @click="goToIngredient(id)"
            class="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
            :class="{
              'ring-2 ring-red-400': userStore.getIngredientState(id).allergy
            }"
          >
            <!-- 食材圖片 -->
            <div
              class="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white ring-2"
              :class="pantryStore.hasItem(id) ? 'ring-cyan-400' : 'ring-gray-200'"
            >
              <img
                :src="getIngredientImageUrl(id)"
                :alt="getIngredientInfo(id).name"
                class="w-full h-full object-contain"
                @error="($event.target as HTMLImageElement).src = 'https://placehold.co/200x200/e2e8f0/64748b?text=Food'"
              />
            </div>
            
            <!-- 食材資訊 -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-800 truncate">
                {{ getIngredientInfo(id).name }}
              </p>
              
              <!-- 狀態標籤 -->
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="badge in getIngredientBadges(id)"
                  :key="badge.label"
                  class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs"
                  :class="badge.color"
                >
                  <span>{{ badge.icon }}</span>
                  <span>{{ badge.label }}</span>
                </span>
                
                <!-- 需購買標籤（只在沒有其他標籤時顯示） -->
                <span
                  v-if="getIngredientBadges(id).length === 0 || (!pantryStore.hasItem(id) && getIngredientBadges(id).every(b => b.label !== '冰箱有'))"
                  class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700"
                >
                  <span>🛒</span>
                  <span>需購買</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 製作步驟 -->
      <div class="bg-white rounded-2xl p-5 shadow-md">
        <h2 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-xl">📝</span>
          製作步驟
        </h2>

        <ol class="space-y-4">
          <li
            v-for="(step, index) in recipe.steps"
            :key="index"
            class="flex gap-4"
          >
            <span class="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
              {{ index + 1 }}
            </span>
            <span class="text-gray-700 pt-1">{{ step }}</span>
          </li>
        </ol>
      </div>

      <!-- 小提示 -->
      <div class="bg-amber-50 rounded-2xl p-5 border border-amber-100">
        <h2 class="font-semibold text-amber-800 mb-2 flex items-center gap-2">
          <span class="text-xl">💡</span>
          媽媽小撇步
        </h2>
        <p class="text-amber-700">{{ recipe.tips }}</p>
      </div>

      <!-- 營養標籤 -->
      <div class="bg-green-50 rounded-2xl p-5 border border-green-100">
        <h2 class="font-semibold text-green-800 mb-3 flex items-center gap-2">
          <span class="text-xl">🥗</span>
          營養價值
        </h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="tag in recipe.nutrition_tags"
            :key="tag"
            class="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>

    <!-- 底部操作列 -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3">
      <button
        @click="toggleFavorite"
        class="flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        :class="isFavorite
          ? 'bg-red-100 text-red-600'
          : 'bg-gray-100 text-gray-600'"
      >
        <span>{{ isFavorite ? '❤️' : '🤍' }}</span>
        <span>{{ isFavorite ? '已收藏' : '收藏' }}</span>
      </button>
      <button
        @click="setRating('like')"
        class="flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        :class="currentRating === 'like'
          ? 'bg-green-500 text-white'
          : 'bg-green-100 text-green-700'"
      >
        <span>😋</span>
        <span>{{ currentRating === 'like' ? '寶寶愛!' : '寶寶愛' }}</span>
      </button>
    </div>

    <!-- 底部安全區 -->
    <div class="h-24"></div>
  </div>

  <!-- 食譜不存在 -->
  <div v-else class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <p class="text-5xl mb-4">🤔</p>
      <p class="text-gray-500 mb-4">找不到此食譜</p>
      <button
        @click="goBack"
        class="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium"
      >
        返回
      </button>
    </div>
  </div>
</template>
