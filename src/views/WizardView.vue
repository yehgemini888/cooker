<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanStore, type WeekPlan } from '@/stores/plan'
import { useFoodStore } from '@/stores/food'
import { useSmartRecipes, type ScoredRecipe } from '@/composables/useSmartRecipes'

const router = useRouter()
const planStore = usePlanStore()
const foodStore = useFoodStore()
const { recommendedRecipes, scoredRecipes } = useSmartRecipes()

// 目前步驟
const currentStep = ref(1)
const totalSteps = 4

// Step 1: 選擇日期
const selectedDates = ref<string[]>([])
const copyFromLastWeek = ref(false)

// Step 2: 選擇食譜
const selectedRecipes = ref<string[]>([])

// Step 3: 分配食譜
const assignedMeals = ref<Record<string, string[]>>({})

// 取得本週日期 (週一到週日)
const weekDates = computed(() => {
  const dates: { date: string; dayName: string; dayNum: number }[] = []
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)

  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(diff + i)
    const dateStr = d.toISOString().split('T')[0]
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    dates.push({
      date: dateStr,
      dayName: `週${dayNames[d.getDay()]}`,
      dayNum: d.getDate(),
    })
  }
  return dates
})

// 切換日期選擇
function toggleDate(date: string) {
  const index = selectedDates.value.indexOf(date)
  if (index >= 0) {
    selectedDates.value.splice(index, 1)
  } else {
    selectedDates.value.push(date)
  }
  selectedDates.value.sort()
}

// 選擇全部日期
function selectAllDates() {
  selectedDates.value = weekDates.value.map((d) => d.date)
}

// 複製上週計畫
function handleCopyLastWeek() {
  if (!planStore.lastWeekPlan) return
  copyFromLastWeek.value = true
}

// 切換食譜選擇
function toggleRecipe(recipeId: string) {
  const index = selectedRecipes.value.indexOf(recipeId)
  if (index >= 0) {
    selectedRecipes.value.splice(index, 1)
  } else {
    if (selectedRecipes.value.length < 7) {
      selectedRecipes.value.push(recipeId)
    }
  }
}

// 自動隨機分配
function autoAssign() {
  const meals: Record<string, string[]> = {}
  const recipes = [...selectedRecipes.value]

  selectedDates.value.forEach((date) => {
    meals[date] = []
    if (recipes.length > 0) {
      // 隨機選一道菜
      const randomIndex = Math.floor(Math.random() * recipes.length)
      meals[date].push(recipes[randomIndex])
    }
  })

  assignedMeals.value = meals
}

// 手動分配食譜到日期
function assignRecipeToDate(recipeId: string, date: string) {
  if (!assignedMeals.value[date]) {
    assignedMeals.value[date] = []
  }
  if (!assignedMeals.value[date].includes(recipeId)) {
    assignedMeals.value[date].push(recipeId)
  }
}

// 從日期移除食譜
function removeRecipeFromDate(recipeId: string, date: string) {
  if (!assignedMeals.value[date]) return
  const index = assignedMeals.value[date].indexOf(recipeId)
  if (index >= 0) {
    assignedMeals.value[date].splice(index, 1)
  }
}

// 取得食譜名稱
function getRecipeTitle(recipeId: string): string {
  const recipe = foodStore.recipes.find((r) => r.id === recipeId)
  return recipe?.title || recipeId
}

// 下一步
function nextStep() {
  if (currentStep.value === 1) {
    // 初始化 Step 2
    if (copyFromLastWeek.value && planStore.lastWeekPlan) {
      // 複製上週的食譜選擇
      const lastMeals = planStore.lastWeekPlan.meals
      const allRecipeIds = new Set<string>()
      Object.values(lastMeals).forEach((ids) => {
        ids.forEach((id) => allRecipeIds.add(id))
      })
      selectedRecipes.value = [...allRecipeIds]
    }
  }

  if (currentStep.value === 2) {
    // 初始化 Step 3 的分配
    if (copyFromLastWeek.value && planStore.lastWeekPlan) {
      // Deep Copy 上週分配
      const copiedPlan = planStore.copyLastWeekPlan(selectedDates.value)
      if (copiedPlan) {
        assignedMeals.value = { ...copiedPlan.meals }
      }
    } else {
      // 初始化空的分配
      selectedDates.value.forEach((date) => {
        if (!assignedMeals.value[date]) {
          assignedMeals.value[date] = []
        }
      })
    }
  }

  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

// 上一步
function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// 完成並儲存
function finishWizard() {
  const plan: WeekPlan = {
    id: `plan-${Date.now()}`,
    weekStartDate: planStore.currentWeekStart,
    meals: { ...assignedMeals.value },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  planStore.savePlan(plan)
  router.push('/')
}

// 可以進入下一步
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return selectedDates.value.length > 0
    case 2:
      return selectedRecipes.value.length >= 1
    case 3:
      return Object.values(assignedMeals.value).some((meals) => meals.length > 0)
    default:
      return true
  }
})

// 取得排序後的食譜 (僅推薦)
const displayRecipes = computed(() => {
  return recommendedRecipes.value.length > 0 ? recommendedRecipes.value : scoredRecipes.value
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <button
            @click="router.push('/')"
            class="text-gray-600 hover:text-primary-500 transition-colors"
          >
            ✕ 取消
          </button>
          <h1 class="text-xl font-bold text-gray-800">📅 週計畫嚮導</h1>
          <div class="w-12"></div>
        </div>
      </div>
    </header>

    <!-- Progress Bar -->
    <div class="bg-white border-b">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-500">步驟 {{ currentStep }} / {{ totalSteps }}</span>
          <span class="text-sm text-gray-500">
            {{ ['設定日期', '選擇食譜', '分配餐點', '確認計畫'][currentStep - 1] }}
          </span>
        </div>
        <div class="flex gap-2">
          <div
            v-for="step in totalSteps"
            :key="step"
            class="flex-1 h-2 rounded-full transition-all duration-300"
            :class="step <= currentStep ? 'bg-primary-500' : 'bg-gray-200'"
          ></div>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="container mx-auto px-4 py-6">
      <!-- Step 1: 選擇日期 -->
      <div v-if="currentStep === 1" class="space-y-6">
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">📆 選擇要規劃的日期</h2>

          <div class="grid grid-cols-7 gap-2 mb-4">
            <button
              v-for="day in weekDates"
              :key="day.date"
              @click="toggleDate(day.date)"
              class="flex flex-col items-center p-3 rounded-xl transition-all duration-200"
              :class="selectedDates.includes(day.date)
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
              <span class="text-xs font-medium">{{ day.dayName }}</span>
              <span class="text-lg font-bold mt-1">{{ day.dayNum }}</span>
            </button>
          </div>

          <button
            @click="selectAllDates"
            class="w-full py-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
          >
            選擇全部
          </button>
        </div>

        <!-- 複製上週 -->
        <div
          v-if="planStore.lastWeekPlan"
          class="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 class="text-lg font-semibold text-gray-800 mb-2">⏪ 複製上週計畫</h2>
          <p class="text-sm text-gray-500 mb-4">
            將上週的餐點規劃複製到本週，您可以在後續步驟進行調整。
          </p>
          <button
            @click="handleCopyLastWeek"
            class="w-full py-3 rounded-xl font-medium transition-all duration-200"
            :class="copyFromLastWeek
              ? 'bg-secondary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          >
            {{ copyFromLastWeek ? '✓ 已選擇複製上週' : '複製上週計畫' }}
          </button>
        </div>
      </div>

      <!-- Step 2: 選擇食譜 -->
      <div v-if="currentStep === 2" class="space-y-4">
        <div class="bg-white rounded-xl shadow-md p-4">
          <p class="text-sm text-gray-600">
            已選擇 <span class="font-bold text-primary-500">{{ selectedRecipes.length }}</span> 道食譜
            <span class="text-gray-400">(建議 3-5 道)</span>
          </p>
        </div>

        <div class="space-y-3">
          <div
            v-for="sr in displayRecipes"
            :key="sr.recipe.id"
            @click="toggleRecipe(sr.recipe.id)"
            class="bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all duration-200"
            :class="{
              'ring-2 ring-primary-500 bg-primary-50': selectedRecipes.includes(sr.recipe.id),
              'hover:shadow-lg': !selectedRecipes.includes(sr.recipe.id),
              'opacity-50': sr.hasAllergyIngredients
            }"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all"
                :class="selectedRecipes.includes(sr.recipe.id)
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100'"
              >
                {{ selectedRecipes.includes(sr.recipe.id) ? '✓' : '' }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-medium text-gray-800">{{ sr.recipe.title }}</h3>
                  <span
                    v-if="sr.readyToCook"
                    class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800"
                  >
                    ✅ Ready
                  </span>
                  <span
                    v-if="sr.hasAllergyIngredients"
                    class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800"
                  >
                    ⚠️ 過敏
                  </span>
                </div>
                <p class="text-sm text-gray-500 mt-1">
                  {{ sr.recipe.min_month }}-{{ sr.recipe.max_month }}M ·
                  {{ sr.missingIngredients.length > 0 ? `缺 ${sr.missingIngredients.length} 種食材` : '食材齊全' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: 分配餐點 -->
      <div v-if="currentStep === 3" class="space-y-4">
        <div class="bg-white rounded-xl shadow-md p-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-600">將食譜分配到各天</p>
            <button
              @click="autoAssign"
              class="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              🎲 自動分配
            </button>
          </div>
        </div>

        <!-- 已選食譜 (可拖放) -->
        <div class="bg-white rounded-xl shadow-md p-4">
          <h3 class="text-sm font-medium text-gray-500 mb-3">已選食譜 (點擊分配到日期)</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="recipeId in selectedRecipes"
              :key="recipeId"
              class="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm cursor-pointer hover:bg-primary-200 transition-colors"
            >
              {{ getRecipeTitle(recipeId) }}
            </span>
          </div>
        </div>

        <!-- 日期分配區 -->
        <div class="space-y-3">
          <div
            v-for="date in selectedDates"
            :key="date"
            class="bg-white rounded-xl shadow-md p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium text-gray-800">
                {{ weekDates.find(d => d.date === date)?.dayName }}
                <span class="text-gray-500 text-sm ml-1">{{ date }}</span>
              </h3>
            </div>

            <!-- 已分配的食譜 -->
            <div v-if="assignedMeals[date]?.length" class="flex flex-wrap gap-2 mb-3">
              <span
                v-for="recipeId in assignedMeals[date]"
                :key="recipeId"
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-full text-sm"
              >
                {{ getRecipeTitle(recipeId) }}
                <button
                  @click="removeRecipeFromDate(recipeId, date)"
                  class="ml-1 hover:text-red-500"
                >
                  ✕
                </button>
              </span>
            </div>

            <!-- 快速選擇按鈕 -->
            <div class="flex flex-wrap gap-1">
              <button
                v-for="recipeId in selectedRecipes.filter(id => !assignedMeals[date]?.includes(id))"
                :key="recipeId"
                @click="assignRecipeToDate(recipeId, date)"
                class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-primary-100 hover:text-primary-600 transition-colors"
              >
                + {{ getRecipeTitle(recipeId) }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: 確認計畫 -->
      <div v-if="currentStep === 4" class="space-y-4">
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">✨ 週計畫預覽</h2>

          <div class="space-y-4">
            <div
              v-for="date in selectedDates"
              :key="date"
              class="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
            >
              <div class="flex items-start gap-4">
                <div class="w-16 text-center">
                  <p class="text-sm text-gray-500">
                    {{ weekDates.find(d => d.date === date)?.dayName }}
                  </p>
                  <p class="text-2xl font-bold text-gray-800">
                    {{ weekDates.find(d => d.date === date)?.dayNum }}
                  </p>
                </div>
                <div class="flex-1">
                  <div
                    v-if="assignedMeals[date]?.length"
                    class="space-y-2"
                  >
                    <div
                      v-for="recipeId in assignedMeals[date]"
                      :key="recipeId"
                      class="p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl"
                    >
                      <p class="font-medium text-gray-800">{{ getRecipeTitle(recipeId) }}</p>
                    </div>
                  </div>
                  <p v-else class="text-gray-400 italic">尚未安排餐點</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Navigation -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div class="container mx-auto px-4 py-4 flex gap-3">
        <button
          v-if="currentStep > 1"
          @click="prevStep"
          class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
        >
          ← 上一步
        </button>
        <button
          v-if="currentStep < totalSteps"
          @click="nextStep"
          :disabled="!canProceed"
          class="flex-1 py-3 rounded-xl font-medium transition-all duration-200"
          :class="canProceed
            ? 'bg-primary-500 text-white hover:bg-primary-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
        >
          下一步 →
        </button>
        <button
          v-if="currentStep === totalSteps"
          @click="finishWizard"
          class="flex-1 py-3 rounded-xl bg-secondary-500 text-white font-medium hover:bg-secondary-600 transition-colors"
        >
          ✓ 完成並儲存
        </button>
      </div>
    </div>

    <!-- Bottom Spacer -->
    <div class="h-24"></div>
  </div>
</template>
