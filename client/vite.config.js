import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves the site from /stackhacks/; the deploy workflow sets BASE_PATH.
  // Local dev and other hosts keep the root path.
  base: process.env.BASE_PATH || '/',
})
