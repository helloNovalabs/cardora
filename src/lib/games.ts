import { getPokeLang } from './pokeLang'
import { cachedJson, pool } from './cache'
import type { Card, GameId, Price, SetInfo } from './types'
import { tcgImage, tcgSet, tcgSets, type TcgSealed } from './tcg'
import { sportSet, SPORT_SETS } from './sport'

export interface GameMeta {
  id: GameId
  name: string
  hint: string
  ready: boolean
  currency?: 'EUR' | 'USD'
  color: string
  art?: string
  artPos?: string
  /** Rangement sur la page des jeux */
  shelf: 'big' | 'sport' | 'more'
  /** Numéro du jeu chez TCGplayer (prix et listes via TCGCSV) */
  tcg?: number
  /** Nom du jeu dans les adresses Cardmarket */
  cm?: string
}

const tp = (id: number) => tcgImage(id, '400w')
const T = (id: GameId, name: string, tcg: number, color: string, art: number, shelf: GameMeta['shelf'], cm?: string, hint = 'Prix TCGplayer en dollars'): GameMeta =>
  ({ id, name, hint, ready: true, currency: 'USD', color, art: tp(art), shelf, tcg, cm })

export const GAMES: GameMeta[] = [
  { id: 'pokemon', name: 'Pokémon', hint: 'En français, prix Cardmarket', ready: true, currency: 'EUR', color: '#FDE047', shelf: 'big', tcg: 3, cm: 'Pokemon',
    art: 'https://assets.tcgdex.net/fr/sv/sv03.5/199/high.webp' },
  { id: 'onepiece', name: 'One Piece', hint: 'Prix TCGplayer en dollars', ready: true, currency: 'USD', color: '#FB7185', shelf: 'big', tcg: 68, cm: 'OnePiece',
    art: tcgImage(732599, '400w') },
  { id: 'yugioh', name: 'Yu-Gi-Oh!', hint: 'En français, prix Cardmarket', ready: true, currency: 'EUR', color: '#60A5FA', shelf: 'big', tcg: 2, cm: 'YuGiOh',
    art: 'https://images.ygoprodeck.com/images/cards_cropped/89631139.jpg' },
  { id: 'magic', name: 'Magic', hint: 'Prix Cardmarket', ready: true, currency: 'EUR', color: '#F97316', shelf: 'big', tcg: 1, cm: 'Magic',
    art: 'https://cards.scryfall.io/art_crop/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg' },
  { id: 'lorcana', name: 'Lorcana', hint: 'Prix TCGplayer en dollars', ready: true, currency: 'USD', color: '#A78BFA', shelf: 'big', tcg: 71, cm: 'Lorcana',
    art: 'https://cards.lorcast.io/card/digital/normal/crd_a6a007b0f7ae4fa19480721bacd2b0b6.avif?1747508548' },
  T('riftbound', 'Riftbound', 89, '#2DD4BF', 732652, 'big', 'Riftbound'),
  T('pokemonjp', 'Pokémon JP', 85, '#FACC15', 716977, 'big', 'Pokemon'),
  T('dbfw', 'Dragon Ball Fusion World', 80, '#FB923C', 711459, 'big', 'DragonBallSuper'),
  T('swu', 'Star Wars Unlimited', 79, '#38BDF8', 625157, 'big', 'StarWarsUnlimited'),
  T('digimon', 'Digimon', 63, '#0EA5E9', 493718, 'big', 'Digimon'),
  T('gundam', 'Gundam', 86, '#94A3B8', 727919, 'big', 'Gundam'),
  T('fab', 'Flesh and Blood', 62, '#DC2626', 711020, 'big', 'FleshAndBlood'),
  T('unionarena', 'Union Arena', 81, '#E879F9', 727790, 'big', 'UnionArena'),
  { id: 'foot', name: 'Foot', hint: 'Albums Panini, cartes Topps', ready: true, color: '#4ADE80', shelf: 'sport' },
  { id: 'f1', name: 'Formule 1', hint: 'Topps Chrome F1', ready: true, color: '#F87171', shelf: 'sport' },
  T('weiss', 'Weiss Schwarz', 20, '#F472B6', 728353, 'more', 'WeissSchwarz'),
  T('vanguard', 'Cardfight!! Vanguard', 16, '#34D399', 734428, 'more', 'CardfightVanguard'),
  T('dbs', 'Dragon Ball Super Masters', 27, '#F59E0B', 157817, 'more', 'DragonBallSuper'),
  T('fftcg', 'Final Fantasy', 24, '#818CF8', 233472, 'more', 'FinalFantasy'),
  T('sorcery', 'Sorcery', 77, '#D6D3D1', 666958, 'more'),
  T('grandarchive', 'Grand Archive', 74, '#A3E635', 713431, 'more'),
  T('shadowverse', 'Shadowverse Evolve', 73, '#C084FC', 733977, 'more'),
  T('hololive', 'hololive', 87, '#7DD3FC', 733046, 'more'),
  T('godzilla', 'Godzilla', 88, '#4ADE80', 704161, 'more'),
  T('palworld', 'Palworld', 91, '#5EEAD4', 725607, 'more'),
  T('cyberpunk', 'Cyberpunk', 92, '#FDE047', 715195, 'more'),
  T('cookierun', 'CookieRun Braverse', 90, '#FDBA74', 731185, 'more'),
  T('battlespirits', 'Battle Spirits Saga', 72, '#F87171', 593192, 'more'),
  T('wixoss', 'WIXOSS', 67, '#E2E8F0', 635663, 'more'),
  T('forceofwill', 'Force of Will', 17, '#FCD34D', 717953, 'more'),
  T('metazoo', 'MetaZoo', 66, '#86EFAC', 492065, 'more'),
  T('elestrals', 'Elestrals', 83, '#67E8F9', 583838, 'more'),
]

/** Les jeux à montrer : Pokémon japonais n'est pas un jeu à part, c'est une langue de Pokémon. */
export const PICK_GAMES = GAMES.filter(g => g.id !== 'pokemonjp')

export const gameMeta = (g: GameId) => GAMES.find(x => x.id === g)
export const gameName = (g: string) => GAMES.find(x => x.id === g)?.name ?? g
export const gameColor = (g: string) => GAMES.find(x => x.id === g)?.color ?? '#FFFFFF'

export const tcgdexAt = (l: string) => `https://api.tcgdex.net/v2/${l}`
const tcgdex = () => tcgdexAt(getPokeLang() === 'ja' ? 'fr' : getPokeLang())
/** Une fiche Pokémon dans la langue choisie ; si elle n'existe pas dans cette langue, en français puis en anglais. */
export async function pokeJson<T>(path: string, hours: number): Promise<T> {
  const first = getPokeLang() === 'ja' ? 'fr' : getPokeLang()
  let last: unknown
  for (const l of [...new Set([first, 'fr', 'en'])]) {
    try { return await cachedJson<T>(tcgdexAt(l) + path, hours) } catch (e) { last = e }
  }
  throw last
}
const SCRY = 'https://api.scryfall.com'
const OP = 'https://optcgapi.com/api'
const YGO = 'https://db.ygoprodeck.com/api/v7'
const LOR = 'https://api.lorcast.com/v0'

// ----- Yu-Gi-Oh -----
type YCard = { id: number; name: string; card_sets?: { set_name: string; set_code: string; set_rarity: string }[];
  card_prices: { cardmarket_price: string; tcgplayer_price: string }[]; card_images: { image_url: string; image_url_small: string }[] }

async function ygoSet(setName: string): Promise<YCard[]> {
  const url = (lang: string) => `${YGO}/cardinfo.php?cardset=${encodeURIComponent(setName)}${lang}`
  try { return (await cachedJson<{ data: YCard[] }>(url('&language=fr'), 24)).data }
  catch { return (await cachedJson<{ data: YCard[] }>(url(''), 24)).data }
}
const ygoCard = (c: YCard, setName?: string): { card: Card; price: Price } => {
  const s = c.card_sets?.find(x => x.set_name === setName) ?? c.card_sets?.[0]
  return {
    card: { key: `yugioh:${c.id}`, game: 'yugioh', id: String(c.id), setId: s?.set_name ?? '', setName: s?.set_name,
      number: s?.set_code ?? '', name: c.name, rarity: s?.set_rarity, image: c.card_images[0]?.image_url_small ?? '' },
    price: { value: num(c.card_prices[0]?.cardmarket_price), currency: 'EUR', source: 'Cardmarket, prix le plus bas toutes éditions (via YGOPRODeck)' },
  }
}

// ----- Lorcana -----
type LCard = { id: string; name: string; version?: string; collector_number: string; rarity: string;
  set: { code: string; name: string }; image_uris?: { digital?: { normal: string; large: string } }; prices: { usd: string | null; usd_foil: string | null } }
const lorCard = (c: LCard): { card: Card; price: Price } => ({
  card: { key: `lorcana:${c.id}`, game: 'lorcana', id: c.id, setId: c.set.code, setName: c.set.name, number: c.collector_number,
    name: c.version ? `${c.name} – ${c.version}` : c.name, rarity: c.rarity, image: c.image_uris?.digital?.normal ?? '' },
  price: { value: num(c.prices.usd) ?? num(c.prices.usd_foil), currency: 'USD', source: 'TCGplayer (via Lorcast)' },
})

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

// ---------- Extensions ----------

export const isTcgOnly = (g: GameId) => !['pokemon', 'magic', 'yugioh', 'lorcana', 'onepiece'].includes(g) && !!gameMeta(g)?.tcg
const yr = (d?: string) => (d ? d.slice(0, 4) : 'Autres')

/** Séries Pokémon (Écarlate et Violet, Épée et Bouclier…) pour ranger les extensions. */
async function pokemonSeries(): Promise<Map<string, { name: string; id: string }>> {
  type L = { id: string; name: string }[]
  const series = await cachedJson<L>(`${tcgdex()}/series`, 168)
  const map = new Map<string, { name: string; id: string }>()
  await pool(series.filter(x => x.id !== 'tcgp'), 6, async sr => {
    const d = await cachedJson<{ name: string; sets: { id: string }[] }>(`${tcgdex()}/series/${sr.id}`, 168)
    for (const st of d.sets) map.set(st.id, { name: d.name, id: sr.id })
  })
  return map
}

export async function listSets(game: GameId): Promise<SetInfo[]> {
  if (SPORT_SETS[game]) return SPORT_SETS[game]
  if (isTcgOnly(game)) return tcgSets(gameMeta(game)!.tcg!)
  if (game === 'pokemon') {
    type S = { id: string; name: string; logo?: string; cardCount: { total: number; official: number } }
    const [d, series] = await Promise.all([cachedJson<S[]>(`${tcgdex()}/sets`, 72), pokemonSeries().catch(() => new Map<string, { name: string; id: string }>())])
    // Pokémon Pocket (jeu sur téléphone) n'a pas de vraies cartes : on l'enlève
    return d
      .filter(s => s.cardCount?.official > 0 && (series.size === 0 || series.has(s.id)))
      .map(s => ({ id: s.id, name: s.name, total: s.cardCount.official, last: s.cardCount.total, logo: s.logo ? s.logo + '.webp' : undefined, group: series.get(s.id)?.name ?? 'Autres',
        art: series.has(s.id) ? `https://assets.tcgdex.net/${getPokeLang() === 'ja' ? 'fr' : getPokeLang()}/${series.get(s.id)!.id}/${s.id}` : undefined }))
      .reverse()
  }
  if (game === 'magic') {
    type S = { code: string; name: string; card_count: number; icon_svg_uri: string; released_at: string; set_type: string; digital: boolean }
    const d = await cachedJson<{ data: S[] }>(`${SCRY}/sets`, 72)
    const keep = new Set(['core', 'expansion', 'masters', 'draft_innovation', 'commander', 'funny', 'starter', 'box', 'from_the_vault', 'premium_deck', 'duel_deck', 'arsenal', 'spellbook', 'alchemy'])
    return d.data
      .filter(s => !s.digital && keep.has(s.set_type) && s.card_count > 0 && s.released_at <= new Date().toISOString().slice(0, 10))
      .map(s => ({ id: s.code, name: s.name, total: s.card_count, logo: s.icon_svg_uri, date: s.released_at, group: yr(s.released_at) }))
  }
  if (game === 'yugioh') {
    type S = { set_name: string; set_code: string; num_of_cards: number; tcg_date?: string; set_image?: string }
    const d = await cachedJson<S[]>(`${YGO}/cardsets.php`, 72)
    const seen = new Set<string>()
    return d
      .filter(s => s.num_of_cards > 1 && s.tcg_date && s.tcg_date <= new Date().toISOString().slice(0, 10) && !seen.has(s.set_name) && seen.add(s.set_name))
      .map(s => ({ id: s.set_name, name: s.set_name, total: s.num_of_cards, date: s.tcg_date, code: s.set_code, group: yr(s.tcg_date), logo: s.set_image }))
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }
  if (game === 'lorcana') {
    type S = { code: string; name: string; released_at: string }
    const d = await cachedJson<{ results: S[] }>(`${LOR}/sets`, 72)
    return d.results.map(s => ({ id: s.code, name: s.name, total: 0, date: s.released_at, group: yr(s.released_at) })).reverse()
  }
  type S = { set_id: string; set_name: string }
  const d = await cachedJson<S[]>(`${OP}/allSets/`, 72)
  const kind = (id: string) => (/^OP/i.test(id) ? 'Boosters (OP)' : /^EB/i.test(id) ? 'Boosters extra (EB)' : /^PRB/i.test(id) ? 'Boosters premium (PRB)' : /^ST/i.test(id) ? 'Decks de démarrage (ST)' : 'Autres')
  const order = ['Boosters (OP)', 'Boosters extra (EB)', 'Boosters premium (PRB)', 'Decks de démarrage (ST)', 'Autres']
  return d
    .map(s => ({ id: s.set_id, name: s.set_name, total: 0, group: kind(s.set_id) }))
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || b.id.localeCompare(a.id, 'en', { numeric: true }))
}

export interface SetData {
  set: SetInfo
  cards: Card[]
  prices: Record<string, Price> // clé = card.key ; vide pour Pokémon (chargé à part)
  /** Produits scellés de l'extension (jeux TCGplayer), avec photo et prix */
  sealed?: TcgSealed[]
}

export async function loadSet(game: GameId, setId: string): Promise<SetData> {
  if (SPORT_SETS[game]) return { ...(await sportSet(game, setId)), prices: {} }
  if (isTcgOnly(game)) return tcgSet(game, gameMeta(game)!.tcg!, setId)
  if (game === 'pokemon') {
    type C = { id: string; localId: string; name: string; image?: string }
    type S = { id: string; name: string; logo?: string; releaseDate?: string; cardCount: { official: number }; cards: C[] }
    const s = await pokeJson<S>(`/sets/${encodeURIComponent(setId)}`, 72)
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
  if (game === 'yugioh') {
    const d = await ygoSet(setId)
    const prices: Record<string, Price> = {}
    const seen = new Set<string>()
    const cards: Card[] = []
    for (const c of d) {
      const r = ygoCard(c, setId)
      if (seen.has(r.card.key)) continue
      seen.add(r.card.key)
      prices[r.card.key] = r.price
      cards.push(r.card)
    }
    cards.sort((a, b) => a.number.localeCompare(b.number, 'en', { numeric: true }))
    for (const c of cards) c.number = c.number.replace(/^[A-Z0-9]+-[A-Z]*/, '') || c.number
    return { set: { id: setId, name: setId, total: cards.length }, cards, prices }
  }
  if (game === 'lorcana') {
    const d = await cachedJson<LCard[]>(`${LOR}/sets/${encodeURIComponent(setId)}/cards`, 24)
    const prices: Record<string, Price> = {}
    const cards = d.map(c => { const r = lorCard(c); prices[r.card.key] = r.price; return r.card })
    cards.sort((a, b) => a.number.localeCompare(b.number, 'en', { numeric: true }))
    return { set: { id: setId, name: d[0]?.set.name ?? setId, total: cards.length }, cards, prices }
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

type CM = { avg?: number; trend?: number; avg1?: number; 'avg1-holo'?: number; avg7?: number; avg30?: number; low?: number; updated?: string;
  'trend-holo'?: number; 'avg30-holo'?: number; 'avg7-holo'?: number; 'low-holo'?: number }

export interface PokeDetail { rarity?: string; price: Price }

export async function pokemonDetail(id: string): Promise<PokeDetail> {
  const d = await pokeJson<{ rarity?: string; pricing?: { cardmarket?: CM } }>(`/cards/${encodeURIComponent(id)}`, 12)
  const cm = d.pricing?.cardmarket
  const pick = (a?: number, b?: number) => num(a) ?? num(b)
  return {
    rarity: d.rarity,
    price: {
      value: pick(cm?.trend, cm?.['trend-holo']) ?? num(cm?.avg),
      avg1: pick(cm?.avg1, cm?.['avg1-holo']),
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
    // On cherche dans la langue choisie, puis en français et en anglais (« Charizard » trouve Dracaufeu)
    let d: C[] = []
    for (const l of [...new Set([getPokeLang() === 'ja' ? 'fr' : getPokeLang(), 'fr', 'en'])]) {
      d = await cachedJson<C[]>(`${tcgdexAt(l)}/cards?name=${encodeURIComponent(q)}&pagination:itemsPerPage=40`, 6).catch(() => [])
      if (d.length) break
    }
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
  if (game === 'yugioh') {
    try {
      const d = await cachedJson<{ data: YCard[] }>(`${YGO}/cardinfo.php?fname=${encodeURIComponent(q)}&language=fr&num=40&offset=0`, 6)
      return d.data.map(c => ygoCard(c).card).filter(c => c.setId)
    } catch { return [] }
  }
  if (game === 'lorcana') {
    try {
      const d = await cachedJson<{ results: LCard[] }>(`${LOR}/cards/search?q=${encodeURIComponent(q)}`, 6)
      return d.results.slice(0, 40).map(c => lorCard(c).card)
    } catch { return [] }
  }
  return []
}

/** Prix d'une carte trouvée par la recherche (pour l'ajouter avec son prix). */
export async function priceFor(c: Card): Promise<Price | null> {
  try {
    if (c.game === 'pokemon') return (await pokemonDetail(c.id)).price
    const r = await loadCard(c.game, c.setId, c.id)
    return r.price
  } catch { return null }
}

// ---------- Une carte seule ----------

export async function loadCard(game: GameId, setId: string, id: string): Promise<{ card: Card; price: Price | null }> {
  if (game === 'pokemon') {
    const d = await pokeJson<{ id: string; localId: string; name: string; image?: string; rarity?: string; set: { id: string; name: string } }>(`/cards/${encodeURIComponent(id)}`, 12)
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

export const imgLarge = (c: Card) => (c.game === 'pokemon' ? c.image.replace('/low.webp', '/high.webp') : c.image.replace('_400w.jpg', '_in_1000x1000.jpg'))

/** Recherche possible directement par nom ? (sinon on passe par les extensions) */
export const canSearch = (g: GameId) => ['pokemon', 'magic', 'yugioh', 'lorcana'].includes(g)
