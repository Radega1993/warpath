import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@warpath/shared': path.resolve(__dirname, '../../packages/shared/src'),
        },
    },
    optimizeDeps: {
        include: ['@warpath/shared'],
        esbuildOptions: {
            target: 'es2020',
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/socket.io': {
                target: 'http://localhost:3001',
                ws: true,
            },
        },
    },
});

