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
  pageSize: 160,
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
  pageSize: 160,
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
    window.scrollTo({ top: 300, behavior: 'smooth' })
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
  <div>
    <section class="border-b bg-background">
      <div class="relative mx-auto max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div class="mx-auto max-w-[600px]">
          <div class="group relative w-full">
            <div class="flex items-center rounded-full border border-border bg-background px-5 py-2.5 shadow-sm hover:shadow-md transition-shadow">
              <Search class="shrink-0 size-5 text-muted-foreground mr-2.5" />
              <Input
                v-model="searchInput"
                aria-label="搜尋 Ranger"
                placeholder="搜尋名稱、ID、技能或關鍵字…"
                class="h-8 border-0 bg-transparent p-0 shadow-none text-base focus-visible:ring-0 focus-visible:outline-none flex-1"
              />
              <button
                v-if="searchInput"
                type="button"
                class="shrink-0 grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="清除搜尋"
                @click="clearSearch"
              >
                <X class="size-4" />
              </button>
              <Dialog v-model:open="filterOpen">
                <DialogTrigger as-child>
                  <button
                    type="button"
                    class="shrink-0 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground ml-1"
                    aria-label="篩選設定"
                  >
                    <Settings class="size-5" :class="{ 'text-foreground': activeFilterCount > 0 }" />
                    <span
                      v-if="activeFilterCount"
                      class="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow"
                    >
                      {{ activeFilterCount }}
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent class="max-w-md rounded-2xl sm:rounded-2xl">
                  <DialogHeader class="text-left">
                    <DialogTitle>篩選 Ranger</DialogTitle>
                    <DialogDescription>選擇星數、類型或屬性。</DialogDescription>
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
          </div>
        </div>
      </div>
    </section>

    <main class="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div class="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 id="results-heading" class="text-lg font-bold tracking-tight sm:text-xl">Ranger 一覽</h2>
          <p class="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            <template v-if="status === 'pending'">正在查詢資料…</template>
            <template v-else>共 {{ pagination.total.toLocaleString() }} 筆結果</template>
          </p>
        </div>

        <div class="flex items-center gap-2">
          <div class="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <SlidersHorizontal class="size-3.5" />
            排序
          </div>
          <Select v-model="sort">
            <SelectTrigger class="w-[132px] bg-background sm:w-[156px]">
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

      <div v-if="status === 'pending'" class="grid grid-cols-16 gap-1 sm:gap-1.5">
        <div v-for="index in 160" :key="index" class="aspect-square w-full animate-pulse rounded-lg sm:rounded-xl border border-border/30 bg-muted/40" />
      </div>

      <Card v-else-if="error" class="border-destructive/30 py-10 text-center">
        <CardContent>
          <p class="font-semibold text-destructive">無法讀取 Ranger 資料</p>
          <p class="mt-2 text-sm text-muted-foreground">請確認已套用 D1 migration，或稍後再試。</p>
        </CardContent>
      </Card>

      <div v-else-if="rangers.length" class="grid grid-cols-16 gap-1 sm:gap-1.5">
        <RangerCard v-for="ranger in rangers" :key="ranger.rangerId" :ranger="ranger" />
      </div>

      <Card v-else class="border-dashed py-12 text-center">
        <CardContent class="flex flex-col items-center">
          <div class="grid size-12 place-items-center rounded-full bg-muted">
            <Search class="size-5 text-muted-foreground" />
          </div>
          <p class="mt-4 font-semibold">找不到符合條件的 Ranger</p>
          <p class="mt-1 text-sm text-muted-foreground">試著縮短關鍵字或清除部分篩選。</p>
        </CardContent>
      </Card>

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
    </main>
  </div>
</template>