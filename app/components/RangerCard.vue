<script setup lang="ts">
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
      <div class="relative grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_38%,color-mix(in_oklab,var(--primary)_12%,white),var(--muted))] sm:h-64">
        <img
          v-if="!imageFailed"
          :src="ranger.imageUrl"
          :alt="ranger.name"
          loading="lazy"
          class="absolute inset-0 size-full object-contain transition-transform duration-300 group-hover:scale-105"
          @error="imageFailed = true"
        >
        <div class="absolute left-2 top-2 flex flex-wrap gap-1.5 sm:left-3 sm:top-3">
          <Badge variant="outline" :class="attributeClass">{{ ranger.attribute }}</Badge>
          <Badge variant="secondary" class="bg-background/85 backdrop-blur">{{ ranger.starRank }}</Badge>
        </div>
      </div>

      <div class="p-3">
        <h3 class="text-center text-sm font-bold tracking-tight truncate">{{ ranger.name }}</h3>
      </div>
    </Card>
  </NuxtLink>
</template>
