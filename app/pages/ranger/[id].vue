<script setup lang="ts">
import { ArrowLeft, CalendarDays, Coins, Gauge, HeartPulse, Shield, Sparkles, Swords, WandSparkles } from '@lucide/vue'
import type { RangerDetailResponse } from '~~/shared/types/ranger'
import { DEFAULT_RANGER_IMAGE_ORIGIN, getRangerImageUrl } from '~~/shared/utils/ranger'

const route = useRoute()
const rangerId = computed(() => String(route.params.id ?? ''))
const imageFailed = ref(false)
const currentImageSrc = ref('')
// Preserve the current request's Cloudflare context while rendering on the server.
const requestFetch = useRequestFetch()

const { data: response, status, error } = await useAsyncData<RangerDetailResponse>(
  () => `ranger-${rangerId.value}`,
  () => requestFetch<RangerDetailResponse>(`/api/rangers/GetRanger/${encodeURIComponent(rangerId.value)}` as string),
  { watch: [rangerId] },
)

const ranger = computed(() => response.value?.data)

watch(ranger, (newRanger) => {
  if (newRanger?.imageUrl) {
    currentImageSrc.value = newRanger.imageUrl
    imageFailed.value = false
  }
}, { immediate: true })

function handleImageError() {
  if (!ranger.value) {
    imageFailed.value = true
    return
  }
  const fallbackUrl = getRangerImageUrl(ranger.value.rangerId, DEFAULT_RANGER_IMAGE_ORIGIN)
  if (currentImageSrc.value !== fallbackUrl) {
    currentImageSrc.value = fallbackUrl
  }
  else {
    imageFailed.value = true
  }
}

const attributeClass = computed(() => {
  const classes: Record<string, string> = {
    火: 'border-rose-500/50 bg-rose-500/15 text-rose-400 font-medium',
    水: 'border-sky-500/50 bg-sky-500/15 text-sky-400 font-medium',
    木: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400 font-medium',
    光: 'border-amber-400/50 bg-amber-400/15 text-amber-300 font-medium',
    暗: 'border-violet-500/50 bg-violet-500/15 text-violet-300 font-medium',
    無: 'border-stone-500/50 bg-stone-500/15 text-stone-300 font-medium',
  }
  return classes[ranger.value?.attribute ?? '無'] ?? classes.無
})

useSeoMeta({
  title: () => ranger.value ? `${ranger.value.name}｜RangerX` : 'Ranger 詳情｜RangerX',
  description: () => ranger.value?.description || 'LINE Rangers 角色詳細資料',
})
</script>

<template>
  <div class="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
    <Button variant="ghost" size="sm" as-child class="mb-5 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground font-mono text-xs">
      <NuxtLink to="/">
        <ArrowLeft class="size-4" />
        BACK_TO_ARCHIVE
      </NuxtLink>
    </Button>

    <div v-if="status === 'pending'" class="space-y-6">
      <Skeleton class="h-72 rounded-xl" />
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton v-for="index in 8" :key="index" class="h-24 rounded-xl" />
      </div>
    </div>

    <Card v-else-if="error || !ranger" class="border-destructive/30 bg-card py-12 text-center rounded-xl">
      <CardContent>
        <p class="font-semibold text-destructive">找不到 Ranger 資料</p>
        <p class="mt-2 text-sm text-muted-foreground font-mono">TARGET_ID_NOT_FOUND // SYNC_REQUIRED</p>
      </CardContent>
    </Card>

    <div v-else-if="ranger" class="space-y-6 sm:space-y-8">
      <!-- 角色核心資訊看板 (HUD Header Section) -->
      <section class="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div class="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-sky-400 to-amber-300" />
        <div class="grid gap-0 md:grid-cols-[320px_1fr]">
          <!-- 角色立繪底座 (原圖維持原樣 + HUD 方框底座) -->
          <div class="relative grid min-h-72 place-items-center overflow-hidden border-b border-border/80 bg-muted/40 p-6 md:border-b-0 md:border-r">
            <div class="relative aspect-square w-full max-w-[260px] overflow-hidden rounded-xl border border-border/90 bg-card p-4 shadow-lg">
              <!-- HUD 角標 -->
              <span class="pointer-events-none absolute left-1 top-1 size-2 border-l-2 border-t-2 border-primary" />
              <span class="pointer-events-none absolute right-1 top-1 size-2 border-r-2 border-t-2 border-primary" />
              <span class="pointer-events-none absolute bottom-1 left-1 size-2 border-b-2 border-l-2 border-primary" />
              <span class="pointer-events-none absolute bottom-1 right-1 size-2 border-b-2 border-r-2 border-primary" />

              <div class="absolute inset-x-0 top-3 z-10 flex justify-center">
                <StarDisplay :star-count="ranger.starCount" :evolution-type="ranger.evolutionType" mode="detail" />
              </div>
              <img
                v-if="!imageFailed"
                :src="currentImageSrc"
                :alt="ranger.name"
                width="320"
                height="320"
                class="size-full object-contain pt-5 drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-105"
                @error="handleImageError"
              >
              <div v-else class="grid size-full place-items-center font-mono text-xl font-bold text-muted-foreground">
                {{ ranger.name }}
              </div>
            </div>
          </div>

          <div class="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div class="flex flex-wrap items-center gap-2">
              <Badge variant="outline" :class="attributeClass">{{ ranger.attribute }}屬性</Badge>
              <Badge v-if="ranger.evolutionType === 1" class="border border-sky-400/60 bg-sky-500/20 text-sky-300 font-medium">終極進化</Badge>
              <Badge v-if="ranger.evolutionType === 0" class="border border-purple-400/60 bg-purple-500/20 text-purple-300 font-medium">超進化</Badge>
              <Badge variant="outline" class="border-border bg-muted/60 font-mono text-xs">{{ ranger.rangerType }}</Badge>
              <Badge v-if="ranger.isNft" class="border border-violet-400 bg-violet-600 font-mono">NFT</Badge>
              <Badge v-if="ranger.isAdvent" class="border border-amber-400 bg-amber-600 font-mono">降臨關卡</Badge>
            </div>
            <p class="mt-4 font-mono text-xs font-semibold uppercase tracking-wider text-primary">[ ID: {{ ranger.rangerId }} ]</p>
            <h1 class="mt-1.5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{{ ranger.name }}</h1>
            <p class="mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">{{ ranger.description }}</p>
            <div class="mt-6 flex flex-wrap gap-x-6 gap-y-3 font-mono text-xs sm:text-sm">
              <span class="flex items-center gap-2 text-foreground/90"><CalendarDays class="size-4 text-primary" />{{ ranger.releasedAt }}</span>
              <span class="flex items-center gap-2 text-foreground/90"><Gauge class="size-4 text-primary" />{{ ranger.respawnTime }}</span>
              <span class="flex items-center gap-2 text-foreground/90"><Coins class="size-4 text-primary" />{{ ranger.mineralCost.toLocaleString() }} 礦物</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 戰鬥數值 -->
      <section>
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Swords class="size-5 text-primary" />
            <h2 class="text-lg font-bold tracking-tight">戰鬥數值</h2>
          </div>
          <span class="font-mono text-xs text-muted-foreground">PRIMARY_STATS</span>
        </div>
        <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
          <Card
            v-for="item in ranger?.primaryStats"
            :key="item.key"
            class="group rounded-lg border-border/80 bg-card p-3.5 transition-all hover:border-primary/70 hover:shadow-[0_0_10px_rgba(56,189,248,0.18)]"
          >
            <p class="text-[11px] text-muted-foreground font-mono">{{ item.label }}</p>
            <p class="mt-1.5 truncate text-base font-bold font-mono tabular-nums text-foreground group-hover:text-primary transition-colors" :title="item.value">
              {{ item.value }}
            </p>
          </Card>
        </div>
      </section>

      <!-- 機率與速度 & 成長數值 -->
      <section class="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card class="rounded-xl border-border/80 bg-card">
          <CardHeader class="pb-3 border-b border-border/70">
            <CardTitle class="flex items-center gap-2 text-base"><Shield class="size-4 text-primary" />機率與速度</CardTitle>
          </CardHeader>
          <CardContent class="pt-4">
            <div class="grid grid-cols-2 gap-x-5 gap-y-3.5 text-sm">
              <div v-for="item in ranger?.rateStats" :key="item.key" class="border-b border-border/60 pb-2.5 last:border-0">
                <p class="text-xs text-muted-foreground font-mono">{{ item.label }}</p>
                <p class="mt-1 font-semibold font-mono tabular-nums">{{ item.value }}</p>
              </div>
              <div class="border-b border-border/60 pb-2.5">
                <p class="text-xs text-muted-foreground font-mono">攻擊速度</p>
                <p class="mt-1 font-semibold font-mono">{{ ranger?.attackSpeed }}</p>
              </div>
              <div class="border-b border-border/60 pb-2.5">
                <p class="text-xs text-muted-foreground font-mono">移動速度</p>
                <p class="mt-1 font-semibold font-mono">{{ ranger?.moveSpeed }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="rounded-xl border-border/80 bg-card">
          <CardHeader class="pb-3 border-b border-border/70">
            <CardTitle class="flex items-center gap-2 text-base"><HeartPulse class="size-4 text-primary" />成長數值</CardTitle>
            <CardDescription class="text-xs font-mono">NORMAL_AND_MAX_ENHANCEMENT</CardDescription>
          </CardHeader>
          <CardContent class="pt-4">
            <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              <div v-for="item in ranger?.growthStats" :key="item.key" class="rounded-lg border border-border/70 bg-muted/50 p-2.5">
                <p class="text-[11px] leading-4 text-muted-foreground font-mono">{{ item.label }}</p>
                <p class="mt-1 text-sm font-bold font-mono tabular-nums text-foreground">{{ item.value }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <!-- 技能 -->
      <section>
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <WandSparkles class="size-5 text-primary" />
            <h2 class="text-lg font-bold tracking-tight">技能模組</h2>
          </div>
          <span class="font-mono text-xs text-muted-foreground">SKILL_SYSTEM</span>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <RangerSkillPanel title="技能 1" :skill="ranger?.skill1 ?? null" />
          <RangerSkillPanel title="技能 2" :skill="ranger?.skill2 ?? null" />
        </div>
      </section>

      <!-- 能力與才能 -->
      <section>
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Sparkles class="size-5 text-primary" />
            <h2 class="text-lg font-bold tracking-tight">能力與才能</h2>
          </div>
          <span class="font-mono text-xs text-muted-foreground">ABILITIES_AND_TALENTS</span>
        </div>
        <Card class="mb-4 rounded-xl border-border/80 bg-card">
          <CardHeader class="pb-3 border-b border-border/70">
            <CardTitle class="text-base">常駐能力</CardTitle>
            <CardDescription class="text-xs">包含一般能力與覺醒能力</CardDescription>
          </CardHeader>
          <CardContent class="pt-4">
            <div v-if="ranger?.abilities?.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="ability in ranger.abilities" :key="`${ability.name}-${ability.code}`" class="rounded-lg border border-border/80 bg-muted/40 p-3.5">
                <div class="flex items-center gap-2">
                  <Badge v-if="ability.isAwakened" variant="secondary" class="border border-primary/40 bg-primary/10 text-primary font-mono text-[10px]">覺醒</Badge>
                  <p class="font-semibold text-sm">{{ ability.name }}</p>
                </div>
                <p v-if="ability.code" class="mt-2 break-all font-mono text-[11px] text-muted-foreground">{{ ability.code }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground font-mono">NO_ABILITY_DATA_FOUND</p>
          </CardContent>
        </Card>
        <RangerTalentPanel :talent="ranger?.talent ?? null" />
      </section>
    </div>
  </div>
</template>
