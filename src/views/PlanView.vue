<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanStore } from '@/stores/plan'
import { useFoodStore } from '@/stores/food'
import { usePantryStore } from '@/stores/pantry'
import { useUserStore } from '@/stores/user'
import { useSmartRecipes } from '@/composables/useSmartRecipes'
import { getIngredientImageUrl, hasLocalImage } from '@/composables/useIngredientImage'
import type { Recipe } from '@/types'

const router = useRouter()
const planStore = usePlanStore()
const foodStore = useFoodStore()
const pantryStore = usePantryStore()
const userStore = useUserStore()
const { scoredRecipes } = useSmartRecipes()

// ===== 模式狀態 =====
const showWizard = ref(false)
const showAddRecipePanel = ref(false)
const recipeSearchQuery = ref('')

// ===== Wizard 篩選狀態 =====
const ageFilter = ref<string>('all')
const ageOptions = [
  { value: 'all', label: '全部' },
  { value: '4-6', label: '4-6M' },
  { value: '7-9', label: '7-9M' },
  { value: '10-12', label: '10-12M' },
  { value: '12+', label: '1Y+' },
]
const ingredientFilter = ref<string>('')
const showIngredientDropdown = ref(false)
const ingredientSearchQuery = ref('')
const onlyAvailable = ref(false)
const onlyFavorites = ref(false)
const onlyLiked = ref(false)

// 搜尋過濾後的食材列表
const filteredIngredientOptions = computed(() => {
  const query = ingredientSearchQuery.value.toLowerCase()
  if (!query) return foodStore.ingredients.slice(0, 20)
  return foodStore.ingredients.filter(ing => 
    ing.name.toLowerCase().includes(query)
  ).slice(0, 20)
})

const selectedIngredientName = computed(() => {
  if (!ingredientFilter.value) return ''
  const ing = foodStore.getIngredientById(ingredientFilter.value)
  return ing?.name || ''
})

function selectIngredient(ingredientId: string) {
  ingredientFilter.value = ingredientId
  showIngredientDropdown.value = false
  ingredientSearchQuery.value = ''
}

function clearIngredientFilter() {
  ingredientFilter.value = ''
  ingredientSearchQuery.value = ''
}

// Wizard 篩選後的食譜
const wizardFilteredRecipes = computed(() => {
  return scoredRecipes.value.filter(sr => {
    // Tag 1: 分齡篩選
    if (ageFilter.value !== 'all') {
      const minMonth = sr.recipe.min_month
      const maxMonth = sr.recipe.max_month
      switch (ageFilter.value) {
        case '4-6': if (minMonth > 6) return false; break;
        case '7-9': if (maxMonth < 7 || minMonth > 9) return false; break;
        case '10-12': if (maxMonth < 10 || minMonth > 12) return false; break;
        case '12+': if (maxMonth < 12) return false; break;
      }
    }
    // Tag 2: 食材篩選
    if (ingredientFilter.value && !sr.recipe.ingredient_ids.includes(ingredientFilter.value)) return false
    // Tag 3: 只顯示可做的
    if (onlyAvailable.value && !sr.readyToCook) return false
    // Tag 4: 只顯示收藏
    if (onlyFavorites.value && !userStore.isFavoriteRecipe(sr.recipe.id)) return false
    // Tag 5: 只顯示寶寶愛
    if (onlyLiked.value && !userStore.isRecipeLiked(sr.recipe.id)) return false
    
    return true
  })
})

// ===== 月曆狀態 =====
const currentMonth = ref(new Date())

// 本地日期格式化函數
const formatDate = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const todayStr = formatDate(new Date())
const selectedDate = ref<string>(todayStr)

// ===== Wizard 狀態 =====
const wizardStep = ref(1)
const wizardSelectedDates = ref<Set<string>>(new Set())
const wizardSelectedRecipes = ref<Set<string>>(new Set())
const wizardAssignments = ref<Record<string, string[]>>({})

// ===== 月曆計算 =====
const currentYear = computed(() => currentMonth.value.getFullYear())
const currentMonthNum = computed(() => currentMonth.value.getMonth())
const monthLabel = computed(() => {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                  '七月', '八月', '九月', '十月', '十一月', '十二月']
  return `${currentYear.value} 年 ${months[currentMonthNum.value]}`
})

// 今天顯示文字
const todayDisplay = computed(() => {
  const d = new Date()
  const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
  return `${d.getMonth() + 1}/${d.getDate()} ${weekdays[d.getDay()]}`
})

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonthNum.value
  
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay() || 7
  const lastDay = new Date(year, month + 1, 0)
  const totalDays = lastDay.getDate()
  
  const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; isPast: boolean; isFuture: boolean }[] = []
  
  // 上個月的日期填充
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayOfWeek - 1; i > 0; i--) {
    const d = prevMonthLastDay - i + 1
    const date = new Date(year, month - 1, d)
    const dateStr = formatDate(date)
    days.push({
      date: dateStr,
      day: d,
      isCurrentMonth: false,
      isToday: false,
      isPast: dateStr < todayStr,
      isFuture: dateStr > todayStr
    })
  }
  
  // 本月的日期
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d)
    const dateStr = formatDate(date)
    days.push({
      date: dateStr,
      day: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      isFuture: dateStr > todayStr
    })
  }
  
  // 下個月的日期填充
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d)
    const dateStr = formatDate(date)
    days.push({
      date: dateStr,
      day: d,
      isCurrentMonth: false,
      isToday: false,
      isPast: dateStr < todayStr,
      isFuture: dateStr > todayStr
    })
  }
  
  return days
})

// 取得某日的食譜
function getMealsForDate(dateStr: string): Recipe[] {
  const ids = planStore.getMealsForDate(dateStr)
  return ids.map(id => foodStore.recipes.find(r => r.id === id)).filter(Boolean) as Recipe[]
}

// 取得某日的主要食材圖片
function getMainIngredientImage(dateStr: string): string | null {
  const meals = getMealsForDate(dateStr)
  if (meals.length === 0) return null
  const firstRecipe = meals[0]
  const firstIngredientId = firstRecipe.ingredient_ids[0]
  if (!firstIngredientId) return null
  if (hasLocalImage(firstIngredientId)) {
    return getIngredientImageUrl(firstIngredientId)
  }
  const ingredient = foodStore.getIngredientById(firstIngredientId)
  return ingredient?.imageUrl || null
}

// 月份切換
function prevMonth() {
  currentMonth.value = new Date(currentYear.value, currentMonthNum.value - 1, 1)
}
function nextMonth() {
  currentMonth.value = new Date(currentYear.value, currentMonthNum.value + 1, 1)
}

// 選擇日期
function selectDate(dateStr: string) {
  selectedDate.value = dateStr
  showAddRecipePanel.value = false
}

// ===== 修改模式功能 =====
const selectedDateMeals = computed(() => getMealsForDate(selectedDate.value))

// 選中日期的美化顯示
const selectedDateDisplay = computed(() => {
  const d = new Date(selectedDate.value)
  const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
  return `${d.getMonth() + 1}/${d.getDate()} ${weekdays[d.getDay()]}`
})

function removeRecipeFromDate(recipeId: string) {
  planStore.removeMealFromDate(selectedDate.value, recipeId)
}

function goToRecipe(recipeId: string) {
  router.push(`/recipe/${recipeId}`)
}

// ===== 新增食譜功能 =====
function openAddRecipePanel() {
  showAddRecipePanel.value = true
  recipeSearchQuery.value = ''
}

function closeAddRecipePanel() {
  showAddRecipePanel.value = false
}

// 篩選後的食譜列表
const filteredRecipes = computed(() => {
  const query = recipeSearchQuery.value.toLowerCase()
  let recipes = scoredRecipes.value
  
  if (query) {
    recipes = recipes.filter(sr => 
      sr.recipe.title.toLowerCase().includes(query)
    )
  }
  
  return recipes.slice(0, 20)
})

// 新增食譜到當天
function addRecipeToSelectedDate(recipeId: string) {
  const currentMeals = getMealsForDate(selectedDate.value)
  if (currentMeals.length >= 3) {
    alert('每日最多安排 3 道食譜')
    return
  }
  
  // 確保有 plan
  if (!planStore.currentPlan) {
    const plan = planStore.createNewPlan([selectedDate.value])
    planStore.savePlan(plan)
  }
  
  planStore.addMealToDate(selectedDate.value, recipeId)
  showAddRecipePanel.value = false
}

// 取得食譜缺少的食材
function getMissingIngredients(recipe: Recipe): string[] {
  return recipe.ingredient_ids
    .filter(id => !pantryStore.hasItem(id))
    .map(id => foodStore.getIngredientById(id)?.name || id)
}

// ===== Wizard 模式功能 =====
function openWizard() {
  showWizard.value = true
  wizardStep.value = 1
  wizardSelectedDates.value = new Set()
  wizardSelectedRecipes.value = new Set()
  wizardAssignments.value = {}
  
  // 重置篩選
  ageFilter.value = 'all'
  ingredientFilter.value = ''
  onlyAvailable.value = false
  onlyFavorites.value = false
  onlyLiked.value = false
}

function closeWizard() {
  showWizard.value = false
}

function toggleWizardDate(dateStr: string) {
  if (wizardSelectedDates.value.has(dateStr)) {
    wizardSelectedDates.value.delete(dateStr)
  } else {
    wizardSelectedDates.value.add(dateStr)
  }
  wizardSelectedDates.value = new Set(wizardSelectedDates.value)
}

function toggleWizardRecipe(recipeId: string) {
  if (wizardSelectedRecipes.value.has(recipeId)) {
    wizardSelectedRecipes.value.delete(recipeId)
  } else {
    wizardSelectedRecipes.value.add(recipeId)
  }
  wizardSelectedRecipes.value = new Set(wizardSelectedRecipes.value)
}

function assignRecipeToDate(recipeId: string, dateStr: string) {
  if (!wizardAssignments.value[dateStr]) {
    wizardAssignments.value[dateStr] = []
  }
  if (wizardAssignments.value[dateStr].length >= 3) {
    alert('每日最多安排 3 道食譜')
    return
  }
  if (!wizardAssignments.value[dateStr].includes(recipeId)) {
    wizardAssignments.value[dateStr].push(recipeId)
  }
}

function removeAssignment(recipeId: string, dateStr: string) {
  if (wizardAssignments.value[dateStr]) {
    const index = wizardAssignments.value[dateStr].indexOf(recipeId)
    if (index >= 0) {
      wizardAssignments.value[dateStr].splice(index, 1)
    }
  }
}

function getRecipeById(id: string): Recipe | undefined {
  return foodStore.recipes.find(r => r.id === id)
}

function nextWizardStep() {
  if (wizardStep.value < 4) {
    if (wizardStep.value === 1 && wizardSelectedDates.value.size === 0) {
      alert('請選擇至少一個日期')
      return
    }
    if (wizardStep.value === 2 && wizardSelectedRecipes.value.size === 0) {
      alert('請選擇至少一道食譜')
      return
    }
    wizardStep.value++
  }
}

function prevWizardStep() {
  if (wizardStep.value > 1) {
    wizardStep.value--
  }
}

function finishWizard() {
  const selectedDates = Array.from(wizardSelectedDates.value).sort()
  let plan = planStore.currentPlan
  
  if (!plan) {
    plan = planStore.createNewPlan(selectedDates)
  }
  
  Object.entries(wizardAssignments.value).forEach(([dateStr, recipeIds]) => {
    recipeIds.forEach(recipeId => {
      planStore.addMealToDate(dateStr, recipeId)
    })
  })
  
  planStore.savePlan(plan)
  closeWizard()
}

const sortedWizardDates = computed(() => 
  Array.from(wizardSelectedDates.value).sort()
)

const selectedRecipesList = computed(() =>
  Array.from(wizardSelectedRecipes.value)
    .map(id => getRecipeById(id))
    .filter(Boolean) as Recipe[]
)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-20">
      <div class="px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-800">📅 週計畫</h1>
          <div class="text-sm text-gray-500">
            今天 <span class="font-semibold text-purple-600">{{ todayDisplay }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ==================== 月曆模式 ==================== -->
    <div v-if="!showWizard" class="px-4 py-4 space-y-4">
      <!-- 月曆卡片 -->
      <div class="bg-white rounded-2xl shadow-md p-4">
        <!-- 月份導航 -->
        <div class="flex items-center justify-between mb-4">
          <button @click="prevMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">←</button>
          <h2 class="font-semibold text-gray-800">{{ monthLabel }}</h2>
          <button @click="nextMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">→</button>
        </div>
        
        <!-- 星期標題 -->
        <div class="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
          <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div>
          <div class="text-orange-500">六</div><div class="text-orange-500">日</div>
        </div>
        
        <!-- 日期格子 -->
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="day in calendarDays"
            :key="day.date"
            @click="selectDate(day.date)"
            class="aspect-square p-1 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center relative"
            :class="{
              'bg-purple-500 text-white ring-2 ring-purple-600': selectedDate === day.date,
              'bg-purple-100 ring-2 ring-purple-400 font-bold': day.isToday && selectedDate !== day.date,
              'hover:bg-gray-100': selectedDate !== day.date && !day.isToday,
              'text-gray-300': !day.isCurrentMonth,
              'text-gray-400': day.isPast && day.isCurrentMonth && !day.isToday,
              'text-gray-800': day.isFuture && day.isCurrentMonth,
              'text-purple-600 font-semibold': day.isToday && day.isCurrentMonth
            }"
          >
            <span class="text-xs">{{ day.day }}</span>
            <!-- 食譜圖示 -->
            <div v-if="getMainIngredientImage(day.date)" class="w-5 h-5 mt-0.5">
              <img :src="getMainIngredientImage(day.date)!" class="w-full h-full object-contain rounded" />
            </div>
            <div v-else-if="getMealsForDate(day.date).length > 0" class="w-2 h-2 bg-purple-500 rounded-full mt-1"></div>
          </div>
        </div>
      </div>

      <!-- 當日食譜區塊 -->
      <div class="bg-white rounded-2xl shadow-md p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-800">
            📋 {{ selectedDateDisplay }} 的計畫
          </h3>
          <span 
            v-if="selectedDateMeals.length > 0"
            class="text-xs text-gray-500"
          >
            {{ selectedDateMeals.length }}/3 道
          </span>
        </div>
        
        <!-- 有食譜時 -->
        <div v-if="selectedDateMeals.length > 0" class="space-y-3">
          <div
            v-for="recipe in selectedDateMeals"
            :key="recipe.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
          >
            <div class="flex-1 cursor-pointer" @click="goToRecipe(recipe.id)">
              <p class="font-medium text-gray-800">{{ recipe.title }}</p>
              <p class="text-xs text-gray-500">{{ recipe.min_month }}-{{ recipe.max_month }}M</p>
            </div>
            <div class="flex items-center gap-1">
              <button
                @click="goToRecipe(recipe.id)"
                class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="查看詳情"
              >
                👁️
              </button>
              <button
                @click="removeRecipeFromDate(recipe.id)"
                class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="刪除"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <!-- 新增更多食譜按鈕 -->
          <button
            v-if="selectedDateMeals.length < 3"
            @click="openAddRecipePanel"
            class="w-full py-3 border-2 border-dashed border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
          >
            <span>➕</span>
            <span>新增食譜</span>
          </button>
        </div>
        
        <!-- 沒食譜時 -->
        <div v-else class="text-center py-6">
          <p class="text-gray-400 mb-4">📭 尚未安排食譜</p>
          <button
            @click="openAddRecipePanel"
            class="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <span>➕</span>
            <span>新增食譜</span>
          </button>
        </div>
      </div>

      <!-- 新增食譜滑出面板 -->
      <Transition name="slide-up">
        <div
          v-if="showAddRecipePanel"
          class="fixed inset-x-0 bottom-0 z-30 bg-white rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col"
        >
          <!-- 面板標題 -->
          <div class="p-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h3 class="font-semibold text-gray-800">新增食譜到 {{ selectedDateDisplay }}</h3>
              <p class="text-xs text-gray-500">點擊選擇要加入的食譜</p>
            </div>
            <button @click="closeAddRecipePanel" class="p-2 hover:bg-gray-100 rounded-full">✕</button>
          </div>
          
          <!-- 搜尋框 -->
          <div class="p-4 border-b flex-shrink-0">
            <input
              v-model="recipeSearchQuery"
              type="text"
              placeholder="🔍 搜尋食譜..."
              class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <!-- 食譜列表 -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div
              v-for="sr in filteredRecipes"
              :key="sr.recipe.id"
              @click="addRecipeToSelectedDate(sr.recipe.id)"
              class="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h4 class="font-medium text-gray-800">{{ sr.recipe.title }}</h4>
                  <p class="text-xs text-gray-500">{{ sr.recipe.min_month }}-{{ sr.recipe.max_month }}M</p>
                </div>
                <span v-if="sr.readyToCook" class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  ✅ 可做
                </span>
              </div>
              <div v-if="getMissingIngredients(sr.recipe).length > 0" class="mt-2 text-xs text-orange-600">
                缺: {{ getMissingIngredients(sr.recipe).slice(0, 3).join(', ') }}
                <span v-if="getMissingIngredients(sr.recipe).length > 3">...等</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
      
      <!-- 面板背景遮罩 -->
      <Transition name="fade">
        <div
          v-if="showAddRecipePanel"
          @click="closeAddRecipePanel"
          class="fixed inset-0 bg-black/30 z-20"
        ></div>
      </Transition>
    </div>

    <!-- 智慧引導漂浮按鈕 -->
    <button
      v-if="!showWizard && !showAddRecipePanel"
      @click="openWizard"
      class="fixed bottom-24 left-1/2 -translate-x-1/2 z-10 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2 font-medium"
    >
      <span>✨</span>
      <span>智慧引導</span>
    </button>

    <!-- ==================== 智慧引導 Wizard ==================== -->
    <div v-if="showWizard" class="px-4 py-4">
      <!-- 關閉按鈕 -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-800">✨ 智慧引導</h2>
        <button @click="closeWizard" class="p-2 hover:bg-gray-100 rounded-full">✕</button>
      </div>

      <!-- 步驟指示器 -->
      <div class="flex items-center justify-between mb-6">
        <div v-for="step in 4" :key="step" class="flex items-center">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            :class="wizardStep >= step ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'"
          >{{ step }}</div>
          <div v-if="step < 4" class="w-8 h-0.5 mx-1" :class="wizardStep > step ? 'bg-purple-500' : 'bg-gray-200'"></div>
        </div>
      </div>

      <!-- Step 1: 選日期 -->
      <div v-if="wizardStep === 1" class="bg-white rounded-2xl shadow-md p-4 space-y-4">
        <div>
          <h3 class="font-semibold text-gray-800">📆 Step 1: 選擇日期</h3>
          <p class="text-sm text-gray-500">只能選擇今日及未來的日期</p>
        </div>
        
        <div class="flex items-center justify-between">
          <button @click="prevMonth" class="p-2 hover:bg-gray-100 rounded-lg">←</button>
          <h2 class="font-semibold text-gray-800">{{ monthLabel }}</h2>
          <button @click="nextMonth" class="p-2 hover:bg-gray-100 rounded-lg">→</button>
        </div>
        
        <div class="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
          <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div>
          <div class="text-orange-500">六</div><div class="text-orange-500">日</div>
        </div>
        
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="day in calendarDays"
            :key="day.date"
            @click="!day.isPast && day.isCurrentMonth && toggleWizardDate(day.date)"
            class="aspect-square p-1 rounded-lg transition-all flex items-center justify-center relative"
            :class="{
              'bg-orange-500 text-white shadow-md transform scale-105': wizardSelectedDates.has(day.date),
              'hover:bg-gray-100 cursor-pointer': !wizardSelectedDates.has(day.date) && day.isCurrentMonth && !day.isPast,
              'text-gray-300 cursor-not-allowed': !day.isCurrentMonth,
              'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50': day.isPast && day.isCurrentMonth,
              'ring-2 ring-purple-400 font-bold text-purple-600': day.isToday && !wizardSelectedDates.has(day.date)
            }"
          >
            <span class="text-sm">{{ day.day }}</span>
            <span v-if="day.isToday && !wizardSelectedDates.has(day.date)" class="absolute -bottom-1 text-[10px] scale-75">今天</span>
          </div>
        </div>
        
        <p class="text-sm text-purple-600 font-medium text-center bg-purple-50 py-2 rounded-lg">已選擇 {{ wizardSelectedDates.size }} 個日期</p>
      </div>

      <!-- Step 2: 選食譜 -->
      <div v-if="wizardStep === 2" class="space-y-4">
        <div class="bg-white rounded-2xl shadow-md p-4 space-y-3">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold text-gray-800">🍳 Step 2: 選擇食譜</h3>
            <span class="text-sm text-gray-500">已選 {{ wizardSelectedRecipes.size }} 道</span>
          </div>

          <!-- 篩選器區域 -->
          <div class="space-y-3 pt-2 border-t">
            <!-- Row 1: 分齡區段 -->
            <div class="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
              <button
                v-for="option in ageOptions"
                :key="option.value"
                @click="ageFilter = option.value"
                class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                :class="ageFilter === option.value
                  ? 'bg-purple-500 text-white border-purple-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
              >
                {{ option.label }}
              </button>
            </div>

            <!-- Row 2: 其他篩選 -->
            <div class="flex gap-2 flex-wrap">
              <!-- 食材篩選下拉 -->
              <div class="relative">
                <button
                  @click="showIngredientDropdown = !showIngredientDropdown"
                  class="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 border"
                  :class="ingredientFilter
                    ? 'bg-cyan-500 text-white border-cyan-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
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
                      class="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

              <button
                @click="onlyAvailable = !onlyAvailable"
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 border"
                :class="onlyAvailable
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
              >
                <span>🧊</span> 可做
              </button>

              <button
                @click="onlyFavorites = !onlyFavorites"
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 border"
                :class="onlyFavorites
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
              >
                <span>❤️</span> 收藏
              </button>

              <button
                @click="onlyLiked = !onlyLiked"
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 border"
                :class="onlyLiked
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
              >
                <span>😋</span> 寶寶愛
              </button>
            </div>
            
            <!-- 點擊外部關閉下拉選單 (簡易遮罩) -->
            <div v-if="showIngredientDropdown" @click="showIngredientDropdown = false" class="fixed inset-0 z-20" style="background: transparent;"></div>
          </div>
        </div>
        
        <div class="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          <div v-if="wizardFilteredRecipes.length === 0" class="text-center py-8 text-gray-500">
            沒有符合篩選條件的食譜
          </div>
          <div
            v-else
            v-for="sr in wizardFilteredRecipes"
            :key="sr.recipe.id"
            @click="toggleWizardRecipe(sr.recipe.id)"
            class="bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all border border-transparent"
            :class="wizardSelectedRecipes.has(sr.recipe.id) ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md hover:border-purple-100'"
          >
            <div class="flex items-start justify-between">
              <div>
                <h4 class="font-medium text-gray-800">{{ sr.recipe.title }}</h4>
                <div class="flex gap-2 text-xs mt-1">
                  <span class="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{{ sr.recipe.min_month }}-{{ sr.recipe.max_month }}M</span>
                  <span v-if="sr.readyToCook" class="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">可立即做</span>
                  <span v-if="userStore.isFavoriteRecipe(sr.recipe.id)" class="px-1.5 py-0.5 bg-red-100 text-red-700 rounded">已收藏</span>
                </div>
              </div>
              <span v-if="wizardSelectedRecipes.has(sr.recipe.id)" class="text-purple-500 text-xl font-bold">✓</span>
              <span v-else class="text-gray-200 text-xl">+</span>
            </div>
            <div v-if="getMissingIngredients(sr.recipe).length > 0" class="mt-2 text-xs text-orange-600 flex items-center gap-1">
              <span>⚠️ 缺:</span>
              <span class="truncate max-w-[200px]">{{ getMissingIngredients(sr.recipe).slice(0, 3).join('、') }}</span>
            </div>
            <div v-else class="mt-2 text-xs text-green-600 flex items-center gap-1">
               <span>✅ 食材齊全</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: 分配 -->
      <div v-if="wizardStep === 3" class="space-y-4">
        <div class="bg-white rounded-2xl shadow-md p-4">
          <h3 class="font-semibold text-gray-800">📅 Step 3: 分配食譜</h3>
          <p class="text-sm text-gray-500">點擊日期，再點擊食譜進行分配</p>
        </div>
        
        <div class="flex gap-2 overflow-x-auto pb-2">
          <div
            v-for="dateStr in sortedWizardDates"
            :key="dateStr"
            class="flex-shrink-0 w-24 bg-white rounded-xl shadow-md p-3 text-center cursor-pointer"
            :class="selectedDate === dateStr ? 'ring-2 ring-purple-500' : ''"
            @click="selectedDate = dateStr"
          >
            <p class="text-xs text-gray-500">{{ dateStr.slice(5) }}</p>
            <p class="text-xs text-purple-600 mt-1">{{ (wizardAssignments[dateStr] || []).length }} 道</p>
          </div>
        </div>
        
        <div class="bg-purple-50 rounded-xl p-3">
          <p class="text-sm font-medium text-purple-800 mb-2">{{ selectedDate }} 已分配：</p>
          <div v-if="(wizardAssignments[selectedDate] || []).length > 0" class="space-y-2">
            <div v-for="recipeId in wizardAssignments[selectedDate]" :key="recipeId" class="flex items-center justify-between bg-white rounded-lg p-2">
              <span class="text-sm">{{ getRecipeById(recipeId)?.title }}</span>
              <button @click="removeAssignment(recipeId, selectedDate)" class="text-red-500 text-xs">✕</button>
            </div>
          </div>
          <p v-else class="text-sm text-purple-600">尚未分配</p>
        </div>
        
        <div class="bg-white rounded-2xl shadow-md p-4">
          <p class="text-sm font-medium text-gray-600 mb-3">點擊分配：</p>
          <div class="space-y-2">
            <button
              v-for="recipe in selectedRecipesList"
              :key="recipe.id"
              @click="assignRecipeToDate(recipe.id, selectedDate)"
              class="w-full text-left p-3 rounded-xl transition-all"
              :class="(wizardAssignments[selectedDate] || []).includes(recipe.id) ? 'bg-green-100 text-green-800' : 'bg-gray-50 hover:bg-gray-100'"
            >
              {{ recipe.title }}
              <span v-if="(wizardAssignments[selectedDate] || []).includes(recipe.id)" class="text-green-600 ml-2">✓</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 4: 預覽 -->
      <div v-if="wizardStep === 4" class="space-y-4">
        <div class="bg-white rounded-2xl shadow-md p-4">
          <h3 class="font-semibold text-gray-800">✅ Step 4: 確認預覽</h3>
        </div>
        
        <div class="space-y-3">
          <div v-for="dateStr in sortedWizardDates" :key="dateStr" class="bg-white rounded-xl shadow-md p-4">
            <p class="font-medium text-gray-800 mb-2">📅 {{ dateStr }}</p>
            <div v-if="(wizardAssignments[dateStr] || []).length > 0" class="space-y-1">
              <div v-for="recipeId in wizardAssignments[dateStr]" :key="recipeId" class="text-sm text-gray-600 flex items-center gap-2">
                <span>🍳</span><span>{{ getRecipeById(recipeId)?.title }}</span>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">未安排</p>
          </div>
        </div>
      </div>

      <!-- Wizard 導航 -->
      <div class="flex gap-3 mt-6">
        <button v-if="wizardStep > 1" @click="prevWizardStep" class="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium">← 上一步</button>
        <button v-if="wizardStep < 4" @click="nextWizardStep" class="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium">下一步 →</button>
        <button v-if="wizardStep === 4" @click="finishWizard" class="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium">✅ 完成</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
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
