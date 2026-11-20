const mem = new Map<string, unknown>()
const PREFIX = 'cardora-cache:'

/** Récupère du JSON avec un cache mémoire + appareil (durée en heures). */
export async function cachedJson<T>(url: string, hours = 24): Promise<T> {
  if (mem.has(url)) return mem.get(url) as T
  try {
    const raw = localStorage.getItem(PREFIX + url)
    if (raw) {
      const { t, d } = JSON.parse(raw)
      if (Date.now() - t < hours * 3600_000) {
        mem.set(url, d)
        return d as T
      }
    }
  } catch { /* pas de stockage : on ignore */ }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const d = (await res.json()) as T
  mem.set(url, d)
  try {
    localStorage.setItem(PREFIX + url, JSON.stringify({ t: Date.now(), d }))
  } catch {
    // stockage plein : on vide les vieux caches et on n'insiste pas
    try {
      Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).slice(0, 50).forEach(k => localStorage.removeItem(k))
    } catch { /* rien */ }
  }
  return d
}

/** Lance des tâches avec au plus `n` en même temps. */
export async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const x = items[i++]
      try { await fn(x) } catch { /* une carte en erreur ne bloque pas les autres */ }
    }
  })
  await Promise.all(workers)
}
