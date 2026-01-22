<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 導航項目定義
const navItems = [
  { 
    name: '寶寶', 
    icon: '👶', 
    path: '/profile',
    activeIcon: '👶'
  },
  { 
    name: '冰箱', 
    icon: '🧊', 
    path: '/pantry',
    activeIcon: '🧊'
  },
  { 
    name: '圖鑑', 
    icon: '📖', 
    path: '/ingredients',
    activeIcon: '📖'
  },
  { 
    name: '食譜', 
    icon: '🍳', 
    path: '/recipes',
    activeIcon: '🍳'
  },
  { 
    name: '計畫', 
    icon: '📅', 
    path: '/plan',
    activeIcon: '📅'
  },
  { 
    name: '購物', 
    icon: '🛒', 
    path: '/shopping',
    activeIcon: '🛒'
  },
]

// 當前路徑是否匹配
const isActive = (path: string) => {
  // 根路徑匹配 profile
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
    <div class="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
      <button
        v-for="item in navItems"
        :key="item.path"
        @click="navigateTo(item.path)"
        class="flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200"
        :class="[
          isActive(item.path) 
            ? 'text-primary-600' 
            : 'text-gray-400 hover:text-gray-600'
        ]"
      >
        <!-- Icon -->
        <span 
          class="text-xl mb-0.5 transition-transform duration-200"
          :class="{ 'scale-110': isActive(item.path) }"
        >
          {{ item.icon }}
        </span>
        
        <!-- Label -->
        <span 
          class="text-xs font-medium"
          :class="{ 'font-semibold': isActive(item.path) }"
        >
          {{ item.name }}
        </span>
        
        <!-- Active Indicator -->
        <div 
          v-if="isActive(item.path)"
          class="absolute bottom-0 w-8 h-0.5 bg-primary-500 rounded-t-full"
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
