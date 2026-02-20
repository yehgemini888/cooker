# 🎯 架構建議摘要 - Supabase Auth 流程問題

**文檔類型**: 執行摘要  
**日期**: 2024-02-19  
**分析者**: Architect_Zero  
**閱讀時間**: 5 分鐘  

---

## 📊 問題概述

### 當前狀況
❌ 用戶收到確認信後，點擊連結導向 `http://localhost:3000/#error=access_denied&error_code=otp_expired`  
❌ 無法完成註冊流程  
❌ 影響所有新用戶  

### 根本原因
1. **Supabase Dashboard 的 Site URL 設定可能錯誤**（仍指向 localhost）
2. **emailRedirectTo 雖然動態計算，但可能不夠明確**（缺少 `#/auth` 路徑）
3. **URL error 參數沒有被正確處理**（用戶看到神秘錯誤）

### 架構評估
| 項目 | 評分 | 狀態 |
|------|------|------|
| Clean Architecture 合規性 | ⭐⭐⭐⭐⭐ | ✅ 優秀 |
| 數據隔離 (RLS) | ⭐⭐⭐⭐⭐ | ✅ 完整 |
| Auth 流程 | ⭐⭐⭐ | ⚠️ 需修復 |
| 錯誤處理 | ⭐⭐⭐⭐ | ✅ 良好 |

---

## 🚀 立即行動（今天完成）

### 1. 修正 Supabase Dashboard 設定

**路徑**: Supabase Dashboard → Authentication → URL Configuration

```
Site URL: https://yehgemini888.github.io

Redirect URLs:
  - https://yehgemini888.github.io/cooker/**
  - http://localhost:5173/cooker/**
  - http://localhost:3000/cooker/**
```

⚠️ **注意**: Site URL 不包含 `/cooker`，但 Redirect URLs 需要包含

---

### 2. 修改代碼：emailRedirectTo

**檔案**: `src/stores/auth.ts` (第 65 行)

**現有代碼**:
```typescript
const redirectUrl = `${window.location.origin}${import.meta.env.BASE_URL}`
```

**修改為**:
```typescript
const redirectUrl = import.meta.env.PROD
  ? 'https://yehgemini888.github.io/cooker/#/auth'
  : `${window.location.origin}${import.meta.env.BASE_URL}#/auth`
```

**理由**:
- ✅ 硬編碼 production URL（避免動態計算錯誤）
- ✅ 包含 `#/auth` 路徑（確保 hash routing 正確解析）
- ✅ 明確指向 auth 頁面（避免重定向到首頁）

---

### 3. 增加 URL Error 參數處理

**檔案**: `src/stores/auth.ts` (在 `initialize()` 函數中)

**在第 38 行後加入**:
```typescript
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
  
  // ... 其他初始化邏輯 ...
}
```

**同時更新 translateAuthError 函數**:
```typescript
function translateAuthError(message: string, code?: string): string {
  // 先檢查 code
  if (code === 'otp_expired') {
    return '確認連結已失效，請重新註冊。確認郵件有效期為 1 小時。'
  }
  if (code === 'access_denied') {
    return '驗證失敗，請確認您點擊的是最新的確認郵件。'
  }
  
  // ... 現有的 message mapping ...
}
```

---

### 4. 測試流程

**由 QA_Sentinel 執行**:

1. **清除瀏覽器資料**（localStorage, cookies）
2. **註冊新帳號**（使用真實 email）
3. **檢查確認郵件**
   - 連結格式應為：`https://yehgemini888.github.io/cooker/#/auth?code=xxx`
4. **點擊確認連結**
   - 應該導向應用
   - 應該自動登入
   - 應該導向 `/profile`
5. **驗證資料隔離**
   - 只能看到自己的資料
   - 無法存取其他用戶資料

**預期結果**:
- ✅ 用戶可以完成註冊
- ✅ 用戶可以登入
- ✅ 用戶只能看到自己的資料

---

## 🎯 架構決策總結

### 我們選擇的方案

| 決策項 | 選擇 | 理由 |
|-------|------|------|
| **Auth Flow** | PKCE (而非 implicit) | 安全性高、符合 OAuth 2.1 標準 |
| **Routing** | Hash Routing | GitHub Pages 唯一可行方案 |
| **Data Isolation** | RLS Policies | Database 層強制執行，更可靠 |
| **部署平台** | GitHub Pages | 免費、可靠 |

### 為什麼不選其他方案

❌ **Implicit Flow**: 安全性低，已被 IETF 標記為 deprecated  
❌ **History Mode**: 需要 server-side routing，GitHub Pages 不支援  
❌ **前端過濾資料**: 不安全，必須使用 RLS  

---

## 📈 預期成果

### 修復後的使用者流程

```
用戶註冊
  ↓
收到確認信（連結正確）
  ↓
點擊連結 → https://...github.io/cooker/#/auth?code=xxx
  ↓
Supabase 解析 code → 建立 session
  ↓
自動登入 → 導向 /profile
  ↓
✅ 註冊完成！
```

### 成功指標

| 指標 | 目標 | 測量方式 |
|------|------|---------|
| Email Confirmation 成功率 | ≥ 95% | Supabase Dashboard |
| 註冊轉化率 | ≥ 80% | Google Analytics |
| Auth 錯誤率 | ≤ 2% | Sentry |
| 用戶滿意度 | ≥ 4.5/5 | User Feedback |

---

## 📋 完整實施計畫

### Phase 1: 緊急修復（今天完成）

| 任務 | 負責人 | 工時 |
|------|-------|------|
| 更新 Supabase Dashboard 設定 | @dev-lead | 30 分鐘 |
| 修改 emailRedirectTo 代碼 | @delivery-lead | 30 分鐘 |
| 增加 URL error 參數解析 | @delivery-lead | 1 小時 |
| 測試 email confirmation | @qa-sentinel | 1 小時 |

**總計**: 3 小時（0.5 天）

---

### Phase 2: 體驗優化（本週完成）

| 任務 | 工時 |
|------|------|
| 前端 email 驗證 | 30 分鐘 |
| 重複註冊自動切換到登入 | 1 小時 |
| 增強錯誤訊息翻譯 | 30 分鐘 |
| 增加「忘記密碼」功能 | 2 小時 |
| UI/UX 測試 | 1 小時 |

**總計**: 5 小時（1 天）

---

### Phase 3: 架構強化（下週完成）

| 任務 | 工時 |
|------|------|
| Profile 自動建立 fallback | 1 小時 |
| RLS 策略測試套件 | 3 小時 |
| Sentry 錯誤監控整合 | 2 小時 |
| 撰寫 ADR-001 | 1 小時 |

**總計**: 7 小時（1 天）

---

## ⚠️ 風險與緩解

| 風險 | 影響 | 緩解方案 |
|------|------|---------|
| **Redirect URL 設定錯誤** | 🔴 高 | 多環境測試、硬編碼 URL |
| **PKCE 與 hash routing 不兼容** | 🟡 中 | 多瀏覽器測試、備案 implicit flow |
| **Profile 觸發器失敗** | 🟡 中 | 前端 fallback 邏輯 |
| **OTP token 過期** | 🟢 低 | 友善錯誤訊息 |

---

## 📚 相關文檔

**完整文檔**:
- 📄 [完整架構分析報告](./SUPABASE_AUTH_ARCHITECTURE_ANALYSIS.md) - 87KB，包含所有技術細節
- 📄 [ADR-001: Supabase Auth 架構設計](./docs/adr/ADR-001-supabase-auth-design.md) - 架構決策記錄

**外部參考**:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth 2.1 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🤝 下一步協作

### 呼叫相關 Agent

**@dev-lead**:
```
請立即檢查 Supabase Dashboard 的 URL 設定：
- Site URL 是否為 https://yehgemini888.github.io
- Redirect URLs 是否包含 https://yehgemini888.github.io/cooker/**
```

**@delivery-lead**:
```
請修改 src/stores/auth.ts：
- 第 65 行：將 emailRedirectTo 改為完整 URL（包含 #/auth）
- 第 38 行後：加入 URL error 參數解析邏輯
參考本報告「立即行動」章節的代碼範例
```

**@qa-sentinel**:
```
修改完成後，請測試：
1. 註冊新帳號
2. 檢查確認郵件的連結格式
3. 點擊連結，驗證是否成功導向應用
4. 確認可以登入並存取資料
```

**@pm-nexus**:
```
緊急修復完成後，建議排入 Phase 2 優化：
- 重複註冊體驗改善（1 天）
- 忘記密碼功能（2 小時）
是否核准進行？
```

**@cfo-guardian**:
```
建議整合 Sentry 錯誤監控（$26/月）：
- 可以追蹤 auth 相關錯誤
- 提早發現潛在問題
是否核准預算？
```

---

## ✅ 驗收標準

**Phase 1 完成時**:
- [ ] 用戶可以收到確認信
- [ ] 確認信連結格式正確（包含 production domain）
- [ ] 點擊連結後成功登入
- [ ] 無 `otp_expired` 或 `access_denied` 錯誤

**Phase 2 完成時**:
- [ ] 重複註冊時自動切換到登入模式
- [ ] 所有錯誤訊息都有中文翻譯
- [ ] 用戶可以使用「忘記密碼」功能

**Phase 3 完成時**:
- [ ] RLS 策略測試全部通過
- [ ] 錯誤自動上報到 Sentry
- [ ] ADR-001 文檔完整

---

## 📊 成本與時間估算

| 階段 | 工時 | 成本 | 完成時間 |
|------|------|------|---------|
| Phase 1: 緊急修復 | 3 小時 | $0 | 今天 |
| Phase 2: 體驗優化 | 5 小時 | $0 | 本週 |
| Phase 3: 架構強化 | 7 小時 | $26/月 (Sentry) | 下週 |
| **總計** | **15 小時** | **$26/月** | **本週** |

**預算確認**: Phase 3 需要 @cfo-guardian 核准 Sentry 預算

---

## 🎓 關鍵學習

### 最佳實踐

✅ **DO**:
- 使用 PKCE flow（最安全）
- RLS 策略在 database 層強制執行
- 硬編碼 production URL（避免動態計算錯誤）
- 友善的中文錯誤訊息
- 完整的自動化測試

❌ **DON'T**:
- 不要使用 implicit flow（已 deprecated）
- 不要在前端過濾資料（必須使用 RLS）
- 不要信任 `window.location.origin`（可能在某些環境出錯）
- 不要忽略 URL error 參數
- 不要跳過 RLS 測試

---

## 🏆 成功標準

**短期（本週）**:
- ✅ 用戶可以完成註冊
- ✅ Email confirmation 成功率 > 90%
- ✅ 無阻塞性錯誤

**中期（本月）**:
- ✅ Email confirmation 成功率 > 95%
- ✅ 註冊轉化率 > 80%
- ✅ Auth 錯誤率 < 2%

**長期（3 個月）**:
- ✅ 支援 OAuth provider（Google, Facebook）
- ✅ 實作 2FA
- ✅ 用戶滿意度 > 4.5/5

---

**需要協助？** 請呼叫 @architect-zero

**文檔版本**: v1.0  
**最後更新**: 2024-02-19  
**預估閱讀時間**: 5 分鐘
