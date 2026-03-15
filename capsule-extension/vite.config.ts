import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension, { readJsonFile } from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: () => readJsonFile('./manifest.json'),
      additionalInputs: ['sidebar/index.html', 'popup/index.html'],
      disableAutoLaunch: true,
    }),
  ],
  build: {
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    global: 'window',
  },
});
