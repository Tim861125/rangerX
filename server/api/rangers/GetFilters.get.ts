import type { RangerFiltersResponse } from '~~/shared/types/ranger'
import { getDatabase } from '~~/server/utils/cloudflare'

interface FilterRow {
  value: string
}

interface StarCountRow {
  star_count: number
}

export default defineEventHandler(async (event): Promise<RangerFiltersResponse> => {
  const database = getDatabase(event)
  const [starCounts, types, attributes] = await Promise.all([
    database.prepare('SELECT DISTINCT star_count FROM rangers_formatted ORDER BY star_count DESC').all<StarCountRow>(),
    database.prepare('SELECT DISTINCT ranger_type AS value FROM rangers_formatted ORDER BY value').all<FilterRow>(),
    database.prepare('SELECT DISTINCT attribute AS value FROM rangers_formatted ORDER BY value').all<FilterRow>(),
  ])

  const starOptions = [
    '終極進化',
    '超進化',
    ...starCounts.results.map(row => `${row.star_count}星`),
  ]

  return {
    data: {
      stars: starOptions,
      types: types.results.map(row => row.value),
      attributes: attributes.results.map(row => row.value),
    },
  }
})
