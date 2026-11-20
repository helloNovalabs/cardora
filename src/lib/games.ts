import { cachedJson, pool } from './cache'
import type { Card, GameId, Price, SetInfo } from './types'

export interface GameMeta {
  id: GameId | 'foot' | 'f1'
  name: string
  hint: string
  ready: boolean
  currency?: 'EUR' | 'USD'
}

export const GAMES: GameMeta[] = [
  { id: 'pokemon', name: 'Pokémon', hint: 'Cartes en français · prix Cardmarket', ready: true, currency: 'EUR' },
  { id: 'onepiece', name: 'One Piece', hint: 'Prix TCGplayer en dollars', ready: true, currency: 'USD' },
  { id: 'magic', name: 'Magic', hint: 'Prix Cardmarket', ready: true, currency: 'EUR' },
  { id: 'foot', name: 'Foot', hint: 'Bientôt', ready: false },
  { id: 'f1', name: 'Formule 1', hint: 'Bientôt', ready: false },
]

export const gameName = (g: string) => GAMES.find(x => x.id === g)?.name ?? g

const TCGDEX = 'https://api.tcgdex.net/v2/fr'
const SCRY = 'https://api.scryfall.com'
const OP = 'https://optcgapi.com/api'

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

// ---------- Extensions ----------

export async function listSets(game: GameId): Promise<SetInfo[]> {
  if (game === 'pokemon') {
    type S = { id: string; name: string; logo?: string; cardCount: { total: number; official: number } }
    const d = await cachedJson<S[]>(`${TCGDEX}/sets`, 72)
    return d
      .filter(s => s.cardCount?.official > 0)
      .map(s => ({ id: s.id, name: s.name, total: s.cardCount.official, logo: s.logo ? s.logo + '.webp' : undefined }))
      .reverse()
  }
  if (game === 'magic') {
    type S = { code: string; name: string; card_count: number; icon_svg_uri: string; released_at: string; set_type: string; digital: boolean }
    const d = await cachedJson<{ data: S[] }>(`${SCRY}/sets`, 72)
    const keep = new Set(['core', 'expansion', 'masters', 'draft_innovation', 'commander'])
    return d.data
      .filter(s => !s.digital && keep.has(s.set_type) && s.card_count > 0 && s.released_at <= new Date().toISOString().slice(0, 10))
      .map(s => ({ id: s.code, name: s.name, total: s.card_count, logo: s.icon_svg_uri, date: s.released_at }))
  }
  type S = { set_id: string; set_name: string }
  const d = await cachedJson<S[]>(`${OP}/allSets/`, 72)
  return d
    .map(s => ({ id: s.set_id, name: s.set_name, total: 0 }))
    .sort((a, b) => b.id.localeCompare(a.id, 'en', { numeric: true }))
}

export interface SetData {
  set: SetInfo
  cards: Card[]
  prices: Record<string, Price> // clé = card.key ; vide pour Pokémon (chargé à part)
}

export async function loadSet(game: GameId, setId: string): Promise<SetData> {
  if (game === 'pokemon') {
    type C = { id: string; localId: string; name: string; image?: string }
    type S = { id: string; name: string; logo?: string; releaseDate?: string; cardCount: { official: number }; cards: C[] }
    const s = await cachedJson<S>(`${TCGDEX}/sets/${encodeURIComponent(setId)}`, 72)
    const cards: Card[] = s.cards.map(c => ({
      key: `pokemon:${c.id}`, game, id: c.id, setId: s.id, setName: s.name, number: c.localId, name: c.name,
      image: c.image ? `${c.image}/low.webp` : '',
    }))
    return { set: { id: s.id, name: s.name, total: s.cardCount.official || cards.length, logo: s.logo ? s.logo + '.webp' : undefined, date: s.releaseDate }, cards, prices: {} }
  }
  if (game === 'magic') {
    type C = { id: string; name: string; printed_name?: string; collector_number: string; rarity: string; set: string; set_name: string;
      image_uris?: { normal: string }; card_faces?: { image_uris?: { normal: string } }[]; prices: Record<string, string | null> }
    type P = { data: C[]; has_more: boolean; next_page?: string }
    const all: C[] = []
    let url: string | undefined = `${SCRY}/cards/search?q=${encodeURIComponent(`e:${setId}`)}&unique=prints&order=set`
    while (url) {
      const p: P = await cachedJson<P>(url, 24)
      all.push(...p.data)
      url = p.has_more ? p.next_page : undefined
    }
    const prices: Record<string, Price> = {}
    const cards: Card[] = all.map(c => {
      const key = `magic:${c.id}`
      prices[key] = { value: num(c.prices.eur) ?? num(c.prices.eur_foil), currency: 'EUR', source: 'Cardmarket (via Scryfall)' }
      return {
        key, game, id: c.id, setId: c.set, setName: c.set_name, number: c.collector_number, name: c.name, rarity: c.rarity,
        image: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? '',
      }
    })
    const sets = await listSets('magic')
    const info = sets.find(x => x.id === setId) ?? { id: setId, name: all[0]?.set_name ?? setId, total: cards.length }
    return { set: { ...info, total: cards.length }, cards, prices }
  }
  type C = { card_image_id: string; card_set_id: string; card_name: string; set_name: string; rarity: string; card_image: string; market_price: number | null; inventory_price: number | null }
  const d = await cachedJson<C[]>(`${OP}/sets/${encodeURIComponent(setId)}/`, 24)
  const seen = new Set<string>()
  const prices: Record<string, Price> = {}
  const cards: Card[] = []
  for (const c of d) {
    if (seen.has(c.card_image_id)) continue
    seen.add(c.card_image_id)
    const key = `onepiece:${c.card_image_id}`
    prices[key] = { value: num(c.market_price), low: num(c.inventory_price), currency: 'USD', source: 'TCGplayer' }
    cards.push({
      key, game, id: c.card_image_id, setId, setName: c.set_name, name: c.card_name.replace(/\s*\(\d+\)$/, ''),
      number: c.card_image_id.replace(/^[A-Z]+\d+-/, ''), rarity: c.rarity, image: c.card_image,
    })
  }
  cards.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  return { set: { id: setId, name: d[0]?.set_name ?? setId, total: cards.length }, cards, prices }
}

// ---------- Prix Pokémon (carte par carte, mis en cache) ----------

type CM = { avg?: number; trend?: number; avg7?: number; avg30?: number; low?: number; updated?: string;
  'trend-holo'?: number; 'avg30-holo'?: number; 'avg7-holo'?: number; 'low-holo'?: number }

export interface PokeDetail { rarity?: string; price: Price }

export async function pokemonDetail(id: string): Promise<PokeDetail> {
  const d = await cachedJson<{ rarity?: string; pricing?: { cardmarket?: CM } }>(`${TCGDEX}/cards/${encodeURIComponent(id)}`, 12)
  const cm = d.pricing?.cardmarket
  const pick = (a?: number, b?: number) => num(a) ?? num(b)
  return {
    rarity: d.rarity,
    price: {
      value: pick(cm?.trend, cm?.['trend-holo']) ?? num(cm?.avg),
      avg7: pick(cm?.avg7, cm?.['avg7-holo']),
      avg30: pick(cm?.avg30, cm?.['avg30-holo']),
      low: pick(cm?.low, cm?.['low-holo']),
      currency: 'EUR', source: 'Cardmarket (via TCGdex)', updated: cm?.updated,
    },
  }
}

/** Remplit les prix manquants d'une liste de cartes. Appelle onProgress au fil de l'eau. */
export async function fillPrices(cards: Card[], prices: Record<string, Price>, onProgress: (p: Record<string, Price>) => void) {
  const todo = cards.filter(c => c.game === 'pokemon' && !prices[c.key])
  let last = Date.now()
  await pool(todo, 8, async c => {
    const d = await pokemonDetail(c.id)
    prices[c.key] = d.price
    if (Date.now() - last > 300) { last = Date.now(); onProgress({ ...prices }) }
  })
  onProgress({ ...prices })
}

// ---------- Recherche ----------

export async function searchCards(game: GameId, q: string): Promise<Card[]> {
  q = q.trim()
  if (q.length < 2) return []
  if (game === 'pokemon') {
    type C = { id: string; localId: string; name: string; image?: string }
    const d = await cachedJson<C[]>(`${TCGDEX}/cards?name=${encodeURIComponent(q)}&pagination:itemsPerPage=40`, 6)
    return d
      .map(c => ({
        key: `pokemon:${c.id}`, game, id: c.id, setId: c.id.slice(0, c.id.lastIndexOf('-')), number: c.localId, name: c.name,
        image: c.image ? `${c.image}/low.webp` : '',
      }))
      .sort((a, b) => Number(!!b.image) - Number(!!a.image))
  }
  if (game === 'magic') {
    type C = { id: string; name: string; collector_number: string; set: string; set_name: string; image_uris?: { normal: string }; card_faces?: { image_uris?: { normal: string } }[] }
    try {
      const d = await cachedJson<{ data: C[] }>(`${SCRY}/cards/search?q=${encodeURIComponent(q)}&unique=prints`, 6)
      return d.data.slice(0, 40).map(c => ({
        key: `magic:${c.id}`, game, id: c.id, setId: c.set, setName: c.set_name, number: c.collector_number, name: c.name,
        image: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? '',
      }))
    } catch { return [] }
  }
  return []
}

// ---------- Une carte seule ----------

export async function loadCard(game: GameId, setId: string, id: string): Promise<{ card: Card; price: Price | null }> {
  if (game === 'pokemon') {
    const d = await cachedJson<{ id: string; localId: string; name: string; image?: string; rarity?: string; set: { id: string; name: string } }>(`${TCGDEX}/cards/${encodeURIComponent(id)}`, 12)
    const det = await pokemonDetail(id)
    return {
      card: { key: `pokemon:${d.id}`, game, id: d.id, setId: d.set.id, setName: d.set.name, number: d.localId, name: d.name, rarity: d.rarity, image: d.image ? `${d.image}/high.webp` : '' },
      price: det.price,
    }
  }
  const s = await loadSet(game, setId)
  const card = s.cards.find(c => c.id === id)
  if (!card) throw new Error('Carte introuvable')
  return { card, price: s.prices[card.key] ?? null }
}

export const imgLarge = (c: Card) => (c.game === 'pokemon' ? c.image.replace('/low.webp', '/high.webp') : c.image)
