import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  optimizeDeps: { include: ['cubejs'] },
  build: {
    commonjsOptions: { include: [/node_modules/, /vendor[\\/]cubejs/] },
    rollupOptions: { output: { manualChunks: { three: ['three', 'three/examples/jsm/controls/OrbitControls.js'], react: ['react', 'react-dom', 'react-router-dom'] } } },
  },
});
