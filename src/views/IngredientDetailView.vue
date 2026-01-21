<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFoodStore } from '@/stores/food'
import { useUserStore } from '@/stores/user'
import { usePantryStore } from '@/stores/pantry'
import { getIngredientImageUrl, hasLocalImage } from '@/composables/useIngredientImage'

const route = useRoute()
const router = useRouter()
const foodStore = useFoodStore()
const userStore = useUserStore()
const pantryStore = usePantryStore()

// 取得食材 ID
const ingredientId = computed(() => route.params.id as string)

// 取得食材資料
const ingredient = computed(() => {
  return foodStore.getIngredientById(ingredientId.value)
})

// 取得使用者對此食材的狀態
const ingredientState = computed(() => {
  return userStore.getIngredientState(ingredientId.value)
})

// 試吃次數 (這裡用 tried 狀態模擬，可擴展為實際次數)
const triedCount = computed(() => {
  return ingredientState.value.status === 'tried' ? 1 : 0
})

// 是否已嘗試
const isTried = computed(() => ingredientState.value.status === 'tried')

// 是否過敏
const hasAllergy = computed(() => ingredientState.value.allergy)

// 是否在冰箱
const inPantry = computed(() => pantryStore.hasItem(ingredientId.value))

// 喜好 emoji
const preferenceEmoji = computed(() => {
  const emojis: Record<string, string> = {
    love: '😍',
    neutral: '😐',
    dislike: '🤢',
  }
  return ingredientState.value.preference ? emojis[ingredientState.value.preference] : ''
})

// 圖片 URL：優先使用本地圖片，若無則使用 JSON 中的 URL
const imageUrl = computed(() => {
  if (hasLocalImage(ingredientId.value)) {
    return getIngredientImageUrl(ingredientId.value)
  }
  return ingredient.value?.imageUrl || 'https://placehold.co/800x400/e2e8f0/64748b?text=Food'
})

// 相關食譜 (包含此食材的食譜)
const relatedRecipes = computed(() => {
  return foodStore.recipes.filter((recipe) =>
    recipe.ingredient_ids.includes(ingredientId.value)
  )
})

// 分類標籤
const categoryLabel = computed(() => {
  const labels: Record<string, string> = {
    grain: '穀物類',
    vegetable: '蔬菜類',
    fruit: '水果類',
    protein: '蛋白質類',
    dairy: '乳製品類',
    other: '其他',
  }
  return labels[ingredient.value?.category || ''] || '其他'
})

const categoryColor = computed(() => {
  const colors: Record<string, string> = {
    grain: 'bg-amber-500',
    vegetable: 'bg-green-500',
    fruit: 'bg-pink-500',
    protein: 'bg-blue-500',
    dairy: 'bg-purple-500',
    other: 'bg-gray-500',
  }
  return colors[ingredient.value?.category || ''] || 'bg-gray-500'
})

// 月齡標籤顏色
function getAgeTagColor(minMonth: number): string {
  if (minMonth <= 6) return 'bg-blue-100 text-blue-800'
  if (minMonth <= 9) return 'bg-purple-100 text-purple-800'
  return 'bg-orange-100 text-orange-800'
}

// 操作函數
function toggleTried() {
  userStore.updateIngredientState(ingredientId.value, {
    status: isTried.value ? 'not_tried' : 'tried',
  })
}

function toggleAllergy() {
  userStore.updateIngredientState(ingredientId.value, {
    allergy: !hasAllergy.value,
  })
}

function togglePantry() {
  pantryStore.toggleItem(ingredientId.value)
}

function goBack() {
  router.back()
}

function goToRecipe(recipeId: string) {
  router.push(`/recipes?highlight=${recipeId}`)
}
</script>

<template>
  <div v-if="ingredient" class="min-h-screen bg-gray-50">
    <!-- Header 大圖區 -->
    <div class="relative">
      <!-- 返回按鈕 -->
      <button
        @click="goBack"
        class="absolute top-4 left-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-md"
      >
        ←
      </button>

      <!-- 食材大圖 -->
      <div class="h-64 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
        <img
          :src="imageUrl"
          :alt="ingredient.name"
          class="w-full h-full object-cover"
          @error="$event.target.src = 'https://placehold.co/800x400/e2e8f0/64748b?text=Food'"
        />
        <!-- 漸層遮罩 -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        <!-- 食材資訊 -->
        <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div class="flex items-center gap-2 mb-2">
            <span
              class="px-3 py-1 rounded-full text-xs font-medium text-white"
              :class="categoryColor"
            >
              {{ categoryLabel }}
            </span>
            <span
              v-if="ingredient.allergy_risk"
              class="px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white"
            >
              ⚠️ 高過敏風險
            </span>
          </div>
          <h1 class="text-3xl font-bold">{{ ingredient.name }}</h1>
          <div class="flex items-center gap-4 mt-2 text-sm opacity-90">
            <span>試吃: {{ triedCount }} 次</span>
            <span v-if="preferenceEmoji">喜好: {{ preferenceEmoji }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作按鈕 -->
    <div class="bg-white border-b">
      <div class="container mx-auto px-4 py-3">
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="toggleTried"
            class="py-2 rounded-lg text-sm font-medium transition-all"
            :class="isTried
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            {{ isTried ? '✓ 已嘗試' : '標記嘗試' }}
          </button>
          <button
            @click="toggleAllergy"
            class="py-2 rounded-lg text-sm font-medium transition-all"
            :class="hasAllergy
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            {{ hasAllergy ? '⚠ 過敏' : '標記過敏' }}
          </button>
          <button
            @click="togglePantry"
            class="py-2 rounded-lg text-sm font-medium transition-all"
            :class="inPantry
              ? 'bg-cyan-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            {{ inPantry ? '🧊 冰箱有' : '加入冰箱' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 內容區 -->
    <div class="container mx-auto px-4 py-6 space-y-4">
      <!-- Nutrition Block -->
      <div
        v-if="ingredient.nutrition_highlight"
        class="bg-green-50 rounded-2xl p-5 border border-green-100"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">🥗</span>
          <h2 class="font-semibold text-green-800">營養價值</h2>
        </div>
        <p class="text-green-700 leading-relaxed">{{ ingredient.nutrition_highlight }}</p>
      </div>

      <!-- Doctor's Note -->
      <div
        v-if="ingredient.doctor_note"
        class="bg-blue-50 rounded-2xl p-5 border border-blue-100"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">👨‍⚕️</span>
          <h2 class="font-semibold text-blue-800">醫師筆記</h2>
        </div>
        <p class="text-blue-700 leading-relaxed">{{ ingredient.doctor_note }}</p>
      </div>

      <!-- Picking Guide -->
      <div
        v-if="ingredient.picking_guide"
        class="bg-amber-50 rounded-2xl p-5 border border-amber-100"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">🛒</span>
          <h2 class="font-semibold text-amber-800">挑選指南</h2>
        </div>
        <p class="text-amber-700 leading-relaxed">{{ ingredient.picking_guide }}</p>
      </div>

      <!-- Processing Guide -->
      <div
        v-if="ingredient.processing_guide"
        class="bg-purple-50 rounded-2xl p-5 border border-purple-100"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">🍳</span>
          <h2 class="font-semibold text-purple-800">調理攻略</h2>
        </div>
        <p class="text-purple-700 leading-relaxed">{{ ingredient.processing_guide }}</p>
      </div>

      <!-- Related Recipes -->
      <div v-if="relatedRecipes.length > 0" class="pt-4">
        <h2 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-xl">📖</span>
          相關食譜 ({{ relatedRecipes.length }})
        </h2>

        <!-- 水平捲動容器 -->
        <div class="overflow-x-auto -mx-4 px-4">
          <div class="flex gap-3" style="min-width: min-content;">
            <div
              v-for="recipe in relatedRecipes"
              :key="recipe.id"
              @click="goToRecipe(recipe.id)"
              class="flex-shrink-0 w-48 bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <!-- 食譜圖片區 -->
              <div class="h-24 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                <span class="text-4xl">🍲</span>
              </div>
              
              <!-- 食譜資訊 -->
              <div class="p-3">
                <h3 class="font-medium text-gray-800 text-sm truncate">
                  {{ recipe.title }}
                </h3>
                <div class="flex items-center gap-1 mt-2">
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="getAgeTagColor(recipe.min_month)"
                  >
                    {{ recipe.min_month }}-{{ recipe.max_month }}M
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 無相關食譜 -->
      <div v-else class="pt-4">
        <div class="bg-gray-100 rounded-2xl p-6 text-center text-gray-500">
          <p class="text-3xl mb-2">📖</p>
          <p>尚無包含此食材的食譜</p>
        </div>
      </div>
    </div>

    <!-- 底部安全區 -->
    <div class="h-8"></div>
  </div>

  <!-- 食材不存在 -->
  <div v-else class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <p class="text-5xl mb-4">🤔</p>
      <p class="text-gray-500 mb-4">找不到此食材</p>
      <button
        @click="goBack"
        class="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium"
      >
        返回
      </button>
    </div>
  </div>
</template>
