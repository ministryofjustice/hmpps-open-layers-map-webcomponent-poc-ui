import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import eslint from 'vite-plugin-eslint'
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
            converters: 'src/converters/index.ts',
            layers: 'src/scripts/map/layers/index.ts',
            'tile-token-proxy': 'src/scripts/tile-token-proxy/index.ts',
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
        /* Don’t bundle peer dependencies (ol and govuk-frontend).
         - `ol`: we want the consuming app to provide its own OpenLayers instance so there’s only one copy
           at runtime (avoids API/type mismatches).
         - `govuk-frontend`: we want the app to control its GOV.UK Frontend version and CSS, not have
           this component silently upgrade it.
         Marking them as `external` ensures Rollup/Vite leaves the import in the output,
         so the consuming app’s version is used instead of bundling our own. */
        rollupOptions: {
          external: id => id === 'ol' || /^ol\//.test(id) || id === 'govuk-frontend' || /^govuk-frontend\//.test(id),
        },
      }
    : undefined,

  server: {
    proxy: {
      '/os': {
        target: 'https://api.os.uk',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/os/, ''),
      },
    },
    open: true,
  },
})
