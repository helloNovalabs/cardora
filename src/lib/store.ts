import { useSyncExternalStore } from 'react'
import type { Card, GameId, Price } from './types'

export interface Owned { card: Card; qty: number; price: Price | null; addedAt: number }
export interface Followed { game: GameId; setId: string; name: string; total: number; logo?: string }
interface State { owned: Record<string, Owned>; followed: Followed[] }

const KEY = 'cardora-collection-v1'
let state: State = load()
const subs = new Set<() => void>()

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* rien */ }
  return { owned: {}, followed: [] }
}
function save(next: State) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* stockage indisponible */ }
  subs.forEach(f => f())
}

export function useCollection() {
  return useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f) }, () => state)
}

export function addCard(card: Card, price: Price | null, set?: Followed) {
  const cur = state.owned[card.key]
  const owned = { ...state.owned, [card.key]: { card, price: price ?? cur?.price ?? null, qty: (cur?.qty ?? 0) + 1, addedAt: cur?.addedAt ?? Date.now() } }
  let followed = state.followed
  if (set && !followed.some(f => f.game === set.game && f.setId === set.setId)) followed = [set, ...followed]
  save({ owned, followed })
}

export function removeCard(key: string) {
  const cur = state.owned[key]
  if (!cur) return
  const owned = { ...state.owned }
  if (cur.qty > 1) owned[key] = { ...cur, qty: cur.qty - 1 }
  else delete owned[key]
  save({ ...state, owned })
}

export function updatePrices(prices: Record<string, Price>) {
  let changed = false
  const owned = { ...state.owned }
  for (const k in prices) {
    const o = owned[k]
    if (o && prices[k]?.value !== o.price?.value) { owned[k] = { ...o, price: prices[k] }; changed = true }
  }
  if (changed) save({ ...state, owned })
}

export function follow(f: Followed) {
  if (state.followed.some(x => x.game === f.game && x.setId === f.setId)) return
  save({ ...state, followed: [f, ...state.followed] })
}

/** Met à jour le nombre de cartes d'un classeur déjà suivi (s'il a changé). */
export function refreshFollowed(f: Followed) {
  const cur = state.followed.find(x => x.game === f.game && x.setId === f.setId)
  if (!cur || (cur.total === f.total && cur.name === f.name)) return
  save({ ...state, followed: state.followed.map(x => (x === cur ? { ...cur, ...f } : x)) })
}
export function unfollow(game: GameId, setId: string) {
  save({ ...state, followed: state.followed.filter(x => !(x.game === game && x.setId === setId)) })
}

export const ownedInSet = (s: State, game: GameId, setId: string) =>
  Object.values(s.owned).filter(o => o.card.game === game && o.card.setId === setId)

export const USD_TO_EUR = 0.92

/** Valeur en euros (les dollars sont convertis, et on le dit dans l'interface). */
export const toEur = (p: Price | null | undefined) => (p?.value == null ? null : p.currency === 'USD' ? p.value * USD_TO_EUR : p.value)

export function fmt(v: number | null | undefined, cur: 'EUR' | 'USD' = 'EUR') {
  if (v == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur, maximumFractionDigits: v < 10 ? 2 : 0 }).format(v)
}
