<script setup lang="ts">
import { Database, RefreshCw, ShieldCheck } from '@lucide/vue'
import { toast } from 'vue-sonner'
import type { SyncResultResponse, SyncStatusResponse } from '~~/shared/types/ranger'

const dialogOpen = ref(false)
const token = ref('')
const isUpdating = ref(false)
const { data: syncResponse, refresh: refreshStatus } = await useFetch<SyncStatusResponse>('/api/sync/GetStatus' as string)

const status = computed(() => syncResponse.value?.data)
const statusLabel = computed(() => {
  if (!status.value || status.value.status === 'never') return '尚未同步'
  if (status.value.status === 'running') return '同步中'
  if (status.value.status === 'error') return '上次同步失敗'
  if (!status.value.completedAt) return '已同步'
  return `更新於 ${formatDateTime(status.value.completedAt)}`
})

function formatDateTime(value: string): string {
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function getFetchMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '更新失敗，請稍後再試。'
  if ('data' in error && typeof error.data === 'object' && error.data !== null && 'message' in error.data) {
    const message = error.data.message
    if (typeof message === 'string') return message
  }
  if ('data' in error && typeof error.data === 'object' && error.data !== null && 'statusMessage' in error.data) {
    const message = error.data.statusMessage
    if (typeof message === 'string') return message
  }
  if ('message' in error && typeof error.message === 'string') return error.message
  return '更新失敗，請稍後再試。'
}

async function updateRangers(): Promise<void> {
  isUpdating.value = true
  try {
    const headers = token.value ? { authorization: `Bearer ${token.value}` } : undefined
    const result = await $fetch<SyncResultResponse>('/api/sync/UpdateRangers', {
      method: 'POST',
      headers,
    })
    await Promise.all([
      refreshStatus(),
      refreshNuxtData('rangers'),
      refreshNuxtData('ranger-filters'),
    ])
    dialogOpen.value = false
    token.value = ''
    toast.success('Ranger 資料已更新', {
      description: `新增 ${result.data.insertedCount}、更新 ${result.data.updatedCount}、未變更 ${result.data.unchangedCount} 筆。`,
    })
  }
  catch (error) {
    await refreshStatus()
    toast.error('無法更新資料', { description: getFetchMessage(error) })
  }
  finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
    <div class="mx-auto flex h-16 max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="group flex min-w-0 items-center gap-3" aria-label="回到 RangerX 首頁">
        <div class="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-black tracking-tighter text-primary-foreground shadow-sm shadow-primary/20 transition-transform group-hover:-rotate-3">
          RX
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-bold leading-none tracking-tight sm:text-base">RangerX</p>
          <p class="mt-1 hidden text-[11px] leading-none text-muted-foreground sm:block">LINE Rangers Database</p>
        </div>
      </NuxtLink>

      <Dialog v-model:open="dialogOpen">
        <DialogTrigger as-child>
          <Button variant="outline" size="sm" class="h-9 gap-2 rounded-full bg-background/80 px-3 sm:px-4">
            <RefreshCw class="size-3.5" :class="{ 'animate-spin': status?.status === 'running' }" />
            <span class="hidden max-w-44 truncate sm:inline">{{ statusLabel }}</span>
            <span class="sm:hidden">更新</span>
          </Button>
        </DialogTrigger>
        <DialogContent class="max-w-md rounded-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle class="flex items-center gap-2">
              <Database class="size-5 text-primary" />
              更新 Ranger 資料
            </DialogTitle>
            <DialogDescription>
              將從來源 API 讀取最新資料，只寫入有變更的角色。
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-2">
            <div class="rounded-xl border bg-muted/45 p-3 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted-foreground">目前狀態</span>
                <span class="font-medium">{{ statusLabel }}</span>
              </div>
              <div v-if="status?.status === 'success'" class="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                <ShieldCheck class="size-3.5" />
                上次讀取 {{ status.fetchedCount.toLocaleString() }} 筆資料
              </div>
              <p v-if="status?.errorMessage" class="mt-2 text-xs text-destructive">
                {{ status.errorMessage }}
              </p>
            </div>

            <div class="space-y-1.5">
              <label for="sync-token" class="text-sm font-medium">管理權杖（若有設定）</label>
              <Input
                id="sync-token"
                v-model="token"
                type="password"
                autocomplete="current-password"
                placeholder="NUXT_SYNC_TOKEN"
              />
              <p class="text-xs text-muted-foreground">權杖只用於這次請求，不會儲存在瀏覽器。</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" :disabled="isUpdating" @click="dialogOpen = false">取消</Button>
            <Button :disabled="isUpdating || status?.status === 'running'" class="gap-2" @click="updateRangers">
              <RefreshCw class="size-4" :class="{ 'animate-spin': isUpdating }" />
              {{ isUpdating ? '更新中…' : '立即更新' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </header>
</template>
