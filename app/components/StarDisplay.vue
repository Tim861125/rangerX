<script setup lang="ts">
import type { EvolutionType } from '~~/shared/types/ranger'

const props = withDefaults(
  defineProps<{
    starCount: number
    evolutionType?: EvolutionType
    mode?: 'card' | 'detail'
  }>(),
  {
    evolutionType: null,
    mode: 'card',
  },
)

// 6星以上為大星星
const isLargeStar = computed(() => props.starCount >= 6)

// 顯示數量：1~5星 顯示 1~5 顆小星星；6~9星 顯示 1~4 顆大星星 (6星=1顆, 7星=2顆, 8星=3顆, 9星=4顆)
const displayCount = computed(() => {
  if (props.starCount >= 6) {
    return Math.max(1, props.starCount - 5)
  }
  return Math.max(1, props.starCount)
})

// 顏色判斷：1 (終極進化)=藍色, 0 (超進化)=紫色, null (一般)=黃色
const fillColor = computed(() => {
  if (props.evolutionType === 1) return '#38bdf8' // 終極進化 (天藍/亮藍)
  if (props.evolutionType === 0) return '#c084fc' // 超進化 (亮紫)
  return '#facc15'                                // 一般 (金黃)
})

// 尺寸微調：16欄位比例
const starSizeClass = computed(() => {
  if (props.mode === 'detail') {
    return isLargeStar.value ? 'size-6 sm:size-7' : 'size-4 sm:size-5'
  }

  // card 16欄位模式：大星星 size-2.5~3，小星星 size-1.5~2
  return isLargeStar.value ? 'size-2.5 sm:size-3' : 'size-1.5 sm:size-2'
})
</script>

<template>
  <div
    class="inline-flex items-center justify-center gap-[0.5px] filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.8)] select-none"
    :aria-label="`${starCount} 星`"
  >
    <svg
      v-for="index in displayCount"
      :key="index"
      viewBox="0 0 24 24"
      :class="starSizeClass"
      class="shrink-0 transform transition-transform"
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        :fill="fillColor"
        stroke="#ffffff"
        :stroke-width="isLargeStar ? 1.8 : 2.2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>
