// Service worker : rend l'appli installable et la rend rapide au 2e lancement.
// Les fichiers /assets/ ont un nom qui change à chaque version : on peut les garder pour toujours.
const C = 'cardora-v2'
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['/']))) })
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', e => {
  const r = e.request
  const url = new URL(r.url)
  if (r.method !== 'GET' || url.origin !== location.origin) return
  if (r.mode === 'navigate') {
    // Toujours la dernière version en ligne ; la copie gardée sert seulement hors connexion
    e.respondWith(fetch(r).then(res => { const copy = res.clone(); caches.open(C).then(c => c.put('/', copy)); return res }).catch(() => caches.match('/')))
    return
  }
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(C).then(c => c.put(r, copy)) }
      return res
    })))
  }
})
