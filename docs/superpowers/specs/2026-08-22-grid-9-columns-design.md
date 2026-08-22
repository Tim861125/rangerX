# 9 欄卡片佈局與 UI/UX 升級設計規範

## 1. 概述
將全站角色列表（`index.vue`）與圖鑑收集頁面（`collection.vue`）的網格從原本的 16 欄超緊湊模式升級為 **9 欄標準卡牌模式**。每頁載入筆數調整為 **108 筆**（9 欄 × 12 行），並相應優化卡片內部元素（星星、立繪間距、HUD裝飾邊角）的視覺比例。

---

## 2. 佈局與響應式斷點規格 (Grid & Responsive Layout)

### 2.1 斷點規劃
將原本過密的 16 欄改為以 9 欄為最大寬度的階梯式響應式斷點：
- 手機直向 (`< 440px`): `grid-cols-3`
- 手機大螢幕 (`440px ~ 640px`): `grid-cols-4`
- 平板直向 (`sm: 640px ~ 768px`): `grid-cols-5`
- 平板橫向 / 小筆電 (`md: 768px ~ 1024px`): `grid-cols-6`
- 一般筆電 / 桌面 (`lg: 1024px ~ 1280px`): `grid-cols-8`
- 寬螢幕桌面 (`xl: ≥ 1280px`): `grid-cols-9`

### 2.2 間距 (Gap)
- `gap-2 sm:gap-2.5 lg:gap-3`，提供更好的視覺留白與呼吸感。

---

## 3. 分頁與骨架屏 (Pagination & Skeletons)

- **每頁數量 (`pageSize`)**：從 `160` 改為 `108`（9 × 12）。
- **載入骨架屏 (Skeleton)**：`v-for="index in 108"`。
- **影響檔案**：
  - `app/pages/index.vue`
  - `app/pages/collection.vue`

---

## 4. 卡片視覺元件微調 (Component Visual Refinement)

### 4.1 星星標記 (`app/components/StarDisplay.vue`)
卡片尺寸放大（由 ~75px 增至 ~140px），星星需等比放大以維持清晰度：
- **卡片模式 (`mode="card"`)**：
  - 大星星（6~9星）：從 `size-2.5 sm:size-3` 調整為 `size-3.5 sm:size-4`
  - 小星星（1~5星）：從 `size-1.5 sm:size-2` 調整為 `size-2.5 sm:size-3`
  - 星星間距微調為 `gap-0.5`

### 4.2 卡片容器與細節 (`app/components/RangerCard.vue`)
- **HUD 角標裝飾**：尺寸由 `size-1.5` 微調至 `size-2`，線條粗細 `border-[1.5px]`，增強精緻科技感。
- **內部 Padding**：立繪區域調整為 `pt-4 sm:pt-5 pb-1.5 px-2`，確保頂部星星與角色頭部保持適當間距。
- **收集勾選與屬性圖標**：調整圖示與徽章比例，提升點擊與識別體驗。

---

## 5. 變更清單
1. `app/pages/index.vue`：更新 `pageSize`、骨架屏與網格 class。
2. `app/pages/collection.vue`：更新 `pageSize`、骨架屏與網格 class。
3. `app/components/StarDisplay.vue`：微調卡片模式下的星星尺寸與註解。
4. `app/components/RangerCard.vue`：優化角標與內邊距，適配放大後的卡片。
