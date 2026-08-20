import { describe, expect, it } from 'vitest'
import { computeRangerEvolutionGroups, getFormRank, parseRangerId } from '~~/shared/utils/ranger-formatter'

describe('ranger ID parsing and sorting helpers', () => {
  it('correctly parses ranger ID components', () => {
    expect(parseRangerId('u1617e-ka')).toEqual({ unitNo: 1617, suffix: 'e', slug: 'ka' })
    expect(parseRangerId('u1617h-ka')).toEqual({ unitNo: 1617, suffix: 'h', slug: 'ka' })
    expect(parseRangerId('u1617u-ka')).toEqual({ unitNo: 1617, suffix: 'u', slug: 'ka' })
    expect(parseRangerId('u1618e-ka')).toEqual({ unitNo: 1618, suffix: 'e', slug: 'ka' })
    expect(parseRangerId('u348e-asuka')).toEqual({ unitNo: 348, suffix: 'e', slug: 'asuka' })
    expect(parseRangerId('u9-leonard')).toEqual({ unitNo: 9, suffix: '', slug: 'leonard' })
    expect(parseRangerId('u018e-brown')).toEqual({ unitNo: 18, suffix: 'e', slug: 'brown' })
  })

  it('determines the form rank correctly for 1★ through 9★', () => {
    // 1-7 stars
    expect(getFormRank('e', null, 6)).toBe(60)
    expect(getFormRank('e', null, 7)).toBe(70)
    // 8-star forms
    expect(getFormRank('e', null, 8)).toBe(80)
    expect(getFormRank('h', 0, 8)).toBe(81)
    expect(getFormRank('u', 1, 8)).toBe(82)
    // 9-star form
    expect(getFormRank('e', null, 9)).toBe(90)
  })

  it('correctly computes evolution groups for 6★ through 9★ characters', () => {
    const rawUnits = [
      { rangerId: 'u348e-asuka', releasedAt: '2016-02-29', starCount: 6 },
      { rangerId: 'u349e-asuka', releasedAt: '2016-02-29', starCount: 7 },
      { rangerId: 'u350e-asuka', releasedAt: '2016-02-29', starCount: 8 },
      { rangerId: 'u350h-asuka', releasedAt: '2016-02-29', starCount: 8, evolutionType: 0 as const },
      { rangerId: 'u350u-asuka', releasedAt: '2016-02-29', starCount: 8, evolutionType: 1 as const },
      // Monster 8th units
      { rangerId: 'u1617e-ka', releasedAt: '2026-07-31', starCount: 8 },
      { rangerId: 'u1617h-ka', releasedAt: '2026-07-31', starCount: 8, evolutionType: 0 as const },
      { rangerId: 'u1617u-ka', releasedAt: '2026-07-31', starCount: 8, evolutionType: 1 as const },
      { rangerId: 'u1618e-ka', releasedAt: '2026-07-31', starCount: 9 },
    ]

    const groupMap = computeRangerEvolutionGroups(rawUnits)

    // Asuka family should all have groupNo: 348
    expect(groupMap.get('u348e-asuka')).toEqual({ unitNo: 348, groupNo: 348, formRank: 60 })
    expect(groupMap.get('u349e-asuka')).toEqual({ unitNo: 349, groupNo: 348, formRank: 70 })
    expect(groupMap.get('u350e-asuka')).toEqual({ unitNo: 350, groupNo: 348, formRank: 80 })
    expect(groupMap.get('u350h-asuka')).toEqual({ unitNo: 350, groupNo: 348, formRank: 81 })
    expect(groupMap.get('u350u-asuka')).toEqual({ unitNo: 350, groupNo: 348, formRank: 82 })

    // Kafka family should all have groupNo: 1617
    expect(groupMap.get('u1617e-ka')).toEqual({ unitNo: 1617, groupNo: 1617, formRank: 80 })
    expect(groupMap.get('u1617h-ka')).toEqual({ unitNo: 1617, groupNo: 1617, formRank: 81 })
    expect(groupMap.get('u1617u-ka')).toEqual({ unitNo: 1617, groupNo: 1617, formRank: 82 })
    expect(groupMap.get('u1618e-ka')).toEqual({ unitNo: 1618, groupNo: 1617, formRank: 90 })
  })

  it('sorts full 6★ -> 7★ -> 8★ -> 8★超 -> 8★終極 -> 9★ in ascending order within group', () => {
    const units = [
      { id: 'u350u-asuka', formRank: 82, name: '測試戰鬥服明日香' },
      { id: 'u348e-asuka', formRank: 60, name: '式波明日香' },
      { id: 'u350h-asuka', formRank: 81, name: '不孤獨的明日香' },
      { id: 'u349e-asuka', formRank: 70, name: '駕駛員明日香' },
      { id: 'u350e-asuka', formRank: 80, name: '最強駕駛員明日香' },
    ]

    const sorted = [...units].sort((a, b) => a.formRank - b.formRank)
    expect(sorted.map(u => u.id)).toEqual([
      'u348e-asuka', // 6★
      'u349e-asuka', // 7★
      'u350e-asuka', // 8★
      'u350h-asuka', // 8★ 超進化
      'u350u-asuka', // 8★ 終極進化
    ])
  })
})
