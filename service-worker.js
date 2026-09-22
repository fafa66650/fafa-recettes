const CACHE='fafatraining-recettes-2026-09-22-r2';
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
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    if(self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});
async function networkFirst(request,event){
  try{
    const preload=event?.preloadResponse?await event.preloadResponse:null;
    const response=preload||await fetch(request,{cache:'no-cache'});
    if(response?.ok){
      const cache=await caches.open(CACHE);
      cache.put(request,response.clone()).catch(()=>{});
    }
    return response;
  }catch{
    return (await caches.match(request)) || (request.mode==='navigate'
      ? (await caches.match('./index.html')) || (await caches.match('./'))
      : new Response('',{status:504,statusText:'Offline'}));
  }
}
async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached) return cached;
  try{
    const response=await fetch(request);
    if(response?.ok){
      const cache=await caches.open(CACHE);
      cache.put(request,response.clone()).catch(()=>{});
    }
    return response;
  }catch{
    return new Response('',{status:504,statusText:'Offline'});
  }
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  const request=event.request;
  const mustRefresh=request.mode==='navigate' || /\/(?:index\.html|app\.js|style\.css|recipes\.json|menus\.json|manifest\.json)(?:$|\?)/.test(url.pathname+url.search);
  event.respondWith(mustRefresh?networkFirst(request,event):cacheFirst(request));
});
