const CACHE='fafatraining-recettes-final';
const CORE=[
  './','./index.html','./style.css','./app.js','./recipes.json','./menus.json','./manifest.json',
  './logo.jpg','./icons/icon-192.png','./icons/icon-512.png',
  './assets/characters/hero-character.jpg','./assets/characters/character-arms.jpg','./assets/characters/character-welcome.jpg',
  './assets/recipes/eau-coco-citron.jpg','./assets/recipes/lait-amande.jpg','./assets/recipes/matcha-latte.jpg',
  './assets/recipes/lait-or.jpg','./assets/recipes/eau-energie.jpg','./assets/recipes/eau-citron-concombre.jpg',
  './assets/recipes/boisson-proteinee.jpg','./assets/recipes/smoothie-chocolat.jpg','./assets/recipes/smoothie-vert.jpg','./assets/recipes/smoothie-recup.jpg'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(resp=>{
      const copy=resp.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy)).catch(()=>{});return resp;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(resp=>{
    if(resp && resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}
    return resp;
  }).catch(()=>new Response('',{status:504,statusText:'Offline'}))));
});
