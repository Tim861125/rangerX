set shell := ["zsh", "-cu"]

# 顯示可用指令
default:
    @just --list

# 安裝依賴
install:
    git pull
    bun install
    bun run db:migrate:local

# 啟動 Nuxt 開發環境（含本機 D1）
dev:
    bun run dev

# 套用本機 D1 migration
db-migrate:
    bun run db:migrate:local

# 套用 Cloudflare D1 migration
db-migrate-remote:
    bun run db:migrate:remote

# 重新產生 Cloudflare binding 型別
cf-types:
    bun run cf:types

# 執行型別檢查
typecheck:
    bun run typecheck

# 執行單元測試
test:
    bun run test

# 批次同步角色圖片至 Cloudflare R2（或本地目錄）
sync-images *args="":
    bun run scripts/sync-images.ts {{args}}

# 建置 Cloudflare Worker
build:
    bun run build

# 完整驗證
check:
    bun run check

# Cloudflare 部署前 dry-run
deploy-dry:
    bun run deploy:dry

# 套用遠端 migration 並部署
deploy:
    bun run deploy

# git push → 遠端 DB migrate → 部署（一鍵完成）
# 使用方式：just release "commit message"
release MSG:
    git add -A && git commit -m "{{MSG}}" && git push
    bun run deploy