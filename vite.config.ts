import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MojMap',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'iife']
    },
    target: 'es2022',
    rollupOptions: {
      external: [
        'fs', 'path', 'os', 'dotenv', 'express',
        'http', 'url', 'stream', 'crypto', 'zlib'
      ]
    }
  }
})

