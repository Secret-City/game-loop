import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [react()],
    base: mode === 'production' ? '/game-loop/dist/' : '/', // '/' for dev, '/game-loop/dist/' for prod
    define: {
        __MAP_URL__: JSON.stringify(
            mode === 'production' ? '/get-drone-map' : 'http://towerloop:1880/get-drone-map'
        ),
    },
    server: {
        port: 5173, // Default Vite port
        open: true, // Auto-open browser
        host: 'localhost', // Bind to localhost
        hmr: true, // Enable hot module replacement
        proxy: {
            '/ws': { // Proxy WebSocket requests to Node-RED
                target: 'ws://towerloop:1880', // Adjust to your Node-RED WebSocket URL
                ws: true,
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        assetsInclude: ['**/*.mp4'], // Support video assets for VideoScreen
    },
}));