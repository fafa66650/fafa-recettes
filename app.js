const STORAGE_KEY='fafatraining-recettes-v11';
const DEFAULT_PREFS={mode:'tm6',restrictions:[],equipment:['TM6','Cuisine classique'],favorites:[],pantry:[],shopping:[],shoppingDone:[],lastPage:'home'};
const state={
  recipes:[],menus:[],
  prefs:{...DEFAULT_PREFS},
  filters:{query:'',category:'',time:'',equipment:'',style:'',favoritesOnly:false},
  visible:48,
  currentRecipe:null,
  currentServings:4,
  currentDrawerMode:'tm6',
  homeFeaturedKey:'all',
  pageHistory:[],
  cook:{recipe:null,steps:[],index:0,timerLeft:0,timerInitial:0,timerId:null}
};

const MODE_META={
  tm6:{short:'TM6',title:'TM6',desc:'Ton pas à pas Thermomix.'},
  classic:{short:'Cuisine classique',title:'Casserole · poêle · four',desc:'Pour cuisiner à l’ancienne, simplement.'},
  robot:{short:'Autre appareil',title:'Autre robot / appareil',desc:'Blender, air fryer, multicuiseur, robot perso…'}
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
  $('#homeRecipeCount').textContent=state.recipes.length;
  $('#homeMenuCount').textContent=state.menus.length;
  const cats=uniq(state.recipes.map(r=>r.category));
  $('#homeCategoryCount').textContent=cats.length;

  $('#heroModeButtons').innerHTML=Object.entries(MODE_META).map(([k,v])=>`<button class="mode-card" data-mode="${k}"><strong>${escapeHtml(v.short)}</strong><small>${escapeHtml(v.desc)}</small></button>`).join('');
  $('#settingsMode').innerHTML=Object.entries(MODE_META).map(([k,v])=>`<button data-mode="${k}">${escapeHtml(v.short)}</button>`).join('');

  const availableStyles=HOME_STYLES.filter(s=>state.recipes.some(r=>(r.styles||[]).includes(s)));
  $('#homeStyleChips').innerHTML=availableStyles.map(s=>`<button class="style-chip" data-home-style="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('');
  $('#recipeStyleChips').innerHTML=['Toutes',...availableStyles].map((s,i)=>`<button class="style-chip ${i===0?'active':''}" data-recipe-style="${i===0?'':escapeHtml(s)}">${escapeHtml(s)}</button>`).join('');
  $('#homeFeaturedFilters').innerHTML=HOME_FEATURED_FILTERS.map((f,i)=>`<button class="style-chip ${i===0?'active':''}" data-featured-key="${escapeHtml(f.key)}">${escapeHtml(f.label)}</button>`).join('');

  $('#categoryFilter').innerHTML='<option value="">Toutes les catégories</option>'+uniq(state.recipes.map(r=>r.category)).sort((a,b)=>a.localeCompare(b,'fr')).map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  $('#restrictionChips').innerHTML=restrictionOptions.map(([k,l])=>`<button class="restriction-chip ${state.prefs.restrictions.includes(k)?'active':''}" data-restriction="${k}">${l}</button>`).join('');
  $('#equipmentChips').innerHTML=equipmentOptions.map(e=>`<button class="restriction-chip ${state.prefs.equipment.includes(e)?'active':''}" data-pref-equipment="${escapeHtml(e)}">${escapeHtml(e)}</button>`).join('');
}

function bindEvents(){
  $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));
  $('#topBackBtn').onclick=goBack;

  $('#homeSearchBtn').onclick=()=>{state.filters.query=$('#homeSearch').value.trim();$('#recipeSearch').value=state.filters.query;navigate('recipes');renderRecipes(true);};
  $('#homeSearch').addEventListener('keydown',e=>{if(e.key==='Enter')$('#homeSearchBtn').click();});
  $('#recipeSearch').addEventListener('input',e=>{state.filters.query=e.target.value.trim();renderRecipes(true);});
  $('#categoryFilter').onchange=e=>{state.filters.category=e.target.value;renderRecipes(true);};
  $('#timeFilter').onchange=e=>{state.filters.time=e.target.value;renderRecipes(true);};
  $('#equipmentFilter').onchange=e=>{state.filters.equipment=e.target.value;renderRecipes(true);};
  $('#favoritesOnly').onchange=e=>{state.filters.favoritesOnly=e.target.checked;renderRecipes(true);};
  $('#resetFiltersBtn').onclick=resetFilters;
  $('#loadMoreBtn').onclick=()=>{state.visible+=48;renderRecipes();};
  $('#favoriteTopBtn').onclick=()=>{state.filters.favoritesOnly=true;$('#favoritesOnly').checked=true;navigate('recipes');renderRecipes(true);};
  $('#openFavoritesBtn').onclick=$('#favoriteTopBtn').onclick;

  $('#settingsBtn').onclick=()=>openSettings(true);
  $$('[data-close-settings]').forEach(x=>x.onclick=()=>openSettings(false));
  $$('[data-close-drawer]').forEach(x=>x.onclick=closeRecipe);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeRecipe();openSettings(false);closeCook();}});

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

  bindDynamicUI();
}

function bindDynamicUI(){
  $$('[data-mode]').forEach(b=>b.onclick=()=>setPreferredMode(b.dataset.mode));
  $$('[data-home-style]').forEach(b=>b.onclick=()=>{state.filters.style=b.dataset.homeStyle;$$('[data-recipe-style]').forEach(x=>x.classList.toggle('active',x.dataset.recipeStyle===state.filters.style));navigate('recipes');renderRecipes(true);});
  $$('[data-recipe-style]').forEach(b=>b.onclick=()=>{state.filters.style=b.dataset.recipeStyle;$$('[data-recipe-style]').forEach(x=>x.classList.toggle('active',x===b));renderRecipes(true);});
  $$('[data-featured-key]').forEach(b=>b.onclick=()=>{state.homeFeaturedKey=b.dataset.featuredKey;$$('[data-featured-key]').forEach(x=>x.classList.toggle('active',x===b));renderHome();});
  $$('[data-restriction]').forEach(b=>b.onclick=()=>{const k=b.dataset.restriction;const a=state.prefs.restrictions;state.prefs.restrictions=a.includes(k)?a.filter(x=>x!==k):[...a,k];savePrefs();b.classList.toggle('active');renderAll();});
  $$('[data-pref-equipment]').forEach(b=>b.onclick=()=>{const k=b.dataset.prefEquipment;const a=state.prefs.equipment;state.prefs.equipment=a.includes(k)?a.filter(x=>x!==k):[...a,k];savePrefs();b.classList.toggle('active');});
  $$('[data-quick-category]').forEach(b=>b.onclick=()=>{state.filters.category=b.dataset.quickCategory;$('#categoryFilter').value=state.filters.category;navigate('recipes');renderRecipes(true);});
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
  const prev=state.pageHistory.pop()||'home';
  navigate(prev,true,false);
}

function setPreferredMode(mode){state.prefs.mode=mode;state.currentDrawerMode=mode;savePrefs();applyModeButtons();if(state.currentRecipe)openRecipe(state.currentRecipe.id,false);toast(`Mode : ${MODE_META[mode]?.short||mode}`);}
function applyModeButtons(){$$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.prefs.mode));}
function openSettings(open){$('#settingsDrawer').classList.toggle('open',open);$('#settingsDrawer').setAttribute('aria-hidden',String(!open));}

function passesRestrictions(r){return !state.prefs.restrictions.some(a=>(r.allergens||[]).includes(a));}
function recipeHay(r){return norm([r.name,r.category,r.description,(r.tags||[]).join(' '),(r.styles||[]).join(' '),(r.equipment||[]).join(' '),r.ingredients.map(i=>i.name).join(' ')].join(' '));}
function filteredRecipes(){
  let arr=state.recipes.filter(passesRestrictions);
  const f=state.filters;
  if(f.query){const q=norm(f.query);arr=arr.filter(r=>recipeHay(r).includes(q));}
  if(f.category)arr=arr.filter(r=>r.category===f.category);
  if(f.time)arr=arr.filter(r=>totalTime(r)<=Number(f.time));
  if(f.equipment)arr=arr.filter(r=>(r.equipment||[]).includes(f.equipment));
  if(f.style)arr=arr.filter(r=>(r.styles||[]).includes(f.style));
  if(f.favoritesOnly)arr=arr.filter(r=>state.prefs.favorites.includes(r.id));
  return arr.sort((a,b)=>(Number(b.featured)-Number(a.featured))||a.name.localeCompare(b.name,'fr'));
}
function resetFilters(){state.filters={query:'',category:'',time:'',equipment:'',style:'',favoritesOnly:false};$('#recipeSearch').value='';$('#homeSearch').value='';$('#categoryFilter').value='';$('#timeFilter').value='';$('#equipmentFilter').value='';$('#favoritesOnly').checked=false;$$('[data-recipe-style]').forEach(b=>b.classList.toggle('active',b.dataset.recipeStyle===''));renderRecipes(true);}

function homeFeaturedRecipes(){
  let arr=state.recipes.filter(r=>passesRestrictions(r) && (r.featured || QUICK_CATEGORIES.includes(r.category)));
  const key=state.homeFeaturedKey;
  if(key==='all') return arr.slice(0,8);
  if(key==='plats') arr=arr.filter(r=>isMainCourseCategory(r.category));
  else if(HOME_STYLES.includes(key)) arr=arr.filter(r=>(r.styles||[]).includes(key));
  else arr=arr.filter(r=>r.category===key);
  return arr.slice(0,8);
}

function renderHome(){
  const featured=homeFeaturedRecipes();
  $('#featuredGrid').innerHTML=featured.map(recipeCard).join('');
  bindRecipeCards($('#featuredGrid'));

  const counts={};
  state.recipes.filter(passesRestrictions).forEach(r=>counts[r.category]=(counts[r.category]||0)+1);
  const sortedCats=Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'fr')).slice(0,10);
  $('#homeCategories').innerHTML=sortedCats.map(([c,n])=>`<button class="category-card" data-home-cat="${escapeHtml(c)}"><span>${categoryIcon[c]||'🍽️'}</span><strong>${escapeHtml(c)}</strong><small>${n} recettes</small></button>`).join('');
  $$('[data-home-cat]').forEach(b=>b.onclick=()=>{state.filters.category=b.dataset.homeCat;$('#categoryFilter').value=state.filters.category;navigate('recipes');renderRecipes(true);});

  $('#homeMenus').innerHTML=state.menus.slice(0,8).map(menuCard).join('');
  bindMenuCards($('#homeMenus'));

  const fav=state.recipes.filter(r=>state.prefs.favorites.includes(r.id)).slice(0,4);
  $('#homeFavoritesSection').classList.toggle('hidden',!fav.length);
  $('#homeFavorites').innerHTML=fav.map(recipeCard).join('');
  bindRecipeCards($('#homeFavorites'));
}

function supportBadge(r){
  if((r.equipment||[]).includes('TM6') && (r.equipment||[]).includes('Cuisine classique')) return 'TM6 + classique';
  if((r.equipment||[]).includes('TM6')) return 'TM6';
  if((r.equipment||[]).includes('Cuisine classique')) return 'Cuisine classique';
  return (r.equipment||[])[0]||'Polyvalent';
}

function recipeCard(r,extra=''){
  const fav=state.prefs.favorites.includes(r.id);
  const image=imgSrc(r);
  const times=totalTime(r);
  const style=(r.styles||[])[0]||'Cuisine maison';
  return `<article class="recipe-card" ${extra}><div class="recipe-image ${image?'':'no-image'}">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(r.name)}" loading="lazy">`:`<span>${r.emoji||categoryIcon[r.category]||'🍽️'}</span>`}<button class="fav-btn ${fav?'active':''}" data-fav="${r.id}" aria-label="Favori">${fav?'♥':'♡'}</button></div><div class="recipe-body"><div class="recipe-topline"><span class="tiny-badge ${r.featured?'featured':''}">${escapeHtml(r.featured?'Sélection':r.category)}</span><span class="tiny-badge">${escapeHtml(style)}</span></div><h3 class="recipe-title">${escapeHtml(r.name)}</h3><div class="recipe-desc">${escapeHtml(r.description||'Recette détaillée avec plusieurs modes de préparation.')}</div><div class="recipe-meta"><span>⏱ ${times||'—'} min</span><span>👥 ${r.servings||4}</span><span>${escapeHtml(supportBadge(r))}</span></div><div class="card-actions"><button class="open-btn" data-open="${r.id}">Ouvrir</button><button class="shop-btn" data-shop="${r.id}">+ Courses</button></div></div></article>`;
}
function bindRecipeCards(root=document){
  root.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openRecipe(b.dataset.open));
  root.querySelectorAll('[data-shop]').forEach(b=>b.onclick=()=>addToShopping(b.dataset.shop));
  root.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFavorite(b.dataset.fav);});
}
function renderRecipes(resetVisible=false){
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
  return `<article class="menu-card"><span class="kicker">${escapeHtml((m.tags||[])[0]||'MENU')}</span><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.subtitle||'')}</p><div class="menu-list">${rs.map((r,i)=>`<div><span>${i+1}</span><small><strong>${i===0?'Entrée':i===1?'Plat':'Dessert'}</strong><br>${escapeHtml(r.name)}</small></div>`).join('')}</div><div class="menu-actions"><button data-open-menu-first="${m.id}">Voir</button><button class="primary" data-shop-menu="${m.id}">+ Courses</button></div></article>`;
}
function renderMenus(){
  $('#menusGrid').innerHTML=state.menus.map(m=>`<article class="menu-card-full"><span class="kicker">${escapeHtml((m.tags||[])[0]||'Menu')}</span><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.subtitle||'')}</p><div class="tag-row">${(m.tags||[]).slice(1,4).map(t=>`<span class="style-tag">${escapeHtml(t)}</span>`).join('')}</div><div class="menu-list">${m.recipes.map((id,i)=>{const r=state.recipes.find(x=>x.id===id);return r?`<div><span>${i+1}</span><small><strong>${i===0?'Entrée':i===1?'Plat':'Dessert'} :</strong> ${escapeHtml(r.name)}</small></div>`:'';}).join('')}</div><div class="menu-actions"><button data-open-menu-first="${m.id}">Ouvrir une recette</button><button class="primary" data-shop-menu="${m.id}">Ajouter le menu aux courses</button></div></article>`).join('');
  bindMenuCards($('#menusGrid'));
}
function bindMenuCards(root){
  root.querySelectorAll('[data-shop-menu]').forEach(b=>b.onclick=()=>addMenuToShopping(b.dataset.shopMenu));
  root.querySelectorAll('[data-open-menu-first]').forEach(b=>b.onclick=()=>{const m=state.menus.find(x=>x.id===b.dataset.openMenuFirst);if(m?.recipes[0]) openRecipe(m.recipes[0]);});
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
  const r=state.recipes.find(x=>x.id===id); if(!r) return;
  state.currentRecipe=r;
  if(open){state.currentServings=r.servings||4; state.currentDrawerMode=state.prefs.mode;}
  const factor=state.currentServings/(r.servings||1);
  const steps=getSteps(r,state.currentDrawerMode);
  const image=imgSrc(r);
  const fav=state.prefs.favorites.includes(r.id);
  const allergens=(r.allergens||[]).map(a=>allergenLabels[a]||a.replaceAll('_',' '));
  $('#drawerContent').innerHTML=`<div class="drawer-hero"><div class="drawer-cover">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(r.name)}">`:`<span>${r.emoji||'🍽️'}</span>`}</div><div class="drawer-head"><span class="kicker">${escapeHtml(r.category)}</span><h2 id="drawerTitle">${escapeHtml(r.name)}</h2><p>${escapeHtml(r.description||'')}</p><div class="drawer-meta"><span>⏱ Prépa ${r.prepMin||0} min</span><span>🔥 Cuisson ${r.cookMin||0} min</span><span>≈ ${r.macros?.kcal||'—'} kcal / portion</span></div><div class="style-tags">${(r.styles||[]).map(s=>`<span class="style-tag">${escapeHtml(s)}</span>`).join('')}</div><div class="drawer-actions"><button class="primary" id="startCookBtn">Cuisiner</button><button id="drawerShopBtn">+ Courses</button><button id="drawerFavBtn">${fav?'♥ Favori':'♡ Favori'}</button></div></div></div><div class="mode-row"><span class="kicker">MODE DE PRÉPARATION</span><div class="segmented" id="drawerModes"><button data-drawer-mode="tm6" class="${state.currentDrawerMode==='tm6'?'active':''}">TM6</button><button data-drawer-mode="classic" class="${state.currentDrawerMode==='classic'?'active':''}">Cuisine classique</button><button data-drawer-mode="robot" class="${state.currentDrawerMode==='robot'?'active':''}">Autre appareil</button></div></div><div class="drawer-grid"><section class="drawer-section"><div class="section-title-row"><h3>Ingrédients</h3><div class="servings-box"><button id="servMinus">−</button><strong>${state.currentServings}</strong><button id="servPlus">+</button></div></div><div class="ingredient-list">${r.ingredients.map(i=>`<div class="ingredient-row"><span>${escapeHtml(i.name)}</span><span>${formatQty(Number(i.qty||0)*factor)} ${escapeHtml(i.unit||'')}</span></div>`).join('')}</div></section><section class="drawer-section"><h3>Nutrition</h3><div class="ingredient-list"><div class="ingredient-row"><span>Calories</span><span>≈ ${r.macros?.kcal||'—'} kcal</span></div><div class="ingredient-row"><span>Protéines</span><span>≈ ${r.macros?.proteines||'—'} g</span></div><div class="ingredient-row"><span>Glucides</span><span>≈ ${r.macros?.glucides||'—'} g</span></div><div class="ingredient-row"><span>Lipides</span><span>≈ ${r.macros?.lipides||'—'} g</span></div></div><p class="small-note">${escapeHtml(r.nutritionBasis||'Valeurs indicatives')}</p>${allergens.length?`<div class="allergen-box"><strong>Contient / peut contenir :</strong> ${escapeHtml(allergens.join(', '))}</div>`:'<p class="small-note">Aucun allergène majeur renseigné dans cette fiche.</p>'}</section><section class="drawer-section"><h3>Étapes · ${modeLabel(state.currentDrawerMode)}</h3><div class="steps-list">${steps.map((s,i)=>`<div class="step-box"><strong>${i+1}. ${escapeHtml(s.title||'Étape')}</strong><p>${escapeHtml(s.text||'')}</p>${s.durationSec?`<small>⏱ ${Math.max(1,Math.round(s.durationSec/60))} min</small>`:''}</div>`).join('')}</div></section><section class="drawer-section"><h3>Conseils & adaptations</h3><div class="steps-list">${(r.tips||[]).map(t=>`<div class="step-box"><p>${escapeHtml(t)}</p></div>`).join('')}${(r.substitutions||[]).slice(0,6).map(t=>`<div class="step-box"><p>↔ ${escapeHtml(t)}</p></div>`).join('')}</div></section></div>`;
  $('#drawerModes').querySelectorAll('[data-drawer-mode]').forEach(b=>b.onclick=()=>{state.currentDrawerMode=b.dataset.drawerMode;openRecipe(r.id,false);});
  $('#servMinus').onclick=()=>{if(state.currentServings>1){state.currentServings--;openRecipe(r.id,false);}};
  $('#servPlus').onclick=()=>{if(state.currentServings<12){state.currentServings++;openRecipe(r.id,false);}};
  $('#drawerShopBtn').onclick=()=>addToShopping(r.id,state.currentServings);
  $('#drawerFavBtn').onclick=()=>toggleFavorite(r.id);
  $('#startCookBtn').onclick=()=>startCook(r,state.currentDrawerMode);
  if(open){$('#recipeDrawer').classList.add('open');$('#recipeDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
}
function closeRecipe(){ $('#recipeDrawer').classList.remove('open'); $('#recipeDrawer').setAttribute('aria-hidden','true'); if(!$('#cookMode').classList.contains('open')) document.body.style.overflow=''; }
function formatQty(n){ if(!Number.isFinite(n)) return ''; if(Math.abs(n-Math.round(n))<.01) return String(Math.round(n)); return String(Math.round(n*10)/10).replace('.',','); }

function pantryIngredients(){const count=new Map();state.recipes.forEach(r=>r.ingredients.forEach(i=>count.set(i.name,(count.get(i.name)||0)+1)));return [...count.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'fr')).map(x=>x[0]);}
function renderPantry(){const q=norm($('#fridgeSearch')?.value||'');const list=pantryIngredients().filter(x=>!q||norm(x).includes(q)).slice(0,180);$('#pantryCloud').innerHTML=list.map(n=>`<button class="pantry-btn ${state.prefs.pantry.includes(n)?'selected':''}" data-pantry="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join('');$('#selectedPantry').innerHTML=state.prefs.pantry.map(n=>`<button class="selected-pill" data-pantry="${escapeHtml(n)}">${escapeHtml(n)} ×</button>`).join('')||'<span class="small-note">Aucun ingrédient sélectionné.</span>';$$('[data-pantry]').forEach(b=>b.onclick=()=>togglePantry(b.dataset.pantry));}
function togglePantry(n){const a=state.prefs.pantry;state.prefs.pantry=a.includes(n)?a.filter(x=>x!==n):[...a,n];savePrefs();renderPantry();renderFridgeResults();}
function renderFridgeResults(){const sel=state.prefs.pantry;if(!sel.length){$('#fridgeResultTitle').textContent='Ajoute quelques ingrédients';$('#fridgeResults').innerHTML='<div class="shopping-empty">Choisis ce que tu as déjà chez toi pour obtenir des idées.</div>';return;}const selected=new Set(sel.map(norm));const scored=state.recipes.filter(passesRestrictions).map(r=>{const names=r.ingredients.map(i=>norm(i.name));const hits=names.filter(n=>selected.has(n)).length;const ratio=names.length?hits/names.length:0;return{r,hits,missing:names.length-hits,ratio};}).filter(x=>x.hits>0).sort((a,b)=>b.ratio-a.ratio||a.missing-b.missing||b.hits-a.hits).slice(0,24);$('#fridgeResultTitle').textContent=`${scored.length} meilleures idées`;$('#fridgeResults').innerHTML=scored.map(x=>recipeCard(x.r,`data-match="${Math.round(x.ratio*100)}"`)).join('');bindRecipeCards($('#fridgeResults'));$('#fridgeResults').querySelectorAll('.recipe-card').forEach((card,i)=>{const x=scored[i];const badge=card.querySelector('.recipe-topline');badge.insertAdjacentHTML('afterbegin',`<span class="tiny-badge featured">${Math.round(x.ratio*100)}% · ${x.missing} manquant${x.missing>1?'s':''}</span>`);});}

function addToShopping(id,servings=null){const r=state.recipes.find(x=>x.id===id);if(!r)return;const target=servings||r.servings||4;const existing=state.prefs.shopping.find(x=>x.id===id);if(existing)existing.servings=target;else state.prefs.shopping.push({id,servings:target});savePrefs();renderShopping();toast('Ajouté aux courses');}
function removeFromShopping(id){state.prefs.shopping=state.prefs.shopping.filter(x=>x.id!==id);savePrefs();renderShopping();}
function changeShoppingServings(id,delta){const e=state.prefs.shopping.find(x=>x.id===id);if(!e)return;e.servings=Math.max(1,Math.min(12,(e.servings||4)+delta));savePrefs();renderShopping();}
function shoppingItems(){const map=new Map();state.prefs.shopping.forEach(e=>{const r=state.recipes.find(x=>x.id===e.id);if(!r)return;const factor=(e.servings||r.servings||4)/(r.servings||1);r.ingredients.forEach(i=>{const key=norm(i.name)+'|'+norm(i.unit);if(!map.has(key))map.set(key,{name:i.name,unit:i.unit,qty:0});map.get(key).qty+=Number(i.qty||0)*factor;});});return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr'));}
function groceryGroup(name){const n=norm(name);if(/poulet|dinde|boeuf|veau|porc|agneau/.test(n))return'Viandes & volaille';if(/saumon|cabillaud|colin|thon|crevette|poisson/.test(n))return'Poissons';if(/lait|yaourt|fromage|ricotta|feta|mozzarella|beurre|creme/.test(n))return'Frais & laitages';if(/pomme|poire|banane|citron|orange|mangue|kiwi|fraise|myrtille|tomate|courgette|carotte|oignon|poivron|aubergine|concombre|brocoli|epinard|poireaux|champignon|avocat|menthe|persil/.test(n))return'Fruits & légumes';if(/riz|pate|quinoa|boulgour|semoule|farine|avoine|lentille|pois chiche|haricot|millet|sarrasin|polenta/.test(n))return'Épicerie';return'Autres';}
function renderShopping(){const entries=state.prefs.shopping.map(e=>({e,r:state.recipes.find(r=>r.id===e.id)})).filter(x=>x.r);$('#shoppingBadge').textContent=entries.length;$('#shoppingBadge').classList.toggle('hidden',!entries.length);$('#shoppingRecipeChips').innerHTML=entries.map(({e,r})=>`<span class="shopping-recipe-chip">${escapeHtml(r.name)} · ${e.servings||r.servings} pers.<button data-shop-minus="${r.id}">−</button><button data-shop-plus="${r.id}">+</button><button data-remove-shop="${r.id}">×</button></span>`).join('');$$('[data-remove-shop]').forEach(b=>b.onclick=()=>removeFromShopping(b.dataset.removeShop));$$('[data-shop-minus]').forEach(b=>b.onclick=()=>changeShoppingServings(b.dataset.shopMinus,-1));$$('[data-shop-plus]').forEach(b=>b.onclick=()=>changeShoppingServings(b.dataset.shopPlus,1));const items=shoppingItems();if(!items.length){$('#shoppingList').innerHTML='<div class="shopping-empty">Ajoute une recette ou un menu pour générer ta liste de courses.</div>';return;}const groups={};items.forEach(i=>(groups[groceryGroup(i.name)]??=[]).push(i));$('#shoppingList').innerHTML=Object.entries(groups).map(([g,it])=>`<section class="shopping-group"><h3>${escapeHtml(g)}</h3>${it.map(x=>{const key=slug(x.name+'-'+x.unit);const done=state.prefs.shoppingDone.includes(key);return`<label class="shopping-item ${done?'done':''}"><input type="checkbox" data-shop-done="${key}" ${done?'checked':''}><span><strong>${formatQty(x.qty)} ${escapeHtml(x.unit||'')}</strong> ${escapeHtml(x.name)}</span></label>`;}).join('')}</section>`).join('');$$('[data-shop-done]').forEach(c=>c.onchange=()=>{const k=c.dataset.shopDone;const a=state.prefs.shoppingDone;state.prefs.shoppingDone=c.checked?[...new Set([...a,k])]:a.filter(x=>x!==k);savePrefs();renderShopping();});}
async function copyShopping(){const items=shoppingItems();if(!items.length)return toast('La liste est vide');const txt=['FAFATRAINING · LISTE DE COURSES','',...items.map(i=>`☐ ${formatQty(i.qty)} ${i.unit||''} ${i.name}`)].join('\n');try{await navigator.clipboard.writeText(txt);toast('Liste copiée');}catch{toast('Copie impossible sur cet appareil');}}

function renderAll(){renderHome();renderRecipes();renderMenus();renderPantry();renderShopping();}

function startCook(r,mode){state.cook.recipe=r;state.cook.steps=getSteps(r,mode);state.cook.index=0;closeRecipe();$('#cookMode').classList.add('open');$('#cookMode').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';renderCookStep();}
function renderCookStep(){const c=state.cook,s=c.steps[c.index]||{title:'Terminé',text:'La recette est prête.',durationSec:0};$('#cookProgress').textContent=`Étape ${c.index+1}/${c.steps.length}`;$('#cookRecipeName').textContent=c.recipe?.name||'Recette';$('#cookStepNumber').textContent=c.index+1;$('#cookStepTitle').textContent=s.title||'Étape';$('#cookStepText').textContent=s.text||'';$('#cookPrevBtn').disabled=c.index===0;$('#cookNextBtn').textContent=c.index===c.steps.length-1?'Terminer':'Suivant';state.cook.timerInitial=Number(s.durationSec||0);state.cook.timerLeft=state.cook.timerInitial;stopTimer();updateTimerDisplay();$('#cookTimer').classList.add('hidden');}
function moveCook(dir){const c=state.cook;if(dir>0&&c.index===c.steps.length-1){closeCook();toast('Recette terminée !');return;}c.index=Math.max(0,Math.min(c.steps.length-1,c.index+dir));renderCookStep();}
function closeCook(){stopTimer();$('#cookMode').classList.remove('open');$('#cookMode').setAttribute('aria-hidden','true');document.body.style.overflow='';}
function toggleTimerPanel(){if(!state.cook.timerInitial)return toast('Pas de durée précise pour cette étape');$('#cookTimer').classList.toggle('hidden');}
function updateTimerDisplay(){const s=Math.max(0,state.cook.timerLeft);$('#timerDisplay').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;$('#timerToggleBtn').textContent=state.cook.timerId?'Pause':'Démarrer';}
function toggleTimer(){if(state.cook.timerId){stopTimer();return;}if(state.cook.timerLeft<=0)state.cook.timerLeft=state.cook.timerInitial;state.cook.timerId=setInterval(()=>{state.cook.timerLeft--;updateTimerDisplay();if(state.cook.timerLeft<=0){stopTimer();toast('Minuteur terminé');}},1000);updateTimerDisplay();}
function stopTimer(){if(state.cook.timerId){clearInterval(state.cook.timerId);state.cook.timerId=null;}updateTimerDisplay();}
function resetTimer(){stopTimer();state.cook.timerLeft=state.cook.timerInitial;updateTimerDisplay();}

init();
