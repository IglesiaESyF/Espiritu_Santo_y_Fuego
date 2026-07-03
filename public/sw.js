const CACHE = 'iesfuego-v3'
const BASE = '/Espiritu_Santo_y_Fuego'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return
  if (req.url.includes('/sw.js')) return

  e.respondWith(
    fetch(req).then((res) => {
      const clone = res.clone()
      caches.open(CACHE).then((cache) => cache.put(req, clone))
      return res
    }).catch(() => caches.match(req))
  )
})
