<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useShoppingList } from '@/composables/useShoppingList'

const router = useRouter()
const route = useRoute()
const { pendingCount } = useShoppingList()

// 按鈕位置
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// 從 localStorage 載入位置
onMounted(() => {
  const saved = localStorage.getItem('cart-button-position')
  if (saved) {
    try {
      const pos = JSON.parse(saved)
      position.value = pos
    } catch {
      resetPosition()
    }
  } else {
    resetPosition()
  }
})

// 重置到預設位置（右下角）
function resetPosition() {
  position.value = {
    x: window.innerWidth - 80,
    y: window.innerHeight - 200
  }
}

// 儲存位置
function savePosition() {
  localStorage.setItem('cart-button-position', JSON.stringify(position.value))
}

// 拖曳開始
function onDragStart(e: MouseEvent | TouchEvent) {
  isDragging.value = true
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }
  e.preventDefault()
}

// 拖曳中
function onDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  
  // 限制在視窗範圍內
  const newX = Math.max(10, Math.min(window.innerWidth - 70, clientX - dragOffset.value.x))
  const newY = Math.max(60, Math.min(window.innerHeight - 100, clientY - dragOffset.value.y))
  
  position.value = { x: newX, y: newY }
}

// 拖曳結束
function onDragEnd() {
  if (isDragging.value) {
    isDragging.value = false
    savePosition()
  }
}

// 點擊導航
function goToShopping() {
  if (!isDragging.value) {
    router.push('/shopping')
  }
}

// 監聽全局拖曳事件
onMounted(() => {
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
  window.addEventListener('touchmove', onDragMove, { passive: false })
  window.addEventListener('touchend', onDragEnd)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('touchmove', onDragMove)
  window.removeEventListener('touchend', onDragEnd)
})

// 在購物清單頁面不顯示
const shouldShow = computed(() => route.path !== '/shopping')
</script>

<template>
  <Teleport to="body">
    <button
      v-if="shouldShow"
      @mousedown="onDragStart"
      @touchstart="onDragStart"
      @click="goToShopping"
      class="fixed z-50 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg flex items-center justify-center text-2xl transition-transform active:scale-95"
      :class="{ 
        'cursor-grabbing': isDragging,
        'cursor-grab hover:shadow-xl hover:scale-105': !isDragging
      }"
      :style="{
        left: `${position.x}px`,
        top: `${position.y}px`,
        boxShadow: '0 6px 20px rgba(251, 146, 60, 0.5)'
      }"
    >
      🛒
      <!-- 待購數量徽章 -->
      <span
        v-if="pendingCount > 0"
        class="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md"
      >
        {{ pendingCount > 99 ? '99+' : pendingCount }}
      </span>
    </button>
  </Teleport>
</template>
