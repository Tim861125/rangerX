import { describe, expect, it } from 'vitest'
import { getRangerImageUrl } from '~~/shared/utils/ranger'
import { parseRangerSource, readLimitedJson } from '~~/server/utils/ranger-source'

describe('Ranger source validation', () => {
  it('accepts mixed nested skill structures', () => {
    const records = parseRangerSource([
      { ranger_id: 'u001e-bella', Ranger名稱: '泰山貝拉', 技能1: '無' },
      { ranger_id: 'u1617e-ka', Ranger名稱: '日比野卡夫卡', 技能1: { 技能名稱: '變身' } },
    ])

    expect(records).toHaveLength(2)
    expect(records[1]?.ranger_id).toBe('u1617e-ka')
  })

  it('rejects duplicate and unsafe ids', () => {
    expect(() => parseRangerSource([
      { ranger_id: 'same-id', Ranger名稱: 'A' },
      { ranger_id: 'same-id', Ranger名稱: 'B' },
    ])).toThrow('重複')

    expect(() => parseRangerSource([
      { ranger_id: "bad'id", Ranger名稱: 'A' },
    ])).toThrow('缺少有效')
  })

  it('reads a bounded JSON response', async () => {
    const response = new Response(JSON.stringify([
      { ranger_id: 'u001e-bella', Ranger名稱: '泰山貝拉' },
    ]), { headers: { 'content-type': 'application/json' } })

    const parsed = await readLimitedJson(response)
    expect(parseRangerSource(parsed)[0]?.Ranger名稱).toBe('泰山貝拉')
  })

  it('rejects an announced oversized response before reading it', async () => {
    const response = new Response('[]', { headers: { 'content-length': String(17 * 1024 * 1024) } })
    await expect(readLimitedJson(response)).rejects.toThrow('16 MiB')
  })
})

describe('Ranger image URL', () => {
  it('maps ranger_id to the thumbnail path', () => {
    expect(getRangerImageUrl('u1617e-ka')).toBe(
      'https://res.warmycat.com/u1617e-ka/u1617e-ka-thum.png',
    )
  })
})
