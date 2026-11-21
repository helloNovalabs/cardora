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
assert.deepEqual(mergeStates({ owned: {}, followed: [] }, { owned: {}, followed: [] }), { owned: {}, followed: [] })
console.log('merge OK')
