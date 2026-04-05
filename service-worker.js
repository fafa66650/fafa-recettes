
const CACHE_NAME = 'fafatraining-v9-cache-1';
const ASSETS = ['./','./index.html','./style.css','./app.js','./recipes.json','./manifest.json','./logo.jpg','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(network => {
      const copy = network.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return network;
    }).catch(() => caches.match('./index.html')))
  );
});
