import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/usuarios': 'http://127.0.0.1:8000',
      '/reclamos': 'http://127.0.0.1:8000',
      '/normativa': 'http://127.0.0.1:8000',
      '/cuadrillas': 'http://127.0.0.1:8000',
      '/areas-comerciales': 'http://127.0.0.1:8000',
      '/seguimiento': 'http://127.0.0.1:8000',
      '/plazos': 'http://127.0.0.1:8000',
      '/reportes': 'http://127.0.0.1:8000',
    },
  },
})
