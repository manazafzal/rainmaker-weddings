import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { htmlPartials, htmlBase } from './build/html-partials.js';

// Every HTML page at the project root is an entry point.
const pages = ['index', 'experiences', 'portfolio', 'story', 'process', 'journal', 'enquire', '404'];

// BASE_PATH lets the same code run at a domain root (default) or a sub-path,
// e.g. `BASE_PATH=/rainmaker-weddings/ npm run build` for GitHub Pages.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [htmlPartials(), htmlBase()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(import.meta.dirname, `${p}.html`)])),
    },
  },
  server: { host: true },
});
