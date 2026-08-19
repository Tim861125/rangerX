<script setup lang="ts">
import type { FormattedTalent } from '~~/shared/types/ranger'

defineProps<{
  talent: FormattedTalent | null
}>()
</script>

<template>
  <Card class="rounded-xl border-border/80 bg-card">
    <CardHeader class="border-b border-border/70 pb-3">
      <CardTitle class="text-base font-bold">天賦才能 / TALENT</CardTitle>
      <CardDescription v-if="talent" class="whitespace-pre-line text-sm leading-6 text-muted-foreground">{{ talent.description }}</CardDescription>
      <CardDescription v-else class="font-mono text-xs text-muted-foreground">此 Ranger 尚無才能資料。</CardDescription>
    </CardHeader>
    <CardContent v-if="talent" class="grid gap-5 lg:grid-cols-2 pt-4">
      <div class="space-y-3">
        <div class="rounded-lg border border-border/70 bg-muted/40 p-3.5">
          <p class="font-mono text-xs text-primary font-semibold">觸發條件 · CHANCE: {{ talent.triggerChance }}</p>
          <p class="mt-1.5 text-sm font-medium leading-6 text-foreground">{{ talent.condition }}</p>
        </div>
        <div v-for="(effect, index) in talent.effects" :key="index" class="rounded-lg border border-border/80 bg-muted/30 p-3 text-sm">
          <span class="mr-2 font-mono text-xs text-primary font-semibold">{{ effect.chance }}</span>
          <span class="text-foreground">{{ effect.effect }}</span>
        </div>
      </div>
      <div>
        <p class="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">強化才能 / ENHANCEMENTS</p>
        <div class="flex flex-wrap gap-2">
          <Badge v-for="enhancement in talent.enhancements" :key="enhancement" variant="secondary" class="border border-border/80 bg-muted/80 px-3 py-1.5 font-mono text-xs">
            {{ enhancement }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
