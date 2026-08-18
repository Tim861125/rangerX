import type { SyncState, SyncStatusResponse } from '~~/shared/types/ranger'
import { getDatabase } from '~~/server/utils/cloudflare'
import { isSyncRunningStale } from '~~/shared/utils/sync-status'

interface SyncStatusRow {
  status: SyncState
  source_url: string
  started_at: string | null
  completed_at: string | null
  fetched_count: number
  inserted_count: number
  updated_count: number
  deleted_count: number
  error_message: string | null
}

export default defineEventHandler(async (event): Promise<SyncStatusResponse> => {
  const database = getDatabase(event)
  const row = await database
    .prepare(`
      SELECT status, source_url, started_at, completed_at, fetched_count,
             inserted_count, updated_count, deleted_count, error_message
      FROM sync_status WHERE id = 1
    `)
    .first<SyncStatusRow>()

  if (!row) {
    throw createError({ statusCode: 500, message: '找不到同步狀態資料。' })
  }

  // 偵測是否為殭屍鎖（例如伺服器重啟或異常中斷導致卡在 running 超過 2 分鐘）
  if (row.status === 'running' && isSyncRunningStale(row.status, row.started_at)) {
    const errorMessage = '同步逾時或伺服器異常中斷，已自動解除鎖定。'
    const completedAt = new Date().toISOString()

    await database
      .prepare(`
        UPDATE sync_status
        SET status = 'error',
            completed_at = ?,
            error_message = ?
        WHERE id = 1 AND status = 'running'
      `)
      .bind(completedAt, errorMessage)
      .run()

    return {
      data: {
        status: 'error',
        sourceUrl: row.source_url,
        startedAt: row.started_at,
        completedAt,
        fetchedCount: row.fetched_count,
        insertedCount: row.inserted_count,
        updatedCount: row.updated_count,
        deletedCount: row.deleted_count,
        errorMessage,
      },
    }
  }

  return {
    data: {
      status: row.status,
      sourceUrl: row.source_url,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      fetchedCount: row.fetched_count,
      insertedCount: row.inserted_count,
      updatedCount: row.updated_count,
      deletedCount: row.deleted_count,
      errorMessage: row.error_message,
    },
  }
})
