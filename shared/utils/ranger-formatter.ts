import type {
  FormattedAbility,
  FormattedGrowthStatItem,
  FormattedRangerData,
  FormattedRateStatItem,
  FormattedSkill,
  FormattedSkillEffect,
  FormattedStatItem,
  FormattedTalent,
  FormattedTalentEffect,
  RangerSourceRecord,
} from '~~/shared/types/ranger'
import { getRangerImageUrl } from '~~/shared/utils/ranger'

function parseNum(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value.replaceAll(',', '').trim())
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function formatNum(value: unknown): string {
  return parseNum(value).toLocaleString()
}

function cleanStr(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanMultiline(value: unknown): string {
  return cleanStr(value).replaceAll('\\n', '\n')
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function formatSkill(skillRaw: unknown): FormattedSkill | null {
  const record = asRecord(skillRaw)
  if (!record) return null

  const name = cleanStr(record['技能名稱'])
  if (!name || name === '無') return null

  const effectsRaw = record['技能組']
  const effects: FormattedSkillEffect[] = Array.isArray(effectsRaw)
    ? effectsRaw.flatMap((item) => {
        const effectRecord = asRecord(item)
        if (!effectRecord) return []
        return [
          {
            effect: cleanStr(effectRecord['效果']),
            factor: cleanStr(effectRecord['係數']),
            duration: cleanStr(effectRecord['有效時間']),
            range: cleanStr(effectRecord['範圍']),
            isEventStage: effectRecord['適用於活動關卡'] === '是',
            isGuardian: effectRecord['適用於守護神'] === '是',
          },
        ]
      })
    : []

  return {
    name,
    description: cleanMultiline(record['技能敘述']),
    chance: cleanStr(record['發動機率']),
    trigger: cleanStr(record['觸發基準']),
    cooldown: cleanStr(record['技能冷卻時間']),
    icon: cleanStr(record.icon),
    effects,
  }
}

export function formatTalent(talentRaw: unknown): FormattedTalent | null {
  const root = asRecord(talentRaw)
  if (!root) return null

  const main = asRecord(root['主要才能'])
  if (!main) return null

  const description = cleanMultiline(main['敘述'])
  if (!description || description === '無') return null

  const effectListRaw = main['增益效果']
  const effects: FormattedTalentEffect[] = Array.isArray(effectListRaw)
    ? effectListRaw.flatMap((item) => {
        const effectRecord = asRecord(item)
        if (!effectRecord) return []
        return [
          {
            chance: cleanStr(effectRecord['觸發機率']),
            effect: cleanStr(effectRecord['效果']),
            category: cleanStr(effectRecord['效果搜尋分類']) || undefined,
          },
        ]
      })
    : []

  const enhancementsRaw = root['強化才能']
  const enhancements: string[] = Array.isArray(enhancementsRaw)
    ? enhancementsRaw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

  return {
    description,
    triggerChance: cleanStr(main['觸發機率']),
    condition: cleanMultiline(main['條件']),
    conditionCategory: cleanStr(main['條件搜尋分類']) || undefined,
    effects,
    enhancements,
  }
}

export function formatAbilities(raw: Record<string, unknown>): FormattedAbility[] {
  const abilities: FormattedAbility[] = []

  const ability1 = cleanStr(raw['能力1'])
  if (ability1 && ability1 !== '無') {
    abilities.push({
      name: ability1,
      code: cleanStr(raw.abilityCode),
      type: 'ability1',
      isAwakened: false,
    })
  }

  const ability2 = cleanStr(raw['能力2'])
  if (ability2 && ability2 !== '無') {
    abilities.push({
      name: ability2,
      code: cleanStr(raw.abilityCode2),
      type: 'ability2',
      isAwakened: false,
    })
  }

  const awakened = raw['覺醒能力']
  if (Array.isArray(awakened)) {
    for (const item of awakened) {
      const record = asRecord(item)
      if (record && typeof record['能力'] === 'string' && record['能力'].trim() && record['能力'] !== '無') {
        abilities.push({
          name: cleanStr(record['能力']),
          code: cleanStr(record.abilityCode),
          icon: cleanStr(record.icon) || undefined,
          type: 'awakened',
          isAwakened: true,
        })
      }
    }
  }

  return abilities
}

export function formatRangerRecord(raw: RangerSourceRecord, imageOrigin?: string): FormattedRangerData {
  const rangerId = cleanStr(raw.ranger_id)
  const name = cleanStr(raw.Ranger名稱)
  const description = cleanMultiline(raw['角色敘述'])
  const starRankRaw = cleanStr(raw['Ranger星數'])
  const starMatch = starRankRaw.match(/\d+/)
  const starCount = starMatch ? Number.parseInt(starMatch[0] ?? '0', 10) : 0
  const isUltimate = starRankRaw.includes('終極進化')
  const isHyper = starRankRaw.includes('超進化')
  const evolutionType: EvolutionType = isUltimate ? 1 : (isHyper ? 0 : null)

  const rangerType = cleanStr(raw['類型'])
  const attribute = cleanStr(raw['屬性'])
  const releasedAt = cleanStr(raw['登場時間']).replaceAll('/', '-')
  const respawnTime = cleanStr(raw['Ranger再生產時間'])
  const mineralCost = parseNum(raw['生產礦物費用'])
  const attackRange = parseNum(raw['攻擊範圍'])
  const splashRange = parseNum(raw['濺射範圍'])
  const isNft = raw['nft角色'] === '是'
  const isAdvent = raw['降臨關卡角色'] === '是'
  const imageUrl = getRangerImageUrl(rangerId, imageOrigin)

  const physicalAttack = parseNum(raw['物理攻擊力'])
  const magicAttack = parseNum(raw['魔法攻擊力'])
  const physicalDefense = parseNum(raw['物理防禦力'])
  const magicDefense = parseNum(raw['魔法防禦力'])
  const health = parseNum(raw['體力'])

  const critRate = cleanStr(raw['爆擊機率']) || '0.0%'
  const critDamage = cleanStr(raw['爆擊傷害']) || '100.0%'
  const hitRate = cleanStr(raw['命中率']) || '0.0%'
  const evasionRate = cleanStr(raw['閃避機率']) || '0.0%'
  const skillHitRate = cleanStr(raw['技能命中率']) || '0.0%'
  const skillEvasionRate = cleanStr(raw['技能閃避機率']) || '0.0%'
  const skillResist = cleanStr(raw['技能抗性']) || '0.0%'
  const attackSpeed = cleanStr(raw['攻擊速度']) || '—'
  const moveSpeed = cleanStr(raw['移動速度']) || '—'

  const hpIncreaseAmount = parseNum(raw.hpIncreaseAmount)
  const hpIncreaseAmountMax = parseNum(raw.hpIncreaseAmountMax)
  const attackIncreaseAmount = parseNum(raw.attackIncreaseAmount)
  const attackIncreaseAmountMax = parseNum(raw.attackIncreaseAmountMax)
  const specialAttackDelta = parseNum(raw.specialAttackDelta)
  const specialAttackDeltaMax = parseNum(raw.specialAttackDeltaMax)
  const generalDefenceDelta = parseNum(raw.generalDefenceDelta)
  const generalDefenceDeltaMax = parseNum(raw.generalDefenceDeltaMax)
  const specialDefenceDelta = parseNum(raw.specialDefenceDelta)
  const specialDefenceDeltaMax = parseNum(raw.specialDefenceDeltaMax)

  const primaryStats: FormattedStatItem[] = [
    { key: 'health', label: '體力', value: formatNum(health), raw: health },
    { key: 'physicalAttack', label: '物理攻擊', value: formatNum(physicalAttack), raw: physicalAttack },
    { key: 'magicAttack', label: '魔法攻擊', value: formatNum(magicAttack), raw: magicAttack },
    { key: 'physicalDefense', label: '物理防禦', value: formatNum(physicalDefense), raw: physicalDefense },
    { key: 'magicDefense', label: '魔法防禦', value: formatNum(magicDefense), raw: magicDefense },
    { key: 'attackRange', label: '攻擊範圍', value: formatNum(attackRange), raw: attackRange },
    { key: 'splashRange', label: '濺射範圍', value: formatNum(splashRange), raw: splashRange },
    { key: 'mineralCost', label: '生產礦物', value: formatNum(mineralCost), raw: mineralCost },
  ]

  const rateStats: FormattedRateStatItem[] = [
    { key: 'critRate', label: '爆擊機率', value: critRate },
    { key: 'critDamage', label: '爆擊傷害', value: critDamage },
    { key: 'hitRate', label: '命中率', value: hitRate },
    { key: 'evasionRate', label: '閃避機率', value: evasionRate },
    { key: 'skillHitRate', label: '技能命中率', value: skillHitRate },
    { key: 'skillEvasionRate', label: '技能閃避機率', value: skillEvasionRate },
    { key: 'skillResist', label: '技能抗性', value: skillResist },
  ]

  const growthStats: FormattedGrowthStatItem[] = [
    { key: 'hpIncreaseAmount', label: '體力增加', value: formatNum(hpIncreaseAmount), raw: hpIncreaseAmount },
    { key: 'hpIncreaseAmountMax', label: '體力增加（MAX）', value: formatNum(hpIncreaseAmountMax), raw: hpIncreaseAmountMax },
    { key: 'attackIncreaseAmount', label: '攻擊增加', value: formatNum(attackIncreaseAmount), raw: attackIncreaseAmount },
    { key: 'attackIncreaseAmountMax', label: '攻擊增加（MAX）', value: formatNum(attackIncreaseAmountMax), raw: attackIncreaseAmountMax },
    { key: 'specialAttackDelta', label: '魔攻增量', value: formatNum(specialAttackDelta), raw: specialAttackDelta },
    { key: 'specialAttackDeltaMax', label: '魔攻增量（MAX）', value: formatNum(specialAttackDeltaMax), raw: specialAttackDeltaMax },
    { key: 'generalDefenceDelta', label: '物防增量', value: formatNum(generalDefenceDelta), raw: generalDefenceDelta },
    { key: 'generalDefenceDeltaMax', label: '物防增量（MAX）', value: formatNum(generalDefenceDeltaMax), raw: generalDefenceDeltaMax },
    { key: 'specialDefenceDelta', label: '魔防增量', value: formatNum(specialDefenceDelta), raw: specialDefenceDelta },
    { key: 'specialDefenceDeltaMax', label: '魔防增量（MAX）', value: formatNum(specialDefenceDeltaMax), raw: specialDefenceDeltaMax },
  ]

  return {
    rangerId,
    name,
    description,
    releasedAt,
    starCount,
    evolutionType,
    isUltimate,
    isHyper,
    rangerType,
    attribute,
    respawnTime,
    mineralCost,
    attackRange,
    splashRange,
    isNft,
    isAdvent,
    imageUrl,
    attackSpeed,
    moveSpeed,
    primaryStats,
    rateStats,
    growthStats,
    skill1: formatSkill(raw['技能1']),
    skill2: formatSkill(raw['技能2']),
    abilities: formatAbilities(raw),
    talent: formatTalent(raw['才能']),
  }
}
