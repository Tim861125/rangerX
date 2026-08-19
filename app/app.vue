<script setup lang="ts">
import { useDark } from '@vueuse/core'

useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
  initialValue: 'dark',
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground hud-grid-bg transition-colors duration-200">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster rich-colors position="top-center" />
  </div>
</template>
