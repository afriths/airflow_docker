import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_AIRFLOW_API_URL || 'http://localhost:8081',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
        '/health': {
          target: env.VITE_AIRFLOW_API_URL || 'http://localhost:8081',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      target: 'es2020',
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
            router: ['react-router-dom'],
            query: ['@tanstack/react-query'],
            utils: ['axios'],
          },
          chunkFileNames: isProduction ? 'assets/[name].[hash].js' : 'assets/[name].js',
          entryFileNames: isProduction ? 'assets/[name].[hash].js' : 'assets/[name].js',
          assetFileNames: isProduction ? 'assets/[name].[hash].[ext]' : 'assets/[name].[ext]',
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      __DEV__: !isProduction,
    },
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@mui/material', '@reduxjs/toolkit'],
    },
  };
});
