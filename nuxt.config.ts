import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-11',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  modules: ['shadcn-nuxt', 'nitro-cloudflare-dev'],
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
  nitro: {
    preset: 'cloudflare-pages',
    typescript: {
      tsConfig: {
        compilerOptions: {
          types: ['@cloudflare/workers-types'],
        },
      },
    },
  },
  runtimeConfig: {
    syncToken: '',
  },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-Hant' },
      title: 'RangerX｜LINE Rangers 資料庫',
      meta: [
        { name: 'description', content: '快速搜尋、篩選並比較 LINE Rangers 角色資料。' },
        { name: 'theme-color', content: '#0f766e' },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
