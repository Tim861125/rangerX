<script setup lang="ts">
import { ChevronLeft, ChevronRight, Search, Settings, SlidersHorizontal, X } from '@lucide/vue'
import { useDebounceFn } from '@vueuse/core'
import type { RangerFiltersResponse, RangerListResponse, RangerSort } from '~~/shared/types/ranger'

const searchInput = ref('')
const searchQuery = ref('')
const star = ref('all')
const rangerType = ref('all')
const attribute = ref('all')
const sort = ref<RangerSort>('newest')
const page = ref(1)
const filterOpen = ref(false)
// During SSR this retains the current H3 event (including Cloudflare's D1
// binding). The global $fetch creates a new local request without that context.
const requestFetch = useRequestFetch()

const { data: filterResponse } = await useAsyncData<RangerFiltersResponse>(
  'ranger-filters',
  () => requestFetch<RangerFiltersResponse>('/api/rangers/GetFilters' as string),
)

const requestQuery = computed(() => ({
  q: searchQuery.value || undefined,
  star: star.value === 'all' ? undefined : star.value,
  type: rangerType.value === 'all' ? undefined : rangerType.value,
  attribute: attribute.value === 'all' ? undefined : attribute.value,
  sort: sort.value,
  page: page.value,
  pageSize: 108,
}))

const {
  data: rangerResponse,
  status,
  error,
} = await useAsyncData<RangerListResponse>(
  'rangers',
  () => requestFetch<RangerListResponse>('/api/rangers/GetRangers' as string, { query: requestQuery.value }),
  { watch: [requestQuery] },
)

const filters = computed(() => filterResponse.value?.data ?? { stars: [], types: [], attributes: [] })
const rangers = computed(() => rangerResponse.value?.data ?? [])
const pagination = computed(() => rangerResponse.value?.pagination ?? {
  page: 1,
  pageSize: 108,
  total: 0,
  totalPages: 0,
})
const activeFilterCount = computed(() => [star.value, rangerType.value, attribute.value].filter(value => value !== 'all').length)

const commitSearch = useDebounceFn(() => {
  searchQuery.value = searchInput.value.trim()
  page.value = 1
}, 250)

watch(searchInput, commitSearch)
watch([star, rangerType, attribute, sort], () => {
  page.value = 1
})

function clearSearch(): void {
  searchInput.value = ''
  searchQuery.value = ''
  page.value = 1
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
</script>

<template>
  <div class="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <!-- 頂部工具列：標題、搜尋篩選與排序 -->
    <div class="mb-6 flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 id="results-heading" class="text-lg font-bold tracking-tight sm:text-xl">Ranger 一覽</h1>
          <span class="rounded border border-border/80 bg-muted/80 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
            <template v-if="status === 'pending'">QUERYING...</template>
            <template v-else>[ {{ pagination.total.toLocaleString() }} UNITS ]</template>
          </span>
        </div>
        <p class="mt-1 text-xs text-muted-foreground font-mono">
          SYSTEM.QUERY // LINE_RANGERS_ARCHIVE
        </p>
      </div>

      <div class="flex items-center gap-2 sm:gap-2.5">
        <!-- 搜尋與篩選列 (HUD Terminal Prompt 質感) -->
        <div class="group relative flex items-center rounded-lg border border-border/90 bg-card px-3 py-1.5 shadow-2xs transition-all focus-within:border-primary/90 focus-within:shadow-[0_0_12px_rgba(56,189,248,0.2)] flex-1 md:w-72 lg:w-80">
          <Search class="shrink-0 size-4 text-muted-foreground mr-2 group-focus-within:text-primary transition-colors" />
          <Input
            v-model="searchInput"
            aria-label="搜尋 Ranger"
            placeholder="搜尋名稱、ID、技能…"
            class="h-7 border-0 bg-transparent p-0 shadow-none text-sm font-sans placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:outline-none flex-1 min-w-0"
          />
          <button
            v-if="searchInput"
            type="button"
            class="shrink-0 grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground mr-1"
            aria-label="清除搜尋"
            @click="clearSearch"
          >
            <X class="size-3.5" />
          </button>
          <Dialog v-model:open="filterOpen">
            <DialogTrigger as-child>
              <button
                type="button"
                class="shrink-0 grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground relative transition-colors"
                aria-label="篩選設定"
              >
                <Settings class="size-4" :class="{ 'text-primary': activeFilterCount > 0 }" />
                <span
                  v-if="activeFilterCount"
                  class="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-mono font-bold text-primary-foreground shadow"
                >
                  {{ activeFilterCount }}
                </span>
              </button>
            </DialogTrigger>
            <DialogContent class="max-w-md rounded-xl border border-border bg-card sm:rounded-xl">
              <DialogHeader class="text-left">
                <DialogTitle class="flex items-center gap-2">
                  <SlidersHorizontal class="size-4 text-primary" />
                  篩選 Ranger
                </DialogTitle>
                <DialogDescription>選擇星數、類型或屬性以篩選資料庫。</DialogDescription>
              </DialogHeader>
              <ScrollArea class="max-h-[58dvh] pr-2">
                <RangerFilterPanel
                  v-model:star="star"
                  v-model:ranger-type="rangerType"
                  v-model:attribute="attribute"
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
          <SelectTrigger class="w-[124px] shrink-0 rounded-lg border-border/90 bg-card sm:w-[144px] font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" class="rounded-lg border-border bg-card">
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

    <div v-if="status === 'pending'" class="grid grid-cols-3 min-[440px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2 sm:gap-2.5 lg:gap-3">
      <div v-for="index in 108" :key="index" class="aspect-square w-full animate-pulse rounded-lg border border-border/40 bg-card/60" />
    </div>

    <Card v-else-if="error" class="border-destructive/30 bg-card/90 py-10 text-center rounded-xl">
      <CardContent>
        <p class="font-semibold text-destructive">無法讀取 Ranger 資料</p>
        <p class="mt-2 text-sm text-muted-foreground">請確認已套用 D1 migration，或稍後再試。</p>
      </CardContent>
    </Card>

    <div v-else-if="rangers.length" class="grid grid-cols-3 min-[440px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2 sm:gap-2.5 lg:gap-3">
      <RangerCard v-for="ranger in rangers" :key="ranger.rangerId" :ranger="ranger" />
    </div>

    <Card v-else class="border-dashed border-border/80 bg-card/60 py-12 text-center rounded-xl">
      <CardContent class="flex flex-col items-center">
        <div class="grid size-12 place-items-center rounded-lg border border-border bg-muted/60">
          <Search class="size-5 text-muted-foreground" />
        </div>
        <p class="mt-4 font-semibold">找不到符合條件的 Ranger</p>
        <p class="mt-1 text-sm text-muted-foreground">試著縮短關鍵字或清除部分篩選。</p>
      </CardContent>
    </Card>

    <nav v-if="pagination.totalPages > 1" class="mt-8 flex items-center justify-between border-t border-border/80 pt-6" aria-label="分頁">
      <Button variant="outline" size="sm" :disabled="page <= 1" class="gap-1 rounded-lg font-mono text-xs border-border/80 bg-card" @click="previousPage">
        <ChevronLeft class="size-4" />
        PREV
      </Button>
      <div class="flex items-center gap-1 font-mono">
        <Button
          v-for="pageNumber in pageNumbers()"
          :key="pageNumber"
          :variant="pageNumber === page ? 'default' : 'ghost'"
          size="icon-sm"
          class="rounded-lg text-xs"
          :aria-current="pageNumber === page ? 'page' : undefined"
          @click="page = pageNumber; scrollToResults()"
        >
          {{ pageNumber }}
        </Button>
        <span class="ml-2 hidden text-xs text-muted-foreground sm:inline">/ {{ pagination.totalPages }} PAGES</span>
      </div>
      <Button variant="outline" size="sm" :disabled="page >= pagination.totalPages" class="gap-1 rounded-lg font-mono text-xs border-border/80 bg-card" @click="nextPage">
        NEXT
        <ChevronRight class="size-4" />
      </Button>
    </nav>
  </div>
</template>