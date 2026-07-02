import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Match the backend's actual bind host (run.sh binds 127.0.0.1, IPv4).
        // Using "localhost" here can resolve to IPv6 ::1 and fail to connect.
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
