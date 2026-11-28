import { useSyncExternalStore } from 'react'
import type { Card, GameId, Price } from './types'
import { getPokeLang } from './pokeLang'

/** `buy` = prix payé pour UNE carte (facultatif, saisi par la personne). */
export interface Owned { card: Card; qty: number; price: Price | null; addedAt: number; buy?: number | null; grade?: Grade | null; lang?: string }
/** Carte gradée : société (PSA, CGC…), note, et sa valeur gradée notée par la personne (en euros). */
export interface Grade { by: string; g: string; value?: number | null }

/** Ce que vaut UNE carte : sa valeur gradée si elle est notée, sinon le prix du marché (brut). */
export const unitValue = (o: Owned) => o.grade?.value ?? toEur(o.price)
export interface Followed { game: GameId; setId: string; name: string; total: number; logo?: string }

export type SealedKind = 'booster' | 'display' | 'etb' | 'coffret' | 'tin' | 'deck'
/** Objet scellé (booster, display, coffret…). Les prix sont saisis par la personne : on n'a pas de source gratuite. */
export interface Sealed {
  id: string; game: GameId; kind: SealedKind; name: string; setName?: string; logo?: string
  qty: number; buy: number | null; value: number | null; valueAt: number | null; addedAt: number
  /** Vraie photo du produit (TCGplayer) */
  image?: string
  /** Produit TCGplayer « jeu/extension/produit » : le prix se met à jour tout seul */
  src?: string
}
/** Une photo par jour de ce que vaut tout (cartes + scellé), et de ce qui a été payé. */
export interface Snap { d: string; v: number; cards: number; sealed: number }
export interface State { owned: Record<string, Owned>; followed: Followed[]; sealed?: Sealed[]; history?: Snap[]; wish?: Record<string, Wish>; alerts?: Alerts }
/** Alertes : `email` = la personne veut un e-mail quand une envie atteint son prix cible (accord donné dans l'appli). */
export interface Alerts { email?: boolean }
/** Une carte voulue, et le prix auquel on veut l'acheter. */
export interface Wish { card: Card; price: Price | null; target: number | null; addedAt: number }

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
function save(next: State, fromCloud = false) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* stockage indisponible */ }
  subs.forEach(f => f())
  if (!fromCloud) onLocalChange?.()
}

/** Appelé après chaque changement fait sur cet appareil (sert à enregistrer dans le compte). */
let onLocalChange: (() => void) | null = null
export const setOnLocalChange = (f: (() => void) | null) => { onLocalChange = f }
export const getState = () => state
/** Remplace la collection par celle venue du compte (sans la renvoyer en ligne). */
export const replaceState = (s: State) => save(s, true)

export function useCollection() {
  return useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f) }, () => state)
}

export function addCard(card: Card, price: Price | null, set?: Followed) {
  const cur = state.owned[card.key]
  const owned = { ...state.owned, [card.key]: { card, price: price ?? cur?.price ?? null, qty: (cur?.qty ?? 0) + 1, addedAt: cur?.addedAt ?? Date.now(), buy: cur?.buy ?? null, grade: cur?.grade ?? null, lang: cur?.lang ?? defaultLang(card.game) } }
  let followed = state.followed
  if (set && !followed.some(f => f.game === set.game && f.setId === set.setId)) followed = [set, ...followed]
  save({ ...state, owned, followed })
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

export function setGrade(key: string, grade: Grade | null) {
  const cur = state.owned[key]
  if (!cur) return
  save({ ...state, owned: { ...state.owned, [key]: { ...cur, grade } } })
}

/** Langue d'une carte par défaut : celle des données du jeu (Pokémon et Yu-Gi-Oh! en français, japonais pour Pokémon japonais, sinon anglais). */
export const defaultLang = (g: GameId) => (g === 'pokemon' ? getPokeLang() : g === 'yugioh' || g === 'foot' ? 'fr' : g === 'pokemonjp' ? 'ja' : 'en')
export function setCardLang(key: string, lang: string) {
  const cur = state.owned[key]
  if (!cur || cur.lang === lang) return
  save({ ...state, owned: { ...state.owned, [key]: { ...cur, lang } } })
}

export function setBuy(key: string, buy: number | null) {
  const cur = state.owned[key]
  if (!cur || cur.buy === buy) return
  save({ ...state, owned: { ...state.owned, [key]: { ...cur, buy } } })
}

// ----- Envies -----
export function toggleWish(card: Card, price: Price | null) {
  const wish = { ...(state.wish ?? {}) }
  if (wish[card.key]) delete wish[card.key]
  else wish[card.key] = { card, price, target: null, addedAt: Date.now() }
  save({ ...state, wish })
}
export function setWishTarget(key: string, target: number | null) {
  const w = state.wish?.[key]
  if (!w || w.target === target) return
  save({ ...state, wish: { ...state.wish, [key]: { ...w, target } } })
}
export function setWishPrice(key: string, price: Price) {
  const w = state.wish?.[key]
  if (!w || w.price?.value === price.value) return
  save({ ...state, wish: { ...state.wish, [key]: { ...w, price } } })
}

// ----- Scellé -----
export function saveSealed(x: Sealed) {
  const list = state.sealed ?? []
  const next = list.some(s => s.id === x.id) ? list.map(s => (s.id === x.id ? x : s)) : [x, ...list]
  save({ ...state, sealed: next })
}
export function deleteSealed(id: string) {
  save({ ...state, sealed: (state.sealed ?? []).filter(s => s.id !== id) })
}
/** Valeur d'un objet scellé : le prix saisi, sinon le prix payé (on le dit dans l'interface). */
export const sealedUnit = (x: Sealed) => x.value ?? x.buy ?? 0

// ----- Totaux pour l'investissement -----
export function totals(s: State) {
  const owned = Object.values(s.owned)
  const sealed = s.sealed ?? []
  const cards = owned.reduce((n, o) => n + (unitValue(o) ?? 0) * o.qty, 0)
  const sealedV = sealed.reduce((n, x) => n + sealedUnit(x) * x.qty, 0)
  // Plus-value : seulement sur ce dont on connaît le prix d'achat
  let paid = 0, worth = 0, tracked = 0
  for (const o of owned) if (o.buy != null) { paid += o.buy * o.qty; worth += (unitValue(o) ?? 0) * o.qty; tracked += o.qty }
  for (const x of sealed) if (x.buy != null) { paid += x.buy * x.qty; worth += sealedUnit(x) * x.qty; tracked += x.qty }
  return { cards, sealed: sealedV, total: cards + sealedV, paid, worth, gain: worth - paid, tracked }
}

const today = () => new Date().toLocaleDateString('sv-SE') // AAAA-MM-JJ, heure locale

/** Note la valeur du jour (une seule ligne par jour, mise à jour si elle change). */
export function snapshot() {
  const t = totals(state)
  if (t.total <= 0 && !(state.history?.length)) return
  const d = today()
  const snap: Snap = { d, v: round(t.total), cards: round(t.cards), sealed: round(t.sealed) }
  const h = state.history ?? []
  const last = h[h.length - 1]
  if (last?.d === d && last.v === snap.v && last.sealed === snap.sealed) return
  const next = last?.d === d ? [...h.slice(0, -1), snap] : [...h, snap]
  save({ ...state, history: next.slice(-730) })
}
const round = (n: number) => Math.round(n * 100) / 100

export const ownedInSet = (s: State, game: GameId, setId: string) =>
  Object.values(s.owned).filter(o => o.card.game === game && o.card.setId === setId)

export const USD_TO_EUR = 0.92

/** Valeur en euros (les dollars sont convertis, et on le dit dans l'interface). */
export const toEur = (p: Price | null | undefined) => (p?.value == null ? null : p.currency === 'USD' ? p.value * USD_TO_EUR : p.value)

export function fmt(v: number | null | undefined, cur: 'EUR' | 'USD' = 'EUR') {
  if (v == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur, maximumFractionDigits: v < 10 ? 2 : 0 }).format(v)
}

/** Le type d'un produit scellé d'après son nom (anglais, TCGplayer). */
export function guessKind(n: string): SealedKind {
  const t = n.toLowerCase()
  if (/booster box|display|case/.test(t)) return 'display'
  if (/elite trainer|premium|ultra.premium|collection box|gift/.test(t)) return 'etb'
  if (/\btin\b/.test(t)) return 'tin'
  if (/deck/.test(t)) return 'deck'
  if (/pack|booster/.test(t)) return 'booster'
  return 'coffret'
}

/** Une carte reprise d'une autre appli (import d'un fichier). */
export interface Imported { card: Card; price: Price | null; qty: number; buy: number | null; grade: Grade | null; lang?: string }
/** Ajoute d'un coup les cartes importées (les quantités s'ajoutent à celles déjà là). */
export function importCards(list: Imported[]) {
  const owned = { ...state.owned }
  for (const x of list) {
    const cur = owned[x.card.key]
    owned[x.card.key] = {
      card: x.card, price: x.price ?? cur?.price ?? null, qty: (cur?.qty ?? 0) + x.qty, addedAt: cur?.addedAt ?? Date.now(),
      buy: cur?.buy ?? x.buy, grade: cur?.grade ?? x.grade, lang: cur?.lang ?? x.lang ?? defaultLang(x.card.game),
    }
  }
  save({ ...state, owned })
}

/** Active ou coupe l'e-mail quand une carte voulue atteint le prix cible. */
export function setEmailAlerts(on: boolean) {
  save({ ...state, alerts: { ...state.alerts, email: on } })
}
/** Les envies dont le prix du jour est au prix cible ou en dessous. */
export const wishHits = (s: State) => Object.values(s.wish ?? {}).filter(w => { const p = toEur(w.price); return w.target != null && p != null && p <= w.target })
