import type { H3Event } from 'h3'
import type { D1Database } from '@cloudflare/workers-types'

function isD1Database(value: unknown): value is D1Database {
  return typeof value === 'object'
    && value !== null
    && 'prepare' in value
    && typeof value.prepare === 'function'
    && 'batch' in value
    && typeof value.batch === 'function'
}

export function getDatabase(event: H3Event): D1Database {
  const database = event.context.cloudflare?.env.DB

  if (!isD1Database(database)) {
    throw createError({
      statusCode: 503,
      message: '資料庫尚未連線，請確認 Cloudflare D1 binding「DB」。',
    })
  }

  return database
}

export function getSourceUrl(event: H3Event): string {
  const sourceUrl = event.context.cloudflare?.env.SOURCE_API_URL
  return typeof sourceUrl === 'string'
    ? sourceUrl
    : 'https://rangerbook.warmycat.com/res/Rangers_data.json'
}
