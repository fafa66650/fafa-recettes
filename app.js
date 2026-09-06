const STORAGE_KEY='fafatraining-recettes-v13';
const DEFAULT_PREFS={mode:'tm6',restrictions:[],equipment:['TM6','Cuisine classique'],favorites:[],pantry:[],shopping:[],shoppingDone:[],lastPage:'home',recentCategories:[],recentRecipes:[]};
const state={
  recipes:[],menus:[],
  prefs:{...DEFAULT_PREFS},
  filters:{query:'',category:'',subtype:'',time:'',equipment:'',style:'',favoritesOnly:false,fridgeOnly:false},
  visible:48,
  currentRecipe:null,
  currentServings:4,
  currentDrawerMode:'tm6',
  homeFeaturedKey:'all',
  menuFilter:'',
  pageHistory:[],
  export:{type:null,id:null,format:'portrait',style:'social'},
  cook:{recipe:null,steps:[],index:0,timerLeft:0,timerInitial:0,timerId:null}
};

const MODE_META={
  tm6:{short:'TM6',title:'TM6',desc:'Thermomix TM6 : bol, Varoma, sens inverse, cuisson guidée.'},
  classic:{short:'Ustensiles & four',title:'Casserole · poêle · four',desc:'Casserole, poêle, four, faitout, sauteuse et ustensiles du quotidien.'},
  robot:{short:'Robots & appareils',title:'Autre robot / appareil',desc:'Air fryer, blender, Cookeo, multicuiseur, robot cuiseur, mixeur…'}
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
const allergenLabels={gluten:'gluten',lactose:'lactose',oeufs:'œufs',fruits_a_coque:'fruits à coque',soja:'soja',poisson:'poisson',crustaces:'crustacés',arachides:'arachides'};
const restrictionOptions=[['gluten','Sans gluten'],['lactose','Sans lactose'],['oeufs','Sans œufs'],['fruits_a_coque','Sans fruits à coque'],['soja','Sans soja'],['poisson','Sans poisson'],['crustaces','Sans crustacés']];
const equipmentOptions=['TM6','Cuisine classique','Four','Poêle','Blender / mixeur','Air fryer'];
const equipmentDisplay={'Cuisine classique':'Ustensiles & four'};
const categoryIcon={
  'Boissons & smoothies':'🥤','Petit-déjeuner':'🥣','Entrées & salades':'🥗','Poulet & volaille':'🍗','Viandes':'🥩','Poissons & fruits de mer':'🐟','Végétarien':'🌿','Pâtes, riz & céréales':'🍝','Soupes & veloutés':'🍲','Four & gratins':'🔥','Desserts':'🍰','Collations':'🍎','Sauces & bases':'🥣','Repas protéinés':'💪','Recettes légères':'🥗','Batch cooking':'📦'
};

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const escapeHtml=(s='')=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const uniq=a=>[...new Set(a)];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const slug=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const imgSrc=r=>r.image?String(r.image).replace(/^\//,''):'';
const totalTime=r=>(Number(r.prepMin)||0)+(Number(r.cookMin)||0);
const modeLabel=m=>MODE_META[m]?.title||'Autre appareil';
const isMainCourseCategory=cat=>['Poulet & volaille','Viandes','Poissons & fruits de mer','Végétarien','Pâtes, riz & céréales','Four & gratins','Repas protéinés','Recettes légères','Batch cooking'].includes(cat);

function loadPrefs(){
  try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');state.prefs={...DEFAULT_PREFS,...x};}
  catch{state.prefs={...DEFAULT_PREFS};}
  state.prefs.shopping=(state.prefs.shopping||[]).map(x=>typeof x==='string'?{id:x,servings:null}:x).filter(Boolean);
}
function savePrefs(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.prefs));}catch{}}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),1800);}

async function init(){
  loadPrefs();
  try{
    const [rr,mr]=await Promise.all([fetch('recipes.json'),fetch('menus.json')]);
    state.recipes=await rr.json();
    state.menus=await mr.json();
  }catch(e){
    document.body.innerHTML='<div style="padding:30px;color:white;font-family:sans-serif">Impossible de charger les données. Ouvre l’application via un petit serveur web ou depuis son hébergement PWA.</div>';
    return;
  }
  buildStaticUI();
  bindEvents();
  applyModeButtons();
  renderAll();
  navigate(state.prefs.lastPage && ['home','recipes','menus','fridge','shopping'].includes(state.prefs.lastPage)?state.prefs.lastPage:'home',false,false);
}

function buildStaticUI(){
  $('#homeRecipeCount')?.replaceChildren(document.createTextNode(state.recipes.length));
  $('#homeMenuCount')?.replaceChildren(document.createTextNode(state.menus.length));
  $('#homeCategoryCount')?.replaceChildren(document.createTextNode(uniq(state.recipes.map(r=>r.category)).length));

  $('#heroModeButtons').innerHTML=Object.entries(MODE_META).map(([k,v])=>`<button class="mode-card mode-${k}" data-mode="${k}"><strong>${escapeHtml(v.short)}</strong><small>${escapeHtml(v.desc)}</small></button>`).join('');
  $('#settingsMode').innerHTML=Object.entries(MODE_META).map(([k,v])=>`<button data-mode="${k}">${escapeHtml(v.short)}</button>`).join('');

  const availableStyles=HOME_STYLES.filter(st=>state.recipes.some(r=>(r.styles||[]).includes(st)));
  $('#recipeStyleChips').innerHTML=['Toutes',...availableStyles].map((st,i)=>`<button class="style-chip ${i===0?'active':''}" data-recipe-style="${i===0?'':escapeHtml(st)}">${escapeHtml(st)}</button>`).join('');
  $('#homeFeaturedFilters').innerHTML=HOME_FEATURED_FILTERS.map((f,i)=>`<button class="style-chip ${i===0?'active':''}" data-featured-key="${escapeHtml(f.key)}">${escapeHtml(f.label)}</button>`).join('');

  $('#categoryFilter').innerHTML='<option value="">Toutes les catégories</option>'+uniq(state.recipes.map(r=>r.category)).sort((a,b)=>a.localeCompare(b,'fr')).map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  $('#restrictionChips').innerHTML=restrictionOptions.map(([k,l])=>`<button class="restriction-chip ${state.prefs.restrictions.includes(k)?'active':''}" data-restriction="${k}">${l}</button>`).join('');
  $('#equipmentChips').innerHTML=equipmentOptions.map(e=>`<button class="restriction-chip ${state.prefs.equipment.includes(e)?'active':''}" data-pref-equipment="${escapeHtml(e)}">${escapeHtml(equipmentDisplay[e]||e)}</button>`).join('');

  const menuTags=uniq(state.menus.flatMap(m=>(m.tags||[]).slice(1))).filter(Boolean).slice(0,10);
  $('#menuFilterChips').innerHTML=['Tous',...menuTags].map((t,i)=>`<button class="style-chip ${i===0?'active':''}" data-menu-filter="${i===0?'':escapeHtml(t)}">${escapeHtml(t)}</button>`).join('');
}

function bindEvents(){
  $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));
  $('#topBackBtn').onclick=goBack;

  $('#homeSearchBtn').onclick=()=>{
    state.filters.query=$('#homeSearch').value.trim();
    $('#recipeSearch').value=state.filters.query;
    navigate('recipes'); renderRecipes(true);
  };
  $('#homeSearch').addEventListener('keydown',e=>{if(e.key==='Enter')$('#homeSearchBtn').click();});
  $('#recipeSearch').addEventListener('input',e=>{state.filters.query=e.target.value.trim();renderRecipes(true);});

  $('#openAdvancedFiltersBtn').onclick=()=>openFilterDrawer(true);
  $('#applyFiltersBtn').onclick=()=>{openFilterDrawer(false);renderRecipes(true);};
  $$('[data-close-filter]').forEach(x=>x.onclick=()=>openFilterDrawer(false));
  $('#categoryFilter').onchange=e=>{state.filters.category=e.target.value;state.filters.subtype='';renderSubCategoryChips();renderRecipes(true);};
  $('#timeFilter').onchange=e=>{state.filters.time=e.target.value;renderRecipes(true);};
  $('#equipmentFilter').onchange=e=>{state.filters.equipment=e.target.value;renderRecipes(true);};
  $('#favoritesOnly').onchange=e=>{state.filters.favoritesOnly=e.target.checked;renderRecipes(true);};
  $('#resetFiltersBtn').onclick=resetFilters;
  $('#loadMoreBtn').onclick=()=>{state.visible+=48;renderRecipes();};

  $('#favoriteTopBtn').onclick=()=>{state.filters.favoritesOnly=true;$('#favoritesOnly').checked=true;navigate('recipes');renderRecipes(true);};
  $('#openFavoritesBtn').onclick=$('#favoriteTopBtn').onclick;
  $('#surpriseTopBtn').onclick=()=>{navigate('home');setTimeout(generateSurprise,50);};
  $('#surpriseBtn').onclick=generateSurprise;

  $('#settingsBtn').onclick=()=>openSettings(true);
  $$('[data-close-settings]').forEach(x=>x.onclick=()=>openSettings(false));
  $$('[data-close-drawer]').forEach(x=>x.onclick=closeRecipe);
  $$('[data-close-menu]').forEach(x=>x.onclick=closeMenuDrawer);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeRecipe();closeMenuDrawer();openFilterDrawer(false);openSettings(false);closeExport();closeCook();}});

  $('#clearFridgeBtn').onclick=()=>{state.prefs.pantry=[];savePrefs();renderPantry();renderFridgeResults();toast('Mon frigo est vide');};
  $('#fridgeSearch').addEventListener('input',renderPantry);
  $('#copyShoppingBtn').onclick=copyShopping;
  $('#clearShoppingBtn').onclick=()=>{if(!state.prefs.shopping.length)return;state.prefs.shopping=[];state.prefs.shoppingDone=[];savePrefs();renderShopping();toast('Liste vidée');};
  $('#resetPrefsBtn').onclick=()=>{state.prefs={...DEFAULT_PREFS,favorites:state.prefs.favorites,shopping:state.prefs.shopping,shoppingDone:state.prefs.shoppingDone,pantry:state.prefs.pantry};savePrefs();buildStaticUI();bindDynamicUI();applyModeButtons();renderAll();toast('Préférences réinitialisées');};

  $('#closeCookBtn').onclick=closeCook;
  $('#cookPrevBtn').onclick=()=>moveCook(-1);
  $('#cookNextBtn').onclick=()=>moveCook(1);
  $('#cookTimerBtn').onclick=toggleTimerPanel;
  $('#timerToggleBtn').onclick=toggleTimer;
  $('#timerResetBtn').onclick=resetTimer;

  $$('[data-close-export]').forEach(x=>x.onclick=closeExport);
  $('#downloadExportBtn').onclick=downloadExportImage;
  $('#shareExportBtn').onclick=shareExportImage;
  $('#exportCharacter').onchange=renderExportCanvas;
  $$('[data-export-format]').forEach(b=>b.onclick=()=>{state.export.format=b.dataset.exportFormat;$$('[data-export-format]').forEach(x=>x.classList.toggle('active',x===b));renderExportCanvas();});
  $$('[data-export-style]').forEach(b=>b.onclick=()=>{state.export.style=b.dataset.exportStyle;$$('[data-export-style]').forEach(x=>x.classList.toggle('active',x===b));renderExportCanvas();});

  bindDynamicUI();
}

function bindDynamicUI(){
  $$('[data-mode]').forEach(b=>b.onclick=()=>setPreferredMode(b.dataset.mode));
  $$('[data-recipe-style]').forEach(b=>b.onclick=()=>{state.filters.style=b.dataset.recipeStyle;$$('[data-recipe-style]').forEach(x=>x.classList.toggle('active',x===b));renderRecipes(true);});
  $$('[data-featured-key]').forEach(b=>b.onclick=()=>{state.homeFeaturedKey=b.dataset.featuredKey;$$('[data-featured-key]').forEach(x=>x.classList.toggle('active',x===b));renderHome();});
  $$('[data-restriction]').forEach(b=>b.onclick=()=>{const k=b.dataset.restriction;const a=state.prefs.restrictions;state.prefs.restrictions=a.includes(k)?a.filter(x=>x!==k):[...a,k];savePrefs();b.classList.toggle('active');renderAll();});
  $$('[data-pref-equipment]').forEach(b=>b.onclick=()=>{const k=b.dataset.prefEquipment;const a=state.prefs.equipment;state.prefs.equipment=a.includes(k)?a.filter(x=>x!==k):[...a,k];savePrefs();b.classList.toggle('active');});
  $$('[data-quick-category]').forEach(b=>b.onclick=()=>{resetFilters(false);state.filters.category=b.dataset.quickCategory;$('#categoryFilter').value=state.filters.category;navigate('recipes');renderRecipes(true);});
  $$('[data-quick-time]').forEach(b=>b.onclick=()=>{resetFilters(false);state.filters.time=b.dataset.quickTime;$('#timeFilter').value=state.filters.time;navigate('recipes');renderRecipes(true);});
  $$('[data-quick-protein]').forEach(b=>b.onclick=()=>{resetFilters(false);state.filters.style='Cuisine protéinée';navigate('recipes');renderRecipes(true);});
  $$('[data-home-style]').forEach(b=>b.onclick=()=>{resetFilters(false);state.filters.style=b.dataset.homeStyle;navigate('recipes');renderRecipes(true);});
  $$('[data-menu-filter]').forEach(b=>b.onclick=()=>{state.menuFilter=b.dataset.menuFilter;$$('[data-menu-filter]').forEach(x=>x.classList.toggle('active',x===b));renderMenus();});
  $$('[data-qfilter]').forEach(b=>b.onclick=()=>applyQuickFilter(b.dataset.qfilter,b));
}

function navigate(page,scroll=true,push=true){
  const current=$('.page.active')?.dataset.page||'home';
  if(push && current!==page) state.pageHistory.push(current);
  $$('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===page));
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));
  state.prefs.lastPage=page; savePrefs();
  $('#topBackBtn').classList.toggle('hidden',page==='home' && state.pageHistory.length===0);
  if(scroll) window.scrollTo({top:0,behavior:'smooth'});
  if(page==='fridge') renderFridgeResults();
  if(page==='shopping') renderShopping();
}
function goBack(){
  if($('#cookMode').classList.contains('open')) return closeCook();
  if($('#recipeDrawer').classList.contains('open')) return closeRecipe();
  if($('#menuDrawer').classList.contains('open')) return closeMenuDrawer();
  if($('#filterDrawer').classList.contains('open')) return openFilterDrawer(false);
  const prev=state.pageHistory.pop()||'home';
  navigate(prev,true,false);
}

function setPreferredMode(mode){state.prefs.mode=mode;state.currentDrawerMode=mode;savePrefs();applyModeButtons();if(state.currentRecipe)openRecipe(state.currentRecipe.id,false);toast(`Mode : ${MODE_META[mode]?.short||mode}`);}
function applyModeButtons(){$$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.prefs.mode));}
function openSettings(open){$('#settingsDrawer').classList.toggle('open',open);$('#settingsDrawer').setAttribute('aria-hidden',String(!open));}

function openFilterDrawer(open){
  $('#filterDrawer').classList.toggle('open',open);
  $('#filterDrawer').setAttribute('aria-hidden',String(!open));
  if(open)document.body.style.overflow='hidden';else if(!$('#recipeDrawer').classList.contains('open')&&!$('#menuDrawer').classList.contains('open'))document.body.style.overflow='';
}
function applyQuickFilter(type,btn){
  if(type==='time20'){state.filters.time=state.filters.time==='20'?'':'20';$('#timeFilter').value=state.filters.time;}
  if(type==='mode'){
    const eq=state.prefs.mode==='tm6'?'TM6':state.prefs.mode==='classic'?'Cuisine classique':'';
    state.filters.equipment=state.filters.equipment===eq?'':eq;$('#equipmentFilter').value=state.filters.equipment;
  }
  if(type==='easy'){state.filters.style=state.filters.style==='Cuisine facile'?'':'Cuisine facile';}
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
  if(state.filters.time)a.push(`≤ ${state.filters.time} min`);
  if(state.filters.equipment)a.push(equipmentDisplay[state.filters.equipment]||state.filters.equipment);
  if(state.filters.style)a.push(state.filters.style);
  if(state.filters.favoritesOnly)a.push('Favoris');
  if(state.filters.fridgeOnly)a.push('Avec mon frigo');
  return a;
}
function renderActiveFilterSummary(){
  const el=$('#activeFilterSummary');if(!el)return;
  const labels=activeFilterLabels();
  el.classList.toggle('hidden',!labels.length);
  el.innerHTML=labels.length?`<strong>Filtres actifs :</strong> ${labels.map(x=>`<span>${escapeHtml(x)}</span>`).join('')} <button id="clearInlineFilters">Tout effacer</button>`:'';
  if($('#clearInlineFilters'))$('#clearInlineFilters').onclick=()=>resetFilters();
  $$('[data-qfilter]').forEach(b=>{
    const t=b.dataset.qfilter;
    let active=false;
    if(t==='time20')active=state.filters.time==='20';
    if(t==='mode')active=Boolean(state.filters.equipment);
    if(t==='easy')active=state.filters.style==='Cuisine facile';
    if(t==='fridge')active=Boolean(state.filters.fridgeOnly);
    b.classList.toggle('active',active);
  });
}

function passesRestrictions(r){return !state.prefs.restrictions.some(a=>(r.allergens||[]).includes(a));}
function recipeHay(r){return norm([r.name,r.category,r.description,(r.tags||[]).join(' '),(r.styles||[]).join(' '),(r.equipment||[]).join(' '),r.ingredients.map(i=>i.name).join(' ')].join(' '));}
function recipeSubtype(r){
  const h=recipeHay(r);
  if(r.category==='Boissons & smoothies'){
    if(/lait vegetal|lait d.amande|lait de noisette|lait de cajou/.test(h))return'Laits végétaux';
    if(/eau de coco|eau energie|eau citron|eau fraise|eau pasteque|eau aromatisee|hydratation/.test(h))return'Eaux & hydratation';
    if(/proteine|proteinee/.test(h))return'Boissons protéinées';
    if(/matcha|latte|chai|chocolat chaud|infusion|lait d.or|boisson chaude/.test(h))return'Chaudes & latte';
    if(/cafe|energie/.test(h))return'Café & énergie';
    return'Smoothies & fruits';
  }
  if(r.category==='Petit-déjeuner'){
    if(/pancake|crepe/.test(h))return'Pancakes & crêpes';
    if(/porridge|overnight|avoine|semoule/.test(h))return'Porridges & oats';
    if(/oeuf|ufs |omelette|croque|tartine/.test(h))return'Salé';
    return'Bowls & frais';
  }
  if(r.category==='Desserts'){
    if(/compote/.test(h))return'Compotes & fruits';
    if(/muffin|cake|gateau|banana bread|brownie|tarte|crumble|clafoutis/.test(h))return'Gâteaux & four';
    if(/flan|creme|mousse|panna|riz au lait|semoule au lait/.test(h))return'Crèmes & desserts doux';
    return'Frais & glacé';
  }
  if(r.category==='Poissons & fruits de mer'){
    if(/crevette|moule/.test(h))return'Fruits de mer';
    if(/saumon/.test(h))return'Saumon';
    if(/thon/.test(h))return'Thon';
    return'Poissons blancs & autres';
  }
  if(r.category==='Poulet & volaille'){
    if(/dinde/.test(h))return'Dinde';
    if(/four|gratin/.test(h))return'Au four';
    return'Poulet à la poêle / mijoté';
  }
  return'';
}
function renderSubCategoryChips(){
  const panel=$('#subCategoryPanel'),box=$('#subCategoryChips');
  if(!panel||!box)return;
  const cat=state.filters.category;
  if(!cat){panel.classList.add('hidden');box.innerHTML='';return;}
  const opts=uniq(state.recipes.filter(r=>r.category===cat).map(recipeSubtype).filter(Boolean));
  if(opts.length<2){panel.classList.add('hidden');box.innerHTML='';state.filters.subtype='';return;}
  if(state.filters.subtype&&!opts.includes(state.filters.subtype))state.filters.subtype='';
  panel.classList.remove('hidden');
  box.innerHTML=['',...opts].map((x,i)=>`<button class="style-chip ${state.filters.subtype===x?'active':''}" data-subtype="${escapeHtml(x)}">${i===0?'Tous les types':escapeHtml(x)}</button>`).join('');
  box.querySelectorAll('[data-subtype]').forEach(b=>b.onclick=()=>{state.filters.subtype=b.dataset.subtype;renderRecipes(true);});
}
function filteredRecipes(){
  let arr=state.recipes.filter(passesRestrictions);
  const f=state.filters;
  if(f.query){const q=norm(f.query);arr=arr.filter(r=>recipeHay(r).includes(q));}
  if(f.category)arr=arr.filter(r=>r.category===f.category);
  if(f.subtype)arr=arr.filter(r=>recipeSubtype(r)===f.subtype);
  if(f.time)arr=arr.filter(r=>totalTime(r)<=Number(f.time));
  if(f.equipment)arr=arr.filter(r=>(r.equipment||[]).includes(f.equipment));
  if(f.style)arr=arr.filter(r=>(r.styles||[]).includes(f.style));
  if(f.favoritesOnly)arr=arr.filter(r=>state.prefs.favorites.includes(r.id));
  if(f.fridgeOnly&&state.prefs.pantry.length){const have=new Set(state.prefs.pantry.map(norm));arr=arr.filter(r=>r.ingredients.some(i=>have.has(norm(i.name))));}
  return arr.sort((a,b)=>(Number(b.featured)-Number(a.featured))||a.name.localeCompare(b.name,'fr'));
}
function resetFilters(render=true){state.filters={query:'',category:'',subtype:'',time:'',equipment:'',style:'',favoritesOnly:false,fridgeOnly:false};if($('#recipeSearch'))$('#recipeSearch').value='';if($('#homeSearch'))$('#homeSearch').value='';if($('#categoryFilter'))$('#categoryFilter').value='';if($('#timeFilter'))$('#timeFilter').value='';if($('#equipmentFilter'))$('#equipmentFilter').value='';if($('#favoritesOnly'))$('#favoritesOnly').checked=false;renderSubCategoryChips();$$('[data-recipe-style]').forEach(b=>b.classList.toggle('active',b.dataset.recipeStyle===''));if(render)renderRecipes(true);}

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
  const preferredEq=state.prefs.mode==='tm6'?'TM6':state.prefs.mode==='classic'?'Cuisine classique':'';
  return state.recipes.filter(passesRestrictions).map(r=>{
    let score=0;
    if(favCats.includes(r.category))score+=4;
    if(recentCats.includes(r.category))score+=3;
    if(preferredEq&&(r.equipment||[]).includes(preferredEq))score+=2;
    if((r.styles||[]).includes('Cuisine facile'))score+=1;
    if(r.featured)score+=1;
    if(r.image)score+=1;
    return {r,score};
  }).sort((a,b)=>b.score-a.score||Math.random()-.5).map(x=>x.r).slice(0,4);
}
function generateSurprise(){
  const pool=state.recipes.filter(passesRestrictions).filter(r=>{
    const eq=state.prefs.mode==='tm6'?'TM6':state.prefs.mode==='classic'?'Cuisine classique':'';
    return !eq||(r.equipment||[]).includes(eq);
  });
  const pick=[];const copy=[...pool];
  while(copy.length&&pick.length<3){pick.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]);}
  $('#surpriseGrid').classList.remove('hidden');
  $('#surpriseGrid').innerHTML=pick.map(recipeCard).join('');
  bindRecipeCards($('#surpriseGrid'));
  $('#surpriseGrid').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderHome(){
  const forYou=personalizedRecipes();
  $('#forYouGrid').innerHTML=forYou.map(recipeCard).join('');
  bindRecipeCards($('#forYouGrid'));

  const featured=homeFeaturedRecipes();
  $('#featuredGrid').innerHTML=featured.map(recipeCard).join('');
  bindRecipeCards($('#featuredGrid'));

  const counts={};
  state.recipes.filter(passesRestrictions).forEach(r=>counts[r.category]=(counts[r.category]||0)+1);
  const sortedCats=Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'fr')).slice(0,10);
  $('#homeCategories').innerHTML=sortedCats.map(([c,n])=>`<button class="category-card" data-home-cat="${escapeHtml(c)}"><span>${categoryIcon[c]||'🍽️'}</span><strong>${escapeHtml(c)}</strong><small>${n} recettes</small></button>`).join('');
  $$('[data-home-cat]').forEach(b=>b.onclick=()=>{resetFilters(false);state.filters.category=b.dataset.homeCat;$('#categoryFilter').value=state.filters.category;navigate('recipes');renderRecipes(true);});

  $('#homeMenus').innerHTML=state.menus.slice(0,6).map(menuCard).join('');
  bindMenuCards($('#homeMenus'));

  const fav=state.recipes.filter(r=>state.prefs.favorites.includes(r.id)).slice(0,4);
  $('#homeFavoritesSection').classList.toggle('hidden',!fav.length);
  $('#homeFavorites').innerHTML=fav.map(recipeCard).join('');
  bindRecipeCards($('#homeFavorites'));
}

function supportBadge(r){
  if((r.equipment||[]).includes('TM6') && (r.equipment||[]).includes('Cuisine classique')) return 'TM6 + ustensiles';
  if((r.equipment||[]).includes('TM6')) return 'TM6';
  if((r.equipment||[]).includes('Cuisine classique')) return 'Ustensiles & four';
  return (r.equipment||[])[0]||'Polyvalent';
}

function recipeCard(r,extra=''){
  const fav=state.prefs.favorites.includes(r.id);
  const image=imgSrc(r);
  const times=totalTime(r);
  return `<article class="recipe-card" ${extra}><div class="recipe-image ${image?'':'no-image'}">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(r.name)}" loading="lazy">`:`<span>${r.emoji||categoryIcon[r.category]||'🍽️'}</span>`}<button class="fav-btn ${fav?'active':''}" data-fav="${r.id}" aria-label="Favori">${fav?'♥':'♡'}</button></div><div class="recipe-body"><span class="recipe-category-line">${escapeHtml(r.category)}</span><h3 class="recipe-title">${escapeHtml(r.name)}</h3><div class="recipe-meta recipe-meta-simple"><span>⏱ ${times||'—'} min</span><span>${escapeHtml(supportBadge(r))}</span>${r.macros?.proteines?`<span>💪 ${escapeHtml(r.macros.proteines)} g</span>`:''}</div><div class="card-actions"><button class="open-btn" data-open="${r.id}">Voir la recette</button><button class="shop-btn icon-shop" data-shop="${r.id}" aria-label="Ajouter aux courses">＋</button></div></div></article>`;
}

function bindRecipeCards(root=document){
  root.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openRecipe(b.dataset.open));
  root.querySelectorAll('[data-shop]').forEach(b=>b.onclick=()=>addToShopping(b.dataset.shop));
  root.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFavorite(b.dataset.fav);});
}
function renderRecipes(resetVisible=false){
  renderSubCategoryChips();
  renderActiveFilterSummary();
  if(resetVisible) state.visible=48;
  const arr=filteredRecipes();
  $('#recipesCountLabel').textContent=`${arr.length} recette${arr.length>1?'s':''} trouvée${arr.length>1?'s':''}`;
  $('#recipesGrid').innerHTML=arr.slice(0,state.visible).map(recipeCard).join('');
  bindRecipeCards($('#recipesGrid'));
  $('#loadMoreBtn').classList.toggle('hidden',state.visible>=arr.length);
}

function toggleFavorite(id){
  const a=state.prefs.favorites;
  state.prefs.favorites=a.includes(id)?a.filter(x=>x!==id):[...a,id];
  savePrefs();
  renderHome(); renderRecipes();
  if(state.currentRecipe&&state.currentRecipe.id===id) openRecipe(id,false);
  toast(state.prefs.favorites.includes(id)?'Ajouté aux favoris':'Retiré des favoris');
}

function menuCard(m){
  const rs=m.recipes.map(id=>state.recipes.find(r=>r.id===id)).filter(Boolean);
  return `<article class="menu-card"><span class="kicker">${escapeHtml((m.tags||[])[1]||'MENU')}</span><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.subtitle||'')}</p><div class="menu-list">${rs.map((r,i)=>`<div><span>${i+1}</span><small><strong>${i===0?'Entrée':i===1?'Plat':'Dessert'}</strong><br>${escapeHtml(r.name)}</small></div>`).join('')}</div><div class="menu-actions"><button class="primary" data-open-menu="${m.id}">Voir le menu</button><button data-export-menu="${m.id}">Image</button></div></article>`;
}

function renderMenus(){
  let menus=state.menus;
  if(state.menuFilter)menus=menus.filter(m=>(m.tags||[]).includes(state.menuFilter));
  $('#menusGrid').innerHTML=menus.map(menuCard).join('');
  bindMenuCards($('#menusGrid'));
}

function bindMenuCards(root){
  root.querySelectorAll('[data-open-menu]').forEach(b=>b.onclick=()=>openMenuDrawer(b.dataset.openMenu));
  root.querySelectorAll('[data-shop-menu]').forEach(b=>b.onclick=()=>addMenuToShopping(b.dataset.shopMenu));
  root.querySelectorAll('[data-export-menu]').forEach(b=>b.onclick=()=>openExport('menu',b.dataset.exportMenu));
}
function openMenuDrawer(id){
  const m=state.menus.find(x=>x.id===id);if(!m)return;
  const labels=['Entrée','Plat','Dessert'];
  $('#menuDrawerContent').innerHTML=`<div class="menu-detail-head"><span class="kicker">MENU FAFATRAINING</span><h2 id="menuDrawerTitle">${escapeHtml(m.title)}</h2><p>${escapeHtml(m.subtitle||'')}</p><div class="tag-row">${(m.tags||[]).slice(1).map(t=>`<span class="style-tag">${escapeHtml(t)}</span>`).join('')}</div></div><div class="menu-detail-recipes">${m.recipes.map((rid,i)=>{const r=state.recipes.find(x=>x.id===rid);if(!r)return'';return `<article class="menu-recipe-row"><div class="menu-recipe-thumb ${imgSrc(r)?'':'no-image'}">${imgSrc(r)?`<img src="${escapeHtml(imgSrc(r))}" alt="">`:`<span>${categoryIcon[r.category]||'🍽️'}</span>`}</div><div class="menu-recipe-info"><span>${labels[i]||'Recette'}</span><strong>${escapeHtml(r.name)}</strong><small>⏱ ${totalTime(r)||'—'} min · ${escapeHtml(supportBadge(r))}</small></div><div class="menu-recipe-actions"><button data-menu-recipe-open="${rid}">Ouvrir</button><button data-menu-replace="${id}|${i}">Remplacer</button></div></article>`;}).join('')}</div><div class="menu-detail-footer"><button class="primary-btn" data-shop-menu="${m.id}">Ajouter tout aux courses</button><button class="outline-btn" data-export-menu="${m.id}">Exporter l’image</button></div>`;
  $('#menuDrawer').classList.add('open');$('#menuDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  $('#menuDrawerContent').querySelectorAll('[data-menu-recipe-open]').forEach(b=>b.onclick=()=>{closeMenuDrawer();openRecipe(b.dataset.menuRecipeOpen);});
  $('#menuDrawerContent').querySelectorAll('[data-menu-replace]').forEach(b=>b.onclick=()=>{const [mid,idx]=b.dataset.menuReplace.split('|');replaceMenuRecipe(mid,Number(idx));});
  bindMenuCards($('#menuDrawerContent'));
}
function closeMenuDrawer(){const d=$('#menuDrawer');if(!d)return;d.classList.remove('open');d.setAttribute('aria-hidden','true');if(!$('#recipeDrawer').classList.contains('open'))document.body.style.overflow='';}
function replaceMenuRecipe(menuId,index){
  const m=state.menus.find(x=>x.id===menuId);if(!m)return;
  const current=state.recipes.find(r=>r.id===m.recipes[index]);if(!current)return;
  const candidates=state.recipes.filter(passesRestrictions).filter(r=>r.id!==current.id && r.category===current.category);
  const alt=candidates[Math.floor(Math.random()*candidates.length)]||state.recipes.filter(passesRestrictions).find(r=>r.id!==current.id);
  if(!alt)return;
  m.recipes[index]=alt.id;
  openMenuDrawer(menuId);
  toast('Recette remplacée dans ce menu');
}

function addMenuToShopping(id){
  const m=state.menus.find(x=>x.id===id); if(!m) return;
  m.recipes.forEach(rid=>{const r=state.recipes.find(x=>x.id===rid); if(r&&!state.prefs.shopping.some(x=>x.id===rid)) state.prefs.shopping.push({id:rid,servings:r.servings||4});});
  savePrefs(); renderShopping(); toast('Menu ajouté aux courses');
}

function getSteps(r,mode){
  if(mode==='tm6') return r.modes?.tm6||r.modes?.classic||[];
  if(mode==='classic') return r.modes?.classic||r.modes?.tm6||[];
  const base=r.modes?.classic||r.modes?.tm6||[];
  return [{title:'Adapter à ton appareil',text:'Utilise les fonctions équivalentes de ton robot ou multicuiseur pour hacher, mélanger ou chauffer. Pour saisir, griller ou dorer, une poêle ou un four peut rester nécessaire selon la recette.',durationSec:60},...base];
}
function openRecipe(id,open=true){
  const r=state.recipes.find(x=>x.id===id);if(!r)return;
  state.currentRecipe=r;
  if(open){
    state.currentServings=r.servings||4;
    state.currentDrawerMode=state.prefs.mode;
    state.prefs.recentCategories=[r.category,...(state.prefs.recentCategories||[]).filter(x=>x!==r.category)].slice(0,5);
    state.prefs.recentRecipes=[r.id,...(state.prefs.recentRecipes||[]).filter(x=>x!==r.id)].slice(0,12);
    savePrefs();
  }
  const factor=state.currentServings/(r.servings||1);
  const steps=getSteps(r,state.currentDrawerMode);
  const image=imgSrc(r);
  const fav=state.prefs.favorites.includes(r.id);
  const allergens=(r.allergens||[]).map(a=>allergenLabels[a]||a.replaceAll('_',' '));
  const modeText=state.currentDrawerMode==='tm6'?'Thermomix TM6':state.currentDrawerMode==='classic'?'casserole, poêle, four et ustensiles':'robot ou appareil équivalent';
  $('#drawerContent').innerHTML=`
    <div class="drawer-hero cooking-first-hero">
      <div class="drawer-cover">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(r.name)}">`:`<span>${r.emoji||'🍽️'}</span>`}</div>
      <div class="drawer-head">
        <span class="kicker">${escapeHtml(r.category)}</span>
        <h2 id="drawerTitle">${escapeHtml(r.name)}</h2>
        <div class="drawer-meta primary-meta"><span>⏱ ${totalTime(r)||'—'} min</span><span>👥 ${state.currentServings} pers.</span><span>${escapeHtml(supportBadge(r))}</span></div>
        <p>${escapeHtml(r.description||'')}</p>
        <div class="drawer-actions main-cook-actions"><button class="primary big-cook-btn" id="startCookBtn">▶ Commencer à cuisiner</button><button id="drawerShopBtn">+ Courses</button><button id="drawerFavBtn">${fav?'♥ Favori':'♡ Favori'}</button><button id="drawerExportBtn">Image réseaux</button></div>
      </div>
    </div>
    <div class="mode-row mode-choice-box"><span class="kicker">JE CUISINE AVEC</span><div class="segmented" id="drawerModes"><button data-drawer-mode="tm6" class="${state.currentDrawerMode==='tm6'?'active':''}">TM6</button><button data-drawer-mode="classic" class="${state.currentDrawerMode==='classic'?'active':''}">Ustensiles & four</button><button data-drawer-mode="robot" class="${state.currentDrawerMode==='robot'?'active':''}">Robots & appareils</button></div><p class="small-note">Les étapes ci-dessous sont adaptées pour ${escapeHtml(modeText)}.</p></div>
    <div class="drawer-grid">
      <section class="drawer-section ingredients-main"><div class="section-title-row"><div><span class="kicker">AVANT DE COMMENCER</span><h3>Ingrédients</h3></div><div class="servings-box"><button id="servMinus">−</button><strong>${state.currentServings}</strong><button id="servPlus">+</button></div></div><div class="ingredient-list checklist">${r.ingredients.map((i,idx)=>`<label class="ingredient-check"><input type="checkbox"><span>${escapeHtml(i.name)}</span><strong>${formatQty(Number(i.qty||0)*factor)} ${escapeHtml(i.unit||'')}</strong></label>`).join('')}</div></section>
      <section class="drawer-section"><span class="kicker">REPÈRES</span><h3>Nutrition</h3><div class="ingredient-list"><div class="ingredient-row"><span>Calories</span><span>≈ ${r.macros?.kcal||'—'} kcal</span></div><div class="ingredient-row"><span>Protéines</span><span>≈ ${r.macros?.proteines||'—'} g</span></div><div class="ingredient-row"><span>Glucides</span><span>≈ ${r.macros?.glucides||'—'} g</span></div><div class="ingredient-row"><span>Lipides</span><span>≈ ${r.macros?.lipides||'—'} g</span></div></div><p class="small-note">${escapeHtml(r.nutritionBasis||'Valeurs indicatives')}</p>${allergens.length?`<div class="allergen-box"><strong>Contient / peut contenir :</strong> ${escapeHtml(allergens.join(', '))}</div>`:''}</section>
      <section class="drawer-section full-width-section"><span class="kicker">APERÇU</span><h3>Les étapes</h3><div class="steps-list compact-steps">${steps.map((st,i)=>`<div class="step-box"><strong>${i+1}. ${escapeHtml(st.title||'Étape')}</strong><p>${escapeHtml(st.text||'')}</p>${st.durationSec?`<small>⏱ ${Math.max(1,Math.round(st.durationSec/60))} min</small>`:''}</div>`).join('')}</div></section>
      <section class="drawer-section full-width-section"><span class="kicker">ASTUCES</span><h3>Conseils & adaptations</h3><div class="steps-list">${(r.tips||[]).map(t=>`<div class="step-box"><p>${escapeHtml(t)}</p></div>`).join('')}${(r.substitutions||[]).slice(0,6).map(t=>`<div class="step-box"><p>↔ ${escapeHtml(t)}</p></div>`).join('')}</div></section>
    </div>`;
  $('#drawerModes').querySelectorAll('[data-drawer-mode]').forEach(b=>b.onclick=()=>{state.currentDrawerMode=b.dataset.drawerMode;openRecipe(r.id,false);});
  $('#servMinus').onclick=()=>{if(state.currentServings>1){state.currentServings--;openRecipe(r.id,false);}};
  $('#servPlus').onclick=()=>{if(state.currentServings<12){state.currentServings++;openRecipe(r.id,false);}};
  $('#drawerShopBtn').onclick=()=>addToShopping(r.id,state.currentServings);
  $('#drawerExportBtn').onclick=()=>openExport('recipe',r.id);
  $('#drawerFavBtn').onclick=()=>toggleFavorite(r.id);
  $('#startCookBtn').onclick=()=>startCook(r,state.currentDrawerMode);
  if(open){$('#recipeDrawer').classList.add('open');$('#recipeDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
}

function closeRecipe(){ $('#recipeDrawer').classList.remove('open'); $('#recipeDrawer').setAttribute('aria-hidden','true'); if(!$('#cookMode').classList.contains('open')) document.body.style.overflow=''; }
function formatQty(n){ if(!Number.isFinite(n)) return ''; if(Math.abs(n-Math.round(n))<.01) return String(Math.round(n)); return String(Math.round(n*10)/10).replace('.',','); }

function pantryIngredients(){const count=new Map();state.recipes.forEach(r=>r.ingredients.forEach(i=>count.set(i.name,(count.get(i.name)||0)+1)));return [...count.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'fr')).map(x=>x[0]);}
function renderPantry(){const q=norm($('#fridgeSearch')?.value||'');const list=pantryIngredients().filter(x=>!q||norm(x).includes(q)).slice(0,180);$('#pantryCloud').innerHTML=list.map(n=>`<button class="pantry-btn ${state.prefs.pantry.includes(n)?'selected':''}" data-pantry="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join('');$('#selectedPantry').innerHTML=state.prefs.pantry.map(n=>`<button class="selected-pill" data-pantry="${escapeHtml(n)}">${escapeHtml(n)} ×</button>`).join('')||'<span class="small-note">Aucun ingrédient sélectionné.</span>';$$('[data-pantry]').forEach(b=>b.onclick=()=>togglePantry(b.dataset.pantry));}
function togglePantry(n){const a=state.prefs.pantry;state.prefs.pantry=a.includes(n)?a.filter(x=>x!==n):[...a,n];savePrefs();renderPantry();renderFridgeResults();}
function renderFridgeResults(){const sel=state.prefs.pantry;if(!sel.length){$('#fridgeResultTitle').textContent='Ajoute quelques ingrédients';$('#fridgeResults').innerHTML='<div class="shopping-empty">Choisis ce que tu as déjà chez toi pour obtenir des idées.</div>';return;}const selected=new Set(sel.map(norm));const scored=state.recipes.filter(passesRestrictions).map(r=>{const names=r.ingredients.map(i=>norm(i.name));const hits=names.filter(n=>selected.has(n)).length;const ratio=names.length?hits/names.length:0;return{r,hits,missing:names.length-hits,ratio};}).filter(x=>x.hits>0).sort((a,b)=>b.ratio-a.ratio||a.missing-b.missing||b.hits-a.hits).slice(0,24);$('#fridgeResultTitle').textContent=`${scored.length} meilleures idées`;$('#fridgeResults').innerHTML=scored.map(x=>recipeCard(x.r,`data-match="${Math.round(x.ratio*100)}"`)).join('');bindRecipeCards($('#fridgeResults'));$('#fridgeResults').querySelectorAll('.recipe-card').forEach((card,i)=>{const x=scored[i];const body=card.querySelector('.recipe-body');if(body)body.insertAdjacentHTML('afterbegin',`<span class="tiny-badge featured fridge-match">${Math.round(x.ratio*100)}% · ${x.missing} manquant${x.missing>1?'s':''}</span>`);});}

function addToShopping(id,servings=null){const r=state.recipes.find(x=>x.id===id);if(!r)return;const target=servings||r.servings||4;const existing=state.prefs.shopping.find(x=>x.id===id);if(existing)existing.servings=target;else state.prefs.shopping.push({id,servings:target});savePrefs();renderShopping();toast('Ajouté aux courses');}
function removeFromShopping(id){state.prefs.shopping=state.prefs.shopping.filter(x=>x.id!==id);savePrefs();renderShopping();}
function changeShoppingServings(id,delta){const e=state.prefs.shopping.find(x=>x.id===id);if(!e)return;e.servings=Math.max(1,Math.min(12,(e.servings||4)+delta));savePrefs();renderShopping();}
function shoppingItems(){const map=new Map();state.prefs.shopping.forEach(e=>{const r=state.recipes.find(x=>x.id===e.id);if(!r)return;const factor=(e.servings||r.servings||4)/(r.servings||1);r.ingredients.forEach(i=>{const key=norm(i.name)+'|'+norm(i.unit);if(!map.has(key))map.set(key,{name:i.name,unit:i.unit,qty:0});map.get(key).qty+=Number(i.qty||0)*factor;});});return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr'));}
function groceryGroup(name){const n=norm(name);if(/poulet|dinde|boeuf|veau|porc|agneau/.test(n))return'Viandes & volaille';if(/saumon|cabillaud|colin|thon|crevette|poisson/.test(n))return'Poissons';if(/lait|yaourt|fromage|ricotta|feta|mozzarella|beurre|creme/.test(n))return'Frais & laitages';if(/pomme|poire|banane|citron|orange|mangue|kiwi|fraise|myrtille|tomate|courgette|carotte|oignon|poivron|aubergine|concombre|brocoli|epinard|poireaux|champignon|avocat|menthe|persil/.test(n))return'Fruits & légumes';if(/riz|pate|quinoa|boulgour|semoule|farine|avoine|lentille|pois chiche|haricot|millet|sarrasin|polenta/.test(n))return'Épicerie';return'Autres';}
function renderShopping(){const entries=state.prefs.shopping.map(e=>({e,r:state.recipes.find(r=>r.id===e.id)})).filter(x=>x.r);$('#shoppingBadge').textContent=entries.length;$('#shoppingBadge').classList.toggle('hidden',!entries.length);$('#shoppingRecipeChips').innerHTML=entries.map(({e,r})=>`<span class="shopping-recipe-chip">${escapeHtml(r.name)} · ${e.servings||r.servings} pers.<button data-shop-minus="${r.id}">−</button><button data-shop-plus="${r.id}">+</button><button data-remove-shop="${r.id}">×</button></span>`).join('');$$('[data-remove-shop]').forEach(b=>b.onclick=()=>removeFromShopping(b.dataset.removeShop));$$('[data-shop-minus]').forEach(b=>b.onclick=()=>changeShoppingServings(b.dataset.shopMinus,-1));$$('[data-shop-plus]').forEach(b=>b.onclick=()=>changeShoppingServings(b.dataset.shopPlus,1));const items=shoppingItems();if(!items.length){$('#shoppingList').innerHTML='<div class="shopping-empty">Ajoute une recette ou un menu pour générer ta liste de courses.</div>';return;}const groups={};items.forEach(i=>(groups[groceryGroup(i.name)]??=[]).push(i));$('#shoppingList').innerHTML=Object.entries(groups).map(([g,it])=>`<section class="shopping-group"><h3>${escapeHtml(g)}</h3>${it.map(x=>{const key=slug(x.name+'-'+x.unit);const done=state.prefs.shoppingDone.includes(key);return`<label class="shopping-item ${done?'done':''}"><input type="checkbox" data-shop-done="${key}" ${done?'checked':''}><span><strong>${formatQty(x.qty)} ${escapeHtml(x.unit||'')}</strong> ${escapeHtml(x.name)}</span></label>`;}).join('')}</section>`).join('');$$('[data-shop-done]').forEach(c=>c.onchange=()=>{const k=c.dataset.shopDone;const a=state.prefs.shoppingDone;state.prefs.shoppingDone=c.checked?[...new Set([...a,k])]:a.filter(x=>x!==k);savePrefs();renderShopping();});}
async function copyShopping(){const items=shoppingItems();if(!items.length)return toast('La liste est vide');const txt=['FAFATRAINING · LISTE DE COURSES','',...items.map(i=>`☐ ${formatQty(i.qty)} ${i.unit||''} ${i.name}`)].join('\n');try{await navigator.clipboard.writeText(txt);toast('Liste copiée');}catch{toast('Copie impossible sur cet appareil');}}

function renderAll(){renderHome();renderRecipes();renderMenus();renderPantry();renderShopping();}

function startCook(r,mode){state.cook.recipe=r;state.cook.steps=getSteps(r,mode);state.cook.index=0;closeRecipe();$('#cookMode').classList.add('open');$('#cookMode').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';renderCookStep();}
function kitchenTipForStep(text){
  const h=norm(text);
  if(/faire revenir|revenir les/.test(h))return'Repère cuisine : feu moyen, remue régulièrement. Les aliments doivent devenir tendres ou légèrement colorés sans brûler.';
  if(/dorer|saisir/.test(h))return'Repère cuisine : la poêle doit être chaude. Laisse colorer quelques instants avant de retourner pour obtenir une belle surface dorée.';
  if(/mijoter/.test(h))return'Repère cuisine : cuisson douce, petits frémissements seulement. Couvre partiellement si la sauce réduit trop vite.';
  if(/fremir|fremissement/.test(h))return'Repère cuisine : le liquide fait de petites bulles, mais ne bout pas fortement.';
  if(/prechauff/.test(h))return'Repère cuisine : laisse le four atteindre la température indiquée avant d’enfourner pour une cuisson régulière.';
  if(/egoutter/.test(h))return'Repère cuisine : laisse l’eau s’écouler quelques secondes pour éviter de détremper la préparation.';
  return'';
}
function renderCookStep(){const c=state.cook,s=c.steps[c.index]||{title:'Terminé',text:'La recette est prête.',durationSec:0};$('#cookProgress').textContent=`Étape ${c.index+1}/${c.steps.length}`;$('#cookRecipeName').textContent=c.recipe?.name||'Recette';$('#cookStepNumber').textContent=c.index+1;$('#cookStepTitle').textContent=s.title||'Étape';$('#cookStepText').textContent=s.text||'';const tip=kitchenTipForStep(s.text||'');$('#cookBeginnerTip').textContent=tip;$('#cookBeginnerTip').classList.toggle('hidden',!tip);$('#cookPrevBtn').disabled=c.index===0;$('#cookNextBtn').textContent=c.index===c.steps.length-1?'Terminer':'Suivant';state.cook.timerInitial=Number(s.durationSec||0);state.cook.timerLeft=state.cook.timerInitial;stopTimer();updateTimerDisplay();$('#cookTimer').classList.add('hidden');}
function moveCook(dir){const c=state.cook;if(dir>0&&c.index===c.steps.length-1){closeCook();toast('Recette terminée !');return;}c.index=Math.max(0,Math.min(c.steps.length-1,c.index+dir));renderCookStep();}
function closeCook(){stopTimer();$('#cookMode').classList.remove('open');$('#cookMode').setAttribute('aria-hidden','true');document.body.style.overflow='';}
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
  const logo=await loadCanvasImage('logo.jpg');
  if(logo){drawRoundRect(ctx,48,42,88,88,20,'#101710','#31402d');drawCover(ctx,logo,48,42,88,88);}
  ctx.fillStyle='#ffffff';ctx.font='900 30px system-ui, sans-serif';ctx.fillText('FAFATRAINING',154,80);ctx.fillStyle='#75d429';ctx.font='800 18px system-ui, sans-serif';ctx.fillText('CUISINE • NUTRITION',154,110);
  if(state.export.type==='menu') await drawMenuExport(ctx,W,H,char);
  else await drawRecipeExport(ctx,W,H,char);
  ctx.fillStyle='#75d429';ctx.fillRect(48,H-86,W-96,3);ctx.fillStyle='#ffffff';ctx.font='800 22px system-ui, sans-serif';ctx.fillText('FAFATRAINING',48,H-42);ctx.fillStyle='#aeb8aa';ctx.font='500 18px system-ui, sans-serif';ctx.textAlign='right';ctx.fillText('Cuisine simple • Maison • TM6',W-48,H-42);ctx.textAlign='left';
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
  const story=state.export.format==='story';
  let y=180;ctx.fillStyle='#75d429';ctx.font='900 24px system-ui, sans-serif';ctx.fillText('MENU FAFATRAINING',48,y);y+=62;ctx.fillStyle='#fff';ctx.font=`900 ${story?72:62}px system-ui, sans-serif`;y=drawWrapped(ctx,m.title,48,y,W-(characterOnExport()?390:96),story?78:68,3)+24;
  ctx.fillStyle='#aeb8aa';ctx.font='500 22px system-ui, sans-serif';y=drawWrapped(ctx,m.subtitle||'Entrée, plat et dessert.',48,y,W-(characterOnExport()?370:96),32,3)+34;
  if(characterOnExport()&&char){const cw=story?390:310;const ch=cw*(char.height/char.width);ctx.save();ctx.globalAlpha=.97;ctx.drawImage(char,W-cw-30,130,cw,ch);ctx.restore();}
  const labels=['ENTRÉE','PLAT','DESSERT'];
  const cardH=story?225:145, gap=story?22:20;
  m.recipes.slice(0,3).forEach((id,i)=>{const r=state.recipes.find(x=>x.id===id);if(!r)return;drawRoundRect(ctx,48,y,W-96,cardH,24,'#101710','#2f3d2b');ctx.fillStyle='#75d429';ctx.font='900 20px system-ui, sans-serif';ctx.fillText(labels[i]||'RECETTE',76,y+42);ctx.fillStyle='#fff';ctx.font=`800 ${story?32:27}px system-ui, sans-serif`;drawWrapped(ctx,r.name,76,y+88,W-152,story?39:32,story?3:2);ctx.fillStyle='#aeb8aa';ctx.font='500 18px system-ui, sans-serif';ctx.fillText(`${totalTime(r)||'—'} min • ${supportBadge(r)}`,76,y+cardH-30);y+=cardH+gap;});
  if(story){
    y+=20;drawRoundRect(ctx,48,y,W-96,200,26,'rgba(117,212,41,.10)','#4b6a3e');ctx.fillStyle='#75d429';ctx.font='900 28px system-ui, sans-serif';ctx.fillText('TON MENU EST PRÊT À CUISINER',76,y+54);ctx.fillStyle='#ffffff';ctx.font='700 23px system-ui, sans-serif';drawWrapped(ctx,'Ouvre le menu dans l’application, choisis ton mode de préparation et ajoute les 3 recettes aux courses en un geste.',76,y+98,W-152,34,3);y+=240;
    ctx.fillStyle='#75d429';ctx.font='900 22px system-ui, sans-serif';ctx.fillText('3 RECETTES • 1 MENU • FAFATRAINING',48,y);
  }else{
    y+=18;ctx.fillStyle='#75d429';ctx.font='900 22px system-ui, sans-serif';ctx.fillText('À FAIRE CHEZ TOI',48,y);ctx.fillStyle='#dce5d9';ctx.font='500 20px system-ui, sans-serif';drawWrapped(ctx,'Choisis ton mode de préparation dans l’application : TM6, ustensiles & four ou autre robot / appareil.',48,y+38,W-96,30,4);
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
