<script setup lang="ts">
import type { FormattedSkill } from '~~/shared/types/ranger'

defineProps<{
  title: string
  skill: FormattedSkill | null
}>()
</script>

<template>
  <Card class="relative gap-4 rounded-xl border-border/80 bg-card">
    <CardHeader class="border-b border-border/70 pb-3">
      <div class="flex items-center justify-between gap-3">
        <Badge variant="secondary" class="border border-primary/40 bg-primary/10 text-primary font-mono text-xs">{{ title }}</Badge>
        <span v-if="skill" class="font-mono text-xs text-primary font-semibold">CHANCE: {{ skill.chance }}</span>
      </div>
      <CardTitle class="mt-2 text-lg font-bold">{{ skill?.name ?? '無' }}</CardTitle>
      <CardDescription v-if="skill" class="whitespace-pre-line text-sm leading-6 text-muted-foreground">
        {{ skill.description }}
      </CardDescription>
      <CardDescription v-else class="font-mono text-xs">此 Ranger 沒有配置{{ title }}。</CardDescription>
    </CardHeader>
    <CardContent v-if="skill" class="space-y-4 pt-4">
      <div class="grid grid-cols-2 gap-3 rounded-lg border border-border/70 bg-muted/40 p-3 text-xs">
        <div>
          <p class="font-mono text-[11px] text-muted-foreground uppercase">觸發基準 / TRIGGER</p>
          <p class="mt-1 font-mono font-medium text-foreground">{{ skill.trigger || '—' }}</p>
        </div>
        <div>
          <p class="font-mono text-[11px] text-muted-foreground uppercase">冷卻時間 / COOLDOWN</p>
          <p class="mt-1 font-mono font-medium text-foreground">{{ skill.cooldown || '—' }}</p>
        </div>
      </div>
      <div v-if="skill.effects.length" class="space-y-2">
        <div v-for="(effect, index) in skill.effects" :key="`${effect.effect}-${index}`" class="rounded-lg border border-border/80 bg-muted/30 p-3">
          <p class="text-sm font-semibold text-foreground">{{ effect.effect }}</p>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
            <span>係數：<strong class="text-foreground/90">{{ effect.factor || '—' }}</strong></span>
            <span>時間：<strong class="text-foreground/90">{{ effect.duration || '—' }}</strong></span>
            <span>範圍：<strong class="text-foreground/90">{{ effect.range || '—' }}</strong></span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
