<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFoodStore } from '@/stores/food'
import { useUserStore } from '@/stores/user'
import { usePantryStore } from '@/stores/pantry'
import IngredientCard from '@/components/IngredientCard.vue'
import type { Ingredient } from '@/types'

const router = useRouter()
const foodStore = useFoodStore()
const userStore = useUserStore()
const pantryStore = usePantryStore()

// 篩選器
const categoryFilter = ref<string>('all')
const statusFilter = ref<string>('all')

// 分類選項
const categories = [
  { value: 'all', label: '全部', emoji: '📋' },
  { value: 'grain', label: '穀物', emoji: '🌾' },
  { value: 'vegetable', label: '蔬菜', emoji: '🥬' },
  { value: 'fruit', label: '水果', emoji: '🍎' },
  { value: 'protein', label: '蛋白質', emoji: '🥩' },
]

// 狀態選項
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'tried', label: '已嘗試' },
  { value: 'not_tried', label: '未嘗試' },
  { value: 'allergy', label: '過敏' },
  { value: 'in_pantry', label: '冰箱有' },
]

// 篩選後的食材
const filteredIngredients = computed(() => {
  return foodStore.ingredients.filter((ingredient) => {
    if (categoryFilter.value !== 'all' && ingredient.category !== categoryFilter.value) {
      return false
    }
    const state = userStore.getIngredientState(ingredient.id)
    if (statusFilter.value === 'tried' && state.status !== 'tried') return false
    if (statusFilter.value === 'not_tried' && state.status !== 'not_tried') return false
    if (statusFilter.value === 'allergy' && !state.allergy) return false
    if (statusFilter.value === 'in_pantry' && !pantryStore.hasItem(ingredient.id)) return false
    return true
  })
})

// 統計數據
const stats = computed(() => {
  let tried = 0, allergy = 0, inPantry = 0
  foodStore.ingredients.forEach((ingredient) => {
    const state = userStore.getIngredientState(ingredient.id)
    if (state.status === 'tried') tried++
    if (state.allergy) allergy++
    if (pantryStore.hasItem(ingredient.id)) inPantry++
  })
  return { tried, allergy, inPantry, total: foodStore.ingredients.length }
})

// 導航到食材詳情頁
function openIngredientDetail(ingredient: Ingredient) {
  router.push(`/ingredient/${ingredient.id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 pb-8">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-20">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <router-link to="/" class="text-gray-600 hover:text-primary-500 transition-colors">
            ← 返回
          </router-link>
          <h1 class="text-xl font-bold text-gray-800">🥕 食材圖鑑</h1>
          <div class="w-12"></div>
        </div>
      </div>
    </header>

    <!-- 統計卡片 -->
    <div class="container mx-auto px-4 py-4">
      <div class="grid grid-cols-4 gap-3">
        <div class="bg-white rounded-xl shadow-md p-3 text-center">
          <p class="text-2xl font-bold text-gray-800">{{ stats.total }}</p>
          <p class="text-xs text-gray-500">總食材</p>
        </div>
        <div class="bg-white rounded-xl shadow-md p-3 text-center">
          <p class="text-2xl font-bold text-green-500">{{ stats.tried }}</p>
          <p class="text-xs text-gray-500">已嘗試</p>
        </div>
        <div class="bg-white rounded-xl shadow-md p-3 text-center">
          <p class="text-2xl font-bold text-red-500">{{ stats.allergy }}</p>
          <p class="text-xs text-gray-500">過敏</p>
        </div>
        <div class="bg-white rounded-xl shadow-md p-3 text-center">
          <p class="text-2xl font-bold text-cyan-500">{{ stats.inPantry }}</p>
          <p class="text-xs text-gray-500">冰箱有</p>
        </div>
      </div>
    </div>

    <!-- 分類篩選 -->
    <div class="container mx-auto px-4 mb-4">
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="cat in categories"
          :key="cat.value"
          @click="categoryFilter = cat.value"
          class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
          :class="categoryFilter === cat.value
            ? 'bg-primary-500 text-white shadow-md'
            : 'bg-white text-gray-600 hover:bg-gray-100 shadow'"
        >
          {{ cat.emoji }} {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- 狀態篩選 -->
    <div class="container mx-auto px-4 mb-4">
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="status in statusOptions"
          :key="status.value"
          @click="statusFilter = status.value"
          class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
          :class="statusFilter === status.value
            ? 'bg-gray-800 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          {{ status.label }}
        </button>
      </div>
    </div>

    <!-- 食材網格 -->
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-3 gap-4">
        <IngredientCard
          v-for="ingredient in filteredIngredients"
          :key="ingredient.id"
          :ingredient="ingredient"
          :min-month="4"
          @click="openIngredientDetail"
        />
      </div>

      <!-- 空狀態 -->
      <div
        v-if="filteredIngredients.length === 0"
        class="text-center py-16 text-gray-500"
      >
        <p class="text-5xl mb-4">🔍</p>
        <p>沒有符合條件的食材</p>
      </div>
    </div>
  </div>
</template>
