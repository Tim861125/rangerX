<script setup lang="ts">
import type { FormattedTalent } from '~~/shared/types/ranger'

defineProps<{
  talent: FormattedTalent | null
}>()
</script>

<template>
  <Card class="border-border/75">
    <CardHeader>
      <CardTitle class="text-lg">才能</CardTitle>
      <CardDescription v-if="talent" class="whitespace-pre-line leading-6">{{ talent.description }}</CardDescription>
      <CardDescription v-else>此 Ranger 尚無才能資料。</CardDescription>
    </CardHeader>
    <CardContent v-if="talent" class="grid gap-5 lg:grid-cols-2">
      <div class="space-y-3">
        <div class="rounded-xl bg-muted/45 p-4">
          <p class="text-xs text-muted-foreground">觸發條件 · {{ talent.triggerChance }}</p>
          <p class="mt-1.5 text-sm font-medium leading-6">{{ talent.condition }}</p>
        </div>
        <div v-for="(effect, index) in talent.effects" :key="index" class="rounded-xl border p-3 text-sm">
          <span class="mr-2 text-xs text-muted-foreground">{{ effect.chance }}</span>
          {{ effect.effect }}
        </div>
      </div>
      <div>
        <p class="mb-3 text-xs font-medium text-muted-foreground">強化才能</p>
        <div class="flex flex-wrap gap-2">
          <Badge v-for="enhancement in talent.enhancements" :key="enhancement" variant="secondary" class="px-3 py-1.5">
            {{ enhancement }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
