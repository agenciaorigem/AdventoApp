const cacheName = 'advento-v3';
const scopedCache = self.registration.scope + cacheName;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(scopedCache).then(cache =>
    cache.addAll(['./', './aplicativo.html', './painel.js', './capa-vertical.png', './manifest.webmanifest', './icone-192.png', './icone-512.png'])
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(self.registration.scope + 'advento-') && key !== scopedCache)
      .map(key => caches.delete(key))
  )));
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate' && event.request.url.startsWith(self.registration.scope)) {
    event.respondWith(fetch(event.request).catch(() => caches.open(scopedCache).then(cache => cache.match(event.request, {ignoreSearch:true}))));
  }
});
