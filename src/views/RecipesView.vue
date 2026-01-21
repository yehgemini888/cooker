<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSmartRecipes, type ScoredRecipe } from '@/composables/useSmartRecipes'
import { useFoodStore } from '@/stores/food'
import { useUserStore } from '@/stores/user'
import { usePantryStore } from '@/stores/pantry'

const router = useRouter()
const { scoredRecipes, recommendedRecipes } = useSmartRecipes()
const foodStore = useFoodStore()
const userStore = useUserStore()
const pantryStore = usePantryStore()

// 顯示模式
const viewMode = ref<'all' | 'recommended' | 'favorites'>('recommended')

// 冰箱面板展開狀態
const isPantryOpen = ref(false)

// 選中的食譜詳情 (保留用於 Modal 備用)
const selectedRecipe = ref<ScoredRecipe | null>(null)

// 根據顯示模式過濾食譜
const displayedRecipes = computed(() => {
  switch (viewMode.value) {
    case 'recommended':
      return recommendedRecipes.value
    case 'favorites':
      return scoredRecipes.value.filter((sr) =>
        userStore.isFavoriteRecipe(sr.recipe.id)
      )
    default:
      return scoredRecipes.value
  }
})

// 取得月齡標籤顏色
function getAgeTagColor(minMonth: number, maxMonth: number): string {
  if (minMonth <= 6) return 'bg-blue-100 text-blue-800'
  if (minMonth <= 9) return 'bg-purple-100 text-purple-800'
  return 'bg-orange-100 text-orange-800'
}

// 取得月齡標籤文字
function getAgeTagText(minMonth: number, maxMonth: number): string {
  return `${minMonth}-${maxMonth}M`
}

// 分類顏色
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    grain: 'bg-amber-100 text-amber-800',
    vegetable: 'bg-green-100 text-green-800',
    fruit: 'bg-pink-100 text-pink-800',
    protein: 'bg-blue-100 text-blue-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

// 導航到食譜詳情頁
function openRecipeDetail(sr: ScoredRecipe) {
  router.push(`/recipe/${sr.recipe.id}`)
}

// 關閉食譜詳情 (備用)
function closeRecipeDetail() {
  selectedRecipe.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 pb-24">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-20">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <router-link to="/" class="text-gray-600 hover:text-primary-500 transition-colors">
            ← 返回
          </router-link>
          <h1 class="text-xl font-bold text-gray-800">📖 智慧食譜</h1>
          <button
            @click="isPantryOpen = !isPantryOpen"
            class="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            🧊
            <span
              v-if="pantryStore.getStockCount() > 0"
              class="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center"
            >
              {{ pantryStore.getStockCount() }}
            </span>
          </button>
        </div>
      </div>
    </header>

    <!-- 篩選 Tabs -->
    <div class="bg-white border-b sticky top-[60px] z-10">
      <div class="container mx-auto px-4">
        <div class="flex gap-1 py-2">
          <button
            @click="viewMode = 'recommended'"
            class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all"
            :class="viewMode === 'recommended'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            ✨ 推薦
          </button>
          <button
            @click="viewMode = 'all'"
            class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all"
            :class="viewMode === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            📋 全部
          </button>
          <button
            @click="viewMode = 'favorites'"
            class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all"
            :class="viewMode === 'favorites'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            ❤️ 收藏
          </button>
        </div>
      </div>
    </div>

    <!-- 提示訊息 -->
    <div v-if="userStore.getAgeInMonths === 0" class="container mx-auto px-4 py-4">
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
        <p class="font-medium">💡 小提示</p>
        <p class="text-sm mt-1">請先到「食材護照」設定寶寶資料，以獲得更精準的食譜推薦！</p>
      </div>
    </div>

    <!-- 食譜列表 -->
    <div class="container mx-auto px-4 py-4">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="sr in displayedRecipes"
          :key="sr.recipe.id"
          @click="openRecipeDetail(sr)"
          class="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          :class="{ 'ring-2 ring-red-400': sr.hasAllergyIngredients }"
        >
          <!-- 卡片頂部標籤區 -->
          <div class="px-4 pt-4 flex items-center justify-between">
            <div class="flex gap-2">
              <span
                class="text-xs px-2 py-1 rounded-full font-medium"
                :class="getAgeTagColor(sr.recipe.min_month, sr.recipe.max_month)"
              >
                {{ getAgeTagText(sr.recipe.min_month, sr.recipe.max_month) }}
              </span>
              <span
                v-if="sr.readyToCook"
                class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium"
              >
                ✅ 可立即製作
              </span>
              <span
                v-if="sr.hasAllergyIngredients"
                class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium"
              >
                ⚠️ 過敏警示
              </span>
            </div>
            <button
              @click.stop="userStore.toggleFavoriteRecipe(sr.recipe.id)"
              class="text-xl hover:scale-110 transition-transform"
            >
              {{ userStore.isFavoriteRecipe(sr.recipe.id) ? '❤️' : '🤍' }}
            </button>
          </div>

          <!-- 卡片內容 -->
          <div class="p-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              {{ sr.recipe.title }}
            </h3>

            <!-- 食材狀態 -->
            <div class="space-y-1 text-sm">
              <div v-if="sr.availableIngredients.length > 0" class="flex items-start gap-2">
                <span class="text-green-500">✓</span>
                <span class="text-gray-600">有: {{ sr.availableIngredients.join('、') }}</span>
              </div>
              <div v-if="sr.missingIngredients.length > 0" class="flex items-start gap-2">
                <span class="text-orange-500">✗</span>
                <span class="text-gray-600">缺: {{ sr.missingIngredients.join('、') }}</span>
              </div>
              <div v-if="sr.allergyIngredients.length > 0" class="flex items-start gap-2">
                <span class="text-red-500">⚠</span>
                <span class="text-red-600">過敏: {{ sr.allergyIngredients.join('、') }}</span>
              </div>
            </div>

            <!-- 營養標籤 -->
            <div class="flex flex-wrap gap-1 mt-3">
              <span
                v-for="tag in sr.recipe.nutrition_tags.slice(0, 3)"
                :key="tag"
                class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div
        v-if="displayedRecipes.length === 0"
        class="text-center py-16 text-gray-500"
      >
        <p class="text-5xl mb-4">📭</p>
        <p v-if="viewMode === 'favorites'">還沒有收藏的食譜</p>
        <p v-else-if="viewMode === 'recommended'">沒有符合條件的推薦食譜</p>
        <p v-else>沒有食譜資料</p>
      </div>
    </div>

    <!-- 冰箱側邊面板 -->
    <Transition name="slide">
      <div
        v-if="isPantryOpen"
        class="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-30 overflow-hidden flex flex-col"
      >
        <div class="p-4 border-b bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">🧊 我的冰箱</h2>
            <button
              @click="isPantryOpen = false"
              class="p-1 hover:bg-white/20 rounded transition-colors"
            >
              ✕
            </button>
          </div>
          <p class="text-sm opacity-80 mt-1">
            已有 {{ pantryStore.getStockCount() }} 種食材
          </p>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <div
            v-for="category in ['grain', 'vegetable', 'fruit', 'protein']"
            :key="category"
            class="mb-6"
          >
            <h3 class="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-amber-400': category === 'grain',
                  'bg-green-400': category === 'vegetable',
                  'bg-pink-400': category === 'fruit',
                  'bg-blue-400': category === 'protein',
                }"
              ></span>
              {{ { grain: '穀物類', vegetable: '蔬菜類', fruit: '水果類', protein: '蛋白質類' }[category] }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="ingredient in foodStore.getIngredientsByCategory(category)"
                :key="ingredient.id"
                @click="pantryStore.toggleItem(ingredient.id)"
                class="px-3 py-1.5 rounded-full text-sm transition-all duration-200"
                :class="pantryStore.hasItem(ingredient.id)
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              >
                {{ ingredient.name }}
              </button>
            </div>
          </div>
        </div>

        <div class="p-4 border-t bg-gray-50">
          <button
            @click="pantryStore.clearAll()"
            class="w-full py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            清空冰箱
          </button>
        </div>
      </div>
    </Transition>

    <!-- 背景遮罩 -->
    <Transition name="fade">
      <div
        v-if="isPantryOpen"
        @click="isPantryOpen = false"
        class="fixed inset-0 bg-black/30 z-20"
      ></div>
    </Transition>

    <!-- 食譜詳情 Modal -->
    <Transition name="fade">
      <div
        v-if="selectedRecipe"
        class="fixed inset-0 bg-black/50 z-40 flex items-end md:items-center justify-center p-4"
        @click.self="closeRecipeDetail"
      >
        <div class="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="p-4 border-b flex items-center justify-between bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
            <h2 class="text-xl font-bold">{{ selectedRecipe.recipe.title }}</h2>
            <button
              @click="closeRecipeDetail"
              class="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>

          <!-- 內容 -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- 標籤 -->
            <div class="flex flex-wrap gap-2">
              <span
                class="text-xs px-3 py-1 rounded-full font-medium"
                :class="getAgeTagColor(selectedRecipe.recipe.min_month, selectedRecipe.recipe.max_month)"
              >
                適合 {{ selectedRecipe.recipe.min_month }}-{{ selectedRecipe.recipe.max_month }} 個月
              </span>
              <span
                v-for="tag in selectedRecipe.recipe.nutrition_tags"
                :key="tag"
                class="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600"
              >
                {{ tag }}
              </span>
            </div>

            <!-- 過敏警示 -->
            <div
              v-if="selectedRecipe.hasAllergyIngredients"
              class="bg-red-50 border border-red-200 rounded-xl p-3 text-red-800"
            >
              <p class="font-medium">⚠️ 過敏警示</p>
              <p class="text-sm">此食譜包含過敏食材: {{ selectedRecipe.allergyIngredients.join('、') }}</p>
            </div>

            <!-- 食材清單 -->
            <div>
              <h3 class="font-semibold text-gray-800 mb-2">🥕 食材</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="id in selectedRecipe.recipe.ingredient_ids"
                  :key="id"
                  class="px-3 py-1 rounded-full text-sm"
                  :class="pantryStore.hasItem(id)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'"
                >
                  {{ pantryStore.hasItem(id) ? '✓' : '✗' }}
                  {{ foodStore.getIngredientById(id)?.name || id }}
                </span>
              </div>
            </div>

            <!-- 製作步驟 -->
            <div>
              <h3 class="font-semibold text-gray-800 mb-2">📝 製作步驟</h3>
              <ol class="space-y-2">
                <li
                  v-for="(step, index) in selectedRecipe.recipe.steps"
                  :key="index"
                  class="flex gap-3"
                >
                  <span class="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {{ index + 1 }}
                  </span>
                  <span class="text-gray-700">{{ step }}</span>
                </li>
              </ol>
            </div>

            <!-- 小提示 -->
            <div class="bg-amber-50 rounded-xl p-4">
              <p class="font-medium text-amber-800">💡 小提示</p>
              <p class="text-sm text-amber-700 mt-1">{{ selectedRecipe.recipe.tips }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t flex gap-2">
            <button
              @click="userStore.toggleFavoriteRecipe(selectedRecipe.recipe.id)"
              class="flex-1 py-3 rounded-xl font-medium transition-colors"
              :class="userStore.isFavoriteRecipe(selectedRecipe.recipe.id)
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
              {{ userStore.isFavoriteRecipe(selectedRecipe.recipe.id) ? '❤️ 已收藏' : '🤍 收藏' }}
            </button>
            <button
              @click="closeRecipeDetail"
              class="flex-1 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
