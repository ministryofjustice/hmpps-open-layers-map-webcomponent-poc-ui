import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import eslint from 'vite-plugin-eslint2'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const isLibMode = process.env.BUILD === 'lib'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    eslint(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/govuk-frontend/dist/govuk/assets/fonts/*',
          dest: 'assets/fonts',
        },
      ],
    }),
  ],
  root: isLibMode ? undefined : '.',

  build: isLibMode
    ? {
        outDir: 'dist',
        lib: {
          entry: {
            index: 'src/index.ts',
            layers: 'src/scripts/map/layers/index.ts',
            'ordnance-survey-auth': 'src/scripts/ordnance-survey-auth/index.ts',
          },
          name: 'MojMap',
          formats: ['es', 'cjs'],
          fileName: (format, entryName) => {
            if (entryName === 'index') {
              return `index.${format}.js`
            }
            return `${entryName}/index.${format}.js`
          },
        },
        target: 'es2018',
        cssCodeSplit: false,
        assetsDir: 'map-assets',
        rollupOptions: {
          external: id =>
            id === 'ol' ||
            /^ol\//.test(id) ||
            id === 'govuk-frontend' ||
            /^govuk-frontend\//.test(id) ||
            [
              'fs',
              'path',
              'os',
              'dotenv',
              'express',
              'http',
              'https',
              'url',
              'stream',
              'crypto',
              'zlib',
              'util',
              'events',
            ].includes(id),
        },
      }
    : undefined,

  server: {
    open: true,
  },
})
