<script setup lang="ts">
import { Droplet, Flame, Leaf, Moon, Sun } from '@lucide/vue'
import type { RangerListItem } from '~~/shared/types/ranger'

const props = defineProps<{ ranger: RangerListItem }>()
const imageFailed = ref(false)

const attributeClass = computed(() => {
  const classes: Record<string, string> = {
    火: 'bg-red-500 border-white',
    水: 'bg-blue-500 border-white',
    木: 'bg-green-500 border-white',
    光: 'bg-yellow-400 border-white',
    暗: 'bg-indigo-900 border-white',
    無: 'bg-stone-500 border-white',
  }
  return classes[props.ranger.attribute] ?? classes.無
})

const attributeIcon = computed(() => {
  const icons: Record<string, typeof Droplet> = {
    水: Droplet,
    火: Flame,
    木: Leaf,
    光: Sun,
    暗: Moon,
  }
  return icons[props.ranger.attribute] ?? Droplet
})
</script>

<template>
  <NuxtLink :to="`/ranger/${ranger.rangerId}`" class="group block h-full focus-visible:outline-none">
    <Card class="h-full gap-0 overflow-hidden border-border/75 py-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5 group-focus-visible:ring-2 group-focus-visible:ring-ring">
      <div class="relative grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_38%,color-mix(in_oklab,var(--primary)_12%,white),var(--muted))]">
        <img
          v-if="!imageFailed"
          :src="ranger.imageUrl"
          :alt="ranger.name"
          loading="lazy"
          class="size-full object-contain transition-transform duration-300 group-hover:scale-105"
          @error="imageFailed = true"
        >
        <div class="absolute left-0.5 top-0.5 flex gap-0.5">
          <Badge variant="default" :class="attributeClass" class="text-[8px] px-1 py-0 !text-white">
            <component :is="attributeIcon" class="size-3" />
          </Badge>
          <Badge variant="secondary" class="bg-background/85 backdrop-blur text-[8px] px-1 py-0">{{ ranger.starRank }}</Badge>
        </div>
      </div>
    </Card>
  </NuxtLink>
</template>
