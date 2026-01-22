<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useShoppingList } from '@/composables/useShoppingList'
import { useFoodStore } from '@/stores/food'
import { getIngredientImageUrl, hasLocalImage } from '@/composables/useIngredientImage'

const router = useRouter()
const foodStore = useFoodStore()
const {
  shoppingList,
  thisWeekList,
  nextWeekList,
  laterList,
  pendingCount,
  purchasedCount,
  thisWeekPendingCount,
  togglePurchased,
  markPurchasedAndAddToPantry,
  markThisWeekPurchased,
  clearAllPurchased,
  addThisWeekPurchasedToPantry,
} = useShoppingList()

// 分類標籤
const categoryLabels: Record<string, { label: string; emoji: string }> = {
  grain: { label: '穀物類', emoji: '🌾' },
  vegetable: { label: '蔬菜類', emoji: '🥬' },
  fruit: { label: '水果類', emoji: '🍎' },
  protein: { label: '蛋白質類', emoji: '🥩' },
  dairy: { label: '乳製品', emoji: '🥛' },
  other: { label: '其他', emoji: '🧂' },
}

// 取得圖片 URL
function getImageUrl(ingredientId: string): string {
  if (hasLocalImage(ingredientId)) {
    return getIngredientImageUrl(ingredientId)
  }
  const ingredient = foodStore.getIngredientById(ingredientId)
  return ingredient?.imageUrl || 'https://placehold.co/80x80/e2e8f0/64748b?text=Food'
}

// 導航到食材詳情
function goToIngredient(ingredientId: string) {
  router.push(`/ingredient/${ingredientId}`)
}

// 取得本周已勾選數量
const thisWeekPurchasedCount = computed(() =>
  thisWeekList.value.filter(item => item.purchased).length
)

// 完成本周購物
function finishThisWeekShopping() {
  if (thisWeekPurchasedCount.value === 0) {
    alert('請先勾選已購買的食材')
    return
  }
  
  if (confirm(`確定將 ${thisWeekPurchasedCount.value} 項本周食材加入冰箱？`)) {
    addThisWeekPurchasedToPantry()
  }
}

// 格式化日期顯示
function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 pb-24">
    <!-- Header -->
    <header class="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg sticky top-0 z-20">
      <div class="px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold flex items-center gap-2">
            <span>🛒</span>
            <span>購物清單</span>
          </h1>
          <div class="text-right">
            <p class="text-2xl font-bold">{{ thisWeekPendingCount }}</p>
            <p class="text-xs opacity-80">本周待購</p>
          </div>
        </div>
      </div>
    </header>

    <!-- 內容區 -->
    <div class="px-4 py-4 space-y-4">
      <!-- 空狀態 -->
      <div v-if="shoppingList.length === 0" class="bg-white rounded-2xl shadow-md p-8 text-center">
        <div class="text-5xl mb-4">🎉</div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">冰箱食材充足！</h3>
        <p class="text-gray-500 text-sm mb-4">
          本週計畫所需的食材都在冰箱裡了
        </p>
        <router-link
          to="/plan"
          class="inline-block px-6 py-2 bg-orange-500 text-white rounded-xl text-sm hover:bg-orange-600 transition-colors"
        >
          查看週計畫
        </router-link>
      </div>

      <!-- ================ 本周購買清單 ================ -->
      <div v-if="thisWeekList.length > 0" class="bg-white rounded-2xl shadow-md overflow-hidden">
        <!-- 標題 -->
        <div class="px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <div class="flex items-center justify-between">
            <h2 class="font-bold flex items-center gap-2">
              <span>🔥</span>
              <span>本周要買</span>
              <span class="text-xs opacity-80 font-normal">（這幾天需要用）</span>
            </h2>
            <span class="text-sm bg-white/20 px-2 py-0.5 rounded-full">
              {{ thisWeekList.length }} 項
            </span>
          </div>
        </div>
        
        <!-- 操作按鈕 -->
        <div class="px-4 py-3 bg-orange-50 flex gap-2">
          <button
            @click="markThisWeekPurchased"
            class="flex-1 py-2 text-sm bg-white text-gray-700 rounded-xl hover:bg-gray-100 transition-colors border"
          >
            全選本周
          </button>
          <button
            @click="finishThisWeekShopping"
            class="flex-1 py-2 text-sm bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            :class="{ 'opacity-50 cursor-not-allowed': thisWeekPurchasedCount === 0 }"
          >
            ✓ 加入冰箱
          </button>
        </div>
        
        <!-- 食材列表 -->
        <div class="divide-y divide-gray-100">
          <div
            v-for="item in thisWeekList"
            :key="item.ingredientId"
            class="flex items-center gap-3 p-4 transition-all"
            :class="{ 'bg-green-50 opacity-60': item.purchased }"
          >
            <!-- 勾選框 -->
            <button
              @click="togglePurchased(item.ingredientId)"
              class="w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
              :class="item.purchased
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-orange-400 hover:border-green-400'"
            >
              <span v-if="item.purchased" class="text-sm">✓</span>
            </button>
            
            <!-- 食材圖片 -->
            <div 
              @click="goToIngredient(item.ingredientId)"
              class="w-11 h-11 rounded-xl overflow-hidden bg-white flex-shrink-0 cursor-pointer"
            >
              <img
                :src="getImageUrl(item.ingredientId)"
                :alt="item.name"
                class="w-full h-full object-contain"
                :class="{ 'grayscale': item.purchased }"
              />
            </div>
            
            <!-- 食材資訊 -->
            <div class="flex-1 min-w-0">
              <p 
                class="font-medium truncate"
                :class="item.purchased ? 'text-gray-400 line-through' : 'text-gray-800'"
              >
                {{ item.name }}
              </p>
              <p class="text-xs text-gray-400">
                {{ formatDateDisplay(item.earliestDate) }} 需要用
              </p>
            </div>
            
            <!-- 快速購買按鈕 -->
            <button
              v-if="!item.purchased"
              @click="markPurchasedAndAddToPantry(item.ingredientId)"
              class="px-3 py-1 text-xs bg-cyan-100 text-cyan-700 rounded-full hover:bg-cyan-200 transition-colors flex-shrink-0"
            >
              🧊 買了
            </button>
          </div>
        </div>
      </div>

      <!-- ================ 下周購買清單 ================ -->
      <div v-if="nextWeekList.length > 0" class="bg-white rounded-2xl shadow-md overflow-hidden">
        <div class="px-4 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white">
          <div class="flex items-center justify-between">
            <h2 class="font-bold flex items-center gap-2">
              <span>📅</span>
              <span>下周再買</span>
              <span class="text-xs opacity-80 font-normal">（不急，下周才用）</span>
            </h2>
            <span class="text-sm bg-white/20 px-2 py-0.5 rounded-full">
              {{ nextWeekList.length }} 項
            </span>
          </div>
        </div>
        
        <div class="divide-y divide-gray-100">
          <div
            v-for="item in nextWeekList"
            :key="item.ingredientId"
            class="flex items-center gap-3 p-4 transition-all"
            :class="{ 'bg-green-50 opacity-60': item.purchased }"
          >
            <button
              @click="togglePurchased(item.ingredientId)"
              class="w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
              :class="item.purchased
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-blue-400 hover:border-green-400'"
            >
              <span v-if="item.purchased" class="text-sm">✓</span>
            </button>
            
            <div @click="goToIngredient(item.ingredientId)" class="w-11 h-11 rounded-xl overflow-hidden bg-white flex-shrink-0 cursor-pointer">
              <img :src="getImageUrl(item.ingredientId)" :alt="item.name" class="w-full h-full object-contain" :class="{ 'grayscale': item.purchased }" />
            </div>
            
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate" :class="item.purchased ? 'text-gray-400 line-through' : 'text-gray-800'">{{ item.name }}</p>
              <p class="text-xs text-gray-400">{{ formatDateDisplay(item.earliestDate) }} 需要用</p>
            </div>
            
            <button
              v-if="!item.purchased"
              @click="markPurchasedAndAddToPantry(item.ingredientId)"
              class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors flex-shrink-0"
            >
              🧊 買了
            </button>
          </div>
        </div>
      </div>

      <!-- ================ 更後購買清單 ================ -->
      <div v-if="laterList.length > 0" class="bg-white rounded-2xl shadow-md overflow-hidden">
        <div class="px-4 py-3 bg-gray-400 text-white">
          <div class="flex items-center justify-between">
            <h2 class="font-bold flex items-center gap-2">
              <span>⏳</span>
              <span>之後再買</span>
              <span class="text-xs opacity-80 font-normal">（兩周後才需要）</span>
            </h2>
            <span class="text-sm bg-white/20 px-2 py-0.5 rounded-full">
              {{ laterList.length }} 項
            </span>
          </div>
        </div>
        
        <div class="divide-y divide-gray-100">
          <div
            v-for="item in laterList"
            :key="item.ingredientId"
            class="flex items-center gap-3 p-4 transition-all opacity-60"
            :class="{ 'bg-green-50': item.purchased }"
          >
            <button
              @click="togglePurchased(item.ingredientId)"
              class="w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0"
              :class="item.purchased ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'"
            >
              <span v-if="item.purchased" class="text-sm">✓</span>
            </button>
            
            <div @click="goToIngredient(item.ingredientId)" class="w-11 h-11 rounded-xl overflow-hidden bg-white flex-shrink-0 cursor-pointer">
              <img :src="getImageUrl(item.ingredientId)" :alt="item.name" class="w-full h-full object-contain grayscale" />
            </div>
            
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate text-gray-500" :class="{ 'line-through': item.purchased }">{{ item.name }}</p>
              <p class="text-xs text-gray-400">{{ formatDateDisplay(item.earliestDate) }} 才需要</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 提示說明 -->
      <div v-if="shoppingList.length > 0" class="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <p class="text-sm text-amber-700">
          💡 <strong>新鮮購物小提示：</strong>
        </p>
        <ul class="text-sm text-amber-700 mt-2 space-y-1">
          <li>🔥 <strong>本周要買</strong>：這幾天的食譜會用到，建議盡快購買</li>
          <li>📅 <strong>下周再買</strong>：不急著買，下周才會用到</li>
          <li>⏳ <strong>之後再買</strong>：兩周後才需要，現在不用買</li>
        </ul>
      </div>
    </div>
  </div>
</template>
