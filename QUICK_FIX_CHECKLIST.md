# ✅ 快速修復檢查清單

**目標**: 修復 Supabase Email Confirmation 問題  
**預估時間**: 3 小時  
**優先級**: 🔴 P0 (阻塞性問題)  

---

## 📋 Step 1: Supabase Dashboard 設定（30 分鐘）

**負責人**: @dev-lead

### 操作步驟

1. **登入 Supabase Dashboard**
   - 前往 https://app.supabase.com
   - 選擇 `cooker` 專案

2. **導航到 Authentication 設定**
   - 左側選單：Authentication → URL Configuration

3. **檢查 Site URL**
   - [ ] 當前值：____________（填入目前的值）
   - [ ] 正確值應為：`https://yehgemini888.github.io`
   - [ ] 如不正確，點擊 Edit 修改

4. **檢查 Redirect URLs**
   - [ ] 是否包含：`https://yehgemini888.github.io/cooker/**`
   - [ ] 是否包含：`http://localhost:5173/cooker/**`
   - [ ] 是否包含：`http://localhost:3000/cooker/**`
   - [ ] 如有遺漏，點擊 "Add redirect URL" 新增

5. **儲存設定**
   - [ ] 點擊 Save
   - [ ] 等待確認訊息

### 驗證

```bash
# 檢查設定是否生效（約需 1-2 分鐘）
# 可以在 Supabase Dashboard → Settings → API 查看當前設定
```

---

## 📋 Step 2: 修改 emailRedirectTo 代碼（30 分鐘）

**負責人**: @delivery-lead

### 檔案位置
`src/stores/auth.ts` (第 61-83 行)

### 修改內容

**原代碼**（第 65 行）:
```typescript
const redirectUrl = `${window.location.origin}${import.meta.env.BASE_URL}`
```

**修改為**:
```typescript
const redirectUrl = import.meta.env.PROD
  ? 'https://yehgemini888.github.io/cooker/#/auth'
  : `${window.location.origin}${import.meta.env.BASE_URL}#/auth`
```

### 修改步驟

1. **打開檔案**
   ```bash
   code src/stores/auth.ts
   # 或使用你的編輯器
   ```

2. **定位到 signUp 函數**（第 61 行）
   - [ ] 找到 `async function signUp(email: string, password: string)`

3. **修改 redirectUrl**（第 65 行）
   - [ ] 複製上方「修改為」的代碼
   - [ ] 替換原有的 `const redirectUrl = ...` 行

4. **儲存檔案**
   - [ ] Ctrl+S (Windows/Linux) 或 Cmd+S (Mac)

### 驗證

```bash
# 檢查語法錯誤
npm run type-check
# 或
npx tsc --noEmit
```

**預期結果**: 無錯誤訊息

---

## 📋 Step 3: 增加 URL Error 參數處理（1 小時）

**負責人**: @delivery-lead

### 檔案位置
`src/stores/auth.ts` (第 16-39 行)

### 修改 1: 更新 translateAuthError 函數

**位置**: 第 42 行

**在函數開頭加入**（第 43 行後）:
```typescript
function translateAuthError(message: string, code?: string): string {
  // 先檢查 error code
  if (code === 'otp_expired') {
    return '確認連結已失效，請重新註冊。確認郵件有效期為 1 小時。'
  }
  if (code === 'access_denied') {
    return '驗證失敗，請確認您點擊的是最新的確認郵件。'
  }
  
  // 現有的 errorMap...
  const errorMap: Record<string, string> = {
    // ... 保持不變
  }
}
```

### 修改 2: 更新 initialize 函數

**位置**: 第 16-39 行

**在第 38 行後（`initialized.value = true` 之前）加入**:
```typescript
async function initialize() {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, skipping auth initialization')
    initialized.value = true
    return
  }
  
  try {
    // 1. 檢查 URL 中的 error 參數（新增）
    const hash = window.location.hash
    if (hash.includes('error=')) {
      const urlParams = new URLSearchParams(hash.split('?')[1] || '')
      const errorCode = urlParams.get('error_code')
      const errorDesc = urlParams.get('error_description')
      
      if (errorCode) {
        error.value = translateAuthError(errorDesc || '', errorCode)
        
        // 清理 URL（移除 error 參數）
        const cleanHash = hash.split('?')[0]
        window.history.replaceState(null, '', cleanHash || '#/auth')
      }
    }
    
    // 2. 取得當前 session（現有代碼）
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    session.value = currentSession
    user.value = currentSession?.user ?? null

    // 3. 監聽後續變化（現有代碼）
    supabase.auth.onAuthStateChange((_event: AuthChangeEvent, newSession: Session | null) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })
  } catch (err: any) {
    console.error('Auth initialization error:', err)
    error.value = err.message
  } finally {
    initialized.value = true
  }
}
```

### 驗證

```bash
# 1. 檢查語法
npm run type-check

# 2. 測試開發環境
npm run dev

# 3. 在瀏覽器測試（手動模擬錯誤 URL）
# 訪問：http://localhost:5173/cooker/#/auth?error=access_denied&error_code=otp_expired
# 應該看到友善的中文錯誤訊息
```

---

## 📋 Step 4: 本地測試（1 小時）

**負責人**: @qa-sentinel

### 前置準備

1. **確認代碼已更新**
   - [ ] Step 2 的代碼修改已完成
   - [ ] Step 3 的代碼修改已完成
   - [ ] 無 TypeScript 錯誤

2. **啟動開發伺服器**
   ```bash
   npm run dev
   ```
   - [ ] 伺服器成功啟動（通常在 http://localhost:5173）

### 測試 1: 註冊流程

1. **清除瀏覽器資料**
   - [ ] 開啟 DevTools (F12)
   - [ ] Application → Local Storage → 刪除 `cooker-auth-token`
   - [ ] 重新整理頁面

2. **註冊新帳號**
   - [ ] 前往 `/auth` 頁面
   - [ ] 輸入真實 email（可以使用 Gmail + 技巧：yourname+test@gmail.com）
   - [ ] 輸入密碼（至少 6 字元）
   - [ ] 點擊「註冊」

3. **檢查 Console**
   - [ ] 無 JavaScript 錯誤
   - [ ] 可以看到 Supabase 請求（Network tab）

4. **檢查信箱**
   - [ ] 收到 Supabase 確認信（檢查垃圾郵件夾）
   - [ ] 確認連結格式：`http://localhost:5173/cooker/#/auth?code=xxx`
   - [ ] **不要點擊連結**（留待 production 測試）

### 測試 2: 錯誤處理

1. **模擬 OTP Expired 錯誤**
   - [ ] 訪問：`http://localhost:5173/cooker/#/auth?error=access_denied&error_code=otp_expired`
   - [ ] 應該看到中文錯誤訊息：「確認連結已失效，請重新註冊。確認郵件有效期為 1 小時。」
   - [ ] URL 應該被清理為：`http://localhost:5173/cooker/#/auth`

2. **模擬 Access Denied 錯誤**
   - [ ] 訪問：`http://localhost:5173/cooker/#/auth?error=access_denied&error_code=access_denied`
   - [ ] 應該看到中文錯誤訊息：「驗證失敗，請確認您點擊的是最新的確認郵件。」

### 測試 3: 重複註冊

1. **使用已註冊的 email**
   - [ ] 輸入剛才註冊的 email
   - [ ] 輸入任意密碼
   - [ ] 點擊「註冊」
   - [ ] 應該看到：「此電子郵件已被註冊，請直接登入」

### 驗證結果

- [ ] 所有測試通過
- [ ] 無 Console 錯誤
- [ ] 錯誤訊息都是中文

---

## 📋 Step 5: 部署到 Production（30 分鐘）

**負責人**: @delivery-lead

### 部署步驟

1. **Commit 代碼**
   ```bash
   git add src/stores/auth.ts
   git commit -m "fix: 修正 Supabase email confirmation redirect URL"
   ```

2. **Push 到 GitHub**
   ```bash
   git push origin main
   # 或你的主分支名稱
   ```

3. **等待 GitHub Actions 部署**
   - [ ] 前往 GitHub → Actions
   - [ ] 確認 workflow 正在執行
   - [ ] 等待部署完成（通常 2-3 分鐘）

4. **驗證部署**
   ```bash
   # 檢查 production 網站
   curl -I https://yehgemini888.github.io/cooker/
   ```
   - [ ] 返回 200 OK

---

## 📋 Step 6: Production 測試（1 小時）

**負責人**: @qa-sentinel

### 測試 1: 完整註冊流程

1. **訪問 Production 網站**
   - [ ] 前往 https://yehgemini888.github.io/cooker/
   - [ ] 頁面正常載入

2. **註冊新帳號**
   - [ ] 使用新的 email（不同於本地測試）
   - [ ] 輸入密碼
   - [ ] 點擊「註冊」
   - [ ] 應該看到成功訊息或提示檢查信箱

3. **檢查確認信**
   - [ ] 收到 Supabase 確認信
   - [ ] **關鍵檢查**：連結格式應為 `https://yehgemini888.github.io/cooker/#/auth?code=xxx`
   - [ ] 連結中**不應該**包含 `localhost`

4. **點擊確認連結**
   - [ ] 成功導向應用
   - [ ] 自動登入
   - [ ] 導向 `/profile` 頁面
   - [ ] **無任何錯誤訊息**

5. **驗證資料隔離**
   - [ ] 可以看到自己的 profile
   - [ ] 可以新增寶寶資料
   - [ ] 資料正確儲存

### 測試 2: 登入登出

1. **登出**
   - [ ] 點擊登出按鈕
   - [ ] 導向 `/auth` 頁面

2. **重新登入**
   - [ ] 使用剛才註冊的 email + password
   - [ ] 點擊「登入」
   - [ ] 成功登入
   - [ ] 導向 `/profile`
   - [ ] 可以看到剛才新增的資料

### 測試 3: 多瀏覽器測試（選擇性）

- [ ] Chrome: 註冊流程正常
- [ ] Safari: 註冊流程正常
- [ ] Firefox: 註冊流程正常

### 驗證結果

- [ ] Email confirmation 成功率 100%（本次測試）
- [ ] 無 `otp_expired` 錯誤
- [ ] 無 `access_denied` 錯誤
- [ ] 用戶可以完整完成註冊→登入流程

---

## 📊 最終驗收

### 功能驗收

- [ ] 用戶可以註冊新帳號
- [ ] 用戶收到確認信（連結格式正確）
- [ ] 點擊確認連結後自動登入
- [ ] 用戶可以登入登出
- [ ] 用戶只能看到自己的資料
- [ ] 重複註冊顯示友善錯誤訊息
- [ ] URL error 參數被正確處理

### 技術驗收

- [ ] 無 TypeScript 錯誤
- [ ] 無 Console 錯誤
- [ ] 無 Supabase API 錯誤
- [ ] Lighthouse Score > 80（選擇性）

### 文檔驗收

- [ ] 已生成完整架構分析報告
- [ ] 已生成 ADR-001
- [ ] 已生成執行摘要

---

## 🚨 如果測試失敗

### 常見問題排查

**問題 1: 確認信連結仍然指向 localhost**

**解決方案**:
1. 再次檢查 Supabase Dashboard 的 Site URL
2. 確認代碼中的 `import.meta.env.PROD` 為 `true`
3. 清除瀏覽器緩存，重新部署

**問題 2: 點擊確認連結後顯示 `otp_expired`**

**解決方案**:
1. 檢查點擊時間（確認信有效期 1 小時）
2. 重新註冊，立即點擊確認連結
3. 檢查 Supabase Dashboard 的 Email Templates 設定

**問題 3: 自動登入失敗**

**解決方案**:
1. 檢查 `detectSessionInUrl: true` 是否設定
2. 檢查 `onAuthStateChange` 是否正確觸發
3. 查看 Console 是否有錯誤訊息

**問題 4: TypeScript 編譯錯誤**

**解決方案**:
1. 檢查 `translateAuthError` 函數簽名（新增 `code?: string` 參數）
2. 確認所有必要的 imports
3. 執行 `npm install` 確保依賴完整

---

## 📞 需要協助

**遇到阻塞性問題？**

1. **Architect_Zero** (架構相關)
   - 呼叫：`@architect-zero`
   - 問題類型：架構決策、設計模式

2. **Dev_Lead** (技術環境)
   - 呼叫：`@dev-lead`
   - 問題類型：Supabase 設定、環境變數

3. **Delivery_Lead** (代碼實作)
   - 呼叫：`@delivery-lead`
   - 問題類型：代碼修改、bug 修復

4. **QA_Sentinel** (測試相關)
   - 呼叫：`@qa-sentinel`
   - 問題類型：測試流程、驗收標準

---

## ✅ 完成確認

**Phase 1 緊急修復已完成**:
- [ ] Supabase Dashboard 設定正確
- [ ] 代碼修改已部署
- [ ] Production 測試通過
- [ ] 用戶可以完成註冊

**下一步**:
- [ ] 通知 @pm-nexus Phase 1 完成
- [ ] 討論 Phase 2 優化排程
- [ ] 更新專案進度

---

**檢查清單版本**: v1.0  
**最後更新**: 2024-02-19  
**預估完成時間**: 3 小時  

🎉 **完成後別忘了慶祝！**
