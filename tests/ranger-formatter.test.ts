import { describe, expect, it } from 'vitest'
import type { RangerSourceRecord } from '~~/shared/types/ranger'
import { formatAbilities, formatRangerRecord, formatSkill, formatTalent } from '~~/shared/utils/ranger-formatter'

describe('formatSkill', () => {
  it('returns null for "無" or non-object values', () => {
    expect(formatSkill('無')).toBeNull()
    expect(formatSkill(null)).toBeNull()
    expect(formatSkill(undefined)).toBeNull()
    expect(formatSkill({ 技能名稱: '無' })).toBeNull()
  })

  it('formats skill object correctly with multiline descriptions and effects', () => {
    const rawSkill = {
      技能名稱: '盾牌',
      發動機率: '32.0%',
      觸發基準: '自身',
      技能冷卻時間: '8.0秒',
      技能組: [
        {
          效果: '無敵',
          係數: '-',
          有效時間: '7.0秒',
          範圍: '0點',
          適用於活動關卡: '是',
          適用於守護神: '是',
        },
      ],
      icon: 'skill_icon_shield.png',
      技能敘述: '施放魔法在自身周圍形成防護罩。\\n\\n* 維持時間(7秒)',
    }

    const formatted = formatSkill(rawSkill)
    expect(formatted).not.toBeNull()
    expect(formatted?.name).toBe('盾牌')
    expect(formatted?.chance).toBe('32.0%')
    expect(formatted?.trigger).toBe('自身')
    expect(formatted?.cooldown).toBe('8.0秒')
    expect(formatted?.description).toBe('施放魔法在自身周圍形成防護罩。\n\n* 維持時間(7秒)')
    expect(formatted?.icon).toBe('skill_icon_shield.png')
    expect(formatted?.effects).toEqual([
      {
        effect: '無敵',
        factor: '-',
        duration: '7.0秒',
        range: '0點',
        isEventStage: true,
        isGuardian: true,
      },
    ])
  })
})

describe('formatAbilities', () => {
  it('formats abilities and awakened abilities correctly', () => {
    const rawRecord: Record<string, unknown> = {
      能力1: '最後的攻擊',
      abilityCode: 'ab213_lastatk',
      能力2: '妨礙敵人生產',
      abilityCode2: 'ab207_unitdisturb',
      覺醒能力: [
        {
          能力: '誘惑抗性',
          abilityCode: 'aab221_aTempt',
          icon: 'ab221_atempt_icon.png',
        },
      ],
    }

    const abilities = formatAbilities(rawRecord)
    expect(abilities).toHaveLength(3)
    expect(abilities[0]).toEqual({
      name: '最後的攻擊',
      code: 'ab213_lastatk',
      type: 'ability1',
      isAwakened: false,
    })
    expect(abilities[1]).toEqual({
      name: '妨礙敵人生產',
      code: 'ab207_unitdisturb',
      type: 'ability2',
      isAwakened: false,
    })
    expect(abilities[2]).toEqual({
      name: '誘惑抗性',
      code: 'aab221_aTempt',
      icon: 'ab221_atempt_icon.png',
      type: 'awakened',
      isAwakened: true,
    })
  })

  it('filters out "無" abilities', () => {
    const rawRecord: Record<string, unknown> = {
      能力1: '無',
      abilityCode: '',
      能力2: '無',
      abilityCode2: '',
      覺醒能力: '無',
    }

    expect(formatAbilities(rawRecord)).toEqual([])
  })
})

describe('formatTalent', () => {
  it('returns null for "無" or missing talent', () => {
    expect(formatTalent('無')).toBeNull()
    expect(formatTalent(null)).toBeNull()
  })

  it('formats complex talent structures with enhancements and effects', () => {
    const rawTalent = {
      主要才能: {
        敘述: '受到敵人的技能攻擊時獲得效果。\\n*體力+600%',
        觸發機率: '35.0%',
        條件: '受到站位1.0%以外攻擊',
        條件搜尋分類: '站位分類',
        增益效果: [
          {
            觸發機率: '100%',
            效果: '體力提升600%',
            效果搜尋分類: '體力提升',
          },
        ],
      },
      強化才能: ['技能發動率+20.0%', '體力+300.0%'],
    }

    const formatted = formatTalent(rawTalent)
    expect(formatted).not.toBeNull()
    expect(formatted?.description).toBe('受到敵人的技能攻擊時獲得效果。\n*體力+600%')
    expect(formatted?.triggerChance).toBe('35.0%')
    expect(formatted?.condition).toBe('受到站位1.0%以外攻擊')
    expect(formatted?.conditionCategory).toBe('站位分類')
    expect(formatted?.effects).toEqual([
      {
        chance: '100%',
        effect: '體力提升600%',
        category: '體力提升',
      },
    ])
    expect(formatted?.enhancements).toEqual(['技能發動率+20.0%', '體力+300.0%'])
  })
})

describe('formatRangerRecord', () => {
  it('formats complete ranger record with precalculated display lists and numbers', () => {
    const raw: RangerSourceRecord = {
      ranger_id: 'u1342e-bd',
      Ranger名稱: '釋迦',
      角色敘述: '力抗命運\\n悟道',
      登場時間: '2023/09/26',
      Ranger星數: '8星',
      類型: '智慧型',
      屬性: '水',
      Ranger再生產時間: '18.0秒',
      生產礦物費用: 1070,
      攻擊範圍: 220,
      物理攻擊力: 4070,
      魔法攻擊力: 36600,
      物理防禦力: 0,
      魔法防禦力: 700,
      體力: 101100,
      濺射範圍: 150,
      爆擊機率: '0.0%',
      爆擊傷害: '100.0%',
      命中率: '10.0%',
      閃避機率: '0.0%',
      技能命中率: '10.0%',
      技能閃避機率: '0.0%',
      技能抗性: '20.0%',
      攻擊速度: '普通(2.47秒/下)',
      移動速度: '普通(87點/秒)',
      hpIncreaseAmount: 12640,
      attackIncreaseAmount: 590,
      specialAttackDelta: 3660,
      generalDefenceDelta: 0,
      specialDefenceDelta: 80,
      hpIncreaseAmountMax: 16440,
      attackIncreaseAmountMax: 770,
      specialAttackDeltaMax: 4760,
      generalDefenceDeltaMax: 0,
      specialDefenceDeltaMax: 110,
      技能1: '無',
      技能2: '無',
      能力1: '無',
      abilityCode: '',
      能力2: '無',
      abilityCode2: '',
      覺醒能力: '無',
      nft角色: '否',
      降臨關卡角色: '否',
      才能: '無',
    }

    const formatted = formatRangerRecord(raw)
    expect(formatted.rangerId).toBe('u1342e-bd')
    expect(formatted.name).toBe('釋迦')
    expect(formatted.description).toBe('力抗命運\n悟道')
    expect(formatted.releasedAt).toBe('2023-09-26')
    expect(formatted.starCount).toBe(8)
    expect(formatted.evolutionType).toBeNull()
    expect(formatted.isUltimate).toBe(false)
    expect(formatted.isHyper).toBe(false)
    expect(formatted.attribute).toBe('水')
    expect(formatted.rangerType).toBe('智慧型')
    expect(formatted.imageUrl).toBe('https://res.warmycat.com/u1342e-bd/u1342e-bd-thum.png')
    expect(formatted.isNft).toBe(false)
    expect(formatted.isAdvent).toBe(false)

    // Primary stats
    expect(formatted.primaryStats).toContainEqual({
      key: 'health',
      label: '體力',
      value: '101,100',
      raw: 101100,
    })
    expect(formatted.primaryStats).toContainEqual({
      key: 'mineralCost',
      label: '生產礦物',
      value: '1,070',
      raw: 1070,
    })

    // Growth stats
    expect(formatted.growthStats).toContainEqual({
      key: 'hpIncreaseAmount',
      label: '體力增加',
      value: '12,640',
      raw: 12640,
    })
  })

  it('correctly calculates evolutionType for ultimate and hyper evolutions', () => {
    const smallStarRanger = formatRangerRecord({
      ranger_id: 'u002e-bella',
      Ranger名稱: '大廚貝拉',
      'Ranger星數': '3星',
    })
    expect(smallStarRanger.starCount).toBe(3)
    expect(smallStarRanger.evolutionType).toBeNull()

    const ultimateRanger = formatRangerRecord({
      ranger_id: 'u1342u-bd',
      Ranger名稱: '天界最自由的男子 釋迦',
      'Ranger星數': '終極進化8星',
    })
    expect(ultimateRanger.starCount).toBe(8)
    expect(ultimateRanger.evolutionType).toBe(1)
    expect(ultimateRanger.isUltimate).toBe(true)

    const hyperRanger = formatRangerRecord({
      ranger_id: 'u1342h-bd',
      Ranger名稱: '史上最強的青春期 釋迦',
      'Ranger星數': '超進化8星',
    })
    expect(hyperRanger.starCount).toBe(8)
    expect(hyperRanger.evolutionType).toBe(0)
    expect(hyperRanger.isHyper).toBe(true)
  })
})
