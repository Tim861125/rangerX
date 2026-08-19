<script setup lang="ts">
import { CheckCircle2, Circle, CircleDot, Droplet, Flame, Leaf, Moon, RotateCcw, Sparkles, Sun } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    stars: string[]
    types: string[]
    attributes: string[]
    showCollectionStatus?: boolean
  }>(),
  {
    showCollectionStatus: false,
  },
)

const star = defineModel<string>('star', { required: true })
const rangerType = defineModel<string>('rangerType', { required: true })
const attribute = defineModel<string>('attribute', { required: true })
const collectionStatus = defineModel<string>('collectionStatus', { default: 'all' })

function reset(): void {
  star.value = 'all'
  rangerType.value = 'all'
  attribute.value = 'all'
  if (props.showCollectionStatus) {
    collectionStatus.value = 'all'
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
      <div>
        <h2 class="text-sm font-bold tracking-tight">篩選條件</h2>
        <p class="font-mono text-[11px] text-muted-foreground">FILTER_MATRIX // PARAMETERS</p>
      </div>
      <Button variant="ghost" size="sm" class="h-7 gap-1.5 px-2 text-xs font-mono rounded-md hover:bg-muted" @click="reset">
        <RotateCcw class="size-3" />
        RESET
      </Button>
    </div>

    <!-- 收集狀態篩選（收集簿專用） -->
    <div v-if="showCollectionStatus" class="space-y-1.5">
      <label class="text-[11px] font-mono font-medium text-muted-foreground uppercase">收集狀態 / STATUS</label>
      <Select v-model="collectionStatus">
        <SelectTrigger class="w-full rounded-lg border-border/80 bg-card text-xs">
          <SelectValue placeholder="全部狀態" />
        </SelectTrigger>
        <SelectContent class="rounded-lg border-border bg-card">
          <SelectItem value="all">
            <div class="flex items-center gap-2">
              <Circle class="size-3.5 text-muted-foreground" />
              <span>全部狀態</span>
            </div>
          </SelectItem>
          <SelectItem value="0">
            <div class="flex items-center gap-2">
              <Circle class="size-3.5 text-stone-400" />
              <span>未擁有（灰色）</span>
            </div>
          </SelectItem>
          <SelectItem value="1">
            <div class="flex items-center gap-2">
              <Sparkles class="size-3.5 text-amber-500" />
              <span>已擁有（亮起）</span>
            </div>
          </SelectItem>
          <SelectItem value="2">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="size-3.5 text-emerald-500" />
              <span>已打勾（完成）</span>
            </div>
          </SelectItem>
          <SelectItem value="obtained">
            <div class="flex items-center gap-2">
              <CircleDot class="size-3.5 text-primary" />
              <span>所有已收集（亮起+打勾）</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-1.5">
      <label class="text-[11px] font-mono font-medium text-muted-foreground uppercase">星數／進化 / RARITY</label>
      <Select v-model="star">
        <SelectTrigger class="w-full rounded-lg border-border/80 bg-card text-xs font-mono">
          <SelectValue placeholder="全部星數" />
        </SelectTrigger>
        <SelectContent class="rounded-lg border-border bg-card">
          <SelectItem value="all">全部星數</SelectItem>
          <SelectItem v-for="item in stars" :key="item" :value="item">{{ item }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-1.5">
      <label class="text-[11px] font-mono font-medium text-muted-foreground uppercase">類型 / CLASS_TYPE</label>
      <Select v-model="rangerType">
        <SelectTrigger class="w-full rounded-lg border-border/80 bg-card text-xs">
          <SelectValue placeholder="全部類型" />
        </SelectTrigger>
        <SelectContent class="rounded-lg border-border bg-card">
          <SelectItem value="all">全部類型</SelectItem>
          <SelectItem v-for="item in types" :key="item" :value="item">{{ item }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-1.5">
      <label class="text-[11px] font-mono font-medium text-muted-foreground uppercase">屬性 / ELEMENT</label>
      <Select v-model="attribute">
        <SelectTrigger class="w-full rounded-lg border-border/80 bg-card text-xs">
          <SelectValue placeholder="全部屬性" />
        </SelectTrigger>
        <SelectContent class="rounded-lg border-border bg-card">
          <SelectItem value="all">全部屬性</SelectItem>
          <SelectItem v-for="item in attributes" :key="item" :value="item">
            <div class="flex items-center gap-2">
              <Droplet v-if="item === '水'" class="size-3.5 text-sky-400" />
              <Flame v-else-if="item === '火'" class="size-3.5 text-rose-400" />
              <Leaf v-else-if="item === '木'" class="size-3.5 text-emerald-400" />
              <Sun v-else-if="item === '光'" class="size-3.5 text-amber-300" />
              <Moon v-else-if="item === '暗'" class="size-3.5 text-violet-400" />
              <span>{{ item }}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
