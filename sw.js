/* Ο Μάστορας — service worker (offline cache) */
const CACHE = 'mastoras-v3';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-512.png', './icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const isDoc = req.mode === 'navigate' || (req.destination === 'document') || /\.html($|\?)/.test(req.url) || req.url.endsWith('/');
  if (isDoc) {
    // network-first για το HTML → οι ενημερώσεις φτάνουν αμέσως, cache ως εφεδρεία offline
    e.respondWith(
      fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  // cache-first για τα υπόλοιπα assets
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      const cp = res.clone();
      caches.open(CACHE).then(c => c.put(req, cp));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
