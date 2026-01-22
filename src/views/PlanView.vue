<script setup lang="ts">
import { ref } from 'vue'

// 佔位符頁面 - 週計畫功能
const comingSoon = ref(true)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-20">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-center">
          <h1 class="text-xl font-bold text-gray-800">📅 週計畫</h1>
        </div>
      </div>
    </header>

    <!-- 即將推出提示 -->
    <div class="container mx-auto px-4 py-8">
      <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div class="text-6xl mb-4">🚧</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">即將推出</h2>
        <p class="text-gray-600 mb-6">
          週計畫功能正在開發中，敬請期待！
        </p>
        
        <!-- 預告功能 -->
        <div class="bg-purple-50 rounded-xl p-6 text-left">
          <h3 class="font-semibold text-purple-800 mb-4">✨ 即將推出的功能</h3>
          <ul class="space-y-3 text-purple-700">
            <li class="flex items-center gap-2">
              <span>📆</span>
              <span>每週副食品計畫表</span>
            </li>
            <li class="flex items-center gap-2">
              <span>🍽️</span>
              <span>每日三餐食譜安排</span>
            </li>
            <li class="flex items-center gap-2">
              <span>🛒</span>
              <span>一鍵生成購物清單</span>
            </li>
            <li class="flex items-center gap-2">
              <span>📊</span>
              <span>營養均衡追蹤</span>
            </li>
            <li class="flex items-center gap-2">
              <span>🔔</span>
              <span>餵食提醒通知</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
