import type { H3Event } from 'h3'
import type { D1PreparedStatement } from '@cloudflare/workers-types'
import type { RangerSourceRecord, SyncResult } from '~~/shared/types/ranger'
import { getDatabase, getSourceUrl } from '~~/server/utils/cloudflare'
import { parseRangerSource, readLimitedJson } from '~~/server/utils/ranger-source'
import { mapToRawRanger } from '~~/server/utils/ranger-raw-mapper'
import { computeRangerEvolutionGroups, formatRangerRecord } from '~~/shared/utils/ranger-formatter'

const STATEMENTS_PER_BATCH = 40

function chunksOf<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function parsePercent(val: string | undefined): number {
  if (!val) return 0
  const parsed = Number.parseFloat(val.replace('%', '').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : '未知的同步錯誤'
}

export interface SyncOptions {
  force?: boolean
}

export async function syncRangers(event: H3Event, options: SyncOptions = {}): Promise<SyncResult> {
  const database = getDatabase(event)
  const sourceUrl = getSourceUrl(event)
  let lockAcquired = false

  try {
    const lockSql = options.force
      ? `
        UPDATE sync_status
        SET status = 'running',
            source_url = ?,
            started_at = datetime('now'),
            error_message = NULL
        WHERE id = 1
      `
      : `
        UPDATE sync_status
        SET status = 'running',
            source_url = ?,
            started_at = datetime('now'),
            error_message = NULL
        WHERE id = 1
          AND (status != 'running' OR started_at < datetime('now', '-2 minutes'))
          AND (completed_at IS NULL OR datetime(completed_at) < datetime('now', '-10 seconds'))
      `

    const lock = await database.prepare(lockSql).bind(sourceUrl).run()

    if (lock.meta.changes !== 1) {
      throw createError({
        statusCode: 409,
        message: '資料正在更新，或剛完成更新，請稍後再試。若確認已中斷可選擇「強制同步」。',
      })
    }
    lockAcquired = true

    const sourceResponse = await fetch(sourceUrl, {
      headers: { accept: 'application/json' },
    })
    if (!sourceResponse.ok) {
      throw new Error(`來源 API 回傳 HTTP ${sourceResponse.status}`)
    }

    const incoming = parseRangerSource(await readLimitedJson(sourceResponse))
    const existingRawResult = await database
      .prepare('SELECT ranger_id FROM rangers_raw')
      .all<{ ranger_id: string }>()
    const existingIds = new Set(existingRawResult.results.map(row => row.ranger_id))
    const incomingIds = new Set(incoming.map(ranger => ranger.ranger_id))
    const staleIds = [...existingIds].filter(id => !incomingIds.has(id))

    let insertedCount = 0
    let updatedCount = 0

    for (const ranger of incoming) {
      if (existingIds.has(ranger.ranger_id)) {
        updatedCount += 1
      }
      else {
        insertedCount += 1
      }
    }

    const rawUpsertSql = `
      INSERT INTO rangers_raw (
        ranger_id, name, description, released_at_raw, star_rank_raw, ranger_type_raw,
        attribute_raw, respawn_time_raw, mineral_cost_raw, attack_range_raw, splash_range_raw,
        physical_attack_raw, magic_attack_raw, physical_defense_raw, magic_defense_raw, health_raw,
        crit_rate_raw, crit_damage_raw, hit_rate_raw, evasion_rate_raw, skill_hit_rate_raw,
        skill_evasion_rate_raw, skill_resist_raw, attack_speed_raw, move_speed_raw,
        hp_increase_raw, attack_increase_raw, special_attack_delta_raw, general_defense_delta_raw,
        special_defense_delta_raw, hp_increase_max_raw, attack_increase_max_raw, special_attack_delta_max_raw,
        general_defense_delta_max_raw, special_defense_delta_max_raw, skill1_raw, skill2_raw,
        ability1_raw, ability1_code, ability2_raw, ability2_code, awakened_abilities_raw,
        is_nft_raw, is_advent_raw, talent_raw, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, unixepoch()
      )
      ON CONFLICT(ranger_id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        released_at_raw = excluded.released_at_raw,
        star_rank_raw = excluded.star_rank_raw,
        ranger_type_raw = excluded.ranger_type_raw,
        attribute_raw = excluded.attribute_raw,
        respawn_time_raw = excluded.respawn_time_raw,
        mineral_cost_raw = excluded.mineral_cost_raw,
        attack_range_raw = excluded.attack_range_raw,
        splash_range_raw = excluded.splash_range_raw,
        physical_attack_raw = excluded.physical_attack_raw,
        magic_attack_raw = excluded.magic_attack_raw,
        physical_defense_raw = excluded.physical_defense_raw,
        magic_defense_raw = excluded.magic_defense_raw,
        health_raw = excluded.health_raw,
        crit_rate_raw = excluded.crit_rate_raw,
        crit_damage_raw = excluded.crit_damage_raw,
        hit_rate_raw = excluded.hit_rate_raw,
        evasion_rate_raw = excluded.evasion_rate_raw,
        skill_hit_rate_raw = excluded.skill_hit_rate_raw,
        skill_evasion_rate_raw = excluded.skill_evasion_rate_raw,
        skill_resist_raw = excluded.skill_resist_raw,
        attack_speed_raw = excluded.attack_speed_raw,
        move_speed_raw = excluded.move_speed_raw,
        hp_increase_raw = excluded.hp_increase_raw,
        attack_increase_raw = excluded.attack_increase_raw,
        special_attack_delta_raw = excluded.special_attack_delta_raw,
        general_defense_delta_raw = excluded.general_defense_delta_raw,
        special_defense_delta_raw = excluded.special_defense_delta_raw,
        hp_increase_max_raw = excluded.hp_increase_max_raw,
        attack_increase_max_raw = excluded.attack_increase_max_raw,
        special_attack_delta_max_raw = excluded.special_attack_delta_max_raw,
        general_defense_delta_max_raw = excluded.general_defense_delta_max_raw,
        special_defense_delta_max_raw = excluded.special_defense_delta_max_raw,
        skill1_raw = excluded.skill1_raw,
        skill2_raw = excluded.skill2_raw,
        ability1_raw = excluded.ability1_raw,
        ability1_code = excluded.ability1_code,
        ability2_raw = excluded.ability2_raw,
        ability2_code = excluded.ability2_code,
        awakened_abilities_raw = excluded.awakened_abilities_raw,
        is_nft_raw = excluded.is_nft_raw,
        is_advent_raw = excluded.is_advent_raw,
        talent_raw = excluded.talent_raw,
        updated_at = unixepoch()
    `

    const formattedRecords = incoming.map(r => formatRangerRecord(r))
    const groupMetaMap = computeRangerEvolutionGroups(formattedRecords)

    const formattedUpsertSql = `
      INSERT INTO rangers_formatted (
        ranger_id, name, description, released_at, star_count, evolution_type,
        is_ultimate, is_hyper, unit_no, group_no, form_rank, ranger_type, attribute, respawn_time,
        mineral_cost, attack_range, splash_range, physical_attack, magic_attack,
        physical_defense, magic_defense, health, crit_rate, crit_damage,
        hit_rate, evasion_rate, skill_hit_rate, skill_evasion_rate, skill_resist,
        attack_speed, move_speed, is_nft, is_advent,
        primary_stats_json, rate_stats_json, growth_stats_json,
        skill1_json, skill2_json, abilities_json, talent_json, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, unixepoch()
      )
      ON CONFLICT(ranger_id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        released_at = excluded.released_at,
        star_count = excluded.star_count,
        evolution_type = excluded.evolution_type,
        is_ultimate = excluded.is_ultimate,
        is_hyper = excluded.is_hyper,
        unit_no = excluded.unit_no,
        group_no = excluded.group_no,
        form_rank = excluded.form_rank,
        ranger_type = excluded.ranger_type,
        attribute = excluded.attribute,
        respawn_time = excluded.respawn_time,
        mineral_cost = excluded.mineral_cost,
        attack_range = excluded.attack_range,
        splash_range = excluded.splash_range,
        physical_attack = excluded.physical_attack,
        magic_attack = excluded.magic_attack,
        physical_defense = excluded.physical_defense,
        magic_defense = excluded.magic_defense,
        health = excluded.health,
        crit_rate = excluded.crit_rate,
        crit_damage = excluded.crit_damage,
        hit_rate = excluded.hit_rate,
        evasion_rate = excluded.evasion_rate,
        skill_hit_rate = excluded.skill_hit_rate,
        skill_evasion_rate = excluded.skill_evasion_rate,
        skill_resist = excluded.skill_resist,
        attack_speed = excluded.attack_speed,
        move_speed = excluded.move_speed,
        is_nft = excluded.is_nft,
        is_advent = excluded.is_advent,
        primary_stats_json = excluded.primary_stats_json,
        rate_stats_json = excluded.rate_stats_json,
        growth_stats_json = excluded.growth_stats_json,
        skill1_json = excluded.skill1_json,
        skill2_json = excluded.skill2_json,
        abilities_json = excluded.abilities_json,
        talent_json = excluded.talent_json,
        updated_at = unixepoch()
    `

    const statements: D1PreparedStatement[] = []

    for (let index = 0; index < incoming.length; index++) {
      const record = incoming[index]!
      // 1. Prepare raw table insertion
      const raw = mapToRawRanger(record)
      statements.push(database.prepare(rawUpsertSql).bind(
        raw.ranger_id, raw.name, raw.description, raw.released_at_raw, raw.star_rank_raw, raw.ranger_type_raw,
        raw.attribute_raw, raw.respawn_time_raw, raw.mineral_cost_raw, raw.attack_range_raw, raw.splash_range_raw,
        raw.physical_attack_raw, raw.magic_attack_raw, raw.physical_defense_raw, raw.magic_defense_raw, raw.health_raw,
        raw.crit_rate_raw, raw.crit_damage_raw, raw.hit_rate_raw, raw.evasion_rate_raw, raw.skill_hit_rate_raw,
        raw.skill_evasion_rate_raw, raw.skill_resist_raw, raw.attack_speed_raw, raw.move_speed_raw,
        raw.hp_increase_raw, raw.attack_increase_raw, raw.special_attack_delta_raw, raw.general_defense_delta_raw,
        raw.special_defense_delta_raw, raw.hp_increase_max_raw, raw.attack_increase_max_raw, raw.special_attack_delta_max_raw,
        raw.general_defense_delta_max_raw, raw.special_defense_delta_max_raw, raw.skill1_raw, raw.skill2_raw,
        raw.ability1_raw, raw.ability1_code, raw.ability2_raw, raw.ability2_code, raw.awakened_abilities_raw,
        raw.is_nft_raw, raw.is_advent_raw, raw.talent_raw,
      ))

      // 2. Prepare formatted table insertion
      const fmt = formattedRecords[index]!
      const meta = groupMetaMap.get(fmt.rangerId) ?? {
        unitNo: 0,
        groupNo: 0,
        formRank: getFormRank('', fmt.evolutionType, fmt.starCount),
      }

      const respawnSec = Number.parseFloat(fmt.respawnTime.replace('秒', '')) || 0
      const physicalAtk = fmt.primaryStats.find(s => s.key === 'physicalAttack')?.raw ?? 0
      const magicAtk = fmt.primaryStats.find(s => s.key === 'magicAttack')?.raw ?? 0
      const physicalDef = fmt.primaryStats.find(s => s.key === 'physicalDefense')?.raw ?? 0
      const magicDef = fmt.primaryStats.find(s => s.key === 'magicDefense')?.raw ?? 0
      const health = fmt.primaryStats.find(s => s.key === 'health')?.raw ?? 0
      const critRate = parsePercent(fmt.rateStats.find(s => s.key === 'critRate')?.value)
      const critDmg = parsePercent(fmt.rateStats.find(s => s.key === 'critDamage')?.value) || 100
      const hitRate = parsePercent(fmt.rateStats.find(s => s.key === 'hitRate')?.value)
      const evasionRate = parsePercent(fmt.rateStats.find(s => s.key === 'evasionRate')?.value)
      const skillHitRate = parsePercent(fmt.rateStats.find(s => s.key === 'skillHitRate')?.value)
      const skillEvasionRate = parsePercent(fmt.rateStats.find(s => s.key === 'skillEvasionRate')?.value)
      const skillResist = parsePercent(fmt.rateStats.find(s => s.key === 'skillResist')?.value)

      statements.push(database.prepare(formattedUpsertSql).bind(
        fmt.rangerId,
        fmt.name,
        fmt.description,
        fmt.releasedAt,
        fmt.starCount,
        fmt.evolutionType,
        fmt.isUltimate ? 1 : 0,
        fmt.isHyper ? 1 : 0,
        meta.unitNo,
        meta.groupNo,
        meta.formRank,
        fmt.rangerType,
        fmt.attribute,
        respawnSec,
        fmt.mineralCost,
        fmt.attackRange,
        fmt.splashRange,
        physicalAtk,
        magicAtk,
        physicalDef,
        magicDef,
        health,
        critRate,
        critDmg,
        hitRate,
        evasionRate,
        skillHitRate,
        skillEvasionRate,
        skillResist,
        fmt.attackSpeed,
        fmt.moveSpeed,
        fmt.isNft ? 1 : 0,
        fmt.isAdvent ? 1 : 0,
        JSON.stringify(fmt.primaryStats),
        JSON.stringify(fmt.rateStats),
        JSON.stringify(fmt.growthStats),
        fmt.skill1 ? JSON.stringify(fmt.skill1) : null,
        fmt.skill2 ? JSON.stringify(fmt.skill2) : null,
        JSON.stringify(fmt.abilities),
        fmt.talent ? JSON.stringify(fmt.talent) : null,
      ))
    }

    if (staleIds.length > 0) {
      statements.push(database.prepare(`
        DELETE FROM rangers_formatted WHERE ranger_id IN (SELECT value FROM json_each(?))
      `).bind(JSON.stringify(staleIds)))
      statements.push(database.prepare(`
        DELETE FROM rangers_raw WHERE ranger_id IN (SELECT value FROM json_each(?))
      `).bind(JSON.stringify(staleIds)))
    }

    // Execute in batch chunks
    for (const batchChunk of chunksOf(statements, STATEMENTS_PER_BATCH)) {
      await database.batch(batchChunk)
    }

    const completedAt = new Date().toISOString()
    await database.prepare(`
      UPDATE sync_status
      SET status = 'success',
          completed_at = ?,
          fetched_count = ?,
          inserted_count = ?,
          updated_count = ?,
          deleted_count = ?,
          error_message = NULL
      WHERE id = 1
    `).bind(
      completedAt,
      incoming.length,
      insertedCount,
      updatedCount,
      staleIds.length,
    ).run()

    const result: SyncResult = {
      fetchedCount: incoming.length,
      insertedCount,
      updatedCount,
      deletedCount: staleIds.length,
      unchangedCount: 0,
      completedAt,
    }

    console.info(JSON.stringify({ event: 'rangers.sync.completed', ...result }))
    return result
  }
  catch (error) {
    if (lockAcquired) {
      const message = getErrorMessage(error)
      try {
        await database.prepare(`
          UPDATE sync_status
          SET status = 'error', completed_at = datetime('now'), error_message = ?
          WHERE id = 1
        `).bind(message).run()
      }
      catch (statusError) {
        console.error(JSON.stringify({
          event: 'rangers.sync.status_update_failed',
          error: getErrorMessage(statusError),
        }))
      }
      console.error(JSON.stringify({ event: 'rangers.sync.failed', error: message }))
    }
    throw error
  }
}
