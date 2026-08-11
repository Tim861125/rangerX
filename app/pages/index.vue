<script setup lang="ts">
import { ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, X } from '@lucide/vue'
import { useDebounceFn } from '@vueuse/core'
import type { RangerFiltersResponse, RangerListResponse, RangerSort } from '~~/shared/types/ranger'

const searchInput = ref('')
const searchQuery = ref('')
const star = ref('all')
const rangerType = ref('all')
const attribute = ref('all')
const sort = ref<RangerSort>('newest')
const page = ref(1)
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
  pageSize: 18,
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
  pageSize: 18,
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
    <section class="relative overflow-hidden border-b bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_8%,white),white_55%,color-mix(in_oklab,var(--accent)_70%,white))]">
      <div class="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full border-[48px] border-primary/5" />
      <div class="pointer-events-none absolute -bottom-20 left-[12%] size-56 rounded-full bg-primary/5 blur-3xl" />
      <div class="relative mx-auto max-w-[1480px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div class="max-w-3xl">
          <Badge variant="outline" class="mb-4 rounded-full border-primary/20 bg-background/70 px-3 py-1 text-primary backdrop-blur">
            角色資料庫
          </Badge>
          <h1 class="text-balance text-3xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            找到最適合你的<br class="hidden sm:block">
            <span class="text-primary">LINE Ranger</span>
          </h1>
          <p class="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            用名稱、ID、技能或能力快速搜尋，再以星數、類型與屬性精準篩選。
          </p>
        </div>

        <div class="relative mt-7 max-w-2xl sm:mt-9">
          <Search class="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchInput"
            aria-label="搜尋 Ranger"
            placeholder="搜尋名稱、ID、技能或關鍵字…"
            class="h-13 rounded-2xl border-border/80 bg-background/90 pl-12 pr-12 text-base shadow-lg shadow-primary/5 backdrop-blur sm:h-14"
          />
          <button
            v-if="searchInput"
            type="button"
            class="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="清除搜尋"
            @click="clearSearch"
          >
            <X class="size-4" />
          </button>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div class="flex gap-8">
        <aside class="hidden w-60 shrink-0 lg:block">
          <div class="sticky top-24 rounded-2xl border bg-card p-5 shadow-sm">
            <RangerFilterPanel
              v-model:star="star"
              v-model:ranger-type="rangerType"
              v-model:attribute="attribute"
              :stars="filters.stars"
              :types="filters.types"
              :attributes="filters.attributes"
            />
          </div>
        </aside>

        <section class="min-w-0 flex-1" aria-labelledby="results-heading">
          <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="results-heading" class="text-lg font-bold tracking-tight sm:text-xl">Ranger 一覽</h2>
              <p class="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                <template v-if="status === 'pending'">正在查詢資料…</template>
                <template v-else>共 {{ pagination.total.toLocaleString() }} 筆結果</template>
              </p>
            </div>

            <div class="flex items-center gap-2">
              <Sheet>
                <SheetTrigger as-child>
                  <Button variant="outline" size="sm" class="relative gap-2 lg:hidden">
                    <Filter class="size-4" />
                    篩選
                    <span v-if="activeFilterCount" class="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {{ activeFilterCount }}
                    </span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" class="max-h-[85dvh] rounded-t-3xl px-5 pb-8">
                  <SheetHeader class="text-left">
                    <SheetTitle>篩選 Ranger</SheetTitle>
                    <SheetDescription>選擇星數、類型或屬性。</SheetDescription>
                  </SheetHeader>
                  <ScrollArea class="mt-5 max-h-[58dvh] pr-3">
                    <RangerFilterPanel
                      v-model:star="star"
                      v-model:ranger-type="rangerType"
                      v-model:attribute="attribute"
                      :stars="filters.stars"
                      :types="filters.types"
                      :attributes="filters.attributes"
                    />
                  </ScrollArea>
                </SheetContent>
              </Sheet>

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

          <div v-if="status === 'pending'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card v-for="index in 9" :key="index" class="gap-0 overflow-hidden py-0">
              <Skeleton class="h-40 rounded-none sm:h-48" />
              <div class="space-y-3 p-5">
                <Skeleton class="h-5 w-2/3" />
                <Skeleton class="h-4 w-full" />
                <Skeleton class="h-4 w-4/5" />
              </div>
            </Card>
          </div>

          <Card v-else-if="error" class="border-destructive/30 py-10 text-center">
            <CardContent>
              <p class="font-semibold text-destructive">無法讀取 Ranger 資料</p>
              <p class="mt-2 text-sm text-muted-foreground">請確認已套用 D1 migration，或稍後再試。</p>
            </CardContent>
          </Card>

          <div v-else-if="rangers.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        </section>
      </div>
    </div>
  </div>
</template>
