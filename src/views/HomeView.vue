<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { usePlanStore } from '@/stores/plan'
import { useFoodStore } from '@/stores/food'
import { useUserStore } from '@/stores/user'
import { useShoppingList } from '@/composables/useShoppingList'
import { useSmartRecipes } from '@/composables/useSmartRecipes'

const planStore = usePlanStore()
const foodStore = useFoodStore()
const userStore = useUserStore()
const { shoppingList, pendingCount, togglePurchased, addAllPurchasedToPantry } = useShoppingList()
const { recommendedRecipes } = useSmartRecipes()

// 取得本週日期
const weekDates = computed(() => {
  const dates: { date: string; dayName: string; dayNum: number; isToday: boolean }[] = []
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
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
      isToday: dateStr === todayStr,
    })
  }
  return dates
})

// 購物清單展開狀態
const isShoppingListOpen = ref(false)

// 餐點編輯 Modal
const selectedMealDate = ref<string | null>(null)
const selectedMealRecipeId = ref<string | null>(null)
const isReplacingRecipe = ref(false)

// 取得食譜資訊
function getRecipe(recipeId: string) {
  return foodStore.recipes.find((r) => r.id === recipeId)
}

// 取得某日的餐點
function getMealsForDate(date: string) {
  return planStore.getMealsForDate(date)
}

// 開啟餐點編輯
function openMealEditor(date: string, recipeId: string) {
  selectedMealDate.value = date
  selectedMealRecipeId.value = recipeId
  isReplacingRecipe.value = false
}

// 關閉餐點編輯
function closeMealEditor() {
  selectedMealDate.value = null
  selectedMealRecipeId.value = null
  isReplacingRecipe.value = false
}

// 刪除餐點
function deleteMeal() {
  if (selectedMealDate.value && selectedMealRecipeId.value) {
    planStore.removeMealFromDate(selectedMealDate.value, selectedMealRecipeId.value)
    closeMealEditor()
  }
}

// 替換食譜
function replaceRecipe(newRecipeId: string) {
  if (selectedMealDate.value && selectedMealRecipeId.value) {
    planStore.removeMealFromDate(selectedMealDate.value, selectedMealRecipeId.value)
    planStore.addMealToDate(selectedMealDate.value, newRecipeId)
    closeMealEditor()
  }
}

// 分類標籤
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    grain: '穀物',
    vegetable: '蔬菜',
    fruit: '水果',
    protein: '蛋白質',
  }
  return labels[category] || category
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    grain: 'bg-amber-100 text-amber-800',
    vegetable: 'bg-green-100 text-green-800',
    fruit: 'bg-pink-100 text-pink-800',
    protein: 'bg-blue-100 text-blue-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 pb-32">
    <!-- Header -->
    <header class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white pt-8 pb-12 px-4">
      <div class="container mx-auto">
        <h1 class="text-3xl font-bold text-center mb-2">🍼 BabyMeal Passport</h1>
        <p class="text-center opacity-80">
          {{ userStore.babyName ? `${userStore.babyName} · ${userStore.getAgeDisplay}` : '寶寶副食品管理' }}
        </p>
      </div>
    </header>

    <!-- 快捷入口 -->
    <div class="container mx-auto px-4 -mt-6">
      <div class="grid grid-cols-3 gap-3">
        <RouterLink
          to="/profile"
          class="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition-all"
        >
          <div class="text-2xl mb-1">🥕</div>
          <p class="text-xs text-gray-600">食材護照</p>
        </RouterLink>
        <RouterLink
          to="/recipes"
          class="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition-all"
        >
          <div class="text-2xl mb-1">📖</div>
          <p class="text-xs text-gray-600">智慧食譜</p>
        </RouterLink>
        <RouterLink
          to="/wizard"
          class="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition-all"
        >
          <div class="text-2xl mb-1">📅</div>
          <p class="text-xs text-gray-600">週計畫</p>
        </RouterLink>
      </div>
    </div>

    <!-- 本週行事曆 -->
    <div class="container mx-auto px-4 mt-6">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="font-semibold text-gray-800">📆 本週餐點</h2>
          <RouterLink
            v-if="!planStore.hasCurrentPlan"
            to="/wizard"
            class="text-sm text-primary-500 font-medium"
          >
            + 建立計畫
          </RouterLink>
        </div>

        <!-- 週行事曆 -->
        <div class="divide-y">
          <div
            v-for="day in weekDates"
            :key="day.date"
            class="p-4 hover:bg-gray-50 transition-colors"
            :class="{ 'bg-primary-50': day.isToday }"
          >
            <div class="flex items-start gap-4">
              <!-- 日期 -->
              <div
                class="w-12 text-center flex-shrink-0"
                :class="day.isToday ? 'text-primary-600' : 'text-gray-500'"
              >
                <p class="text-xs font-medium">{{ day.dayName }}</p>
                <p class="text-xl font-bold">{{ day.dayNum }}</p>
              </div>

              <!-- 餐點 -->
              <div class="flex-1 min-h-[40px]">
                <div
                  v-if="getMealsForDate(day.date).length > 0"
                  class="flex flex-wrap gap-2"
                >
                  <button
                    v-for="recipeId in getMealsForDate(day.date)"
                    :key="recipeId"
                    @click="openMealEditor(day.date, recipeId)"
                    class="px-3 py-1.5 bg-gradient-to-r from-primary-100 to-secondary-100 text-gray-700 rounded-full text-sm hover:shadow-md transition-all"
                  >
                    {{ getRecipe(recipeId)?.title || recipeId }}
                  </button>
                </div>
                <p v-else class="text-gray-400 text-sm italic">尚未安排</p>
              </div>

              <!-- 今日標記 -->
              <div v-if="day.isToday" class="flex-shrink-0">
                <span class="px-2 py-1 bg-primary-500 text-white text-xs rounded-full">今天</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 購物清單摘要 -->
    <div
      v-if="planStore.hasCurrentPlan && shoppingList.length > 0"
      class="fixed bottom-0 left-0 right-0 z-30"
    >
      <!-- 展開的購物清單 -->
      <Transition name="slide-up">
        <div
          v-if="isShoppingListOpen"
          class="bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden flex flex-col"
        >
          <div class="p-4 border-b flex items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
            <h3 class="font-semibold">🛒 購物清單</h3>
            <button @click="isShoppingListOpen = false" class="p-1 hover:bg-white/20 rounded">
              ✕
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4">
            <div class="space-y-2">
              <label
                v-for="item in shoppingList"
                :key="item.ingredientId"
                class="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer"
                :class="item.purchased ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'"
              >
                <input
                  type="checkbox"
                  :checked="item.purchased"
                  @change="togglePurchased(item.ingredientId)"
                  class="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span
                  class="flex-1"
                  :class="item.purchased ? 'line-through text-gray-400' : 'text-gray-700'"
                >
                  {{ item.name }}
                </span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="getCategoryColor(item.category)"
                >
                  {{ getCategoryLabel(item.category) }}
                </span>
              </label>
            </div>
          </div>

          <div class="p-4 border-t bg-gray-50">
            <button
              @click="addAllPurchasedToPantry"
              class="w-full py-3 bg-secondary-500 text-white rounded-xl font-medium hover:bg-secondary-600 transition-colors"
            >
              ✓ 已買完，加入冰箱
            </button>
          </div>
        </div>
      </Transition>

      <!-- 收起的摘要按鈕 -->
      <button
        v-if="!isShoppingListOpen"
        @click="isShoppingListOpen = true"
        class="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4 flex items-center justify-between shadow-lg"
      >
        <span class="font-medium">🛒 購物清單</span>
        <span class="bg-white/20 px-3 py-1 rounded-full text-sm">
          待買: {{ pendingCount }} 項
        </span>
      </button>
    </div>

    <!-- 餐點編輯 Modal -->
    <Transition name="fade">
      <div
        v-if="selectedMealDate && selectedMealRecipeId"
        class="fixed inset-0 bg-black/50 z-40 flex items-end md:items-center justify-center p-4"
        @click.self="closeMealEditor"
      >
        <div class="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md overflow-hidden">
          <!-- 主選單 -->
          <div v-if="!isReplacingRecipe">
            <div class="p-4 border-b">
              <h3 class="font-semibold text-gray-800">
                {{ getRecipe(selectedMealRecipeId)?.title }}
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                {{ weekDates.find(d => d.date === selectedMealDate)?.dayName }} · {{ selectedMealDate }}
              </p>
            </div>

            <div class="p-4 space-y-2">
              <button
                @click="isReplacingRecipe = true"
                class="w-full py-3 bg-primary-100 text-primary-700 rounded-xl font-medium hover:bg-primary-200 transition-colors"
              >
                🔄 替換食譜
              </button>
              <button
                @click="deleteMeal"
                class="w-full py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
              >
                🗑️ 刪除餐點
              </button>
              <button
                @click="closeMealEditor"
                class="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>

          <!-- 替換食譜選單 -->
          <div v-else>
            <div class="p-4 border-b flex items-center gap-2">
              <button
                @click="isReplacingRecipe = false"
                class="text-gray-500 hover:text-gray-700"
              >
                ←
              </button>
              <h3 class="font-semibold text-gray-800">選擇新食譜</h3>
            </div>

            <div class="max-h-[50vh] overflow-y-auto p-4 space-y-2">
              <button
                v-for="sr in recommendedRecipes.filter(r => r.recipe.id !== selectedMealRecipeId)"
                :key="sr.recipe.id"
                @click="replaceRecipe(sr.recipe.id)"
                class="w-full p-3 text-left bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors"
              >
                <p class="font-medium text-gray-800">{{ sr.recipe.title }}</p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ sr.recipe.min_month }}-{{ sr.recipe.max_month }}M
                  <span v-if="sr.readyToCook" class="text-green-600">· ✅ 食材齊全</span>
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
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
