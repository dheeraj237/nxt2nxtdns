import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project sites are served under /<repo-name>/, set via BASE_PATH in CI.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
