import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    https: {
      key: './localhost-key.pem',
      cert: './localhost.pem',
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Requested-With'
    }
  },
  plugins: [react()],
  assetsInclude: ['**/*.ttf'], // Ensure font files are handled as assets
});
