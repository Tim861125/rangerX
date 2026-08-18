import { describe, expect, it } from 'vitest'
import {
  formatSyncDateTime,
  isSyncRunningStale,
  parseSqliteUtcTimestamp,
} from '~~/shared/utils/sync-status'

describe('Sync Status Utilities', () => {
  it('parses sqlite UTC datetime and ISO timestamp correctly', () => {
    const sqliteUtc = '2026-08-18 06:57:28'
    const timestamp = parseSqliteUtcTimestamp(sqliteUtc)
    expect(timestamp).toBe(Date.parse('2026-08-18T06:57:28Z'))

    const isoUtc = '2026-08-18T00:48:33.454Z'
    expect(parseSqliteUtcTimestamp(isoUtc)).toBe(Date.parse(isoUtc))

    expect(parseSqliteUtcTimestamp(null)).toBe(0)
    expect(parseSqliteUtcTimestamp('')).toBe(0)
  })

  it('detects stale running status accurately', () => {
    const startedAt = '2026-08-18 06:57:28'
    const startedMs = Date.parse('2026-08-18T06:57:28Z')

    // 60 seconds after started -> not stale (timeout is 120s)
    expect(isSyncRunningStale('running', startedAt, 120, startedMs + 60 * 1000)).toBe(false)

    // 121 seconds after started -> is stale
    expect(isSyncRunningStale('running', startedAt, 120, startedMs + 121 * 1000)).toBe(true)

    // Not running state -> never stale
    expect(isSyncRunningStale('success', startedAt, 120, startedMs + 3600 * 1000)).toBe(false)
    expect(isSyncRunningStale('error', startedAt, 120, startedMs + 3600 * 1000)).toBe(false)

    // Running with missing/invalid startedAt -> stale
    expect(isSyncRunningStale('running', null)).toBe(true)
    expect(isSyncRunningStale('running', '')).toBe(true)
  })

  it('formats sync datetime nicely', () => {
    const dateStr = '2026-08-18 06:57:28'
    const formatted = formatSyncDateTime(dateStr)
    expect(formatted).toBeTruthy()
    expect(typeof formatted).toBe('string')
  })
})
