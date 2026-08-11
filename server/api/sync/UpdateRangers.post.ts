import type { SyncResultResponse } from '~~/shared/types/ranger'
import { syncRangers } from '~~/server/services/sync-rangers'

function timingSafeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left)
  const rightBytes = new TextEncoder().encode(right)
  const length = Math.max(leftBytes.length, rightBytes.length)
  let mismatch = leftBytes.length ^ rightBytes.length

  for (let index = 0; index < length; index += 1) {
    mismatch |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0)
  }

  return mismatch === 0
}

export default defineEventHandler(async (event): Promise<SyncResultResponse> => {
  const configuredToken = useRuntimeConfig(event).syncToken.trim()

  if (configuredToken) {
    const authorization = getHeader(event, 'authorization') ?? ''
    const suppliedToken = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : ''

    if (!timingSafeEqual(configuredToken, suppliedToken)) {
      throw createError({ statusCode: 401, message: '管理權杖不正確。' })
    }
  }

  return { data: await syncRangers(event) }
})
