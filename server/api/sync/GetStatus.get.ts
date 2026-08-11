import type { SyncState, SyncStatusResponse } from '~~/shared/types/ranger'
import { getDatabase } from '~~/server/utils/cloudflare'

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
  const row = await getDatabase(event)
    .prepare(`
      SELECT status, source_url, started_at, completed_at, fetched_count,
             inserted_count, updated_count, deleted_count, error_message
      FROM sync_status WHERE id = 1
    `)
    .first<SyncStatusRow>()

  if (!row) {
    throw createError({ statusCode: 500, message: '找不到同步狀態資料。' })
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
