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
    火: 'border-rose-200 bg-rose-50 text-rose-700',
    水: 'border-sky-200 bg-sky-50 text-sky-700',
    木: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    光: 'border-amber-200 bg-amber-50 text-amber-700',
    暗: 'border-violet-200 bg-violet-50 text-violet-700',
    無: 'border-stone-200 bg-stone-50 text-stone-600',
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

    <div v-else-if="ranger" class="space-y-6 sm:space-y-8">
      <section class="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-teal-400 to-amber-300" />
        <div class="grid gap-0 md:grid-cols-[300px_1fr]">
          <div class="relative grid min-h-64 place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--primary)_14%,white),var(--muted))] p-6 md:min-h-80">
            <div class="relative aspect-square w-full max-w-[260px] overflow-hidden rounded-3xl border-2 border-border/80 bg-background/50 p-4 shadow-xl backdrop-blur">
              <div class="absolute inset-x-0 top-3 z-10 flex justify-center">
                <StarDisplay :star-count="ranger.starCount" :evolution-type="ranger.evolutionType" mode="detail" />
              </div>
              <img
                v-if="!imageFailed"
                :src="currentImageSrc"
                :alt="ranger.name"
                width="320"
                height="320"
                class="size-full object-contain pt-5 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:scale-105"
                @error="handleImageError"
              >
              <div v-else class="grid size-full place-items-center text-xl font-bold text-muted-foreground">
                {{ ranger.name }}
              </div>
            </div>
          </div>
          <div class="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
            <div class="flex flex-wrap items-center gap-2">
              <Badge variant="outline" :class="attributeClass">{{ ranger.attribute }}屬性</Badge>
              <Badge v-if="ranger.evolutionType === 1" class="bg-sky-500 hover:bg-sky-600 text-white font-medium">終極進化</Badge>
              <Badge v-if="ranger.evolutionType === 0" class="bg-purple-600 hover:bg-purple-700 text-white font-medium">超進化</Badge>
              <Badge variant="outline">{{ ranger.rangerType }}</Badge>
              <Badge v-if="ranger.isNft" class="bg-violet-600">NFT</Badge>
              <Badge v-if="ranger.isAdvent" class="bg-amber-600">降臨關卡</Badge>
            </div>
            <p class="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ ranger.rangerId }}</p>
            <h1 class="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-4xl lg:text-5xl">{{ ranger.name }}</h1>
            <p class="mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">{{ ranger.description }}</p>
            <div class="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <span class="flex items-center gap-2"><CalendarDays class="size-4 text-primary" />{{ ranger.releasedAt }}</span>
              <span class="flex items-center gap-2"><Gauge class="size-4 text-primary" />{{ ranger.respawnTime }}</span>
              <span class="flex items-center gap-2"><Coins class="size-4 text-primary" />{{ ranger.mineralCost.toLocaleString() }} 礦物</span>
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
          <Card v-for="item in ranger?.primaryStats" :key="item.key" class="gap-2 px-4 py-4">
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
              <div v-for="item in ranger?.rateStats" :key="item.key" class="border-b pb-3 last:border-0">
                <p class="text-xs text-muted-foreground">{{ item.label }}</p>
                <p class="mt-1 font-semibold tabular-nums">{{ item.value }}</p>
              </div>
              <div class="border-b pb-3">
                <p class="text-xs text-muted-foreground">攻擊速度</p>
                <p class="mt-1 font-semibold">{{ ranger?.attackSpeed }}</p>
              </div>
              <div class="border-b pb-3">
                <p class="text-xs text-muted-foreground">移動速度</p>
                <p class="mt-1 font-semibold">{{ ranger?.moveSpeed }}</p>
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
              <div v-for="item in ranger?.growthStats" :key="item.key" class="rounded-xl bg-muted/45 p-3">
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
          <RangerSkillPanel title="技能 1" :skill="ranger?.skill1 ?? null" />
          <RangerSkillPanel title="技能 2" :skill="ranger?.skill2 ?? null" />
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
            <div v-if="ranger?.abilities?.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="ability in ranger.abilities" :key="`${ability.name}-${ability.code}`" class="rounded-xl border p-4">
                <div class="flex items-center gap-2">
                  <Badge v-if="ability.isAwakened" variant="secondary">覺醒</Badge>
                  <p class="font-semibold">{{ ability.name }}</p>
                </div>
                <p v-if="ability.code" class="mt-2 break-all text-xs text-muted-foreground">{{ ability.code }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground">此 Ranger 尚無能力資料。</p>
          </CardContent>
        </Card>
        <RangerTalentPanel :talent="ranger?.talent ?? null" />
      </section>
    </div>
  </div>
</template>
