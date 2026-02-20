# Supabase 設置指南

## 📦 安裝完成

已安裝 Supabase JavaScript 客戶端：
- **版本**: `@supabase/supabase-js@2.97.0`
- **依賴**: 288 個套件

---

## 📁 文件結構

```
src/
├── lib/
│   └── supabase.ts          # Supabase 客戶端配置
├── types/
│   ├── index.ts             # 現有的應用類型
│   └── database.ts          # 資料庫類型定義（新增）
.env.example                 # 環境變數範本
env.d.ts                     # 環境變數 TypeScript 類型
```

---

## 🔐 環境配置步驟

### 1. 建立本地環境變數文件

```bash
cp .env.example .env
```

### 2. 獲取 Supabase 憑證

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇你的專案
3. 進入 `Settings` > `API`
4. 複製以下資訊：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 3. 更新 `.env` 文件

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi...
```

---

## 🧪 使用方式

### 基本使用

```typescript
import { supabase } from '@/lib/supabase'

// 查詢數據
const { data, error } = await supabase
  .from('meals')
  .select('*')

// 插入數據
const { data, error } = await supabase
  .from('meals')
  .insert({ name: '蘋果泥', category: 'fruit' })

// 使用認證
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### 類型安全

所有資料庫操作都有完整的 TypeScript 類型支援：

```typescript
import type { Database } from '@/types/database'

// 當你定義了資料表結構後，會自動獲得類型推斷
type Meal = Database['public']['Tables']['meals']['Row']
```

---

## 📝 下一步

1. ✅ **完成**: 安裝 Supabase 客戶端
2. ✅ **完成**: 建立配置文件
3. ✅ **完成**: 設置環境變數範本
4. 🔜 **待辦**: 設計資料庫 Schema
5. 🔜 **待辦**: 更新 `database.ts` 類型定義
6. 🔜 **待辦**: 整合到 Pinia stores
7. 🔜 **待辦**: 實作 RLS (Row Level Security) 政策

---

## ⚠️ 安全注意事項

- ✅ `.env` 已在 `.gitignore` 中（不會被提交到 Git）
- ✅ 使用 `VITE_` 前綴的環境變數會在構建時被嵌入
- ⚠️ **不要** 將 `.env` 文件提交到版本控制
- ⚠️ **不要** 在客戶端代碼中使用 `service_role` key（僅限伺服器端）
- ✅ `anon key` 是安全的，可以在客戶端使用（搭配 RLS 保護）

---

## 🔧 故障排除

### 問題：`Missing Supabase environment variables`

**解決方案**：
1. 確認 `.env` 文件存在
2. 確認環境變數名稱正確（必須有 `VITE_` 前綴）
3. 重新啟動開發伺服器（`npm run dev`）

### 問題：TypeScript 類型錯誤

**解決方案**：
```bash
# 清除 TypeScript 緩存
rm -rf node_modules/.vite
npm run type-check
```

---

## 📚 參考資源

- [Supabase JavaScript 文檔](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Vue 集成指南](https://supabase.com/docs/guides/getting-started/tutorials/with-vue-3)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)

---

**設置完成時間**: 2024-02-19  
**負責人**: Dev_Lead  
**版本**: v1.0
