import type { RangerDetailResponse } from '~~/shared/types/ranger'
import { getRangerImageUrl } from '~~/shared/utils/ranger'
import { getDatabase } from '~~/server/utils/cloudflare'
import { isRangerSourceRecord } from '~~/server/utils/ranger-source'

interface RangerDetailRow {
  data_json: string
  updated_at: number
}

const RANGER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/

export default defineEventHandler(async (event): Promise<RangerDetailResponse> => {
  const rangerId = getRouterParam(event, 'id') ?? ''
  if (!RANGER_ID_PATTERN.test(rangerId)) {
    throw createError({ statusCode: 400, message: 'Ranger ID 格式不正確。' })
  }

  const row = await getDatabase(event)
    .prepare('SELECT data_json, updated_at FROM rangers WHERE ranger_id = ?')
    .bind(rangerId)
    .first<RangerDetailRow>()

  if (!row) {
    throw createError({ statusCode: 404, message: '找不到這位 Ranger。' })
  }

  const record = JSON.parse(row.data_json) as unknown
  if (!isRangerSourceRecord(record)) {
    throw createError({ statusCode: 500, message: '資料庫中的 Ranger 資料格式不正確。' })
  }

  return {
    data: {
      ...record,
      imageUrl: getRangerImageUrl(rangerId),
      databaseUpdatedAt: new Date(row.updated_at * 1000).toISOString(),
    },
  }
})
