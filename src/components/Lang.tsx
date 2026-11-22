import { t as tr } from '../lib/i18n'
import { LangMenu } from './LangMenu'
import { gameMeta } from '../lib/games'
import type { GameId } from '../lib/types'

/** Langues des cartes, avec leur numéro chez Cardmarket (filtre « langue » des offres). */
export const CARD_LANGS = [
  { code: 'fr', tag: 'FR', name: 'Français', cm: 2 },
  { code: 'en', tag: 'EN', name: 'Anglais', cm: 1 },
  { code: 'ja', tag: 'JP', name: 'Japonais', cm: 7 },
  { code: 'de', tag: 'DE', name: 'Allemand', cm: 3 },
  { code: 'es', tag: 'ES', name: 'Espagnol', cm: 4 },
  { code: 'it', tag: 'IT', name: 'Italien', cm: 5 },
  { code: 'pt', tag: 'PT', name: 'Portugais', cm: 8 },
  { code: 'ko', tag: 'KO', name: 'Coréen', cm: 10 },
  { code: 'zh', tag: 'ZH', name: 'Chinois', cm: 11 },
] as const
export type CardLang = (typeof CARD_LANGS)[number]['code']
export const langOf = (c?: string) => CARD_LANGS.find(l => l.code === c)

/** Une étiquette de langue, comme le petit code imprimé en bas des cartes. */
export function LangTag({ code, small = false }: { code?: string; small?: boolean }) {
  const l = langOf(code)
  if (!l) return null
  return <span className={'lang-tag' + (small ? ' sm' : '')} title={tr(l.name)}>{l.tag}</span>
}

/** Choix de la langue d'une carte : un seul bouton, une petite liste. */
export function LangPicker({ value, onChange, label = 'Langue de la carte', any = false }: { value?: string; onChange: (v: string | undefined) => void; label?: string; any?: boolean }) {
  const options = [...(any ? [{ code: '', label: tr('Toutes les langues') }] : []), ...CARD_LANGS.map(l => ({ code: l.code as string, label: tr(l.name), tag: l.tag }))]
  return <LangMenu value={value ?? ''} options={options} label={tr(label)} onChange={c => onChange(c || undefined)} />
}

/** Où acheter une carte : recherches Cardmarket (avec la langue), TCGplayer et eBay. */
export function buyLinks(game: GameId, q: string, lang?: string, extra = '') {
  const cm = gameMeta(game)?.cm
  const l = langOf(lang)
  const e = encodeURIComponent(q)
  return [
    cm && { name: 'Cardmarket', url: `https://www.cardmarket.com/fr/${cm}/Products/Search?searchString=${e}${l ? `&language=${l.cm}` : ''}` },
    { name: 'TCGplayer', url: `https://www.tcgplayer.com/search/all/product?q=${e}` },
    // eBay : le nom avec le numéro et la langue, pour tomber sur la bonne carte
    { name: 'eBay', url: `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent([q, extra, l?.tag].filter(Boolean).join(' '))}` },
  ].filter(Boolean) as { name: string; url: string }[]
}
