# 9 欄卡片佈局與 UI/UX 升級 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將角色列表頁（`index.vue`）與圖鑑收集頁（`collection.vue`）的網格從 16 欄調整為 9 欄（`xl:grid-cols-9`），分頁每頁數量設定為 108 筆（9 欄 × 12 行），並微調卡片與星星視覺尺寸。

**Architecture:** 更新 Vue 單檔案元件（SFC）的 Tailwind 佈局 class、SSR 骨架屏計數與分頁參數，並微調卡片內部裝飾與星星比例以適配放大的卡片尺寸。

**Tech Stack:** Nuxt 4, Vue 3, Tailwind CSS v4, Lucide Vue

## Global Constraints
- 每頁載入數量（pageSize）固定為 108 筆
- 網格斷點為：`grid grid-cols-3 min-[440px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2 sm:gap-2.5 lg:gap-3`
- 維護 TypeScript 型別安全，無 any

---

### Task 1: 微調卡片視覺與星星尺寸元件

**Files:**
- Modify: `app/components/StarDisplay.vue:39-48`
- Modify: `app/components/RangerCard.vue:97-125`

**Interfaces:**
- `StarDisplay.vue`: props `{ starCount: number, evolutionType?: EvolutionType, mode?: 'card' | 'detail' }`
- `RangerCard.vue`: props `{ ranger: RangerListItem, mode?: 'link' | 'collection', status?: number }`

- [ ] **Step 1: 更新 `app/components/StarDisplay.vue` 的卡片星星尺寸**

將卡片模式（`mode === 'card'`）下的星星尺寸提升，大星星調整為 `size-3.5 sm:size-4`，小星星調整為 `size-2.5 sm:size-3`。

- [ ] **Step 2: 更新 `app/components/RangerCard.vue` 的 HUD 角標與 padding**

將角標尺寸調整為 `size-2`，立繪容器 padding 調整為 `pt-4 sm:pt-5 pb-1.5 px-2`，確保立繪與星星留白協調。

- [ ] **Step 3: 驗證型別與語法**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/components/StarDisplay.vue app/components/RangerCard.vue
git commit -m "feat(ui): optimize card proportions and star sizing for 9-col grid"
```

---

### Task 2: 更新首頁角色列表（`index.vue`）網格與分頁

**Files:**
- Modify: `app/pages/index.vue`

- [ ] **Step 1: 將 `pageSize` 預設值與 query 參數改為 108**

修改 `app/pages/index.vue` 中的 `pageSize: 160` 為 `pageSize: 108`。

- [ ] **Step 2: 更新骨架屏數量與網格 class**

骨架屏 `v-for="index in 108"`，並將網格 class 改為：
`grid grid-cols-3 min-[440px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2 sm:gap-2.5 lg:gap-3`

- [ ] **Step 3: 驗證型別與建置**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat(page): update index page grid to 9 columns and pageSize to 108"
```

---

### Task 3: 更新圖鑑收集頁面（`collection.vue`）網格與分頁

**Files:**
- Modify: `app/pages/collection.vue`

- [ ] **Step 1: 將 `pageSize` 預設值與 query 參數改為 108**

修改 `app/pages/collection.vue` 中的 `pageSize: 160` 為 `pageSize: 108`。

- [ ] **Step 2: 更新骨架屏數量與網格 class**

骨架屏 `v-for="index in 108"`，並將網格 class 改為：
`grid grid-cols-3 min-[440px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2 sm:gap-2.5 lg:gap-3`

- [ ] **Step 3: 驗證型別與建置**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/pages/collection.vue
git commit -m "feat(page): update collection page grid to 9 columns and pageSize to 108"
```

---

### Task 4: 完整專案測試與建置驗證

**Files:**
- Test all: `tests/`
- Build: 全專案

- [ ] **Step 1: 執行單元測試**

Run: `bun run test`
Expected: PASS

- [ ] **Step 2: 執行型別檢查與專案建置**

Run: `bun run check`
Expected: PASS
