import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8084,
    hmr: {
      overlay: false
    }
  },
  plugins: [
    react(),
    // mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "buffer": "buffer",
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.browser': true,
  },
  optimizeDeps: {
    exclude: ['pg'],
    include: ['buffer'],
  },
  build: {
    rollupOptions: {
      external: ['pg'],
    },
  },
}));
