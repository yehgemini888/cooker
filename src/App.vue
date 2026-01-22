<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BottomNavigation from '@/components/BottomNavigation.vue'
import FloatingCartButton from '@/components/FloatingCartButton.vue'

const route = useRoute()

// 判斷是否需要顯示底部導航
// 在詳情頁和精靈頁面隱藏底部導航
const showBottomNav = computed(() => {
  const hiddenPaths = ['/ingredient/', '/recipe/', '/wizard']
  return !hiddenPaths.some(path => route.path.includes(path))
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
    <!-- 主要內容區域 -->
    <RouterView />
    
    <!-- 底部導航 -->
    <BottomNavigation v-if="showBottomNav" />
    
    <!-- 漂浮購物車按鈕 -->
    <FloatingCartButton />
  </div>
</template>

