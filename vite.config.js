import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { certificateApiPlugin } from './server/vite-certificate-plugin.js';

export default defineConfig({
  plugins: [react(), certificateApiPlugin()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
