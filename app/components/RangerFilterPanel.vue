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
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold">篩選條件</h2>
        <p class="mt-0.5 text-xs text-muted-foreground">縮小 Ranger 範圍</p>
      </div>
      <Button variant="ghost" size="sm" class="h-8 gap-1.5 px-2 text-xs" @click="reset">
        <RotateCcw class="size-3.5" />
        清除
      </Button>
    </div>

    <!-- 收集狀態篩選（收集簿專用） -->
    <div v-if="showCollectionStatus" class="space-y-2">
      <label class="text-xs font-medium text-muted-foreground">收集狀態</label>
      <Select v-model="collectionStatus">
        <SelectTrigger class="w-full bg-background">
          <SelectValue placeholder="全部狀態" />
        </SelectTrigger>
        <SelectContent>
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

    <div class="space-y-2">
      <label class="text-xs font-medium text-muted-foreground">星數／進化</label>
      <Select v-model="star">
        <SelectTrigger class="w-full bg-background">
          <SelectValue placeholder="全部星數" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部星數</SelectItem>
          <SelectItem v-for="item in stars" :key="item" :value="item">{{ item }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-2">
      <label class="text-xs font-medium text-muted-foreground">類型</label>
      <Select v-model="rangerType">
        <SelectTrigger class="w-full bg-background">
          <SelectValue placeholder="全部類型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部類型</SelectItem>
          <SelectItem v-for="item in types" :key="item" :value="item">{{ item }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-2">
      <label class="text-xs font-medium text-muted-foreground">屬性</label>
      <Select v-model="attribute">
        <SelectTrigger class="w-full bg-background">
          <SelectValue placeholder="全部屬性" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部屬性</SelectItem>
          <SelectItem v-for="item in attributes" :key="item" :value="item">
            <div class="flex items-center gap-2">
              <Droplet v-if="item === '水'" class="size-3.5 text-sky-500" />
              <Flame v-else-if="item === '火'" class="size-3.5 text-rose-500" />
              <Leaf v-else-if="item === '木'" class="size-3.5 text-emerald-500" />
              <Sun v-else-if="item === '光'" class="size-3.5 text-amber-500" />
              <Moon v-else-if="item === '暗'" class="size-3.5 text-indigo-900" />
              <span>{{ item }}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
