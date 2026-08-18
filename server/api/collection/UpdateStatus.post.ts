import { z } from 'zod'
import type { CollectionStats, UpdateCollectionResponse } from '~~/shared/types/ranger'
import { getDatabase } from '~~/server/utils/cloudflare'

const bodySchema = z.object({
  rangerId: z.string().trim().min(1).max(50),
  status: z.number().int().min(0).max(2),
})

interface StatsRow {
  total: number
  obtained: number
  checked: number
}

export default defineEventHandler(async (event): Promise<UpdateCollectionResponse> => {
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: '請求資料格式不正確。' })
  }

  const { rangerId, status } = parsed.data
  const database = getDatabase(event)

  if (status === 0) {
    await database.prepare(`
      DELETE FROM ranger_collection WHERE ranger_id = ?
    `).bind(rangerId).run()
  }
  else {
    await database.prepare(`
      INSERT INTO ranger_collection (ranger_id, status, updated_at)
      VALUES (?, ?, unixepoch())
      ON CONFLICT(ranger_id) DO UPDATE SET
        status = excluded.status,
        updated_at = unixepoch()
    `).bind(rangerId, status).run()
  }

  const statsRow = await database.prepare(`
    SELECT
      (SELECT COUNT(*) FROM rangers_formatted) AS total,
      (SELECT COUNT(*) FROM ranger_collection WHERE status = 1) AS obtained,
      (SELECT COUNT(*) FROM ranger_collection WHERE status = 2) AS checked
  `).first<StatsRow>()

  const total = statsRow?.total ?? 0
  const obtained = statsRow?.obtained ?? 0
  const checked = statsRow?.checked ?? 0
  const unobtained = Math.max(0, total - obtained - checked)
  const totalCollected = obtained + checked
  const obtainedPercentage = total > 0 ? Number(((totalCollected / total) * 100).toFixed(1)) : 0
  const checkedPercentage = total > 0 ? Number(((checked / total) * 100).toFixed(1)) : 0

  const stats: CollectionStats = {
    total,
    obtained,
    checked,
    unobtained,
    obtainedPercentage,
    checkedPercentage,
  }

  return {
    data: {
      rangerId,
      status,
      stats,
    },
  }
})
