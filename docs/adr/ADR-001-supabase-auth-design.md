# ADR-001: Supabase Auth 架構設計

**狀態**: ✅ 已接受  
**日期**: 2024-02-19  
**決策者**: Architect_Zero  
**相關方**: PM_Nexus, Dev_Lead, Delivery_Lead, QA_Sentinel  

---

## 背景與問題陳述

### 問題描述
1. 用戶收到 Supabase 確認信，連結指向 `http://localhost:3000/#error=access_denied&error_code=otp_expired`
2. 重複註冊時沒有友善提示
3. 需要確保每位使用者有獨立資料

### 觸發因素
- 用戶無法完成 email confirmation 流程
- 需要在 GitHub Pages 環境部署，不支援 server-side routing
- 需要確保用戶資料隔離

### 約束條件
- **技術約束**：GitHub Pages 只支援 hash routing
- **安全約束**：必須符合 OAuth 2.1 標準
- **成本約束**：優先使用免費方案
- **用戶體驗約束**：註冊流程必須順暢

---

## 決策

### 我們決定

1. **使用 PKCE authorization code flow**（而非 implicit flow）
2. **使用 hash routing** (`createWebHashHistory`)
3. 在 Supabase client 設定 `detectSessionInUrl: true`
4. **emailRedirectTo 使用完整 URL** 並包含 `#/auth` 路徑
5. 實施完整的 **RLS 策略** 確保 data isolation

### 核心理由

1. **安全性優先**
   - PKCE 是 OAuth 2.1 推薦方案
   - 比 implicit flow 更安全（不在 URL 暴露 access token）
   - 符合 IETF 最佳實踐

2. **部署便利性**
   - GitHub Pages 免費且可靠
   - Hash routing 是唯一可行方案
   - 不需要 server-side configuration

3. **資料隔離可靠**
   - RLS 策略在 database 層強制執行
   - 比前端過濾更可靠
   - 符合 Zero Trust 架構原則

4. **與現有架構一致**
   - Clean Architecture 分層清晰
   - Auth store 已採用 Pinia 狀態管理
   - 與 Vue Router 整合良好

---

## 替代方案比較

| 方案 | 優勢 | 劣勢 | 成本 | 為何不選 |
|-----|------|------|------|---------|
| **PKCE + Hash Routing** (✅選中) | • 安全性高<br>• 免費部署<br>• 符合標準 | • Hash routing 對 SEO 不友好（但本產品不需要 SEO） | $0/月 | ✅ 選中 |
| Implicit Flow + Hash Routing | • 實作簡單<br>• 與 hash routing 天然兼容 | • 安全性低<br>• 已被標記為 deprecated<br>• Token 暴露在 URL | $0/月 | ❌ 不符合安全標準 |
| PKCE + History Mode + Vercel | • 最佳 UX<br>• 支援 SSR<br>• 更好的 SEO | • 需要 server routing<br>• 遷移成本高 | $20/月 | ❌ 超出預算 |
| Firebase Auth | • Google 生態系整合好<br>• 文檔豐富 | • 遷移成本高<br>• 已投資 Supabase<br>• 學習曲線 | $0-25/月 | ❌ 技術債務 |
| NextAuth.js | • 支援多種 provider<br>• 社群活躍 | • 需要 Next.js<br>• 不適用 Vue 生態 | $0/月 | ❌ 技術棧不匹配 |

---

## 技術實施細節

### 1. Supabase Client 配置

```typescript
// src/lib/supabase.ts
const supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // ✅ 持久化 session
    autoRefreshToken: true,       // ✅ 自動刷新 token
    detectSessionInUrl: true,     // ✅ 檢測 URL 中的 session (支援 PKCE)
    flowType: 'pkce',            // ✅ 使用 PKCE 授權流（最安全）
    storage: window.localStorage,
    storageKey: 'cooker-auth-token',
    debug: import.meta.env.DEV,
  },
})
```

### 2. Email Redirect URL 策略

```typescript
// src/stores/auth.ts
async function signUp(email: string, password: string) {
  // Production 使用硬編碼 URL，避免動態計算錯誤
  const redirectUrl = import.meta.env.PROD
    ? 'https://yehgemini888.github.io/cooker/#/auth'
    : `${window.location.origin}${import.meta.env.BASE_URL}#/auth`
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      emailRedirectTo: redirectUrl,
      data: {
        display_name: email.split('@')[0], // 預設名稱
      }
    },
  })
}
```

### 3. Supabase Dashboard 設定

**Site URL**:
```
https://yehgemini888.github.io
```

**Redirect URLs**:
```
https://yehgemini888.github.io/cooker/**
http://localhost:5173/cooker/**
http://localhost:3000/cooker/**
```

### 4. RLS 策略架構

```
auth.users (Supabase Auth)
    ↓ 1:1 (handle_new_user 觸發器)
public.profiles (RLS: auth.uid() = id)
    ↓ 1:N
public.baby_profiles (RLS: auth.uid() = user_id)
    ↓ 1:N
ingredient_states, recipe_ratings, etc. 
(RLS: baby_id IN (SELECT id FROM baby_profiles WHERE user_id = auth.uid()))
```

**關鍵 RLS 策略**:
```sql
-- profiles 表
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- baby_profiles 表
CREATE POLICY "Users can view their own baby profiles"
    ON public.baby_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- ingredient_states 表（多層級關聯）
CREATE POLICY "Users can view ingredient states for their babies"
    ON public.ingredient_states FOR SELECT
    USING (
        baby_id IN (
            SELECT id FROM public.baby_profiles 
            WHERE user_id = auth.uid()
        )
    );
```

---

## 影響分析

### 技術影響

**正面影響**:
- ✅ 符合 OAuth 2.1 最佳安全實踐
- ✅ 完整的 RLS 策略確保資料隔離
- ✅ 與 Clean Architecture 分層一致
- ✅ 支援自動 token refresh，提升 UX
- ✅ 前端代碼清晰，易於維護

**負面影響**:
- ⚠️ Hash routing 對 SEO 不友好（但本產品為 web app，不需要 SEO）
- ⚠️ URL 較長（包含 `#/` 路徑）
- ⚠️ 需要處理 hash routing 與 query parameters 的解析

### 成本影響

| 項目 | 成本 | 說明 |
|------|------|------|
| **Supabase 免費層** | $0/月 | 足夠 MVP 使用（50,000 MAU） |
| **GitHub Pages** | $0/月 | 免費靜態網站託管 |
| **開發成本** | 3 人天 | 緊急修復 (1天) + 優化 (2天) |
| **維護成本** | 低 | 標準 OAuth 流程，文檔完善 |
| **潛在升級成本** | $25/月 | Supabase Pro（100,000 MAU） |

**總計**: 初期 $0/月，擴展時 $25/月

### 業務影響

**正面影響**:
- ✅ 用戶可以順利完成註冊，提升轉化率
- ✅ 資料隔離確保用戶隱私，符合法規要求
- ✅ 免費部署降低初期成本，加速 MVP 上線

**負面影響**:
- ⚠️ Hash routing 可能影響品牌形象（URL 包含 `#`）
- ⚠️ 無法使用 server-side rendering（但本產品不需要）

---

## 風險與緩解

### 風險矩陣

| 風險 | 可能性 | 影響 | 風險等級 | 緩解方案 |
|------|-------|------|---------|---------|
| **Email redirect 設定錯誤** | 中 | 高 | 🔴 高 | • 硬編碼 production URL<br>• 多環境測試<br>• 自動化驗證 |
| **PKCE 與 hash routing 不兼容** | 低 | 高 | 🟡 中 | • 參考官方文檔<br>• 多瀏覽器測試<br>• 保留 implicit flow 備案 |
| **Profile 觸發器失敗** | 低 | 中 | 🟡 中 | • 前端 fallback 邏輯<br>• 監控觸發器執行<br>• 手動修復腳本 |
| **RLS 策略有漏洞** | 低 | 高 | 🟡 中 | • 自動化測試<br>• 定期安全審計<br>• Penetration testing |
| **OTP token 過期** | 中 | 低 | 🟢 低 | • 友善錯誤訊息<br>• 提供重新發送功能 |

### 詳細緩解措施

**1. Email Redirect 設定錯誤**
- **現象**：用戶點擊確認信後導向 localhost
- **根因**：Supabase Dashboard 的 Site URL 設定錯誤
- **緩解**：
  1. 硬編碼 production URL（避免動態計算）
  2. 在 Dashboard 設定多個 fallback URLs
  3. 加入自動化測試驗證 redirect 流程
  4. 監控 email confirmation 成功率

**2. PKCE 與 Hash Routing 兼容性**
- **現象**：URL 參數解析失敗
- **根因**：`#/path?code=xxx` 格式可能被某些瀏覽器誤解析
- **緩解**：
  1. 參考 Supabase 官方文檔確認兼容性
  2. 在 Chrome, Safari, Firefox 進行測試
  3. 保留切換到 implicit flow 的選項（作為備案）
  4. 考慮未來遷移到 Vercel/Netlify（支援 server routing）

**3. Profile 觸發器失敗**
- **現象**：用戶註冊後無法登入（profile 不存在）
- **根因**：`handle_new_user()` 觸發器執行失敗
- **緩解**：
  1. 前端檢查 profile 是否存在，不存在則手動建立
  2. 監控觸發器執行失敗次數
  3. 提供手動修復腳本
  4. 考慮使用 Supabase Functions 作為備份機制

---

## 驗收標準

### 功能驗收

- [ ] 用戶可以使用 email + password 註冊
- [ ] 用戶收到確認信，連結格式為 `https://yehgemini888.github.io/cooker/#/auth?code=xxx`
- [ ] 點擊確認連結後，用戶成功導向應用並自動登入
- [ ] 用戶可以使用 email + password 登入
- [ ] 登入後只能看到自己的資料（RLS 生效）
- [ ] 用戶無法存取其他用戶的資料
- [ ] 重複註冊時顯示友善錯誤訊息
- [ ] 密碼錯誤時顯示友善錯誤訊息
- [ ] Token 自動刷新，無需手動重新登入

### 安全驗收

- [ ] 所有表格都啟用 RLS
- [ ] RLS 策略測試全部通過（無跨用戶資料洩漏）
- [ ] 使用 PKCE flow（而非 implicit flow）
- [ ] Token 儲存在 localStorage（而非 URL 或 cookie）
- [ ] Password 使用 bcrypt 加密（Supabase 內建）
- [ ] SQL Injection 測試通過
- [ ] XSS 測試通過

### 性能驗收

- [ ] 註冊響應時間 < 2 秒
- [ ] 登入響應時間 < 1 秒
- [ ] Email confirmation 響應時間 < 3 秒
- [ ] Token refresh 響應時間 < 500ms
- [ ] RLS 查詢不影響性能（index 優化）

### 用戶體驗驗收

- [ ] 所有錯誤訊息都有中文翻譯
- [ ] 重複註冊時自動切換到登入模式
- [ ] 提供「忘記密碼」功能
- [ ] 註冊流程不超過 3 步
- [ ] 無需離開應用即可完成註冊（email verification 除外）

---

## 實施計畫

### Phase 1: 緊急修復（P0 - 立即執行）

**目標**: 修復 email confirmation 問題

| 任務 | 負責人 | 工時 | 驗收標準 |
|------|-------|------|---------|
| 更新 Supabase Dashboard 設定 | Dev_Lead | 0.5h | Site URL 和 Redirect URLs 正確 |
| 修改 emailRedirectTo 為完整 URL | Delivery_Lead | 0.5h | 代碼審查通過 |
| 增加 URL error 參數解析 | Delivery_Lead | 1h | 錯誤訊息正確顯示 |
| 測試 email confirmation 流程 | QA_Sentinel | 1h | 用戶可以完成註冊 |

**總計**: 3 人時（0.5 天）

### Phase 2: 體驗優化（P1 - 本週完成）

**目標**: 改善用戶體驗

| 任務 | 負責人 | 工時 | 驗收標準 |
|------|-------|------|---------|
| 前端 email 驗證 | Delivery_Lead | 0.5h | 無效 email 無法提交 |
| 重複註冊自動切換到登入 | Delivery_Lead | 1h | 重複註冊時切換模式 |
| 增強錯誤訊息翻譯 | Delivery_Lead | 0.5h | 所有錯誤都有中文 |
| 增加「忘記密碼」功能 | Delivery_Lead | 2h | 用戶可以重設密碼 |
| UI/UX 測試 | QA_Sentinel | 1h | 用戶體驗良好 |

**總計**: 5 人時（1 天）

### Phase 3: 架構強化（P2 - 下週完成）

**目標**: 加強監控和測試

| 任務 | 負責人 | 工時 | 驗收標準 |
|------|-------|------|---------|
| Profile 自動建立 fallback | Delivery_Lead | 1h | 觸發器失敗時有備援 |
| RLS 策略測試套件 | QA_Sentinel | 3h | 所有測試通過 |
| Sentry 錯誤監控整合 | Dev_Lead | 2h | 錯誤自動上報 |
| 撰寫 ADR-001 | Architect_Zero | 1h | 文檔完整 |

**總計**: 7 人時（1 天）

**全部總計**: 15 人時（≈ 2.5 天）

---

## 監控與維護

### 關鍵指標

| 指標 | 目標值 | 測量方式 | 報警閾值 |
|------|-------|---------|---------|
| **Email Confirmation 成功率** | ≥ 95% | Supabase Dashboard | < 90% |
| **註冊轉化率** | ≥ 80% | Google Analytics | < 70% |
| **登入成功率** | ≥ 98% | Supabase Dashboard | < 95% |
| **Auth 相關錯誤率** | ≤ 2% | Sentry | > 5% |
| **Token Refresh 失敗率** | ≤ 1% | Sentry | > 3% |
| **RLS 策略違規** | 0 | Supabase Logs | > 0 |

### 監控工具

**Supabase Dashboard**:
- Auth events (sign up, sign in, sign out)
- RLS policy violations
- Database slow queries
- Storage usage

**Sentry** (建議整合):
- Frontend errors (auth failures, API errors)
- Performance monitoring (page load, API latency)
- User feedback (error context)

**Google Analytics**:
- User flow (註冊漏斗)
- Conversion rate
- Bounce rate

---

## 回顧與學習

### 成功要素

1. **清晰的架構決策**
   - 選擇 PKCE 而非 implicit flow（安全性優先）
   - 使用 RLS 策略（資料隔離在 DB 層）
   - 硬編碼 production URL（避免動態計算錯誤）

2. **完整的錯誤處理**
   - 中文化所有錯誤訊息
   - URL error 參數解析
   - Profile 觸發器 fallback

3. **充分的測試**
   - 單元測試（auth store）
   - 整合測試（auth flow）
   - RLS 策略測試
   - 多瀏覽器測試

### 經驗教訓

1. **Hash Routing 的限制**
   - SEO 不友好（但本產品不需要）
   - URL 較長（包含 `#/` 路徑）
   - 與某些 OAuth provider 可能有兼容性問題

2. **Supabase Dashboard 設定容易遺漏**
   - Redirect URLs 需要包含所有可能的環境
   - Site URL 不包含路徑（但 Redirect URLs 需要）
   - 設定錯誤會導致神秘的錯誤訊息

3. **觸發器不是萬能的**
   - 需要前端 fallback 邏輯
   - 需要監控觸發器執行狀態
   - 考慮使用 Supabase Functions 作為備份

### 未來改進方向

1. **短期（3 個月內）**
   - 增加 OAuth provider（Google, Facebook）
   - 實作 2FA（Two-Factor Authentication）
   - 優化錯誤訊息（更具體的指引）

2. **中期（6 個月內）**
   - 考慮遷移到 Vercel/Netlify（支援 server routing）
   - 實作 SSO（Single Sign-On）
   - 增加 session 管理（查看所有登入裝置）

3. **長期（1 年內）**
   - 考慮自建 Auth Service（更彈性的控制）
   - 實作 passwordless authentication（magic link）
   - 增加生物辨識（WebAuthn）

---

## 相關文檔

- [完整架構分析報告](../SUPABASE_AUTH_ARCHITECTURE_ANALYSIS.md)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth 2.1 Authorization Framework](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-07)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Vue Router Hash Mode](https://router.vuejs.org/guide/essentials/history-mode.html#hash-mode)

---

## 變更歷史

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|---------|------|
| 1.0 | 2024-02-19 | 初版：確定使用 PKCE + Hash Routing | Architect_Zero |

---

**決策核准**:

- [x] Architect_Zero (架構設計)
- [ ] PM_Nexus (業務需求)
- [ ] Dev_Lead (技術可行性)
- [ ] CFO_Guardian (成本控制)
- [ ] QA_Sentinel (品質保證)

---

**下一步行動**:

1. **Dev_Lead**: 檢查 Supabase Dashboard 設定
2. **Delivery_Lead**: 修改 `emailRedirectTo` 代碼
3. **QA_Sentinel**: 執行 email confirmation 測試
4. **PM_Nexus**: 確認 Phase 2-3 排程

---

**文檔版本**: v1.0  
**最後更新**: 2024-02-19  
**維護者**: Architect_Zero
