import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En ligne, Vercel renvoie /tcg/… vers TCGCSV (voir vercel.json) ; en local, c'est Vite qui le fait.
    proxy: { '/tcg': { target: 'https://tcgcsv.com', changeOrigin: true, rewrite: p => p.replace(/^\/tcg/, '/tcgplayer') } },
  },
})
