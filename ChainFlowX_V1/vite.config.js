import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  resolve: {
    alias: {
      // three-globe v2.45 imports three/webgpu + three/tsl which don't exist
      // in three v0.160. Redirect to no-op stubs so the bundle won't break.
      'three/webgpu': path.resolve('./src/stubs/three-webgpu.js'),
      'three/tsl':    path.resolve('./src/stubs/three-tsl.js'),
    },
  },
});
