
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/newWeatherApp/',
  root: 'docs',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  }
})
