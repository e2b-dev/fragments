// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore Ignored to pass Vercel deployment
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  vite: {
    server: {
      hmr: {
        protocol: 'wss'
      }
    }
  }
})
