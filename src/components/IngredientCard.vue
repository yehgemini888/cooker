<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { usePantryStore } from '@/stores/pantry'
import type { Ingredient } from '@/types'

const props = defineProps<{
  ingredient: Ingredient
  minMonth?: number
}>()

const emit = defineEmits<{
  (e: 'click', ingredient: Ingredient): void
}>()

const userStore = useUserStore()
const pantryStore = usePantryStore()

// 取得食材狀態
const ingredientState = computed(() => {
  return userStore.getIngredientState(props.ingredient.id)
})

// 是否已嘗試
const isTried = computed(() => {
  return ingredientState.value.status === 'tried'
})

// 是否過敏
const hasAllergy = computed(() => {
  return ingredientState.value.allergy
})

// 是否為高過敏風險食材
const isHighAllergyRisk = computed(() => {
  return props.ingredient.allergy_risk === true
})

// 是否在冰箱庫存中
const isInPantry = computed(() => {
  return pantryStore.hasItem(props.ingredient.id)
})

// 預設圖片
const imageUrl = computed(() => {
  return props.ingredient.imageUrl || 'https://placehold.co/200x200?text=Food'
})

// 適合月齡顯示
const monthLabel = computed(() => {
  if (props.minMonth) {
    return `${props.minMonth}m+`
  }
  return '4m+'
})

// 分類標籤顏色
const categoryColor = computed(() => {
  const colors: Record<string, string> = {
    grain: 'bg-amber-100 text-amber-700',
    vegetable: 'bg-green-100 text-green-700',
    fruit: 'bg-pink-100 text-pink-700',
    protein: 'bg-blue-100 text-blue-700',
    dairy: 'bg-purple-100 text-purple-700',
    other: 'bg-gray-100 text-gray-700',
  }
  return colors[props.ingredient.category] || colors.other
})

// 點擊處理
function handleClick() {
  emit('click', props.ingredient)
}
</script>

<template>
  <div
    @click="handleClick"
    class="relative bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:scale-95"
    :class="{ 'ring-2 ring-cyan-400': isInPantry }"
  >
    <!-- 左上角: 冰箱庫存 Badge -->
    <div
      v-if="isInPantry"
      class="absolute top-2 left-2 z-10"
    >
      <div class="px-2 py-1 bg-cyan-500 text-white text-xs rounded-full shadow-md flex items-center gap-1">
        <span>🧊</span>
        <span class="font-medium">有</span>
      </div>
    </div>

    <!-- 右上角: 狀態 Badges -->
    <div class="absolute top-2 right-2 flex flex-col gap-1 z-10">
      <!-- 已嘗試 Badge -->
      <div
        v-if="isTried"
        class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md"
      >
        <span class="text-white text-xs">✓</span>
      </div>
      
      <!-- 過敏 Badge -->
      <div
        v-if="hasAllergy"
        class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md animate-pulse"
      >
        <span class="text-white text-xs font-bold">!</span>
      </div>
      
      <!-- 高過敏風險警示 (僅食材本身標記) -->
      <div
        v-if="isHighAllergyRisk && !hasAllergy"
        class="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center shadow-md"
        title="高過敏風險食材"
      >
        <span class="text-white text-xs">⚠</span>
      </div>
    </div>

    <!-- 圖片區域 -->
    <div class="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <img
        :src="imageUrl"
        :alt="ingredient.name"
        class="w-full h-full object-cover rounded-xl"
        loading="lazy"
      />
    </div>

    <!-- 資訊區域 -->
    <div class="p-3">
      <!-- 食材名稱 -->
      <h3 class="font-semibold text-gray-800 text-center truncate">
        {{ ingredient.name }}
      </h3>

      <!-- 標籤區 -->
      <div class="flex items-center justify-center gap-1 mt-2">
        <!-- 月齡標籤 -->
        <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
          {{ monthLabel }}
        </span>
        
        <!-- 分類標籤 -->
        <span
          class="text-xs px-2 py-0.5 rounded-full"
          :class="categoryColor"
        >
          {{ { grain: '穀', vegetable: '蔬', fruit: '果', protein: '蛋白', dairy: '乳', other: '其他' }[ingredient.category] }}
        </span>
      </div>
    </div>

    <!-- 底部狀態指示條 -->
    <div
      class="h-1 w-full"
      :class="{
        'bg-cyan-500': isInPantry && !hasAllergy,
        'bg-green-500': isTried && !hasAllergy && !isInPantry,
        'bg-red-500': hasAllergy,
        'bg-gray-200': !isTried && !hasAllergy && !isInPantry
      }"
    ></div>
  </div>
</template>
