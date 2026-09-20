const CACHE='fafatraining-recettes-runtime';
const CORE=[
  './','./index.html','./style.css','./app.js','./recipes.json','./menus.json','./manifest.json',
  './logo.jpg','./icons/icon-192.png','./icons/icon-512.png',
  './assets/characters/hero-character.jpg','./assets/characters/character-arms.jpg','./assets/characters/character-welcome.jpg',
  './assets/recipes/eau-coco-citron.jpg','./assets/recipes/lait-amande.jpg','./assets/recipes/matcha-latte.jpg',
  './assets/recipes/lait-or.jpg','./assets/recipes/eau-energie.jpg','./assets/recipes/eau-citron-concombre.jpg',
  './assets/recipes/boisson-proteinee.jpg','./assets/recipes/smoothie-chocolat.jpg','./assets/recipes/smoothie-vert.jpg','./assets/recipes/smoothie-recup.jpg'
];
const coreUrls=new Set(CORE.map(x=>new URL(x,self.location).href));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    const cache=await caches.open(CACHE);
    const requests=await cache.keys();
    await Promise.all(requests.filter(req=>!coreUrls.has(req.url)).map(req=>cache.delete(req)));
    if(self.registration.navigationPreload)await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});
async function networkFirst(request,event){
  try{
    const preload=event?.preloadResponse?await event.preloadResponse:null;
    const response=preload||await fetch(request);
    if(response?.ok){const cache=await caches.open(CACHE);cache.put(request,response.clone()).catch(()=>{});}
    return response;
  }catch{
    return (await caches.match(request))||(request.mode==='navigate'?(await caches.match('./index.html'))||(await caches.match('./')):new Response('',{status:504,statusText:'Offline'}));
  }
}
async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached)return cached;
  try{const response=await fetch(request);if(response?.ok){const cache=await caches.open(CACHE);cache.put(request,response.clone()).catch(()=>{});}return response;}catch{return new Response('',{status:504,statusText:'Offline'});}
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  const request=event.request;
  if(request.mode==='navigate'||/\/(recipes|menus)\.json(?:$|\?)/.test(request.url)){event.respondWith(networkFirst(request,event));return;}
  event.respondWith(cacheFirst(request));
});
