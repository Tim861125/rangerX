<script setup lang="ts">
import { ArrowLeft, CalendarDays, Coins, Gauge, HeartPulse, Shield, Sparkles, Swords, WandSparkles } from '@lucide/vue'
import type { RangerDetailResponse } from '~~/shared/types/ranger'

interface DisplayItem {
  label: string
  value: string
}

interface AbilityItem {
  name: string
  code?: string
  awakened?: boolean
}

const route = useRoute()
const rangerId = computed(() => String(route.params.id ?? ''))
const imageFailed = ref(false)
// Preserve the current request's Cloudflare context while rendering on the server.
const requestFetch = useRequestFetch()

const { data: response, status, error } = await useAsyncData<RangerDetailResponse>(
  () => `ranger-${rangerId.value}`,
  () => requestFetch<RangerDetailResponse>(`/api/rangers/GetRanger/${encodeURIComponent(rangerId.value)}` as string),
  { watch: [rangerId] },
)

const ranger = computed(() => response.value?.data)

function raw(key: string): unknown {
  return ranger.value?.[key]
}

function text(key: string, fallback = '—'): string {
  const value = raw(key)
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toLocaleString()
  return fallback
}

function numeric(key: string): string {
  const value = raw(key)
  return typeof value === 'number' ? value.toLocaleString() : text(key)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

const primaryStats = computed<DisplayItem[]>(() => [
  { label: '體力', value: numeric('體力') },
  { label: '物理攻擊', value: numeric('物理攻擊力') },
  { label: '魔法攻擊', value: numeric('魔法攻擊力') },
  { label: '物理防禦', value: numeric('物理防禦力') },
  { label: '魔法防禦', value: numeric('魔法防禦力') },
  { label: '攻擊範圍', value: numeric('攻擊範圍') },
  { label: '濺射範圍', value: numeric('濺射範圍') },
  { label: '生產礦物', value: numeric('生產礦物費用') },
])

const rateStats = computed<DisplayItem[]>(() => [
  { label: '爆擊機率', value: text('爆擊機率') },
  { label: '爆擊傷害', value: text('爆擊傷害') },
  { label: '命中率', value: text('命中率') },
  { label: '閃避機率', value: text('閃避機率') },
  { label: '技能命中率', value: text('技能命中率') },
  { label: '技能閃避機率', value: text('技能閃避機率') },
  { label: '技能抗性', value: text('技能抗性') },
])

const growthStats = computed<DisplayItem[]>(() => [
  { label: '體力增加', value: numeric('hpIncreaseAmount') },
  { label: '體力增加（MAX）', value: numeric('hpIncreaseAmountMax') },
  { label: '攻擊增加', value: numeric('attackIncreaseAmount') },
  { label: '攻擊增加（MAX）', value: numeric('attackIncreaseAmountMax') },
  { label: '魔攻增量', value: numeric('specialAttackDelta') },
  { label: '魔攻增量（MAX）', value: numeric('specialAttackDeltaMax') },
  { label: '物防增量', value: numeric('generalDefenceDelta') },
  { label: '物防增量（MAX）', value: numeric('generalDefenceDeltaMax') },
  { label: '魔防增量', value: numeric('specialDefenceDelta') },
  { label: '魔防增量（MAX）', value: numeric('specialDefenceDeltaMax') },
])

const abilities = computed<AbilityItem[]>(() => {
  const items: AbilityItem[] = []
  for (const [nameKey, codeKey] of [['能力1', 'abilityCode'], ['能力2', 'abilityCode2']] as const) {
    const name = text(nameKey, '')
    if (name && name !== '無') items.push({ name, code: text(codeKey, '') })
  }
  const awakened = raw('覺醒能力')
  if (Array.isArray(awakened)) {
    for (const item of awakened) {
      const record = asRecord(item)
      if (record && typeof record['能力'] === 'string') {
        items.push({
          name: record['能力'],
          code: typeof record.abilityCode === 'string' ? record.abilityCode : undefined,
          awakened: true,
        })
      }
    }
  }
  return items
})

const attributeClass = computed(() => {
  const classes: Record<string, string> = {
    火: 'border-rose-200 bg-rose-50 text-rose-700',
    水: 'border-sky-200 bg-sky-50 text-sky-700',
    木: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    光: 'border-amber-200 bg-amber-50 text-amber-700',
    暗: 'border-violet-200 bg-violet-50 text-violet-700',
    無: 'border-stone-200 bg-stone-50 text-stone-600',
  }
  return classes[text('屬性')] ?? classes.無
})

useSeoMeta({
  title: () => ranger.value ? `${ranger.value.Ranger名稱}｜RangerX` : 'Ranger 詳情｜RangerX',
  description: () => text('角色敘述', 'LINE Rangers 角色詳細資料'),
})
</script>

<template>
  <div class="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
    <Button variant="ghost" size="sm" as-child class="mb-5 -ml-2 gap-1.5 text-muted-foreground">
      <NuxtLink to="/">
        <ArrowLeft class="size-4" />
        返回 Ranger 一覽
      </NuxtLink>
    </Button>

    <div v-if="status === 'pending'" class="space-y-6">
      <Skeleton class="h-72 rounded-3xl" />
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton v-for="index in 8" :key="index" class="h-24 rounded-2xl" />
      </div>
    </div>

    <Card v-else-if="error || !ranger" class="border-destructive/30 py-12 text-center">
      <CardContent>
        <p class="font-semibold text-destructive">找不到 Ranger 資料</p>
        <p class="mt-2 text-sm text-muted-foreground">這個 ID 可能不存在，或資料尚未同步。</p>
      </CardContent>
    </Card>

    <div v-else class="space-y-6 sm:space-y-8">
      <section class="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-teal-400 to-amber-300" />
        <div class="grid gap-0 md:grid-cols-[300px_1fr]">
          <div class="relative grid min-h-64 place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--primary)_14%,white),var(--muted))] md:min-h-80">
            <span class="text-7xl font-black text-primary/10">{{ ranger.Ranger名稱.slice(0, 1) }}</span>
            <img
              v-if="!imageFailed"
              :src="ranger.imageUrl"
              :alt="ranger.Ranger名稱"
              width="320"
              height="320"
              class="absolute inset-0 size-full object-contain p-5 md:p-8"
              @error="imageFailed = true"
            >
          </div>
          <div class="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
            <div class="flex flex-wrap gap-2">
              <Badge variant="outline" :class="attributeClass">{{ text('屬性') }}屬性</Badge>
              <Badge variant="secondary">{{ text('Ranger星數') }}</Badge>
              <Badge variant="outline">{{ text('類型') }}</Badge>
              <Badge v-if="text('nft角色') === '是'" class="bg-violet-600">NFT</Badge>
              <Badge v-if="text('降臨關卡角色') === '是'" class="bg-amber-600">降臨關卡</Badge>
            </div>
            <p class="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ ranger.ranger_id }}</p>
            <h1 class="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-4xl lg:text-5xl">{{ ranger.Ranger名稱 }}</h1>
            <p class="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{{ text('角色敘述') }}</p>
            <div class="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <span class="flex items-center gap-2"><CalendarDays class="size-4 text-primary" />{{ text('登場時間') }}</span>
              <span class="flex items-center gap-2"><Gauge class="size-4 text-primary" />{{ text('Ranger再生產時間') }}</span>
              <span class="flex items-center gap-2"><Coins class="size-4 text-primary" />{{ numeric('生產礦物費用') }} 礦物</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="mb-4 flex items-center gap-2">
          <Swords class="size-5 text-primary" />
          <h2 class="text-xl font-bold tracking-tight">戰鬥數值</h2>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <Card v-for="item in primaryStats" :key="item.label" class="gap-2 px-4 py-4">
            <p class="text-[11px] text-muted-foreground">{{ item.label }}</p>
            <p class="truncate text-base font-bold tabular-nums" :title="item.value">{{ item.value }}</p>
          </Card>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card class="border-border/75">
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-lg"><Shield class="size-5 text-primary" />機率與速度</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
              <div v-for="item in rateStats" :key="item.label" class="border-b pb-3 last:border-0">
                <p class="text-xs text-muted-foreground">{{ item.label }}</p>
                <p class="mt-1 font-semibold tabular-nums">{{ item.value }}</p>
              </div>
              <div class="border-b pb-3">
                <p class="text-xs text-muted-foreground">攻擊速度</p>
                <p class="mt-1 font-semibold">{{ text('攻擊速度') }}</p>
              </div>
              <div class="border-b pb-3">
                <p class="text-xs text-muted-foreground">移動速度</p>
                <p class="mt-1 font-semibold">{{ text('移動速度') }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/75">
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-lg"><HeartPulse class="size-5 text-primary" />成長數值</CardTitle>
            <CardDescription>一般成長量與最大強化數值。</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div v-for="item in growthStats" :key="item.label" class="rounded-xl bg-muted/45 p-3">
                <p class="text-[11px] leading-4 text-muted-foreground">{{ item.label }}</p>
                <p class="mt-1 text-sm font-bold tabular-nums">{{ item.value }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div class="mb-4 flex items-center gap-2">
          <WandSparkles class="size-5 text-primary" />
          <h2 class="text-xl font-bold tracking-tight">技能</h2>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <RangerSkillPanel title="技能 1" :value="raw('技能1')" />
          <RangerSkillPanel title="技能 2" :value="raw('技能2')" />
        </div>
      </section>

      <section>
        <div class="mb-4 flex items-center gap-2">
          <Sparkles class="size-5 text-primary" />
          <h2 class="text-xl font-bold tracking-tight">能力與才能</h2>
        </div>
        <Card class="mb-4 border-border/75">
          <CardHeader>
            <CardTitle class="text-lg">能力</CardTitle>
            <CardDescription>一般能力與可選覺醒能力。</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="abilities.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="ability in abilities" :key="`${ability.name}-${ability.code}`" class="rounded-xl border p-4">
                <div class="flex items-center gap-2">
                  <Badge v-if="ability.awakened" variant="secondary">覺醒</Badge>
                  <p class="font-semibold">{{ ability.name }}</p>
                </div>
                <p v-if="ability.code" class="mt-2 break-all text-xs text-muted-foreground">{{ ability.code }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground">此 Ranger 尚無能力資料。</p>
          </CardContent>
        </Card>
        <RangerTalentPanel :value="raw('才能')" />
      </section>
    </div>
  </div>
</template>
