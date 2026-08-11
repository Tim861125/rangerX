<template>
  <div class="min-h-dvh bg-background">
    <AppHeader />
    <main>
      <slot />
    </main>
    <footer class="mt-16 border-t border-border/70 bg-card/60">
      <div class="mx-auto flex max-w-[1480px] flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>RangerX · LINE Rangers 角色資料查詢工具</p>
        <p>資料來源：rangerbook.warmycat.com</p>
      </div>
    </footer>
  </div>
</template>
