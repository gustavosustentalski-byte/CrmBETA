import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração ajustada para o diretório "frontend"
export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  build: {
    outDir: '../dist',
  },
})
