import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function clientPortalDevRewrite() {
  return {
    name: 'client-portal-dev-rewrite',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = req.url?.split('?')[0] || ''
        if (/^\/cliente\/[^/]+/.test(path)) {
          req.url = '/cliente.html'
        }
        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), clientPortalDevRewrite()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          horas: 'horas.html',
          dashboard: 'dashboard.html',
          pocRestaurante: 'poc-restaurante.html',
          cliente: 'cliente.html',
          docsLonglife: 'docs-longlife.html',
          docsLonglifeV2: 'docs-longlife-v2.html',
        },
      },
    },
  }
})
