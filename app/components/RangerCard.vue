<script setup lang="ts">
import { ArrowUpRight, Coins, HeartPulse, Sparkles, Swords } from '@lucide/vue'
import type { RangerListItem } from '~~/shared/types/ranger'

const props = defineProps<{ ranger: RangerListItem }>()
const imageFailed = ref(false)

const attributeClass = computed(() => {
  const classes: Record<string, string> = {
    火: 'border-rose-200 bg-rose-50 text-rose-700',
    水: 'border-sky-200 bg-sky-50 text-sky-700',
    木: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    光: 'border-amber-200 bg-amber-50 text-amber-700',
    暗: 'border-violet-200 bg-violet-50 text-violet-700',
    無: 'border-stone-200 bg-stone-50 text-stone-600',
  }
  return classes[props.ranger.attribute] ?? classes.無
})
</script>

<template>
  <NuxtLink :to="`/ranger/${ranger.rangerId}`" class="group block h-full focus-visible:outline-none">
    <Card class="h-full gap-0 overflow-hidden border-border/75 py-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5 group-focus-visible:ring-2 group-focus-visible:ring-ring">
      <div class="flex min-h-36 sm:block">
        <div class="relative grid w-32 shrink-0 place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_38%,color-mix(in_oklab,var(--primary)_12%,white),var(--muted))] sm:h-48 sm:w-full">
          <span class="text-4xl font-black text-primary/15">{{ ranger.name.slice(0, 1) }}</span>
          <img
            v-if="!imageFailed"
            :src="ranger.imageUrl"
            :alt="ranger.name"
            loading="lazy"
            width="240"
            height="240"
            class="absolute inset-0 size-full object-contain p-2 transition-transform duration-300 group-hover:scale-105 sm:p-4"
            @error="imageFailed = true"
          >
          <div class="absolute left-2 top-2 flex flex-wrap gap-1.5 sm:left-3 sm:top-3">
            <Badge variant="outline" :class="attributeClass">{{ ranger.attribute }}</Badge>
            <Badge variant="secondary" class="bg-background/85 backdrop-blur">{{ ranger.starRank }}</Badge>
          </div>
        </div>

        <div class="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{{ ranger.rangerId }}</p>
              <h3 class="mt-1 line-clamp-2 text-base font-bold tracking-tight sm:text-lg">{{ ranger.name }}</h3>
            </div>
            <ArrowUpRight class="mt-1 hidden size-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
          </div>
          <p class="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground sm:min-h-10">{{ ranger.description }}</p>

          <div class="mt-auto grid grid-cols-2 gap-x-3 gap-y-2 pt-4 text-xs">
            <div class="flex items-center gap-1.5 text-muted-foreground" title="體力">
              <HeartPulse class="size-3.5 text-rose-500" />
              <span class="font-medium text-foreground">{{ ranger.health.toLocaleString() }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-muted-foreground" title="物理攻擊力">
              <Swords class="size-3.5 text-orange-500" />
              <span class="font-medium text-foreground">{{ ranger.physicalAttack.toLocaleString() }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-muted-foreground" title="魔法攻擊力">
              <Sparkles class="size-3.5 text-violet-500" />
              <span class="font-medium text-foreground">{{ ranger.magicAttack.toLocaleString() }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-muted-foreground" title="生產礦物費用">
              <Coins class="size-3.5 text-amber-500" />
              <span class="font-medium text-foreground">{{ ranger.mineralCost.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </NuxtLink>
</template>
