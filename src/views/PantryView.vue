<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePantryStore } from '@/stores/pantry'
import { useFoodStore } from '@/stores/food'
import { useRouter } from 'vue-router'
import { getIngredientImageUrl, hasLocalImage } from '@/composables/useIngredientImage'
import IngredientPickerModal from '@/components/IngredientPickerModal.vue'

const router = useRouter()
const pantryStore = usePantryStore()
const foodStore = useFoodStore()

// Modal 狀態
const showPickerModal = ref(false)

// 開啟食材選擇 Modal
function openPicker() {
  showPickerModal.value = true
}

// 關閉食材選擇 Modal
function closePicker() {
  showPickerModal.value = false
}

// 取得冰箱內的食材詳細資料
const pantryItems = computed(() => {
  // pantryStore.pantryStock 是一個 Set<string>，包含食材 ID
  const ids = Array.from(pantryStore.pantryStock)
  return ids.map(ingredientId => {
    const ingredient = foodStore.getIngredientById(ingredientId)
    return {
      ingredientId,
      ingredient,
      imageUrl: hasLocalImage(ingredientId) 
        ? getIngredientImageUrl(ingredientId)
        : ingredient?.imageUrl || 'https://placehold.co/200x200/e2e8f0/64748b?text=Food'
    }
  }).filter(item => item.ingredient) // 過濾掉找不到的食材
})

// 按分類分組
const groupedItems = computed(() => {
  const groups: Record<string, typeof pantryItems.value> = {}
  pantryItems.value.forEach(item => {
    const category = item.ingredient?.category || 'other'
    if (!groups[category]) groups[category] = []
    groups[category].push(item)
  })
  return groups
})

// 分類標籤
const categoryLabels: Record<string, { label: string, emoji: string }> = {
  grain: { label: '穀物類', emoji: '🌾' },
  vegetable: { label: '蔬菜類', emoji: '🥬' },
  fruit: { label: '水果類', emoji: '🍎' },
  protein: { label: '蛋白質類', emoji: '🥩' },
  dairy: { label: '乳製品類', emoji: '🥛' },
  other: { label: '其他', emoji: '🧂' },
}

// 移除冰箱項目
function removeItem(ingredientId: string) {
  pantryStore.removeItem(ingredientId)
}

// 導航到食材詳情
function goToIngredient(ingredientId: string) {
  router.push(`/ingredient/${ingredientId}`)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 pb-24">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-20">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-center">
          <h1 class="text-xl font-bold text-gray-800">🧊 我的冰箱</h1>
        </div>
      </div>
    </header>

    <!-- 統計 -->
    <div class="container mx-auto px-4 py-4">
      <div class="bg-white rounded-2xl shadow-md p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">冰箱庫存</p>
            <p class="text-3xl font-bold text-cyan-600">{{ pantryItems.length }}</p>
            <p class="text-xs text-gray-400">種食材</p>
          </div>
          <button
            @click="openPicker"
            class="px-4 py-2 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors flex items-center gap-1"
          >
            <span>➕</span>
            <span>新增食材</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 冰箱內容 -->
    <div class="container mx-auto px-4">
      <!-- 有項目時 -->
      <template v-if="pantryItems.length > 0">
        <div 
          v-for="(items, category) in groupedItems" 
          :key="category"
          class="mb-6"
        >
          <!-- 分類標題 -->
          <h2 class="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <span>{{ categoryLabels[category]?.emoji || '📦' }}</span>
            <span>{{ categoryLabels[category]?.label || category }}</span>
            <span class="text-gray-400">({{ items.length }})</span>
          </h2>
          
          <!-- 食材卡片 -->
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="item in items"
              :key="item.ingredientId"
              class="bg-white rounded-xl shadow-md overflow-hidden relative group"
            >
              <!-- 刪除按鈕 -->
              <button
                @click.stop="removeItem(item.ingredientId)"
                class="absolute top-1 right-1 z-10 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
              
              <!-- 圖片 -->
              <div 
                @click="goToIngredient(item.ingredientId)"
                class="aspect-square bg-white p-2 cursor-pointer"
              >
                <img
                  :src="item.imageUrl"
                  :alt="item.ingredient?.name"
                  class="w-full h-full object-contain"
                  @error="($event.target as HTMLImageElement).src = 'https://placehold.co/200x200/e2e8f0/64748b?text=Food'"
                />
              </div>
              
              <!-- 名稱 -->
              <div class="p-2 text-center">
                <p class="text-sm font-medium text-gray-800 truncate">
                  {{ item.ingredient?.name }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 空狀態 -->
      <div
        v-else
        class="text-center py-16"
      >
        <div class="text-6xl mb-4">🧊</div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">冰箱是空的</h3>
        <p class="text-gray-500 mb-6">點擊下方按鈕新增食材吧！</p>
        <button
          @click="openPicker"
          class="px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
        >
          ➕ 新增食材
        </button>
      </div>
    </div>

    <!-- 食材選擇 Modal -->
    <IngredientPickerModal 
      :visible="showPickerModal" 
      @close="closePicker"
    />
  </div>
</template>
