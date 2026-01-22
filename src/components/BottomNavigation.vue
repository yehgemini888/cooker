<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShoppingList } from '@/composables/useShoppingList'

const route = useRoute()
const router = useRouter()
const { pendingCount } = useShoppingList()

// 導航項目定義
const navItems = [
  { 
    name: '寶寶', 
    icon: '👶', 
    path: '/profile',
  },
  { 
    name: '冰箱', 
    icon: '🧊', 
    path: '/pantry',
  },
  { 
    name: '圖鑑', 
    icon: '📖', 
    path: '/ingredients',
  },
  { 
    name: '食譜', 
    icon: '🍳', 
    path: '/recipes',
  },
  { 
    name: '計畫', 
    icon: '📅', 
    path: '/plan',
  },
  { 
    name: '購物', 
    icon: '🛒', 
    path: '/shopping',
  },
]

// 當前路徑是否匹配
const isActive = (path: string) => {
  if (path === '/profile' && (route.path === '/' || route.path === '/profile')) {
    return true
  }
  return route.path.startsWith(path) && path !== '/profile'
}

// 導航到指定路徑
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
    <div class="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
      <button
        v-for="item in navItems"
        :key="item.path"
        @click="navigateTo(item.path)"
        class="relative flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200"
        :class="[
          isActive(item.path) 
            ? 'text-primary-600' 
            : 'text-gray-400 hover:text-gray-600'
        ]"
      >
        <!-- Icon with Badge -->
        <div class="relative">
          <span 
            class="text-lg mb-0.5 transition-transform duration-200"
            :class="{ 'scale-110': isActive(item.path) }"
          >
            {{ item.icon }}
          </span>
          
          <!-- 購物車待購數量徽章 -->
          <span
            v-if="item.path === '/shopping' && pendingCount > 0"
            class="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow"
          >
            {{ pendingCount > 99 ? '99+' : pendingCount }}
          </span>
        </div>
        
        <!-- Label -->
        <span 
          class="text-[10px] font-medium"
          :class="{ 'font-semibold': isActive(item.path) }"
        >
          {{ item.name }}
        </span>
        
        <!-- Active Indicator -->
        <div 
          v-if="isActive(item.path)"
          class="absolute bottom-0 w-6 h-0.5 bg-primary-500 rounded-t-full"
        ></div>
      </button>
    </div>
    
    <!-- Safe Area for iOS -->
    <div class="h-safe-area-inset-bottom bg-white"></div>
  </nav>
</template>

<style scoped>
/* iOS Safe Area Support */
.h-safe-area-inset-bottom {
  height: env(safe-area-inset-bottom, 0px);
}
</style>
