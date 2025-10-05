// vite.config.mjs (note the new file extension)

import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(process.cwd(), 'src/main.js'),
      name: 'SCLHubApp',
      fileName: 'sclhub-master',
      formats: ['iife'],
    },
    outDir: 'dist',
    minify: false,
  },
});