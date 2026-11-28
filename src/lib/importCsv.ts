import { cachedJson, pool } from './cache'
import { loadCard, priceFor, searchCards, tcgdexAt } from './games'
import type { Grade, Imported } from './store'
import type { Card, GameId, Price } from './types'

/**
 * Import d'une collection venue d'une autre appli (Collectr, Dex, Dragon Shield, TCGplayer, un tableur…).
 * Les colonnes sont reconnues par leur nom. Chaque ligne est cherchée par nom + numéro ;
 * une carte n'est ajoutée que si le numéro correspond, pour ne pas en mettre une fausse.
 */

export interface Row { line: number; name: string; set: string; number: string; qty: number; buy: number | null; grade: Grade | null; lang?: string; game: GameId | null }
export interface Result { found: Imported[]; missing: Row[] }

const COLS: Record<string, string[]> = {
  name: ['product name', 'card name', 'name', 'nom', 'nom de la carte', 'carte', 'card'],
  set: ['set name', 'set', 'expansion', 'extension', 'série', 'serie', 'edition', 'édition'],
  number: ['card number', 'collector number', 'number', 'numéro', 'numero', 'n°', 'no', '#'],
  qty: ['quantity', 'qty', 'quantité', 'quantite', 'count', 'nombre'],
  buy: ['average cost paid', 'price bought', 'purchase price', 'cost paid', 'paid', 'cost', 'prix payé', 'prix paye', "prix d'achat", 'achat'],
  grade: ['grade', 'note'],
  grader: ['grading company', 'grader', 'société de gradation'],
  lang: ['language', 'langue', 'lang'],
  game: ['category', 'game', 'tcg', 'jeu'],
}

/** Découpe un CSV (virgules ou points-virgules, guillemets, retours à la ligne dans les guillemets). */
export function parseCsv(text: string): string[][] {
  text = text.replace(/^﻿/, '')
  const lines = text.split(/\r?\n/)
  if (/^"?sep=/i.test(lines[0] ?? '')) text = lines.slice(1).join('\n')
  const head = text.slice(0, text.indexOf('\n') >>> 0)
  const sep = (head.match(/;/g)?.length ?? 0) > (head.match(/,/g)?.length ?? 0) ? ';' : head.includes('\t') && !head.includes(',') ? '\t' : ','
  const rows: string[][] = []
  let row: string[] = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else q = false }
      else cell += ch
    } else if (ch === '"') q = true
    else if (ch === sep) { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(c => c.trim())) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some(c => c.trim())) rows.push(row)
  return rows
}

const money = (v: string): number | null => {
  const s = v.replace(/[^\d,.-]/g, '')
  if (!s) return null
  const n = Number(s.includes(',') && !s.includes('.') ? s.replace(',', '.') : s.replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

const LANGS: [RegExp, string][] = [[/^(fr|fra|french|français|francais)/i, 'fr'], [/^(en|eng|english|anglais)/i, 'en'], [/^(ja|jp|jap|japanese|japonais)/i, 'ja'], [/^(de|ger|german|allemand)/i, 'de'], [/^(es|spa|spanish|espagnol)/i, 'es'], [/^(it|ita|italian|italien)/i, 'it'], [/^(pt|por|portuguese|portugais)/i, 'pt'], [/^(ko|kor|korean|coréen)/i, 'ko'], [/^(zh|chi|chinese|chinois)/i, 'zh']]

const gameOf = (v: string): GameId | null =>
  !v ? null : /pok/i.test(v) ? 'pokemon' : /magic|mtg/i.test(v) ? 'magic' : /yu.?gi/i.test(v) ? 'yugioh' : /lorcana/i.test(v) ? 'lorcana' : /one ?piece/i.test(v) ? 'onepiece' : 'autre'

function gradeOf(g: string, co: string): Grade | null {
  const s = `${co} ${g}`.trim()
  if (!s || /ungraded|raw|non grad|^-$/i.test(s)) return null
  const by = s.match(/\b(PSA|BGS|CGC|SGC|PCA|CollectAura|Beckett|TAG|ACE)\b/i)?.[1]
  const n = s.match(/\b(10|[1-9](?:\.5)?)\b/)?.[1]
  return by && n ? { by: by.toUpperCase() === 'BECKETT' ? 'BGS' : by.toUpperCase(), g: n } : null
}

/** Lit les lignes du fichier. `null` si on ne trouve pas au moins la colonne du nom. */
export function readRows(text: string): Row[] | null {
  const all = parseCsv(text)
  if (all.length < 2) return null
  const head = all[0].map(h => h.trim().toLowerCase())
  const col = (k: string) => { for (const n of COLS[k]) { const i = head.indexOf(n); if (i >= 0) return i } return -1 }
  const idx = Object.fromEntries(Object.keys(COLS).map(k => [k, col(k)])) as Record<string, number>
  if (idx.name < 0) return null
  const get = (r: string[], k: string) => (idx[k] >= 0 ? (r[idx[k]] ?? '').trim() : '')
  return all.slice(1).map((r, i) => {
    const l = get(r, 'lang')
    return {
      line: i + 2, name: get(r, 'name'), set: get(r, 'set'), number: get(r, 'number'),
      qty: Math.max(1, Math.round(Number(get(r, 'qty').replace(',', '.')) || 1)),
      buy: money(get(r, 'buy')), grade: gradeOf(get(r, 'grade'), get(r, 'grader')),
      lang: LANGS.find(([re]) => re.test(l))?.[1], game: gameOf(get(r, 'game')),
    }
  }).filter(r => r.name)
}

// ---------- Retrouver la carte ----------

/** « 199/165 » → « 199 » ; « 058 » → « 58 » ; « LOB-EN001 » → « LOB001 » (la langue du code ne compte pas). */
const numKey = (n: string) => {
  const s = n.trim().toUpperCase().split('/')[0].replace(/\s+/g, '')
  const ygo = s.match(/^([A-Z0-9]+)-[A-Z]{0,2}(\d+)$/)
  if (ygo) return ygo[1] + String(Number(ygo[2]))
  return /^\d+$/.test(s) ? String(Number(s)) : s.replace(/^([A-Z]+)0+(\d)/, '$1$2')
}
const words = (s: string) => new Set(s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').split(' ').filter(w => w && !['sv', 'swsh', 'sm', 'xy', 'the', 'and', 'et', 'de', 'set'].includes(w)))
/** Ressemblance entre deux noms d'extension (0 à 1). */
const near = (a: string, b: string) => {
  const A = words(a), B = words(b)
  if (!A.size || !B.size) return 0
  let n = 0
  A.forEach(w => { if (B.has(w)) n++ })
  return n / Math.max(A.size, B.size)
}

type TC = { id: string; localId: string; name: string }
async function pokemon(r: Row): Promise<{ card: Card; price: Price | null } | null> {
  const num = r.number.split('/')[0].trim()
  if (!num) return null
  let hits: TC[] = []
  for (const l of ['en', 'fr']) {
    for (const op of ['eq:', '']) {
      hits = await cachedJson<TC[]>(`${tcgdexAt(l)}/cards?name=${op}${encodeURIComponent(r.name)}&localId=${encodeURIComponent(num)}`, 24).catch(() => [])
      if (hits.length) break
    }
    if (hits.length) {
      if (hits.length > 1 && r.set) {
        const sets = await cachedJson<{ id: string; name: string }[]>(`${tcgdexAt(l)}/sets`, 72).catch(() => [])
        const nm = new Map(sets.map(s => [s.id, s.name]))
        hits = [...hits].sort((a, b) => near(r.set, nm.get(setOf(b.id)) ?? '') - near(r.set, nm.get(setOf(a.id)) ?? ''))
      }
      break
    }
  }
  const h = hits[0]
  return h ? loadCard('pokemon', setOf(h.id), h.id) : null
}
const setOf = (id: string) => id.slice(0, id.lastIndexOf('-'))

async function other(r: Row, game: GameId): Promise<Card | null> {
  const list = await searchCards(game, r.name).catch(() => [] as Card[])
  const n = numKey(r.number)
  const same = list.filter(c => !n || numKey(c.number) === n)
  if (!same.length) return null
  return [...same].sort((a, b) => near(r.set, b.setName ?? b.setId) - near(r.set, a.setName ?? a.setId))[0]
}

/** Cherche chaque ligne (3 à la fois, pour ne pas se faire bloquer par les sources de prix). */
export async function matchRows(rows: Row[], onProgress: (done: number) => void): Promise<Result> {
  const found: Imported[] = [], missing: Row[] = []
  let done = 0
  await pool(rows, 3, async r => {
    try {
      const game = r.game ?? 'pokemon'
      let hit: { card: Card; price: Price | null } | null = null
      if (game === 'pokemon') hit = await pokemon(r)
      else if (['magic', 'yugioh', 'lorcana'].includes(game)) {
        const card = await other(r, game)
        if (card) hit = { card, price: await priceFor(card) }
      }
      if (!hit) { missing.push(r); return }
      const { card, price } = hit
      found.push({ card, price, qty: r.qty, buy: r.buy, grade: r.grade, lang: r.lang })
    } catch {
      missing.push(r)
    } finally {
      onProgress(++done)
    }
  })
  missing.sort((a, b) => a.line - b.line)
  return { found, missing }
}
