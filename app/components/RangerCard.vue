<script setup lang="ts">
import { Check, Droplet, Flame, Leaf, Moon, Sun } from '@lucide/vue'
import { NuxtLink } from '#components'
import type { RangerListItem } from '~~/shared/types/ranger'
import { DEFAULT_RANGER_IMAGE_ORIGIN, getRangerImageUrl } from '~~/shared/utils/ranger'

const props = withDefaults(
  defineProps<{
    ranger: RangerListItem
    mode?: 'link' | 'collection'
    status?: number
  }>(),
  {
    mode: 'link',
    status: 0,
  },
)

defineEmits<{
  (e: 'toggle', rangerId: string): void
}>()

const imageFailed = ref(false)
const currentImageSrc = ref(props.ranger.imageUrl)

watch(() => props.ranger.imageUrl, (newUrl) => {
  currentImageSrc.value = newUrl
  imageFailed.value = false
})

function handleImageError() {
  const fallbackUrl = getRangerImageUrl(props.ranger.rangerId, DEFAULT_RANGER_IMAGE_ORIGIN)
  if (currentImageSrc.value !== fallbackUrl) {
    currentImageSrc.value = fallbackUrl
  }
  else {
    imageFailed.value = true
  }
}

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

// 參考遊戲內真實卡牌背景風格（終極進化=清亮藍晶、超進化=幻紫光暈、9星=尊爵金光、7-8星=琥珀金光、一般=大地木質色）
const cardBackground = computed(() => {
  if (props.ranger.evolutionType === 1) {
    return 'bg-[radial-gradient(ellipse_at_50%_40%,#0284c7_0%,#0c4a6e_65%,#082f49_100%)] border-sky-300/60 shadow-sky-950/30'
  }
  if (props.ranger.evolutionType === 0) {
    return 'bg-[radial-gradient(ellipse_at_50%_40%,#7e22ce_0%,#4c1d95_60%,#1e1b4b_100%)] border-purple-400/60 shadow-purple-950/30'
  }
  if (props.ranger.starCount === 9) {
    return 'bg-[radial-gradient(ellipse_at_50%_40%,#d97706_0%,#78350f_60%,#351503_100%)] border-amber-300/80 shadow-amber-900/40'
  }
  if (props.ranger.starCount >= 7) {
    return 'bg-[radial-gradient(ellipse_at_50%_40%,#92400e_0%,#451a03_100%)] border-amber-500/50 shadow-amber-950/20'
  }
  return 'bg-[radial-gradient(ellipse_at_50%_40%,#5c4028_0%,#2d1b0e_100%)] border-[#8c6747]/60 shadow-stone-950/20'
})

const statusTitle = computed(() => {
  if (props.mode !== 'collection') {
    return `${props.ranger.name} (${props.ranger.starCount}星 · ${props.ranger.attribute}屬性 · ${props.ranger.rangerType})`
  }
  const stateName = props.status === 2 ? '【已打勾】' : props.status === 1 ? '【已擁有】' : '【未擁有】'
  return `${stateName} ${props.ranger.name}（點擊切換狀態）`
})
</script>

<template>
  <component
    :is="mode === 'collection' ? 'button' : NuxtLink"
    :to="mode === 'collection' ? undefined : `/ranger/${ranger.rangerId}`"
    :type="mode === 'collection' ? 'button' : undefined"
    :title="statusTitle"
    class="group relative block aspect-square w-full select-none text-left focus-visible:outline-none"
    :class="[
      mode === 'collection' && 'cursor-pointer',
      mode === 'collection' && status === 0 && 'opacity-40 grayscale hover:opacity-85 hover:grayscale-0 transition-all duration-200',
      mode === 'collection' && status === 1 && 'opacity-100 transition-all duration-200 ring-2 ring-primary/60 shadow-[0_0_8px_rgba(56,189,248,0.25)]',
      mode === 'collection' && status === 2 && 'opacity-100 transition-all duration-200 ring-2 ring-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.35)]',
    ]"
    @click="mode === 'collection' ? $emit('toggle', ranger.rangerId) : undefined"
  >
    <!-- 卡牌主體邊框與漸層背景 (HUD Tech Container) -->
    <div
      class="relative size-full overflow-hidden rounded-lg border border-border/80 shadow-sm transition-all duration-150 group-hover:-translate-y-0.5 group-hover:scale-[1.06] group-hover:border-primary/90 group-hover:shadow-[0_0_14px_rgba(56,189,248,0.28)] group-focus-visible:ring-2 group-focus-visible:ring-primary"
      :class="cardBackground"
    >
      <!-- HUD 角標裝飾 (Tech Corner Brackets) -->
      <span class="pointer-events-none absolute left-0.5 top-0.5 size-1.5 border-l-[1.5px] border-t-[1.5px] border-white/60 opacity-60 transition-opacity group-hover:border-primary group-hover:opacity-100" />
      <span class="pointer-events-none absolute right-0.5 top-0.5 size-1.5 border-r-[1.5px] border-t-[1.5px] border-white/60 opacity-60 transition-opacity group-hover:border-primary group-hover:opacity-100" />
      <span class="pointer-events-none absolute bottom-0.5 left-0.5 size-1.5 border-b-[1.5px] border-l-[1.5px] border-white/60 opacity-60 transition-opacity group-hover:border-primary group-hover:opacity-100" />
      <span class="pointer-events-none absolute bottom-0.5 right-0.5 size-1.5 border-b-[1.5px] border-r-[1.5px] border-white/60 opacity-60 transition-opacity group-hover:border-primary group-hover:opacity-100" />

      <!-- 頂部中央水平星星排列 (如同遊戲卡牌) -->
      <div class="pointer-events-none absolute inset-x-0 top-1 sm:top-1.5 z-20 flex items-center justify-center">
        <StarDisplay
          :star-count="ranger.starCount"
          :evolution-type="ranger.evolutionType"
          mode="card"
        />
      </div>

      <!-- 角色立繪置中填滿 (原圖維持原狀) -->
      <div class="absolute inset-0 flex items-center justify-center p-1.5 pt-3.5 sm:pt-4 pb-1">
        <img
          v-if="!imageFailed"
          :src="currentImageSrc"
          :alt="ranger.name"
          loading="lazy"
          class="size-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-110"
          @error="handleImageError"
        >
        <div v-else class="text-[9px] font-mono font-bold text-white/70">
          {{ ranger.name.slice(0, 2) }}
        </div>
      </div>

      <!-- 左下角屬性小圓章徽 -->
      <div
        class="absolute bottom-1 left-1 z-20 flex size-4 sm:size-4.5 items-center justify-center rounded-full border border-white/90 text-white shadow-xs"
        :class="attributeColor.bg"
        :title="`${ranger.attribute}屬性`"
      >
        <component :is="attributeColor.icon" class="size-2.5 sm:size-3" />
      </div>

      <!-- 右上角 NFT / 降臨角標籤 (若有且未打勾覆蓋) -->
      <div
        v-if="(ranger.nft || ranger.advent) && !(mode === 'collection' && status === 2)"
        class="absolute top-1 right-1 z-20 rounded border border-white/40 px-1 py-0.5 text-[7px] sm:text-[8px] font-mono font-black uppercase tracking-wider text-white shadow-sm"
        :class="ranger.nft ? 'bg-violet-600' : 'bg-amber-600'"
      >
        {{ ranger.nft ? 'NFT' : '降臨' }}
      </div>

      <!-- 收集簿狀態標記 (打勾標記) -->
      <div
        v-if="mode === 'collection' && status === 2"
        class="absolute top-1 right-1 z-30 flex size-4.5 sm:size-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-1 ring-white"
      >
        <Check class="size-3 sm:size-3.5 stroke-[3]" />
      </div>

      <!-- 收集簿狀態標記 (已擁有微光圓點標記) -->
      <div
        v-else-if="mode === 'collection' && status === 1"
        class="absolute top-1 right-1 z-30 size-2.5 sm:size-3 rounded-full bg-amber-400 shadow-sm ring-1 ring-white/90"
        title="已擁有"
      />

      <!-- 卡牌微光立體漸層覆蓋 -->
      <div class="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 via-transparent to-black/25" />
    </div>
  </component>
</template>
