import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  resolve: {
    alias: {
      // Keep no-op aliases for optional WebGPU entrypoints imported by globe deps.
      // This avoids bundling/runtime failures when those modules are referenced.
      'three/webgpu': path.resolve('./src/stubs/three-webgpu.js'),
      'three/tsl':    path.resolve('./src/stubs/three-tsl.js'),
    },
  },
});
