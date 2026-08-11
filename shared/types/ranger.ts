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

export interface RangerListItem {
  rangerId: string
  name: string
  description: string
  releasedAt: string
  starRank: string
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
  data: RangerSourceRecord & {
    imageUrl: string
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
