<script setup lang="ts">
import { Droplet, Flame, Leaf, Moon, RotateCcw, Sun } from '@lucide/vue'

defineProps<{
  stars: string[]
  types: string[]
  attributes: string[]
}>()

const star = defineModel<string>('star', { required: true })
const rangerType = defineModel<string>('rangerType', { required: true })
const attribute = defineModel<string>('attribute', { required: true })

function reset(): void {
  star.value = 'all'
  rangerType.value = 'all'
  attribute.value = 'all'
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
          <div class="flex items-center gap-1.5">
            <SelectItem value="水">
              <Droplet class="size-3.5 text-blue-500" />
              <span>水</span>
            </SelectItem>
            <SelectItem value="火">
              <Flame class="size-3.5 text-red-500" />
              <span>火</span>
            </SelectItem>
            <SelectItem value="木">
              <Leaf class="size-3.5 text-green-500" />
              <span>木</span>
            </SelectItem>
            <SelectItem value="光">
              <Sun class="size-3.5 text-yellow-500" />
              <span>光</span>
            </SelectItem>
            <SelectItem value="暗">
              <Moon class="size-3.5 text-indigo-900" />
              <span>暗</span>
            </SelectItem>
          </div>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
