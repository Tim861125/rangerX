set shell := ["zsh", "-cu"]

# 顯示可用指令
default:
    @just --list

# 安裝依賴
install:
    bun install

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
