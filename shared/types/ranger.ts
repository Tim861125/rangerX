export type RangerSort =
  | 'newest'
  | 'oldest'
  | 'health-desc'
  | 'physical-desc'
  | 'magic-desc'
  | 'cost-asc'
  | 'cost-desc'

export interface RangerSourceRecord extends Record<string, unknown> {
  ranger_id: string
  Ranger名稱: string
}

/**
 * 進化型態代碼：
 * - 1: 終極進化 (Ultimate)
 * - 0: 超進化 (Hyper)
 * - null: 一般 (Normal)
 */
export type EvolutionType = 1 | 0 | null

export interface FormattedSkillEffect {
  effect: string
  factor: string
  duration: string
  range: string
  isEventStage: boolean
  isGuardian: boolean
}

export interface FormattedSkill {
  name: string
  description: string
  chance: string
  trigger: string
  cooldown: string
  icon: string
  effects: FormattedSkillEffect[]
}

export interface FormattedAbility {
  name: string
  code: string
  icon?: string
  type: 'ability1' | 'ability2' | 'awakened'
  isAwakened: boolean
}

export interface FormattedTalentEffect {
  chance: string
  effect: string
  category?: string
}

export interface FormattedTalent {
  description: string
  triggerChance: string
  condition: string
  conditionCategory?: string
  effects: FormattedTalentEffect[]
  enhancements: string[]
}

export interface FormattedStatItem {
  key: string
  label: string
  value: string
  raw: number
}

export interface FormattedRateStatItem {
  key: string
  label: string
  value: string
}

export interface FormattedGrowthStatItem {
  key: string
  label: string
  value: string
  raw: number
}

export interface FormattedRangerData {
  rangerId: string
  name: string
  description: string
  releasedAt: string
  starCount: number
  evolutionType: EvolutionType
  isUltimate: boolean
  isHyper: boolean
  rangerType: string
  attribute: string
  respawnTime: string
  mineralCost: number
  attackRange: number
  splashRange: number
  isNft: boolean
  isAdvent: boolean
  imageUrl: string
  attackSpeed: string
  moveSpeed: string
  primaryStats: FormattedStatItem[]
  rateStats: FormattedRateStatItem[]
  growthStats: FormattedGrowthStatItem[]
  skill1: FormattedSkill | null
  skill2: FormattedSkill | null
  abilities: FormattedAbility[]
  talent: FormattedTalent | null
}

export interface RangerListItem {
  rangerId: string
  name: string
  description: string
  releasedAt: string
  starCount: number
  evolutionType: EvolutionType
  rangerType: string
  attribute: string
  respawnTime: string
  mineralCost: number
  attackRange: number
  physicalAttack: number
  magicAttack: number
  physicalDefense: number
  magicDefense: number
  health: number
  nft: boolean
  advent: boolean
  imageUrl: string
}

export interface RangerListResponse {
  data: RangerListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface RangerDetailResponse {
  data: FormattedRangerData & {
    databaseUpdatedAt: string
  }
}

export interface RangerFiltersResponse {
  data: {
    stars: string[]
    types: string[]
    attributes: string[]
  }
}

export type SyncState = 'never' | 'running' | 'success' | 'error'

export interface SyncStatus {
  status: SyncState
  sourceUrl: string
  startedAt: string | null
  completedAt: string | null
  fetchedCount: number
  insertedCount: number
  updatedCount: number
  deletedCount: number
  errorMessage: string | null
}

export interface SyncStatusResponse {
  data: SyncStatus
}

export interface SyncResult {
  fetchedCount: number
  insertedCount: number
  updatedCount: number
  deletedCount: number
  unchangedCount: number
  completedAt: string
}

export interface SyncResultResponse {
  data: SyncResult
}
