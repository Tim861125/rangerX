# RangerX

LINE Rangers 角色資料查詢網站。使用 Nuxt 4、shadcn-vue、Cloudflare Workers 與 D1（SQLite）建置，支援手機優先的卡片瀏覽、複合篩選、關鍵字搜尋、角色詳情與手動資料同步。

## 功能

- 以名稱、`ranger_id`、角色敘述、技能、能力與才能關鍵字搜尋。
- 依星數／進化、類型、屬性篩選，並依登場時間、體力、攻擊力與礦物費用排序。
- 顯示角色圖片、完整戰鬥數值、技能效果、能力、覺醒能力與才能。
- 手機版使用橫向角色卡與底部篩選 Sheet；桌面版使用固定篩選側欄。
- 從來源 API 手動增量同步；僅寫入新增或變更資料。
- 可選的管理權杖保護同步 API。

## 本機啟動

需求：Bun 1.3+、just。

```bash
bun install
just db-migrate
just dev
```

開啟 `http://localhost:3000`，右上角按「更新」即可把來源資料匯入本機 D1。第一次同步會寫入約 2,276 筆資料。

常用指令：

```bash
just                 # 列出所有指令
just typecheck       # Nuxt / Vue 型別檢查
just test            # Vitest
just check           # typecheck + test + build
just deploy-dry      # Cloudflare dry-run
```

## API

後端均遵循 `api/{group}/Verb+Noun`：

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/api/rangers/GetRangers` | 分頁搜尋、篩選與排序 |
| GET | `/api/rangers/GetRanger/:id` | 取得單一 Ranger 詳情 |
| GET | `/api/rangers/GetFilters` | 取得篩選選項 |
| GET | `/api/sync/GetStatus` | 取得最近同步狀態 |
| POST | `/api/sync/UpdateRangers` | 手動同步來源資料 |

`GetRangers` 支援 `q`、`star`、`type`、`attribute`、`sort`、`page`、`pageSize`。

若設定 `NUXT_SYNC_TOKEN`，呼叫更新 API 時必須帶：

```text
Authorization: Bearer <token>
```

## Cloudflare 部署

Wrangler 使用自動資源配置，首次部署會建立 D1 並把資源 ID 寫回 `wrangler.jsonc`。先登入，再執行：

```bash
bunx wrangler login
bunx wrangler secret put NUXT_SYNC_TOKEN  # 建議，但可選
just deploy
```

`just deploy` 會先建置、套用遠端 D1 migration，再部署 Worker。若希望先檢查輸出：

```bash
just deploy-dry
```

Cloudflare Dashboard 的 Git build 可使用：

- Build command：`bun run build`
- Deploy command：`bun run db:migrate:remote && bunx wrangler pages deploy`

`wrangler.jsonc` 是 Pages 的部署設定來源，並把遠端 D1 以 `DB` binding 綁定；請勿另外建立名稱為 `rangerx_db` 的重複 binding。

## 資料設計（三表架構）

D1 資料庫採用分層清晰的 **三表架構**：

1. **`sync_status`（狀態控制表）**：負責紀錄資料同步的狀態鎖、歷程統計（抓取、新增、更新、刪除筆數）與錯誤訊息。
2. **`rangers_raw`（原始資料表）**：完整拆解來源 JSON 的 45 個原生欄位，保留原始字串、單位、中文字與子物件，方便審計與重構。
3. **`rangers_formatted`（格式化資料表）**：清洗單位（`14.0秒` -> `14.0`）、分離評級與數值、轉換二元布林（`1/0`）、過濾無用字串（`"無"` -> `NULL`）並建立專用索引（如星數、屬性、類型、推出時間等），提供 API 高速查詢。

完整分析請見 [docs/data-analysis.md](docs/data-analysis.md)。
