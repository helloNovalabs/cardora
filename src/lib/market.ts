import { listSets, pokemonDetail, pokeJson } from './games'
import { cachedJson } from './cache'
import { getPokeLang } from './pokeLang'
import type { Card, Price } from './types'

export interface MarketCard { card: Card; price: Price; trend: number | null }

const RARES = ['Illustration spéciale rare', 'Méga Hyper Rare', 'Hyper rare', 'Magnifique rare']
const RECENT_SETS = 16
const MAX = 48
const done = new Map<string, MarketCard[]>()
const running = new Map<string, Promise<MarketCard[]>>()
export const marketCached = () => done.get(getPokeLang()) ?? null

/** Les cartes rares des dernières extensions, avec leurs vrais prix Cardmarket. */
export function marketCards(onProgress?: (l: MarketCard[]) => void): Promise<MarketCard[]> {
  const lang = getPokeLang()
  const known = done.get(lang)
  if (known) return Promise.resolve(known)
  if (running.has(lang)) return running.get(lang)!
  const job = (async () => {
    const sets = (await listSets('pokemon')).slice(0, RECENT_SETS).map(s => s.id)
    const lists = await Promise.all(RARES.map(r => cachedJson<{ id: string }[]>(`https://api.tcgdex.net/v2/fr/cards?rarity=eq:${encodeURIComponent(r)}`, 72).catch(() => [])))
    const setOf = (id: string) => id.slice(0, id.lastIndexOf('-'))
    const ids = [...new Set(lists.flat().map(c => c.id))].filter(id => sets.includes(setOf(id)))
      .sort((a, b) => sets.indexOf(setOf(a)) - sets.indexOf(setOf(b))).slice(0, MAX)
    const out: MarketCard[] = []
    let i = 0
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (i < ids.length) {
        const id = ids[i++]
        try {
          const d = await pokeJson<{ id: string; localId: string; name: string; image?: string; rarity?: string; set: { id: string; name: string } }>(`/cards/${encodeURIComponent(id)}`, 12)
          const { price } = await pokemonDetail(id)
          if (!d.image || price.value == null || price.value < 3) continue
          const trend = price.avg7 && price.avg30 ? ((price.avg7 - price.avg30) / price.avg30) * 100 : null
          out.push({ card: { key: `pokemon:${d.id}`, game: 'pokemon', id: d.id, setId: d.set.id, setName: d.set.name, number: d.localId, name: d.name, rarity: d.rarity, image: `${d.image}/low.webp` }, price, trend })
          if (out.length % 6 === 0) onProgress?.([...out])
        } catch { /* carte sans données : on passe */ }
      }
    }))
    done.set(lang, out)
    onProgress?.([...out])
    return out
  })().finally(() => running.delete(lang))
  running.set(lang, job)
  return job
}
