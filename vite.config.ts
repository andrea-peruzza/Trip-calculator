import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // Forza IPv4 evitando i conflitti di permessi su IPv6 (::1) in Windows
    port: 5173,        // Porta standard Vite (evita conflitti con Hyper-V/WSL su porta 3000)
    strictPort: false, // Se occupata, passa automaticamente a 5174, 5175...
    open: true
  }
});

