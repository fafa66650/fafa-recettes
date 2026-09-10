const CACHE='fafatraining-recettes-current';
const CORE=[
  './','./index.html','./style.css?build=final','./app.js?build=final','./recipes.json?build=final','./menus.json?build=final','./manifest.json',
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
  if(event.request.method!=='GET')return;
  const req=event.request;
  event.respondWith(fetch(req,{cache:'no-store'}).then(resp=>{
    if(resp&&resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}
    return resp;
  }).catch(async()=>{
    const exact=await caches.match(req);
    if(exact)return exact;
    if(req.mode==='navigate')return (await caches.match('./index.html'))||(await caches.match('./'));
    return new Response('',{status:504,statusText:'Offline'});
  }));
});
