import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { DEFAULT_RANGER_IMAGE_ORIGIN, getRangerImagePath, getRangerImageUrl } from '../shared/utils/ranger'

interface CliOptions {
  dryRun: boolean
  force: boolean
  localDir?: string
  concurrency: number
  limit?: number
  sourceUrl: string
  imageOrigin: string
  help: boolean
}

function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    force: false,
    concurrency: 10,
    sourceUrl: process.env.SOURCE_API_URL || 'https://rangerbook.warmycat.com/res/Rangers_data.json',
    imageOrigin: process.env.IMAGE_ORIGIN || DEFAULT_RANGER_IMAGE_ORIGIN,
    help: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (!arg) continue

    if (arg === '--dry-run') {
      options.dryRun = true
    }
    else if (arg === '--force') {
      options.force = true
    }
    else if (arg === '--help' || arg === '-h') {
      options.help = true
    }
    else if (arg === '--local-dir' && args[i + 1]) {
      options.localDir = args[++i]
    }
    else if (arg === '--concurrency' && args[i + 1]) {
      const val = Number.parseInt(args[++i] || '', 10)
      if (!Number.isNaN(val) && val > 0) options.concurrency = val
    }
    else if (arg === '--limit' && args[i + 1]) {
      const val = Number.parseInt(args[++i] || '', 10)
      if (!Number.isNaN(val) && val > 0) options.limit = val
    }
    else if (arg === '--source' && args[i + 1]) {
      options.sourceUrl = args[++i] || options.sourceUrl
    }
    else if (arg === '--origin' && args[i + 1]) {
      options.imageOrigin = args[++i] || options.imageOrigin
    }
  }

  return options
}

function showHelp(): void {
  console.log(`
RangerX 圖片批次同步工具 (Sync Images to Cloudflare R2 / Local)

使用方式:
  bun run scripts/sync-images.ts [選項]
  just sync-images [選項]

選項:
  --dry-run              僅測試抓取與分析，不上傳至 R2
  --force                強制重新下載與上傳（即使 R2 或本機已存在）
  --local-dir <path>     將下載的圖片同時保存至本機目錄（例如 ./dist-images）
  --concurrency <num>    並發下載/上傳數量（預設 10）
  --limit <num>          限制處理的角色數量（用於測試）
  --source <url>         覆寫角色資料來源 JSON 網址
  --origin <url>         覆寫圖片來源基底網址（預設 https://res.warmycat.com）
  -h, --help             顯示說明

環境變數 (Cloudflare R2 上傳所需):
  R2_ACCOUNT_ID          Cloudflare Account ID
  R2_ACCESS_KEY_ID       R2 S3 Access Key ID
  R2_SECRET_ACCESS_KEY   R2 S3 Secret Access Key
  R2_BUCKET_NAME         R2 Bucket 名稱（預設: rangerx-images）
`)
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, retries = 3): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'RangerX-Image-Sync/1.0' },
        signal: AbortSignal.timeout(8000), // 8 秒超時，防止遠端掛起
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      const buffer = await response.arrayBuffer()
      return new Uint8Array(buffer)
    }
    catch (err) {
      if (attempt === retries) throw err
      await sleep(attempt * 400)
    }
  }
  throw new Error(`Failed to fetch ${url}`)
}

function getR2Client(): { client: S3Client; bucket: string } | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim().replace(/^["']|["']$/g, '')
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim().replace(/^["']|["']$/g, '')
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim().replace(/^["']|["']$/g, '')
  const bucket = (process.env.R2_BUCKET_NAME || 'rangerx-images').trim().replace(/^["']|["']$/g, '')

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  return { client, bucket }
}

async function checkR2ObjectExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }), {
      abortSignal: AbortSignal.timeout(8000),
    })
    return true
  }
  catch (error: unknown) {
    const s3Error = error as { name?: string; $metadata?: { httpStatusCode?: number } }
    if (s3Error.name === 'NotFound' || s3Error.$metadata?.httpStatusCode === 404) {
      return false
    }
    return false
  }
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2))

  if (options.help) {
    showHelp()
    return
  }

  console.log('🚀 RangerX 角色圖片批次同步工具啟動')
  console.log('----------------------------------------------------')
  console.log(`📡 資料來源 JSON:  ${options.sourceUrl}`)
  console.log(`🖼️  圖片來源 Origin: ${options.imageOrigin}`)
  console.log(`⚡ 並發處理數:      ${options.concurrency}`)
  if (options.limit) console.log(`🔢 限制處理筆數:    ${options.limit}`)
  if (options.localDir) console.log(`💾 本機儲存目錄:    ${options.localDir}`)
  if (options.dryRun) console.log(`🧪 模式:            Dry-run (僅測試，不上傳)`)
  if (options.force) console.log(`🔄 覆寫模式:        Force (強制重新處理)`)

  const r2 = getR2Client()
  if (!r2 && !options.dryRun && !options.localDir) {
    console.warn(`
⚠️  未偵測到完整的 Cloudflare R2 S3 憑證 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)。
👉  目前僅能執行 --dry-run 測試或 --local-dir 本機下載。
💡  若要上傳至 R2，請於 .env 設定 R2 憑證。
`)
    process.exit(1)
  }

  if (r2 && !options.dryRun) {
    console.log(`☁️  R2 Bucket:       ${r2.bucket}`)
  }
  console.log('----------------------------------------------------\n')

  // 1. 取得角色資料清單
  console.log('⏳ 正在抓取角色資料清單...')
  const sourceResponse = await fetch(options.sourceUrl, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  })
  if (!sourceResponse.ok) {
    throw new Error(`無法取得來源資料: HTTP ${sourceResponse.status}`)
  }

  const rawData = await sourceResponse.json() as Array<{ ranger_id?: string }>
  if (!Array.isArray(rawData)) {
    throw new Error('來源資料格式不正確，預期為陣列。')
  }

  const idSet = new Set<string>()
  for (const item of rawData) {
    if (typeof item?.ranger_id === 'string' && item.ranger_id.trim()) {
      idSet.add(item.ranger_id.trim())
    }
  }

  let rangerIds = Array.from(idSet)
  if (options.limit && options.limit > 0) {
    rangerIds = rangerIds.slice(0, options.limit)
  }

  console.log(`✅ 共解析出 ${rangerIds.length} 位角色待處理。\n`)

  const stats = {
    total: rangerIds.length,
    downloaded: 0,
    uploaded: 0,
    skipped: 0,
    savedLocal: 0,
    failed: 0,
  }

  const startTime = Date.now()
  let index = 0

  function renderProgress() {
    const processed = stats.uploaded + stats.skipped + stats.savedLocal + stats.failed + (options.dryRun ? stats.downloaded : 0)
    const pct = ((processed / stats.total) * 100).toFixed(1)
    process.stdout.write(`\r⏳ 進度: [${processed}/${stats.total}] (${pct}%) | ☁️ 已上傳: ${stats.uploaded} | ⏩ 已跳過: ${stats.skipped} | 📥 下載: ${stats.downloaded} | ❌ 失敗: ${stats.failed}`)
  }

  // 2. 建立並發執行 Worker Pool
  async function worker() {
    while (index < rangerIds.length) {
      const currentIndex = index++
      const rangerId = rangerIds[currentIndex]
      if (!rangerId) break

      const imagePath = getRangerImagePath(rangerId)
      // Remove leading slash for S3 key
      const s3Key = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
      const sourceImageUrl = getRangerImageUrl(rangerId, options.imageOrigin)

      try {
        let shouldDownload = options.force

        // 檢查 R2 是否已存在
        if (!options.force && r2 && !options.dryRun) {
          const exists = await checkR2ObjectExists(r2.client, r2.bucket, s3Key)
          if (exists) {
            stats.skipped++
            renderProgress()
            continue
          }
          shouldDownload = true
        }
        else if (!options.force && !options.localDir && options.dryRun) {
          shouldDownload = true
        }

        if (options.localDir && !options.force) {
          shouldDownload = true
        }

        if (!shouldDownload && !options.force) {
          stats.skipped++
          renderProgress()
          continue
        }

        // 下載圖片 (帶超時與重試)
        const imageBytes = await fetchWithRetry(sourceImageUrl)
        stats.downloaded++

        // 本機存檔 (若有指定 --local-dir)
        if (options.localDir) {
          const encodedId = encodeURIComponent(rangerId)
          const targetDir = join(options.localDir, encodedId)
          await mkdir(targetDir, { recursive: true })
          await writeFile(join(targetDir, `${encodedId}-thum.png`), imageBytes)
          stats.savedLocal++
        }

        // 上傳至 Cloudflare R2 (帶超時)
        if (r2 && !options.dryRun) {
          await r2.client.send(new PutObjectCommand({
            Bucket: r2.bucket,
            Key: s3Key,
            Body: imageBytes,
            ContentType: 'image/png',
            CacheControl: 'public, max-age=31536000, immutable',
          }), {
            abortSignal: AbortSignal.timeout(12000),
          })
          stats.uploaded++
        }

        renderProgress()
      }
      catch (error) {
        stats.failed++
        renderProgress()
        console.error(`\n❌ [${rangerId}] 處理失敗: ${(error as Error).message}`)
      }
    }
  }

  const workers = Array.from({ length: Math.min(options.concurrency, rangerIds.length) }, () => worker())
  await Promise.all(workers)

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log('\n\n====================================================')
  console.log('🎉 圖片同步任務完成！')
  console.log(`⏱️  總耗時:          ${durationSec} 秒`)
  console.log(`📊 總角色數:        ${stats.total}`)
  console.log(`📥 下載次數:        ${stats.downloaded}`)
  if (r2 && !options.dryRun) {
    console.log(`☁️  R2 成功上傳:     ${stats.uploaded}`)
    console.log(`⏩ R2 已存在跳過:   ${stats.skipped}`)
  }
  if (options.localDir) {
    console.log(`💾 本機儲存筆數:    ${stats.savedLocal}`)
  }
  if (stats.failed > 0) {
    console.log(`❌ 失敗筆數:        ${stats.failed}`)
  }
  console.log('====================================================\n')
}

main().catch((error) => {
  console.error('\n💥 批次同步發生未預期錯誤:', error)
  process.exit(1)
})
