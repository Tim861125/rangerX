import { z } from 'zod'
import type { RangerListItem, RangerListResponse, RangerSort } from '~~/shared/types/ranger'
import { getRangerImageUrl } from '~~/shared/utils/ranger'
import { getDatabase } from '~~/server/utils/cloudflare'

interface RangerListRow {
  ranger_id: string
  name: string
  description: string
  released_at: string
  star_rank: string
  ranger_type: string
  attribute: string
  respawn_time: string
  mineral_cost: number
  attack_range: number
  physical_attack: number
  magic_attack: number
  physical_defense: number
  magic_defense: number
  health: number
  nft: string
  advent: string
}

const querySchema = z.object({
  q: z.string().trim().max(40).optional().default(''),
  star: z.string().trim().max(30).optional().default(''),
  type: z.string().trim().max(30).optional().default(''),
  attribute: z.string().trim().max(30).optional().default(''),
  sort: z.enum([
    'newest',
    'oldest',
    'health-desc',
    'physical-desc',
    'magic-desc',
    'cost-asc',
    'cost-desc',
  ]).optional().default('newest'),
  page: z.coerce.number().int().min(1).max(500).optional().default(1),
  pageSize: z.coerce.number().int().min(6).max(48).optional().default(18),
})

const SORT_SQL: Record<RangerSort, string> = {
  newest: 'released_at DESC, ranger_id DESC',
  oldest: 'released_at ASC, ranger_id ASC',
  'health-desc': 'health DESC, ranger_id ASC',
  'physical-desc': 'physical_attack DESC, ranger_id ASC',
  'magic-desc': 'magic_attack DESC, ranger_id ASC',
  'cost-asc': 'mineral_cost ASC, ranger_id ASC',
  'cost-desc': 'mineral_cost DESC, ranger_id ASC',
}

function escapeLike(value: string): string {
  return value.replaceAll('!', '!!').replaceAll('%', '!%').replaceAll('_', '!_')
}

function mapRanger(row: RangerListRow): RangerListItem {
  return {
    rangerId: row.ranger_id,
    name: row.name,
    description: row.description,
    releasedAt: row.released_at,
    starRank: row.star_rank,
    rangerType: row.ranger_type,
    attribute: row.attribute,
    respawnTime: row.respawn_time,
    mineralCost: row.mineral_cost,
    attackRange: row.attack_range,
    physicalAttack: row.physical_attack,
    magicAttack: row.magic_attack,
    physicalDefense: row.physical_defense,
    magicDefense: row.magic_defense,
    health: row.health,
    nft: row.nft === '是',
    advent: row.advent === '是',
    imageUrl: getRangerImageUrl(row.ranger_id),
  }
}

export default defineEventHandler(async (event): Promise<RangerListResponse> => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: '查詢條件格式不正確。' })
  }

  const query = parsed.data
  const conditions: string[] = []
  const bindings: string[] = []

  if (query.q) {
    const pattern = `%${escapeLike(query.q)}%`
    if (new TextEncoder().encode(pattern).byteLength > 50) {
      throw createError({ statusCode: 400, message: '搜尋文字過長，請縮短關鍵字。' })
    }
    conditions.push(`(
      name LIKE ? ESCAPE '!'
      OR ranger_id LIKE ? ESCAPE '!'
      OR description LIKE ? ESCAPE '!'
      OR data_json LIKE ? ESCAPE '!'
    )`)
    bindings.push(pattern, pattern, pattern, pattern)
  }
  if (query.star) {
    conditions.push('star_rank = ?')
    bindings.push(query.star)
  }
  if (query.type) {
    conditions.push('ranger_type = ?')
    bindings.push(query.type)
  }
  if (query.attribute) {
    conditions.push('attribute = ?')
    bindings.push(query.attribute)
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (query.page - 1) * query.pageSize
  const database = getDatabase(event)
  const countStatement = database
    .prepare(`SELECT COUNT(*) AS total FROM rangers ${whereSql}`)
    .bind(...bindings)
  const listStatement = database.prepare(`
    SELECT
      ranger_id, name, description, released_at, star_rank, ranger_type,
      attribute, respawn_time, mineral_cost, attack_range, physical_attack,
      magic_attack, physical_defense, magic_defense, health, nft, advent
    FROM rangers
    ${whereSql}
    ORDER BY ${SORT_SQL[query.sort]}
    LIMIT ? OFFSET ?
  `).bind(...bindings, query.pageSize, offset)

  const [total, result] = await Promise.all([
    countStatement.first<number>('total'),
    listStatement.all<RangerListRow>(),
  ])
  const totalCount = total ?? 0

  return {
    data: result.results.map(mapRanger),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: totalCount,
      totalPages: Math.ceil(totalCount / query.pageSize),
    },
  }
})
