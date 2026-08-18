import type {
  EvolutionType,
  FormattedAbility,
  FormattedGrowthStatItem,
  FormattedRangerData,
  FormattedRateStatItem,
  FormattedSkill,
  FormattedStatItem,
  FormattedTalent,
  RangerDetailResponse,
} from '~~/shared/types/ranger'
import { getDatabase } from '~~/server/utils/cloudflare'
import { getRangerImageUrl } from '~~/shared/utils/ranger'

interface FormattedDetailRow {
  ranger_id: string
  name: string
  description: string
  released_at: string
  star_count: number
  evolution_type: EvolutionType
  is_ultimate: number
  is_hyper: number
  ranger_type: string
  attribute: string
  respawn_time: number
  mineral_cost: number
  attack_range: number
  splash_range: number
  attack_speed: string
  move_speed: string
  is_nft: number
  is_advent: number
  primary_stats_json: string
  rate_stats_json: string
  growth_stats_json: string
  skill1_json: string | null
  skill2_json: string | null
  abilities_json: string
  talent_json: string | null
  updated_at: number
}

const RANGER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/

function safeParse<T>(jsonStr: string | null, defaultValue: T): T {
  if (!jsonStr) return defaultValue
  try {
    return JSON.parse(jsonStr) as T
  }
  catch {
    return defaultValue
  }
}

export default defineEventHandler(async (event): Promise<RangerDetailResponse> => {
  const rangerId = getRouterParam(event, 'id') ?? ''
  if (!RANGER_ID_PATTERN.test(rangerId)) {
    throw createError({ statusCode: 400, message: 'Ranger ID 格式不正確。' })
  }

  const row = await getDatabase(event)
    .prepare(`
      SELECT
        ranger_id, name, description, released_at, star_count, evolution_type,
        is_ultimate, is_hyper, ranger_type, attribute, respawn_time, mineral_cost,
        attack_range, splash_range, attack_speed, move_speed, is_nft, is_advent,
        primary_stats_json, rate_stats_json, growth_stats_json,
        skill1_json, skill2_json, abilities_json, talent_json, updated_at
      FROM rangers_formatted
      WHERE ranger_id = ?
    `)
    .bind(rangerId)
    .first<FormattedDetailRow>()

  if (!row) {
    throw createError({ statusCode: 404, message: '找不到這位 Ranger。' })
  }

  const formattedData: FormattedRangerData = {
    rangerId: row.ranger_id,
    name: row.name,
    description: row.description,
    releasedAt: row.released_at,
    starCount: row.star_count,
    evolutionType: row.evolution_type,
    isUltimate: row.is_ultimate === 1,
    isHyper: row.is_hyper === 1,
    rangerType: row.ranger_type,
    attribute: row.attribute,
    respawnTime: `${row.respawn_time.toFixed(1)}秒`,
    mineralCost: row.mineral_cost,
    attackRange: row.attack_range,
    splashRange: row.splash_range,
    isNft: row.is_nft === 1,
    isAdvent: row.is_advent === 1,
    imageUrl: getRangerImageUrl(row.ranger_id, useRuntimeConfig(event).public?.imageOrigin as string | undefined),
    attackSpeed: row.attack_speed,
    moveSpeed: row.move_speed,
    primaryStats: safeParse<FormattedStatItem[]>(row.primary_stats_json, []),
    rateStats: safeParse<FormattedRateStatItem[]>(row.rate_stats_json, []),
    growthStats: safeParse<FormattedGrowthStatItem[]>(row.growth_stats_json, []),
    skill1: safeParse<FormattedSkill | null>(row.skill1_json, null),
    skill2: safeParse<FormattedSkill | null>(row.skill2_json, null),
    abilities: safeParse<FormattedAbility[]>(row.abilities_json, []),
    talent: safeParse<FormattedTalent | null>(row.talent_json, null),
  }

  return {
    data: {
      ...formattedData,
      databaseUpdatedAt: new Date(row.updated_at * 1000).toISOString(),
    },
  }
})
