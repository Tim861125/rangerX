import type { RangerFiltersResponse } from '~~/shared/types/ranger'
import { getDatabase } from '~~/server/utils/cloudflare'

interface FilterRow {
  value: string
}

function sortStars(stars: string[]): string[] {
  return stars.sort((left, right) => {
    const leftNumber = Number(left.match(/\d+/)?.[0] ?? 0)
    const rightNumber = Number(right.match(/\d+/)?.[0] ?? 0)
    if (leftNumber !== rightNumber) return rightNumber - leftNumber
    return left.localeCompare(right, 'zh-Hant')
  })
}

export default defineEventHandler(async (event): Promise<RangerFiltersResponse> => {
  const database = getDatabase(event)
  const [stars, types, attributes] = await Promise.all([
    database.prepare('SELECT DISTINCT star_rank AS value FROM rangers ORDER BY value').all<FilterRow>(),
    database.prepare('SELECT DISTINCT ranger_type AS value FROM rangers ORDER BY value').all<FilterRow>(),
    database.prepare('SELECT DISTINCT attribute AS value FROM rangers ORDER BY value').all<FilterRow>(),
  ])

  return {
    data: {
      stars: sortStars(stars.results.map(row => row.value)),
      types: types.results.map(row => row.value),
      attributes: attributes.results.map(row => row.value),
    },
  }
})
