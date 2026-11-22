/** Dans quelle langue on affiche Pokémon. Un seul jeu, la langue se choisit ensuite. */
export const POKE_LANGS = [
  { code: 'fr', tag: 'FR', label: 'Français' },
  { code: 'en', tag: 'EN', label: 'English' },
  { code: 'de', tag: 'DE', label: 'Deutsch' },
  { code: 'es', tag: 'ES', label: 'Español' },
  { code: 'it', tag: 'IT', label: 'Italiano' },
  { code: 'pt', tag: 'PT', label: 'Português' },
  { code: 'ja', tag: 'JP', label: '日本語' },
]
const KEY = 'cardora-pokemon-langue'
let cur = 'fr'
try { const s = localStorage.getItem(KEY); if (s && POKE_LANGS.some(l => l.code === s)) cur = s } catch { /* rien */ }
export const getPokeLang = () => cur
export function setPokeLang(l: string) {
  cur = l
  try { localStorage.setItem(KEY, l) } catch { /* rien */ }
}
