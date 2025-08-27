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
          external: (id) =>
            id === 'ol' || /^ol\//.test(id) ||
            id === 'govuk-frontend' || /^govuk-frontend\//.test(id),
        }
      }
    : undefined,

  server: {
    proxy: {
      '/os': {
        target: 'https://api.os.uk',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/os/, '')
      }
    },
    open: true
  }
})
