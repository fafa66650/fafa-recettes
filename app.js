
const state = {
  recipes: [],
  restrictions: new Set(),
  pantry: new Set(),
  shopping: [],
  currentRecipe: null
};

const els = {
  statRecipes: document.getElementById('statRecipes'),
  profileSelect: document.getElementById('profileSelect'),
  modeSelect: document.getElementById('modeSelect'),
  goalSelect: document.getElementById('goalSelect'),
  searchInput: document.getElementById('searchInput'),
  categorySelect: document.getElementById('categorySelect'),
  restrictionChips: document.getElementById('restrictionChips'),
  coachPanel: document.getElementById('coachPanel'),
  recipesGrid: document.getElementById('recipesGrid'),
  dynamicTitle: document.getElementById('dynamicTitle'),
  dynamicSubline: document.getElementById('dynamicSubline'),
  modeBadge: document.getElementById('modeBadge'),
  fridgeIngredientList: document.getElementById('fridgeIngredientList'),
  fridgeResults: document.getElementById('fridgeResults'),
  shoppingRecipes: document.getElementById('shoppingRecipes'),
  shoppingList: document.getElementById('shoppingList'),
  substitutionGrid: document.getElementById('substitutionGrid'),
  recipeDrawer: document.getElementById('recipeDrawer'),
  drawerContent: document.getElementById('drawerContent')
};

const restrictionOptions = [
  {key:'vegetarien', label:'Végétarien'},
  {key:'vegan', label:'Vegan'},
  {key:'pescetarien', label:'Pescetarien'},
  {key:'gluten', label:'Sans gluten'},
  {key:'lactose', label:'Sans lactose'},
  {key:'oeufs', label:'Sans œufs'},
  {key:'fruits_a_coque', label:'Sans fruits à coque'},
  {key:'soja', label:'Sans soja'},
  {key:'poisson', label:'Sans poisson'},
  {key:'crustaces', label:'Sans crustacés'}
];

const goalPalette = {
  perte_de_poids: '#2ecc71',
  equilibre: '#ffd166',
  performance: '#ff3b30',
  prise_de_masse: '#ff3b30',
  plaisir: '#9b59b6'
};

const modePalette = {
  classic: '#ff9f1c',
  tm6: '#3498db'
};

function uniq(arr){ return [...new Set(arr)]; }
function escapeHtml(str=''){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}
function currentMode(){ return els.modeSelect.value; }
function currentGoal(){ return els.goalSelect.value; }

async function init(){
  const res = await fetch('recipes.json');
  state.recipes = await res.json();
  els.statRecipes.textContent = state.recipes.length;
  buildRestrictionChips();
  buildCategorySelect();
  buildPantrySelector();
  renderSubstitutionsReference();
  bindEvents();
  updateTheme();
  applyProfilePreset();
  renderRecipes();
  renderShopping();
  calculateMetrics();
}

function bindEvents(){
  els.profileSelect.addEventListener('change', () => {
    applyProfilePreset();
    updateTheme();
    renderRecipes();
  });
  els.modeSelect.addEventListener('change', () => {
    updateTheme();
    renderRecipes();
    if(state.currentRecipe){ openRecipe(state.currentRecipe.id); }
  });
  els.goalSelect.addEventListener('change', () => {
    updateTheme();
    renderRecipes();
  });
  els.searchInput.addEventListener('input', renderRecipes);
  els.categorySelect.addEventListener('change', renderRecipes);
  document.getElementById('calcBtn').addEventListener('click', calculateMetrics);
  document.getElementById('clearFridgeBtn').addEventListener('click', ()=>{ state.pantry.clear(); renderPantry(); renderFridgeResults(); });
  document.getElementById('copyShoppingBtn').addEventListener('click', copyShopping);
  document.getElementById('clearShoppingBtn').addEventListener('click', ()=>{ state.shopping=[]; renderShopping(); });
  document.getElementById('closeDrawerBtn').addEventListener('click', closeDrawer);

  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
}

function applyProfilePreset(){
  const profile = els.profileSelect.value;
  els.coachPanel.classList.toggle('hidden', profile !== 'coach');

  if(profile === 'equilibre' && !els.goalSelect.value) els.goalSelect.value = 'equilibre';
  if(profile === 'perte_de_poids' && !els.goalSelect.value) els.goalSelect.value = 'perte_de_poids';
  if(profile === 'performance' && !els.goalSelect.value) els.goalSelect.value = 'performance';

  const subs = {
    simple: ['Des recettes simples, claires et ouvertes à tous.'],
    equilibre: ['Des recettes pensées pour le quotidien et l’équilibre.'],
    perte_de_poids: ['Des recettes légères, rassasiantes et bien organisées.'],
    performance: ['Des recettes orientées énergie, protéines et récupération.'],
    coach: ['Accès complet : profil, calculs, substitutions, filtres avancés.']
  };
  els.dynamicSubline.textContent = subs[profile][0];
}

function updateTheme(){
  const mode = currentMode();
  const goal = currentGoal() || 'equilibre';
  document.documentElement.style.setProperty('--mode-accent', modePalette[mode]);
  document.documentElement.style.setProperty('--goal-accent', goalPalette[goal] || goalPalette.equilibre);
  els.modeBadge.textContent = mode === 'tm6' ? 'Thermomix TM6' : 'Cuisine classique';

  const goalTitles = {
    perte_de_poids: 'Sélection légère et intelligente',
    equilibre: 'Sélection équilibre & quotidien',
    performance: 'Sélection performance & nutrition',
    plaisir: 'Sélection plaisir & famille',
    '': 'Bibliothèque complète'
  };
  els.dynamicTitle.textContent = goalTitles[currentGoal()] || 'Bibliothèque complète';
}

function buildRestrictionChips(){
  els.restrictionChips.innerHTML = '';
  restrictionOptions.forEach(opt=>{
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = opt.label;
    chip.addEventListener('click', ()=>{
      if(state.restrictions.has(opt.key)) state.restrictions.delete(opt.key);
      else state.restrictions.add(opt.key);
      chip.classList.toggle('selected');
      renderRecipes();
    });
    els.restrictionChips.appendChild(chip);
  });
}

function buildCategorySelect(){
  const cats = uniq(state.recipes.map(r=>r.category)).sort((a,b)=>a.localeCompare(b,'fr'));
  els.categorySelect.innerHTML = '<option value="">Toutes les catégories</option>' + cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function buildPantrySelector(){
  const ingredients = uniq(state.recipes.flatMap(r=>r.ingredients.map(i=>i.name))).sort((a,b)=>a.localeCompare(b,'fr'));
  els.fridgeIngredientList.innerHTML = ingredients.map(name=>`
    <button class="ingredient-btn" data-name="${escapeHtml(name)}">${escapeHtml(name)}</button>
  `).join('');
  els.fridgeIngredientList.querySelectorAll('.ingredient-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const name = btn.dataset.name;
      if(state.pantry.has(name)) state.pantry.delete(name);
      else state.pantry.add(name);
      btn.classList.toggle('selected');
      renderFridgeResults();
    });
  });
}

function recipePassesRestrictions(recipe){
  const rest = state.restrictions;

  if(rest.has('vegetarien') && !recipe.dietTags.includes('vegetarien') && !recipe.dietTags.includes('vegan')) return false;
  if(rest.has('vegan') && !recipe.dietTags.includes('vegan')) return false;
  if(rest.has('pescetarien') && !(recipe.dietTags.includes('pescetarien') || recipe.dietTags.includes('vegetarien') || recipe.dietTags.includes('vegan'))) return false;

  const mapAllergenRestriction = ['gluten','lactose','oeufs','fruits_a_coque','soja','poisson','crustaces'];
  for(const key of mapAllergenRestriction){
    if(rest.has(key) && recipe.allergens.includes(key)) return false;
  }
  return true;
}

function scoreRecipe(recipe){
  let score = 0;
  const goal = currentGoal();
  const profile = els.profileSelect.value;
  const query = els.searchInput.value.toLowerCase().trim();
  const cat = els.categorySelect.value;

  if(goal && recipe.goalTags.includes(goal)) score += 4;
  if(profile === 'simple' && (recipe.category === 'Soupe' || recipe.category === 'Légumes' || recipe.category === 'Pâtes')) score += 1;
  if(profile === 'performance' && (recipe.goalTags.includes('performance') || recipe.category === 'Protéiné')) score += 2;
  if(profile === 'perte_de_poids' && recipe.goalTags.includes('perte_de_poids')) score += 2;
  if(profile === 'equilibre' && recipe.goalTags.includes('equilibre')) score += 2;
  if(query){
    const hay = `${recipe.name} ${recipe.category} ${(recipe.tags||[]).join(' ')} ${recipe.ingredients.map(i=>i.name).join(' ')}`.toLowerCase();
    if(hay.includes(query)) score += 5;
    else return -999;
  }
  if(cat && recipe.category !== cat) return -999;
  if(!recipePassesRestrictions(recipe)) return -999;
  return score;
}

function getFilteredRecipes(){
  return state.recipes
    .map(r=>({recipe:r, score:scoreRecipe(r)}))
    .filter(x=>x.score > -999)
    .sort((a,b)=>b.score - a.score || a.recipe.name.localeCompare(b.recipe.name,'fr'))
    .map(x=>x.recipe);
}

function renderRecipes(){
  updateTheme();
  const list = getFilteredRecipes();
  if(!list.length){
    els.recipesGrid.innerHTML = `<div class="empty-state">Aucune recette ne correspond à tes critères actuels. Essaie d’élargir tes préférences ou de changer d’objectif.</div>`;
    return;
  }
  els.recipesGrid.innerHTML = list.map(recipeCard).join('');
  els.recipesGrid.querySelectorAll('[data-open]').forEach(btn=>btn.addEventListener('click', ()=>openRecipe(btn.dataset.open)));
  els.recipesGrid.querySelectorAll('[data-shop]').forEach(btn=>btn.addEventListener('click', ()=>addToShopping(btn.dataset.shop)));
}

function goalClass(goal){
  return 'goal-' + goal;
}

function displayGoal(recipe){
  const g = recipe.goalTags[0] || 'equilibre';
  const labels = {
    perte_de_poids:'Perte de poids',
    equilibre:'Équilibre',
    performance:'Performance',
    prise_de_masse:'Prise de masse',
    plaisir:'Plaisir'
  };
  return `<span class="goal-pill ${goalClass(g)}">${labels[g] || 'Équilibre'}</span>`;
}

function recipeCard(recipe){
  const mode = currentMode();
  const modeBadgeClass = mode === 'tm6' ? 'mode-tm6' : 'mode-classic';
  const visibleSteps = recipe.modes[mode] || [];
  const dietBadges = recipe.dietTags.filter(x=>x!=='omnivore').slice(0,2).map(d=>`<span class="badge diet">${escapeHtml(d)}</span>`).join('');
  const allergenBadges = recipe.allergens.slice(0,2).map(a=>`<span class="badge allergen">sans ${escapeHtml(a.replace('_',' '))} ?</span>`).join('');
  return `
    <article class="recipe-card">
      <div class="recipe-head">
        <div>
          <div class="inline-badges">
            <span class="badge cat">${recipe.emoji} ${escapeHtml(recipe.category)}</span>
            <span class="badge ${modeBadgeClass}">${mode === 'tm6' ? 'TM6' : 'Classique'}</span>
          </div>
          <h3 class="recipe-title">${escapeHtml(recipe.name)}</h3>
        </div>
        ${displayGoal(recipe)}
      </div>

      <div class="recipe-meta">
        <div class="meta-box"><span>Portions</span><strong>${recipe.servings}</strong></div>
        <div class="meta-box"><span>Kcal</span><strong>${recipe.macros.kcal}</strong></div>
        <div class="meta-box"><span>Protéines</span><strong>${recipe.macros.proteines} g</strong></div>
        <div class="meta-box"><span>Étapes</span><strong>${visibleSteps.length}</strong></div>
      </div>

      <div class="recipe-badges">
        ${dietBadges}
        ${allergenBadges}
      </div>

      <div class="recipe-desc">${escapeHtml(visibleSteps[0]?.text || recipe.tips?.[0] || 'Recette détaillée disponible.')}</div>

      <div class="card-actions">
        <button class="card-btn" data-open="${recipe.id}">Ouvrir</button>
        <button class="card-btn secondary" data-shop="${recipe.id}">Ajouter aux courses</button>
      </div>
    </article>
  `;
}

function openRecipe(id){
  const recipe = state.recipes.find(r=>r.id===id);
  if(!recipe) return;
  state.currentRecipe = recipe;
  const mode = currentMode();
  const steps = recipe.modes[mode] || [];
  const ing = recipe.ingredients.map(i=>`<li>${escapeHtml(i.qty)} ${escapeHtml(i.unit)} ${escapeHtml(i.name)}</li>`).join('');
  const substitutions = recipe.substitutions.length
    ? `<ul class="sub-list">${recipe.substitutions.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul>`
    : `<div class="empty-state">Pas de substitution spécifique nécessaire sur cette recette.</div>`;

  els.drawerContent.innerHTML = `
    <div class="drawer-header">
      <div class="inline-badges">
        <span class="badge cat">${recipe.emoji} ${escapeHtml(recipe.category)}</span>
        <span class="badge ${mode === 'tm6' ? 'mode-tm6' : 'mode-classic'}">${mode === 'tm6' ? 'Thermomix TM6' : 'Cuisine classique'}</span>
        ${displayGoal(recipe)}
      </div>
      <h2>${escapeHtml(recipe.name)}</h2>
      <p class="hero-copy">Mode actif : <strong>${mode === 'tm6' ? 'Thermomix TM6' : 'Cuisine classique'}</strong> — l’affichage s’adapte automatiquement.</p>
    </div>

    <div class="drawer-grid">
      <div>
        <div class="drawer-section">
          <h3>Ingrédients</h3>
          <ul class="sub-list">${ing}</ul>
        </div>

        <div class="drawer-section">
          <h3>Étapes détaillées</h3>
          <div class="steps-list">
            ${steps.map((s, idx)=>`
              <div class="step-card">
                <h4>Étape ${idx+1} — ${escapeHtml(s.title)}</h4>
                <div>${escapeHtml(s.text)}</div>
                <div class="footer-note">Durée indicative : ${Math.round((s.durationSec||0)/60)} min</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div>
        <div class="panel">
          <h3>Macros approximatives</h3>
          <div class="calc-grid">
            <div class="calc-box"><span>Kcal</span><strong>${recipe.macros.kcal}</strong></div>
            <div class="calc-box"><span>Protéines</span><strong>${recipe.macros.proteines} g</strong></div>
            <div class="calc-box"><span>Glucides</span><strong>${recipe.macros.glucides} g</strong></div>
            <div class="calc-box"><span>Lipides</span><strong>${recipe.macros.lipides} g</strong></div>
          </div>
        </div>

        <div class="panel">
          <h3>Adaptation possible</h3>
          ${substitutions}
        </div>

        <div class="panel">
          <h3>Conseils</h3>
          <ul class="sub-list">${(recipe.tips||[]).map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
  `;
  els.recipeDrawer.classList.add('open');
}

function closeDrawer(){
  els.recipeDrawer.classList.remove('open');
}

function addToShopping(id){
  if(!state.shopping.includes(id)) state.shopping.push(id);
  renderShopping();
}

function renderShopping(){
  const items = state.shopping.map(id=>state.recipes.find(r=>r.id===id)).filter(Boolean);
  if(!items.length){
    els.shoppingRecipes.innerHTML = `<div class="empty-state">Aucune recette sélectionnée. Depuis la bibliothèque, appuie sur “Ajouter aux courses”.</div>`;
    els.shoppingList.innerHTML = '';
    return;
  }
  els.shoppingRecipes.innerHTML = items.map(r=>`
    <div class="shopping-card">
      <strong>${escapeHtml(r.name)}</strong>
      <div class="footer-note">${escapeHtml(r.category)} · ${r.servings} pers.</div>
    </div>
  `).join('');
  const map = new Map();
  items.forEach(r=>{
    r.ingredients.forEach(i=>{
      const key = `${i.name}|${i.unit}`;
      if(!map.has(key)) map.set(key,{name:i.name,unit:i.unit,qty:0});
      map.get(key).qty += Number(i.qty||0);
    });
  });
  const list = [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  const text = list.map(x=>`- ${x.qty} ${x.unit} ${x.name}`).join('\n');
  window._shoppingText = text;
  els.shoppingList.innerHTML = `<div class="shopping-card"><ul>${list.map(x=>`<li>${escapeHtml(x.qty)} ${escapeHtml(x.unit)} ${escapeHtml(x.name)}</li>`).join('')}</ul></div>`;
}

async function copyShopping(){
  try{
    await navigator.clipboard.writeText(window._shoppingText || '');
  }catch(e){}
}

function renderPantry(){
  document.querySelectorAll('.ingredient-btn').forEach(btn=>{
    btn.classList.toggle('selected', state.pantry.has(btn.dataset.name));
  });
}

function renderFridgeResults(){
  const selected = [...state.pantry];
  if(!selected.length){
    els.fridgeResults.innerHTML = `<div class="empty-state">Choisis des ingrédients pour voir des recettes exactes, adaptables ou simples.</div>`;
    return;
  }

  const exact = [];
  const adaptable = [];

  state.recipes.forEach(recipe=>{
    if(!recipePassesRestrictions(recipe)) return;
    const ingNames = recipe.ingredients.map(i=>i.name);
    const hits = selected.filter(x=>ingNames.includes(x)).length;
    const missing = ingNames.length - hits;
    if(hits === ingNames.length) exact.push(recipe);
    else if(hits >= 2) adaptable.push({recipe, hits, missing});
  });

  const simple = buildSimpleFallback(selected);

  els.fridgeResults.innerHTML = `
    <div class="fridge-block">
      <h3>Recettes exactes</h3>
      ${exact.length ? exact.slice(0,8).map(r=>`<div class="shopping-card"><strong>${escapeHtml(r.name)}</strong><div class="footer-note">${escapeHtml(r.category)}</div></div>`).join('') : '<div class="empty-state">Aucune recette exacte avec ta sélection actuelle.</div>'}
    </div>
    <div class="fridge-block">
      <h3>Recettes adaptables</h3>
      ${adaptable.length ? adaptable.sort((a,b)=>a.missing-b.missing).slice(0,10).map(({recipe,hits,missing})=>`<div class="shopping-card"><strong>${escapeHtml(recipe.name)}</strong><div class="footer-note">${hits} ingrédient(s) trouvé(s) · ${missing} manquant(s)</div></div>`).join('') : '<div class="empty-state">Pas de recette adaptable pour l’instant.</div>'}
    </div>
    <div class="fridge-block">
      <h3>Recettes simples avec peu d’ingrédients</h3>
      ${simple.length ? simple.map(s=>`<div class="shopping-card"><strong>${escapeHtml(s.title)}</strong><div class="footer-note">${escapeHtml(s.desc)}</div></div>`).join('') : '<div class="empty-state">Ajoute encore un ou deux ingrédients pour obtenir plus d’idées simples.</div>'}
    </div>
  `;
}

function buildSimpleFallback(selected){
  const s = new Set(selected);
  const out = [];
  if(s.has('œuf') && s.has('fromage râpé')) out.push({title:'Omelette fromage', desc:'Très simple, rapide, accessible à tous.'});
  if(s.has('pâtes')) out.push({title:'Pâtes minute', desc:'Base simple à compléter avec sauce, beurre ou fromage selon ton profil.'});
  if(s.has('riz')) out.push({title:'Riz express', desc:'Parfait comme base pour un plat simple ou sportif.'});
  if(s.has('pomme')) out.push({title:'Compote express', desc:'Dessert simple avec peu d’ingrédients.'});
  if(s.has('pommes de terre') && s.has('oignon')) out.push({title:'Poêlée pommes de terre', desc:'Cuisine classique facile, peu coûteuse et efficace.'});
  return out;
}

function renderSubstitutionsReference(){
  const cards = [
    {title:'Sans gluten', items:['Farine de blé → farine de riz, maïs ou sarrasin','Pâtes classiques → pâtes sans gluten','Chapelure → chapelure sans gluten']},
    {title:'Sans lactose', items:['Lait → boisson végétale','Crème → crème végétale','Beurre → huile d’olive ou margarine végétale']},
    {title:'Sans œufs', items:['1 œuf → 60 g de compote de pomme','1 œuf → chia + eau','1 œuf → yaourt végétal épais selon recette']},
    {title:'Sans viande', items:['Viande hachée → lentilles ou pois chiches','Poulet → tofu ferme ou tempeh']},
    {title:'Sans poisson', items:['Poisson → tofu fumé','Poisson → légumineuses + nori pour une note iodée']},
  ];
  els.substitutionGrid.innerHTML = cards.map(card=>`
    <div class="sub-card">
      <h3>${escapeHtml(card.title)}</h3>
      <ul class="sub-list">${card.items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>
    </div>
  `).join('');
}

function calculateMetrics(){
  const sex = document.getElementById('sexInput').value;
  const age = Number(document.getElementById('ageInput').value || 0);
  const height = Number(document.getElementById('heightInput').value || 0);
  const weight = Number(document.getElementById('weightInput').value || 0);
  const activity = Number(document.getElementById('activityInput').value || 1.2);
  if(!age || !height || !weight) return;
  const imc = weight / ((height/100) ** 2);
  const bmr = sex === 'male'
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;
  const tdee = bmr * activity;
  let target = tdee;
  if(els.profileSelect.value === 'perte_de_poids' || els.goalSelect.value === 'perte_de_poids') target = tdee - 400;
  else if(els.profileSelect.value === 'performance' || els.goalSelect.value === 'performance') target = tdee + 250;
  document.getElementById('imcValue').textContent = imc.toFixed(1);
  document.getElementById('bmrValue').textContent = Math.round(bmr) + ' kcal';
  document.getElementById('tdeeValue').textContent = Math.round(tdee) + ' kcal';
  document.getElementById('targetValue').textContent = Math.round(target) + ' kcal';
}

init();
