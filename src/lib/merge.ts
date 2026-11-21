import type { State } from './store'

/** Réunit deux collections sans rien perdre : pour chaque carte on garde la plus grande quantité,
 *  et on garde tous les classeurs suivis (ceux de `a` d'abord). */
export function mergeStates(a: State, b: State): State {
  const owned: State['owned'] = { ...b.owned }
  for (const k in a.owned) {
    const x = a.owned[k], y = owned[k]
    owned[k] = !y ? x : x.qty >= y.qty ? { ...x, addedAt: Math.min(x.addedAt, y.addedAt) } : { ...y, addedAt: Math.min(x.addedAt, y.addedAt) }
  }
  const followed = [...a.followed]
  for (const f of b.followed) if (!followed.some(x => x.game === f.game && x.setId === f.setId)) followed.push(f)
  return { owned, followed }
}
