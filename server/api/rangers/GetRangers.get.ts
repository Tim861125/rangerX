import { z } from 'zod'
import type { EvolutionType, RangerListItem, RangerListResponse, RangerSort } from '~~/shared/types/ranger'
import { getRangerImageUrl } from '~~/shared/utils/ranger'
import { getDatabase } from '~~/server/utils/cloudflare'

interface FormattedListRow {
  ranger_id: string
  name: string
  description: string
  released_at: string
  star_count: number
  evolution_type: EvolutionType
  ranger_type: string
  attribute: string
  respawn_time: number
  mineral_cost: number
  attack_range: number
  physical_attack: number
  magic_attack: number
  physical_defense: number
  magic_defense: number
  health: number
  is_nft: number
  is_advent: number
}

const querySchema = z.object({
  q: z.string().trim().max(40).optional().default(''),
  star: z.string().trim().max(30).optional().default(''),
  type: z.string().trim().max(30).optional().default(''),
  attribute: z.string().trim().max(30).optional().default(''),
  status: z.enum(['all', '0', '1', '2', 'obtained']).optional().default('all'),
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
  pageSize: z.coerce.number().int().min(6).max(500).optional().default(200),
})

const SORT_SQL: Record<RangerSort, string> = {
  newest: 'rf.released_at DESC, rf.ranger_id DESC',
  oldest: 'rf.released_at ASC, rf.ranger_id ASC',
  'health-desc': 'rf.health DESC, rf.ranger_id ASC',
  'physical-desc': 'rf.physical_attack DESC, rf.ranger_id ASC',
  'magic-desc': 'rf.magic_attack DESC, rf.ranger_id ASC',
  'cost-asc': 'rf.mineral_cost ASC, rf.ranger_id ASC',
  'cost-desc': 'rf.mineral_cost DESC, rf.ranger_id ASC',
}

function escapeLike(value: string): string {
  return value.replaceAll('!', '!!').replaceAll('%', '!%').replaceAll('_', '!_')
}

function mapRanger(row: FormattedListRow, imageOrigin?: string): RangerListItem {
  return {
    rangerId: row.ranger_id,
    name: row.name,
    description: row.description,
    releasedAt: row.released_at,
    starCount: row.star_count,
    evolutionType: row.evolution_type,
    rangerType: row.ranger_type,
    attribute: row.attribute,
    respawnTime: `${row.respawn_time.toFixed(1)}秒`,
    mineralCost: row.mineral_cost,
    attackRange: row.attack_range,
    physicalAttack: row.physical_attack,
    magicAttack: row.magic_attack,
    physicalDefense: row.physical_defense,
    magicDefense: row.magic_defense,
    health: row.health,
    nft: row.is_nft === 1,
    advent: row.is_advent === 1,
    imageUrl: getRangerImageUrl(row.ranger_id, imageOrigin),
  }
}

export default defineEventHandler(async (event): Promise<RangerListResponse> => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: '查詢條件格式不正確。' })
  }

  const query = parsed.data
  const conditions: string[] = []
  const bindings: (string | number)[] = []

  if (query.q) {
    const pattern = `%${escapeLike(query.q)}%`
    if (new TextEncoder().encode(pattern).byteLength > 50) {
      throw createError({ statusCode: 400, message: '搜尋文字過長，請縮短關鍵字。' })
    }
    conditions.push(`(
      rf.name LIKE ? ESCAPE '!'
      OR rf.ranger_id LIKE ? ESCAPE '!'
      OR rf.description LIKE ? ESCAPE '!'
    )`)
    bindings.push(pattern, pattern, pattern)
  }
  if (query.star) {
    if (query.star === '終極進化' || query.star === '1') {
      conditions.push('rf.evolution_type = 1')
    }
    else if (query.star === '超進化' || query.star === '0') {
      conditions.push('rf.evolution_type = 0')
    }
    else {
      const match = query.star.match(/\d+/)
      if (match) {
        conditions.push('rf.star_count = ?')
        bindings.push(Number.parseInt(match[0], 10))
      }
    }
  }
  if (query.type) {
    conditions.push('rf.ranger_type = ?')
    bindings.push(query.type)
  }
  if (query.attribute) {
    conditions.push('rf.attribute = ?')
    bindings.push(query.attribute)
  }
  if (query.status && query.status !== 'all') {
    if (query.status === '0') {
      conditions.push('(c.status IS NULL OR c.status = 0)')
    }
    else if (query.status === '1') {
      conditions.push('c.status = 1')
    }
    else if (query.status === '2') {
      conditions.push('c.status = 2')
    }
    else if (query.status === 'obtained') {
      conditions.push('c.status IN (1, 2)')
    }
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (query.page - 1) * query.pageSize
  const database = getDatabase(event)
  const countStatement = database
    .prepare(`
      SELECT COUNT(*) AS total
      FROM rangers_formatted rf
      LEFT JOIN ranger_collection c ON rf.ranger_id = c.ranger_id
      ${whereSql}
    `)
    .bind(...bindings)
  const listStatement = database.prepare(`
    SELECT
      rf.ranger_id, rf.name, rf.description, rf.released_at, rf.star_count, rf.evolution_type,
      rf.ranger_type, rf.attribute, rf.respawn_time, rf.mineral_cost, rf.attack_range,
      rf.physical_attack, rf.magic_attack, rf.physical_defense, rf.magic_defense,
      rf.health, rf.is_nft, rf.is_advent
    FROM rangers_formatted rf
    LEFT JOIN ranger_collection c ON rf.ranger_id = c.ranger_id
    ${whereSql}
    ORDER BY ${SORT_SQL[query.sort]}
    LIMIT ? OFFSET ?
  `).bind(...bindings, query.pageSize, offset)

  const [total, result] = await Promise.all([
    countStatement.first<number>('total'),
    listStatement.all<FormattedListRow>(),
  ])
  const totalCount = total ?? 0

  const imageOrigin = useRuntimeConfig(event).public?.imageOrigin as string | undefined

  return {
    data: result.results.map(row => mapRanger(row, imageOrigin)),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: totalCount,
      totalPages: Math.ceil(totalCount / query.pageSize),
    },
  }
})
