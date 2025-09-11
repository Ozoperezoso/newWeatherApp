
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/newWeatherApp/',
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  }
})
