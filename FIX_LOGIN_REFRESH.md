# 修復登入後重新整理跳回登入頁

## 問題描述
使用者登入後按重新整理，會被導向登入頁，因為 `router.beforeEach` 在 `authStore.initialize()` 完成前就執行。

## 修改內容

### 1. `src/stores/auth.ts`
- ✅ 新增 `initialized = ref(false)` 狀態（第 12 行）
- ✅ 在 `initialize()` 函數的 `finally` 區塊中設置 `initialized.value = true`（第 36-38 行）
- ✅ 在 `return` 物件中加入 `initialized`（第 100 行）

### 2. `src/router/index.ts`
- ✅ 新增 `import { watch } from 'vue'`（第 2 行）
- ✅ 將 `router.beforeEach` 改為 `async` 函數（第 87 行）
- ✅ 在判斷 auth 之前等待 `authStore.initialized === true`（第 90-103 行）
- ✅ 新增：已登入時訪問 `/auth` 會被導向 `/`（第 108-110 行）

## 工作原理

1. **初始化追蹤**：`authStore` 現在有 `initialized` 狀態來追蹤是否已完成初始化
2. **等待機制**：`router.beforeEach` 使用 `watch` + Promise 模式等待初始化完成
3. **防止競態條件**：確保在判斷登入狀態前，Supabase session 已經被檢查過

## 驗收標準

- ✅ `auth.ts` 有 `initialized = ref(false)`
- ✅ `initialize()` 完成後設為 `true`
- ✅ `return` 中包含 `initialized`
- ✅ `router/index.ts` 的 `beforeEach` 等待 `authStore.initialized`
- ✅ 已登入時訪問 `/auth` 會被導向 `/`
- ✅ 不破壞現有登入/登出功能

## 測試方法

1. **測試登入後重新整理**：
   - 登入應用
   - 按下瀏覽器的重新整理按鈕
   - ✅ 應該保持在當前頁面，不會跳回登入頁

2. **測試未登入訪問受保護頁面**：
   - 登出（或清除 session）
   - 嘗試訪問 `/profile` 或其他受保護頁面
   - ✅ 應該被導向 `/auth` 登入頁

3. **測試已登入訪問登入頁**：
   - 登入應用
   - 嘗試訪問 `/auth`
   - ✅ 應該被自動導向 `/`（首頁）

4. **測試登入/登出功能**：
   - 執行正常的登入流程
   - 執行正常的登出流程
   - ✅ 應該功能正常，沒有破壞原有邏輯

## 技術細節

### Watch + Promise 模式
```typescript
if (!authStore.initialized) {
    await new Promise<void>(resolve => {
        const stop = watch(
            () => authStore.initialized,
            (val) => { 
                if (val) { 
                    stop()  // 停止監聽
                    resolve()  // 解決 Promise
                } 
            }
        )
    })
}
```

這個模式的優點：
- 響應式：立即響應 `initialized` 狀態變化
- 無輪詢開銷：不需要 setTimeout 輪詢
- 乾淨：自動清理 watcher

## 相關檔案
- `src/stores/auth.ts` - Auth store（加入 initialized 狀態）
- `src/router/index.ts` - Router 配置（加入等待機制）
- `src/App.vue` - App 根組件（呼叫 initialize）

## 注意事項

⚠️ **重要**：這個修復假設 `authStore.initialize()` 會在 `App.vue` 的 `onMounted` 中被呼叫。如果該呼叫被移除，這個修復將不會生效。

確保 `src/App.vue` 中有類似這樣的代碼：
```vue
<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initialize()
})
</script>
```
