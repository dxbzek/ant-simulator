import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 1200, // three+r3f stack is intentionally large
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // Isolate the heavy 3D stack; everything else stays in the main bundle
          if (id.includes('/three/') || id.includes('/three-') ||
              id.includes('/postprocessing/') || id.includes('/@react-three/')) {
            return 'three'
          }
          return
        },
      },
    },
  },
})
