import { cachedMap } from './cache'
import type { Card, GameId, Price, SetInfo } from './types'

/** Données TCGplayer (via TCGCSV, mis à jour chaque jour) pour tous les jeux qui n'ont pas d'API à eux.
 *  Le site passe par /tcg/… (renvoyé vers tcgcsv.com par Vercel, et par Vite en local). */
const BASE = '/tcg'
const IMG = 'https://tcgplayer-cdn.tcgplayer.com/product/'

type G = { groupId: number; name: string; abbreviation?: string; isSupplemental: boolean; publishedOn: string }
type P = { productId: number; name: string; imageCount: number; extendedData: { name: string; value: string }[] }
type Pr = { productId: number; marketPrice: number | null; lowPrice: number | null; midPrice: number | null; subTypeName: string }

/** Ce qu'on garde d'un produit (le fichier complet est lourd). */
interface Lite { id: number; name: string; num?: string; r?: string; img: boolean }
export interface TcgSealed { id: number; name: string; image: string; price: Price | null; src: string }

const today = () => new Date().toISOString().slice(0, 10)
const year = (d: string) => d.slice(0, 4)

export async function tcgSets(cat: number): Promise<SetInfo[]> {
  const sets = await cachedMap<{ results: G[] }, SetInfo[]>(`${BASE}/${cat}/groups`, 24, d =>
    d.results.map(g => ({ id: String(g.groupId), name: g.name, total: 0, date: g.publishedOn.slice(0, 10), code: g.abbreviation })))
  const t = today()
  return [...sets]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .map(s => ({ ...s, soon: (s.date ?? '') > t, group: (s.date ?? '') > t ? 'À venir' : year(s.date ?? '') }))
}

async function products(cat: number, group: string) {
  return cachedMap<{ results: P[] }, Lite[]>(`${BASE}/${cat}/${group}/products`, 24, d =>
    d.results.map(p => {
      const ext = (n: string) => p.extendedData.find(e => e.name === n)?.value
      return { id: p.productId, name: p.name, num: ext('Number'), r: ext('Rarity'), img: p.imageCount > 0 }
    }))
}

/** Prix du marché de chaque produit (normal d'abord, sinon foil / holo). */
export async function tcgPrices(cat: number, group: string) {
  return cachedMap<{ results: Pr[] }, Record<number, { v: number | null; low: number | null }>>(`${BASE}/${cat}/${group}/prices`, 6, d => {
    const out: Record<number, { v: number | null; low: number | null; normal?: boolean }> = {}
    for (const p of d.results) {
      const v = p.marketPrice ?? p.midPrice
      const cur = out[p.productId]
      const normal = p.subTypeName === 'Normal'
      if (!cur || (normal && !cur.normal) || (cur.v == null && v != null)) out[p.productId] = { v, low: p.lowPrice, normal }
    }
    return out
  })
}

const priceOf = (x?: { v: number | null; low: number | null }): Price | null =>
  x && x.v != null ? { value: x.v, low: x.low, currency: 'USD', source: 'TCGplayer (via TCGCSV)' } : null

export const tcgImage = (id: number | string, size: '200w' | '400w' | 'in_1000x1000' = '400w') => `${IMG}${id}_${size}.jpg`

export async function tcgSet(game: GameId, cat: number, group: string) {
  const [list, pr, sets] = await Promise.all([products(cat, group), tcgPrices(cat, group).catch(() => ({} as Record<number, { v: number | null; low: number | null }>)), tcgSets(cat)])
  const info = sets.find(s => s.id === group) ?? { id: group, name: group, total: 0 }
  const prices: Record<string, Price> = {}
  const cards: Card[] = []
  const sealed: TcgSealed[] = []
  for (const p of list) {
    const price = priceOf(pr[p.id])
    if (!p.num && !p.r) {
      sealed.push({ id: p.id, name: p.name, image: p.img ? tcgImage(p.id) : '', price, src: `${cat}/${group}/${p.id}` })
      continue
    }
    const key = `${game}:${p.id}`
    if (price) prices[key] = price
    cards.push({ key, game, id: String(p.id), setId: group, setName: info.name, number: p.num ?? '', name: p.name, rarity: p.r, image: p.img ? tcgImage(p.id) : '' })
  }
  cards.sort((a, b) => (a.number ? 0 : 1) - (b.number ? 0 : 1) || a.number.localeCompare(b.number, 'en', { numeric: true }) || a.name.localeCompare(b.name))
  sealed.sort((a, b) => (b.price?.value ?? 0) - (a.price?.value ?? 0))
  return { set: { ...info, total: cards.length }, cards, prices, sealed }
}

/** Produits scellés d'une extension (displays, boosters, coffrets…) avec leur photo et leur prix. */
export async function tcgSealed(cat: number, group: string) {
  return (await tcgSet('x', cat, group)).sealed
}

/** Prix à jour d'un produit scellé noté « cat/groupe/id ». */
export async function tcgSealedPrice(src: string): Promise<Price | null> {
  const [cat, group, id] = src.split('/')
  const pr = await tcgPrices(Number(cat), group)
  return priceOf(pr[Number(id)])
}
