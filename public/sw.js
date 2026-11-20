// Service worker minimal : rend l'appli installable et garde la coquille pour un démarrage rapide.
const C = 'cardora-v1'
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['/']))) })
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()) })
self.addEventListener('fetch', e => {
  const r = e.request
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).catch(() => caches.match('/')))
  }
})
