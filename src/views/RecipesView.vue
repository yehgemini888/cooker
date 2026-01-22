<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSmartRecipes, type ScoredRecipe } from '@/composables/useSmartRecipes'
import { useFoodStore } from '@/stores/food'
import { useUserStore } from '@/stores/user'
import { usePantryStore } from '@/stores/pantry'

const router = useRouter()
const { scoredRecipes } = useSmartRecipes()
const foodStore = useFoodStore()
const userStore = useUserStore()
const pantryStore = usePantryStore()

// ===== 篩選器狀態 =====

// Tag 1: 分齡區段
const ageFilter = ref<string>('all')
const ageOptions = [
  { value: 'all', label: '全部' },
  { value: '4-6', label: '4-6M' },
  { value: '7-9', label: '7-9M' },
  { value: '10-12', label: '10-12M' },
  { value: '12+', label: '1Y+' },
]

// Tag 2: 食材篩選
const ingredientFilter = ref<string>('')
const showIngredientDropdown = ref(false)
const ingredientSearchQuery = ref('')

// 搜尋過濾後的食材列表
const filteredIngredientOptions = computed(() => {
  const query = ingredientSearchQuery.value.toLowerCase()
  if (!query) return foodStore.ingredients.slice(0, 20) // 預設顯示前 20 個
  return foodStore.ingredients.filter(ing => 
    ing.name.toLowerCase().includes(query)
  ).slice(0, 20)
})

// 選中的食材名稱
const selectedIngredientName = computed(() => {
  if (!ingredientFilter.value) return ''
  const ing = foodStore.getIngredientById(ingredientFilter.value)
  return ing?.name || ''
})

// Tag 3: 冰箱有的（只顯示可做的）
const onlyAvailable = ref(false)

// Tag 4: 收藏食譜
const onlyFavorites = ref(false)

// Tag 5: 寶寶喜歡
const onlyLiked = ref(false)

// ===== 篩選邏輯 =====
const displayedRecipes = computed(() => {
  return scoredRecipes.value.filter(sr => {
    // Tag 1: 分齡篩選
    if (ageFilter.value !== 'all') {
      const minMonth = sr.recipe.min_month
      const maxMonth = sr.recipe.max_month
      
      switch (ageFilter.value) {
        case '4-6':
          if (minMonth > 6) return false
          break
        case '7-9':
          if (maxMonth < 7 || minMonth > 9) return false
          break
        case '10-12':
          if (maxMonth < 10 || minMonth > 12) return false
          break
        case '12+':
          if (maxMonth < 12) return false
          break
      }
    }
    
    // Tag 2: 食材篩選
    if (ingredientFilter.value) {
      if (!sr.recipe.ingredient_ids.includes(ingredientFilter.value)) {
        return false
      }
    }
    
    // Tag 3: 只顯示可做的
    if (onlyAvailable.value) {
      if (!sr.readyToCook) return false
    }
    
    // Tag 4: 只顯示收藏
    if (onlyFavorites.value) {
      if (!userStore.isFavoriteRecipe(sr.recipe.id)) return false
    }
    
    // Tag 5: 只顯示寶寶愛（連動 RecipeDetailView 的評分）
    if (onlyLiked.value) {
      if (!userStore.isRecipeLiked(sr.recipe.id)) return false
    }
    
    return true
  })
})

// 選擇食材
function selectIngredient(ingredientId: string) {
  ingredientFilter.value = ingredientId
  showIngredientDropdown.value = false
  ingredientSearchQuery.value = ''
}

// 清除食材篩選
function clearIngredientFilter() {
  ingredientFilter.value = ''
  ingredientSearchQuery.value = ''
}

// 重置所有篩選
function resetFilters() {
  ageFilter.value = 'all'
  ingredientFilter.value = ''
  onlyAvailable.value = false
  onlyFavorites.value = false
  onlyLiked.value = false
}

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

// 導航到食譜詳情頁
function openRecipeDetail(sr: ScoredRecipe) {
  router.push(`/recipe/${sr.recipe.id}`)
}

// 計算活躍篩選數量
const activeFiltersCount = computed(() => {
  let count = 0
  if (ageFilter.value !== 'all') count++
  if (ingredientFilter.value) count++
  if (onlyAvailable.value) count++
  if (onlyFavorites.value) count++
  if (onlyLiked.value) count++
  return count
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 pb-24">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-20">
      <div class="px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-800">📖 智慧食譜</h1>
          <div class="flex items-center gap-2">
            <span 
              v-if="activeFiltersCount > 0"
              class="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full"
            >
              {{ activeFiltersCount }} 個篩選
            </span>
            <button
              v-if="activeFiltersCount > 0"
              @click="resetFilters"
              class="text-xs text-gray-500 hover:text-gray-700"
            >
              重置
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 篩選器區域 -->
    <div class="bg-white border-b sticky top-[60px] z-10 px-4 py-3 space-y-3">
      <!-- Row 1: 分齡區段 -->
      <div class="flex gap-1 overflow-x-auto scrollbar-hide">
        <button
          v-for="option in ageOptions"
          :key="option.value"
          @click="ageFilter = option.value"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
          :class="ageFilter === option.value
            ? 'bg-primary-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          {{ option.label }}
        </button>
      </div>

      <!-- Row 2: 其他篩選 -->
      <div class="flex gap-2 flex-wrap">
        <!-- Tag 2: 食材篩選下拉 -->
        <div class="relative">
          <button
            @click="showIngredientDropdown = !showIngredientDropdown"
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1"
            :class="ingredientFilter
              ? 'bg-cyan-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            <span>🥕</span>
            <span>{{ selectedIngredientName || '選擇食材' }}</span>
            <span v-if="ingredientFilter" @click.stop="clearIngredientFilter" class="ml-1">✕</span>
          </button>
          
          <!-- 下拉選單 -->
          <div
            v-if="showIngredientDropdown"
            class="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border z-30 max-h-64 overflow-hidden"
          >
            <div class="p-2 border-b">
              <input
                v-model="ingredientSearchQuery"
                type="text"
                placeholder="搜尋食材..."
                class="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                @click.stop
              />
            </div>
            <div class="max-h-48 overflow-y-auto">
              <button
                v-for="ing in filteredIngredientOptions"
                :key="ing.id"
                @click="selectIngredient(ing.id)"
                class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                :class="{ 'bg-cyan-50': ingredientFilter === ing.id }"
              >
                <span>{{ ing.name }}</span>
                <span v-if="pantryStore.hasItem(ing.id)" class="text-xs text-cyan-500">🧊</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tag 3: 冰箱有的 -->
        <button
          @click="onlyAvailable = !onlyAvailable"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1"
          :class="onlyAvailable
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          <span>🧊</span>
          <span>可立即做</span>
        </button>

        <!-- Tag 4: 收藏食譜 -->
        <button
          @click="onlyFavorites = !onlyFavorites"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1"
          :class="onlyFavorites
            ? 'bg-red-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          <span>❤️</span>
          <span>收藏</span>
        </button>

        <!-- Tag 5: 寶寶喜歡 -->
        <button
          @click="onlyLiked = !onlyLiked"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1"
          :class="onlyLiked
            ? 'bg-yellow-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          <span>😋</span>
          <span>寶寶愛</span>
        </button>
      </div>
    </div>

    <!-- 點擊外部關閉下拉選單 -->
    <div
      v-if="showIngredientDropdown"
      @click="showIngredientDropdown = false"
      class="fixed inset-0 z-20"
    ></div>

    <!-- 提示訊息 -->
    <div v-if="userStore.getAgeInMonths === 0" class="px-4 py-4">
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
        <p class="font-medium">💡 小提示</p>
        <p class="text-sm mt-1">請先到「寶寶」頁面設定寶寶資料，以獲得更精準的食譜推薦！</p>
      </div>
    </div>

    <!-- 結果統計 -->
    <div class="px-4 py-2">
      <p class="text-sm text-gray-500">
        找到 <span class="font-semibold text-gray-700">{{ displayedRecipes.length }}</span> 道食譜
      </p>
    </div>

    <!-- 食譜列表 -->
    <div class="px-4 py-2">
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
            <div class="flex gap-2 flex-wrap">
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
                ✅ 可立即做
              </span>
              <span
                v-if="sr.hasAllergyIngredients"
                class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium"
              >
                ⚠️ 過敏
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
                <span class="text-gray-600 line-clamp-1">有: {{ sr.availableIngredients.join('、') }}</span>
              </div>
              <div v-if="sr.missingIngredients.length > 0" class="flex items-start gap-2">
                <span class="text-orange-500">✗</span>
                <span class="text-gray-600 line-clamp-1">缺: {{ sr.missingIngredients.join('、') }}</span>
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
        <p>沒有符合條件的食譜</p>
        <button
          @click="resetFilters"
          class="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm hover:bg-primary-600 transition-colors"
        >
          重置篩選條件
        </button>
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

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
