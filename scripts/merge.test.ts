import assert from 'node:assert/strict'
import { mergeStates } from '../src/lib/merge.ts'

const card = (key: string) => ({ key, game: 'pokemon', id: key, setId: 's1', number: '1', name: key, image: '' }) as any
const own = (key: string, qty: number, addedAt = 1) => ({ card: card(key), qty, price: null, addedAt })
const set = (setId: string) => ({ game: 'pokemon', setId, name: setId, total: 10 }) as any

// carte seulement en local, seulement en ligne, des deux côtés
const local = { owned: { a: own('a', 1), c: own('c', 1, 5) }, followed: [set('s1')] }
const cloud = { owned: { b: own('b', 2), c: own('c', 3, 2) }, followed: [set('s1'), set('s2')] }
const m = mergeStates(local as any, cloud as any)
assert.deepEqual(Object.keys(m.owned).sort(), ['a', 'b', 'c'])
assert.equal(m.owned.c.qty, 3)          // la plus grande quantité
assert.equal(m.owned.c.addedAt, 2)      // la date d'ajout la plus ancienne
assert.equal(m.owned.b.qty, 2)
assert.deepEqual(m.followed.map(f => f.setId), ['s1', 's2']) // pas de doublon
// collections vides
assert.deepEqual(mergeStates({ owned: {}, followed: [] }, { owned: {}, followed: [] }), { owned: {}, followed: [], sealed: [], history: [] })
// prix d'achat gardé même s'il est du côté qui a la plus petite quantité
const m2 = mergeStates({ owned: { c: { ...own('c', 3), buy: null } }, followed: [] } as any, { owned: { c: { ...own('c', 1), buy: 12 } }, followed: [] } as any)
assert.equal(m2.owned.c.qty, 3)
assert.equal(m2.owned.c.buy, 12)
// scellé : réunis sans doublon ; historique : un jour = une ligne, triés
const sx = (id: string) => ({ id, game: 'pokemon', kind: 'etb', name: id, qty: 1, buy: 50, value: 60, valueAt: 1, addedAt: 1 })
const m3 = mergeStates(
  { owned: {}, followed: [], sealed: [sx('x'), sx('y')], history: [{ d: '2026-11-21', v: 10, cards: 10, sealed: 0 }] } as any,
  { owned: {}, followed: [], sealed: [sx('y'), sx('z')], history: [{ d: '2026-11-20', v: 5, cards: 5, sealed: 0 }, { d: '2026-11-21', v: 8, cards: 8, sealed: 0 }] } as any)
assert.deepEqual(m3.sealed!.map(s => s.id), ['x', 'y', 'z'])
assert.deepEqual(m3.history!.map(h => [h.d, h.v]), [['2026-11-20', 5], ['2026-11-21', 10]])
console.log('merge OK')
