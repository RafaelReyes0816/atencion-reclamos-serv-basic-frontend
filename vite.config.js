import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
const BACKEND = 'http://127.0.0.1:8000'

// Rutas que el frontend consume a traves del proxy (URLs relativas).
const RUTAS_API = [
  '/auth',
  '/usuarios',
  '/reclamos',
  '/normativa',
  '/cuadrillas',
  '/areas-comerciales',
  '/seguimiento',
  '/plazos',
  '/reportes',
  '/dashboard',
]

// FastAPI responde con un 307 y un Location absoluto al redirigir
// `/reclamo` -> `/reclamo/`. El navegador seguiria ese Location directo
// contra el backend (otro origen) y lo bloquearia por CORS. Lo reescribimos
// a relativa para que la redireccion siga siendo same-origin.
const corregirLocation = (proxy) => {
  proxy.on('proxyRes', (proxyRes) => {
    const location = proxyRes.headers.location
    if (location && location.startsWith(BACKEND)) {
      proxyRes.headers.location = location.slice(BACKEND.length)
    }
  })
}

const proxy = Object.fromEntries(
  RUTAS_API.map((ruta) => [
    ruta,
    {
      target: BACKEND,
      changeOrigin: true,
      configure: corregirLocation,
    },
  ])
)

export default defineConfig({
  plugins: [react()],
  server: {
    // Sin esto Vite 8 escucha solo en [::1] y http://127.0.0.1:5173 no responde.
    host: '127.0.0.1',
    port: 5173,
    proxy,
  },
  // `pnpm preview` sirve el build de produccion y necesita el mismo proxy;
  // sin esto la app carga pero todas las llamadas a la API fallan.
  preview: {
    host: '127.0.0.1',
    port: 4173,
    proxy,
  },
})
