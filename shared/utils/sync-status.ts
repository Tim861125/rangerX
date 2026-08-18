import type { SyncState } from '~~/shared/types/ranger'

export const DEFAULT_SYNC_TIMEOUT_SECONDS = 120 // 2 minutes

/**
 * 解析 SQLite UTC 時間字串或 ISO 字串為毫秒 timestamp。
 */
export function parseSqliteUtcTimestamp(dateStr: string | null | undefined): number {
  if (!dateStr) return 0
  const trimmed = dateStr.trim()
  if (!trimmed) return 0

  if (trimmed.includes('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const time = new Date(trimmed).getTime()
    return Number.isNaN(time) ? 0 : time
  }

  const normalized = trimmed.includes('T') ? `${trimmed}Z` : `${trimmed.replace(' ', 'T')}Z`
  const time = new Date(normalized).getTime()
  return Number.isNaN(time) ? 0 : time
}

/**
 * 判斷當前同步狀態是否處於超時/殭屍鎖狀態。
 */
export function isSyncRunningStale(
  status: SyncState | undefined,
  startedAt: string | null | undefined,
  maxDurationSeconds = DEFAULT_SYNC_TIMEOUT_SECONDS,
  nowMs = Date.now(),
): boolean {
  if (status !== 'running') return false
  if (!startedAt) return true
  const startedMs = parseSqliteUtcTimestamp(startedAt)
  if (startedMs === 0) return true
  return (nowMs - startedMs) > maxDurationSeconds * 1000
}

/**
 * 格式化同步時間為繁體中文顯示。
 */
export function formatSyncDateTime(value: string | null | undefined): string {
  if (!value) return ''
  const timestamp = parseSqliteUtcTimestamp(value)
  if (timestamp === 0) return value

  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}
