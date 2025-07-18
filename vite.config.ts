import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/scripts/moj-map.ts',
      name: 'MojMap',
      fileName: (format) => `moj-map.${format}.js`,
      formats: ['es', 'iife']
    },
    target: 'es2022',
  },
});
