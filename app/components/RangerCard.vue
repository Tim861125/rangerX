<script setup lang="ts">
import { Droplet, Flame, Leaf, Moon, Sun } from '@lucide/vue'
import type { RangerListItem } from '~~/shared/types/ranger'

const props = defineProps<{ ranger: RangerListItem }>()
const imageFailed = ref(false)

const DEFAULT_ATTRIBUTE = { bg: 'bg-stone-500', icon: Droplet }
const ATTRIBUTE_MAP: Record<string, { bg: string; icon: typeof Droplet }> = {
  水: { bg: 'bg-sky-500', icon: Droplet },
  火: { bg: 'bg-rose-500', icon: Flame },
  木: { bg: 'bg-emerald-500', icon: Leaf },
  光: { bg: 'bg-amber-400 !text-stone-900', icon: Sun },
  暗: { bg: 'bg-indigo-900', icon: Moon },
  無: { bg: 'bg-stone-500', icon: Droplet },
}

// 屬性圖示與外觀樣式
const attributeColor = computed<{ bg: string; icon: typeof Droplet }>(() => {
  return ATTRIBUTE_MAP[props.ranger.attribute] ?? DEFAULT_ATTRIBUTE
})

// 參考遊戲內真實卡牌背景風格（終極進化=藍晶光暈、超進化=紫幻光暈、高星=金光、一般=大地木質色）
const cardBackground = computed(() => {
  if (props.ranger.evolutionType === 1) {
    return 'bg-[radial-gradient(ellipse_at_50%_40%,#1e3a8a_0%,#0f172a_100%)] border-sky-400/50 shadow-sky-950/20'
  }
  if (props.ranger.evolutionType === 0) {
    return 'bg-[radial-gradient(ellipse_at_50%_40%,#581c87_0%,#1e1b4b_100%)] border-purple-400/50 shadow-purple-950/20'
  }
  if (props.ranger.starCount >= 7) {
    return 'bg-[radial-gradient(ellipse_at_50%_40%,#b45309_0%,#451a03_100%)] border-amber-400/60 shadow-amber-950/20'
  }
  return 'bg-[radial-gradient(ellipse_at_50%_40%,#5c4028_0%,#2d1b0e_100%)] border-[#8c6747]/60 shadow-stone-950/20'
})
</script>

<template>
  <NuxtLink
    :to="`/ranger/${ranger.rangerId}`"
    :title="`${ranger.name} (${ranger.starCount}星 · ${ranger.attribute}屬性 · ${ranger.rangerType})`"
    class="group relative block aspect-square w-full select-none focus-visible:outline-none"
  >
    <!-- 卡牌主體邊框與漸層背景 (精緻 16 欄位小卡) -->
    <div
      class="relative size-full overflow-hidden rounded-lg sm:rounded-xl border-[1.5px] shadow-sm transition-all duration-150 group-hover:-translate-y-0.5 group-hover:scale-[1.06] group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary"
      :class="cardBackground"
    >
      <!-- 頂部中央水平星星排列 (如同遊戲卡牌) -->
      <div class="pointer-events-none absolute inset-x-0 top-1 z-20 flex items-center justify-center">
        <StarDisplay
          :star-count="ranger.starCount"
          :evolution-type="ranger.evolutionType"
          mode="card"
        />
      </div>

      <!-- 角色立繪置中填滿 -->
      <div class="absolute inset-0 flex items-center justify-center p-1 pt-3 sm:pt-3.5 pb-0.5">
        <img
          v-if="!imageFailed"
          :src="ranger.imageUrl"
          :alt="ranger.name"
          loading="lazy"
          class="size-full object-contain drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.35)] transition-transform duration-200 group-hover:scale-110"
          @error="imageFailed = true"
        >
        <div v-else class="text-[8px] font-bold text-white/60">
          {{ ranger.name.slice(0, 2) }}
        </div>
      </div>

      <!-- 左下角屬性小圓章徽 -->
      <div
        class="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 z-20 flex size-3.5 sm:size-4 items-center justify-center rounded-full border border-white/90 text-white shadow-xs"
        :class="attributeColor.bg"
        :title="`${ranger.attribute}屬性`"
      >
        <component :is="attributeColor.icon" class="size-2 sm:size-2.5" />
      </div>

      <!-- 右上角 NFT / 降臨角標籤 (若有) -->
      <div
        v-if="ranger.nft || ranger.advent"
        class="absolute top-1 right-1 z-20 rounded px-0.5 py-0 text-[6px] sm:text-[7px] font-black uppercase tracking-wider text-white shadow"
        :class="ranger.nft ? 'bg-violet-600' : 'bg-amber-600'"
      >
        {{ ranger.nft ? 'NFT' : '降臨' }}
      </div>

      <!-- 卡牌微光立體漸層覆蓋 -->
      <div class="pointer-events-none absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-b from-white/10 via-transparent to-black/20" />
    </div>
  </NuxtLink>
</template>
