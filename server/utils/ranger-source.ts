import type { RangerSourceRecord } from '~~/shared/types/ranger'

const MAX_SOURCE_BYTES = 16 * 1024 * 1024
const RANGER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isRangerSourceRecord(value: unknown): value is RangerSourceRecord {
  return isRecord(value)
    && typeof value.ranger_id === 'string'
    && RANGER_ID_PATTERN.test(value.ranger_id)
    && typeof value.Ranger名稱 === 'string'
    && value.Ranger名稱.trim().length > 0
}

export function parseRangerSource(value: unknown): RangerSourceRecord[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('來源資料必須是非空的 Ranger 陣列。')
  }

  const records: RangerSourceRecord[] = []
  const ids = new Set<string>()

  for (const [index, item] of value.entries()) {
    if (!isRangerSourceRecord(item)) {
      throw new Error(`來源資料第 ${index + 1} 筆缺少有效的 ranger_id 或 Ranger名稱。`)
    }
    if (ids.has(item.ranger_id)) {
      throw new Error(`來源資料包含重複的 ranger_id：${item.ranger_id}`)
    }
    ids.add(item.ranger_id)
    records.push(item)
  }

  return records
}

export async function readLimitedJson(response: Response): Promise<unknown> {
  const announcedLength = Number(response.headers.get('content-length') ?? 0)
  if (announcedLength > MAX_SOURCE_BYTES) {
    throw new Error('來源資料超過 16 MiB 安全上限。')
  }
  if (!response.body) {
    throw new Error('來源 API 沒有回傳內容。')
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > MAX_SOURCE_BYTES) {
      await reader.cancel('source response too large')
      throw new Error('來源資料超過 16 MiB 安全上限。')
    }
    chunks.push(value)
  }

  const payload = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    payload.set(chunk, offset)
    offset += chunk.byteLength
  }

  return JSON.parse(new TextDecoder().decode(payload)) as unknown
}
