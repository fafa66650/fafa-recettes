
const builtInRecipes = window.BUILTIN_RECIPES || [];
const KEYS = {custom:"fafa_custom_v7", fav:"fafa_fav_v7", planner:"fafa_plan_v7", recent:"fafa_recent_v7", mode:"fafa_mode_v7"};
const state = {currentRecipeId:null,currentStep:0,timer:null,remaining:0,ingredientFilter:new Set()};

function load(k, d){ try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function customRecipes(){ return load(KEYS.custom, []); }
function saveCustom(v){ save(KEYS.custom, v); }
function favorites(){ return new Set(load(KEYS.fav, [])); }
function saveFavorites(s){ save(KEYS.fav, [...s]); }
function planner(){ return load(KEYS.planner, []); }
function savePlanner(v){ save(KEYS.planner, v); }
function recent(){ return load(KEYS.recent, []); }
function saveRecent(v){ save(KEYS.recent, v.slice(0,15)); }
function currentMode(){ return localStorage.getItem(KEYS.mode) || "tm6"; }
function setMode(mode){
  localStorage.setItem(KEYS.mode, mode);
  document.getElementById('modeSelect').value = mode;
  document.getElementById('modeBadge').textContent = mode === 'tm6' ? '🤖 Mode Thermomix TM6' : '🍳 Mode cuisine classique';
  applyFilters();
  if (state.currentRecipeId) renderRecipeDetail();
}
function allRecipes(){ return [...builtInRecipes, ...customRecipes()]; }
function findRecipe(id){ return allRecipes().find(r => r.id === id); }
function isBuiltIn(id){ return builtInRecipes.some(r => r.id === id); }
function cats(){ return [...new Set(allRecipes().map(r=>r.category))].sort((a,b)=>a.localeCompare(b, 'fr')); }
function escapeHtml(str=''){ return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
function formatQty(q){ if (q===null||q===undefined||q==='') return ''; const n = Math.round(q*100)/100; return Number.isInteger(n) ? String(n) : String(n).replace('.', ','); }
function scaleIng(i, baseServ, targetServ){ const factor = targetServ / baseServ; return {...i, scaledQty: i.qty ? Math.round(i.qty * factor * 100)/100 : i.qty}; }

function rebuildSelectors(){
  document.getElementById('recipeCount').textContent = allRecipes().length;
  const catOptions = ['<option value="">Toutes les catégories</option>', ...cats().map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)];
  document.getElementById('categorySelect').innerHTML = catOptions.join('');
  document.getElementById('newCategory').innerHTML = cats().map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  document.getElementById('quickCats').innerHTML = cats().map(c=>`<button class="pill" onclick="document.getElementById('categorySelect').value='${escapeHtml(c)}';applyFilters()">${escapeHtml(c)}</button>`).join('');
}

function recipeCard(r){
  const fav = favorites().has(r.id) ? '★' : '☆';
  const tags = (r.tags||[]).slice(0,4).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
  const intro = (r.modes?.[currentMode()]?.[0]?.text || '').slice(0, 120);
  return `
    <article class="recipe-card" style="--accent:${r.color}">
      <div class="recipe-card-top">
        <div>
          <div class="badge">${r.emoji} ${escapeHtml(r.category)}</div>
          <h3>${escapeHtml(r.name)}</h3>
        </div>
        <button class="icon-btn" onclick="toggleFavorite('${r.id}')">${fav}</button>
      </div>
      <div class="meta">👥 ${r.servings} pers.</div>
      <div class="tags">${tags}</div>
      <div class="card-desc">${escapeHtml(intro)}...</div>
      <div class="actions">
        <button onclick="openRecipe('${r.id}')">Ouvrir</button>
        <button class="ghost" onclick="addToPlanner('${r.id}')">Courses</button>
      </div>
    </article>`;
}

function applyFilters(){
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const category = document.getElementById('categorySelect').value;
  const goal = document.getElementById('goalSelect').value.toLowerCase();
  const onlyFav = document.getElementById('favoritesOnly').checked;
  const favs = favorites();
  let list = allRecipes().filter(r => {
    const blob = [r.name, r.category, ...(r.tags||[]), ...(r.ingredients||[]).map(i=>i.name)].join(' ').toLowerCase();
    return (!query || blob.includes(query))
      && (!category || r.category === category)
      && (!goal || blob.includes(goal) || r.category.toLowerCase() === goal)
      && (!onlyFav || favs.has(r.id));
  });
  list.sort((a,b)=>a.name.localeCompare(b.name, 'fr'));
  document.getElementById('recipesGrid').innerHTML = list.length ? list.map(recipeCard).join('') : '<div class="empty">Aucune recette trouvée.</div>';
  renderRecent();
}

function toggleFavorite(id){
  const favs = favorites();
  if (favs.has(id)) favs.delete(id); else favs.add(id);
  saveFavorites(favs);
  applyFilters();
  if (state.currentRecipeId === id) renderRecipeDetail();
}

function openRecipe(id){
  state.currentRecipeId = id;
  state.currentStep = 0;
  saveRecent([id, ...recent().filter(x=>x!==id)]);
  document.getElementById('drawer').classList.add('open');
  const r = findRecipe(id);
  document.getElementById('servingsInput').value = r.servings;
  renderRecipeDetail();
}
function closeDrawer(){ document.getElementById('drawer').classList.remove('open'); clearTimer(); }

function renderRecipeDetail(){
  const r = findRecipe(state.currentRecipeId);
  if (!r) return;
  const mode = currentMode();
  const steps = r.modes?.[mode] || [];
  const target = Math.max(1, parseInt(document.getElementById('servingsInput').value || r.servings, 10));
  const scaled = r.ingredients.map(i => scaleIng(i, r.servings, target));
  const tags = (r.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
  document.getElementById('drawerContent').innerHTML = `
    <div class="detail-head" style="border-top:10px solid ${r.color}">
      <div class="detail-header-row">
        <div>
          <div class="badge">${r.emoji} ${escapeHtml(r.category)}</div>
          <h2>${escapeHtml(r.name)}</h2>
          <div class="tags">${tags}</div>
        </div>
        <div class="detail-actions">
          <button class="ghost" onclick="toggleFavorite('${r.id}')">${favorites().has(r.id) ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'}</button>
          <button class="ghost" onclick="addToPlanner('${r.id}')">Ajouter aux courses</button>
        </div>
      </div>

      <div class="dual-cards">
        <div class="mini-card">
          <h4>Mode choisi</h4>
          <div class="meta">${mode === 'tm6' ? 'Thermomix TM6' : 'Cuisine classique'}</div>
        </div>
        <div class="mini-card">
          <h4>Portions</h4>
          <div class="portion-controls">
            <button class="small-btn" onclick="changeServings(-1)">-</button>
            <input id="servingsInline" type="number" min="1" value="${target}" oninput="syncServings()">
            <button class="small-btn" onclick="changeServings(1)">+</button>
          </div>
        </div>
      </div>

      <section>
        <h3>Ingrédients</h3>
        <ul class="detail-list">
          ${scaled.map(i=>`<li><input type="checkbox"> ${escapeHtml(formatQty(i.scaledQty))} ${escapeHtml(i.unit || '')} ${escapeHtml(i.name)}</li>`).join('')}
        </ul>
      </section>

      <section>
        <h3>Étapes détaillées</h3>
        <div class="guided-controls">
          <button onclick="prevStep()">◀ Étape précédente</button>
          <button onclick="nextStep()">Étape suivante ▶</button>
          <button class="ghost" onclick="startCurrentStepTimer()">⏱ Lancer le minuteur</button>
        </div>
        <div id="stepBox">${renderStep(steps)}</div>
      </section>

      <section>
        <h3>Conseils</h3>
        <ul class="detail-list">${(r.tips||[]).map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ul>
      </section>

      <section>
        <h3>Gestion</h3>
        ${isBuiltIn(r.id) ? '<div class="meta">Recette intégrée à l’application.</div>' : `<button class="danger" onclick="deleteCustomRecipe('${r.id}')">Supprimer cette recette</button>`}
      </section>
    </div>`;
}

function renderStep(steps){
  const step = steps[state.currentStep];
  if (!step) return '<div class="empty">Étape introuvable.</div>';
  return `
    <div class="step-card">
      <div class="step-header">
        <div>Étape ${state.currentStep + 1} / ${steps.length}</div>
        <div>${Math.round((step.durationSec || 0)/60)} min</div>
      </div>
      <h4>${escapeHtml(step.title)}</h4>
      <p>${escapeHtml(step.text)}</p>
      <div class="timer-display" id="timerDisplay">${formatTime(state.remaining || step.durationSec || 0)}</div>
    </div>`;
}

function changeServings(delta){
  const input = document.getElementById('servingsInput');
  input.value = Math.max(1, parseInt(input.value || '1', 10) + delta);
  renderRecipeDetail();
}
function syncServings(){
  const inline = document.getElementById('servingsInline');
  document.getElementById('servingsInput').value = Math.max(1, parseInt(inline.value || '1', 10));
  renderRecipeDetail();
}

function nextStep(){
  const r = findRecipe(state.currentRecipeId); if (!r) return;
  const steps = r.modes?.[currentMode()] || [];
  if (state.currentStep < steps.length - 1) state.currentStep++;
  clearTimer();
  document.getElementById('stepBox').innerHTML = renderStep(steps);
}
function prevStep(){
  const r = findRecipe(state.currentRecipeId); if (!r) return;
  const steps = r.modes?.[currentMode()] || [];
  if (state.currentStep > 0) state.currentStep--;
  clearTimer();
  document.getElementById('stepBox').innerHTML = renderStep(steps);
}
function formatTime(s){
  s = Math.max(0, Math.floor(s));
  const m = String(Math.floor(s/60)).padStart(2, '0');
  const sec = String(s%60).padStart(2, '0');
  return `${m}:${sec}`;
}
function clearTimer(){ if (state.timer) clearInterval(state.timer); state.timer = null; state.remaining = 0; }
function startCurrentStepTimer(){
  const r = findRecipe(state.currentRecipeId); if (!r) return;
  const steps = r.modes?.[currentMode()] || [];
  clearTimer();
  state.remaining = steps[state.currentStep].durationSec || 0;
  const draw = ()=> { const el = document.getElementById('timerDisplay'); if (el) el.textContent = formatTime(state.remaining); };
  draw();
  state.timer = setInterval(() => {
    state.remaining--;
    draw();
    if (state.remaining <= 0){
      clearTimer();
      alert('Temps écoulé pour cette étape.');
      nextStep();
    }
  }, 1000);
}

function addToPlanner(id){
  const list = planner();
  if (!list.includes(id)) list.push(id);
  savePlanner(list);
  renderPlanner();
}
function removeFromPlanner(id){
  savePlanner(planner().filter(x=>x!==id));
  renderPlanner();
}
function clearPlanner(){
  savePlanner([]);
  renderPlanner();
}
function renderPlanner(){
  const ids = planner();
  const recipes = ids.map(findRecipe).filter(Boolean);
  const out = document.getElementById('plannerList');
  if (!recipes.length){
    out.innerHTML = '<div class="empty">Ajoute des recettes depuis la bibliothèque pour générer une liste de courses.</div>';
    document.getElementById('shoppingOutput').innerHTML = '';
    return;
  }
  out.innerHTML = recipes.map(r=>`<div class="planner-item"><span>${r.emoji} ${escapeHtml(r.name)}</span><button class="small-btn danger" onclick="removeFromPlanner('${r.id}')">Retirer</button></div>`).join('');
  const map = new Map();
  recipes.forEach(r => r.ingredients.forEach(i => {
    const key = `${i.name.toLowerCase()}|${i.unit || ''}`;
    if (!map.has(key)) map.set(key, {name:i.name, unit:i.unit || '', qty:0});
    map.get(key).qty += Number(i.qty || 0);
  }));
  const items = [...map.values()].sort((a,b)=>a.name.localeCompare(b.name, 'fr'));
  document.getElementById('shoppingOutput').innerHTML = `
    <div class="shopping-actions">
      <button onclick="copyShopping()">Copier la liste</button>
      <button class="ghost" onclick="clearPlanner()">Tout vider</button>
    </div>
    <ul class="detail-list">
      ${items.map(i => `<li><input type="checkbox"> ${escapeHtml(formatQty(i.qty))} ${escapeHtml(i.unit)} ${escapeHtml(i.name)}</li>`).join('')}
    </ul>`;
  window.__shoppingText = items.map(i => `- ${formatQty(i.qty)} ${i.unit} ${i.name}`.trim()).join('\n');
}
async function copyShopping(){
  try {
    await navigator.clipboard.writeText(window.__shoppingText || '');
    alert('Liste copiée.');
  } catch {
    alert('Copie impossible sur cet appareil.');
  }
}

function uniqueIngredients(){
  const map = new Map();
  allRecipes().forEach(r => (r.ingredients || []).forEach(i => map.set(i.name.toLowerCase(), i.name)));
  return [...map.values()].sort((a,b)=>a.localeCompare(b, 'fr'));
}
function toggleIngredient(name){
  const key = name.toLowerCase();
  if (state.ingredientFilter.has(key)) state.ingredientFilter.delete(key);
  else state.ingredientFilter.add(key);
  renderFridge();
}
function clearFridge(){ state.ingredientFilter.clear(); renderFridge(); }
function fallbackSuggestions(selected){
  const s = new Set(selected);
  const out = [];
  if (s.has('œuf') && s.has('fromage râpé')) out.push({name:'Omelette fromage', info:'Recette ultra simple possible tout de suite.'});
  if (s.has('œuf')) out.push({name:'Œufs brouillés', info:'Même avec peu d’ingrédients, tu peux faire une recette rapide.'});
  if (s.has('pommes de terre') && s.has('oignon')) out.push({name:'Poêlée pommes de terre oignons', info:'Idéale avec peu d’ingrédients.'});
  if (s.has('riz')) out.push({name:'Riz blanc rapide', info:'Base simple à compléter avec ce que tu as.'});
  if (s.has('pâtes')) out.push({name:'Pâtes beurre fromage', info:'Base faisable immédiatement si tu as un peu de beurre ou fromage.'});
  if (s.has('pomme')) out.push({name:'Compote express', info:'Dessert simple avec très peu d’ingrédients.'});
  return out;
}
function renderFridge(){
  const list = uniqueIngredients();
  document.getElementById('fridgeList').innerHTML = list.map(name => {
    const on = state.ingredientFilter.has(name.toLowerCase());
    return `<button class="fridge-pill ${on ? 'selected' : ''}" onclick="toggleIngredient('${escapeHtml(name)}')">${escapeHtml(name)}</button>`;
  }).join('');
  renderFridgeMatches();
}
function renderFridgeMatches(){
  const selected = [...state.ingredientFilter];
  const out = document.getElementById('fridgeMatches');
  if (!selected.length){
    out.innerHTML = '<div class="empty">Sélectionne tes ingrédients pour voir les recettes exactes, adaptables et simples.</div>';
    return;
  }
  const scored = allRecipes().map(r => {
    const set = new Set((r.ingredients || []).map(i => i.name.toLowerCase()));
    const hits = selected.filter(x => set.has(x)).length;
    const missing = (r.ingredients || []).map(i => i.name.toLowerCase()).filter(x => !selected.includes(x)).length;
    return {recipe:r, hits, missing, ratio:hits / Math.max(1, r.ingredients.length)};
  }).filter(x => x.hits > 0);

  const exact = scored.filter(x => x.missing === 0).sort((a,b)=>a.recipe.name.localeCompare(b.recipe.name, 'fr'));
  const partial = scored.filter(x => x.missing > 0 && x.hits >= 2).sort((a,b)=>b.ratio - a.ratio || a.missing - b.missing || a.recipe.name.localeCompare(b.recipe.name, 'fr'));
  const fallback = fallbackSuggestions(selected);

  let html = '';
  html += '<h4>Recettes exactes</h4>';
  html += exact.length ? exact.slice(0,12).map(({recipe}) => `
    <div class="match-card" style="border-left:6px solid ${recipe.color}">
      <div class="match-title">${recipe.emoji} ${escapeHtml(recipe.name)}</div>
      <div class="meta">${escapeHtml(recipe.category)} · tu as tous les ingrédients enregistrés</div>
      <button class="small-btn" onclick="openRecipe('${recipe.id}')">Ouvrir</button>
    </div>`).join('') : '<div class="empty small">Aucune recette exacte pour l’instant.</div>';

  html += '<h4>Recettes adaptables</h4>';
  html += partial.length ? partial.slice(0,12).map(({recipe, missing, hits}) => `
    <div class="match-card" style="border-left:6px solid ${recipe.color}">
      <div class="match-title">${recipe.emoji} ${escapeHtml(recipe.name)}</div>
      <div class="meta">${escapeHtml(recipe.category)} · ${hits} ingrédient(s) trouvé(s) · ${missing} ingrédient(s) manquant(s)</div>
      <button class="small-btn" onclick="openRecipe('${recipe.id}')">Ouvrir</button>
    </div>`).join('') : '<div class="empty small">Pas de recette adaptable avec au moins deux ingrédients trouvés.</div>';

  html += '<h4>Recettes simples avec peu d’ingrédients</h4>';
  html += fallback.length ? fallback.map(item => `
    <div class="match-card">
      <div class="match-title">✨ ${escapeHtml(item.name)}</div>
      <div class="meta">${escapeHtml(item.info)}</div>
    </div>`).join('') : '<div class="empty small">Ajoute encore un ou deux ingrédients pour obtenir des suggestions express.</div>';

  out.innerHTML = html;
}

function renderRecent(){
  const out = document.getElementById('recentList');
  const list = recent().map(findRecipe).filter(Boolean);
  out.innerHTML = list.length ? list.map(r => `<button class="recent-btn" onclick="openRecipe('${r.id}')">${r.emoji} ${escapeHtml(r.name)}</button>`).join('') : '<div class="empty small">Aucune recette récente.</div>';
}

function gatherCustomRecipe(){
  const ingredients = document.getElementById('newIngredients').value.trim().split('\n').filter(Boolean).map(line => {
    const [name, qty, unit] = line.split('|').map(x=>x.trim());
    return {name:name||'', qty:Number(qty||0), unit:unit||''};
  }).filter(x => x.name);
  const steps = document.getElementById('newSteps').value.trim().split('\n').filter(Boolean).map((line, idx) => {
    const [title, text, duration] = line.split('|').map(x=>x.trim());
    return {title:title||`Étape ${idx+1}`, text:text||'', durationSec:Number(duration||120)};
  }).filter(x => x.text);
  const shared = {
    id: 'custom-' + Date.now(),
    name: document.getElementById('newName').value.trim(),
    category: document.getElementById('newCategory').value,
    color: document.getElementById('newColor').value,
    emoji: document.getElementById('newEmoji').value || '🍽️',
    servings: Number(document.getElementById('newServings').value || 4),
    difficulty: '',
    tags: document.getElementById('newTags').value.split(',').map(x=>x.trim()).filter(Boolean),
    ingredients,
    tips: ["Relis toujours ta recette perso avant cuisson.", "Adapte selon ton matériel.", "Ajuste la cuisson selon la texture finale."]
  };
  return {...shared, modes: {tm6: steps, classic: steps}};
}
function addCustomRecipe(){
  const data = gatherCustomRecipe();
  if (!data.name || !data.ingredients.length || !data.modes.tm6.length){
    alert('Complète le nom, les ingrédients et les étapes.');
    return;
  }
  const arr = customRecipes();
  arr.push(data);
  saveCustom(arr);
  document.getElementById('customForm').reset();
  rebuildSelectors();
  applyFilters();
  renderFridge();
  alert('Recette enregistrée.');
}
function deleteCustomRecipe(id){
  if (!confirm('Supprimer cette recette ?')) return;
  saveCustom(customRecipes().filter(r => r.id !== id));
  closeDrawer();
  rebuildSelectors();
  applyFilters();
  renderFridge();
}
function exportRecipes(){
  const blob = new Blob([JSON.stringify(customRecipes(), null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fafa-recettes-perso.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
function importRecipes(ev){
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const arr = JSON.parse(reader.result);
      if (!Array.isArray(arr)) throw new Error();
      saveCustom([...customRecipes(), ...arr]);
      rebuildSelectors();
      applyFilters();
      renderFridge();
      alert('Import terminé.');
    } catch {
      alert('Fichier JSON invalide.');
    }
  };
  reader.readAsText(file, 'utf-8');
}

function openTab(id){
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelector(`[data-tab="${id}"]`).classList.add('active');
}

function init(){
  rebuildSelectors();
  document.getElementById('modeSelect').value = currentMode();
  setMode(currentMode());
  applyFilters();
  renderFridge();
  renderPlanner();
  renderRecent();
}
window.addEventListener('DOMContentLoaded', init);
