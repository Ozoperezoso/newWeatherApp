
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'docs',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  }
})
