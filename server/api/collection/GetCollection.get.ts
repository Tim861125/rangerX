import type { CollectionDataResponse, CollectionStats } from '~~/shared/types/ranger'
import { getDatabase } from '~~/server/utils/cloudflare'

interface CollectionRow {
  ranger_id: string
  status: number
}

interface StatsRow {
  total: number
  obtained: number
  checked: number
}

export default defineEventHandler(async (event): Promise<CollectionDataResponse> => {
  const database = getDatabase(event)

  const statsStatement = database.prepare(`
    SELECT
      (SELECT COUNT(*) FROM rangers_formatted) AS total,
      (SELECT COUNT(*) FROM ranger_collection WHERE status = 1) AS obtained,
      (SELECT COUNT(*) FROM ranger_collection WHERE status = 2) AS checked
  `)

  const listStatement = database.prepare(`
    SELECT ranger_id, status
    FROM ranger_collection
    WHERE status > 0
  `)

  const [statsResult, listResult] = await Promise.all([
    statsStatement.first<StatsRow>(),
    listStatement.all<CollectionRow>(),
  ])

  const total = statsResult?.total ?? 0
  const obtained = statsResult?.obtained ?? 0
  const checked = statsResult?.checked ?? 0
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

  const statuses: Record<string, number> = {}
  for (const row of listResult.results) {
    statuses[row.ranger_id] = row.status
  }

  return {
    data: {
      statuses,
      stats,
    },
  }
})
