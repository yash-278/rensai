import { defineConfig } from 'vite';
import path from 'node:path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  root: __dirname,
  base: './',
  esbuild: { jsx: 'automatic' },
  plugins: [nodePolyfills({ include: ['path'] })],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, '../src') }],
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
        library: path.resolve(__dirname, 'library.html'),
        series: path.resolve(__dirname, 'series.html'),
        downloads: path.resolve(__dirname, 'downloads.html'),
        sources: path.resolve(__dirname, 'sources.html'),
        settings: path.resolve(__dirname, 'settings.html'),
      },
    },
  },
});
