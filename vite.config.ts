import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const isLibMode = process.env.BUILD === 'lib'

export default defineConfig({
  plugins: [tsconfigPaths()],
  root: isLibMode ? undefined : '.',
  build: isLibMode
    ? {
        outDir: 'dist',
        lib: {
          entry: 'src/index.ts',
          name: 'MojMap',
          fileName: (format) => `index.${format}.js`,
          formats: ['es']
        },
        target: 'es2018',
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
    : undefined,
  server: {
    proxy: {
      '/os': {
        target: 'https://api.os.uk',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/os/, ''),
      },
    },
    open: true,
  }
})
