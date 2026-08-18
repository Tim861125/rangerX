import { describe, expect, it } from 'vitest'
import type { RangerSourceRecord } from '~~/shared/types/ranger'
import { mapToRawRanger } from '~~/server/utils/ranger-raw-mapper'

describe('mapToRawRanger', () => {
  it('maps raw record accurately to flattened structure', () => {
    const raw: RangerSourceRecord = {
      ranger_id: 'u001e-bella',
      Ranger名稱: '泰山貝拉',
      角色敘述: '自由人',
      登場時間: '2016/01/18',
      Ranger星數: '2星',
      類型: '力量型',
      屬性: '無',
      Ranger再生產時間: '14.0秒',
      生產礦物費用: 240,
      攻擊範圍: 70,
      濺射範圍: 0,
      物理攻擊力: 240,
      魔法攻擊力: 0,
      物理防禦力: 101,
      魔法防禦力: 158,
      體力: 1776,
      爆擊機率: '0.0%',
      爆擊傷害: '100.0%',
      命中率: '0.0%',
      閃避機率: '0.0%',
      技能命中率: '0.0%',
      技能閃避機率: '0.0%',
      技能抗性: '0.0%',
      攻擊速度: '普通(2.5秒/下)',
      移動速度: '慢(70點/秒)',
      hpIncreaseAmount: 222,
      attackIncreaseAmount: 30,
      specialAttackDelta: 0,
      generalDefenceDelta: 13,
      specialDefenceDelta: 20,
      hpIncreaseAmountMax: 222,
      attackIncreaseAmountMax: 30,
      specialAttackDeltaMax: 0,
      generalDefenceDeltaMax: 13,
      specialDefenceDeltaMax: 20,
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

    const mapped = mapToRawRanger(raw)
    expect(mapped.ranger_id).toBe('u001e-bella')
    expect(mapped.name).toBe('泰山貝拉')
    expect(mapped.description).toBe('自由人')
    expect(mapped.star_rank_raw).toBe('2星')
    expect(mapped.mineral_cost_raw).toBe(240)
    expect(mapped.skill1_raw).toBe('無')
    expect(mapped.talent_raw).toBe('無')
  })
})
