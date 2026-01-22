<script setup lang="ts">
import { computed } from 'vue'
import { useFoodStore } from '@/stores/food'
import { usePantryStore } from '@/stores/pantry'
import type { Ingredient } from '@/types'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const foodStore = useFoodStore()
const pantryStore = usePantryStore()

// 按分類分組食材
const groupedIngredients = computed(() => {
  const groups: Record<string, Ingredient[]> = {}
  foodStore.ingredients.forEach(ingredient => {
    const category = ingredient.category || 'other'
    if (!groups[category]) groups[category] = []
    groups[category].push(ingredient)
  })
  return groups
})

// 分類標籤與顏色
const categoryConfig: Record<string, { label: string, emoji: string, color: string }> = {
  grain: { label: '穀物類', emoji: '🌾', color: 'amber' },
  vegetable: { label: '蔬菜類', emoji: '🥬', color: 'green' },
  fruit: { label: '水果類', emoji: '🍎', color: 'pink' },
  protein: { label: '蛋白質類', emoji: '🥩', color: 'red' },
  dairy: { label: '乳製品類', emoji: '🥛', color: 'purple' },
  other: { label: '其他', emoji: '🧂', color: 'gray' },
}

// 分類順序
const categoryOrder = ['grain', 'vegetable', 'fruit', 'protein', 'dairy', 'other']

// 計算冰箱內食材數量
const pantryCount = computed(() => pantryStore.pantryStock.size)

// 檢查是否在冰箱中
function isInPantry(id: string): boolean {
  return pantryStore.hasItem(id)
}

// 切換食材狀態
function toggleIngredient(id: string) {
  pantryStore.toggleItem(id)
}

// 關閉 Modal
function closeModal() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="visible" 
        class="fixed inset-0 z-50 flex items-end justify-center"
        @click.self="closeModal"
      >
        <!-- 背景遮罩 -->
        <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>
        
        <!-- Modal 內容 -->
        <div class="relative bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
          <!-- Header -->
          <div class="sticky top-0 bg-gradient-to-r from-cyan-500 to-cyan-600 px-5 py-4 flex items-center justify-between z-10">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🧊</span>
              <h2 class="text-xl font-bold text-white">我的冰箱</h2>
            </div>
            <button 
              @click="closeModal"
              class="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
          
          <!-- 統計 -->
          <div class="px-5 py-3 bg-cyan-50 border-b border-cyan-100">
            <p class="text-cyan-700">
              已有 <span class="font-bold text-cyan-600">{{ pantryCount }}</span> 種食材
            </p>
          </div>
          
          <!-- 食材列表 -->
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            <div 
              v-for="category in categoryOrder" 
              :key="category"
              v-show="groupedIngredients[category]?.length"
            >
              <!-- 分類標題 -->
              <h3 class="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                <span 
                  class="w-3 h-3 rounded-full"
                  :class="{
                    'bg-amber-400': category === 'grain',
                    'bg-green-500': category === 'vegetable',
                    'bg-pink-400': category === 'fruit',
                    'bg-red-400': category === 'protein',
                    'bg-purple-400': category === 'dairy',
                    'bg-gray-400': category === 'other',
                  }"
                ></span>
                {{ categoryConfig[category]?.label || category }}
              </h3>
              
              <!-- 食材標籤 -->
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="ingredient in groupedIngredients[category]"
                  :key="ingredient.id"
                  @click="toggleIngredient(ingredient.id)"
                  class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border-2"
                  :class="isInPantry(ingredient.id)
                    ? 'bg-cyan-500 text-white border-cyan-500 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300 hover:text-cyan-600'"
                >
                  {{ ingredient.name }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="sticky bottom-0 bg-white border-t px-5 py-4">
            <button
              @click="closeModal"
              class="w-full py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .animate-slide-up,
.modal-leave-active .animate-slide-up {
  transition: transform 0.3s ease;
}

.modal-enter-from .animate-slide-up {
  transform: translateY(100%);
}

.modal-leave-to .animate-slide-up {
  transform: translateY(100%);
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
