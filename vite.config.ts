import { defineConfig } from 'vite'

export default defineConfig({
  base: '/pothole-game/',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    host: true,
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
  },
  assetsInclude: ['**/*.wasm'],
})
