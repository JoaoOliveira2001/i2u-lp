import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function applyClientPortalRewrites(req) {
  const path = req.url?.split('?')[0] || ''
  if (/^\/cliente\/[^/]+/.test(path)) {
    req.url = '/cliente.html'
  } else if (path === '/investimento-midia' || path === '/investimento-midia/') {
    req.url = '/investimento-midia.html'
  } else if (/^\/docs\/[^/]+/.test(path)) {
    req.url = '/docs/longlife.html'
  } else if (path === '/filas' || path === '/filas/') {
    req.url = '/filas.html'
  }
}

function clientPortalDevRewrite() {
  return {
    name: 'client-portal-dev-rewrite',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        applyClientPortalRewrites(req)
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        applyClientPortalRewrites(req)
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
          investimentoMidia: 'investimento-midia.html',
          pocRestaurante: 'poc-restaurante.html',
          cliente: 'cliente.html',
          docsLonglife: 'docs/longlife.html',
          filas: 'filas.html',
        },
      },
    },
  }
})
