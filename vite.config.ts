import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// ĐÃ THAY ĐỔI
const base = './'; 

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        base: base, // DÒNG NÀY SẼ LÀ base: './',
        define: {
            // ... (các cấu hình define khác)
        },
        resolve: {
            // ...
        }
    };
});
