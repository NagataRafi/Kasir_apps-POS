import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Port API server: env PORT, default 4100 (sama dengan server).
const apiPort = process.env.PORT || '4100'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  build: { outDir: 'dist', assetsDir: 'assets' },
})
