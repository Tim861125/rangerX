import { describe, expect, it } from 'vitest'
import type { CollectionStats } from '~~/shared/types/ranger'

describe('Collection Logic', () => {
  it('cycles through 3 status states correctly (0 -> 1 -> 2 -> 0)', () => {
    const cycle = (current: number) => (current + 1) % 3

    expect(cycle(0)).toBe(1) // 灰色 ➔ 亮起
    expect(cycle(1)).toBe(2) // 亮起 ➔ 打勾
    expect(cycle(2)).toBe(0) // 打勾 ➔ 灰色
  })

  it('calculates collection percentages accurately', () => {
    const calculateStats = (total: number, obtained: number, checked: number): CollectionStats => {
      const unobtained = Math.max(0, total - obtained - checked)
      const totalCollected = obtained + checked
      const obtainedPercentage = total > 0 ? Number(((totalCollected / total) * 100).toFixed(1)) : 0
      const checkedPercentage = total > 0 ? Number(((checked / total) * 100).toFixed(1)) : 0

      return {
        total,
        obtained,
        checked,
        unobtained,
        obtainedPercentage,
        checkedPercentage,
      }
    }

    const stats = calculateStats(100, 25, 15)
    expect(stats.total).toBe(100)
    expect(stats.obtained).toBe(25)
    expect(stats.checked).toBe(15)
    expect(stats.unobtained).toBe(60)
    expect(stats.obtainedPercentage).toBe(40.0) // 25 + 15 = 40%
    expect(stats.checkedPercentage).toBe(15.0) // 15%
  })
})
