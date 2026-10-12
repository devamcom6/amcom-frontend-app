import { rmSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

/** Mock-API imagery is only needed when VITE_USE_MOCK_API=true; strip it from real builds. */
function stripMockMedia(enabled: boolean): Plugin {
  return {
    name: 'amcom:strip-mock-media',
    apply: 'build',
    closeBundle() {
      if (!enabled) rmSync(fileURLToPath(new URL('./dist/mock-media', import.meta.url)), { recursive: true, force: true })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), stripMockMedia(env.VITE_USE_MOCK_API === 'true')],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // Proxy API calls to Laravel during local development so cookies/CORS behave like production.
      proxy: env.VITE_DEV_API_PROXY
        ? { '/api': { target: env.VITE_DEV_API_PROXY, changeOrigin: true } }
        : undefined,
    },
    build: {
      target: 'es2022',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia', 'axios'],
          },
        },
      },
    },
  }
})
