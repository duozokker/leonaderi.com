import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/reactflow')) return 'vendor-reactflow'
          if (id.includes('node_modules/konva') || id.includes('node_modules/react-konva')) return 'vendor-konva'
        },
      },
    },
  },
})
