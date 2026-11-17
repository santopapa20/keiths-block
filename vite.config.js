import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative paths, so the built site works from any folder: the root of a domain
  // or a sub-path such as GitHub Pages' /keiths-block/.
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
})
