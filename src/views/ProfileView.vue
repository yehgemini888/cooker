<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore, type IngredientState } from '@/stores/user'
import { useFoodStore } from '@/stores/food'

const userStore = useUserStore()
const foodStore = useFoodStore()

// 編輯模式
const isEditingProfile = ref(false)
const editName = ref(userStore.babyName)
const editBirthday = ref(userStore.birthday)

// 展開的食材卡片
const expandedIngredient = ref<string | null>(null)

// 篩選器
const categoryFilter = ref<string>('all')
const statusFilter = ref<string>('all')

// 分類選項
const categories = [
  { value: 'all', label: '全部' },
  { value: 'grain', label: '穀物類' },
  { value: 'vegetable', label: '蔬菜類' },
  { value: 'fruit', label: '水果類' },
  { value: 'protein', label: '蛋白質類' },
]

// 狀態選項
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'tried', label: '已嘗試' },
  { value: 'not_tried', label: '未嘗試' },
  { value: 'allergy', label: '過敏' },
]

// 喜好選項
const preferenceOptions = [
  { value: 'love', emoji: '😍', label: '喜歡' },
  { value: 'neutral', emoji: '😐', label: '普通' },
  { value: 'dislike', emoji: '🤢', label: '不喜歡' },
]

// 篩選後的食材
const filteredIngredients = computed(() => {
  return foodStore.ingredients.filter((ingredient) => {
    // 分類篩選
    if (categoryFilter.value !== 'all' && ingredient.category !== categoryFilter.value) {
      return false
    }

    // 狀態篩選
    const state = userStore.getIngredientState(ingredient.id)
    if (statusFilter.value === 'tried' && state.status !== 'tried') {
      return false
    }
    if (statusFilter.value === 'not_tried' && state.status !== 'not_tried') {
      return false
    }
    if (statusFilter.value === 'allergy' && !state.allergy) {
      return false
    }

    return true
  })
})

// 分類標籤顏色
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    grain: 'bg-amber-100 text-amber-800',
    vegetable: 'bg-green-100 text-green-800',
    fruit: 'bg-pink-100 text-pink-800',
    protein: 'bg-blue-100 text-blue-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

// 分類標籤名稱
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    grain: '穀物',
    vegetable: '蔬菜',
    fruit: '水果',
    protein: '蛋白質',
  }
  return labels[category] || category
}

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

// 切換嘗試狀態
function toggleTried(ingredientId: string) {
  const currentState = userStore.getIngredientState(ingredientId)
  userStore.updateIngredientState(ingredientId, {
    status: currentState.status === 'tried' ? 'not_tried' : 'tried',
  })
}

// 切換過敏狀態
function toggleAllergy(ingredientId: string) {
  const currentState = userStore.getIngredientState(ingredientId)
  userStore.updateIngredientState(ingredientId, {
    allergy: !currentState.allergy,
  })
}

// 設定喜好
function setPreference(ingredientId: string, preference: IngredientState['preference']) {
  const currentState = userStore.getIngredientState(ingredientId)
  userStore.updateIngredientState(ingredientId, {
    preference: currentState.preference === preference ? null : preference,
  })
}

// 更新備註
function updateNote(ingredientId: string, note: string) {
  userStore.updateIngredientState(ingredientId, { note })
}

// 切換展開狀態
function toggleExpand(ingredientId: string) {
  expandedIngredient.value = expandedIngredient.value === ingredientId ? null : ingredientId
}

// 取得喜好 emoji
function getPreferenceEmoji(preference: IngredientState['preference']): string {
  const emojis: Record<string, string> = {
    love: '😍',
    neutral: '😐',
    dislike: '🤢',
  }
  return preference ? emojis[preference] : ''
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 pb-8">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <router-link to="/" class="text-gray-600 hover:text-primary-500 transition-colors">
            ← 返回首頁
          </router-link>
          <h1 class="text-xl font-bold text-gray-800">🍼 食材護照</h1>
          <div class="w-16"></div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-6">
      <!-- 寶寶資料卡片 -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800">👶 寶寶資料</h2>
          <button
            v-if="!isEditingProfile"
            @click="isEditingProfile = true"
            class="text-primary-500 hover:text-primary-600 text-sm font-medium"
          >
            編輯
          </button>
        </div>

        <!-- 顯示模式 -->
        <div v-if="!isEditingProfile" class="space-y-3">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-3xl">
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
              <p class="text-2xl font-bold text-primary-500">{{ userStore.triedIngredientsCount }}</p>
              <p class="text-xs text-gray-500">已嘗試</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-red-500">{{ userStore.allergyIngredientsCount }}</p>
              <p class="text-xs text-gray-500">過敏食材</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-secondary-500">{{ foodStore.ingredients.length }}</p>
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

      <!-- 篩選器 -->
      <div class="bg-white rounded-xl shadow-md p-4 mb-6">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[140px]">
            <label class="block text-xs font-medium text-gray-500 mb-1">分類</label>
            <select
              v-model="categoryFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>
          <div class="flex-1 min-w-[140px]">
            <label class="block text-xs font-medium text-gray-500 mb-1">狀態</label>
            <select
              v-model="statusFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 食材列表 -->
      <div class="space-y-3">
        <div
          v-for="ingredient in filteredIngredients"
          :key="ingredient.id"
          class="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-200"
          :class="{ 'ring-2 ring-red-400': userStore.getIngredientState(ingredient.id).allergy }"
        >
          <!-- 食材主要資訊 -->
          <div
            class="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            @click="toggleExpand(ingredient.id)"
          >
            <div class="flex items-center gap-3">
              <!-- 嘗試狀態指示器 -->
              <button
                @click.stop="toggleTried(ingredient.id)"
                class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                :class="userStore.getIngredientState(ingredient.id).status === 'tried'
                  ? 'bg-secondary-500 text-white'
                  : 'bg-gray-200 text-gray-400'"
              >
                <span v-if="userStore.getIngredientState(ingredient.id).status === 'tried'" class="text-lg">✓</span>
                <span v-else class="text-lg">○</span>
              </button>

              <!-- 食材名稱與標籤 -->
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-800">{{ ingredient.name }}</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="getCategoryColor(ingredient.category)"
                  >
                    {{ getCategoryLabel(ingredient.category) }}
                  </span>
                  <span
                    v-if="userStore.getIngredientState(ingredient.id).allergy"
                    class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800"
                  >
                    ⚠️ 過敏
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-lg">
                    {{ getPreferenceEmoji(userStore.getIngredientState(ingredient.id).preference) }}
                  </span>
                  <span
                    v-if="userStore.getIngredientState(ingredient.id).note"
                    class="text-xs text-gray-400"
                  >
                    📝 有備註
                  </span>
                </div>
              </div>

              <!-- 展開箭頭 -->
              <div
                class="text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': expandedIngredient === ingredient.id }"
              >
                ▼
              </div>
            </div>
          </div>

          <!-- 展開的詳細設定 -->
          <div
            v-if="expandedIngredient === ingredient.id"
            class="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50"
          >
            <!-- 過敏開關 -->
            <div class="flex items-center justify-between py-3 border-b border-gray-200">
              <span class="text-sm text-gray-700">⚠️ 標記為過敏</span>
              <button
                @click="toggleAllergy(ingredient.id)"
                class="relative w-14 h-7 rounded-full transition-colors duration-200"
                :class="userStore.getIngredientState(ingredient.id).allergy
                  ? 'bg-red-500'
                  : 'bg-gray-300'"
              >
                <span
                  class="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-200"
                  :class="userStore.getIngredientState(ingredient.id).allergy ? 'left-7' : 'left-0.5'"
                ></span>
              </button>
            </div>

            <!-- 喜好選擇 -->
            <div class="py-3 border-b border-gray-200">
              <p class="text-sm text-gray-700 mb-2">喜好程度</p>
              <div class="flex gap-2">
                <button
                  v-for="pref in preferenceOptions"
                  :key="pref.value"
                  @click="setPreference(ingredient.id, pref.value as IngredientState['preference'])"
                  class="flex-1 py-2 rounded-lg text-center transition-all duration-200"
                  :class="userStore.getIngredientState(ingredient.id).preference === pref.value
                    ? 'bg-primary-100 ring-2 ring-primary-500'
                    : 'bg-gray-100 hover:bg-gray-200'"
                >
                  <span class="text-2xl block">{{ pref.emoji }}</span>
                  <span class="text-xs text-gray-600">{{ pref.label }}</span>
                </button>
              </div>
            </div>

            <!-- 備註輸入 -->
            <div class="pt-3">
              <label class="text-sm text-gray-700 block mb-2">📝 備註</label>
              <textarea
                :value="userStore.getIngredientState(ingredient.id).note"
                @input="(e) => updateNote(ingredient.id, (e.target as HTMLTextAreaElement).value)"
                placeholder="記錄寶寶的反應、製作方式等..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 空狀態 -->
        <div
          v-if="filteredIngredients.length === 0"
          class="text-center py-12 text-gray-500"
        >
          <p class="text-4xl mb-2">🔍</p>
          <p>沒有符合篩選條件的食材</p>
        </div>
      </div>
    </div>
  </div>
</template>
