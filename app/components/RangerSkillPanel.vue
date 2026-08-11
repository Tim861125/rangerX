<script setup lang="ts">
interface SkillEffect {
  effect: string
  factor: string
  duration: string
  range: string
}

interface SkillView {
  name: string
  description: string
  chance: string
  trigger: string
  cooldown: string
  effects: SkillEffect[]
}

const props = defineProps<{
  title: string
  value: unknown
}>()

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function stringValue(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : '—'
}

const skill = computed<SkillView | null>(() => {
  const record = asRecord(props.value)
  if (!record) return null
  const effectsValue = record['技能組']
  const effects: SkillEffect[] = Array.isArray(effectsValue)
    ? effectsValue.flatMap((item) => {
        const effect = asRecord(item)
        return effect
          ? [{
              effect: stringValue(effect, '效果'),
              factor: stringValue(effect, '係數'),
              duration: stringValue(effect, '有效時間'),
              range: stringValue(effect, '範圍'),
            }]
          : []
      })
    : []

  return {
    name: stringValue(record, '技能名稱'),
    description: stringValue(record, '技能敘述').replaceAll('\\n', '\n'),
    chance: stringValue(record, '發動機率'),
    trigger: stringValue(record, '觸發基準'),
    cooldown: stringValue(record, '技能冷卻時間'),
    effects,
  }
})
</script>

<template>
  <Card class="gap-4 border-border/75">
    <CardHeader>
      <div class="flex items-center justify-between gap-3">
        <Badge variant="secondary">{{ title }}</Badge>
        <span v-if="skill" class="text-xs text-muted-foreground">發動率 {{ skill.chance }}</span>
      </div>
      <CardTitle class="mt-2 text-lg">{{ skill?.name ?? '無' }}</CardTitle>
      <CardDescription v-if="skill" class="whitespace-pre-line leading-6">
        {{ skill.description }}
      </CardDescription>
      <CardDescription v-else>此 Ranger 沒有配置{{ title }}。</CardDescription>
    </CardHeader>
    <CardContent v-if="skill" class="space-y-4">
      <div class="grid grid-cols-2 gap-3 rounded-xl bg-muted/45 p-3 text-xs">
        <div>
          <p class="text-muted-foreground">觸發基準</p>
          <p class="mt-1 font-medium">{{ skill.trigger }}</p>
        </div>
        <div>
          <p class="text-muted-foreground">冷卻時間</p>
          <p class="mt-1 font-medium">{{ skill.cooldown }}</p>
        </div>
      </div>
      <div v-if="skill.effects.length" class="space-y-2">
        <div v-for="(effect, index) in skill.effects" :key="`${effect.effect}-${index}`" class="rounded-xl border p-3">
          <p class="text-sm font-semibold">{{ effect.effect }}</p>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>係數：{{ effect.factor }}</span>
            <span>時間：{{ effect.duration }}</span>
            <span>範圍：{{ effect.range }}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
