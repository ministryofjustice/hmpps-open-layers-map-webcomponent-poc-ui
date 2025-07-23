import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      name: 'MojMap',
      fileName: (format) => `index.${format}.js`,
      formats: ['es']
    },
    target: 'es2022',
    cssCodeSplit: false,
    assetsDir: 'map-assets',
    rollupOptions: {
      external: [
        /^ol\//, 'ol',
        'fs', 'path', 'os', 'dotenv', 'express',
        'http', 'url', 'stream', 'crypto', 'zlib'
      ],
      output: {
        globals: {
          ol: 'ol'
        }
      }
    }
  }
})

