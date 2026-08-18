import { describe, expect, it } from 'vitest'
import { DEFAULT_RANGER_IMAGE_ORIGIN, getRangerImagePath, getRangerImageUrl } from '~~/shared/utils/ranger'
import { formatRangerRecord } from '~~/shared/utils/ranger-formatter'

describe('Ranger image path & URL helpers', () => {
  it('generates standard image path from ranger_id', () => {
    expect(getRangerImagePath('u1617e-ka')).toBe('/u1617e-ka/u1617e-ka-thum.png')
    expect(getRangerImagePath('test-ranger/special')).toBe('/test-ranger%2Fspecial/test-ranger%2Fspecial-thum.png')
  })

  it('uses default origin when no custom origin is provided', () => {
    expect(getRangerImageUrl('u1617e-ka')).toBe(
      `${DEFAULT_RANGER_IMAGE_ORIGIN}/u1617e-ka/u1617e-ka-thum.png`,
    )
  })

  it('supports custom origin (e.g. Cloudflare R2 / CDN) and strips trailing slash', () => {
    expect(getRangerImageUrl('u1617e-ka', 'https://img.rangerx.com')).toBe(
      'https://img.rangerx.com/u1617e-ka/u1617e-ka-thum.png',
    )
    expect(getRangerImageUrl('u1617e-ka', 'https://img.rangerx.com/')).toBe(
      'https://img.rangerx.com/u1617e-ka/u1617e-ka-thum.png',
    )
    expect(getRangerImageUrl('u1617e-ka', 'https://pub-abc.r2.dev///')).toBe(
      'https://pub-abc.r2.dev/u1617e-ka/u1617e-ka-thum.png',
    )
  })

  it('falls back to default origin when empty string or whitespace origin is passed', () => {
    expect(getRangerImageUrl('u1617e-ka', '')).toBe(
      `${DEFAULT_RANGER_IMAGE_ORIGIN}/u1617e-ka/u1617e-ka-thum.png`,
    )
    expect(getRangerImageUrl('u1617e-ka', '   ')).toBe(
      `${DEFAULT_RANGER_IMAGE_ORIGIN}/u1617e-ka/u1617e-ka-thum.png`,
    )
  })

  it('supports custom origin in formatRangerRecord', () => {
    const formatted = formatRangerRecord(
      {
        ranger_id: 'u1617e-ka',
        Ranger名稱: '日比野卡夫卡',
        Ranger星數: '8星',
      },
      'https://cdn.example.com',
    )
    expect(formatted.imageUrl).toBe('https://cdn.example.com/u1617e-ka/u1617e-ka-thum.png')
  })
})
