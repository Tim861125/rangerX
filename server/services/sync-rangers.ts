import type { H3Event } from 'h3'
import type { D1PreparedStatement } from '@cloudflare/workers-types'
import type { RangerSourceRecord, SyncResult } from '~~/shared/types/ranger'
import { getDatabase, getSourceUrl } from '~~/server/utils/cloudflare'
import { parseRangerSource, readLimitedJson } from '~~/server/utils/ranger-source'

interface ExistingRangerRow {
  ranger_id: string
  data_json: string
}

interface SerializedRanger {
  rangerId: string
  dataJson: string
  isNew: boolean
}

const UPSERT_ROWS_PER_QUERY = 50

function chunksOf<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function serializeChanges(
  incoming: RangerSourceRecord[],
  existing: Map<string, string>,
): SerializedRanger[] {
  const changed: SerializedRanger[] = []

  for (const ranger of incoming) {
    const dataJson = JSON.stringify(ranger)
    const previous = existing.get(ranger.ranger_id)
    if (previous !== dataJson) {
      changed.push({
        rangerId: ranger.ranger_id,
        dataJson,
        isNew: previous === undefined,
      })
    }
  }

  return changed
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : '未知的同步錯誤'
}

export async function syncRangers(event: H3Event): Promise<SyncResult> {
  const database = getDatabase(event)
  const sourceUrl = getSourceUrl(event)
  let lockAcquired = false

  try {
    const lock = await database.prepare(`
      UPDATE sync_status
      SET status = 'running',
          source_url = ?,
          started_at = datetime('now'),
          error_message = NULL
      WHERE id = 1
        AND (status != 'running' OR started_at < datetime('now', '-10 minutes'))
        AND (completed_at IS NULL OR datetime(completed_at) < datetime('now', '-15 seconds'))
    `).bind(sourceUrl).run()

    if (lock.meta.changes !== 1) {
      throw createError({
        statusCode: 409,
        message: '資料正在更新，或剛完成更新，請稍後再試。',
      })
    }
    lockAcquired = true

    const sourceResponse = await fetch(sourceUrl, {
      headers: { accept: 'application/json' },
    })
    if (!sourceResponse.ok) {
      throw new Error(`來源 API 回傳 HTTP ${sourceResponse.status}`)
    }

    const incoming = parseRangerSource(await readLimitedJson(sourceResponse))
    const existingResult = await database
      .prepare('SELECT ranger_id, data_json FROM rangers')
      .all<ExistingRangerRow>()
    const existing = new Map(
      existingResult.results.map(row => [row.ranger_id, row.data_json]),
    )
    const incomingIds = new Set(incoming.map(ranger => ranger.ranger_id))
    const staleIds = [...existing.keys()].filter(id => !incomingIds.has(id))
    const changed = serializeChanges(incoming, existing)
    const insertedCount = changed.filter(item => item.isNew).length
    const updatedCount = changed.length - insertedCount

    const statements: D1PreparedStatement[] = []
    for (const chunk of chunksOf(changed, UPSERT_ROWS_PER_QUERY)) {
      const placeholders = chunk.map(() => '(?, ?)').join(', ')
      const bindings = chunk.flatMap(item => [item.rangerId, item.dataJson])
      statements.push(database.prepare(`
        INSERT INTO rangers (ranger_id, data_json)
        VALUES ${placeholders}
        ON CONFLICT(ranger_id) DO UPDATE SET
          data_json = excluded.data_json,
          updated_at = unixepoch()
      `).bind(...bindings))
    }

    if (staleIds.length > 0) {
      statements.push(database.prepare(`
        DELETE FROM rangers
        WHERE ranger_id IN (SELECT value FROM json_each(?))
      `).bind(JSON.stringify(staleIds)))
    }

    if (statements.length > 47) {
      throw new Error('同步所需的 D1 查詢數超過單次 Worker 呼叫的安全上限。')
    }
    if (statements.length > 0) {
      await database.batch(statements)
    }

    const completedAt = new Date().toISOString()
    await database.prepare(`
      UPDATE sync_status
      SET status = 'success',
          completed_at = ?,
          fetched_count = ?,
          inserted_count = ?,
          updated_count = ?,
          deleted_count = ?,
          error_message = NULL
      WHERE id = 1
    `).bind(
      completedAt,
      incoming.length,
      insertedCount,
      updatedCount,
      staleIds.length,
    ).run()

    const result: SyncResult = {
      fetchedCount: incoming.length,
      insertedCount,
      updatedCount,
      deletedCount: staleIds.length,
      unchangedCount: incoming.length - changed.length,
      completedAt,
    }

    console.info(JSON.stringify({ event: 'rangers.sync.completed', ...result }))
    return result
  }
  catch (error) {
    if (lockAcquired) {
      const message = getErrorMessage(error)
      try {
        await database.prepare(`
          UPDATE sync_status
          SET status = 'error', completed_at = datetime('now'), error_message = ?
          WHERE id = 1
        `).bind(message).run()
      }
      catch (statusError) {
        console.error(JSON.stringify({
          event: 'rangers.sync.status_update_failed',
          error: getErrorMessage(statusError),
        }))
      }
      console.error(JSON.stringify({ event: 'rangers.sync.failed', error: message }))
    }
    throw error
  }
}
