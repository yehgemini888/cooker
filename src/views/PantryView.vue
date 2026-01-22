<script setup lang="ts">
import { computed } from 'vue'
import { usePantryStore } from '@/stores/pantry'
import { useFoodStore } from '@/stores/food'
import { useRouter } from 'vue-router'
import { getIngredientImageUrl, hasLocalImage } from '@/composables/useIngredientImage'
import type { Ingredient } from '@/types'

const router = useRouter()
const pantryStore = usePantryStore()
const foodStore = useFoodStore()

// 分類設定
const categories = [
  { id: 'grain', label: '穀物類', emoji: '🌾', color: 'amber' },
  { id: 'vegetable', label: '蔬菜類', emoji: '🥬', color: 'green' },
  { id: 'fruit', label: '水果類', emoji: '🍎', color: 'pink' },
  { id: 'protein', label: '蛋白質類', emoji: '🥩', color: 'red' },
  { id: 'dairy', label: '乳製品類', emoji: '🥛', color: 'purple' },
  { id: 'other', label: '其他', emoji: '🧂', color: 'gray' },
]

// 按分類取得食材
function getIngredientsByCategory(categoryId: string): Ingredient[] {
  return foodStore.ingredients.filter(ing => ing.category === categoryId)
}

// 檢查是否在冰箱中
function isInPantry(ingredientId: string): boolean {
  return pantryStore.hasItem(ingredientId)
}

// 切換食材狀態
function toggleIngredient(ingredientId: string) {
  pantryStore.toggleItem(ingredientId)
}

// 取得圖片 URL
function getImageUrl(ingredient: Ingredient): string {
  if (hasLocalImage(ingredient.id)) {
    return getIngredientImageUrl(ingredient.id)
  }
  return ingredient.imageUrl || 'https://placehold.co/80x80/e2e8f0/64748b?text=Food'
}

// 導航到食材詳情
function goToIngredient(ingredientId: string) {
  router.push(`/ingredient/${ingredientId}`)
}

// 統計
const totalInPantry = computed(() => pantryStore.getStockCount())
const totalIngredients = computed(() => foodStore.ingredients.length)

// 清空冰箱
function clearPantry() {
  if (confirm('確定要清空冰箱嗎？')) {
    pantryStore.clearAll()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 pb-24">
    <!-- Header -->
    <header class="bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg sticky top-0 z-20">
      <div class="px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold flex items-center gap-2">
            <span>🧊</span>
            <span>我的冰箱</span>
          </h1>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-2xl font-bold">{{ totalInPantry }}</p>
              <p class="text-xs opacity-80">/ {{ totalIngredients }} 種食材</p>
            </div>
            <button
              v-if="totalInPantry > 0"
              @click="clearPantry"
              class="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              清空
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 食材列表（全螢幕寬度） -->
    <div class="px-4 py-4 space-y-6">
      <div
        v-for="category in categories"
        :key="category.id"
        v-show="getIngredientsByCategory(category.id).length > 0"
        class="bg-white rounded-2xl shadow-md overflow-hidden"
      >
        <!-- 分類標題 -->
        <div 
          class="px-4 py-3 flex items-center justify-between"
          :class="{
            'bg-amber-50': category.color === 'amber',
            'bg-green-50': category.color === 'green',
            'bg-pink-50': category.color === 'pink',
            'bg-red-50': category.color === 'red',
            'bg-purple-50': category.color === 'purple',
            'bg-gray-50': category.color === 'gray',
          }"
        >
          <h2 class="font-semibold text-gray-700 flex items-center gap-2">
            <span class="text-lg">{{ category.emoji }}</span>
            <span>{{ category.label }}</span>
          </h2>
          <span class="text-sm text-gray-500">
            {{ getIngredientsByCategory(category.id).filter(i => isInPantry(i.id)).length }}
            / {{ getIngredientsByCategory(category.id).length }}
          </span>
        </div>

        <!-- 食材格子 -->
        <div class="p-3 grid grid-cols-4 gap-2">
          <div
            v-for="ingredient in getIngredientsByCategory(category.id)"
            :key="ingredient.id"
            class="relative"
          >
            <!-- 勾選按鈕 -->
            <button
              @click="toggleIngredient(ingredient.id)"
              class="w-full aspect-square rounded-xl border-2 p-1 transition-all duration-200 flex flex-col items-center justify-center"
              :class="isInPantry(ingredient.id)
                ? 'border-cyan-500 bg-cyan-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'"
            >
              <!-- 勾選圖示 -->
              <div
                v-if="isInPantry(ingredient.id)"
                class="absolute top-1 right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center"
              >
                <span class="text-white text-xs">✓</span>
              </div>
              
              <!-- 食材圖片 -->
              <img
                :src="getImageUrl(ingredient)"
                :alt="ingredient.name"
                class="w-10 h-10 object-contain"
                :class="{ 'opacity-40 grayscale': !isInPantry(ingredient.id) }"
                loading="lazy"
                @error="($event.target as HTMLImageElement).src = 'https://placehold.co/80x80/e2e8f0/64748b?text=Food'"
              />
              
              <!-- 食材名稱 -->
              <p 
                class="text-xs mt-1 text-center truncate w-full px-1"
                :class="isInPantry(ingredient.id) ? 'text-gray-800 font-medium' : 'text-gray-400'"
              >
                {{ ingredient.name }}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部提示 -->
    <div v-if="totalInPantry === 0" class="px-4 mt-8">
      <div class="bg-white rounded-2xl shadow-md p-6 text-center">
        <div class="text-5xl mb-3">🧊</div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">冰箱是空的</h3>
        <p class="text-gray-500 text-sm">點擊上方食材加入冰箱庫存</p>
      </div>
    </div>
  </div>
</template>
