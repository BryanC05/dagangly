import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '', '');
  const apiUrl = env.VITE_API_URL || '/api';
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000';
  const isAbsoluteApi = /^https?:\/\//i.test(apiUrl);
  const proxyTarget = (isAbsoluteApi ? apiUrl.replace(/\/api\/?$/, '') : backendUrl).replace(/\/+$/, '');

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'GOOGLEMAPS_'],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    build: {
      chunkSizeWarningLimit: 550,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('leaflet')) {
                return 'vendor-leaflet';
              }
              if (id.includes('recharts')) {
                return 'vendor-recharts';
              }
              if (id.includes('d3-') || id.includes('/d3/')) {
                return 'vendor-d3';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-radix';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
            }
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
})
