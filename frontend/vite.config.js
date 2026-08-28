import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The backend has no CORS middleware, so proxy /api in dev to keep requests same-origin.
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
