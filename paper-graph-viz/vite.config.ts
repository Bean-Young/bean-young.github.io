import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: '/paper-graph/',
  build: {
    outDir: resolve(__dirname, '../paper-graph'),
    emptyOutDir: true,
  },
});
