<script setup lang="ts">
import { CheckCircle2, ChevronLeft, ChevronRight, CircleDot, RotateCcw, Search, Settings, SlidersHorizontal, Sparkles, X } from '@lucide/vue'
import { useDebounceFn } from '@vueuse/core'
import { toast } from 'vue-sonner'
import type { CollectionDataResponse, RangerFiltersResponse, RangerListResponse, RangerSort, UpdateCollectionResponse } from '~~/shared/types/ranger'

const searchInput = ref('')
const searchQuery = ref('')
const star = ref('all')
const rangerType = ref('all')
const attribute = ref('all')
const collectionStatus = ref('all')
const sort = ref<RangerSort>('newest')
const page = ref(1)
const filterOpen = ref(false)

const requestFetch = useRequestFetch()

// 讀取全域篩選選單
const { data: filterResponse } = await useAsyncData<RangerFiltersResponse>(
  'ranger-filters',
  () => requestFetch<RangerFiltersResponse>('/api/rangers/GetFilters' as string),
)

// 讀取全域收集狀態資料表與統計
const { data: collectionResponse, refresh: refreshCollection } = await useAsyncData<CollectionDataResponse>(
  'ranger-collection',
  () => requestFetch<CollectionDataResponse>('/api/collection/GetCollection' as string),
)

const statuses = ref<Record<string, number>>({})
watch(() => collectionResponse.value?.data.statuses, (newStatuses) => {
  if (newStatuses) {
    statuses.value = { ...newStatuses }
  }
}, { immediate: true })

const stats = computed(() => {
  return collectionResponse.value?.data.stats ?? {
    total: 0,
    obtained: 0,
    checked: 0,
    unobtained: 0,
    obtainedPercentage: 0,
    checkedPercentage: 0,
  }
})

const requestQuery = computed(() => ({
  q: searchQuery.value || undefined,
  star: star.value === 'all' ? undefined : star.value,
  type: rangerType.value === 'all' ? undefined : rangerType.value,
  attribute: attribute.value === 'all' ? undefined : attribute.value,
  status: collectionStatus.value === 'all' ? undefined : collectionStatus.value,
  sort: sort.value,
  page: page.value,
  pageSize: 160,
}))

const {
  data: rangerResponse,
  status,
  error,
  refresh: refreshRangers,
} = await useAsyncData<RangerListResponse>(
  'collection-rangers',
  () => requestFetch<RangerListResponse>('/api/rangers/GetRangers' as string, { query: requestQuery.value }),
  { watch: [requestQuery] },
)

const filters = computed(() => filterResponse.value?.data ?? { stars: [], types: [], attributes: [] })
const rangers = computed(() => rangerResponse.value?.data ?? [])
const pagination = computed(() => rangerResponse.value?.pagination ?? {
  page: 1,
  pageSize: 160,
  total: 0,
  totalPages: 0,
})

const activeFilterCount = computed(() => {
  return [star.value, rangerType.value, attribute.value, collectionStatus.value].filter(value => value !== 'all').length
})

const commitSearch = useDebounceFn(() => {
  searchQuery.value = searchInput.value.trim()
  page.value = 1
}, 250)

watch(searchInput, commitSearch)
watch([star, rangerType, attribute, collectionStatus, sort], () => {
  page.value = 1
})

function clearSearch(): void {
  searchInput.value = ''
  searchQuery.value = ''
  page.value = 1
}

function resetAllFilters(): void {
  clearSearch()
  star.value = 'all'
  rangerType.value = 'all'
  attribute.value = 'all'
  collectionStatus.value = 'all'
}

function previousPage(): void {
  if (page.value > 1) {
    page.value -= 1
    scrollToResults()
  }
}

function nextPage(): void {
  if (page.value < pagination.value.totalPages) {
    page.value += 1
    scrollToResults()
  }
}

function scrollToResults(): void {
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function pageNumbers(): number[] {
  const total = pagination.value.totalPages
  const current = page.value
  const start = Math.max(1, Math.min(current - 1, total - 2))
  return Array.from({ length: Math.min(3, total) }, (_, index) => start + index)
}

// 樂觀切換收集狀態 (0: 未擁有 ➔ 1: 已擁有 ➔ 2: 打勾 ➔ 0)
async function toggleStatus(rangerId: string): Promise<void> {
  const currentStatus = statuses.value[rangerId] || 0
  const nextStatus = (currentStatus + 1) % 3

  // 樂觀更新前端狀態
  statuses.value[rangerId] = nextStatus

  try {
    const result = await $fetch<UpdateCollectionResponse>('/api/collection/UpdateStatus', {
      method: 'POST',
      body: {
        rangerId,
        status: nextStatus,
      },
    })

    if (collectionResponse.value?.data) {
      collectionResponse.value.data.stats = result.data.stats
    }

    // 如果當前有套用狀態篩選，重新查詢清單以保持分頁精確
    if (collectionStatus.value !== 'all') {
      await refreshRangers()
    }
  }
  catch {
    // 失敗時回滾
    statuses.value[rangerId] = currentStatus
    toast.error('無法更新收集狀態，請稍後再試。')
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <!-- 頂部工具列：收集卡牌標題、統計徽章、搜尋篩選與排序 -->
    <div class="mb-6 flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <h1 id="results-heading" class="text-lg font-bold tracking-tight sm:text-xl">收集卡牌</h1>
          <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            收集率 {{ stats.obtainedPercentage }}%
          </span>
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span class="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 font-medium text-amber-600 dark:text-amber-400">
              <Sparkles class="size-3" /> 已擁有 {{ stats.obtained }}
            </span>
            <span class="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 class="size-3" /> 已打勾 {{ stats.checked }}
            </span>
            <span class="hidden sm:inline">· 共 {{ stats.total }} 隻</span>
          </div>
        </div>
        <p class="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          <template v-if="status === 'pending'">正在查詢資料…</template>
          <template v-else>
            共 {{ pagination.total.toLocaleString() }} 筆符合條件 · 點擊卡片循環切換：未擁有 ➔ 已擁有 ➔ 已打勾
          </template>
        </p>
      </div>

      <div class="flex items-center gap-2 sm:gap-2.5">
        <!-- 搜尋與篩選列 -->
        <div class="group relative flex items-center rounded-full border border-border bg-background px-3.5 py-1.5 shadow-2xs hover:shadow-xs transition-shadow flex-1 md:w-72 lg:w-80">
          <Search class="shrink-0 size-4 text-muted-foreground mr-2" />
          <Input
            v-model="searchInput"
            aria-label="搜尋收集簿 Ranger"
            placeholder="搜尋名稱、ID、技能…"
            class="h-7 border-0 bg-transparent p-0 shadow-none text-sm focus-visible:ring-0 focus-visible:outline-none flex-1 min-w-0"
          />
          <button
            v-if="searchInput"
            type="button"
            class="shrink-0 grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground mr-1"
            aria-label="清除搜尋"
            @click="clearSearch"
          >
            <X class="size-3.5" />
          </button>
          <Dialog v-model:open="filterOpen">
            <DialogTrigger as-child>
              <button
                type="button"
                class="shrink-0 grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground relative"
                aria-label="篩選設定"
              >
                <Settings class="size-4" :class="{ 'text-foreground': activeFilterCount > 0 }" />
                <span
                  v-if="activeFilterCount"
                  class="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow"
                >
                  {{ activeFilterCount }}
                </span>
              </button>
            </DialogTrigger>
            <DialogContent class="max-w-md rounded-2xl sm:rounded-2xl">
              <DialogHeader class="text-left">
                <DialogTitle>篩選收集簿</DialogTitle>
                <DialogDescription>依照收集狀態、星數、類型或屬性篩選。</DialogDescription>
              </DialogHeader>
              <ScrollArea class="max-h-[58dvh] pr-2">
                <RangerFilterPanel
                  v-model:star="star"
                  v-model:ranger-type="rangerType"
                  v-model:attribute="attribute"
                  v-model:collection-status="collectionStatus"
                  :show-collection-status="true"
                  :stars="filters.stars"
                  :types="filters.types"
                  :attributes="filters.attributes"
                />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <!-- 排序選單 -->
        <Select v-model="sort">
          <SelectTrigger class="w-[124px] shrink-0 bg-background sm:w-[144px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="newest">最新登場</SelectItem>
            <SelectItem value="oldest">最早登場</SelectItem>
            <SelectItem value="health-desc">體力最高</SelectItem>
            <SelectItem value="physical-desc">物攻最高</SelectItem>
            <SelectItem value="magic-desc">魔攻最高</SelectItem>
            <SelectItem value="cost-asc">礦物最低</SelectItem>
            <SelectItem value="cost-desc">礦物最高</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

      <!-- 讀取骨架屏 -->
      <div v-if="status === 'pending'" class="grid grid-cols-4 min-[420px]:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16 gap-1.5 sm:gap-2">
        <div v-for="index in 160" :key="index" class="aspect-square w-full animate-pulse rounded-lg sm:rounded-xl border border-border/30 bg-muted/40" />
      </div>

      <!-- 錯誤狀態 -->
      <Card v-else-if="error" class="border-destructive/30 py-10 text-center">
        <CardContent>
          <p class="font-semibold text-destructive">無法讀取收集簿資料</p>
          <p class="mt-2 text-sm text-muted-foreground">請確認已套用 D1 migration，或稍後再試。</p>
        </CardContent>
      </Card>

      <!-- 卡片列表 (響應式欄位) -->
      <div v-else-if="rangers.length" class="grid grid-cols-4 min-[420px]:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16 gap-1.5 sm:gap-2">
        <RangerCard
          v-for="ranger in rangers"
          :key="ranger.rangerId"
          :ranger="ranger"
          mode="collection"
          :status="statuses[ranger.rangerId] || 0"
          @toggle="toggleStatus"
        />
      </div>

      <!-- 空資料狀態 -->
      <Card v-else class="border-dashed py-12 text-center">
        <CardContent class="flex flex-col items-center">
          <div class="grid size-12 place-items-center rounded-full bg-muted">
            <Search class="size-5 text-muted-foreground" />
          </div>
          <p class="mt-4 font-semibold">找不到符合條件的 Ranger</p>
          <p class="mt-1 text-sm text-muted-foreground">試著縮短關鍵字或清除篩選條件。</p>
          <Button variant="outline" size="sm" class="mt-4 gap-1.5" @click="resetAllFilters">
            <RotateCcw class="size-3.5" />
            重設所有篩選
          </Button>
        </CardContent>
      </Card>

      <!-- 分頁導覽 -->
      <nav v-if="pagination.totalPages > 1" class="mt-8 flex items-center justify-between border-t pt-6" aria-label="分頁">
        <Button variant="outline" size="sm" :disabled="page <= 1" class="gap-1" @click="previousPage">
          <ChevronLeft class="size-4" />
          上一頁
        </Button>
        <div class="flex items-center gap-1">
          <Button
            v-for="pageNumber in pageNumbers()"
            :key="pageNumber"
            :variant="pageNumber === page ? 'default' : 'ghost'"
            size="icon-sm"
            :aria-current="pageNumber === page ? 'page' : undefined"
            @click="page = pageNumber; scrollToResults()"
          >
            {{ pageNumber }}
          </Button>
          <span class="ml-2 hidden text-xs text-muted-foreground sm:inline">/ {{ pagination.totalPages }} 頁</span>
        </div>
        <Button variant="outline" size="sm" :disabled="page >= pagination.totalPages" class="gap-1" @click="nextPage">
          下一頁
          <ChevronRight class="size-4" />
        </Button>
      </nav>
  </div>
</template>
