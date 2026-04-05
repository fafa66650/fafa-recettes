
const CACHE='fafa-recettes-v7-cache';
const ASSETS=['./','./index.html','./style.css','./app.js','./recipes.js','./recipes.json','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request).then(net => {
    const copy = net.clone();
    caches.open(CACHE).then(c=>c.put(e.request, copy));
    return net;
  }).catch(()=>caches.match('./index.html'))));
});
