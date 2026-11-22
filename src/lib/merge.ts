import type { Sealed, Snap, State } from './store'

/** Réunit deux collections sans rien perdre : pour chaque carte on garde la plus grande quantité
 *  (et le prix d'achat noté d'un côté ou de l'autre), tous les classeurs suivis (ceux de `a` d'abord),
 *  tous les objets scellés et l'historique de valeur jour par jour. */
export function mergeStates(a: State, b: State): State {
  const owned: State['owned'] = { ...b.owned }
  for (const k in a.owned) {
    const x = a.owned[k], y = owned[k]
    if (!y) { owned[k] = x; continue }
    const keep = x.qty >= y.qty ? x : y
    owned[k] = { ...keep, addedAt: Math.min(x.addedAt, y.addedAt), buy: keep.buy ?? (keep === x ? y.buy : x.buy) ?? null, grade: keep.grade ?? (keep === x ? y.grade : x.grade) ?? null }
  }
  const followed = [...a.followed]
  for (const f of b.followed) if (!followed.some(x => x.game === f.game && x.setId === f.setId)) followed.push(f)

  const sealed: Sealed[] = [...(a.sealed ?? [])]
  for (const s of b.sealed ?? []) if (!sealed.some(x => x.id === s.id)) sealed.push(s)

  const days = new Map<string, Snap>()
  for (const h of [...(b.history ?? []), ...(a.history ?? [])]) days.set(h.d, h)
  const history = [...days.values()].sort((x, y) => x.d.localeCompare(y.d))

  const wish = { ...b.wish, ...a.wish }
  return { owned, followed, sealed, history, ...(Object.keys(wish).length ? { wish } : {}) }
}
