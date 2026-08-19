<script setup lang="ts">
import { AlertCircle, CheckSquare, Database, LayoutGrid, Loader2, Moon, RefreshCw, RotateCcw, ShieldCheck, Sun } from '@lucide/vue'
import { useDark, useToggle } from '@vueuse/core'
import { toast } from 'vue-sonner'
import type { SyncResultResponse, SyncStatusResponse } from '~~/shared/types/ranger'
import { formatSyncDateTime } from '~~/shared/utils/sync-status'

const route = useRoute()
const dialogOpen = ref(false)
const token = ref('')
const isUpdating = ref(false)
const { data: syncResponse, refresh: refreshStatus } = await useFetch<SyncStatusResponse>('/api/sync/GetStatus' as string)

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
  initialValue: 'dark',
})
const toggleTheme = useToggle(isDark)

const status = computed(() => syncResponse.value?.data)
const isRunning = computed(() => status.value?.status === 'running')

const statusLabel = computed(() => {
  if (!status.value || status.value.status === 'never') return '尚未同步'
  if (status.value.status === 'running') return '同步中…'
  if (status.value.status === 'error') return '上次同步失敗'
  if (!status.value.completedAt) return '已同步'
  return `更新於 ${formatSyncDateTime(status.value.completedAt)}`
})

// === 前端自動輪詢機制 (Polling) ===
let pollTimer: ReturnType<typeof setInterval> | null = null

function startPolling(): void {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    await refreshStatus()
    if (status.value?.status !== 'running') {
      stopPolling()
      if (status.value?.status === 'success') {
        await Promise.all([
          refreshNuxtData('rangers'),
          refreshNuxtData('ranger-filters'),
          refreshNuxtData('collection-data'),
        ])
        if (!isUpdating.value) {
          toast.success('Ranger 資料已同步完成', {
            description: `讀取 ${status.value.fetchedCount.toLocaleString()} 筆資料。`,
          })
        }
      }
    }
  }, 2500)
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

watch(
  () => status.value?.status,
  (newStatus) => {
    if (newStatus === 'running') {
      startPolling()
    }
    else {
      stopPolling()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  stopPolling()
})

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

async function updateRangers(force = false): Promise<void> {
  isUpdating.value = true
  try {
    const headers = token.value ? { authorization: `Bearer ${token.value}` } : undefined
    const result = await $fetch<SyncResultResponse>('/api/sync/UpdateRangers', {
      method: 'POST',
      headers,
      body: force ? { force: true } : undefined,
    })
    await Promise.all([
      refreshStatus(),
      refreshNuxtData('rangers'),
      refreshNuxtData('ranger-filters'),
      refreshNuxtData('collection-data'),
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
  <header class="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl transition-colors">
    <div class="mx-auto flex h-16 max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="group flex min-w-0 items-center gap-3" aria-label="回到 RangerX 首頁">
        <div class="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-black tracking-tighter text-primary-foreground shadow-sm shadow-primary/30 transition-transform group-hover:scale-105 font-mono">
          RX
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p class="truncate text-sm font-bold leading-none tracking-tight sm:text-base">RangerX</p>
            <span class="hidden rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-primary sm:inline-block">HUD_v2</span>
          </div>
          <p class="mt-1 hidden text-[11px] font-mono leading-none text-muted-foreground sm:block">LINE_RANGERS.DB</p>
        </div>
      </NuxtLink>

      <!-- 導覽頁面切換 -->
      <nav class="flex items-center gap-1 rounded-lg border border-border/90 bg-muted/70 p-1 text-xs font-medium sm:text-sm">
        <NuxtLink
          to="/"
          class="flex items-center gap-1.5 rounded-md px-3 py-1.5 sm:px-3.5 transition-all"
          :class="route.path === '/' ? 'bg-card font-semibold text-foreground shadow-xs border border-border/80 text-primary' : 'text-muted-foreground hover:text-foreground'"
        >
          <LayoutGrid class="size-3.5 sm:size-4" />
          <span>角色一覽</span>
        </NuxtLink>
        <NuxtLink
          to="/collection"
          class="flex items-center gap-1.5 rounded-md px-3 py-1.5 sm:px-3.5 transition-all"
          :class="route.path.startsWith('/collection') ? 'bg-card font-semibold text-foreground shadow-xs border border-border/80 text-primary' : 'text-muted-foreground hover:text-foreground'"
        >
          <CheckSquare class="size-3.5 sm:size-4" />
          <span>收集簿</span>
        </NuxtLink>
      </nav>

      <!-- 右側功能按鈕：主題切換與資料更新 -->
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          class="size-9 rounded-lg border-border/80 bg-card hover:bg-muted"
          :title="isDark ? '切換為亮色模式' : '切換為暗色模式'"
          aria-label="切換主題"
          @click="toggleTheme()"
        >
          <Sun v-if="isDark" class="size-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
          <Moon v-else class="size-4 text-primary transition-transform duration-200 hover:-rotate-12" />
        </Button>

        <Dialog v-model:open="dialogOpen">
          <DialogTrigger as-child>
            <Button variant="outline" size="sm" class="h-9 gap-2 rounded-lg border-border/80 bg-card px-3 sm:px-4 font-mono text-xs">
              <RefreshCw class="size-3.5" :class="{ 'animate-spin': isRunning }" />
              <span class="hidden max-w-44 truncate sm:inline">{{ statusLabel }}</span>
              <span class="sm:hidden">更新</span>
            </Button>
          </DialogTrigger>
          <DialogContent class="max-w-md rounded-xl border border-border bg-card sm:rounded-xl">
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
            <div class="space-y-2.5 rounded-xl border bg-muted/45 p-3.5 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted-foreground">目前狀態</span>
                <span
                  class="inline-flex items-center gap-1.5 font-medium"
                  :class="{
                    'text-amber-500 font-semibold': isRunning,
                    'text-destructive': status?.status === 'error',
                    'text-emerald-600 dark:text-emerald-400': status?.status === 'success',
                  }"
                >
                  <span v-if="isRunning" class="relative flex size-2">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span class="relative inline-flex size-2 rounded-full bg-amber-500" />
                  </span>
                  {{ statusLabel }}
                </span>
              </div>

              <!-- 正在同步中的提示 -->
              <div v-if="isRunning" class="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                <Loader2 class="mt-0.5 size-4 shrink-0 animate-spin" />
                <div class="space-y-1">
                  <p class="font-medium">系統正在背景同步中…</p>
                  <p class="text-[11px] leading-relaxed opacity-90">頁面每 2.5 秒會自動偵測進度。若等待超過 2 分鐘或伺服器曾中斷，可使用下方「強制重設並同步」。</p>
                </div>
              </div>

              <!-- 上次成功資訊 -->
              <div v-if="status?.status === 'success'" class="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <ShieldCheck class="size-3.5" />
                上次讀取 {{ status.fetchedCount.toLocaleString() }} 筆資料
              </div>

              <!-- 錯誤訊息提示 -->
              <div v-if="status?.errorMessage" class="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle class="mt-0.5 size-4 shrink-0" />
                <div>
                  <p class="font-medium">同步失敗訊息</p>
                  <p class="mt-0.5 text-[11px] leading-relaxed">{{ status.errorMessage }}</p>
                </div>
              </div>
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

          <DialogFooter class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
            <Button variant="outline" :disabled="isUpdating" @click="dialogOpen = false">取消</Button>

            <!-- 若非本視窗更新中，但狀態處於 running（例如伺服器中斷殘留鎖），提供強制重設並同步按鈕 -->
            <Button
              v-if="isRunning && !isUpdating"
              variant="secondary"
              class="gap-1.5 border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
              @click="updateRangers(true)"
            >
              <RotateCcw class="size-3.5" />
              強制重設並同步
            </Button>

            <Button
              :disabled="isUpdating || isRunning"
              class="gap-2"
              @click="updateRangers(false)"
            >
              <RefreshCw class="size-4" :class="{ 'animate-spin': isUpdating }" />
              {{ isUpdating ? '更新中…' : isRunning ? '背景同步中…' : '立即更新' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  </header>
</template>
