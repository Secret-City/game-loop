import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/game-loop/dist/', // <-- Correct location
    server: {
        port: 5173 // You can change this if needed
    }
});
