const STORAGE_KEY='fafatraining-recettes';
const DEFAULT_PREFS={mode:'tm6',guided:true,household:4,restrictions:[],equipment:['TM6','Cuisine classique'],favorites:[],favoriteMenus:[],menuOverrides:{},pantry:[],pantryFavorites:[],pantryRecent:[],shopping:[],manualShopping:[],shoppingDone:[],planning:{},recipeNotes:{},leftovers:{},customRecipes:[],lastPage:'home',recentCategories:[],recentRecipes:[]};
const state={
  recipes:[],menus:[],
  prefs:{...DEFAULT_PREFS},
  filters:{query:'',category:'',subtype:'',cuisine:'',time:'',equipment:'',style:'',favoritesOnly:false,fridgeOnly:false,mealOnly:false},
  visible:48,
  currentRecipe:null,
  currentServings:4,
  currentDrawerMode:'tm6',
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
const allergenLabels={gluten:'gluten',lactose:'lait / produits laitiers',oeufs:'œufs',fruits_a_coque:'fruits à coque',soja:'soja',poisson:'poisson',crustaces:'crustacés',arachides:'arachides',sesame:'sésame',moutarde:'moutarde',celeri:'céleri',mollusques:'mollusques',lupin:'lupin',sulfites:'sulfites'};
const restrictionOptions=[['gluten','Sans gluten'],['lactose','Sans lait / produits laitiers'],['oeufs','Sans œufs'],['fruits_a_coque','Sans fruits à coque'],['soja','Sans soja'],['poisson','Sans poisson'],['crustaces','Sans crustacés'],['arachides','Sans arachides'],['sesame','Sans sésame'],['moutarde','Sans moutarde'],['celeri','Sans céleri'],['mollusques','Sans mollusques'],['lupin','Sans lupin'],['sulfites','Sans sulfites']];
const equipmentOptions=['TM6','Cuisine classique','Four','Poêle','Blender / mixeur','Air fryer','Multicuiseur / Cookeo','Robot pâtissier'];
const equipmentDisplay={'Cuisine classique':'Ustensiles & four','Multicuiseur / Cookeo':'Multicuiseur / Cookeo'};
const deviceLabels={airfryer:'Air fryer',multicuiseur:'Multicuiseur / Cookeo',blender:'Blender / mixeur',robot_patissier:'Robot pâtissier'};
const categoryIcon={
  'Boissons & smoothies':'🥤','Légumes & accompagnements':'🥦','Petit-déjeuner':'🥣','Entrées & salades':'🥗','Poulet & volaille':'🍗','Viandes':'🥩','Poissons & fruits de mer':'🐟','Végétarien':'🌿','Pâtes, riz & céréales':'🍝','Soupes & veloutés':'🍲','Four & gratins':'🔥','Desserts':'🍰','Collations':'🍎','Sauces & bases':'🥣','Repas protéinés':'💪','Recettes légères':'🥗','Batch cooking':'📦'
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

function loadPrefs(){
  try{const raw=localStorage.getItem(STORAGE_KEY);const x=JSON.parse(raw||'{}');state.prefs={...DEFAULT_PREFS,...x};}
  catch{state.prefs={...DEFAULT_PREFS};}
  state.prefs.shopping=(state.prefs.shopping||[]).map(x=>typeof x==='string'?{id:x,servings:null}:x).filter(Boolean);
  state.prefs.manualShopping=(state.prefs.manualShopping||[]).filter(x=>x&&x.name);state.prefs.pantryFavorites=state.prefs.pantryFavorites||[];state.prefs.pantryRecent=state.prefs.pantryRecent||[];
  state.prefs.favoriteMenus=state.prefs.favoriteMenus||[];
  state.prefs.menuOverrides=state.prefs.menuOverrides||{};
  state.prefs.planning=state.prefs.planning||{};state.prefs.household=Math.max(1,Math.min(12,Number(state.prefs.household)||4));state.prefs.recipeNotes=state.prefs.recipeNotes||{};state.prefs.leftovers=state.prefs.leftovers||{};state.prefs.customRecipes=state.prefs.customRecipes||[];
}
function savePrefs(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.prefs));}catch{}}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),1800);}

async function init(){
  loadPrefs();
  try{
    const [rr,mr]=await Promise.all([fetch('recipes.json?refresh=final'),fetch('menus.json?refresh=final')]);
    state.recipes=await rr.json();
    state.menus=await mr.json();
    if(state.prefs.customRecipes?.length){const ids=new Set(state.recipes.map(r=>r.id));state.recipes.push(...state.prefs.customRecipes.filter(r=>!ids.has(r.id)));}
  }catch(e){
    document.body.innerHTML='<div style="padding:30px;color:white;font-family:sans-serif">Impossible de charger les données. Ouvre l’application via un petit serveur web ou depuis son hébergement PWA.</div>';
    return;
  }
  buildStaticUI();
  bindEvents();
  applyModeButtons();
  renderAll();
  const allowed=['home','recipes','menus','planning','fridge','shopping'];
  navigate(allowed.includes(state.prefs.lastPage)?state.prefs.lastPage:'home',false,false);
}

function buildStaticUI(){
  $('#heroModeButtons').innerHTML=Object.entries(MODE_META).map(([k,v])=>`<button class="mode-card mode-${k}" data-mode="${k}"><strong>${escapeHtml(v.short)}</strong><small>${escapeHtml(v.desc)}</small></button>`).join('');
  $('#settingsMode').innerHTML=Object.entries(MODE_META).map(([k,v])=>`<button data-mode="${k}">${escapeHtml(v.short)}</button>`).join('');
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
  $('#backToRecipeCategories').onclick=()=>{state._showAllRecipes=false;resetFilters(false);renderRecipes(true);};
  $('#favoriteTopBtn').onclick=()=>{state.filters.favoritesOnly=true;$('#favoritesOnly').checked=true;navigate('recipes');renderRecipes(true);};
  $('#surpriseTopBtn').onclick=()=>openSurprise(true);$('#homeSurpriseBtn').onclick=()=>openSurprise(true);
  $('#settingsBtn').onclick=()=>openSettings(true);if($('#guideTopBtn'))$('#guideTopBtn').onclick=()=>openKitchenGuide(true);if($('#openKitchenGuideBtn'))$('#openKitchenGuideBtn').onclick=()=>openKitchenGuide(true);$$('[data-close-guide]').forEach(x=>x.onclick=()=>openKitchenGuide(false));$$('[data-close-settings]').forEach(x=>x.onclick=()=>openSettings(false));$$('[data-close-drawer]').forEach(x=>x.onclick=closeRecipe);$$('[data-close-menu]').forEach(x=>x.onclick=closeMenuDrawer);$$('[data-close-surprise]').forEach(x=>x.onclick=()=>openSurprise(false));$$('[data-close-plan]').forEach(x=>x.onclick=()=>openPlanAssign(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeRecipe();closeMenuDrawer();openFilterDrawer(false);openSettings(false);openSurprise(false);openPlanAssign(false);openCustomRecipe(false);openKitchenGuide(false);closeExport();closeCook();}});
  $('#clearFridgeBtn').onclick=()=>{state.prefs.pantry=[];savePrefs();renderPantry();renderFridgeResults();toast('Sélection vidée');};$('#fridgeSearch').addEventListener('input',()=>{state.pantryGroup=$('#fridgeSearch').value.trim()?'__search__':'';renderPantry();});
  $('#addCustomPantryBtn').onclick=addCustomPantryIngredient;$('#customPantryInput').addEventListener('keydown',e=>{if(e.key==='Enter')addCustomPantryIngredient();});$('#showAllPantryBtn').onclick=()=>{state.pantryGroup='__all__';$('#fridgeSearch').value='';renderPantry();};$('#closePantryGroupBtn').onclick=()=>{state.pantryGroup='';$('#fridgeSearch').value='';renderPantry();};
  $('#menuSearch').addEventListener('input',e=>{state.menuSearch=e.target.value.trim();renderMenus();});$('#menuFavoritesBtn').onclick=()=>{state.menuFilter=state.menuFilter==='__favorites__'?'':'__favorites__';renderMenus();};$('#resetMenuFiltersBtn').onclick=()=>{state.menuUniverse='__all__';state.menuFilter='';state.menuSearch='';$('#menuSearch').value='';renderMenuUniverses();renderMenus();};$('#backToMenuUniverses').onclick=()=>{state.menuUniverse='';state.menuFilter='';renderMenuUniverses();renderMenus();};
  $('#copyShoppingBtn').onclick=copyShopping;if($('#shareShoppingBtn'))$('#shareShoppingBtn').onclick=shareShopping;if($('#printShoppingBtn'))$('#printShoppingBtn').onclick=printShopping;$('#clearShoppingBtn').onclick=()=>{if(!state.prefs.shopping.length&&!state.prefs.manualShopping.length)return;state.prefs.shopping=[];state.prefs.manualShopping=[];state.prefs.shoppingDone=[];savePrefs();renderShopping();toast('Liste vidée');};
  $('#resetPrefsBtn').onclick=()=>{state.prefs={...DEFAULT_PREFS,household:state.prefs.household,favorites:state.prefs.favorites,favoriteMenus:state.prefs.favoriteMenus,menuOverrides:state.prefs.menuOverrides,shopping:state.prefs.shopping,manualShopping:state.prefs.manualShopping,shoppingDone:state.prefs.shoppingDone,pantry:state.prefs.pantry,pantryFavorites:state.prefs.pantryFavorites,pantryRecent:state.prefs.pantryRecent,planning:state.prefs.planning,recipeNotes:state.prefs.recipeNotes,leftovers:state.prefs.leftovers,customRecipes:state.prefs.customRecipes};savePrefs();buildStaticUI();bindDynamicUI();applyModeButtons();renderAll();toast('Préférences réinitialisées');};
  if($('#guidedModeToggle'))$('#guidedModeToggle').onchange=e=>{state.prefs.guided=e.target.checked;savePrefs();toast(state.prefs.guided?'Mode accompagné activé':'Mode accompagné désactivé');};
  $('#clearPlanningBtn').onclick=()=>{state.prefs.planning={};savePrefs();renderPlanning();toast('Planning vidé');};$('#planningToShoppingBtn').onclick=planningToShopping;$('#openMenusFromPlanningBtn').onclick=()=>navigate('menus');$('#planLunchBtn').onclick=()=>setPlanSlot('lunch');$('#planDinnerBtn').onclick=()=>setPlanSlot('dinner');$('#confirmPlanBtn').onclick=confirmPlanAssignment;
  $('#generateSurpriseBtn').onclick=generateSurprise;$$('[data-surprise-time]').forEach(b=>b.onclick=()=>{state.surpriseTime=b.dataset.surpriseTime;$$('[data-surprise-time]').forEach(x=>x.classList.toggle('active',x===b));});
  $('#closeCookBtn').onclick=closeCook;$('#cookPrevBtn').onclick=()=>moveCook(-1);$('#cookNextBtn').onclick=()=>moveCook(1);$('#cookTimerBtn').onclick=toggleTimerPanel;$('#timerToggleBtn').onclick=toggleTimer;$('#timerResetBtn').onclick=resetTimer;
  $$('[data-close-export]').forEach(x=>x.onclick=closeExport);$('#downloadExportBtn').onclick=downloadExportImage;$('#shareExportBtn').onclick=shareExportImage;$('#exportCharacter').onchange=renderExportCanvas;$$('[data-export-format]').forEach(b=>b.onclick=()=>{state.export.format=b.dataset.exportFormat;$$('[data-export-format]').forEach(x=>x.classList.toggle('active',x===b));renderExportCanvas();});$$('[data-export-style]').forEach(b=>b.onclick=()=>{state.export.style=b.dataset.exportStyle;$$('[data-export-style]').forEach(x=>x.classList.toggle('active',x===b));renderExportCanvas();});
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
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));
  state.prefs.lastPage=page;savePrefs();
  $('#topBackBtn').classList.toggle('hidden',page==='home' && state.pageHistory.length===0);
  if(scroll)window.scrollTo({top:0,behavior:'smooth'});
  if(page==='fridge'){renderPantry();renderFridgeResults();}
  if(page==='shopping')renderShopping();
  if(page==='planning')renderPlanning();
  if(page==='menus')renderMenus();
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
function openSettings(open){$('#settingsDrawer').classList.toggle('open',open);$('#settingsDrawer').setAttribute('aria-hidden',String(!open));}

function openFilterDrawer(open){
  $('#filterDrawer').classList.toggle('open',open);
  $('#filterDrawer').setAttribute('aria-hidden',String(!open));
  if(open)document.body.style.overflow='hidden';else if(!$('#recipeDrawer').classList.contains('open')&&!$('#menuDrawer').classList.contains('open'))document.body.style.overflow='';
}
function applyQuickFilter(type,btn){
  if(type==='time20'){state.filters.time=state.filters.time==='20'?'':'20';$('#timeFilter').value=state.filters.time;}
  if(type==='mode'){let eq='';if(state.prefs.mode==='tm6')eq='TM6';else if(state.prefs.mode==='classic')eq='Cuisine classique';else{const devices=['Air fryer','Multicuiseur / Cookeo','Blender / mixeur','Robot pâtissier'];eq=devices.find(d=>(state.prefs.equipment||[]).includes(d))||'';}state.filters.equipment=state.filters.equipment===eq?'':eq;$('#equipmentFilter').value=state.filters.equipment;}
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
  box.querySelectorAll('[data-library-category]').forEach(b=>b.onclick=()=>{state.filters.category=b.dataset.libraryCategory;state.filters.subtype='';state._showAllRecipes=false;$('#categoryFilter').value=state.filters.category;renderRecipes(true);});
  const cbox=$('#recipeCuisineHighlights');if(cbox){const top=[...new Set(state.recipes.map(r=>r.cuisine).filter(x=>x&&x!=='Contemporaine / maison'))].map(c=>[c,state.recipes.filter(r=>r.cuisine===c).length]).sort((a,b)=>b[1]-a[1]).slice(0,12);cbox.innerHTML=top.map(([c,n])=>`<button class="mini-pill" data-library-cuisine="${escapeHtml(c)}">${escapeHtml(c)} <small>${n}</small></button>`).join('');cbox.querySelectorAll('[data-library-cuisine]').forEach(b=>b.onclick=()=>{state.filters.cuisine=b.dataset.libraryCuisine;state.filters.category='';state._showAllRecipes=false;$('#cuisineFilter').value=state.filters.cuisine;renderRecipes(true);});}
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
  if(f.time)arr=arr.filter(r=>totalTime(r)<=Number(f.time));
  if(f.equipment)arr=arr.filter(r=>(r.equipment||[]).includes(f.equipment));
  if(f.style)arr=arr.filter(r=>(r.styles||[]).includes(f.style));
  if(f.mealOnly)arr=arr.filter(r=>isMainCourseCategory(r.category));
  if(f.favoritesOnly)arr=arr.filter(r=>state.prefs.favorites.includes(r.id));
  if(f.fridgeOnly&&state.prefs.pantry.length){const have=new Set(state.prefs.pantry.map(norm));arr=arr.filter(r=>r.ingredients.some(i=>have.has(norm(i.name))));}
  return arr.sort((a,b)=>(Number(b.featured)-Number(a.featured))||a.name.localeCompare(b.name,'fr'));
}
function resetFilters(render=true){
  state.filters={query:'',category:'',subtype:'',cuisine:'',time:'',equipment:'',style:'',favoritesOnly:false,fridgeOnly:false,mealOnly:false};state._showAllRecipes=false;
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
  const favCats=state.prefs.favorites.map(id=>state.recipes.find(r=>r.id===id)?.category).filter(Boolean);const recentCats=state.prefs.recentCategories||[];const preferredEq=state.prefs.mode==='tm6'?'TM6':state.prefs.mode==='classic'?'Cuisine classique':'';
  const scored=state.recipes.filter(passesRestrictions).map(r=>{let score=0;if(favCats.includes(r.category))score+=4;if(recentCats.includes(r.category))score+=3;if(preferredEq&&(r.equipment||[]).includes(preferredEq))score+=2;if((r.styles||[]).includes('Cuisine facile'))score+=1;if(r.featured)score+=1;return{r,score};}).sort((a,b)=>b.score-a.score||a.r.name.localeCompare(b.r.name,'fr'));
  const buckets=[
    r=>isMainCourseCategory(r.category)&&r.category!=='Végétarien',
    r=>['Légumes & accompagnements','Végétarien'].includes(r.category),
    r=>totalTime(r)<=20&&isMainCourseCategory(r.category),
    r=>['Petit-déjeuner','Entrées & salades','Soupes & veloutés'].includes(r.category),
    r=>r.category==='Desserts',
    r=>r.category==='Boissons & smoothies'
  ];
  const picked=[];for(const test of buckets){const found=scored.find(x=>test(x.r)&&!picked.some(p=>p.id===x.r.id));if(found)picked.push(found.r);}for(const x of scored){if(picked.length>=6)break;if(!picked.some(p=>p.id===x.r.id))picked.push(x.r);}return picked.slice(0,6);
}
function openSurprise(open){
  $('#surpriseDrawer').classList.toggle('open',open);$('#surpriseDrawer').setAttribute('aria-hidden',String(!open));
  if(open){document.body.style.overflow='hidden';$('#surpriseDrawerGrid').innerHTML='';}else if(!$('#recipeDrawer').classList.contains('open')&&!$('#menuDrawer').classList.contains('open'))document.body.style.overflow='';
}
function generateSurprise(){
  const max=state.surpriseTime?Number(state.surpriseTime):Infinity;
  const mealOnly=$('#surpriseMealOnly')?.checked;
  const eq=state.prefs.mode==='tm6'?'TM6':state.prefs.mode==='classic'?'Cuisine classique':'';
  let pool=state.recipes.filter(passesRestrictions).filter(r=>totalTime(r)<=max).filter(r=>!mealOnly||isMainCourseCategory(r.category)).filter(r=>!eq||(r.equipment||[]).includes(eq));
  if(pool.length<3)pool=state.recipes.filter(passesRestrictions).filter(r=>totalTime(r)<=max).filter(r=>!mealOnly||isMainCourseCategory(r.category));
  const pick=[];const copy=[...pool];while(copy.length&&pick.length<3)pick.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]);
  $('#surpriseDrawerGrid').innerHTML=pick.length?pick.map(recipeCard).join(''):'<div class="shopping-empty">Aucune recette ne correspond exactement. Essaie un temps plus large.</div>';
  bindRecipeCards($('#surpriseDrawerGrid'));
}
function renderHome(){const forYou=personalizedRecipes();$('#forYouGrid').innerHTML=forYou.map(recipeCard).join('');bindRecipeCards($('#forYouGrid'));}
function supportBadge(r){
  if(r.tm6Status==='full') return 'TM6 complet';
  if(r.tm6Status==='aid') return 'TM6 en aide';
  if((r.equipment||[]).includes('Cuisine classique')) return 'Ustensiles & four';
  return (r.equipment||[])[0]||'Polyvalent';
}

function recipeCard(r,extra=''){
  const fav=state.prefs.favorites.includes(r.id),image=imgSrc(r),times=totalTime(r);const mains=(r.ingredients||[]).slice(0,3).map(i=>i.name).join(' · ');
  return `<article class="recipe-card" ${extra}><div class="recipe-image ${image?'':'no-image'}">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(r.name)}" loading="lazy">`:`<div class="recipe-placeholder"><span>${r.emoji||categoryIcon[r.category]||'🍽️'}</span><strong>${escapeHtml(r.subtype||r.category)}</strong><small>${escapeHtml(mains)}</small></div>`}<button class="fav-btn ${fav?'active':''}" data-fav="${r.id}" aria-label="Favori">${fav?'♥':'♡'}</button></div><div class="recipe-body"><span class="recipe-category-line">${escapeHtml(r.category)} · ${escapeHtml(r.cuisine||'Cuisine maison')}</span><h3 class="recipe-title">${escapeHtml(r.name)}</h3><div class="recipe-meta recipe-meta-simple"><span>⏱ ${times||'—'} min</span><span>${escapeHtml(supportBadge(r))}</span>${r.macros?.proteines?`<span>💪 ${escapeHtml(r.macros.proteines)} g / pers.</span>`:''}</div><div class="card-actions"><button class="open-btn" data-open="${r.id}">Voir la recette</button><button class="shop-btn icon-shop" data-shop="${r.id}" aria-label="Ajouter aux courses">＋</button></div></div></article>`;
}
function bindRecipeCards(root=document){
  root.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openRecipe(b.dataset.open));
  root.querySelectorAll('[data-shop]').forEach(b=>b.onclick=()=>addToShopping(b.dataset.shop));
  root.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFavorite(b.dataset.fav);});
}
function renderRecipes(resetVisible=false){
  if(resetVisible)state.visible=48;renderActiveFilterSummary();
  const hasIntent=Boolean(state._showAllRecipes||state.filters.query||state.filters.category||state.filters.cuisine||state.filters.time||state.filters.equipment||state.filters.style||state.filters.favoritesOnly||state.filters.fridgeOnly||state.filters.mealOnly);
  $('#recipeLibraryHome').classList.toggle('hidden',hasIntent);$('#recipeResultsArea').classList.toggle('hidden',!hasIntent);
  if(!hasIntent){$('#recipesCountLabel').textContent=`${state.recipes.length} recettes rangées dans 13 grandes familles`;renderRecipeLibrary();return;}
  renderSubCategoryChips();const arr=filteredRecipes();
  const crumbs=['Recettes'];if(state.filters.category)crumbs.push(state.filters.category);if(state.filters.subtype)crumbs.push(state.filters.subtype);if(state.filters.cuisine&&!state.filters.category)crumbs.push(state.filters.cuisine);$('#recipeBreadcrumb').innerHTML=crumbs.map((x,i)=>`<span class="${i===crumbs.length-1?'current':''}">${escapeHtml(x)}</span>`).join('<b>›</b>');
  $('#recipesCountLabel').textContent=`${arr.length} recette${arr.length>1?'s':''} dans cette sélection`;$('#recipesGrid').innerHTML=arr.slice(0,state.visible).map(recipeCard).join('');bindRecipeCards($('#recipesGrid'));$('#loadMoreBtn').classList.toggle('hidden',state.visible>=arr.length);
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
  {id:'daily',title:'Rapide & quotidien',icon:'⚡',desc:'Pour les soirs de semaine et les repas sans prise de tête.',tags:['Express','Quotidien','Cuisine facile']},
  {id:'family',title:'Famille & petit budget',icon:'🏠',desc:'Des menus généreux, pratiques et économiques.',tags:['Familial','Petit budget']},
  {id:'balance',title:'Léger & équilibré',icon:'🥗',desc:'Des menus frais ou plus légers sans sacrifier le plaisir.',tags:['Léger','Poisson']},
  {id:'goals',title:'Protéiné & végétal',icon:'🌿',desc:'Pour varier entre protéines, légumes et menus végétaux.',tags:['Protéiné','Végétal']},
  {id:'organize',title:'Organisation & matériel',icon:'🗓️',desc:'Batch cooking, TM6, four et autres appareils.',tags:['Batch cooking','TM6','Four','Autres appareils']},
  {id:'escape',title:'Brunch, monde & week-end',icon:'🌍',desc:'Pour changer du quotidien, recevoir ou prendre le temps.',tags:['Brunch','Cuisine du monde','Plaisir / week-end']}
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
  $('#menuDrawerContent').innerHTML=`<div class="menu-detail-head"><span class="kicker">MENU FAFATRAINING</span><h2 id="menuDrawerTitle">${escapeHtml(m.title)}</h2><p>${escapeHtml(m.subtitle||'')}</p><div class="tag-row">${(m.filterTags||m.tags||[]).map(t=>`<span class="style-tag">${escapeHtml(t)}</span>`).join('')}</div><div class="menu-head-actions"><button id="menuFavDetail" class="outline-btn">${fav?'♥ Menu enregistré':'♡ Enregistrer ce menu'}</button>${state.prefs.menuOverrides?.[id]?'<button id="resetMenuOverride" class="outline-btn">Réinitialiser le menu</button>':''}</div></div><div class="menu-detail-recipes">${ids.map((rid,i)=>{const r=state.recipes.find(x=>x.id===rid);if(!r)return'';return `<article class="menu-recipe-row"><div class="menu-recipe-thumb ${imgSrc(r)?'':'no-image'}">${imgSrc(r)?`<img src="${escapeHtml(imgSrc(r))}" alt="">`:`<span>${categoryIcon[r.category]||'🍽️'}</span>`}</div><div class="menu-recipe-info"><span>${labels[i]||'Recette'}</span><strong>${escapeHtml(r.name)}</strong><small>⏱ ${totalTime(r)||'—'} min · ${escapeHtml(supportBadge(r))}</small></div><div class="menu-recipe-actions"><button data-menu-recipe-open="${rid}">Ouvrir</button><button data-menu-replace="${id}|${i}">Remplacer</button></div></article>`;}).join('')}</div><div class="menu-detail-footer"><button class="primary-btn" data-shop-menu="${m.id}">Ajouter tout aux courses</button><button class="outline-btn" id="planMenuBtn">Ajouter au planning</button><button class="outline-btn" data-export-menu="${m.id}">Créer le visuel</button></div>`;
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
  getMenuRecipeIds(m).forEach(rid=>{const r=state.recipes.find(x=>x.id===rid);if(!r)return;const target=state.prefs.household||4;const ex=state.prefs.shopping.find(x=>x.id===rid);if(ex)ex.servings=Math.max(ex.servings||0,target);else state.prefs.shopping.push({id:rid,servings:target});});
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
  const servings=state.planAssign.type==='recipe'?(state.currentRecipe?.id===state.planAssign.id?state.currentServings:state.prefs.household):(state.prefs.household||4);state.prefs.planning[key]={type:state.planAssign.type,id:state.planAssign.id,servings};savePrefs();openPlanAssign(false);renderPlanning();toast('Ajouté au planning');
}
function planningEntryLabel(entry){
  if(!entry)return null;if(entry.type==='menu'){const m=state.menus.find(x=>x.id===entry.id);return m?{title:m.title,meta:`Menu complet · ${entry.servings||state.prefs.household||4} pers.`,emoji:'📋'}:null;}
  const r=state.recipes.find(x=>x.id===entry.id);return r?{title:r.name,meta:`${totalTime(r)||'—'} min · ${entry.servings||state.prefs.household||4} pers. · ${supportBadge(r)}`,emoji:categoryIcon[r.category]||'🍽️'}:null;
}
function renderPlanning(){
  const grid=$('#planningGrid');if(!grid)return;let filled=0;
  grid.innerHTML=PLAN_DAYS.map(([day,label])=>`<section class="plan-day"><h3>${label}</h3>${PLAN_SLOTS.map(([slot,slotLabel])=>{const key=`${day}-${slot}`,entry=state.prefs.planning[key],info=planningEntryLabel(entry);if(info)filled++;return `<div class="plan-slot ${info?'filled':''}"><span class="plan-slot-label">${slotLabel}</span>${info?`<strong>${escapeHtml(info.title)}</strong><small>${escapeHtml(info.meta)}</small><div class="plan-slot-actions"><button data-plan-open="${key}">Ouvrir</button><button data-plan-remove="${key}">Retirer</button></div>`:`<button class="plan-empty-btn" data-plan-browse="${day}|${slot}">+ Ajouter</button>`}</div>`;}).join('')}</section>`).join('');
  $('#planningSummary').textContent=`${filled} repas planifié${filled>1?'s':''} sur 14`;
  $$('[data-plan-remove]').forEach(b=>b.onclick=()=>{delete state.prefs.planning[b.dataset.planRemove];savePrefs();renderPlanning();});
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
  totals.forEach((servings,id)=>{const r=state.recipes.find(x=>x.id===id);if(!r)return;const ex=state.prefs.shopping.find(e=>e.id===id);if(ex)ex.servings=servings;else state.prefs.shopping.push({id,servings});});
  savePrefs();renderShopping();toast('Courses de la semaine ajoutées');navigate('shopping');
}

function availableDevices(r){return Object.keys(r.deviceModes||{}).filter(k=>(r.deviceModes[k]||[]).length);}
function getSteps(r,mode){
  if(mode==='tm6'&&r.tm6Status==='none')return r.modes?.classic||[];
  if(mode==='tm6')return r.modes?.tm6||r.modes?.classic||[];
  if(mode==='classic')return r.modes?.classic||r.modes?.tm6||[];
  if(mode==='robot'){
    const dev=state.currentDeviceMode||availableDevices(r)[0];
    if(dev&&r.deviceModes?.[dev])return r.deviceModes[dev];
    return r.modes?.classic||r.modes?.tm6||[];
  }
  return r.modes?.classic||r.modes?.tm6||[];
}
function openRecipe(id,open=true){
  const r=state.recipes.find(x=>x.id===id);if(!r)return;state.currentRecipe=r;
  const devices=availableDevices(r);
  if(open){
    state.currentServings=state.prefs.household||r.servings||4;
    state.currentDrawerMode=(state.prefs.mode==='tm6'&&r.tm6Status==='none')?'classic':state.prefs.mode;
    if(state.currentDrawerMode==='robot'&&!devices.length)state.currentDrawerMode='classic';
    state.currentDeviceMode=devices[0]||'';
    state.prefs.recentCategories=[r.category,...(state.prefs.recentCategories||[]).filter(x=>x!==r.category)].slice(0,5);
    state.prefs.recentRecipes=[r.id,...(state.prefs.recentRecipes||[]).filter(x=>x!==r.id)].slice(0,12);savePrefs();
  }
  if(state.currentDrawerMode==='robot'&&!state.currentDeviceMode)state.currentDeviceMode=devices[0]||'';
  const factor=state.currentServings/(r.servings||1),steps=getSteps(r,state.currentDrawerMode),image=imgSrc(r),fav=state.prefs.favorites.includes(r.id);
  const allergens=(r.allergens||[]).map(a=>allergenLabels[a]||a.replaceAll('_',' '));
  const modeText=state.currentDrawerMode==='tm6'?'Thermomix TM6':state.currentDrawerMode==='classic'?'casserole, poêle, four et ustensiles':(deviceLabels[state.currentDeviceMode]||'appareil sélectionné');
  const per=r.macros||{};const total={kcal:Math.round((Number(per.kcal)||0)*state.currentServings),proteines:Math.round((Number(per.proteines)||0)*state.currentServings*10)/10,glucides:Math.round((Number(per.glucides)||0)*state.currentServings*10)/10,lipides:Math.round((Number(per.lipides)||0)*state.currentServings*10)/10};
  const techniques=(r.techniques||[]).map(t=>`<span class="style-tag">${escapeHtml(t)}</span>`).join('');
  const deviceButtons=devices.map(d=>`<button data-device-mode="${d}" class="${state.currentDeviceMode===d?'active':''}">${escapeHtml(deviceLabels[d]||d)}</button>`).join('');
  $('#drawerContent').innerHTML=`<div class="drawer-hero cooking-first-hero"><div class="drawer-cover">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(r.name)}">`:`<span>${r.emoji||'🍽️'}</span>`}</div><div class="drawer-head"><span class="kicker">${escapeHtml(r.category)}</span><h2 id="drawerTitle">${escapeHtml(r.name)}</h2><div class="drawer-meta primary-meta"><span>⏱ ${totalTime(r)||'—'} min</span><span>👥 ${state.currentServings} pers.</span><span>${escapeHtml(supportBadge(r))}</span>${r.cuisine?`<span>🌍 ${escapeHtml(r.cuisine)}</span>`:''}</div><p>${escapeHtml(r.description||'')}</p><div class="drawer-actions main-cook-actions"><button class="primary big-cook-btn" id="startCookBtn">▶ Commencer à cuisiner</button><button id="drawerShopBtn">+ Courses</button><button id="drawerPlanBtn">▤ Planifier</button><button id="drawerFavBtn">${fav?'♥ Favori':'♡ Favori'}</button><button id="drawerExportBtn">Créer le visuel</button></div></div></div>
  <div class="mode-row mode-choice-box"><span class="kicker">JE CUISINE AVEC</span><div class="segmented" id="drawerModes">${r.tm6Status!=='none'?`<button data-drawer-mode="tm6" class="${state.currentDrawerMode==='tm6'?'active':''}">${r.tm6Status==='full'?'TM6 complet':'TM6 en aide'}</button>`:''}<button data-drawer-mode="classic" class="${state.currentDrawerMode==='classic'?'active':''}">Ustensiles & four</button>${devices.length?`<button data-drawer-mode="robot" class="${state.currentDrawerMode==='robot'?'active':''}">Robots & appareils</button>`:''}</div><p class="small-note">Les étapes affichées correspondent à ${escapeHtml(modeText)}. La recette reste toujours réalisable sans robot grâce au mode Ustensiles & four.</p>${state.currentDrawerMode==='robot'&&devices.length?`<div class="device-selector"><span>Choisis ton appareil</span><div class="segmented" id="deviceModes">${deviceButtons}</div></div>`:''}</div>
  <div class="serving-preset-box"><span class="kicker">POUR COMBIEN ?</span><div class="segmented serving-presets">${[1,2,3,4,6].map(n=>`<button data-serving-preset="${n}" class="${state.currentServings===n?'active':''}">${n}</button>`).join('')}<button data-serving-preset="plus" class="${![1,2,3,4,6].includes(state.currentServings)?'active':''}">${state.currentServings>6?state.currentServings:'+'}</button></div><p class="small-note">Les ingrédients s’adaptent au nombre de personnes. Pour le sel et les épices, augmente progressivement et goûte.</p></div>
  <div class="drawer-grid"><section class="drawer-section ingredients-main"><div class="section-title-row"><div><span class="kicker">AVANT DE COMMENCER</span><h3>Ingrédients</h3></div></div><div class="ingredient-list checklist">${r.ingredients.map(i=>`<label class="ingredient-check"><input type="checkbox"><span>${escapeHtml(i.name)}</span><strong>${formatQty(Number(i.qty||0)*factor)} ${escapeHtml(i.unit||'')}</strong></label>`).join('')}</div></section>
  <section class="drawer-section nutrition-section"><span class="kicker">REPÈRES NUTRITIONNELS</span><h3>Par portion / 1 personne</h3><div class="ingredient-list"><div class="ingredient-row"><span>Calories</span><span>≈ ${per.kcal??'—'} kcal</span></div><div class="ingredient-row"><span>Protéines</span><span>≈ ${per.proteines??'—'} g</span></div><div class="ingredient-row"><span>Glucides</span><span>≈ ${per.glucides??'—'} g</span></div><div class="ingredient-row"><span>Lipides</span><span>≈ ${per.lipides??'—'} g</span></div></div><button id="nutritionTotalBtn" class="nutrition-total-btn">Voir le total pour ${state.currentServings} personne${state.currentServings>1?'s':''}</button><div id="nutritionTotalBox" class="nutrition-total-box hidden"><strong>Total de la recette · ${state.currentServings} personne${state.currentServings>1?'s':''}</strong><div class="ingredient-list"><div class="ingredient-row"><span>Calories</span><span>≈ ${total.kcal} kcal</span></div><div class="ingredient-row"><span>Protéines</span><span>≈ ${total.proteines} g</span></div><div class="ingredient-row"><span>Glucides</span><span>≈ ${total.glucides} g</span></div><div class="ingredient-row"><span>Lipides</span><span>≈ ${total.lipides} g</span></div></div></div><p class="small-note">${escapeHtml(r.nutritionBasis||'Valeurs indicatives par portion.')}</p>${allergens.length?`<div class="allergen-box"><strong>Contient / peut contenir :</strong> ${escapeHtml(allergens.join(', '))}</div>`:''}</section>
  <section class="drawer-section full-width-section learning-section"><span class="kicker">APPRENDRE EN CUISINANT</span><h3>Ce que tu vas pratiquer</h3><div class="style-tags">${techniques||'<span class="style-tag">mise en place</span>'}</div>${r.safetyTip?`<div class="safety-box"><strong>Repère sécurité</strong><p>${escapeHtml(r.safetyTip)}</p></div>`:''}<p class="small-note">${escapeHtml(r.storage||'Conserve les restes rapidement au réfrigérateur dans une boîte fermée.')}</p></section>
  <section class="drawer-section full-width-section"><span class="kicker">APERÇU</span><h3>Les étapes</h3><div class="steps-list compact-steps">${steps.map((st,i)=>`<div class="step-box"><strong>${i+1}. ${escapeHtml(st.title||'Étape')}</strong><p>${escapeHtml(st.text||'')}</p>${st.durationSec?`<small>⏱ ${Math.max(1,Math.round(st.durationSec/60))} min</small>`:''}</div>`).join('')}</div></section>
  <section class="drawer-section full-width-section"><span class="kicker">ASTUCES</span><h3>Conseils & adaptations</h3><div class="steps-list">${(r.tips||[]).map(t=>`<div class="step-box"><p>${escapeHtml(t)}</p></div>`).join('')}${(r.substitutions||[]).slice(0,6).map(t=>`<div class="step-box"><p>↔ ${escapeHtml(t)}</p></div>`).join('')}</div></section>
  <section class="drawer-section full-width-section personal-recipe-section"><span class="kicker">MES REPÈRES</span><h3>Notes & restes</h3><label class="form-label">Ma note<textarea id="recipeNoteField" class="drawer-textarea" placeholder="Ex. 5 min de plus, moins de sel la prochaine fois…">${escapeHtml(state.prefs.recipeNotes[r.id]||'')}</textarea></label><div class="leftover-row"><span>Portions restantes</span><div class="segmented">${[0,1,2,3,4,5,6].map(n=>`<button data-leftover="${n}" class="${Number(state.prefs.leftovers[r.id]||0)===n?'active':''}">${n}</button>`).join('')}</div></div><p class="small-note">Ces informations restent enregistrées sur ton appareil et peuvent être incluses dans ta sauvegarde.</p></section></div>`;
  $('#drawerModes').querySelectorAll('[data-drawer-mode]').forEach(b=>b.onclick=()=>{state.currentDrawerMode=b.dataset.drawerMode;if(state.currentDrawerMode==='robot'&&!state.currentDeviceMode)state.currentDeviceMode=devices[0]||'';openRecipe(r.id,false);});
  if($('#deviceModes'))$('#deviceModes').querySelectorAll('[data-device-mode]').forEach(b=>b.onclick=()=>{state.currentDeviceMode=b.dataset.deviceMode;openRecipe(r.id,false);});
  $$('[data-serving-preset]').forEach(b=>b.onclick=()=>{const v=b.dataset.servingPreset;if(v==='plus')state.currentServings=Math.min(12,state.currentServings+1);else state.currentServings=Number(v);openRecipe(r.id,false);});
  if($('#nutritionTotalBtn'))$('#nutritionTotalBtn').onclick=()=>{const box=$('#nutritionTotalBox');box.classList.toggle('hidden');$('#nutritionTotalBtn').textContent=box.classList.contains('hidden')?`Voir le total pour ${state.currentServings} personne${state.currentServings>1?'s':''}`:'Masquer le total';};
  $('#drawerShopBtn').onclick=()=>addToShopping(r.id,state.currentServings);$('#drawerPlanBtn').onclick=()=>openPlanAssign(true,'recipe',r.id);$('#drawerExportBtn').onclick=()=>openExport('recipe',r.id);$('#drawerFavBtn').onclick=()=>toggleFavorite(r.id);$('#startCookBtn').onclick=()=>startCook(r,state.currentDrawerMode);
  if($('#recipeNoteField'))$('#recipeNoteField').oninput=e=>{state.prefs.recipeNotes[r.id]=e.target.value;savePrefs();};$$('[data-leftover]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.leftover);if(n)state.prefs.leftovers[r.id]=n;else delete state.prefs.leftovers[r.id];savePrefs();$$('[data-leftover]').forEach(x=>x.classList.toggle('active',x===b));toast(n?`${n} portion${n>1?'s':''} restante${n>1?'s':''}`:'Aucun reste enregistré');});
  if(open){$('#recipeDrawer').classList.add('open');$('#recipeDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
}

function closeRecipe(){ $('#recipeDrawer').classList.remove('open'); $('#recipeDrawer').setAttribute('aria-hidden','true'); if(!$('#cookMode').classList.contains('open')) document.body.style.overflow=''; }
function formatQty(n){ if(!Number.isFinite(n)) return ''; if(Math.abs(n-Math.round(n))<.01) return String(Math.round(n)); return String(Math.round(n*10)/10).replace('.',','); }

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
  const all=pantryIngredients(),q=norm($('#fridgeSearch')?.value||'');const selected=state.prefs.pantry||[];if($('#pantryLibraryCount'))$('#pantryLibraryCount').textContent=`${all.length} ingrédients disponibles`;
  $('#selectedPantry').innerHTML=selected.length?selected.map(n=>`<button class="selected-pill" data-pantry="${escapeHtml(n)}">${escapeHtml(n)} ×</button>`).join(''):'<span class="small-note">Aucun ingrédient sélectionné pour le moment.</span>';
  const recent=(state.prefs.pantryRecent||[]).filter(x=>all.includes(x)||selected.includes(x)).slice(0,12),favs=(state.prefs.pantryFavorites||[]).filter(x=>all.includes(x)||selected.includes(x));$('#pantryRecentBlock').classList.toggle('hidden',!recent.length);$('#pantryFavoritesBlock').classList.toggle('hidden',!favs.length);$('#pantryRecent').innerHTML=pantryButtons(recent);$('#pantryFavorites').innerHTML=pantryButtons(favs,true);
  const groups=pantryGroups(all);const gbox=$('#pantryGroupGrid');gbox.classList.toggle('hidden',Boolean(state.pantryGroup));gbox.innerHTML=Object.entries(groups).map(([g,items])=>`<button class="pantry-group-card" data-pantry-group="${escapeHtml(g)}"><span>${pantryGroupIcon(g)}</span><strong>${escapeHtml(g)}</strong><small>${items.length} ingrédients</small><b>→</b></button>`).join('');gbox.querySelectorAll('[data-pantry-group]').forEach(b=>b.onclick=()=>{state.pantryGroup=b.dataset.pantryGroup;$('#fridgeSearch').value='';renderPantry();});
  let list=[];let title='';if(q){list=all.filter(x=>norm(x).includes(q)).slice(0,100);title=`Résultats pour « ${$('#fridgeSearch').value.trim()} »`;state.pantryGroup='__search__';}else if(state.pantryGroup==='__all__'){list=[...all].sort((a,b)=>a.localeCompare(b,'fr'));title=`Tous les ingrédients · ${all.length}`;}else if(state.pantryGroup&&state.pantryGroup!=='__search__'){list=groups[state.pantryGroup]||[];title=state.pantryGroup;}
  const panel=$('#pantryGroupPanel');panel.classList.toggle('hidden',!list.length&&!state.pantryGroup);if(state.pantryGroup){$('#pantryGroupTitle').textContent=title||'Aucun résultat';$('#pantryGroupItems').innerHTML=list.length?pantryButtons(list,true):'<p class="small-note">Aucun ingrédient trouvé. Tu peux l’ajouter avec le champ « ingrédient absent de la liste ».</p>';}
  document.querySelectorAll('[data-pantry]').forEach(b=>b.onclick=()=>togglePantry(b.dataset.pantry));document.querySelectorAll('[data-pantry-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();togglePantryFavorite(b.dataset.pantryFav);});
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
  if(pantryHasAny(h,['oeuf','lait','yaourt','fromage','creme','beurre','ricotta','feta','mozzarella','parmesan','skyr','tofu','tempeh','mascarpone','fromage blanc','petit-suisse','kefir']))return'Œufs, laitages & alternatives';
  if(pantryHasAny(h,['pate','pates','riz','quinoa','boulgour','semoule','couscous','millet','sarrasin','avoine','flocons d avoine','farine','pain','polenta','orge','gnocchi','épeautre','epeautre','tortilla','nouille','nouilles','vermicelle','vermicelles','biscuit','biscuits','biscuit speculoos','biscuits cuillere','chapelure','granola','maizena','plaques de lasagnes','tortilla','tortillas']))return'Pâtes, riz & céréales';
  if(pantryHasAny(h,['lentille','lentilles','pois chiche','pois chiches','haricot rouge','haricots rouges','haricot blanc','haricots blancs','haricot noir','haricots noirs','pois casse','pois casses','feve','feves']))return'Légumineuses';
  if(pantryHasAny(h,['amande','amandes','noix','noisette','noisettes','pistache','pistaches','cacahuete','cacahuetes','arachide','arachides','noix de cajou','noix de pecan','graine de chia','graines de chia','graine de courge','graines de courge','graine de tournesol','graines de tournesol','graine de sesame','graines de sesame','sesame','lin','chataignes cuites','graines de pavot','pignons']))return'Fruits à coque & graines';
  if(pantryHasAny(h,['persil','menthe','basilic','coriandre','thym','origan','romarin','cumin','paprika','curry','cannelle','gingembre','curcuma','muscade','piment','aneth','estragon','ciboulette','ciboule','citronnelle','herbes de provence','herbes','herbes fraiches','laurier','sauge','cardamome','colombo','epices','epices antillaises','epices cajun','garam masala','ras-el-hanout','zaatar','épice','epice']))return'Herbes & épices';
  if(pantryHasAny(h,['eau','glacons','cafe','cafe froid','the noir','the vert','matcha','poudre de matcha','chicoree']))return'Boissons, café & infusions';
  if(pantryHasAny(h,['huile','vinaigre','moutarde','miel','sirop','sauce','coulis','bouillon','cacao','chocolat','sucre','sel','poivre','olive','capre','tahini','puree de cacahuete','concentre de tomate','tomate concassee','levure','vanille','capres','gelatine','miso','nutella','pesto','tamari','proteine en poudre','fleur d oranger','fleur d’oranger','olives vertes']))return'Épicerie, sauces & condiments';
  return'Autres & placard';
}
function pantryGroups(all){const groups={};all.forEach(x=>(groups[pantryGroupFor(x)]??=[]).push(x));const order=['Légumes & aromates','Fruits','Viandes & volaille','Poissons & fruits de mer','Œufs, laitages & alternatives','Pâtes, riz & céréales','Légumineuses','Fruits à coque & graines','Boissons, café & infusions','Épicerie, sauces & condiments','Herbes & épices','Autres & placard'];const out={};order.forEach(g=>{if(groups[g]?.length)out[g]=groups[g].sort((a,b)=>a.localeCompare(b,'fr'));});return out;}
function pantryGroupIcon(g){return {'Légumes & aromates':'🥕','Fruits':'🍎','Viandes & volaille':'🥩','Poissons & fruits de mer':'🐟','Œufs, laitages & alternatives':'🥚','Pâtes, riz & céréales':'🌾','Légumineuses':'🫘','Fruits à coque & graines':'🥜','Boissons, café & infusions':'☕','Épicerie, sauces & condiments':'🧂','Herbes & épices':'🌿','Autres & placard':'🫙'}[g]||'🍽️';}
function pantryButtons(list,showFav=false){const favs=state.prefs.pantryFavorites||[];return list.map(n=>`<span class="pantry-item-wrap"><button class="pantry-btn ${(state.prefs.pantry||[]).includes(n)?'selected':''}" data-pantry="${escapeHtml(n)}">${escapeHtml(n)}</button>${showFav?`<button class="pantry-star ${favs.includes(n)?'active':''}" data-pantry-fav="${escapeHtml(n)}" aria-label="Favori">${favs.includes(n)?'★':'☆'}</button>`:''}</span>`).join('');}
function togglePantryFavorite(name){const n=canonicalPantryName(name),a=state.prefs.pantryFavorites||[],key=pantryKey(n),exists=a.some(x=>pantryKey(x)===key);state.prefs.pantryFavorites=exists?a.filter(x=>pantryKey(x)!==key):[...a,n];savePrefs();renderPantry();}
function addCustomPantryIngredient(){const input=$('#customPantryInput'),raw=input.value.trim();if(!raw)return;const n=canonicalPantryName(raw);if(!state.prefs.pantry.some(x=>pantryKey(x)===pantryKey(n)))state.prefs.pantry.push(n);state.prefs.pantryRecent=[n,...(state.prefs.pantryRecent||[]).filter(x=>pantryKey(x)!==pantryKey(n))].slice(0,20);input.value='';savePrefs();renderPantry();renderFridgeResults();toast(`${n} ajouté`);}
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
  const selected=new Set(sel.map(pantryKey));
  const scored=state.recipes.filter(passesRestrictions).map(r=>{const names=r.ingredients.map(i=>pantryKey(canonicalPantryName(i.name)));const hits=names.filter(n=>selected.has(n)).length;return{r,hits,missing:names.length-hits,ratio:names.length?hits/names.length:0};}).filter(x=>x.hits>0).sort((a,b)=>a.missing-b.missing||b.ratio-a.ratio||b.hits-a.hits);
  const exact=scored.filter(x=>x.missing===0).slice(0,12),one=scored.filter(x=>x.missing===1).slice(0,12),two=scored.filter(x=>x.missing===2).slice(0,12),near=scored.filter(x=>x.missing>2).slice(0,8);
  $('#fridgeResults').innerHTML=renderFridgeTier('Tu peux cuisiner maintenant','Tous les ingrédients principaux sont déjà chez toi.',exact,'100 % PRÊT')+renderFridgeTier('Il te manque 1 ingrédient','Un petit passage par les courses suffit.',one,'PRESQUE PRÊT')+renderFridgeTier('Il te manque 2 ingrédients','Encore très proche de ce que tu as.',two,'FACILE À COMPLÉTER')+renderFridgeTier('Autres idées proches','Plusieurs ingrédients correspondent déjà à ton frigo.',near,'À GARDER EN TÊTE');
  bindRecipeCards($('#fridgeResults'));$$('[data-missing-shop]').forEach(b=>b.onclick=()=>addMissingToShopping(b.dataset.missingShop));
}

function addToShopping(id,servings=null){const r=state.recipes.find(x=>x.id===id);if(!r)return;const target=servings||r.servings||4;const existing=state.prefs.shopping.find(x=>x.id===id);if(existing)existing.servings=target;else state.prefs.shopping.push({id,servings:target});savePrefs();renderShopping();toast('Ajouté aux courses');}
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
  $('#shoppingRecipeChips').innerHTML=entries.map(({e,r})=>`<span class="shopping-recipe-chip">${escapeHtml(r.name)} · ${e.servings||r.servings} pers.<button data-shop-minus="${r.id}">−</button><button data-shop-plus="${r.id}">+</button><button data-remove-shop="${r.id}">×</button></span>`).join('');
  $('#shoppingManualChips').innerHTML=manual.length?manual.map((i,idx)=>`<span class="shopping-recipe-chip manual-chip">Manquant : ${escapeHtml(i.name)}<button data-remove-manual="${idx}">×</button></span>`).join(''):'';
  $$('[data-remove-shop]').forEach(b=>b.onclick=()=>removeFromShopping(b.dataset.removeShop));$$('[data-shop-minus]').forEach(b=>b.onclick=()=>changeShoppingServings(b.dataset.shopMinus,-1));$$('[data-shop-plus]').forEach(b=>b.onclick=()=>changeShoppingServings(b.dataset.shopPlus,1));$$('[data-remove-manual]').forEach(b=>b.onclick=()=>{state.prefs.manualShopping.splice(Number(b.dataset.removeManual),1);savePrefs();renderShopping();});
  const items=shoppingItems();if(!items.length){$('#shoppingList').innerHTML='<div class="shopping-empty">Ajoute une recette, un menu, ton planning ou des ingrédients manquants.</div>';return;}
  const groups={};items.forEach(i=>(groups[groceryGroup(i.name)]??=[]).push(i));$('#shoppingList').innerHTML=Object.entries(groups).map(([g,it])=>`<section class="shopping-group"><h3>${escapeHtml(g)}</h3>${it.map(x=>{const key=slug(x.name+'-'+x.unit);const done=state.prefs.shoppingDone.includes(key);return`<label class="shopping-item ${done?'done':''}"><input type="checkbox" data-shop-done="${key}" ${done?'checked':''}><span><strong>${formatQty(x.qty)} ${escapeHtml(x.unit||'')}</strong> ${escapeHtml(x.name)}</span></label>`;}).join('')}</section>`).join('');$$('[data-shop-done]').forEach(c=>c.onchange=()=>{const k=c.dataset.shopDone;const a=state.prefs.shoppingDone;state.prefs.shoppingDone=c.checked?[...new Set([...a,k])]:a.filter(x=>x!==k);savePrefs();renderShopping();});
}
async function copyShopping(){const items=shoppingItems();if(!items.length)return toast('La liste est vide');const txt=['FAFATRAINING · LISTE DE COURSES','',...items.map(i=>`☐ ${formatQty(i.qty)} ${i.unit||''} ${i.name}`)].join('\n');try{await navigator.clipboard.writeText(txt);toast('Liste copiée');}catch{toast('Copie impossible sur cet appareil');}}
async function shareShopping(){const items=shoppingItems();if(!items.length)return toast('La liste est vide');const text=['FAFATRAINING · LISTE DE COURSES','',...items.map(i=>`☐ ${formatQty(i.qty)} ${i.unit||''} ${i.name}`)].join('\n');if(navigator.share){try{await navigator.share({title:'Liste de courses FAFATRAINING',text});return}catch(e){if(e?.name==='AbortError')return;}}try{await navigator.clipboard.writeText(text);toast('Partage direct indisponible : liste copiée');}catch{toast('Partage indisponible sur cet appareil');}}
function printShopping(){const items=shoppingItems();if(!items.length)return toast('La liste est vide');const w=window.open('','_blank','width=720,height=900');if(!w)return toast('Autorise les fenêtres pop-up pour imprimer');const rows=items.map(i=>`<li>☐ <strong>${formatQty(i.qty)} ${escapeHtml(i.unit||'')}</strong> ${escapeHtml(i.name)}</li>`).join('');w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Liste de courses FAFATRAINING</title><style>body{font-family:system-ui,sans-serif;padding:32px;max-width:760px;margin:auto;color:#111}h1{margin-bottom:8px}p{color:#555}li{padding:8px 0;border-bottom:1px solid #ddd;list-style:none}</style></head><body><h1>FAFATRAINING · Liste de courses</h1><p>${new Date().toLocaleDateString('fr-FR')}</p><ul>${rows}</ul><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();}

function renderAll(){renderHome();renderRecipes();renderMenus();renderPantry();renderFridgeResults();renderPlanning();renderShopping();}

async function startCook(r,mode){state.cook.recipe=r;state.cook.steps=getSteps(r,mode);state.cook.index=0;closeRecipe();$('#cookMode').classList.add('open');$('#cookMode').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';renderCookStep();try{if('wakeLock' in navigator)state._wakeLock=await navigator.wakeLock.request('screen');}catch{}}
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
function moveCook(dir){const c=state.cook;if(dir>0&&c.index===c.steps.length-1){closeCook();toast('Recette terminée !');return;}c.index=Math.max(0,Math.min(c.steps.length-1,c.index+dir));renderCookStep();}
function closeCook(){stopTimer();try{state._wakeLock?.release();}catch{}state._wakeLock=null;$('#cookMode').classList.remove('open');$('#cookMode').setAttribute('aria-hidden','true');document.body.style.overflow='';}
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
