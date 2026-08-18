import type { RangerSourceRecord } from '~~/shared/types/ranger'

export interface RawRangerInsertValues {
  ranger_id: string
  name: string
  description: string
  released_at_raw: string
  star_rank_raw: string
  ranger_type_raw: string
  attribute_raw: string
  respawn_time_raw: string
  mineral_cost_raw: number
  attack_range_raw: number
  splash_range_raw: number
  physical_attack_raw: number
  magic_attack_raw: number
  physical_defense_raw: number
  magic_defense_raw: number
  health_raw: number
  crit_rate_raw: string
  crit_damage_raw: string
  hit_rate_raw: string
  evasion_rate_raw: string
  skill_hit_rate_raw: string
  skill_evasion_rate_raw: string
  skill_resist_raw: string
  attack_speed_raw: string
  move_speed_raw: string
  hp_increase_raw: number
  attack_increase_raw: number
  special_attack_delta_raw: number
  general_defense_delta_raw: number
  special_defense_delta_raw: number
  hp_increase_max_raw: number
  attack_increase_max_raw: number
  special_attack_delta_max_raw: number
  general_defense_delta_max_raw: number
  special_defense_delta_max_raw: number
  skill1_raw: string
  skill2_raw: string
  ability1_raw: string
  ability1_code: string
  ability2_raw: string
  ability2_code: string
  awakened_abilities_raw: string
  is_nft_raw: string
  is_advent_raw: string
  talent_raw: string
}

function parseNum(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value.replaceAll(',', '').trim())
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function strOrJson(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function str(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

export function mapToRawRanger(record: RangerSourceRecord): RawRangerInsertValues {
  return {
    ranger_id: str(record.ranger_id),
    name: str(record.Ranger名稱),
    description: str(record['角色敘述']),
    released_at_raw: str(record['登場時間']),
    star_rank_raw: str(record['Ranger星數']),
    ranger_type_raw: str(record['類型']),
    attribute_raw: str(record['屬性']),
    respawn_time_raw: str(record['Ranger再生產時間']),
    mineral_cost_raw: parseNum(record['生產礦物費用']),
    attack_range_raw: parseNum(record['攻擊範圍']),
    splash_range_raw: parseNum(record['濺射範圍']),
    physical_attack_raw: parseNum(record['物理攻擊力']),
    magic_attack_raw: parseNum(record['魔法攻擊力']),
    physical_defense_raw: parseNum(record['物理防禦力']),
    magic_defense_raw: parseNum(record['魔法防禦力']),
    health_raw: parseNum(record['體力']),
    crit_rate_raw: str(record['爆擊機率']),
    crit_damage_raw: str(record['爆擊傷害']),
    hit_rate_raw: str(record['命中率']),
    evasion_rate_raw: str(record['閃避機率']),
    skill_hit_rate_raw: str(record['技能命中率']),
    skill_evasion_rate_raw: str(record['技能閃避機率']),
    skill_resist_raw: str(record['技能抗性']),
    attack_speed_raw: str(record['攻擊速度']),
    move_speed_raw: str(record['移動速度']),
    hp_increase_raw: parseNum(record.hpIncreaseAmount),
    attack_increase_raw: parseNum(record.attackIncreaseAmount),
    special_attack_delta_raw: parseNum(record.specialAttackDelta),
    general_defense_delta_raw: parseNum(record.generalDefenceDelta),
    special_defense_delta_raw: parseNum(record.specialDefenceDelta),
    hp_increase_max_raw: parseNum(record.hpIncreaseAmountMax),
    attack_increase_max_raw: parseNum(record.attackIncreaseAmountMax),
    special_attack_delta_max_raw: parseNum(record.specialAttackDeltaMax),
    general_defense_delta_max_raw: parseNum(record.generalDefenceDeltaMax),
    special_defense_delta_max_raw: parseNum(record.specialDefenceDeltaMax),
    skill1_raw: strOrJson(record['技能1']),
    skill2_raw: strOrJson(record['技能2']),
    ability1_raw: str(record['能力1']),
    ability1_code: str(record.abilityCode),
    ability2_raw: str(record['能力2']),
    ability2_code: str(record.abilityCode2),
    awakened_abilities_raw: strOrJson(record['覺醒能力']),
    is_nft_raw: str(record['nft角色']),
    is_advent_raw: str(record['降臨關卡角色']),
    talent_raw: strOrJson(record['才能']),
  }
}
