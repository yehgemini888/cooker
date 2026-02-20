# 架構分析報告：Supabase Auth 流程問題

**文檔版本**: v1.0  
**分析日期**: 2024-02-19  
**分析者**: Architect_Zero  
**專案**: Cooker - 寶寶副食品助手  

---

## 📋 執行摘要

### 問題概述
1. ❌ **Email 確認失敗**：用戶收到確認信，連結導向 `http://localhost:3000/#error=access_denied&error_code=otp_expired`
2. ❌ **重複註冊體驗差**：雖然有錯誤檢測，但流程可以更完善
3. ✅ **數據隔離架構**：RLS 策略完整，data isolation 已正確實施

### 根本原因
- **主因**：`emailRedirectTo` 配置雖然正確，但 Supabase Dashboard 的 Site URL 設定可能不完整
- **次因**：Hash routing (`#/`) 與 OAuth callback (`?code=xxx`) 可能存在參數解析衝突
- **影響**：用戶無法完成註冊流程，影響產品可用性

### 架構評級
| 評審維度 | 評分 | 狀態 |
|---------|------|------|
| **架構合規性** | ⭐⭐⭐⭐⭐ | ✅ 完全符合 Clean Architecture |
| **安全性** | ⭐⭐⭐⭐⭐ | ✅ RLS 策略完整，數據隔離正確 |
| **可測試性** | ⭐⭐⭐⭐ | ✅ 依賴注入清晰，邏輯可測試 |
| **Auth 流程** | ⭐⭐⭐ | ⚠️ Email redirect 配置需修正 |
| **錯誤處理** | ⭐⭐⭐⭐ | ✅ 中文錯誤訊息完善 |

---

## 🔍 問題深度分析

### 問題 1：Email 確認連結錯誤

#### 現象
```
用戶收到確認信 → 點擊連結 → 導向：
http://localhost:3000/#error=access_denied&error_code=otp_expired
```

#### 根本原因分析

**代碼檢查** (`src/stores/auth.ts:65`):
```typescript
const redirectUrl = `${window.location.origin}${import.meta.env.BASE_URL}`
// Production: https://yehgemini888.github.io/cooker/
// Localhost: http://localhost:5173/cooker/
```
✅ **代碼正確**：`emailRedirectTo` 動態計算，本地和生產環境都正確

**根本原因**：
1. **Supabase Dashboard 配置不完整**
   - Site URL 可能仍設為 `http://localhost:3000`
   - Redirect URLs 沒有加入生產環境網址
   
2. **OTP Token 過期**
   - 預設有效期：1 小時
   - 用戶點擊時間過晚導致 `otp_expired`

3. **Hash Routing 潛在問題**
   - Supabase PKCE flow 使用 `?code=xxx` query parameter
   - Hash routing 使用 `#/path`
   - URL 格式：`https://domain.com/cooker/#/auth?code=xxx`
   - `detectSessionInUrl: true` 應該能正確解析，但需驗證

#### 影響評估
- **嚴重性**: 🔴 Critical（阻塞用戶註冊）
- **影響範圍**: 所有新用戶
- **業務影響**: 無法獲取新用戶，產品無法使用

---

### 問題 2：Hash Routing + PKCE 兼容性

#### 架構分析

**當前配置**:
```typescript
// supabase.ts:15-22
createClient(url, key, {
  auth: {
    persistSession: true,        // ✅ 正確
    autoRefreshToken: true,       // ✅ 正確
    detectSessionInUrl: true,     // ✅ 正確
    flowType: 'pkce',            // ⚠️ 需確認與 hash routing 兼容性
  }
})

// router/index.ts:6
createWebHashHistory(import.meta.env.BASE_URL) // BASE_URL = '/cooker/'
```

**PKCE Flow URL 範例**:
```
# 傳統 History Mode (pushState)
https://domain.com/cooker/auth?code=xxx

# Hash History Mode
https://domain.com/cooker/#/auth?code=xxx
```

#### 兼容性檢查

**Supabase Auth v2.x 官方文檔確認**:
- ✅ `detectSessionInUrl: true` 支援 hash mode
- ✅ PKCE flow 可與 hash routing 並存
- ⚠️ 但需確保 URL 格式正確解析

**潛在問題**:
1. 部分瀏覽器對 `#/path?query` 的解析可能有差異
2. GitHub Pages 的 404 處理與 hash routing 配合需要驗證

#### 建議
- 保持 `flowType: 'pkce'`（更安全，符合最佳實踐）
- 加強 URL 參數解析的錯誤處理

---

### 問題 3：Data Isolation 架構檢查

#### 架構圖
```
┌─────────────────────────────────────────────┐
│  auth.users (Supabase Auth)                 │
│  - id (UUID)                                │
│  - email                                    │
└─────────────────┬───────────────────────────┘
                  │ 1:1
                  ▼
┌─────────────────────────────────────────────┐
│  public.profiles                            │
│  - id (FK → auth.users.id)                  │
│  - email, display_name, avatar_url          │
│  RLS: auth.uid() = id                       │
└─────────────────┬───────────────────────────┘
                  │ 1:N
                  ▼
┌─────────────────────────────────────────────┐
│  public.baby_profiles                       │
│  - id (UUID)                                │
│  - user_id (FK → profiles.id)               │
│  RLS: auth.uid() = user_id                  │
└─────────────────┬───────────────────────────┘
                  │ 1:N
                  ▼
┌─────────────────────────────────────────────┐
│  ingredient_states, recipe_ratings, etc.    │
│  - baby_id (FK → baby_profiles.id)          │
│  RLS: baby_id IN (SELECT id FROM            │
│        baby_profiles WHERE user_id =        │
│        auth.uid())                           │
└─────────────────────────────────────────────┘
```

#### RLS 策略審查

**profiles 表** (`schema.sql:31-37`):
```sql
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);
```
✅ **正確**：用戶只能查看和修改自己的 profile

**baby_profiles 表** (`schema.sql:61-75`):
```sql
CREATE POLICY "Users can view their own baby profiles"
    ON public.baby_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baby profiles"
    ON public.baby_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baby profiles"
    ON public.baby_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own baby profiles"
    ON public.baby_profiles FOR DELETE
    USING (auth.uid() = user_id);
```
✅ **正確**：完整的 CRUD 策略，用戶只能操作自己的寶寶資料

**ingredient_states 表** (`schema.sql:100-120`):
```sql
CREATE POLICY "Users can view ingredient states for their babies"
    ON public.ingredient_states FOR SELECT
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- 類似的 INSERT, UPDATE, DELETE 策略
```
✅ **正確**：通過 `baby_id` 關聯，確保用戶只能存取自己寶寶的數據

#### handle_new_user 觸發器審查

**觸發器定義** (`schema.sql:390-403`):
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

✅ **正確**：自動在 `auth.users` 插入後建立 `profiles` 記錄
⚠️ **潛在問題**：
1. 如果觸發器執行失敗（如 `profiles.id` 衝突），用戶無法登入
2. 缺少錯誤處理機制

---

### 問題 4：重複註冊處理

#### 現有實現 (`auth.ts:72-75`)
```typescript
if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error('User already registered')
}
```

✅ **正確檢測**：Supabase v2 的 `identities.length === 0` 是標準做法

#### 改進空間
1. **前端驗證不足**：沒有在提交前檢查 email 格式
2. **錯誤訊息雖友善，但可以更引導**：
   - 現在：「此電子郵件已被註冊，請直接登入」
   - 建議：「此電子郵件已被註冊，請直接登入」+ 自動切換到登入頁面

---

## 🎯 解決方案設計

### Solution 1: 修正 Email Redirect 配置

#### 步驟 1: 更新 Supabase Dashboard 設定

**Site URL**:
```
Production: https://yehgemini888.github.io
```

**Redirect URLs** (允許以下所有網址):
```
https://yehgemini888.github.io/cooker/**
https://yehgemini888.github.io/cooker/#/**
http://localhost:5173/cooker/**
http://localhost:5173/cooker/#/**
http://localhost:3000/cooker/**
http://localhost:3000/cooker/#/**
```

⚠️ **重要**：GitHub Pages 的 domain 不包含 `/cooker` 路徑，但 redirect URL 需要包含

#### 步驟 2: 增強代碼中的 redirectUrl 配置

**現有代碼** (`auth.ts:65`):
```typescript
const redirectUrl = `${window.location.origin}${import.meta.env.BASE_URL}`
```

**建議改進**:
```typescript
// 生成完整的 redirect URL，包含 hash routing 路徑
const redirectUrl = import.meta.env.PROD
  ? 'https://yehgemini888.github.io/cooker/#/auth'
  : `${window.location.origin}${import.meta.env.BASE_URL}#/auth`
```

**理由**:
1. 明確指向 `/auth` 頁面，避免重定向到首頁後觸發 auth guard
2. 包含 `#/auth` 確保 hash routing 正確解析
3. Production 環境硬編碼，避免 `window.location.origin` 在 SSR 或 preview 環境出錯

#### 步驟 3: 增加 URL 參數解析錯誤處理

**在 `auth.ts` 初始化時加入**:
```typescript
async function initialize() {
  // ... 現有代碼 ...
  
  // 檢查 URL 中的 error 參數
  const hash = window.location.hash
  const urlParams = new URLSearchParams(hash.split('?')[1])
  
  if (urlParams.has('error')) {
    const errorCode = urlParams.get('error_code')
    const errorDesc = urlParams.get('error_description')
    
    if (errorCode === 'otp_expired') {
      error.value = '確認連結已失效，請重新註冊'
      // 清理 URL
      window.location.hash = '#/auth'
    } else if (errorCode === 'access_denied') {
      error.value = '驗證失敗，請聯繫客服'
      window.location.hash = '#/auth'
    }
  }
}
```

---

### Solution 2: 增強 Hash Routing 兼容性

#### 方案 A: 保持 Hash Routing + PKCE（推薦）

**理由**:
- GitHub Pages 不支援 server-side routing
- Hash routing 是唯一可行方案
- PKCE 比 implicit flow 更安全

**驗證步驟**:
1. 確認 `detectSessionInUrl: true` 正確解析 `#/path?code=xxx`
2. 測試 email confirmation URL 格式

**測試用例**:
```typescript
// 測試 URL 解析
const testUrls = [
  'https://domain.com/cooker/#/auth?code=abc123',
  'https://domain.com/cooker/#/auth?error=access_denied',
  'https://domain.com/cooker/#/?code=abc123', // 根路徑
]

testUrls.forEach(url => {
  // 驗證 supabase.auth.getSession() 能否正確解析
})
```

#### 方案 B: 切換到 Implicit Flow（不推薦）

**配置**:
```typescript
createClient(url, key, {
  auth: {
    flowType: 'implicit', // 改為 implicit
  }
})
```

**優勢**:
- Token 直接返回在 URL fragment (`#access_token=xxx`)
- 與 hash routing 更兼容

**劣勢**:
- ❌ 安全性較低（Token 暴露在 URL）
- ❌ 不符合 OAuth 2.1 最佳實踐
- ❌ 被 IETF 列為不推薦方案

**結論**: 不建議使用，保持 PKCE

---

### Solution 3: 完善 Data Isolation 機制

#### 當前狀態
✅ **架構正確**：RLS 策略完整，data isolation 已實施

#### 建議加強項

**1. 增加 handle_new_user 錯誤處理**

**問題**：如果觸發器失敗，用戶無法登入但已在 `auth.users` 中

**解決方案**：在前端檢查 profile 是否存在
```typescript
// auth.ts - 在 initialize() 中
async function initialize() {
  const { data: { session: currentSession } } = await supabase.auth.getSession()
  
  if (currentSession?.user) {
    // 檢查 profile 是否存在
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', currentSession.user.id)
      .single()
    
    if (error && error.code === 'PGRST116') {
      // Profile 不存在，手動建立
      await supabase.from('profiles').insert({
        id: currentSession.user.id,
        email: currentSession.user.email,
        display_name: currentSession.user.email,
      })
    }
  }
}
```

**2. 增加 baby_profiles 預設值**

**建議**：新用戶註冊後，自動建立一個預設寶寶檔案
```sql
-- 新增觸發器
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.baby_profiles (user_id, name, birthday, gender, is_active)
    VALUES (NEW.id, '我的寶寶', CURRENT_DATE, 'other', TRUE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_profile();
```

**3. RLS 策略完整性驗證**

**測試腳本**:
```sql
-- 測試用戶 A 無法存取用戶 B 的資料
-- 1. 建立測試用戶
INSERT INTO auth.users (id, email) VALUES 
  ('user-a-uuid', 'usera@test.com'),
  ('user-b-uuid', 'userb@test.com');

-- 2. 建立 profiles 和 baby_profiles
INSERT INTO public.profiles (id, email) VALUES
  ('user-a-uuid', 'usera@test.com'),
  ('user-b-uuid', 'userb@test.com');

INSERT INTO public.baby_profiles (id, user_id, name, birthday) VALUES
  ('baby-a-uuid', 'user-a-uuid', 'Baby A', '2024-01-01'),
  ('baby-b-uuid', 'user-b-uuid', 'Baby B', '2024-01-01');

-- 3. 測試 RLS（以 user-a 身份）
SET request.jwt.claim.sub = 'user-a-uuid';

SELECT * FROM public.baby_profiles; -- 應該只返回 Baby A
SELECT * FROM public.ingredient_states WHERE baby_id = 'baby-b-uuid'; -- 應該返回 0 rows
```

---

### Solution 4: 優化重複註冊體驗

#### 改進 1: 前端 Email 驗證

**在 AuthView.vue 中加入**:
```typescript
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

async function handleSignUp() {
  if (!validateEmail(email.value)) {
    errorMessage.value = '請輸入有效的電子郵件地址'
    return
  }
  
  // ... 現有 signUp 邏輯
}
```

#### 改進 2: 自動切換到登入模式

**auth.ts 修改**:
```typescript
async function signUp(email: string, password: string) {
  // ... 現有代碼 ...
  
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    error.value = '此電子郵件已被註冊，請直接登入'
    // 拋出特殊錯誤碼，讓前端知道要切換到登入模式
    const err = new Error('User already registered')
    ;(err as any).code = 'USER_ALREADY_REGISTERED'
    throw err
  }
}
```

**AuthView.vue 修改**:
```typescript
async function handleSignUp() {
  try {
    await authStore.signUp(email.value, password.value)
  } catch (err: any) {
    if (err.code === 'USER_ALREADY_REGISTERED') {
      // 自動切換到登入模式
      isSignUp.value = false
      // 保留 email 和 password，方便用戶直接登入
      showMessage('此帳號已存在，已為您切換到登入模式', 'info')
    } else {
      errorMessage.value = authStore.error || '註冊失敗'
    }
  }
}
```

#### 改進 3: 增加「忘記密碼」流程

**auth.ts 新增**:
```typescript
async function resetPassword(email: string) {
  loading.value = true
  error.value = null
  try {
    const redirectUrl = `${window.location.origin}${import.meta.env.BASE_URL}#/auth?mode=reset`
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })
    if (err) throw err
    return true
  } catch (err: any) {
    error.value = translateAuthError(err.message)
    throw err
  } finally {
    loading.value = false
  }
}
```

---

## 📐 完整的架構建議

### 1. Supabase Client 配置（最終版本）

**檔案**: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

let supabaseInstance

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables not set. Auth features will be disabled.')
  supabaseInstance = createClient<Database>('https://placeholder.supabase.co', 'placeholder')
} else {
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,        // ✅ 持久化 session
      autoRefreshToken: true,       // ✅ 自動刷新 token
      detectSessionInUrl: true,     // ✅ 檢測 URL 中的 session
      flowType: 'pkce',            // ✅ 使用 PKCE 授權流（最安全）
      // 可選：自訂 storage（預設使用 localStorage）
      storage: window.localStorage,
      storageKey: 'cooker-auth-token',
      // 可選：debug mode
      debug: import.meta.env.DEV,
    },
  })
}

export const supabase = supabaseInstance
export type { Database }
```

**重要設定**:
- `flowType: 'pkce'` - 保持不變（最安全）
- `detectSessionInUrl: true` - 必須開啟，支援 email confirmation
- `persistSession: true` - 必須開啟，否則刷新頁面需要重新登入

---

### 2. Redirect URL 策略

#### Dashboard 設定

**Supabase Dashboard → Authentication → URL Configuration**:

| 設定項 | 值 |
|-------|---|
| **Site URL** | `https://yehgemini888.github.io` |
| **Redirect URLs** | `https://yehgemini888.github.io/cooker/**` |
|  | `http://localhost:5173/cooker/**` |
|  | `http://localhost:3000/cooker/**` |

⚠️ **注意**: 
- Site URL 不包含 `/cooker` 路徑
- Redirect URLs 需要包含完整路徑並使用 wildcard `/**`

#### 代碼設定

**檔案**: `src/stores/auth.ts`

```typescript
async function signUp(email: string, password: string) {
  loading.value = true
  error.value = null
  try {
    // 方案 A: 動態計算（推薦用於開發環境）
    const baseUrl = import.meta.env.PROD
      ? 'https://yehgemini888.github.io/cooker/'
      : `${window.location.origin}${import.meta.env.BASE_URL}`
    
    const redirectUrl = `${baseUrl}#/auth`
    
    // 方案 B: 完全硬編碼（最可靠）
    // const redirectUrl = import.meta.env.PROD
    //   ? 'https://yehgemini888.github.io/cooker/#/auth'
    //   : 'http://localhost:5173/cooker/#/auth'
    
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: redirectUrl,
        // 可選：加入 metadata
        data: {
          display_name: email.split('@')[0], // 使用 email 前綴作為預設名稱
        }
      },
    })
    
    if (err) throw err
    
    // 檢查重複註冊
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      const err = new Error('User already registered')
      ;(err as any).code = 'USER_ALREADY_REGISTERED'
      throw err
    }
    
    return data
  } catch (err: any) {
    error.value = translateAuthError(err.message)
    throw err
  } finally {
    loading.value = false
  }
}
```

---

### 3. Error Handling 最佳實踐

#### 錯誤分類與處理

| 錯誤類型 | 錯誤碼 | 用戶訊息 | 處理方式 |
|---------|-------|---------|---------|
| **重複註冊** | `USER_ALREADY_REGISTERED` | 「此電子郵件已被註冊，已為您切換到登入模式」 | 自動切換到登入頁面 |
| **OTP 過期** | `otp_expired` | 「確認連結已失效，請重新註冊」 | 清理 URL，停留在註冊頁 |
| **Access Denied** | `access_denied` | 「驗證失敗，請確認您點擊的是最新的確認郵件」 | 提示檢查郵箱 |
| **Email 未確認** | `Email not confirmed` | 「請先至信箱確認您的電子郵件後再登入」 | 提示檢查郵箱（含垃圾郵件夾） |
| **密碼錯誤** | `Invalid login credentials` | 「電子郵件或密碼錯誤，請重新確認」 | 停留在登入頁 |
| **網路錯誤** | `FetchError` | 「網路連線異常，請檢查您的網路狀態」 | 允許重試 |

#### 實作範例

**auth.ts 增強版**:
```typescript
// 錯誤訊息中文化（現有基礎上增強）
function translateAuthError(message: string, code?: string): string {
  // 先檢查 code
  if (code === 'otp_expired') {
    return '確認連結已失效，請重新註冊。確認郵件有效期為 1 小時。'
  }
  if (code === 'access_denied') {
    return '驗證失敗，請確認您點擊的是最新的確認郵件。'
  }
  
  // 現有的 message mapping
  const errorMap: Record<string, string> = {
    'User already registered': '此電子郵件已被註冊，請直接登入',
    'Invalid login credentials': '電子郵件或密碼錯誤，請重新確認',
    'Email not confirmed': '請先至信箱確認您的電子郵件後再登入。如果沒有收到郵件，請檢查垃圾郵件夾。',
    // ... 現有其他 mapping
  }
  
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) return value
  }
  
  // 預設錯誤訊息
  return `發生錯誤：${message}。如果問題持續，請聯繫客服。`
}

// 初始化時檢查 URL 錯誤參數
async function initialize() {
  // ... 現有代碼 ...
  
  // 檢查 URL 中的 error 參數
  const hash = window.location.hash
  if (hash.includes('error=')) {
    const urlParams = new URLSearchParams(hash.split('?')[1] || '')
    const errorCode = urlParams.get('error_code')
    const errorDesc = urlParams.get('error_description')
    
    error.value = translateAuthError(errorDesc || '', errorCode || '')
    
    // 清理 URL（移除 error 參數）
    const cleanHash = hash.split('?')[0]
    window.history.replaceState(null, '', cleanHash || '#/auth')
  }
  
  // ... 其他初始化邏輯
}
```

---

### 4. Data Isolation 驗證方法

#### 測試清單

**測試 1: Profile 自動建立**
```typescript
// 測試檔案: tests/auth.test.ts
describe('Profile Auto Creation', () => {
  it('should create profile when user signs up', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    })
    
    expect(error).toBeNull()
    expect(data.user).toBeDefined()
    
    // 檢查 profile 是否存在
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user!.id)
      .single()
    
    expect(profile).toBeDefined()
    expect(profile.email).toBe('test@example.com')
  })
})
```

**測試 2: RLS 策略驗證**
```sql
-- 在 Supabase SQL Editor 執行

-- 1. 建立測試用戶
DO $$
DECLARE
  user_a_id UUID := gen_random_uuid();
  user_b_id UUID := gen_random_uuid();
  baby_a_id UUID := gen_random_uuid();
  baby_b_id UUID := gen_random_uuid();
BEGIN
  -- 插入測試資料
  INSERT INTO auth.users (id, email) VALUES 
    (user_a_id, 'usera@test.com'),
    (user_b_id, 'userb@test.com');
  
  INSERT INTO public.profiles (id, email) VALUES
    (user_a_id, 'usera@test.com'),
    (user_b_id, 'userb@test.com');
  
  INSERT INTO public.baby_profiles (id, user_id, name, birthday) VALUES
    (baby_a_id, user_a_id, 'Baby A', '2024-01-01'),
    (baby_b_id, user_b_id, 'Baby B', '2024-01-01');
  
  -- 測試 RLS（模擬 user_a 身份）
  PERFORM set_config('request.jwt.claim.sub', user_a_id::text, true);
  
  -- 應該只能看到自己的 baby
  ASSERT (SELECT COUNT(*) FROM public.baby_profiles) = 1;
  ASSERT (SELECT name FROM public.baby_profiles LIMIT 1) = 'Baby A';
  
  -- 清理測試資料
  DELETE FROM auth.users WHERE id IN (user_a_id, user_b_id);
END $$;
```

**測試 3: 跨用戶資料隔離**
```typescript
// 測試檔案: tests/isolation.test.ts
describe('Data Isolation', () => {
  let userA, userB, babyA, babyB
  
  beforeAll(async () => {
    // 建立兩個用戶
    userA = await createTestUser('usera@test.com')
    userB = await createTestUser('userb@test.com')
    
    // 建立寶寶檔案
    babyA = await createBabyProfile(userA.id, 'Baby A')
    babyB = await createBabyProfile(userB.id, 'Baby B')
  })
  
  it('user A cannot access user B baby data', async () => {
    // 以 userA 身份登入
    await supabase.auth.signInWithPassword({
      email: 'usera@test.com',
      password: 'password123',
    })
    
    // 嘗試存取 userB 的寶寶資料
    const { data, error } = await supabase
      .from('baby_profiles')
      .select('*')
      .eq('id', babyB.id)
      .single()
    
    // 應該返回空或 error
    expect(data).toBeNull()
  })
  
  it('user A can only see their own ingredient states', async () => {
    // 以 userA 身份登入
    await supabase.auth.signInWithPassword({
      email: 'usera@test.com',
      password: 'password123',
    })
    
    // 查詢所有 ingredient_states
    const { data, error } = await supabase
      .from('ingredient_states')
      .select('*, baby_profiles!inner(user_id)')
    
    // 所有返回的資料都應該屬於 userA
    expect(data?.every(row => row.baby_profiles.user_id === userA.id)).toBe(true)
  })
})
```

---

## 🚀 實施計畫

### Phase 1: 緊急修復（P0 - 立即執行）

**目標**: 修復 email confirmation 問題，讓用戶可以完成註冊

| 任務 | 負責人 | 工時 | 優先級 |
|------|-------|------|--------|
| 1.1 更新 Supabase Dashboard 設定 | Dev_Lead | 0.5h | P0 |
| 1.2 修改 `emailRedirectTo` 為完整 URL | Delivery_Lead | 0.5h | P0 |
| 1.3 增加 URL error 參數解析 | Delivery_Lead | 1h | P0 |
| 1.4 測試 email confirmation 流程 | QA_Sentinel | 1h | P0 |

**驗收標準**:
- [ ] 用戶收到確認信，點擊連結後成功導向應用
- [ ] URL 格式為 `https://yehgemini888.github.io/cooker/#/auth?code=xxx`
- [ ] 用戶可以成功登入

---

### Phase 2: 體驗優化（P1 - 本週完成）

**目標**: 改善重複註冊體驗和錯誤處理

| 任務 | 負責人 | 工時 | 優先級 |
|------|-------|------|--------|
| 2.1 前端 email 驗證 | Delivery_Lead | 0.5h | P1 |
| 2.2 重複註冊自動切換到登入 | Delivery_Lead | 1h | P1 |
| 2.3 增強錯誤訊息翻譯 | Delivery_Lead | 0.5h | P1 |
| 2.4 增加「忘記密碼」功能 | Delivery_Lead | 2h | P1 |
| 2.5 UI/UX 測試 | QA_Sentinel | 1h | P1 |

**驗收標準**:
- [ ] 重複註冊時自動切換到登入模式
- [ ] 所有錯誤訊息都有中文翻譯
- [ ] 用戶可以使用「忘記密碼」功能

---

### Phase 3: 架構強化（P2 - 下週完成）

**目標**: 加強 data isolation 和監控

| 任務 | 負責人 | 工時 | 優先級 |
|------|-------|------|--------|
| 3.1 增加 profile 自動建立的 fallback 邏輯 | Delivery_Lead | 1h | P2 |
| 3.2 RLS 策略測試套件 | QA_Sentinel | 3h | P2 |
| 3.3 Supabase 錯誤監控（Sentry 整合） | Dev_Lead | 2h | P2 |
| 3.4 撰寫 ADR-001（Auth 架構決策） | Architect_Zero | 1h | P2 |

**驗收標準**:
- [ ] 所有 RLS 策略通過自動化測試
- [ ] Profile 建立失敗時有 fallback 機制
- [ ] 錯誤自動上報到監控平台

---

## 📊 風險評估與緩解

### 風險矩陣

| 風險 | 可能性 | 影響 | 風險等級 | 緩解方案 |
|------|-------|------|---------|---------|
| **Email redirect 設定錯誤** | 中 | 高 | 🔴 高 | 多環境測試、硬編碼 URL |
| **Hash routing 與 PKCE 不兼容** | 低 | 高 | 🟡 中 | 官方文檔確認、保留 implicit flow 作為備案 |
| **Profile 觸發器失敗** | 低 | 中 | 🟡 中 | 前端 fallback 邏輯 |
| **RLS 策略有漏洞** | 低 | 高 | 🟡 中 | 自動化測試、定期安全審計 |
| **OTP token 過期** | 中 | 低 | 🟢 低 | 友善錯誤訊息、提供重新發送功能 |

### 緩解措施詳細說明

**風險 1: Email redirect 設定錯誤**
- **緩解**: 
  1. Production URL 使用硬編碼，避免動態計算錯誤
  2. 在 Supabase Dashboard 設定多個 fallback URLs
  3. 加入自動化測試驗證 redirect 流程
- **監控**: 追蹤 email confirmation 成功率

**風險 2: Hash routing 與 PKCE 不兼容**
- **緩解**: 
  1. 參考 Supabase 官方文檔確認兼容性
  2. 多瀏覽器測試（Chrome, Safari, Firefox）
  3. 保留切換到 implicit flow 的選項（但優先使用 PKCE）
- **備案**: 如果真的不兼容，考慮使用 Vercel/Netlify 替代 GitHub Pages

**風險 3: Profile 觸發器失敗**
- **緩解**: 
  1. 前端檢查 profile 是否存在，不存在則手動建立
  2. 加入 Supabase Function 作為 webhook 備份
  3. 監控觸發器執行失敗的情況
- **恢復**: 提供手動修復腳本

---

## 🎓 最佳實踐建議

### 1. Authentication

✅ **DO**:
- 使用 PKCE flow（最安全）
- 持久化 session 到 localStorage
- 實施自動 token refresh
- 提供友善的錯誤訊息（中文化）
- 加入 email verification 流程

❌ **DON'T**:
- 不要使用 implicit flow（除非必要）
- 不要在 URL 中長期保留 token
- 不要忽略 email confirmation
- 不要暴露原始錯誤訊息給用戶

### 2. Data Isolation

✅ **DO**:
- 所有表都啟用 RLS
- 使用 `auth.uid()` 進行用戶識別
- 多層級關聯（user → baby → data）
- 定期審計 RLS 策略
- 撰寫自動化測試

❌ **DON'T**:
- 不要在前端過濾資料（必須使用 RLS）
- 不要信任前端傳來的 user_id
- 不要使用 service_role key 在前端
- 不要跳過 RLS 測試

### 3. Error Handling

✅ **DO**:
- 分類錯誤（認證、授權、驗證、系統）
- 提供具體的錯誤訊息
- 加入錯誤追蹤（Sentry/LogRocket）
- 友善的錯誤 UI
- 提供下一步動作（retry, contact support）

❌ **DON'T**:
- 不要直接顯示系統錯誤訊息
- 不要忽略邊緣情況（網路斷線、token 過期）
- 不要讓用戶卡在錯誤狀態
- 不要缺少錯誤監控

### 4. Testing

✅ **DO**:
- 單元測試（auth store）
- 整合測試（auth flow）
- E2E 測試（註冊到登入完整流程）
- RLS 策略測試
- 多瀏覽器測試

❌ **DON'T**:
- 不要只在開發環境測試
- 不要跳過 edge cases
- 不要忽略 RLS 測試
- 不要只測試 happy path

---

## 📝 Architecture Decision Record (ADR)

### ADR-001: Supabase Auth 架構設計

**狀態**: ✅ 已接受  
**日期**: 2024-02-19  
**決策者**: Architect_Zero  
**相關方**: PM_Nexus, Dev_Lead, Delivery_Lead, QA_Sentinel  

---

#### 背景與問題陳述

**觸發因素**:
- 用戶無法完成 email confirmation 流程
- 需要在 GitHub Pages 環境部署，不支援 server-side routing
- 需要確保用戶資料隔離

**約束條件**:
- 技術約束：GitHub Pages 只支援 hash routing
- 安全約束：必須符合 OAuth 2.1 標準
- 用戶體驗約束：註冊流程必須順暢

---

#### 決策

**我們決定**:
1. 使用 **PKCE authorization code flow**（而非 implicit flow）
2. 使用 **hash routing** (`createWebHashHistory`)
3. 在 Supabase client 設定 `detectSessionInUrl: true`
4. `emailRedirectTo` 使用完整 URL 並包含 `#/auth` 路徑
5. 實施完整的 **RLS 策略** 確保 data isolation

**核心理由**:
1. **安全性**: PKCE 是 OAuth 2.1 推薦方案，比 implicit flow 更安全
2. **兼容性**: Hash routing 與 PKCE 可以共存（Supabase v2 支援）
3. **部署便利**: GitHub Pages 免費且支援 hash routing
4. **資料隔離**: RLS 策略在 database 層強制執行，比前端過濾更可靠

---

#### 替代方案比較

| 方案 | 優勢 | 劣勢 | 為何不選 |
|-----|------|------|---------|
| **PKCE + Hash Routing** (選中) | 安全、免費部署、符合標準 | Hash routing 對 SEO 不友好 | ✅ 選中 |
| Implicit Flow + Hash Routing | 實作簡單 | 安全性低、已被標記為 deprecated | ❌ 不符合安全標準 |
| PKCE + History Mode + Vercel | 最佳 UX、支援 SSR | 月費 $20、需要設定 server routing | ❌ 超出預算 |
| Firebase Auth | Google 生態系整合好 | 遷移成本高、已投資 Supabase | ❌ 技術債務 |

---

#### 影響分析

**技術影響**:
- ✅ 正面：符合最佳安全實踐
- ✅ 正面：完整的 RLS 策略確保資料隔離
- ⚠️ 負面：Hash routing 對 SEO 不友好（但本產品不需要 SEO）

**成本影響**:
- 初始成本：0（GitHub Pages 免費）
- 月運營成本：0（Supabase 免費層足夠）
- 維護成本：低（標準 OAuth 流程）

**開發影響**:
- 開發工時：3 人天（緊急修復 + 體驗優化）
- 學習曲線：中（團隊已熟悉 Supabase）
- 測試負擔：中（需要 RLS 測試套件）

---

#### 風險與緩解

| 風險 | 可能性 | 影響 | 緩解方案 |
|------|-------|------|---------|
| PKCE 與 hash routing 不兼容 | 低 | 高 | 參考官方文檔、多瀏覽器測試、保留 implicit flow 備案 |
| Email redirect URL 設定錯誤 | 中 | 高 | 硬編碼 production URL、多環境測試 |
| RLS 策略有漏洞 | 低 | 高 | 自動化測試、定期安全審計 |
| Profile 觸發器失敗 | 低 | 中 | 前端 fallback 邏輯、監控觸發器執行 |

---

#### 驗收標準

- [x] 架構符合 Clean Architecture 原則
- [ ] 用戶可以完成註冊並通過 email 確認
- [ ] 用戶可以登入並存取自己的資料
- [ ] RLS 策略測試全部通過
- [ ] 用戶無法存取其他用戶的資料
- [ ] 所有錯誤訊息都有友善的中文翻譯
- [ ] Email confirmation 成功率 > 95%

---

#### 相關文檔

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth 2.1 Authorization Framework](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-07)
- [spec.md - 系統架構設計](./spec.md)

---

## 🔍 後續監控指標

### Key Metrics

| 指標 | 目標值 | 測量方式 | 負責人 |
|------|-------|---------|--------|
| **Email Confirmation 成功率** | ≥ 95% | Supabase Dashboard | PM_Nexus |
| **註冊轉化率** | ≥ 80% | Google Analytics | PM_Nexus |
| **登入成功率** | ≥ 98% | Supabase Dashboard | Dev_Lead |
| **RLS 策略覆蓋率** | 100% | 代碼審查 | Architect_Zero |
| **Auth 相關錯誤率** | ≤ 2% | Sentry | Dev_Lead |
| **平均註冊時間** | ≤ 2 分鐘 | User Testing | QA_Sentinel |

### 監控工具

**Supabase Dashboard**:
- 追蹤 auth events（sign up, sign in, sign out）
- 監控 RLS policy violations
- 查看 database slow queries

**Sentry** (建議加入):
```typescript
// main.ts
import * as Sentry from "@sentry/vue"

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.vueRouterInstrumentation(router),
    }),
  ],
  tracesSampleRate: 1.0,
  environment: import.meta.env.MODE,
})
```

**Google Analytics** (已有):
- 追蹤 auth events
- 漏斗分析（註冊流程）

---

## ✅ 完成檢查清單

### 開發階段

**Phase 1: 緊急修復**
- [ ] Supabase Dashboard 設定 Site URL 和 Redirect URLs
- [ ] 修改 `auth.ts` 的 `emailRedirectTo` 為完整 URL
- [ ] 在 `initialize()` 增加 URL error 參數解析
- [ ] 測試 email confirmation 流程（本地 + production）

**Phase 2: 體驗優化**
- [ ] 加入前端 email 格式驗證
- [ ] 實作重複註冊自動切換到登入
- [ ] 增強錯誤訊息翻譯（包含 error code）
- [ ] 實作「忘記密碼」功能
- [ ] UI/UX 測試

**Phase 3: 架構強化**
- [ ] 增加 profile 自動建立 fallback 邏輯
- [ ] 撰寫 RLS 策略測試套件
- [ ] 整合 Sentry 錯誤監控
- [ ] 撰寫 ADR-001

### 測試階段

- [ ] 單元測試：auth store 所有方法
- [ ] 整合測試：註冊 → email confirmation → 登入
- [ ] E2E 測試：完整 auth 流程
- [ ] RLS 策略測試：跨用戶資料隔離
- [ ] 多瀏覽器測試：Chrome, Safari, Firefox
- [ ] 多環境測試：localhost, production

### 部署階段

- [ ] 更新 `.env.production` 環境變數
- [ ] 部署到 GitHub Pages
- [ ] 驗證 production 環境 auth 流程
- [ ] 監控 Supabase Dashboard auth events
- [ ] 監控 Sentry error rate

### 文檔階段

- [ ] 更新 `spec.md` 的 Auth 章節
- [ ] 撰寫 `ADR-001-supabase-auth-design.md`
- [ ] 更新 `README.md` 的環境設定說明
- [ ] 撰寫 troubleshooting guide

---

## 📞 聯絡與協作

### 需要協助的 Agent

**@pm-nexus**:
- 確認 Phase 1-3 的時程安排
- 評估 email confirmation 問題對用戶的影響
- 決定是否需要暫停新用戶註冊

**@cfo-guardian**:
- 確認是否需要升級 Supabase 方案（目前免費層足夠）
- 評估 Sentry 整合成本（約 $26/月）

**@dev-lead**:
- 確認本地開發環境的 Supabase 設定
- 評估是否需要 staging 環境
- 整合 Sentry SDK

**@delivery-lead**:
- 執行 Phase 1-3 的開發任務
- 進行代碼審查
- 部署到 production

**@qa-sentinel**:
- 執行完整的測試計畫
- 驗證 RLS 策略
- 監控 production 環境錯誤率

---

## 🎯 下一步行動

### 立即執行（今天）

1. **Architect_Zero** → **Dev_Lead**: 
   ```
   請立即檢查 Supabase Dashboard 的 URL 設定：
   - Site URL 是否為 https://yehgemini888.github.io
   - Redirect URLs 是否包含 https://yehgemini888.github.io/cooker/**
   ```

2. **Architect_Zero** → **Delivery_Lead**:
   ```
   請修改 src/stores/auth.ts 第 65 行：
   - 將 emailRedirectTo 改為完整 URL（包含 #/auth）
   - 參考本報告 "Solution 1" 的代碼範例
   ```

3. **Architect_Zero** → **QA_Sentinel**:
   ```
   修改完成後，請測試以下流程：
   1. 註冊新帳號
   2. 檢查確認郵件的連結格式
   3. 點擊連結，驗證是否成功導向應用
   4. 確認可以登入
   ```

### 本週完成

4. **Architect_Zero** → **PM_Nexus**:
   ```
   緊急修復完成後，建議排入 Phase 2 優化：
   - 重複註冊體驗改善（1 人天）
   - 忘記密碼功能（2 人天）
   
   是否核准進行？
   ```

5. **Architect_Zero** → **CFO_Guardian**:
   ```
   建議整合 Sentry 錯誤監控（$26/月）：
   - 可以追蹤 auth 相關錯誤
   - 提早發現潛在問題
   
   是否核准預算？
   ```

---

## 📚 附錄

### A. Supabase Auth Flow 圖解

```
使用者註冊流程（PKCE）
┌──────────────┐
│   使用者     │
└───────┬──────┘
        │ 1. 輸入 email + password
        ▼
┌──────────────────────┐
│   AuthView.vue       │
│   (前端註冊頁面)      │
└──────────┬───────────┘
           │ 2. authStore.signUp()
           ▼
┌──────────────────────────────────┐
│   auth.ts                        │
│   emailRedirectTo:               │
│   https://...github.io/cooker/#/auth │
└──────────┬───────────────────────┘
           │ 3. supabase.auth.signUp()
           ▼
┌────────────────────────────────┐
│   Supabase Auth Service        │
│   - 建立 auth.users record      │
│   - 觸發 handle_new_user()      │
│   - 發送確認郵件                │
└────────────┬───────────────────┘
             │
             ├─ 4a. 插入 public.profiles
             │
             └─ 4b. 發送確認郵件
                    │
                    ▼
             ┌─────────────────┐
             │   使用者信箱     │
             └─────────┬───────┘
                       │ 5. 點擊確認連結
                       ▼
             ┌─────────────────────────────┐
             │   https://...github.io/     │
             │   cooker/#/auth?code=xxx    │
             └─────────┬───────────────────┘
                       │ 6. detectSessionInUrl: true
                       ▼
             ┌─────────────────────────────┐
             │   Supabase Client           │
             │   - 解析 code                │
             │   - 換取 access_token        │
             │   - 儲存 session             │
             └─────────┬───────────────────┘
                       │ 7. onAuthStateChange()
                       ▼
             ┌─────────────────────────────┐
             │   auth.ts initialize()      │
             │   session.value = newSession│
             │   user.value = newUser      │
             └─────────┬───────────────────┘
                       │ 8. router guard
                       ▼
             ┌─────────────────────────────┐
             │   導向 /profile              │
             │   (註冊完成！)               │
             └─────────────────────────────┘
```

### B. RLS 策略完整列表

```sql
-- 1. profiles 表
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. baby_profiles 表
CREATE POLICY "Users can view their own baby profiles" ON public.baby_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own baby profiles" ON public.baby_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own baby profiles" ON public.baby_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own baby profiles" ON public.baby_profiles FOR DELETE USING (auth.uid() = user_id);

-- 3. ingredient_states 表
CREATE POLICY "Users can view ingredient states for their babies" ON public.ingredient_states FOR SELECT 
  USING (baby_id IN (SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert ingredient states for their babies" ON public.ingredient_states FOR INSERT 
  WITH CHECK (baby_id IN (SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update ingredient states for their babies" ON public.ingredient_states FOR UPDATE 
  USING (baby_id IN (SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete ingredient states for their babies" ON public.ingredient_states FOR DELETE 
  USING (baby_id IN (SELECT id FROM public.baby_profiles WHERE user_id = auth.uid()));

-- 4-7. 其他表格（recipe_ratings, favorite_recipes, pantry_items, meal_plans）也使用相同模式
```

### C. 環境變數清單

```bash
# .env.local (開發環境)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# .env.production (生產環境)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### D. 參考文件

- [Supabase Auth with PKCE](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui#pkce-flow)
- [OAuth 2.1 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Row Level Security (RLS) Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Hash Routing with Vue Router](https://router.vuejs.org/guide/essentials/history-mode.html#hash-mode)

---

**報告結束**

如有任何疑問或需要進一步協助，請呼叫 @architect-zero。

---

**文檔版本**: v1.0  
**最後更新**: 2024-02-19  
**維護者**: Architect_Zero  
**審閱者**: PM_Nexus, Dev_Lead, CFO_Guardian, QA_Sentinel, Delivery_Lead
