import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../../.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, 'src'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
      },
      external: ['@dfinity/auth-client', '@dfinity/identity', '@dfinity/agent', '@dfinity/principal'],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    include: ['@dfinity/agent', '@dfinity/candid', '@dfinity/principal'],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    environment('all', { prefix: 'CANISTER_' }),
    environment('all', { prefix: 'DFX_' }),
  ],
  resolve: {
    alias: {
      declarations: fileURLToPath(new URL('../declarations', import.meta.url)),
      '@dfinity/auth-client': path.resolve(__dirname, 'node_modules/@dfinity/auth-client/lib/esm/index.js'),
      '@dfinity/identity': path.resolve(__dirname, 'node_modules/@dfinity/identity/lib/esm/index.js'),
      '@dfinity/agent': path.resolve(__dirname, 'node_modules/@dfinity/agent/lib/esm/index.js'),
      '@dfinity/principal': path.resolve(__dirname, 'node_modules/@dfinity/principal/lib/esm/index.js'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});