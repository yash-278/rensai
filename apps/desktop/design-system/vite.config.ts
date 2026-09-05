import { defineConfig } from 'vite';
import path from 'node:path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  root: __dirname,
  base: './',
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: [
      {
        find: '@/renderer/features/library/utils',
        replacement: path.resolve(__dirname, 'library-fixture.ts'),
      },
      { find: '@', replacement: path.resolve(__dirname, '../src') },
    ],
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: path.resolve(__dirname, '../tailwind.config.js') }),
        autoprefixer(),
      ],
    },
  },
  server: { host: '127.0.0.1', port: 4317, strictPort: true },
  build: {
    target: 'esnext',
    outDir: '../out/design-system',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        search: path.resolve(__dirname, 'search.html'),
      },
    },
  },
});
