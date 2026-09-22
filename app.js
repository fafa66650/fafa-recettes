const STORAGE_KEY='fafatraining-recettes';
const DB_NAME='fafatraining-recettes-db';
const DB_STORE='app-state';
const DB_KEY='prefs';
let storageDbPromise=null;
const RECIPE_ID_ALIASES={'ufs-tomate-cumin-facon-chakchouka':'shakshuka-facile',"muffins-pomme-avoine-2":"muffins-pomme-avoine","omelette-epinards-champignons":"omelette-champignons-epinards","flan-vanille-coco":"flan-coco-vanille","crevettes-coco-curry":"crevettes-curry-coco","smoothie-banane-cafe-cacao":"smoothie-cafe-banane-cacao","semoule-poulet-legumes-epices-douces":"semoule-poulet-legumes","pates-aubergine-tomate":"pates-aubergine-tomate-basilic","veloute-celeri-pomme":"veloute-celeri-rave-pomme","boulgour-dinde-tomate-menthe":"boulgour-dinde-tomate","pancakes-yaourt-citron":"pancakes-ricotta-citron","tartines-avocat-tomate-uf":"tartines-avocat-uf","porridge-poire-cacao-noisettes":"porridge-cacao-orange-noisettes","porridge-mangue-coco":"porridge-ananas-coco-gingembre","chia-pudding-mangue-citron-vert":"chia-pudding-framboise-vanille","muesli-chaud-pomme-raisins":"bircher-muesli-pomme-raisins","ufs-brouilles-tomate-feta":"menemen-turc","omelette-courgette-basilic":"frittata-courgette-basilic","pois-chiches-dahl-coco-epinards":"lentilles-corail-dahl-coco-epinards","haricots-rouges-dahl-coco-epinards":"lentilles-corail-dahl-coco-epinards","haricots-blancs-dahl-coco-epinards":"lentilles-corail-dahl-coco-epinards","pois-casses-dahl-coco-epinards":"lentilles-corail-dahl-coco-epinards","lentilles-corail-tomate-cumin-legumes":"pois-chiches-tomate-cumin-legumes","haricots-rouges-tomate-cumin-legumes":"pois-chiches-tomate-cumin-legumes","haricots-blancs-tomate-cumin-legumes":"pois-chiches-tomate-cumin-legumes","pois-casses-tomate-cumin-legumes":"pois-chiches-tomate-cumin-legumes","lentilles-corail-paprika-poivrons":"haricots-rouges-paprika-poivrons","pois-chiches-paprika-poivrons":"haricots-rouges-paprika-poivrons","haricots-blancs-paprika-poivrons":"haricots-rouges-paprika-poivrons","pois-casses-paprika-poivrons":"haricots-rouges-paprika-poivrons","lentilles-corail-citron-herbes-boulgour":"pois-chiches-citron-herbes-boulgour","haricots-rouges-citron-herbes-boulgour":"pois-chiches-citron-herbes-boulgour","haricots-blancs-citron-herbes-boulgour":"pois-chiches-citron-herbes-boulgour","pois-casses-citron-herbes-boulgour":"pois-chiches-citron-herbes-boulgour","puree-pois-chiches-citron":"houmous-classique","smoothie-kiwi-maison":"smoothie-kiwi-pomme","smoothie-pomme-maison":"smoothie-kiwi-pomme","lait-cajou-maison":"lait-de-cajou-vanille","veloute-brocoli-leger":"veloute-brocoli-pomme-de-terre","smoothie-cafe-banane-cacao":"cafe-frappe-banane-cacao","poulet-tomates-poivrons":"poulet-basquaise-facile","eau-pasteque-menthe-citron-vert":"eau-pasteque-menthe","poulet-a-la-creme-et-champignons":"poulet-moutarde-champignons","crevettes-ail-citron-persil":"crevettes-ail-et-persil","buf-bourguignon-simplifie":"buf-bourguignon-sans-alcool"};
const DEFAULT_PREFS={mode:'classic',guided:true,household:4,restrictions:[],equipment:['Cuisine classique'],favorites:[],favoriteMenus:[],menuOverrides:{},pantry:[],pantryFavorites:[],pantryRecent:[],shopping:[],manualShopping:[],shoppingDone:[],planning:{},recipeNotes:{},leftovers:{},customRecipes:[],lastPage:'home',recentCategories:[],recentRecipes:[]};
const state={
  recipes:[],menus:[],
  prefs:{...DEFAULT_PREFS},
  filters:{query:'',category:'',subtype:'',cuisine:'',cuisineGroup:'',time:'',equipment:'',style:'',favoritesOnly:false,fridgeOnly:false,mealOnly:false},
  visible:48,
  currentRecipe:null,
  currentServings:4,
  currentDrawerMode:'classic',
  currentDeviceMode:'',
  homeFeaturedKey:'all',
  menuFilter:'',menuUniverse:'',menuSearch:'',pantryGroup:'',
  surpriseTime:'20',
  planAssign:{type:null,id:null,slot:'lunch'},
  pageHistory:[],
  export:{type:null,id:null,format:'portrait',style:'social'},
  cook:{recipe:null,steps:[],index:0,timerLeft:0,timerInitial:0,timerId:null}
};

const MODE_META={
  classic:{short:'Méthode classique',title:'Cuisine classique',desc:'Poêle, casserole, four ou autre matériel réellement utile à la recette.'},
  tm6:{short:'Thermomix TM6',title:'Thermomix TM6',desc:'Uniquement lorsque la recette dispose d’un protocole TM6 précis et vérifié.'}
};
const HOME_STYLES=['Cuisine facile','Cuisine express','Cuisine du quotidien','Cuisine familiale','Cuisine maison','Cuisine légère','Cuisine protéinée','Cuisine végétale','Cuisine plaisir','Cuisine économique','Batch cooking'];
const HOME_FEATURED_FILTERS=[
  {key:'all',label:'Tout'},
  {key:'Boissons & smoothies',label:'Boissons'},
  {key:'Petit-déjeuner',label:'Petit-déj'},
  {key:'plats',label:'Plats'},
  {key:'Desserts',label:'Desserts'},
  {key:'Cuisine facile',label:'Cuisine facile'}
];
const QUICK_CATEGORIES=['Boissons & smoothies','Petit-déjeuner','Entrées & salades','Poulet & volaille','Poissons & fruits de mer','Végétarien','Pâtes, riz & céréales','Soupes & veloutés','Desserts','Collations'];
const allergenLabels={gluten:'gluten',lactose:'lait / produits laitiers',oeufs:'œufs',fruits_a_coque:'fruits à coque',soja:'soja',poisson:'poisson',crustaces:'crustacés',arachides:'arachides',sesame:'sésame',moutarde:'moutarde',celeri:'céleri',mollusques:'mollusques',lupin:'lupin',sulfites:'sulfites'};
const restrictionOptions=[['gluten','Sans gluten'],['lactose','Sans lait / produits laitiers'],['oeufs','Sans œufs'],['fruits_a_coque','Sans fruits à coque'],['soja','Sans soja'],['poisson','Sans poisson'],['crustaces','Sans crustacés'],['arachides','Sans arachides'],['sesame','Sans sésame'],['moutarde','Sans moutarde'],['celeri','Sans céleri'],['mollusques','Sans mollusques'],['lupin','Sans lupin'],['sulfites','Sans sulfites']];
const equipmentOptions=['Cuisine classique','Four','Poêle','Blender / mixeur','Thermomix TM6'];
const equipmentDisplay={'Cuisine classique':'Méthode classique','Thermomix TM6':'Thermomix TM6'};
const deviceLabels={tm6:'Thermomix TM6'};
const categoryIcon={
  'Boissons & smoothies':'🥤','Légumes & accompagnements':'🥦','Petit-déjeuner':'🥣','Entrées & salades':'🥗','Poulet & volaille':'🍗','Viandes':'🥩','Poissons & fruits de mer':'🐟','Végétarien':'🌿','Pâtes, riz & céréales':'🍝','Soupes & veloutés':'🍲','Four & gratins':'🔥','Desserts':'🍰','Collations':'🍎','Sauces & bases':'🥣','Repas protéinés':'💪','Recettes légères':'🥗','Batch cooking':'📦'
};
const CUISINE_GROUPS=['Caraïbes','Océan Indien','Europe & Méditerranée','Maghreb & Moyen-Orient','Asie','Afrique','Amérique latine','Amérique du Nord','Créations maison'];
const CUISINE_GROUP_LABELS={
  'Caraïbes':'Caraïbes & Antilles',
  'Océan Indien':'Océan Indien',
  'Europe & Méditerranée':'Europe & Méditerranée',
  'Maghreb & Moyen-Orient':'Maghreb & Levant',
  'Asie':'Asie',
  'Afrique':'Afrique de l’Ouest & autres cuisines africaines',
  'Amérique latine':'Amérique latine',
  'Amérique du Nord':'Amérique du Nord',
  'Créations maison':'Créations maison'
};
const PLAN_DAYS=[['mon','Lundi'],['tue','Mardi'],['wed','Mercredi'],['thu','Jeudi'],['fri','Vendredi'],['sat','Samedi'],['sun','Dimanche']];
const PLAN_SLOTS=[['lunch','Midi'],['dinner','Soir']];


const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const escapeHtml=(s='')=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const uniq=a=>[...new Set(a)];
const norm=s=>String(s||'').replaceAll('œ','oe').replaceAll('Œ','OE').replaceAll('æ','ae').replaceAll('Æ','AE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const slug=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const imgSrc=r=>r.image?String(r.image).replace(/^\//,''):'';
const totalTime=r=>(Number(r.prepMin)||0)+(Number(r.cookMin)||0);
const modeLabel=m=>MODE_META[m]?.title||'Autre appareil';
const isMainCourseCategory=cat=>['Poulet & volaille','Viandes','Poissons & fruits de mer','Végétarien','Pâtes, riz & céréales'].includes(cat);

function openStorageDb(){
  if(!('indexedDB' in window))return Promise.reject(new Error('IndexedDB indisponible'));
  if(storageDbPromise)return storageDbPromise;
  storageDbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE);};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Ouverture IndexedDB impossible'));
  });
  return storageDbPromise;
}
async function idbRead(key){
  const db=await openStorageDb();
  return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly');const req=tx.objectStore(DB_STORE).get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
}
async function idbWrite(key,value){
  const db=await openStorageDb();
  return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Écriture IndexedDB annulée'));});
}
async function loadPrefs(){
  let x={};
  try{
    const stored=await idbRead(DB_KEY);
    if(stored&&typeof stored==='object')x=stored;
    else{
      const raw=localStorage.getItem(STORAGE_KEY);x=JSON.parse(raw||'{}');
      if(raw){await idbWrite(DB_KEY,x);localStorage.removeItem(STORAGE_KEY);}
    }
  }catch{
    try{const raw=localStorage.getItem(STORAGE_KEY);x=JSON.parse(raw||'{}');}catch{x={};}
  }
  state.prefs={...DEFAULT_PREFS,...x};
  state.prefs.shopping=(state.prefs.shopping||[]).map(x=>typeof x==='string'?{id:x,servings:null}:x).filter(Boolean);
  state.prefs.manualShopping=(state.prefs.manualShopping||[]).filter(x=>x&&x.name);state.prefs.pantryFavorites=state.prefs.pantryFavorites||[];state.prefs.pantryRecent=state.prefs.pantryRecent||[];
  state.prefs.favoriteMenus=state.prefs.favoriteMenus||[];
  state.prefs.menuOverrides=state.prefs.menuOverrides||{};
  state.prefs.planning=state.prefs.planning||{};state.prefs.household=Math.max(1,Math.min(12,Number(state.prefs.household)||4));state.prefs.recipeNotes=state.prefs.recipeNotes||{};state.prefs.leftovers=state.prefs.leftovers||{};state.prefs.customRecipes=state.prefs.customRecipes||[];
  migrateRecipeAliases();
}
function canonicalRecipeId(id){return RECIPE_ID_ALIASES[id]||id;}
function migrateRecipeAliases(){
  const mapId=id=>canonicalRecipeId(id);
  state.prefs.favorites=uniq((state.prefs.favorites||[]).map(mapId));
  state.prefs.recentRecipes=uniq((state.prefs.recentRecipes||[]).map(mapId));
  state.prefs.shopping=(state.prefs.shopping||[]).map(x=>({...x,id:mapId(x.id)}));
  Object.values(state.prefs.planning||{}).forEach(x=>{if(x?.type==='recipe'&&x.id)x.id=mapId(x.id);});
  for(const key of Object.keys(RECIPE_ID_ALIASES)){const target=RECIPE_ID_ALIASES[key];if(state.prefs.recipeNotes?.[key]&&!state.prefs.recipeNotes[target])state.prefs.recipeNotes[target]=state.prefs.recipeNotes[key];delete state.prefs.recipeNotes?.[key];if(state.prefs.leftovers?.[key]&&!state.prefs.leftovers[target])state.prefs.leftovers[target]=state.prefs.leftovers[key];delete state.prefs.leftovers?.[key];}
}

function savePrefs(){
  const snapshot=typeof structuredClone==='function'?structuredClone(state.prefs):JSON.parse(JSON.stringify(state.prefs));
  idbWrite(DB_KEY,snapshot).then(()=>{try{localStorage.removeItem(STORAGE_KEY);}catch{}}).catch(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot));}catch{}});
}
function toast(msg){const el=$('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),1800);}

async function fetchJson(url){
  const response=await fetch(url,{cache:'no-cache'});
  if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}
function validateLoadedData(recipes,menus){
  if(!Array.isArray(recipes)||!Array.isArray(menus))throw new Error('Format de données invalide');
  const recipeIds=new Set();
  for(const r of recipes){if(!r||typeof r.id!=='string'||!r.id||!r.name||!Array.isArray(r.ingredients))throw new Error('Recette invalide');if(recipeIds.has(r.id))throw new Error(`ID recette dupliqué: ${r.id}`);recipeIds.add(r.id);}
  const menuIds=new Set();
  for(const m of menus){if(!m||typeof m.id!=='string'||!m.id||!Array.isArray(m.recipes))throw new Error('Menu invalide');if(menuIds.has(m.id))throw new Error(`ID menu dupliqué: ${m.id}`);menuIds.add(m.id);for(const id of m.recipes){if(!recipeIds.has(id))throw new Error(`Référence menu introuvable: ${id}`);}}
}
function registerServiceWorker(){
  if(!('serviceWorker' in navigator))return;
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{}),{once:true});
}

const OVERLAY_TRIGGER_MAP={settingsDrawer:['#settingsBtn'],filterDrawer:['#openAdvancedFiltersBtn'],kitchenGuideDrawer:['#openKitchenGuideBtn'],customRecipeDrawer:['#addCustomRecipeBtn'],surpriseDrawer:['#homeSurpriseBtn']};
const overlayFocusReturn=new Map();
const focusableSelector='button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function isOverlayOpen(el){return Boolean(el&&(el.classList.contains('open')));}
function openOverlays(){return [...document.querySelectorAll('.drawer.open,.cook-mode.open')];}
function syncBodyLock(){document.body.style.overflow=openOverlays().length?'hidden':'';}
function syncOverlayA11y(el){
  if(!el)return;const open=isOverlayOpen(el);el.setAttribute('aria-hidden',String(!open));
  (OVERLAY_TRIGGER_MAP[el.id]||[]).forEach(sel=>document.querySelectorAll(sel).forEach(t=>t.setAttribute('aria-expanded',String(open))));
  if(open){
    if(!overlayFocusReturn.has(el))overlayFocusReturn.set(el,document.activeElement);
    const focusFirst=()=>{const dialog=el.querySelector('[role="dialog"]')||el;const first=dialog.querySelector('[autofocus],'+focusableSelector);if(first&&document.activeElement!==first)first.focus({preventScroll:true});};
    focusFirst();requestAnimationFrame(focusFirst);setTimeout(()=>{if(isOverlayOpen(el))focusFirst();},80);
  }else if(overlayFocusReturn.has(el)){
    const previous=overlayFocusReturn.get(el);overlayFocusReturn.delete(el);
    requestAnimationFrame(()=>{if(previous&&previous.isConnected&&!previous.closest('[aria-hidden="true"]'))previous.focus({preventScroll:true});});
  }
  syncBodyLock();
}
function setupOverlayAccessibility(){
  const overlays=[...document.querySelectorAll('.drawer'),$('#cookMode')].filter(Boolean);
  const observer=new MutationObserver(records=>{for(const r of records)syncOverlayA11y(r.target);});
  overlays.forEach(el=>{observer.observe(el,{attributes:true,attributeFilter:['class']});syncOverlayA11y(el);});
  document.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;const overlaysNow=openOverlays();const top=overlaysNow.at(-1);if(!top)return;const dialog=top.querySelector('[role="dialog"]')||top;const nodes=[...dialog.querySelectorAll(focusableSelector)].filter(x=>x.offsetParent!==null);if(!nodes.length){e.preventDefault();dialog.setAttribute('tabindex','-1');dialog.focus();return;}const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
}
function closeTopOverlay(){
  const top=openOverlays().at(-1);if(!top)return false;
  const actions={cookMode:closeCook,exportDrawer:closeExport,planAssignDrawer:()=>openPlanAssign(false),surpriseDrawer:()=>openSurprise(false),customRecipeDrawer:()=>openCustomRecipe(false),kitchenGuideDrawer:()=>openKitchenGuide(false),settingsDrawer:()=>openSettings(false),filterDrawer:()=>openFilterDrawer(false),menuDrawer:closeMenuDrawer,recipeDrawer:closeRecipe};
  (actions[top.id]||(()=>{top.classList.remove('open');}))();return true;
}

async function init(){
  await loadPrefs();
  try{
    const [recipes,menus]=await Promise.all([fetchJson('recipes.json'),fetchJson('menus.json')]);
    validateLoadedData(recipes,menus);
    state.recipes=recipes;
    state.menus=menus;
    if(state.prefs.customRecipes?.length){const ids=new Set(state.recipes.map(r=>r.id));state.recipes.push(...state.prefs.customRecipes.filter(r=>!ids.has(r.id)));}
  }catch(e){
    document.body.innerHTML='<div style="padding:30px;color:white;font-family:sans-serif">Impossible de charger les données. Ouvre l’application via un petit serveur web ou depuis son hébergement PWA.</div>';
    return;
  }
  buildStaticUI();
  setupOverlayAccessibility();
  bindEvents();
  registerServiceWorker();
  applyModeButtons();
  renderAll();
  const allowed=['home','recipes','organize','menus','planning','fridge','shopping'];
  navigate(allowed.includes(state.prefs.lastPage)?state.prefs.lastPage:'home',false,false);
}

function buildStaticUI(){
  if($('#heroModeButtons'))$('#heroModeButtons').innerHTML=Object.entries(MODE_META).map(([k,v])=>`<button class="mode-card mode-${k}" data-mode="${k}"><strong>${escapeHtml(v.short)}</strong></button>`).join('');
  if($('#settingsMode'))$('#settingsMode').innerHTML=Object.entries(MODE_META).map(([k,v])=>`<button data-mode="${k}">${escapeHtml(v.short)}</button>`).join('');
  if($('#householdChoices'))$('#householdChoices').innerHTML=[1,2,3,4,5,6].map(n=>`<button data-household="${n}" class="${state.prefs.household===n?'active':''}">${n}</button>`).join('');
  const availableStyles=HOME_STYLES.filter(st=>state.recipes.some(r=>(r.styles||[]).includes(st)));
  $('#recipeStyleChips').innerHTML=['Toutes',...availableStyles].map((st,i)=>`<button class="style-chip ${i===0?'active':''}" data-recipe-style="${i===0?'':escapeHtml(st)}">${escapeHtml(st)}</button>`).join('');
  const allCats=uniq(state.recipes.map(r=>r.category)).sort((a,b)=>a.localeCompare(b,'fr'));
  $('#categoryFilter').innerHTML='<option value="">Toutes les catégories</option>'+allCats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if($('#cuisineFilter')){const cuisines=uniq(state.recipes.map(r=>r.cuisine).filter(Boolean)).sort((a,b)=>a.localeCompare(b,'fr'));$('#cuisineFilter').innerHTML='<option value="">Toutes les cuisines</option>'+cuisines.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');}
  if($('#guidedModeToggle'))$('#guidedModeToggle').checked=state.prefs.guided!==false;
  if($('#customCategory'))$('#customCategory').innerHTML=allCats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  $('#restrictionChips').innerHTML=restrictionOptions.map(([k,l])=>`<button class="restriction-chip ${state.prefs.restrictions.includes(k)?'active':''}" data-restriction="${k}">${l}</button>`).join('');
  $('#equipmentChips').innerHTML=equipmentOptions.map(e=>`<button class="restriction-chip ${state.prefs.equipment.includes(e)?'active':''}" data-pref-equipment="${escapeHtml(e)}">${escapeHtml(equipmentDisplay[e]||e)}</button>`).join('');
  $('#planDaySelect').innerHTML=PLAN_DAYS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('');
  renderRecipeLibrary();
  renderMenuUniverses();
}
function bindEvents(){
  $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));
  $('#topBackBtn').onclick=goBack;
  const runHomeSearch=()=>{state.filters.query=$('#homeSearch').value.trim();$('#recipeSearch').value=state.filters.query;navigate('recipes');renderRecipes(true);};
  $('#homeSearchBtn').onclick=runHomeSearch;$('#homeSearch').addEventListener('keydown',e=>{if(e.key==='Enter')runHomeSearch();});
  $('#recipeSearch').addEventListener('input',e=>{state.filters.query=e.target.value.trim();renderRecipes(true);});
  $('#openAdvancedFiltersBtn').onclick=()=>openFilterDrawer(true);$('#applyFiltersBtn').onclick=()=>{openFilterDrawer(false);renderRecipes(true);};$$('[data-close-filter]').forEach(x=>x.onclick=()=>openFilterDrawer(false));
  $('#categoryFilter').onchange=e=>{state.filters.category=e.target.value;state.filters.subtype='';renderRecipes(true);};
  if($('#cuisineFilter'))$('#cuisineFilter').onchange=e=>{state.filters.cuisine=e.target.value;renderRecipes(true);};
  $('#timeFilter').onchange=e=>{state.filters.time=e.target.value;renderRecipes(true);};$('#equipmentFilter').onchange=e=>{state.filters.equipment=e.target.value;renderRecipes(true);};$('#favoritesOnly').onchange=e=>{state.filters.favoritesOnly=e.target.checked;renderRecipes(true);};$('#mealOnly').onchange=e=>{state.filters.mealOnly=e.target.checked;renderRecipes(true);};
  $('#resetFiltersBtn').onclick=resetFilters;$('#loadMoreBtn').onclick=()=>{state.visible+=48;renderRecipes();};
  $('#showAllRecipesBtn').onclick=()=>{state.filters.category='';state.filters.subtype='';state.filters.query='';$('#recipeSearch').value='';state._showAllRecipes=true;renderRecipes(true);};
  $('#backToRecipeCategories').onclick=()=>{state._showAllRecipes=false;resetFilters(false);renderRecipes(true);window.scrollTo({top:0,behavior:'smooth'});};
  $('#favoriteTopBtn').onclick=()=>{state.filters.favoritesOnly=true;$('#favoritesOnly').checked=true;navigate('recipes');renderRecipes(true);};
  if($('#surpriseTopBtn'))$('#surpriseTopBtn').onclick=()=>openSurprise(true);$('#homeSurpriseBtn').onclick=()=>openSurprise(true);$$('[data-home-idea]').forEach(b=>b.onclick=()=>{const a=b.dataset.homeIdea;if(a==='fridge'){navigate('fridge');return;}if(a==='quick'){state.filters.time='20';state.filters.mealOnly=true;navigate('recipes');renderRecipes(true);return;}if(a==='veg'){state.filters.category='Végétarien';state.filters.subtype='';navigate('recipes');renderRecipes(true);return;}openSurprise(true);});
  $('#settingsBtn').onclick=()=>openSettings(true);if($('#guideTopBtn'))$('#guideTopBtn').onclick=()=>openKitchenGuide(true);if($('#openKitchenGuideBtn'))$('#openKitchenGuideBtn').onclick=()=>openKitchenGuide(true);$$('[data-close-guide]').forEach(x=>x.onclick=()=>openKitchenGuide(false));$$('[data-close-settings]').forEach(x=>x.onclick=()=>openSettings(false));$$('[data-close-drawer]').forEach(x=>x.onclick=closeRecipe);$$('[data-close-menu]').forEach(x=>x.onclick=closeMenuDrawer);$$('[data-close-surprise]').forEach(x=>x.onclick=()=>openSurprise(false));$$('[data-close-plan]').forEach(x=>x.onclick=()=>openPlanAssign(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&closeTopOverlay()){e.preventDefault();e.stopPropagation();}});
  $('#clearFridgeBtn').onclick=()=>{state.prefs.pantry=[];savePrefs();renderPantry();renderFridgeResults();toast('Sélection vidée');};$('#fridgeSearch').addEventListener('input',()=>{state.pantryGroup=$('#fridgeSearch').value.trim()?'__search__':'';renderPantry();syncFridgeSearchAction();});$('#fridgeSearch').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('#fridgeAddSearchBtn').classList.contains('hidden'))addFridgeSearchIngredient();});
  if($('#fridgeAddSearchBtn'))$('#fridgeAddSearchBtn').onclick=addFridgeSearchIngredient;if($('#fridgeSeeResultsBtn'))$('#fridgeSeeResultsBtn').onclick=()=>{renderFridgeResults();$('#fridgeResults').scrollIntoView({behavior:'smooth',block:'start'});};$('#showAllPantryBtn').onclick=()=>{state.pantryGroup='__all__';$('#fridgeSearch').value='';syncFridgeSearchAction();renderPantry();};$('#closePantryGroupBtn').onclick=()=>{state.pantryGroup='';$('#fridgeSearch').value='';syncFridgeSearchAction();renderPantry();};
  $('#menuSearch').addEventListener('input',e=>{state.menuSearch=e.target.value.trim();renderMenus();});$('#menuFavoritesBtn').onclick=()=>{state.menuFilter=state.menuFilter==='__favorites__'?'':'__favorites__';renderMenus();};$('#resetMenuFiltersBtn').onclick=()=>{state.menuUniverse='__all__';state.menuFilter='';state.menuSearch='';$('#menuSearch').value='';renderMenuUniverses();renderMenus();};$('#backToMenuUniverses').onclick=()=>{state.menuUniverse='';state.menuFilter='';renderMenuUniverses();renderMenus();};
  $('#copyShoppingBtn').onclick=copyShopping;if($('#shareShoppingBtn'))$('#shareShoppingBtn').onclick=shareShopping;if($('#printShoppingBtn'))$('#printShoppingBtn').onclick=printShopping;$('#clearShoppingBtn').onclick=()=>{if(!state.prefs.shopping.length&&!state.prefs.manualShopping.length)return;state.prefs.shopping=[];state.prefs.manualShopping=[];state.prefs.shoppingDone=[];savePrefs();renderShopping();toast('Liste vidée');};
  if($('#manualShoppingAddBtn'))$('#manualShoppingAddBtn').onclick=addManualShoppingItem;if($('#manualShoppingInput'))$('#manualShoppingInput').addEventListener('keydown',e=>{if(e.key==='Enter')addManualShoppingItem();});$$('[data-shopping-nav]').forEach(b=>b.onclick=()=>{const target=b.dataset.shoppingNav;if(target==='planning'&&Object.values(state.prefs.planning||{}).some(Boolean)){planningToShopping();return;}navigate(target);});
  $('#resetPrefsBtn').onclick=()=>{state.prefs={...DEFAULT_PREFS,household:state.prefs.household,favorites:state.prefs.favorites,favoriteMenus:state.prefs.favoriteMenus,menuOverrides:state.prefs.menuOverrides,shopping:state.prefs.shopping,manualShopping:state.prefs.manualShopping,shoppingDone:state.prefs.shoppingDone,pantry:state.prefs.pantry,pantryFavorites:state.prefs.pantryFavorites,pantryRecent:state.prefs.pantryRecent,planning:state.prefs.planning,recipeNotes:state.prefs.recipeNotes,leftovers:state.prefs.leftovers,customRecipes:state.prefs.customRecipes};savePrefs();buildStaticUI();bindDynamicUI();applyModeButtons();renderAll();toast('Préférences réinitialisées');};
  if($('#guidedModeToggle'))$('#guidedModeToggle').onchange=e=>{state.prefs.guided=e.target.checked;savePrefs();toast(state.prefs.guided?'Mode accompagné activé':'Mode accompagné désactivé');};
  $('#clearPlanningBtn').onclick=()=>{state.prefs.planning={};savePrefs();renderPlanning();toast('Planning vidé');};$('#planningToShoppingBtn').onclick=planningToShopping;$('#openMenusFromPlanningBtn').onclick=()=>navigate('menus');$('#planLunchBtn').onclick=()=>setPlanSlot('lunch');$('#planDinnerBtn').onclick=()=>setPlanSlot('dinner');$('#confirmPlanBtn').onclick=confirmPlanAssignment;
  $('#generateSurpriseBtn').onclick=generateSurprise;$$('[data-surprise-time]').forEach(b=>b.onclick=()=>{state.surpriseTime=b.dataset.surpriseTime;$$('[data-surprise-time]').forEach(x=>x.classList.toggle('active',x===b));});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&$('#cookMode').classList.contains('open'))requestCookWakeLock();});
  $('#closeCookBtn').onclick=closeCook;$('#cookPrevBtn').onclick=()=>moveCook(-1);$('#cookNextBtn').onclick=()=>moveCook(1);if($('#cookReadBtn'))$('#cookReadBtn').onclick=speakCookStep;if($('#cookRepeatBtn'))$('#cookRepeatBtn').onclick=repeatCookStep;$('#cookTimerBtn').onclick=toggleTimerPanel;$('#timerToggleBtn').onclick=toggleTimer;$('#timerResetBtn').onclick=resetTimer;
  $$('[data-close-export]').forEach(x=>x.onclick=closeExport);$('#downloadExportBtn').onclick=downloadExportImage;$('#shareExportBtn').onclick=shareExportImage;$('#exportCharacter').onchange=renderExportCanvas;if($('#exportLogo'))$('#exportLogo').onchange=renderExportCanvas;$$('[data-export-format]').forEach(b=>b.onclick=()=>{state.export.format=b.dataset.exportFormat;$$('[data-export-format]').forEach(x=>x.classList.toggle('active',x===b));renderExportCanvas();});$$('[data-export-style]').forEach(b=>b.onclick=()=>{state.export.style=b.dataset.exportStyle;$$('[data-export-style]').forEach(x=>x.classList.toggle('active',x===b));renderExportCanvas();});
  if($('#addCustomRecipeBtn'))$('#addCustomRecipeBtn').onclick=()=>openCustomRecipe(true);$$('[data-close-custom]').forEach(x=>x.onclick=()=>openCustomRecipe(false));if($('#saveCustomRecipeBtn'))$('#saveCustomRecipeBtn').onclick=saveCustomRecipe;if($('#exportDataBtn'))$('#exportDataBtn').onclick=exportUserData;if($('#importDataInput'))$('#importDataInput').onchange=importUserData;
  bindDynamicUI();
}
function openKitchenGuide(open){const d=$('#kitchenGuideDrawer');if(!d)return;d.classList.toggle('open',open);d.setAttribute('aria-hidden',String(!open));if(open)document.body.style.overflow='hidden';else if(!$('#recipeDrawer').classList.contains('open')&&!$('#menuDrawer').classList.contains('open'))document.body.style.overflow='';}

function bindDynamicUI(){
  $$('[data-mode]').forEach(b=>b.onclick=()=>setPreferredMode(b.dataset.mode));
  $$('[data-household]').forEach(b=>b.onclick=()=>{state.prefs.household=Number(b.dataset.household);savePrefs();$$('[data-household]').forEach(x=>x.classList.toggle('active',x===b));toast(`${state.prefs.household} personne${state.prefs.household>1?'s':''} par défaut`);});
  $$('[data-recipe-style]').forEach(b=>b.onclick=()=>{state.filters.style=b.dataset.recipeStyle;$$('[data-recipe-style]').forEach(x=>x.classList.toggle('active',x===b));renderRecipes(true);});
  $$('[data-restriction]').forEach(b=>b.onclick=()=>{const k=b.dataset.restriction;const a=state.prefs.restrictions;state.prefs.restrictions=a.includes(k)?a.filter(x=>x!==k):[...a,k];savePrefs();b.classList.toggle('active');renderAll();});
  $$('[data-pref-equipment]').forEach(b=>b.onclick=()=>{const k=b.dataset.prefEquipment;const a=state.prefs.equipment;state.prefs.equipment=a.includes(k)?a.filter(x=>x!==k):[...a,k];savePrefs();b.classList.toggle('active');});
  $$('[data-qfilter]').forEach(b=>b.onclick=()=>applyQuickFilter(b.dataset.qfilter,b));
}
function openCustomRecipe(open){
  const d=$('#customRecipeDrawer');if(!d)return;d.classList.toggle('open',open);d.setAttribute('aria-hidden',String(!open));
  if(open){$('#customServings').value=state.prefs.household||4;document.body.style.overflow='hidden';}
  else if(!$('#recipeDrawer').classList.contains('open')&&!$('#menuDrawer').classList.contains('open'))document.body.style.overflow='';
}
function parseCustomIngredient(line){
  const t=line.trim();if(!t)return null;const m=t.match(/^([0-9]+(?:[.,][0-9]+)?)\s*([^\s]+)?\s+(.+)$/);if(!m)return{name:t,qty:1,unit:'portion'};
  return{name:m[3].trim(),qty:Number(m[1].replace(',','.')),unit:(m[2]||'').trim()};
}
function saveCustomRecipe(){
  const name=$('#customName').value.trim(),cat=$('#customCategory').value,serv=Math.max(1,Number($('#customServings').value)||4);
  const ingredients=$('#customIngredients').value.split('\n').map(parseCustomIngredient).filter(Boolean);
  const stepLines=$('#customSteps').value.split('\n').map(x=>x.trim()).filter(Boolean);
  if(!name||!ingredients.length||!stepLines.length)return toast('Ajoute un nom, des ingrédients et des étapes');
  const id='perso-'+slug(name)+'-'+Date.now();const rec={id,name,category:cat,subtype:'Mes recettes',color:'#75d429',emoji:'🍽️',servings:serv,difficulty:'',tags:['Recette personnelle'],ingredients,modes:{classic:stepLines.map((text,i)=>({title:`Étape ${i+1}`,text,durationSec:0}))},tips:[],goalTags:[],dietTags:[],allergens:[],substitutions:[],macros:{},styles:['Cuisine maison'],equipment:['Cuisine classique'],prepMin:10,cookMin:0,description:'Recette personnelle enregistrée sur cet appareil.',featured:false,sourceType:'personnelle',nutritionBasis:'Valeurs nutritionnelles non calculées pour cette recette.',nutritionStatus:'missing',tm6Status:'none',image:'',cuisine:'Maison',techniques:['mise en place'],storage:'Conserve les restes rapidement au réfrigérateur dans une boîte fermée.',safetyTip:'',deviceModes:{},learningMode:true};
  state.prefs.customRecipes.push(rec);state.recipes.push(rec);savePrefs();buildStaticUI();bindDynamicUI();renderRecipes(true);openCustomRecipe(false);$('#customName').value='';$('#customIngredients').value='';$('#customSteps').value='';toast('Recette personnelle enregistrée');
}
function exportUserData(){
  const payload={app:'FAFATRAINING Recettes',date:new Date().toISOString(),prefs:state.prefs};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fafatraining-recettes-sauvegarde.json';a.click();URL.revokeObjectURL(a.href);toast('Sauvegarde créée');
}
function importUserData(e){
  const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);const prefs=d.prefs||d;if(!prefs||typeof prefs!=='object')throw new Error();state.prefs={...DEFAULT_PREFS,...prefs};savePrefs();location.reload();}catch{toast('Fichier de sauvegarde invalide');}};rd.readAsText(f);e.target.value='';
}

function navigate(page,scroll=true,push=true){
  const current=$('.page.active')?.dataset.page||'home';
  if(push && current!==page) state.pageHistory.push(current);
  $$('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===page));
  const navPage=['menus','planning'].includes(page)?'organize':page;$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===navPage));
  state.prefs.lastPage=page;savePrefs();
  $('#topBackBtn').classList.toggle('hidden',['home','recipes','fridge','organize','shopping'].includes(page));
  if(scroll)window.scrollTo({top:0,behavior:'smooth'});
  if(page==='fridge'){renderPantry();renderFridgeResults();}
  if(page==='shopping')renderShopping();
  if(page==='planning')renderPlanning();
  if(page==='menus')renderMenus();
  if(page==='organize')renderOrganize();
}
function goBack(){
  if($('#cookMode').classList.contains('open'))return closeCook();
  if($('#recipeDrawer').classList.contains('open'))return closeRecipe();
  if($('#menuDrawer').classList.contains('open'))return closeMenuDrawer();
  if($('#filterDrawer').classList.contains('open'))return openFilterDrawer(false);
  if($('#surpriseDrawer').classList.contains('open'))return openSurprise(false);
  if($('#planAssignDrawer').classList.contains('open'))return openPlanAssign(false);
  const prev=state.pageHistory.pop()||'home';
  navigate(prev,true,false);
}

function setPreferredMode(mode){state.prefs.mode=mode;state.currentDrawerMode=mode;savePrefs();applyModeButtons();if(state.currentRecipe)openRecipe(state.currentRecipe.id,false);toast(`Mode : ${MODE_META[mode]?.short||mode}`);}
function applyModeButtons(){$$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.prefs.mode));}
function openSettings(open){const d=$('#settingsDrawer');d.classList.toggle('open',open);d.setAttribute('aria-hidden',String(!open));syncBodyLock();}

function openFilterDrawer(open){
  $('#filterDrawer').classList.toggle('open',open);
  $('#filterDrawer').setAttribute('aria-hidden',String(!open));
  if(open)document.body.style.overflow='hidden';else if(!$('#recipeDrawer').classList.contains('open')&&!$('#menuDrawer').classList.contains('open'))document.body.style.overflow='';
}
function applyQuickFilter(type,btn){
  if(type==='time20'){state.filters.time=state.filters.time==='20'?'':'20';$('#timeFilter').value=state.filters.time;}
  if(type==='mode'){const eq=state.prefs.mode==='tm6'?'Thermomix TM6':'Cuisine classique';state.filters.equipment=state.filters.equipment===eq?'':eq;$('#equipmentFilter').value=state.filters.equipment;}
  if(type==='easy')state.filters.style=state.filters.style==='Cuisine facile'?'':'Cuisine facile';
  if(type==='meal'){state.filters.mealOnly=!state.filters.mealOnly;$('#mealOnly').checked=state.filters.mealOnly;}
  if(type==='fridge'){
    if(!state.prefs.pantry.length){navigate('fridge');toast('Ajoute d’abord ce que tu as dans ton frigo');return;}
    state.filters.fridgeOnly=!state.filters.fridgeOnly;
  }
  renderRecipes(true);
}
function activeFilterLabels(){
  const a=[];
  if(state.filters.category)a.push(state.filters.category);
  if(state.filters.subtype)a.push(state.filters.subtype);
  if(state.filters.cuisine)a.push(state.filters.cuisine);
  if(state.filters.cuisineGroup)a.push(state.filters.cuisineGroup);
  if(state.filters.time)a.push(`≤ ${state.filters.time} min`);
  if(state.filters.equipment)a.push(equipmentDisplay[state.filters.equipment]||state.filters.equipment);
  if(state.filters.style)a.push(state.filters.style);
  if(state.filters.mealOnly)a.push('Repas complet');
  if(state.filters.favoritesOnly)a.push('Favoris');
  if(state.filters.fridgeOnly)a.push('Avec mon frigo');
  return a;
}
function renderActiveFilterSummary(){
  const el=$('#activeFilterSummary');if(!el)return;
  const labels=activeFilterLabels();
  const filterBtn=$('#openAdvancedFiltersBtn');if(filterBtn){filterBtn.textContent=labels.length?`Filtres (${labels.length})`:'Filtres';filterBtn.setAttribute('aria-label',labels.length?`${labels.length} filtre${labels.length>1?'s':''} actif${labels.length>1?'s':''}. Modifier les filtres`:'Ouvrir les filtres');}
  el.classList.toggle('hidden',!labels.length);
  el.innerHTML=labels.length?`<strong>Filtres actifs :</strong> ${labels.map(x=>`<span>${escapeHtml(x)}</span>`).join('')} <button id="clearInlineFilters">Tout effacer</button>`:'';
  if($('#clearInlineFilters'))$('#clearInlineFilters').onclick=()=>resetFilters();
  $$('[data-qfilter]').forEach(b=>{
    const t=b.dataset.qfilter;let active=false;
    if(t==='time20')active=state.filters.time==='20';
    if(t==='mode')active=Boolean(state.filters.equipment);
    if(t==='easy')active=state.filters.style==='Cuisine facile';
    if(t==='meal')active=Boolean(state.filters.mealOnly);
    if(t==='fridge')active=Boolean(state.filters.fridgeOnly);
    b.classList.toggle('active',active);
  });
}

function passesRestrictions(r){return !state.prefs.restrictions.some(a=>(r.allergens||[]).includes(a));}
function recipeHay(r){return norm([r.name,r.category,r.subtype,r.cuisine,r.description,(r.tags||[]).join(' '),(r.styles||[]).join(' '),(r.techniques||[]).join(' '),(r.equipment||[]).join(' '),r.ingredients.map(i=>i.name).join(' ')].join(' '));}
function recipeSubtype(r){return r.subtype||'Autres';}

function renderRecipeLibrary(){
  const box=$('#recipeCategoryGrid');if(!box)return;
  const counts={};state.recipes.filter(passesRestrictions).forEach(r=>counts[r.category]=(counts[r.category]||0)+1);
  const order=['Poulet & volaille','Viandes','Poissons & fruits de mer','Légumes & accompagnements','Végétarien','Pâtes, riz & céréales','Entrées & salades','Soupes & veloutés','Petit-déjeuner','Desserts','Boissons & smoothies','Collations','Sauces & bases'];
  box.innerHTML=order.filter(c=>counts[c]).map(c=>`<button class="library-category-card" data-library-category="${escapeHtml(c)}"><span class="library-icon">${categoryIcon[c]||'🍽️'}</span><span><strong>${escapeHtml(c)}</strong><small>${counts[c]} recettes</small></span><b>→</b></button>`).join('');
  box.querySelectorAll('[data-library-category]').forEach(b=>b.onclick=()=>{state.filters.category=b.dataset.libraryCategory;state.filters.subtype='';state.filters.cuisineGroup='';state._showAllRecipes=false;$('#categoryFilter').value=state.filters.category;renderRecipes(true);window.scrollTo({top:0,behavior:'smooth'});});
  const cbox=$('#recipeCuisineHighlights');if(cbox){
    const groups=CUISINE_GROUPS.map(g=>{const recipes=state.recipes.filter(r=>(r.regionCuisine||r.cuisineRegion)===g);if(!recipes.length)return null;const places=uniq(recipes.map(r=>r.paysOuTerritoire||'').filter(Boolean));const cuisines=uniq(recipes.map(r=>r.cuisine||'').filter(x=>x&&x!=='Création maison'&&!x.includes('maison')));let detail='';if(g==='Créations maison')detail='Recettes contemporaines sans origine revendiquée';else detail=(places.length?places:cuisines).slice(0,3).join(' · ')||'Plusieurs cuisines';return [g,recipes.length,detail];}).filter(Boolean);
    cbox.innerHTML=groups.map(([g,n,detail])=>`<button class="cuisine-family-card ${g==='Créations maison'?'home-cuisine-card':''}" data-library-cuisine-group="${escapeHtml(g)}"><span><strong>${escapeHtml(CUISINE_GROUP_LABELS[g]||g)}</strong><small>${escapeHtml(detail)}</small></span><span class="cuisine-count">${n} recette${n>1?'s':''}</span><b>→</b></button>`).join('');
    cbox.querySelectorAll('[data-library-cuisine-group]').forEach(b=>b.onclick=()=>{state.filters.cuisineGroup=b.dataset.libraryCuisineGroup;state.filters.cuisine='';state.filters.category='';state.filters.subtype='';state._showAllRecipes=false;if($('#cuisineFilter'))$('#cuisineFilter').value='';renderRecipes(true);window.scrollTo({top:0,behavior:'smooth'});});
  }
}
function renderSubCategoryChips(){
  const panel=$('#subCategoryPanel'),box=$('#subCategoryChips');if(!panel||!box)return;
  const cat=state.filters.category;if(!cat){panel.classList.add('hidden');box.innerHTML='';return;}
  const counts={};state.recipes.filter(r=>r.category===cat).forEach(r=>counts[recipeSubtype(r)]=(counts[recipeSubtype(r)]||0)+1);
  const opts=Object.keys(counts).sort((a,b)=>a.localeCompare(b,'fr'));if(opts.length<2){panel.classList.add('hidden');box.innerHTML='';state.filters.subtype='';return;}
  if(state.filters.subtype&&!opts.includes(state.filters.subtype))state.filters.subtype='';panel.classList.remove('hidden');
  box.innerHTML=[['',`Tous (${state.recipes.filter(r=>r.category===cat).length})`],...opts.map(x=>[x,`${x} (${counts[x]})`])].map(([x,label])=>`<button class="style-chip ${state.filters.subtype===x?'active':''}" data-subtype="${escapeHtml(x)}">${escapeHtml(label)}</button>`).join('');
  box.querySelectorAll('[data-subtype]').forEach(b=>b.onclick=()=>{state.filters.subtype=b.dataset.subtype;renderRecipes(true);});
}
function filteredRecipes(){
  let arr=state.recipes.filter(passesRestrictions);const f=state.filters;
  if(f.query){const q=norm(f.query);arr=arr.filter(r=>recipeHay(r).includes(q));}
  if(f.category)arr=arr.filter(r=>r.category===f.category);
  if(f.subtype)arr=arr.filter(r=>recipeSubtype(r)===f.subtype);
  if(f.cuisine)arr=arr.filter(r=>r.cuisine===f.cuisine);
  if(f.cuisineGroup)arr=arr.filter(r=>(r.regionCuisine||r.cuisineRegion)===f.cuisineGroup);
  if(f.time)arr=arr.filter(r=>totalTime(r)<=Number(f.time));
  if(f.equipment)arr=arr.filter(r=>f.equipment==='Thermomix TM6'?Boolean(r.modes?.tm6?.length):(r.equipment||[]).includes(f.equipment));
  if(f.style)arr=arr.filter(r=>(r.styles||[]).includes(f.style));
  if(f.mealOnly)arr=arr.filter(r=>isMainCourseCategory(r.category));
  if(f.favoritesOnly)arr=arr.filter(r=>state.prefs.favorites.includes(r.id));
  if(f.fridgeOnly&&state.prefs.pantry.length){const selected=new Set(state.prefs.pantry.map(x=>pantryKey(canonicalPantryName(x))));arr=arr.filter(r=>{const names=r.ingredients.map(i=>pantryKey(canonicalPantryName(i.name)));const hits=names.filter(n=>selected.has(n)).length;const missing=names.length-hits;return hits>0&&missing<=2;});}
  return arr.sort((a,b)=>(Number(b.featured)-Number(a.featured))||a.name.localeCompare(b.name,'fr'));
}
function resetFilters(render=true){
  state.filters={query:'',category:'',subtype:'',cuisine:'',cuisineGroup:'',time:'',equipment:'',style:'',favoritesOnly:false,fridgeOnly:false,mealOnly:false};state._showAllRecipes=false;
  if($('#recipeSearch'))$('#recipeSearch').value='';if($('#homeSearch'))$('#homeSearch').value='';if($('#categoryFilter'))$('#categoryFilter').value='';if($('#cuisineFilter'))$('#cuisineFilter').value='';if($('#timeFilter'))$('#timeFilter').value='';if($('#equipmentFilter'))$('#equipmentFilter').value='';if($('#favoritesOnly'))$('#favoritesOnly').checked=false;if($('#mealOnly'))$('#mealOnly').checked=false;
  $$('[data-recipe-style]').forEach(b=>b.classList.toggle('active',b.dataset.recipeStyle===''));if(render)renderRecipes(true);
}
function homeFeaturedRecipes(){
  let arr=state.recipes.filter(r=>passesRestrictions(r) && (r.featured || QUICK_CATEGORIES.includes(r.category)));
  arr.sort((a,b)=>Number(Boolean(b.image))-Number(Boolean(a.image))||Number(Boolean(b.featured))-Number(Boolean(a.featured))||a.name.localeCompare(b.name,'fr'));
  const key=state.homeFeaturedKey;
  if(key==='all') return arr.slice(0,4);
  if(key==='plats') arr=arr.filter(r=>isMainCourseCategory(r.category));
  else if(HOME_STYLES.includes(key)) arr=arr.filter(r=>(r.styles||[]).includes(key));
  else arr=arr.filter(r=>r.category===key);
  return arr.slice(0,4);
}

function personalizedRecipes(){
  const favCats=state.prefs.favorites.map(id=>state.recipes.find(r=>r.id===id)?.category).filter(Boolean);
  const recentCats=state.prefs.recentCategories||[];
  const preferredEq=state.prefs.mode==='classic'?'Cuisine classique':'';
  const seed=Math.floor(Date.now()/86400000)%97;
  const scored=state.recipes.filter(passesRestrictions).map((r,i)=>{let score=0;if(favCats.includes(r.category))score+=4;if(recentCats.includes(r.category))score+=3;if(preferredEq&&(r.equipment||[]).includes(preferredEq))score+=2;if((r.styles||[]).includes('Cuisine facile'))score+=1;if(r.featured)score+=1;if(r.image)score+=1;score+=((i*17+seed*13)%29)/100;return{r,score};}).sort((a,b)=>b.score-a.score||a.r.name.localeCompare(b.r.name,'fr'));
  const buckets=[r=>isMainCourseCategory(r.category),r=>['Légumes & accompagnements','Entrées & salades','Soupes & veloutés','Végétarien'].includes(r.category),r=>['Petit-déjeuner','Desserts','Collations','Boissons & smoothies'].includes(r.category)];
  const picked=[];for(const test of buckets){const found=scored.find(x=>test(x.r)&&!picked.some(p=>p.id===x.r.id)&&!picked.some(p=>p.category===x.r.category));if(found)picked.push(found.r);}return picked.slice(0,3);
}
function renderHomeNextMeal(){
  const box=$('#homeNextMeal');if(!box)return;
  const jsDay=new Date().getDay();const dayMap={1:'mon',2:'tue',3:'wed',4:'thu',5:'fri',6:'sat',0:'sun'};const day=dayMap[jsDay];const hour=new Date().getHours();
  const candidates=hour<14?[`${day}-lunch`,`${day}-dinner`]:[`${day}-dinner`];let key=candidates.find(k=>state.prefs.planning?.[k]);
  if(!key){box.classList.add('hidden');box.innerHTML='';return;}
  const entry=state.prefs.planning[key],info=planningEntryLabel(entry);if(!info){box.classList.add('hidden');box.innerHTML='';return;}
  const slot=key.endsWith('lunch')?'Midi':'Soir';box.innerHTML=`<div><span class="kicker">AUJOURD’HUI · ${slot.toUpperCase()}</span><strong>${escapeHtml(info.title)}</strong><small>${escapeHtml(info.meta)}</small></div><button id="homeOpenPlanned" class="primary-btn">Ouvrir</button>`;box.classList.remove('hidden');
  $('#homeOpenPlanned').onclick=()=>entry.type==='menu'?openMenuDrawer(entry.id):openRecipe(entry.id);
}

function openSurprise(open){
  $('#surpriseDrawer').classList.toggle('open',open);$('#surpriseDrawer').setAttribute('aria-hidden',String(!open));
  if(open){document.body.style.overflow='hidden';$('#surpriseDrawerGrid').innerHTML='';}else if(!$('#recipeDrawer').classList.contains('open')&&!$('#menuDrawer').classList.contains('open'))document.body.style.overflow='';
}
function recipeMissingFromPantry(r){
  if(!state.prefs.pantry.length)return null;
  const selected=new Set(state.prefs.pantry.map(x=>pantryKey(canonicalPantryName(x))));
  const essentials=r.ingredients.map(i=>pantryKey(canonicalPantryName(i.name)));
  const missing=essentials.filter(n=>!selected.has(n));
  return {missing:missing.length,have:essentials.length-missing.length,total:essentials.length};
}
function surpriseReason(r,fridgePriority){
  const bits=[`⏱ ${totalTime(r)} min`];
  if(fridgePriority&&state.prefs.pantry.length){const m=recipeMissingFromPantry(r);if(m)bits.push(m.missing===0?'tu as tout':`${m.missing} ingrédient${m.missing>1?'s':''} à compléter`);}
  if(r.modes?.tm6?.length)bits.push('TM6 disponible');
  else bits.push(supportBadge(r));
  return bits.join(' · ');
}
function generateSurprise(){
  const max=state.surpriseTime?Number(state.surpriseTime):Infinity;
  const mealOnly=$('#surpriseMealOnly')?.checked;
  const fridgePriority=$('#surpriseFridge')?.checked;
  const vegOnly=$('#surpriseVegetarian')?.checked;
  if(fridgePriority&&!state.prefs.pantry.length){$('#surpriseDrawerGrid').innerHTML='<div class="shopping-empty">Ton frigo est vide dans l’application. Ajoute d’abord quelques ingrédients dans « Mon frigo », ou décoche cette option.</div>';return;}
  let pool=state.recipes.filter(passesRestrictions).filter(r=>totalTime(r)<=max).filter(r=>!mealOnly||isMainCourseCategory(r.category)).filter(r=>!vegOnly||r.category==='Végétarien');
  if(fridgePriority){let close=pool.map(r=>({r,m:recipeMissingFromPantry(r)})).filter(x=>x.m&&x.m.have>0&&x.m.missing<=2);if(close.length<3)close=pool.map(r=>({r,m:recipeMissingFromPantry(r)})).filter(x=>x.m&&x.m.have>0&&x.m.missing<=3);pool=close.map(x=>x.r);}
  const favCats=state.prefs.favorites.map(id=>state.recipes.find(x=>x.id===id)?.category).filter(Boolean),recent=new Set(state.prefs.recentRecipes||[]);
  const scored=pool.map(r=>{let score=0;const m=recipeMissingFromPantry(r);if(fridgePriority&&m)score+=(m.have*4)-(m.missing*5);if(favCats.includes(r.category))score+=2;if((r.styles||[]).includes('Cuisine facile'))score+=1;if(recent.has(r.id))score-=2;score+=(60-Math.min(60,totalTime(r)))/60;return{r,score};}).sort((a,b)=>b.score-a.score||a.r.name.localeCompare(b.r.name,'fr'));
  const pick=[];for(const x of scored){if(pick.length>=3)break;if(!pick.some(p=>p.r.category===x.r.category)||scored.length<6)pick.push(x);}
  $('#surpriseDrawerGrid').innerHTML=pick.length?pick.map(x=>recipeCard(x.r).replace('</article>',`<div class="idea-reason">${escapeHtml(surpriseReason(x.r,fridgePriority))}</div></article>`)).join(''):'<div class="shopping-empty">Aucune recette ne correspond exactement. Élargis le temps ou retire un critère.</div>';
  bindRecipeCards($('#surpriseDrawerGrid'));
}
function renderHome(){renderHomeNextMeal();if($('#forYouGrid')){$('#forYouGrid').innerHTML='';$('#forYouGrid').classList.add('hidden');}}
function renderOrganize(){
  const box=$('#organizeNextMeal');if(!box)return;
  const entries=Object.entries(state.prefs.planning||{}).filter(([,e])=>e),count=entries.length,help=$('#organizeHelp');
  box.classList.remove('hidden');
  if(!count){
    box.innerHTML=`<div><span class="kicker">MA SEMAINE</span><strong>Planifie ton premier repas</strong><small>Ajoute une recette directement ou pars d’un menu déjà composé.</small></div><button class="primary-btn" data-nav-dynamic="planning">Construire ma semaine</button>`;
    if(help)help.innerHTML='<strong>Pour démarrer</strong><span>Choisis un repas, indique le jour et le nombre de personnes. Les quantités pourront ensuite être regroupées automatiquement dans Courses.</span>';
  }else{
    box.innerHTML=`<div><span class="kicker">MA SEMAINE</span><strong>${count} repas planifié${count>1?'s':''} sur 14</strong><small>${count<14?'Continue à remplir la semaine ou prépare déjà les courses.':'Ta semaine est complète : tu peux générer les courses.'}</small></div><div class="organize-next-actions"><button class="outline-btn" data-nav-dynamic="planning">Voir mon planning</button><button class="primary-btn" data-organize-shopping>Créer les courses</button></div>`;
    if(help)help.innerHTML='<strong>Tout reste modifiable</strong><span>Tu peux déplacer ou retirer un repas à tout moment. Si le planning change, recrée simplement les courses à partir de la semaine mise à jour.</span>';
  }
  box.querySelectorAll('[data-nav-dynamic]').forEach(b=>b.onclick=()=>navigate(b.dataset.navDynamic));
  const shoppingBtn=box.querySelector('[data-organize-shopping]');if(shoppingBtn)shoppingBtn.onclick=planningToShopping;
}

function supportBadge(r){
  if(r.primaryEquipment&& !['Cuisine classique','Ustensiles & four'].includes(r.primaryEquipment))return r.primaryEquipment;
  const eq=(r.equipment||[]).find(x=>x!=='Cuisine classique');
  if(eq)return eq;
  const n=norm(r.name);
  if(/salade|bowl|overnight|chia/.test(n))return 'Saladier / bol';
  if(/soupe|veloute|risotto|riz|pates|pâtes/.test(n))return 'Casserole';
  if(/gratin|gateau|gâteau|cake|muffin|tarte|four|roti|rôti/.test(n))return 'Four';
  return 'Poêle / casserole';
}
function originLabel(r){
  if(r.paysOuTerritoire)return `${r.paysOuTerritoire}${r.authenticite&&r.authenticite!=='Traditionnelle'?` · ${r.authenticite}`:''}`;
  if(r.authenticite==='Création maison'||(r.regionCuisine||r.cuisineRegion)==='Créations maison')return 'Création maison';
  if(r.cuisine&&r.cuisine!=='Création maison')return r.cuisine;
  return '';
}

function recipeCard(r,extra=''){
  const fav=state.prefs.favorites.includes(r.id),image=imgSrc(r),times=totalTime(r),label=r.subtype||r.category;
  const fit=r.imageFit==='contain'?'contain':'';
  const visual=image?`<div class="recipe-image has-image"><img class="${fit}" src="${escapeHtml(image)}" alt="${escapeHtml(r.name)}" loading="lazy"></div>`:`<div class="recipe-card-texthead"><span class="recipe-card-icon" aria-hidden="true">${categoryIcon[r.category]||'🍽️'}</span><span><strong>${escapeHtml(r.category)}</strong><small>${escapeHtml(label)}</small></span></div>`;
  return `<article class="recipe-card recipe-card-clickable ${image?'with-image':'text-only'}" ${extra}><button class="recipe-card-main" data-open-card="${r.id}" aria-label="Ouvrir ${escapeHtml(r.name)}">${visual}<div class="recipe-body"><span class="recipe-category-line">${escapeHtml(label)}</span><h3 class="recipe-title">${escapeHtml(r.name)}</h3><div class="recipe-meta recipe-meta-simple"><span>⏱ ${times||'—'} min</span>${r.difficulty?`<span>${escapeHtml(r.difficulty)}</span>`:''}<span>${escapeHtml(supportBadge(r))}</span></div></div></button><button class="fav-btn ${fav?'active':''}" data-fav="${r.id}" aria-label="${fav?'Retirer des':'Ajouter aux'} favoris">${fav?'♥':'♡'}</button></article>`;
}
function groupedRecipeEntries(recipes){
  const entries=[],families=new Map();
  for(const recipe of recipes){
    if(!recipe.cardFamily){entries.push({type:'recipe',recipe,sortName:recipe.name});continue;}
    if(!families.has(recipe.cardFamily))families.set(recipe.cardFamily,{type:'family',key:recipe.cardFamily,label:recipe.cardFamilyLabel||recipe.subtype||recipe.category,recipes:[],sortName:recipe.cardFamilyLabel||recipe.name});
    families.get(recipe.cardFamily).recipes.push(recipe);
  }
  for(const family of families.values()){
    if(family.recipes.length===1)entries.push({type:'recipe',recipe:family.recipes[0],sortName:family.recipes[0].name});
    else entries.push(family);
  }
  return entries.sort((a,b)=>String(a.sortName).localeCompare(String(b.sortName),'fr',{sensitivity:'base'}));
}
function familyRecipeCard(group){
  const times=group.recipes.map(totalTime).filter(Number.isFinite),min=times.length?Math.min(...times):0,max=times.length?Math.max(...times):0;
  const cats=[...new Set(group.recipes.map(r=>r.subtype||r.category))];
  const metaTime=min&&max?(min===max?`${min} min`:`${min}–${max} min`):'temps variable';
  return `<article class="recipe-card family-recipe-card"><button class="recipe-card-main" data-open-family="${escapeHtml(group.key)}" aria-label="Choisir une variante de ${escapeHtml(group.label)}"><div class="recipe-image no-image family-card-visual"><div class="recipe-placeholder family-placeholder"><strong>FAMILLE DE RECETTES</strong><small>${escapeHtml(cats.slice(0,2).join(' · '))}</small><b>${group.recipes.length} variantes</b></div></div><div class="recipe-body"><span class="recipe-category-line">Variantes regroupées</span><h3 class="recipe-title">${escapeHtml(group.label)}</h3><div class="recipe-meta recipe-meta-simple"><span>⏱ ${metaTime}</span><span>${group.recipes.length} recettes</span></div><p class="family-card-note">Une seule carte pour des variantes proches : choisis ensuite l’ingrédient, la sauce ou la finition qui t’intéresse.</p></div></button></article>`;
}
function openRecipeFamily(key){
  const recipes=state.recipes.filter(r=>r.cardFamily===key);if(!recipes.length)return;if(recipes.length===1)return openRecipe(recipes[0].id);
  state.currentRecipe=null;const label=recipes[0].cardFamilyLabel||recipes[0].subtype||'Variantes';
  $('#drawerContent').innerHTML=`<div class="family-drawer-head"><span class="kicker">FAMILLE DE RECETTES</span><h2 id="drawerTitle">${escapeHtml(label)}</h2><p>${recipes.length} recettes proches sont regroupées ici pour éviter de multiplier inutilement les cartes. Chaque variante ci-dessous conserve sa propre liste d’ingrédients et son propre pas-à-pas.</p></div><div class="family-variant-list">${recipes.map(r=>`<button class="family-variant-row" data-family-recipe-open="${escapeHtml(r.id)}"><span><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.subtype||r.category)} · ${totalTime(r)||'—'} min · ${escapeHtml(r.difficulty||'')}</small></span><b>Voir la recette ›</b></button>`).join('')}</div>`;
  $('#drawerContent').querySelectorAll('[data-family-recipe-open]').forEach(b=>b.onclick=()=>openRecipe(b.dataset.familyRecipeOpen,false));
  $('#recipeDrawer').classList.add('open');$('#recipeDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
function bindRecipeCards(root=document){
  root.querySelectorAll('[data-open-card]').forEach(card=>card.onclick=()=>openRecipe(card.dataset.openCard));
  root.querySelectorAll('[data-open-family]').forEach(card=>card.onclick=()=>openRecipeFamily(card.dataset.openFamily));
  root.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openRecipe(b.dataset.open));
  root.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFavorite(b.dataset.fav);});
}
function renderRecipes(resetVisible=false){
  if(resetVisible)state.visible=48;renderActiveFilterSummary();
  const hasIntent=Boolean(state._showAllRecipes||state.filters.query||state.filters.category||state.filters.cuisine||state.filters.cuisineGroup||state.filters.time||state.filters.equipment||state.filters.style||state.filters.favoritesOnly||state.filters.fridgeOnly||state.filters.mealOnly);
  $('#recipeLibraryHome').classList.toggle('hidden',hasIntent);$('#recipeResultsArea').classList.toggle('hidden',!hasIntent);
  if(!hasIntent){$('#recipesCountLabel').textContent=`${state.recipes.length} recettes rangées dans 13 grandes familles`;renderRecipeLibrary();return;}
  renderSubCategoryChips();const arr=filteredRecipes(),entries=groupedRecipeEntries(arr);
  const crumbs=['Recettes'];if(state.filters.category)crumbs.push(state.filters.category);if(state.filters.subtype)crumbs.push(state.filters.subtype);if(state.filters.cuisineGroup&&!state.filters.category)crumbs.push(state.filters.cuisineGroup);else if(state.filters.cuisine&&!state.filters.category)crumbs.push(state.filters.cuisine);$('#recipeBreadcrumb').innerHTML=crumbs.map((x,i)=>`<span class="${i===crumbs.length-1?'current':''}">${escapeHtml(x)}</span>`).join('<b>›</b>');
  const groupedCount=entries.filter(x=>x.type==='family').length;$('#recipesCountLabel').textContent=`${arr.length} recette${arr.length>1?'s':''} · ${entries.length} carte${entries.length>1?'s':''}${groupedCount?` · ${groupedCount} famille${groupedCount>1?'s':''} regroupée${groupedCount>1?'s':''}`:''}`;
  $('#recipesGrid').innerHTML=entries.slice(0,state.visible).map(entry=>entry.type==='family'?familyRecipeCard(entry):recipeCard(entry.recipe)).join('');bindRecipeCards($('#recipesGrid'));$('#loadMoreBtn').classList.toggle('hidden',state.visible>=entries.length);
}
function toggleFavorite(id){
  const a=state.prefs.favorites;
  state.prefs.favorites=a.includes(id)?a.filter(x=>x!==id):[...a,id];
  savePrefs();
  renderHome(); renderRecipes();
  if(state.currentRecipe&&state.currentRecipe.id===id) openRecipe(id,false);
  toast(state.prefs.favorites.includes(id)?'Ajouté aux favoris':'Retiré des favoris');
}

function getMenuRecipeIds(m){
  const override=state.prefs.menuOverrides?.[m.id];
  return Array.isArray(override)&&override.length===m.recipes.length?override:m.recipes;
}
function toggleFavoriteMenu(id){
  const a=state.prefs.favoriteMenus||[];state.prefs.favoriteMenus=a.includes(id)?a.filter(x=>x!==id):[...a,id];savePrefs();renderMenus();if($('#menuDrawer').classList.contains('open'))openMenuDrawer(id);toast(state.prefs.favoriteMenus.includes(id)?'Menu enregistré':'Menu retiré des favoris');
}
function menuCard(m){
  const ids=getMenuRecipeIds(m);const rs=ids.map(id=>state.recipes.find(r=>r.id===id)).filter(Boolean);const fav=(state.prefs.favoriteMenus||[]).includes(m.id);
  const labels=m.slotLabels||['Entrée','Plat','Dessert'];
  return `<article class="menu-card"><button class="menu-fav-btn ${fav?'active':''}" data-fav-menu="${m.id}" aria-label="Favori">${fav?'♥':'♡'}</button><span class="kicker">${escapeHtml((m.filterTags||m.tags||[])[0]||'MENU')}</span><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.subtitle||'')}</p><div class="menu-list">${rs.map((r,i)=>`<div><span>${i+1}</span><small><strong>${escapeHtml(labels[i]||'Recette')}</strong><br>${escapeHtml(r.name)}</small></div>`).join('')}</div><div class="menu-actions"><button class="primary" data-open-menu="${m.id}">Voir le menu</button><button data-export-menu="${m.id}">Créer le visuel</button></div></article>`;
}


const MENU_UNIVERSES=[
  {id:'pasta',title:'Pâtes',icon:'🍝',desc:'Bolognaise, poulet, fromages, poissons, légumes et autres vraies variantes.',tags:['Pâtes']},
  {id:'cereals',title:'Riz & céréales',icon:'🍚',desc:'Riz, quinoa, semoule, boulgour, polenta et autres céréales.',tags:['Riz & céréales']},
  {id:'meat',title:'Viandes & volailles',icon:'🍗',desc:'Menus autour du poulet, de la volaille et des viandes.',tags:['Poulet & volaille','Viandes']},
  {id:'sea',title:'Poissons & fruits de mer',icon:'🐟',desc:'Menus complets autour des poissons et fruits de mer.',tags:['Poissons & fruits de mer']},
  {id:'plant',title:'Végétal',icon:'🌿',desc:'Menus sans viande autour des légumes, légumineuses, tofu et céréales.',tags:['Végétal']},
  {id:'family',title:'Famille & enfants',icon:'🏠',desc:'Plats accessibles et desserts à partager ou à préparer ensemble.',tags:['Famille & enfants','Familial']},
  {id:'brunch',title:'Brunch',icon:'🥞',desc:'Boisson, salé et sucré dans le même menu.',tags:['Brunch']},
  {id:'world',title:'Cuisines du monde',icon:'🌍',desc:'Menus inspirés de cuisines identifiées sans changer artificiellement l’origine.',tags:['Cuisines du monde','Cuisine du monde']},
  {id:'islands',title:'Îles & Caraïbes',icon:'🏝️',desc:'Martinique, Guadeloupe, Réunion, Haïti, Jamaïque, Maurice et Trinité-et-Tobago.',tags:['Îles & Caraïbes']},
  {id:'light',title:'Léger',icon:'🥗',desc:'Entrée fraîche, plat plus léger et dessert simple.',tags:['Léger']}
];
function renderMenuUniverses(){
  const box=$('#menuUniverseGrid');if(!box)return;box.classList.toggle('hidden',Boolean(state.menuUniverse||state.menuFilter==='__favorites__'||state.menuSearch));
  box.innerHTML=MENU_UNIVERSES.map(u=>{const n=state.menus.filter(m=>(m.filterTags||[]).some(t=>u.tags.includes(t))).length;return`<button class="menu-universe-card" data-menu-universe="${u.id}"><span>${u.icon}</span><div><strong>${escapeHtml(u.title)}</strong><small>${escapeHtml(u.desc)}</small><b>${n} menus</b></div><i>→</i></button>`;}).join('');box.querySelectorAll('[data-menu-universe]').forEach(b=>b.onclick=()=>{state.menuUniverse=b.dataset.menuUniverse;state.menuFilter='';renderMenuUniverses();renderMenus();});
}
function renderMenus(){
  renderMenuUniverses();let menus=state.menus;const q=norm(state.menuSearch||'');if(q)menus=menus.filter(m=>norm([m.title,m.subtitle,...(m.filterTags||[]),...(m.tags||[])].join(' ')).includes(q));
  const panel=$('#menuFilterPanel');if(state.menuFilter==='__favorites__'){menus=menus.filter(m=>(state.prefs.favoriteMenus||[]).includes(m.id));panel.classList.remove('hidden');$('#menuUniverseTitle').textContent='Mes menus enregistrés';$('#menuFilterChips').innerHTML='';}
  else if(state.menuUniverse==='__all__'){panel.classList.remove('hidden');$('#menuUniverseTitle').textContent='Tous les menus';$('#menuFilterChips').innerHTML='';}
  else if(state.menuUniverse){const u=MENU_UNIVERSES.find(x=>x.id===state.menuUniverse);menus=menus.filter(m=>(m.filterTags||[]).some(t=>u.tags.includes(t)));if(state.menuFilter)menus=menus.filter(m=>(m.filterTags||[]).includes(state.menuFilter));panel.classList.remove('hidden');$('#menuUniverseTitle').textContent=u.title;const available=u.tags.filter(t=>state.menus.some(m=>(m.filterTags||[]).includes(t)));$('#menuFilterChips').innerHTML=[['','Tous'],...available.map(t=>[t,t])].map(([v,l])=>`<button class="style-chip ${state.menuFilter===v?'active':''}" data-menu-filter="${escapeHtml(v)}">${escapeHtml(l)}</button>`).join('');$('#menuFilterChips').querySelectorAll('[data-menu-filter]').forEach(b=>b.onclick=()=>{state.menuFilter=b.dataset.menuFilter;renderMenus();});}
  else{panel.classList.add('hidden');$('#menuFilterChips').innerHTML='';if(!q)menus=[];}
  if(state.menuFilter&&state.menuFilter!=='__favorites__'&&!state.menuUniverse)menus=menus.filter(m=>(m.filterTags||[]).includes(state.menuFilter));
  $('#menuFavoritesBtn').classList.toggle('active',state.menuFilter==='__favorites__');const emptyText=(!state.menuUniverse&&!state.menuFilter&&!q)?'Choisis un univers ci-dessus pour afficher les menus correspondants.':'Aucun menu dans cette sélection.';$('#menusGrid').innerHTML=menus.length?menus.map(menuCard).join(''):`<div class="shopping-empty">${emptyText}</div>`;bindMenuCards($('#menusGrid'));
}
function bindMenuCards(root){
  root.querySelectorAll('[data-open-menu]').forEach(b=>b.onclick=()=>openMenuDrawer(b.dataset.openMenu));
  root.querySelectorAll('[data-shop-menu]').forEach(b=>b.onclick=()=>addMenuToShopping(b.dataset.shopMenu));
  root.querySelectorAll('[data-export-menu]').forEach(b=>b.onclick=()=>openExport('menu',b.dataset.exportMenu));
  root.querySelectorAll('[data-fav-menu]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFavoriteMenu(b.dataset.favMenu);});
}
function openMenuDrawer(id){
  const m=state.menus.find(x=>x.id===id);if(!m)return;const ids=getMenuRecipeIds(m);const labels=m.slotLabels||['Entrée','Plat','Dessert'];const fav=(state.prefs.favoriteMenus||[]).includes(id);
  $('#menuDrawerContent').innerHTML=`<div class="menu-detail-head"><span class="kicker">MENU FAFATRAINING</span><h2 id="menuDrawerTitle">${escapeHtml(m.title)}</h2><p>${escapeHtml(m.subtitle||'')}</p><div class="tag-row">${(m.filterTags||m.tags||[]).map(t=>`<span class="style-tag">${escapeHtml(t)}</span>`).join('')}</div><div class="menu-head-actions"><button id="menuFavDetail" class="outline-btn">${fav?'♥ Menu enregistré':'♡ Enregistrer ce menu'}</button>${state.prefs.menuOverrides?.[id]?'<button id="resetMenuOverride" class="outline-btn">Réinitialiser le menu</button>':''}</div></div><div class="menu-detail-recipes">${ids.map((rid,i)=>{const r=state.recipes.find(x=>x.id===rid);if(!r)return'';return `<article class="menu-recipe-row"><div class="menu-recipe-thumb ${imgSrc(r)?'':'no-image'}">${imgSrc(r)?`<img class="${r.imageFit==='contain'?'contain':''}" src="${escapeHtml(imgSrc(r))}" alt="">`:`<span>${categoryIcon[r.category]||'🍽️'}</span>`}</div><div class="menu-recipe-info"><span>${labels[i]||'Recette'}</span><strong>${escapeHtml(r.name)}</strong><small>⏱ ${totalTime(r)||'—'} min · ${escapeHtml(supportBadge(r))}</small></div><div class="menu-recipe-actions"><button data-menu-recipe-open="${rid}">Ouvrir</button><button data-menu-replace="${id}|${i}">Remplacer</button></div></article>`;}).join('')}</div><div class="menu-detail-footer"><button class="primary-btn" data-shop-menu="${m.id}">Ajouter tout aux courses</button><button class="outline-btn" id="planMenuBtn">Ajouter au planning</button><button class="outline-btn" data-export-menu="${m.id}">Créer le visuel</button></div>`;
  $('#menuDrawer').classList.add('open');$('#menuDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  $('#menuDrawerContent').querySelectorAll('[data-menu-recipe-open]').forEach(b=>b.onclick=()=>{closeMenuDrawer();openRecipe(b.dataset.menuRecipeOpen);});
  $('#menuDrawerContent').querySelectorAll('[data-menu-replace]').forEach(b=>b.onclick=()=>{const [mid,idx]=b.dataset.menuReplace.split('|');replaceMenuRecipe(mid,Number(idx));});
  $('#menuFavDetail').onclick=()=>toggleFavoriteMenu(id);
  if($('#resetMenuOverride'))$('#resetMenuOverride').onclick=()=>{delete state.prefs.menuOverrides[id];savePrefs();openMenuDrawer(id);renderMenus();toast('Menu d’origine restauré');};
  $('#planMenuBtn').onclick=()=>openPlanAssign(true,'menu',id);
  bindMenuCards($('#menuDrawerContent'));
}
function closeMenuDrawer(){const d=$('#menuDrawer');if(!d)return;d.classList.remove('open');d.setAttribute('aria-hidden','true');if(!$('#recipeDrawer').classList.contains('open'))document.body.style.overflow='';}
function replaceMenuRecipe(menuId,index){
  const m=state.menus.find(x=>x.id===menuId);if(!m)return;const ids=[...getMenuRecipeIds(m)];const current=state.recipes.find(r=>r.id===ids[index]);if(!current)return;
  const candidates=state.recipes.filter(passesRestrictions).filter(r=>r.id!==current.id&&r.category===current.category);const alt=candidates[Math.floor(Math.random()*candidates.length)]||state.recipes.filter(passesRestrictions).find(r=>r.id!==current.id);if(!alt)return;
  ids[index]=alt.id;state.prefs.menuOverrides[menuId]=ids;savePrefs();openMenuDrawer(menuId);renderMenus();toast('Recette remplacée et mémorisée');
}

function addMenuToShopping(id){
  const m=state.menus.find(x=>x.id===id);if(!m)return;
  getMenuRecipeIds(m).forEach(rid=>{const r=state.recipes.find(x=>x.id===rid);if(!r)return;const target=state.prefs.household||4;const ex=state.prefs.shopping.find(x=>x.id===rid);if(ex)ex.servings=(Number(ex.servings)||0)+target;else state.prefs.shopping.push({id:rid,servings:target});});
  savePrefs();renderShopping();toast('Menu ajouté aux courses');
}


function openPlanAssign(open,type=null,id=null){
  $('#planAssignDrawer').classList.toggle('open',open);$('#planAssignDrawer').setAttribute('aria-hidden',String(!open));
  if(open){const pendingDay=state._pendingPlanDay||'mon';state.planAssign={type,id,slot:state.planAssign.slot||'lunch'};$('#planDaySelect').value=pendingDay;state._pendingPlanDay=null;const label=type==='menu'?state.menus.find(m=>m.id===id)?.title:state.recipes.find(r=>r.id===id)?.name;$('#planAssignLabel').textContent=label?`À placer : ${label}`:'';setPlanSlot(state.planAssign.slot||'lunch');document.body.style.overflow='hidden';}
  else if(!$('#recipeDrawer').classList.contains('open')&&!$('#menuDrawer').classList.contains('open'))document.body.style.overflow='';
}
function setPlanSlot(slot){state.planAssign.slot=slot;$('#planLunchBtn').classList.toggle('active',slot==='lunch');$('#planDinnerBtn').classList.toggle('active',slot==='dinner');}
function confirmPlanAssignment(){
  const day=$('#planDaySelect').value,slot=state.planAssign.slot,key=`${day}-${slot}`;if(!state.planAssign.type||!state.planAssign.id)return;
  const servings=state.planAssign.type==='recipe'?(state.currentRecipe?.id===state.planAssign.id?state.currentServings:state.prefs.household):(state.prefs.household||4);state.prefs.planning[key]={type:state.planAssign.type,id:state.planAssign.id,servings};savePrefs();openPlanAssign(false);renderPlanning();renderHome();renderOrganize();toast('Ajouté au planning');
}
function planningEntryLabel(entry){
  if(!entry)return null;if(entry.type==='menu'){const m=state.menus.find(x=>x.id===entry.id);return m?{title:m.title,meta:`Menu complet · ${entry.servings||state.prefs.household||4} pers.`,emoji:'📋'}:null;}
  const r=state.recipes.find(x=>x.id===entry.id);return r?{title:r.name,meta:`${totalTime(r)||'—'} min · ${entry.servings||state.prefs.household||4} pers. · ${supportBadge(r)}`,emoji:categoryIcon[r.category]||'🍽️'}:null;
}
function renderPlanning(){
  const grid=$('#planningGrid');if(!grid)return;let filled=0;
  grid.innerHTML=PLAN_DAYS.map(([day,label])=>`<section class="plan-day"><h3>${label}</h3>${PLAN_SLOTS.map(([slot,slotLabel])=>{const key=`${day}-${slot}`,entry=state.prefs.planning[key],info=planningEntryLabel(entry);if(info)filled++;return `<div class="plan-slot ${info?'filled':''}"><span class="plan-slot-label">${slotLabel}</span>${info?`<strong>${escapeHtml(info.title)}</strong><small>${escapeHtml(info.meta)}</small><div class="plan-slot-actions"><button data-plan-open="${key}">Ouvrir</button><button data-plan-remove="${key}">Retirer</button></div>`:`<button class="plan-empty-btn" data-plan-browse="${day}|${slot}">+ Ajouter</button>`}</div>`;}).join('')}</section>`).join('');
  $('#planningSummary').textContent=`${filled} repas planifié${filled>1?'s':''} sur 14`;
  $$('[data-plan-remove]').forEach(b=>b.onclick=()=>{delete state.prefs.planning[b.dataset.planRemove];savePrefs();renderPlanning();renderHome();renderOrganize();});
  $$('[data-plan-open]').forEach(b=>b.onclick=()=>{const e=state.prefs.planning[b.dataset.planOpen];if(!e)return;if(e.type==='menu')openMenuDrawer(e.id);else openRecipe(e.id);});
  $$('[data-plan-browse]').forEach(b=>b.onclick=()=>{const [day,slot]=b.dataset.planBrowse.split('|');state.planAssign={type:null,id:null,slot};state._pendingPlanDay=day;resetFilters(false);navigate('recipes');toast('Choisis une recette puis touche “Planifier”');});
}
function planningRecipeTotals(){
  const totals=new Map();
  Object.values(state.prefs.planning||{}).forEach(e=>{
    if(!e)return;const people=Number(e.servings)||state.prefs.household||4;
    if(e.type==='recipe')totals.set(e.id,(totals.get(e.id)||0)+people);
    else if(e.type==='menu'){
      const m=state.menus.find(x=>x.id===e.id);if(!m)return;
      getMenuRecipeIds(m).forEach(id=>totals.set(id,(totals.get(id)||0)+people));
    }
  });
  return totals;
}
function planningToShopping(){
  const totals=planningRecipeTotals();if(!totals.size)return toast('Ton planning est vide');
  totals.forEach((servings,id)=>{const r=state.recipes.find(x=>x.id===id);if(!r)return;const ex=state.prefs.shopping.find(e=>e.id===id);if(ex)ex.servings=(Number(ex.servings)||0)+servings;else state.prefs.shopping.push({id,servings});});
  savePrefs();renderShopping();toast('Courses de la semaine ajoutées');navigate('shopping');
}

function hasTm6(r){return Array.isArray(r.modes?.tm6)&&r.modes.tm6.length>0;}
function getSteps(r,mode){return mode==='tm6'&&hasTm6(r)?r.modes.tm6:(r.modes?.classic||[]);}
function openRecipe(id,open=true){
  const r=state.recipes.find(x=>x.id===id);if(!r)return;state.currentRecipe=r;
  const tm6=hasTm6(r);
  if(open){
    state.currentServings=state.prefs.household||r.servings||4;
    state.currentDrawerMode=(state.prefs.mode==='tm6'&&tm6)?'tm6':'classic';
    state.prefs.recentCategories=[r.category,...(state.prefs.recentCategories||[]).filter(x=>x!==r.category)].slice(0,5);
    state.prefs.recentRecipes=[r.id,...(state.prefs.recentRecipes||[]).filter(x=>x!==r.id)].slice(0,12);savePrefs();
  }
  if(state.currentDrawerMode==='tm6'&&!tm6)state.currentDrawerMode='classic';
  const factor=state.currentServings/(r.servings||1),steps=getSteps(r,state.currentDrawerMode),image=imgSrc(r),fav=state.prefs.favorites.includes(r.id);
  const allergens=(r.allergens||[]).map(a=>allergenLabels[a]||a.replaceAll('_',' '));
  const origin=originLabel(r);
  const per=r.macros||{};const total={kcal:Math.round((Number(per.kcal)||0)*state.currentServings),proteines:Math.round((Number(per.proteines)||0)*state.currentServings*10)/10,glucides:Math.round((Number(per.glucides)||0)*state.currentServings*10)/10,lipides:Math.round((Number(per.lipides)||0)*state.currentServings*10)/10};
  const nutritionReady=r.nutritionStatus==='calculated'||r.nutritionStatus==='estimated';
  const nutritionLabel=r.nutritionStatus==='calculated'?'Calculé':r.nutritionStatus==='estimated'?'Estimation':'En cours de calcul';
  const nutritionHtml=nutritionReady?`<span class="nutrition-status">${nutritionLabel}</span><div class="ingredient-list"><div class="ingredient-row"><span>Calories</span><span>≈ ${per.kcal??'—'} kcal</span></div><div class="ingredient-row"><span>Protéines</span><span>≈ ${per.proteines??'—'} g</span></div><div class="ingredient-row"><span>Glucides</span><span>≈ ${per.glucides??'—'} g</span></div><div class="ingredient-row"><span>Lipides</span><span>≈ ${per.lipides??'—'} g</span></div></div><button id="nutritionTotalBtn" class="nutrition-total-btn">Voir le total pour ${state.currentServings} personne${state.currentServings>1?'s':''}</button><div id="nutritionTotalBox" class="nutrition-total-box hidden"><strong>Total de la recette · ${state.currentServings} personne${state.currentServings>1?'s':''}</strong><div class="ingredient-list"><div class="ingredient-row"><span>Calories</span><span>≈ ${total.kcal} kcal</span></div><div class="ingredient-row"><span>Protéines</span><span>≈ ${total.proteines} g</span></div><div class="ingredient-row"><span>Glucides</span><span>≈ ${total.glucides} g</span></div><div class="ingredient-row"><span>Lipides</span><span>≈ ${total.lipides} g</span></div></div></div><p class="small-note">${escapeHtml(r.nutritionBasis||'Valeurs indicatives par portion.')}</p>`:`<div class="nutrition-missing"><strong>Nutrition en cours de calcul</strong><p>Les valeurs ne sont pas affichées tant qu’elles ne sont pas suffisamment fiables.</p></div>`;
  const techniques=(r.techniques||[]).map(t=>`<span class="style-tag">${escapeHtml(t)}</span>`).join('');
  const cover=image?`<div class="drawer-cover has-image"><img class="${r.imageFit==='contain'?'contain':''}" src="${escapeHtml(image)}" alt="${escapeHtml(r.name)}"></div>`:'';
  const tm6Label=r.tm6Status==='full'?'TM6 · recette complète':'TM6 · aide ciblée';
  const methodNote=state.currentDrawerMode==='tm6'?(r.tm6Status==='full'?'Cette méthode est réalisable entièrement au Thermomix TM6 avec les réglages indiqués étape par étape.':'Le Thermomix TM6 est utilisé uniquement là où il apporte une aide réelle ; les autres gestes restent classiques.'):`Méthode classique · matériel principal : ${supportBadge(r)}.`;
  const detailedEquipment=uniq((r.equipment||[]).filter(Boolean).filter(x=>x!=='Cuisine classique'&&x!=='Ustensiles & four'));
  const equipmentLine=detailedEquipment.length?detailedEquipment.join(' · '):supportBadge(r);
  $('#drawerContent').innerHTML=`<div class="drawer-hero cooking-first-hero ${image?'':'no-cover'}">${cover}<div class="drawer-head"><span class="kicker">${escapeHtml(r.category)} · ${escapeHtml(r.subtype||'Recette')}</span><h2 id="drawerTitle">${escapeHtml(r.name)}</h2><div class="drawer-meta primary-meta"><span>⏱ Total ${totalTime(r)||'—'} min</span><span>Prépa ${Number(r.prepMin)||0} min</span><span>Cuisson ${Number(r.cookMin)||0} min</span><span>👥 ${state.currentServings} pers.</span><span>◉ ${escapeHtml(r.difficulty||'Facile')}</span>${origin?`<span>🌍 ${escapeHtml(origin)}</span>`:''}</div><div class="recipe-equipment-line"><strong>Matériel :</strong> ${escapeHtml(equipmentLine)}</div><p class="recipe-intro">${escapeHtml(r.description||'')}</p><div class="drawer-actions main-cook-actions"><button class="primary big-cook-btn" id="startCookBtn">▶ Commencer à cuisiner</button></div><div class="recipe-secondary-actions"><button id="drawerFavBtn">${fav?'♥ Favori':'♡ Favori'}</button><button id="drawerShopBtn">+ Courses</button><button id="drawerPlanBtn">▤ Planifier</button><button id="drawerExportBtn">Créer le visuel</button></div></div></div>
  <div class="mode-row mode-choice-box"><span class="kicker">MÉTHODE DE CUISSON</span><div class="segmented" id="drawerModes"><button data-drawer-mode="classic" class="${state.currentDrawerMode==='classic'?'active':''}">Méthode classique</button>${tm6?`<button data-drawer-mode="tm6" class="${state.currentDrawerMode==='tm6'?'active':''}">${tm6Label}</button>`:''}</div><p class="small-note">${escapeHtml(methodNote)}</p></div>
  <div class="serving-preset-box"><span class="kicker">PORTIONS</span><div class="segmented serving-presets">${[1,2,3,4,6].map(n=>`<button data-serving-preset="${n}" class="${state.currentServings===n?'active':''}">${n}</button>`).join('')}<button data-serving-preset="plus" class="${![1,2,3,4,6].includes(state.currentServings)?'active':''}">${state.currentServings>6?state.currentServings:'+'}</button></div><p class="small-note">Les quantités se recalculent automatiquement. Les temps et températures restent ceux de la recette : si tu modifies fortement les portions, surveille la cuisson et ajuste seulement si nécessaire. Pour le sel, le piment et les épices puissantes, augmente progressivement.</p></div>
  <div class="drawer-grid"><section class="drawer-section ingredients-main"><div class="section-title-row"><div><span class="kicker">AVANT DE COMMENCER</span><h3>Ingrédients</h3></div></div><div class="ingredient-list checklist">${r.ingredients.map(i=>`<label class="ingredient-check"><input type="checkbox"><span>${escapeHtml(i.name)}</span><strong>${formatQty(smartScaledQty(i,factor))} ${escapeHtml(i.unit||'')}</strong></label>`).join('')}</div></section>
  <section class="drawer-section nutrition-section"><span class="kicker">REPÈRES NUTRITIONNELS</span><h3>Par portion</h3>${nutritionHtml}${allergens.length?`<div class="allergen-box"><strong>Allergènes :</strong> ${escapeHtml(allergens.join(', '))}</div>`:''}</section>
  <section class="drawer-section full-width-section steps-main"><span class="kicker">${state.currentDrawerMode==='tm6'?'THERMOMIX TM6':'PRÉPARATION'}</span><h3>${state.currentDrawerMode==='tm6'?'Pas à pas TM6':'Préparation pas à pas'}</h3><div class="steps-list compact-steps">${steps.map((st,i)=>`<div class="step-box"><span class="step-index">${i+1}</span><div><strong>${escapeHtml(st.title||'Étape')}</strong><p>${escapeHtml(st.text||'')}</p>${st.durationSec?`<small>⏱ ${Math.max(1,Math.round(st.durationSec/60))} min</small>`:''}</div></div>`).join('')}</div></section>
  <section class="drawer-section full-width-section learning-section"><span class="kicker">REPÈRES UTILES</span><h3>Pour réussir cette recette</h3><div class="style-tags">${techniques||'<span class="style-tag">mise en place</span>'}</div>${r.safetyTip?`<div class="safety-box"><strong>Sécurité</strong><p>${escapeHtml(r.safetyTip)}</p></div>`:''}<p class="small-note">${escapeHtml(r.storage||'Conserve les restes rapidement au réfrigérateur dans une boîte fermée.')}</p></section>
  ${((r.tips||[]).length||(r.substitutions||[]).length)?`<section class="drawer-section full-width-section"><span class="kicker">ASTUCES</span><h3>Conseils & substitutions</h3><div class="steps-list">${(r.tips||[]).map(t=>`<div class="step-box simple-tip"><p>${escapeHtml(t)}</p></div>`).join('')}${(r.substitutions||[]).slice(0,6).map(t=>`<div class="step-box simple-tip"><p>↔ ${escapeHtml(t)}</p></div>`).join('')}</div></section>`:''}
  <section class="drawer-section full-width-section personal-recipe-section"><span class="kicker">MES REPÈRES</span><h3>Notes & restes</h3><label class="form-label">Ma note<textarea id="recipeNoteField" class="drawer-textarea" placeholder="Ex. 5 min de plus, moins de sel la prochaine fois…">${escapeHtml(state.prefs.recipeNotes[r.id]||'')}</textarea></label><div class="leftover-row"><span>Portions restantes</span><div class="segmented">${[0,1,2,3,4,5,6].map(n=>`<button data-leftover="${n}" class="${Number(state.prefs.leftovers[r.id]||0)===n?'active':''}">${n}</button>`).join('')}</div></div></section></div>`;
  $('#drawerModes').querySelectorAll('[data-drawer-mode]').forEach(b=>b.onclick=()=>{state.currentDrawerMode=b.dataset.drawerMode;openRecipe(r.id,false);});
  $$('[data-serving-preset]').forEach(b=>b.onclick=()=>{const v=b.dataset.servingPreset;if(v==='plus')state.currentServings=Math.min(12,state.currentServings+1);else state.currentServings=Number(v);openRecipe(r.id,false);});
  if($('#nutritionTotalBtn'))$('#nutritionTotalBtn').onclick=()=>{const box=$('#nutritionTotalBox');box.classList.toggle('hidden');$('#nutritionTotalBtn').textContent=box.classList.contains('hidden')?`Voir le total pour ${state.currentServings} personne${state.currentServings>1?'s':''}`:'Masquer le total';};
  $('#drawerShopBtn').onclick=()=>addToShopping(r.id,state.currentServings);$('#drawerPlanBtn').onclick=()=>openPlanAssign(true,'recipe',r.id);$('#drawerExportBtn').onclick=()=>openExport('recipe',r.id);$('#drawerFavBtn').onclick=()=>toggleFavorite(r.id);$('#startCookBtn').onclick=()=>startCook(r,state.currentDrawerMode);
  if($('#recipeNoteField'))$('#recipeNoteField').oninput=e=>{state.prefs.recipeNotes[r.id]=e.target.value;savePrefs();};$$('[data-leftover]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.leftover);if(n)state.prefs.leftovers[r.id]=n;else delete state.prefs.leftovers[r.id];savePrefs();$$('[data-leftover]').forEach(x=>x.classList.toggle('active',x===b));toast(n?`${n} portion${n>1?'s':''} restante${n>1?'s':''}`:'Aucun reste enregistré');});
  if(open){$('#recipeDrawer').classList.add('open');$('#recipeDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
}

function closeRecipe(){ $('#recipeDrawer').classList.remove('open'); $('#recipeDrawer').setAttribute('aria-hidden','true'); if(!$('#cookMode').classList.contains('open')) document.body.style.overflow=''; }
function formatQty(n){ if(!Number.isFinite(n)) return ''; if(Math.abs(n-Math.round(n))<.01) return String(Math.round(n)); return String(Math.round(n*10)/10).replace('.',','); }
function smartScaledQty(i,factor){
  const raw=Number(i.qty||0)*factor;if(!Number.isFinite(raw))return 0;
  const unit=norm(i.unit),name=norm(i.name);
  if(/^(piece|pieces|unite|unites|gousse|gousses)$/.test(unit)||/oeuf|oignon|citron|orange|pomme|poire|tomate|avocat|banane|gousse/.test(name)){
    if(/oignon|citron|orange|pomme|poire|tomate|avocat|banane/.test(name))return Math.max(.5,Math.round(raw*2)/2);
    return Math.max(1,Math.round(raw));
  }
  return raw;
}

const PANTRY_ALIASES={
  'aubergines':'aubergine','betteraves':'betterave','carottes':'carotte','courgettes':'courgette','crevettes':'crevette',
  'celeri-rave':'céleri-rave','celeri rave':'céleri-rave','dattes':'datte','escalopes de dinde':'escalope de dinde','moules':'moule',
  'myrtilles':'myrtille','noisettes':'noisette','oignons':'oignon','olives':'olive','olives noires':'olive noire',
  'patates douces':'patate douce','poires':'poire','poivrons rouges':'poivron rouge','pommes':'pomme','pommes de terre':'pomme de terre',
  'tomates':'tomate','oeufs':'œuf','œufs':'œuf'
};
function pantryKey(name){return norm(String(name||'').replace(/[’']/g,"'").replace(/\s*-\s*/g,'-')).replace(/^oeuf$/,'oeuf');}
function canonicalPantryName(name){const raw=String(name||'').trim();const key=pantryKey(raw);return PANTRY_ALIASES[key]||raw;}
function pantryIngredients(){const count=new Map();state.recipes.forEach(r=>r.ingredients.forEach(i=>{const n=canonicalPantryName(i.name);count.set(n,(count.get(n)||0)+1);}));return [...count.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'fr')).map(x=>x[0]);}
function renderPantry(){
  const all=pantryIngredients(),q=norm($('#fridgeSearch')?.value||'');const selected=state.prefs.pantry||[];if($('#clearFridgeBtn'))$('#clearFridgeBtn').classList.toggle('hidden',!selected.length);if($('#pantryLibraryCount'))$('#pantryLibraryCount').textContent=`${all.length} ingrédients disponibles`;
  $('#selectedPantry').innerHTML=selected.length?selected.map(n=>`<button class="selected-pill" data-pantry="${escapeHtml(n)}">${escapeHtml(n)} ×</button>`).join(''):'<span class="small-note">Aucun ingrédient sélectionné pour le moment.</span>';
  const recent=(state.prefs.pantryRecent||[]).filter(x=>all.includes(x)||selected.includes(x)).slice(0,12),favs=(state.prefs.pantryFavorites||[]).filter(x=>all.includes(x)||selected.includes(x));$('#pantryRecentBlock').classList.toggle('hidden',!recent.length);$('#pantryFavoritesBlock').classList.toggle('hidden',!favs.length);$('#pantryRecent').innerHTML=pantryButtons(recent);$('#pantryFavorites').innerHTML=pantryButtons(favs,true);
  const groups=pantryGroups(all);const gbox=$('#pantryGroupGrid');gbox.classList.toggle('hidden',Boolean(state.pantryGroup));gbox.innerHTML=Object.entries(groups).map(([g,items])=>`<button class="pantry-group-card" data-pantry-group="${escapeHtml(g)}"><span>${pantryGroupIcon(g)}</span><strong>${escapeHtml(g)}</strong><small>${items.length} ingrédients</small><b>→</b></button>`).join('');gbox.querySelectorAll('[data-pantry-group]').forEach(b=>b.onclick=()=>{state.pantryGroup=b.dataset.pantryGroup;$('#fridgeSearch').value='';renderPantry();});
  let list=[];let title='';if(q){list=all.filter(x=>norm(x).includes(q)).slice(0,100);title=`Résultats pour « ${$('#fridgeSearch').value.trim()} »`;state.pantryGroup='__search__';}else if(state.pantryGroup==='__all__'){list=[...all].sort((a,b)=>a.localeCompare(b,'fr'));title=`Tous les ingrédients · ${all.length}`;}else if(state.pantryGroup&&state.pantryGroup!=='__search__'){list=groups[state.pantryGroup]||[];title=state.pantryGroup;}
  const panel=$('#pantryGroupPanel');panel.classList.toggle('hidden',!list.length&&!state.pantryGroup);if(state.pantryGroup){$('#pantryGroupTitle').textContent=title||'Aucun résultat';$('#pantryGroupItems').innerHTML=list.length?pantryButtons(list,true):'<p class="small-note">Aucun ingrédient trouvé. Tu peux l’ajouter avec le champ « ingrédient absent de la liste ».</p>';}
  document.querySelectorAll('[data-pantry]').forEach(b=>b.onclick=()=>togglePantry(b.dataset.pantry));document.querySelectorAll('[data-pantry-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();togglePantryFavorite(b.dataset.pantryFav);});syncFridgeSearchAction();
}

function pantryTermMatch(h,term){const t=norm(term).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(^|[^a-z0-9])${t}($|[^a-z0-9])`).test(h);}
function pantryHasAny(h,terms){return terms.some(t=>pantryTermMatch(h,t));}
function pantryGroupFor(name){
  const h=norm(name);
  // Légumes avant les fruits : « pomme de terre » ne doit jamais être classée dans Fruits.
  if(pantryHasAny(h,['oignon','ail','echalote','pomme de terre','patate douce','manioc','plantain','courgette','aubergine','brocoli','chou','chou-fleur','chou rouge','chou vert','chou kale','chou de bruxelles','carotte','poireau','epinard','epinards','haricot vert','poivron','tomate','concombre','champignon','fenouil','celeri','asperge','artichaut','betterave','panais','navet','courge','potiron','potimarron','butternut','gombo','blette','petit pois','radis','endive','salade','laitue','roquette','mache','avocat','maïs','mais','asperge','asperges','blette','blettes','champignons','choux de bruxelles','chou de bruxelles','epinards frais','haricots verts','kale','petits pois','poireaux','rutabaga','tomates cerises','tomates concassees','topinambour','ciboule']))return'Légumes & aromates';
  if(pantryHasAny(h,['pomme','poire','banane','citron','citron vert','orange','mandarine','clementine','mangue','kiwi','fraise','myrtille','framboise','mure','cassis','ananas','peche','nectarine','abricot','raisin','melon','pasteque','grenade','figue','figues','datte','dattes denoyautees','prune','abricots secs','fraises','framboises','fruits de saison','raisins secs','fruit rouge','fruits rouges','noix de coco','coco','bananes mures']))return'Fruits';
  if(pantryHasAny(h,['poulet','dinde','boeuf','veau','porc','agneau','jambon','steak','viande','canard','lapin','lardons','bacon','saucisse','merguez']))return'Viandes & volaille';
  if(pantryHasAny(h,['saumon','cabillaud','colin','merlu','dorade','bar','thon','sardine','maquereau','poisson','crevette','moule','calamar','poulpe','crabe','homard','coquille saint-jacques','saint-jacques','anchois','truite','crevettes decortiquees','lieu noir','filets de lieu noir']))return'Poissons & fruits de mer';
  if(pantryHasAny(h,['tofu','tempeh','seitan','proteine vegetale','proteines vegetales']))return'Protéines végétales';
  if(pantryHasAny(h,['oeuf','lait','yaourt','fromage','creme','beurre','ricotta','feta','mozzarella','parmesan','skyr','mascarpone','fromage blanc','petit-suisse','kefir']))return'Œufs & laitages';
  if(pantryHasAny(h,['pate','pates','riz','quinoa','boulgour','semoule','couscous','millet','sarrasin','avoine','flocons d avoine','farine','pain','polenta','orge','gnocchi','épeautre','epeautre','tortilla','nouille','nouilles','vermicelle','vermicelles','biscuit','biscuits','biscuit speculoos','biscuits cuillere','chapelure','granola','maizena','plaques de lasagnes','tortilla','tortillas']))return'Pâtes, riz & céréales';
  if(pantryHasAny(h,['lentille','lentilles','pois chiche','pois chiches','haricot rouge','haricots rouges','haricot blanc','haricots blancs','haricot noir','haricots noirs','pois casse','pois casses','feve','feves']))return'Légumineuses';
  if(pantryHasAny(h,['amande','amandes','noix','noisette','noisettes','pistache','pistaches','cacahuete','cacahuetes','arachide','arachides','noix de cajou','noix de pecan','graine de chia','graines de chia','graine de courge','graines de courge','graine de tournesol','graines de tournesol','graine de sesame','graines de sesame','sesame','lin','chataignes cuites','graines de pavot','pignons']))return'Fruits à coque & graines';
  if(pantryHasAny(h,['persil','menthe','basilic','coriandre','thym','origan','romarin','cumin','paprika','curry','cannelle','gingembre','curcuma','muscade','piment','aneth','estragon','ciboulette','ciboule','citronnelle','herbes de provence','herbes','herbes fraiches','laurier','sauge','cardamome','colombo','epices','epices antillaises','epices cajun','garam masala','ras-el-hanout','zaatar','épice','epice']))return'Herbes & épices';
  if(pantryHasAny(h,['eau','glacons','cafe','cafe froid','the noir','the vert','matcha','poudre de matcha','chicoree']))return'Boissons, café & infusions';
  if(pantryHasAny(h,['huile','vinaigre','moutarde','miel','sirop','sauce','coulis','bouillon','cacao','chocolat','sucre','sel','poivre','olive','capre','tahini','puree de cacahuete','concentre de tomate','tomate concassee','levure','vanille','capres','gelatine','miso','nutella','pesto','tamari','proteine en poudre','fleur d oranger','fleur d’oranger','olives vertes']))return'Épicerie, sauces & condiments';
  return'Autres & placard';
}
function pantryGroups(all){const groups={};all.forEach(x=>(groups[pantryGroupFor(x)]??=[]).push(x));const order=['Légumes & aromates','Fruits','Viandes & volaille','Poissons & fruits de mer','Protéines végétales','Œufs & laitages','Pâtes, riz & céréales','Légumineuses','Fruits à coque & graines','Boissons, café & infusions','Épicerie, sauces & condiments','Herbes & épices','Autres & placard'];const out={};order.forEach(g=>{if(groups[g]?.length)out[g]=groups[g].sort((a,b)=>a.localeCompare(b,'fr'));});return out;}
function pantryGroupIcon(g){return {'Légumes & aromates':'🥕','Fruits':'🍎','Viandes & volaille':'🥩','Poissons & fruits de mer':'🐟','Protéines végétales':'🌱','Œufs & laitages':'🥚','Pâtes, riz & céréales':'🌾','Légumineuses':'🫘','Fruits à coque & graines':'🥜','Boissons, café & infusions':'☕','Épicerie, sauces & condiments':'🧂','Herbes & épices':'🌿','Autres & placard':'🫙'}[g]||'🍽️';}
function pantryButtons(list,showFav=false){const favs=state.prefs.pantryFavorites||[];return list.map(n=>`<span class="pantry-item-wrap"><button class="pantry-btn ${(state.prefs.pantry||[]).includes(n)?'selected':''}" data-pantry="${escapeHtml(n)}">${escapeHtml(n)}</button>${showFav?`<button class="pantry-star ${favs.includes(n)?'active':''}" data-pantry-fav="${escapeHtml(n)}" aria-label="Favori">${favs.includes(n)?'★':'☆'}</button>`:''}</span>`).join('');}
function togglePantryFavorite(name){const n=canonicalPantryName(name),a=state.prefs.pantryFavorites||[],key=pantryKey(n),exists=a.some(x=>pantryKey(x)===key);state.prefs.pantryFavorites=exists?a.filter(x=>pantryKey(x)!==key):[...a,n];savePrefs();renderPantry();}
function addPantryIngredient(raw){const n=canonicalPantryName(raw);if(!n)return;const exists=state.prefs.pantry.some(x=>pantryKey(x)===pantryKey(n));if(!exists)state.prefs.pantry.push(n);state.prefs.pantryRecent=[n,...(state.prefs.pantryRecent||[]).filter(x=>pantryKey(x)!==pantryKey(n))].slice(0,20);savePrefs();renderPantry();renderFridgeResults();toast(exists?`${n} est déjà sélectionné`:`${n} ajouté`);}
function syncFridgeSearchAction(){const input=$('#fridgeSearch'),btn=$('#fridgeAddSearchBtn');if(!input||!btn)return;const raw=input.value.trim();if(!raw){btn.classList.add('hidden');btn.dataset.ingredient='';return;}const exact=pantryIngredients().find(x=>pantryKey(x)===pantryKey(raw));const chosen=exact||raw;btn.dataset.ingredient=chosen;btn.textContent=exact?`+ Ajouter ${exact}`:`+ Ajouter « ${raw} »`;btn.classList.remove('hidden');}
function addFridgeSearchIngredient(){const btn=$('#fridgeAddSearchBtn'),input=$('#fridgeSearch');const raw=btn?.dataset.ingredient||input?.value.trim();if(!raw)return;addPantryIngredient(raw);if(input)input.value='';state.pantryGroup='';syncFridgeSearchAction();renderPantry();}
function togglePantry(name){const n=canonicalPantryName(name),a=state.prefs.pantry||[],key=pantryKey(n),exists=a.some(x=>pantryKey(x)===key);state.prefs.pantry=exists?a.filter(x=>pantryKey(x)!==key):[...a,n];if(!exists)state.prefs.pantryRecent=[n,...(state.prefs.pantryRecent||[]).filter(x=>pantryKey(x)!==key)].slice(0,20);savePrefs();renderPantry();renderFridgeResults();}
function missingIngredientsFor(r){
  const have=new Set((state.prefs.pantry||[]).map(pantryKey));return r.ingredients.filter(i=>!have.has(pantryKey(canonicalPantryName(i.name))));
}
function addMissingToShopping(id){
  const r=state.recipes.find(x=>x.id===id);if(!r)return;const missing=missingIngredientsFor(r);if(!missing.length)return toast('Tu as déjà tous les ingrédients');
  missing.forEach(i=>{const key=norm(i.name)+'|'+norm(i.unit);const ex=state.prefs.manualShopping.find(x=>x.key===key);if(ex)ex.qty+=Number(i.qty||0);else state.prefs.manualShopping.push({key,name:i.name,unit:i.unit||'',qty:Number(i.qty||0)});});savePrefs();renderShopping();toast(`${missing.length} ingrédient${missing.length>1?'s':''} manquant${missing.length>1?'s':''} ajouté${missing.length>1?'s':''}`);
}
function renderFridgeTier(title,subtitle,items,kind){
  if(!items.length)return'';return `<section class="fridge-tier"><div class="section-title-row"><div><span class="kicker">${escapeHtml(kind)}</span><h2>${escapeHtml(title)}</h2><p class="section-subtitle">${escapeHtml(subtitle)}</p></div></div><div class="recipe-grid">${items.map(x=>{const miss=x.missing;const extra=recipeCard(x.r);return extra.replace('</div></article>',`${miss?`<button class="missing-shop-btn" data-missing-shop="${x.r.id}">+ ${miss} manquant${miss>1?'s':''} aux courses</button>`:'<span class="ready-badge">✓ Tu peux la faire maintenant</span>'}</div></article>`);}).join('')}</div></section>`;
}
function renderFridgeResults(){
  const sel=state.prefs.pantry;if(!sel.length){$('#fridgeResults').innerHTML='<div class="shopping-empty">Choisis ce que tu as déjà chez toi. Je te montrerai ce que tu peux faire maintenant, puis ce à quoi il manque seulement 1 ou 2 ingrédients.</div>';return;}
  const catalogKeys=new Set(state.recipes.flatMap(r=>r.ingredients.map(i=>pantryKey(canonicalPantryName(i.name)))));const unused=sel.filter(x=>!catalogKeys.has(pantryKey(canonicalPantryName(x))));const unusedHtml=unused.length?`<div class="pantry-unused-note"><strong>Pas encore utilisé dans le catalogue :</strong> ${unused.map(escapeHtml).join(', ')}. Tu peux le conserver dans ton frigo, mais aucune recette actuelle ne l’utilise encore.</div>`:'';
  const selected=new Set(sel.map(pantryKey));
  const scored=state.recipes.filter(passesRestrictions).map(r=>{const names=r.ingredients.map(i=>pantryKey(canonicalPantryName(i.name)));const hits=names.filter(n=>selected.has(n)).length;return{r,hits,missing:names.length-hits,ratio:names.length?hits/names.length:0};}).filter(x=>x.hits>0).sort((a,b)=>a.missing-b.missing||b.ratio-a.ratio||b.hits-a.hits);
  const exact=scored.filter(x=>x.missing===0).slice(0,12),one=scored.filter(x=>x.missing===1).slice(0,12),two=scored.filter(x=>x.missing===2).slice(0,12),near=scored.filter(x=>x.missing>2).slice(0,8);
  $('#fridgeResults').innerHTML=unusedHtml+renderFridgeTier('Tu peux cuisiner maintenant','Tous les ingrédients principaux sont déjà chez toi.',exact,'100 % PRÊT')+renderFridgeTier('Il te manque 1 ingrédient','Un petit passage par les courses suffit.',one,'PRESQUE PRÊT')+renderFridgeTier('Il te manque 2 ingrédients','Encore très proche de ce que tu as.',two,'FACILE À COMPLÉTER')+renderFridgeTier('Autres idées proches','Plusieurs ingrédients correspondent déjà à ton frigo.',near,'À GARDER EN TÊTE');
  bindRecipeCards($('#fridgeResults'));$$('[data-missing-shop]').forEach(b=>b.onclick=()=>addMissingToShopping(b.dataset.missingShop));
}

function addToShopping(id,servings=null){const r=state.recipes.find(x=>x.id===id);if(!r)return;const target=servings||r.servings||4;const existing=state.prefs.shopping.find(x=>x.id===id);if(existing)existing.servings=(Number(existing.servings)||0)+target;else state.prefs.shopping.push({id,servings:target});savePrefs();renderShopping();toast('Ajouté aux courses');}
function removeFromShopping(id){state.prefs.shopping=state.prefs.shopping.filter(x=>x.id!==id);savePrefs();renderShopping();}
function changeShoppingServings(id,delta){const e=state.prefs.shopping.find(x=>x.id===id);if(!e)return;e.servings=Math.max(1,Math.min(12,(e.servings||4)+delta));savePrefs();renderShopping();}
function shoppingItems(){
  const map=new Map();
  state.prefs.shopping.forEach(e=>{const r=state.recipes.find(x=>x.id===e.id);if(!r)return;const factor=(e.servings||r.servings||4)/(r.servings||1);r.ingredients.forEach(i=>{const key=norm(i.name)+'|'+norm(i.unit);if(!map.has(key))map.set(key,{name:i.name,unit:i.unit,qty:0});map.get(key).qty+=Number(i.qty||0)*factor;});});
  (state.prefs.manualShopping||[]).forEach(i=>{const key=i.key||norm(i.name)+'|'+norm(i.unit);if(!map.has(key))map.set(key,{name:i.name,unit:i.unit,qty:0});map.get(key).qty+=Number(i.qty||0);});
  return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr'));
}
function groceryGroup(name){const n=norm(name);if(/poulet|dinde|boeuf|veau|porc|agneau/.test(n))return'Viandes & volaille';if(/saumon|cabillaud|colin|thon|crevette|poisson/.test(n))return'Poissons';if(/lait|yaourt|fromage|ricotta|feta|mozzarella|beurre|creme/.test(n))return'Frais & laitages';if(/pomme|poire|banane|citron|orange|mangue|kiwi|fraise|myrtille|tomate|courgette|carotte|oignon|poivron|aubergine|concombre|brocoli|epinard|poireaux|champignon|avocat|menthe|persil/.test(n))return'Fruits & légumes';if(/riz|pate|quinoa|boulgour|semoule|farine|avoine|lentille|pois chiche|haricot|millet|sarrasin|polenta/.test(n))return'Épicerie';return'Autres';}
function renderShopping(){
  const entries=state.prefs.shopping.map(e=>({e,r:state.recipes.find(r=>r.id===e.id)})).filter(x=>x.r);const manual=state.prefs.manualShopping||[];const total=entries.length+manual.length;$('#shoppingBadge').textContent=total;$('#shoppingBadge').classList.toggle('hidden',!total);
  const items=shoppingItems(),hasItems=items.length>0;$('#shoppingOutputActions')?.classList.toggle('hidden',!hasItems);$('#shoppingEmptyActions')?.classList.toggle('compact',hasItems);
  $('#shoppingRecipeChips').innerHTML=entries.map(({e,r})=>`<span class="shopping-recipe-chip">${escapeHtml(r.name)} · ${e.servings||r.servings} pers.<button data-shop-minus="${r.id}">−</button><button data-shop-plus="${r.id}">+</button><button data-remove-shop="${r.id}">×</button></span>`).join('');
  $('#shoppingManualChips').innerHTML=manual.length?manual.map((i,idx)=>`<span class="shopping-recipe-chip manual-chip">Manquant : ${escapeHtml(i.name)}<button data-remove-manual="${idx}">×</button></span>`).join(''):'';
  $$('[data-remove-shop]').forEach(b=>b.onclick=()=>removeFromShopping(b.dataset.removeShop));$$('[data-shop-minus]').forEach(b=>b.onclick=()=>changeShoppingServings(b.dataset.shopMinus,-1));$$('[data-shop-plus]').forEach(b=>b.onclick=()=>changeShoppingServings(b.dataset.shopPlus,1));$$('[data-remove-manual]').forEach(b=>b.onclick=()=>{state.prefs.manualShopping.splice(Number(b.dataset.removeManual),1);savePrefs();renderShopping();});
  if(!items.length){$('#shoppingList').innerHTML='<div class="shopping-empty"><strong>Ta liste est vide.</strong><span>Ajoute un produit à la main ou récupère les ingrédients depuis une recette, un menu ou ton planning.</span></div>';return;}
  const groups={};items.forEach(i=>(groups[groceryGroup(i.name)]??=[]).push(i));$('#shoppingList').innerHTML=Object.entries(groups).map(([g,it])=>`<section class="shopping-group"><h3>${escapeHtml(g)}</h3>${it.map(x=>{const key=slug(x.name+'-'+x.unit);const done=state.prefs.shoppingDone.includes(key);return`<label class="shopping-item ${done?'done':''}"><input type="checkbox" data-shop-done="${key}" ${done?'checked':''}><span><strong>${formatQty(x.qty)} ${escapeHtml(x.unit||'')}</strong> ${escapeHtml(x.name)}</span></label>`;}).join('')}</section>`).join('');$$('[data-shop-done]').forEach(c=>c.onchange=()=>{const k=c.dataset.shopDone;const a=state.prefs.shoppingDone;state.prefs.shoppingDone=c.checked?[...new Set([...a,k])]:a.filter(x=>x!==k);savePrefs();renderShopping();});
}
function addManualShoppingItem(){
  const input=$('#manualShoppingInput');if(!input)return;const name=input.value.trim();if(!name)return toast('Écris le produit à ajouter');
  const key=norm(name)+'|';const existing=(state.prefs.manualShopping||[]).find(x=>(x.key||norm(x.name)+'|'+norm(x.unit||''))===key);
  if(existing)existing.qty=(Number(existing.qty)||1)+1;else state.prefs.manualShopping.push({key,name,unit:'',qty:1});
  input.value='';savePrefs();renderShopping();toast(`${name} ajouté à la liste`);
}
async function copyShopping(){const items=shoppingItems();if(!items.length)return toast('La liste est vide');const txt=['FAFATRAINING · LISTE DE COURSES','',...items.map(i=>`☐ ${formatQty(i.qty)} ${i.unit||''} ${i.name}`)].join('\n');try{await navigator.clipboard.writeText(txt);toast('Liste copiée');}catch{toast('Copie impossible sur cet appareil');}}
async function shareShopping(){const items=shoppingItems();if(!items.length)return toast('La liste est vide');const text=['FAFATRAINING · LISTE DE COURSES','',...items.map(i=>`☐ ${formatQty(i.qty)} ${i.unit||''} ${i.name}`)].join('\n');if(navigator.share){try{await navigator.share({title:'Liste de courses FAFATRAINING',text});return}catch(e){if(e?.name==='AbortError')return;}}try{await navigator.clipboard.writeText(text);toast('Partage direct indisponible : liste copiée');}catch{toast('Partage indisponible sur cet appareil');}}
function printShopping(){const items=shoppingItems();if(!items.length)return toast('La liste est vide');const w=window.open('','_blank','width=720,height=900');if(!w)return toast('Autorise les fenêtres pop-up pour imprimer');const rows=items.map(i=>`<li>☐ <strong>${formatQty(i.qty)} ${escapeHtml(i.unit||'')}</strong> ${escapeHtml(i.name)}</li>`).join('');w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Liste de courses FAFATRAINING</title><style>body{font-family:system-ui,sans-serif;padding:32px;max-width:760px;margin:auto;color:#111}h1{margin-bottom:8px}p{color:#555}li{padding:8px 0;border-bottom:1px solid #ddd;list-style:none}</style></head><body><h1>FAFATRAINING · Liste de courses</h1><p>${new Date().toLocaleDateString('fr-FR')}</p><ul>${rows}</ul></body></html>`);w.document.close();setTimeout(()=>{try{w.focus();w.print();}catch{}},250);}

function renderAll(){renderHome();renderOrganize();renderRecipes();renderMenus();renderPantry();renderFridgeResults();renderPlanning();renderShopping();}

async function requestCookWakeLock(){try{if('wakeLock' in navigator&&document.visibilityState==='visible'&&$('#cookMode').classList.contains('open')){const lock=await navigator.wakeLock.request('screen');state._wakeLock=lock;lock.addEventListener('release',()=>{if(state._wakeLock===lock)state._wakeLock=null;},{once:true});}}catch{}}
async function startCook(r,mode){state.cook.recipe=r;state.cook.steps=getSteps(r,mode);state.cook.index=0;closeRecipe();$('#cookMode').classList.add('open');$('#cookMode').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';renderCookStep();await requestCookWakeLock();}
function kitchenTipForStep(text){
  const h=norm(text);
  if(/mise en place|tout preparer|preparer les ingredients/.test(h))return'Repère cuisine : prends 5 minutes pour tout sortir, peser et couper avant d’allumer le feu. Tu éviteras les oublis et les cuissons trop longues.';
  if(/emin(c|ç)er|emince/.test(h))return'Repère cuisine : émincer = couper en fines lamelles. Cherche surtout des morceaux de taille régulière.';
  if(/faire revenir|revenir les/.test(h))return'Repère cuisine : feu moyen, un peu de matière grasse et des mouvements réguliers. L’aliment doit s’attendrir ou légèrement colorer sans brûler.';
  if(/dorer|saisir/.test(h))return'Repère cuisine : la poêle doit être bien chaude. Dépose l’aliment, ne le bouge pas tout de suite, puis retourne quand une croûte dorée s’est formée.';
  if(/mijoter/.test(h))return'Repère cuisine : cuisson douce, avec seulement de petites bulles. Couvre partiellement si la sauce réduit trop vite.';
  if(/fremir|fremissement/.test(h))return'Repère cuisine : frémir = petites bulles régulières. Si ça bout fortement, baisse le feu.';
  if(/deglac/.test(h))return'Repère cuisine : déglacer = verser un peu de liquide dans la poêle chaude puis gratter les sucs collés au fond pour enrichir la sauce.';
  if(/prechauff/.test(h))return'Repère cuisine : laisse le four atteindre la température demandée avant d’enfourner, sinon le temps de cuisson devient moins fiable.';
  if(/egoutter/.test(h))return'Repère cuisine : laisse l’eau s’écouler quelques secondes, voire une minute pour les légumes ou pommes de terre, afin d’éviter une préparation détrempée.';
  if(/nacrer/.test(h))return'Repère cuisine : nacrer le riz = le mélanger 1 à 2 minutes dans la matière grasse jusqu’à ce que les bords deviennent légèrement translucides.';
  if(/gratiner/.test(h))return'Repère cuisine : gratiner = colorer le dessus. Surveille les dernières minutes car la coloration peut accélérer très vite.';
  if(/reduire|reduction/.test(h))return'Repère cuisine : réduire = laisser évaporer une partie du liquide, généralement sans couvercle, jusqu’à obtenir une sauce plus concentrée.';
  if(/reposer/.test(h))return'Repère cuisine : le repos permet aux jus, à la chaleur et à la texture de se stabiliser. Ne saute pas cette étape quand elle est indiquée.';
  return'';
}
function renderCookStep(){const c=state.cook,s=c.steps[c.index]||{title:'Terminé',text:'La recette est prête.',durationSec:0};$('#cookProgress').textContent=`Étape ${c.index+1}/${c.steps.length}`;$('#cookRecipeName').textContent=c.recipe?.name||'Recette';$('#cookStepNumber').textContent=c.index+1;$('#cookStepTitle').textContent=s.title||'Étape';$('#cookStepText').textContent=s.text||'';const tip=state.prefs.guided===false?'':kitchenTipForStep(s.text||'');$('#cookBeginnerTip').textContent=tip;$('#cookBeginnerTip').classList.toggle('hidden',!tip);$('#cookPrevBtn').disabled=c.index===0;$('#cookNextBtn').textContent=c.index===c.steps.length-1?'Terminer':'Suivant';state.cook.timerInitial=Number(s.durationSec||0);state.cook.timerLeft=state.cook.timerInitial;stopTimer();updateTimerDisplay();$('#cookTimer').classList.add('hidden');}

function speakCookStep(){
  if(!('speechSynthesis' in window))return toast('Lecture vocale non disponible sur cet appareil');
  window.speechSynthesis.cancel();const c=state.cook,s=c.steps[c.index];if(!s)return;
  const u=new SpeechSynthesisUtterance(`Étape ${c.index+1} sur ${c.steps.length}. ${s.title||''}. ${s.text||''}`);u.lang='fr-FR';u.rate=.95;window.speechSynthesis.speak(u);
}
function repeatCookStep(){stopTimer();renderCookStep();speakCookStep();}
function moveCook(dir){const c=state.cook;if(dir>0&&c.index===c.steps.length-1){closeCook();toast('Recette terminée !');return;}c.index=Math.max(0,Math.min(c.steps.length-1,c.index+dir));renderCookStep();}
function closeCook(){stopTimer();try{window.speechSynthesis?.cancel();}catch{}try{state._wakeLock?.release();}catch{}state._wakeLock=null;$('#cookMode').classList.remove('open');$('#cookMode').setAttribute('aria-hidden','true');document.body.style.overflow='';}
function toggleTimerPanel(){if(!state.cook.timerInitial)return toast('Pas de durée précise pour cette étape');$('#cookTimer').classList.toggle('hidden');}
function updateTimerDisplay(){const s=Math.max(0,state.cook.timerLeft);$('#timerDisplay').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;$('#timerToggleBtn').textContent=state.cook.timerId?'Pause':'Démarrer';}
function toggleTimer(){if(state.cook.timerId){stopTimer();return;}if(state.cook.timerLeft<=0)state.cook.timerLeft=state.cook.timerInitial;state.cook.timerId=setInterval(()=>{state.cook.timerLeft--;updateTimerDisplay();if(state.cook.timerLeft<=0){stopTimer();toast('Minuteur terminé');}},1000);updateTimerDisplay();}
function stopTimer(){if(state.cook.timerId){clearInterval(state.cook.timerId);state.cook.timerId=null;}updateTimerDisplay();}
function resetTimer(){stopTimer();state.cook.timerLeft=state.cook.timerInitial;updateTimerDisplay();}


function openExport(type,id){
  state.export={type,id,format:'portrait',style:'social'};
  closeRecipe();
  $('#exportFormat').querySelectorAll('[data-export-format]').forEach(b=>b.classList.toggle('active',b.dataset.exportFormat==='portrait'));
  $('#exportCharacter').checked=true;
  $('#exportStyle').querySelectorAll('[data-export-style]').forEach(b=>b.classList.toggle('active',b.dataset.exportStyle==='social'));
  $('#exportDrawer').classList.add('open');
  $('#exportDrawer').setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  renderExportCanvas();
}
function closeExport(){
  const d=$('#exportDrawer'); if(!d)return;
  d.classList.remove('open'); d.setAttribute('aria-hidden','true');
  if(!$('#cookMode').classList.contains('open'))document.body.style.overflow='';
}
function exportDims(format){
  if(format==='story')return[1080,1920];
  if(format==='square')return[1080,1080];
  return[1080,1350];
}
function loadCanvasImage(src){return new Promise(resolve=>{if(!src)return resolve(null);const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=src;});}
function drawCover(ctx,img,x,y,w,h){
  if(!img)return;
  const ir=img.width/img.height,br=w/h; let sx=0,sy=0,sw=img.width,sh=img.height;
  if(ir>br){sw=img.height*br;sx=(img.width-sw)/2}else{sh=img.width/br;sy=(img.height-sh)/2}
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}
function drawRoundRect(ctx,x,y,w,h,r,fill,stroke){
  const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function wrapLines(ctx,text,maxWidth){
  const words=String(text||'').split(/\s+/);const lines=[];let line='';for(const word of words){const t=line?line+' '+word:word;if(ctx.measureText(t).width>maxWidth&&line){lines.push(line);line=word}else line=t;}if(line)lines.push(line);return lines;
}
function drawWrapped(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){
  const lines=wrapLines(ctx,text,maxWidth).slice(0,maxLines);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));return y+lines.length*lineHeight;
}
function ellipsisText(ctx,text,maxWidth){let s=String(text||'');if(ctx.measureText(s).width<=maxWidth)return s;while(s.length>3&&ctx.measureText(s+'…').width>maxWidth)s=s.slice(0,-1);return s+'…';}
async function renderExportCanvas(){
  const canvas=$('#exportCanvas');if(!canvas||!state.export.id)return;
  const [W,H]=exportDims(state.export.format);canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
  const clean=state.export.style==='clean';
  const grad=ctx.createLinearGradient(0,0,W,H);
  if(clean){grad.addColorStop(0,'#161916');grad.addColorStop(1,'#0d100d');}
  else{grad.addColorStop(0,'#081008');grad.addColorStop(.55,'#101610');grad.addColorStop(1,'#030503');}
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=clean?'rgba(117,212,41,.12)':'rgba(117,212,41,.08)';ctx.beginPath();ctx.arc(W*.85,H*.1,W*.34,0,Math.PI*2);ctx.fill();
  const characterOn=$('#exportCharacter')?.checked;
  const char=characterOn?await loadCanvasImage('assets/characters/character-arms.jpg'):null;
  const logoOn=$('#exportLogo')?.checked!==false;const logo=logoOn?await loadCanvasImage('logo.jpg'):null;
  if(logo){drawRoundRect(ctx,48,42,88,88,20,'#101710','#31402d');drawCover(ctx,logo,48,42,88,88);}
  ctx.fillStyle='#ffffff';ctx.font='900 30px system-ui, sans-serif';ctx.fillText('FAFATRAINING',logoOn?154:48,80);ctx.fillStyle='#75d429';ctx.font='800 18px system-ui, sans-serif';ctx.fillText('CUISINE • NUTRITION',logoOn?154:48,110);
  if(state.export.type==='menu') await drawMenuExport(ctx,W,H,char);
  else await drawRecipeExport(ctx,W,H,char);
  ctx.fillStyle='#75d429';ctx.fillRect(48,H-86,W-96,3);ctx.fillStyle='#ffffff';ctx.font='800 22px system-ui, sans-serif';ctx.fillText('FAFATRAINING',48,H-42);ctx.fillStyle='#aeb8aa';ctx.font='500 18px system-ui, sans-serif';ctx.textAlign='right';ctx.fillText('Cuisine simple • Maison',W-48,H-42);ctx.textAlign='left';
}
async function drawRecipeExport(ctx,W,H,char){
  const r=state.recipes.find(x=>x.id===state.export.id);if(!r)return;
  const recipeImg=await loadCanvasImage(imgSrc(r));
  const top=160;const imageH=state.export.format==='story'?700:state.export.format==='square'?430:520;
  drawRoundRect(ctx,48,top,W-96,imageH,28,'#101710','#31402d');
  if(recipeImg){ctx.save();ctx.beginPath();ctx.roundRect(48,top,W-96,imageH,28);ctx.clip();drawCover(ctx,recipeImg,48,top,W-96,imageH);ctx.restore();ctx.fillStyle='rgba(0,0,0,.30)';ctx.fillRect(48,top,W-96,imageH);}
  else if(char){ctx.save();ctx.beginPath();ctx.roundRect(48,top,W-96,imageH,28);ctx.clip();drawCover(ctx,char,48,top,W-96,imageH);ctx.restore();}
  ctx.fillStyle='#75d429';ctx.font='900 20px system-ui, sans-serif';ctx.fillText(String(r.category||'RECETTE').toUpperCase(),78,top+46);
  ctx.fillStyle='#fff';ctx.font='900 56px system-ui, sans-serif';drawWrapped(ctx,r.name,78,top+110,W-156,62,3);
  const metaY=top+imageH-58;ctx.font='800 20px system-ui, sans-serif';ctx.fillStyle='#fff';ctx.fillText(`⏱ ${totalTime(r)||'—'} min   •   👥 ${r.servings||4}   •   ${supportBadge(r)}`,78,metaY);
  let y=top+imageH+46;
  ctx.fillStyle='#75d429';ctx.font='900 24px system-ui, sans-serif';ctx.fillText('INGRÉDIENTS',48,y);y+=38;
  ctx.fillStyle='#f3f5f0';ctx.font='600 22px system-ui, sans-serif';
  const maxIng=state.export.format==='square'?4:state.export.format==='story'?8:6;
  r.ingredients.slice(0,maxIng).forEach(i=>{const t=`• ${formatQty(Number(i.qty||0))} ${i.unit||''} ${i.name}`;ctx.fillText(ellipsisText(ctx,t,W-120),60,y);y+=34;});
  if(r.ingredients.length>maxIng){ctx.fillStyle='#aeb8aa';ctx.fillText(`+ ${r.ingredients.length-maxIng} autre${r.ingredients.length-maxIng>1?'s':''} ingrédient${r.ingredients.length-maxIng>1?'s':''}`,60,y);y+=34;}
  y+=18;ctx.fillStyle='#75d429';ctx.font='900 24px system-ui, sans-serif';ctx.fillText('PRÉPARATION',48,y);y+=38;ctx.fillStyle='#dce5d9';ctx.font='500 20px system-ui, sans-serif';
  const steps=getSteps(r,'classic').slice(0,state.export.format==='story'?4:3);steps.forEach((st,i)=>{const txt=`${i+1}. ${st.text}`;y=drawWrapped(ctx,txt,60,y,W-120,29,2)+10;});
  if(characterOnExport()&&char&&recipeImg){const cw=state.export.format==='story'?260:210;const ch=cw*(char.height/char.width);ctx.save();ctx.globalAlpha=.94;ctx.drawImage(char,W-cw-28,H-ch-86,cw,ch);ctx.restore();}
}
function characterOnExport(){return !!$('#exportCharacter')?.checked;}
async function drawMenuExport(ctx,W,H,char){
  const m=state.menus.find(x=>x.id===state.export.id);if(!m)return;
  const exportMenuIds=getMenuRecipeIds(m);
  const story=state.export.format==='story';
  let y=180;ctx.fillStyle='#75d429';ctx.font='900 24px system-ui, sans-serif';ctx.fillText('MENU FAFATRAINING',48,y);y+=62;ctx.fillStyle='#fff';ctx.font=`900 ${story?72:62}px system-ui, sans-serif`;y=drawWrapped(ctx,m.title,48,y,W-(characterOnExport()?390:96),story?78:68,3)+24;
  ctx.fillStyle='#aeb8aa';ctx.font='500 22px system-ui, sans-serif';y=drawWrapped(ctx,m.subtitle||'Menu complet FAFATRAINING.',48,y,W-(characterOnExport()?370:96),32,3)+34;
  if(characterOnExport()&&char){const cw=story?390:310;const ch=cw*(char.height/char.width);ctx.save();ctx.globalAlpha=.97;ctx.drawImage(char,W-cw-30,130,cw,ch);ctx.restore();}
  const labels=(m.slotLabels||['Entrée','Plat','Dessert']).map(x=>String(x).toUpperCase());
  const cardH=story?225:145, gap=story?22:20;
  exportMenuIds.slice(0,3).forEach((id,i)=>{const r=state.recipes.find(x=>x.id===id);if(!r)return;drawRoundRect(ctx,48,y,W-96,cardH,24,'#101710','#2f3d2b');ctx.fillStyle='#75d429';ctx.font='900 20px system-ui, sans-serif';ctx.fillText(labels[i]||'RECETTE',76,y+42);ctx.fillStyle='#fff';ctx.font=`800 ${story?32:27}px system-ui, sans-serif`;drawWrapped(ctx,r.name,76,y+88,W-152,story?39:32,story?3:2);ctx.fillStyle='#aeb8aa';ctx.font='500 18px system-ui, sans-serif';ctx.fillText(`${totalTime(r)||'—'} min • ${supportBadge(r)}`,76,y+cardH-30);y+=cardH+gap;});
  if(story){
    y+=20;drawRoundRect(ctx,48,y,W-96,200,26,'rgba(117,212,41,.10)','#4b6a3e');ctx.fillStyle='#75d429';ctx.font='900 28px system-ui, sans-serif';ctx.fillText('TON MENU EST PRÊT À CUISINER',76,y+54);ctx.fillStyle='#ffffff';ctx.font='700 23px system-ui, sans-serif';drawWrapped(ctx,'Ouvre le menu dans l’application, choisis ton mode de préparation et ajoute les 3 recettes aux courses en un geste.',76,y+98,W-152,34,3);y+=240;
    ctx.fillStyle='#75d429';ctx.font='900 22px system-ui, sans-serif';ctx.fillText('3 RECETTES • 1 MENU • FAFATRAINING',48,y);
  }else{
    y+=18;ctx.fillStyle='#75d429';ctx.font='900 22px system-ui, sans-serif';ctx.fillText('À FAIRE CHEZ TOI',48,y);ctx.fillStyle='#dce5d9';ctx.font='500 20px system-ui, sans-serif';drawWrapped(ctx,'Suis le pas-à-pas dans l’application avec les ustensiles et appareils réellement indiqués pour cette recette.',48,y+38,W-96,30,4);
  }
}

function exportFileName(){
  const obj=state.export.type==='menu'?state.menus.find(x=>x.id===state.export.id):state.recipes.find(x=>x.id===state.export.id);
  return `fafatraining-${slug(obj?.title||obj?.name||'visuel')}-${state.export.format}.png`;
}
function exportBlob(){return new Promise(resolve=>$('#exportCanvas').toBlob(resolve,'image/png',1));}
async function downloadExportImage(){
  await renderExportCanvas();const blob=await exportBlob();if(!blob)return toast('Export impossible');const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=exportFileName();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Image PNG créée');
}
async function shareExportImage(){
  await renderExportCanvas();const blob=await exportBlob();if(!blob)return toast('Export impossible');const file=new File([blob],exportFileName(),{type:'image/png'});if(navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({files:[file],title:'FAFATRAINING'});return}catch(e){if(e?.name==='AbortError')return;}}toast('Le partage direct n’est pas disponible ici. Utilise “Télécharger le PNG”.');
}

init();
