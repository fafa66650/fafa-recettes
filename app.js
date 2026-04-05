
const builtInRecipes = window.BUILTIN_RECIPES || [];
const STORAGE_KEYS = {
  custom: "fafa_custom_recipes_v5",
  favorites: "fafa_favorites_v5",
  planner: "fafa_planner_v5",
  shopping: "fafa_shopping_v5"
};

const state = {
  recipes: [],
  currentRecipeId: null,
  currentStep: 0,
  timerInterval: null,
  timerRemaining: 0,
  ingredientFilter: new Set(),
};

function loadJSONLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveJSONLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function getCustomRecipes(){ return loadJSONLocal(STORAGE_KEYS.custom, []); }
function saveCustomRecipes(items){ saveJSONLocal(STORAGE_KEYS.custom, items); }
function getFavorites(){ return new Set(loadJSONLocal(STORAGE_KEYS.favorites, [])); }
function saveFavorites(set){ saveJSONLocal(STORAGE_KEYS.favorites, [...set]); }

function uniqueIngredients(recipes) {
  const map = new Map();
  recipes.forEach(r => (r.ingredients||[]).forEach(i => map.set(i.name.toLowerCase(), i.name)));
  return [...map.values()].sort((a,b)=>a.localeCompare(b, 'fr'));
}
function formatQty(qty) {
  if (qty === null || qty === undefined || qty === "") return "";
  const rounded = Math.round(qty * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
}
function scaleIngredient(ing, servings, targetServings) {
  const factor = targetServings / servings;
  return {...ing, scaledQty: ing.qty ? Math.round((ing.qty * factor) * 100) / 100 : ing.qty};
}
function allRecipes() {
  return [...builtInRecipes, ...getCustomRecipes()];
}
function categories() {
  return [...new Set(allRecipes().map(r => r.category))];
}
function findRecipe(id) {
  return allRecipes().find(r => r.id === id);
}
function isBuiltIn(id) {
  return builtInRecipes.some(r => r.id === id);
}
function setRecipes() {
  state.recipes = allRecipes();
}
function escapeHtml(str='') {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function renderCategoryFilters() {
  const wrap = document.getElementById('categoryFilters');
  const current = document.getElementById('categorySelect').value;
  wrap.innerHTML = categories().map(c => `<button class="pill ${current===c?'active':''}" onclick="document.getElementById('categorySelect').value='${escapeHtml(c)}';applyFilters()">${escapeHtml(c)}</button>`).join('');
}
function renderIngredientSuggestions() {
  const container = document.getElementById('fridgeList');
  const list = uniqueIngredients(allRecipes());
  container.innerHTML = list.map(name => {
    const selected = state.ingredientFilter.has(name.toLowerCase());
    return `<button class="fridge-pill ${selected?'selected':''}" onclick="toggleFridgeIngredient('${escapeHtml(name)}')">${escapeHtml(name)}</button>`;
  }).join('');
}
function toggleFridgeIngredient(name) {
  const key = name.toLowerCase();
  if (state.ingredientFilter.has(key)) state.ingredientFilter.delete(key);
  else state.ingredientFilter.add(key);
  renderIngredientSuggestions();
  renderFridgeMatches();
}
function clearFridge() {
  state.ingredientFilter.clear();
  renderIngredientSuggestions();
  renderFridgeMatches();
}
function matchScore(recipe) {
  const wanted = [...state.ingredientFilter];
  if (!wanted.length) return 0;
  const set = new Set(recipe.ingredients.map(i => i.name.toLowerCase()));
  const hits = wanted.filter(w => set.has(w)).length;
  return hits / wanted.length;
}
function renderFridgeMatches() {
  const out = document.getElementById('fridgeMatches');
  const selected = [...state.ingredientFilter];
  if (!selected.length) {
    out.innerHTML = `<div class="empty">Sélectionne des ingrédients pour voir les recettes compatibles.</div>`;
    return;
  }
  const matches = allRecipes()
    .map(r => ({r, score: matchScore(r)}))
    .filter(x => x.score > 0)
    .sort((a,b)=> b.score - a.score || a.r.name.localeCompare(b.r.name, 'fr'));
  if (!matches.length) {
    out.innerHTML = `<div class="empty">Aucune recette trouvée avec ces ingrédients pour l’instant.</div>`;
    return;
  }
  out.innerHTML = matches.slice(0, 24).map(({r, score}) => `
    <div class="match-card" style="border-left:6px solid ${r.color}">
      <div class="match-title">${r.emoji} ${escapeHtml(r.name)}</div>
      <div class="match-meta">${escapeHtml(r.category)} · Compatibilité ${Math.round(score*100)}%</div>
      <button class="small-btn" onclick="openRecipe('${r.id}')">Ouvrir</button>
    </div>
  `).join('');
}
function recipeCard(recipe) {
  const favs = getFavorites();
  const favorite = favs.has(recipe.id);
  const tags = (recipe.tags||[]).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  return `
  <article class="recipe-card" style="--accent:${recipe.color}">
    <div class="recipe-head">
      <div>
        <div class="badge">${recipe.emoji} ${escapeHtml(recipe.category)}</div>
        <h3>${escapeHtml(recipe.name)}</h3>
      </div>
      <button class="icon-btn" title="Favori" onclick="toggleFavorite('${recipe.id}')">${favorite ? '★' : '☆'}</button>
    </div>
    <div class="meta">👥 ${recipe.servings} pers. · ${escapeHtml(recipe.difficulty)}</div>
    <div class="tags">${tags}</div>
    <div class="tips-preview">${escapeHtml((recipe.steps?.[0]?.text || '').slice(0, 135))}...</div>
    <div class="actions">
      <button onclick="openRecipe('${recipe.id}')">Voir la recette</button>
      <button class="ghost" onclick="addToPlanner('${recipe.id}')">Ajouter aux courses</button>
    </div>
  </article>`;
}
function applyFilters() {
  setRecipes();
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const category = document.getElementById('categorySelect').value;
  const favoritesOnly = document.getElementById('favoritesOnly').checked;
  const favs = getFavorites();
  let filtered = state.recipes.filter(r => {
    const text = [r.name, r.category, ...(r.tags||[]), ...(r.ingredients||[]).map(i=>i.name)].join(' ').toLowerCase();
    const okQuery = !query || text.includes(query);
    const okCat = !category || r.category === category;
    const okFav = !favoritesOnly || favs.has(r.id);
    return okQuery && okCat && okFav;
  });
  filtered.sort((a,b)=>a.name.localeCompare(b.name, 'fr'));
  const out = document.getElementById('recipesGrid');
  out.innerHTML = filtered.length ? filtered.map(recipeCard).join('') : `<div class="empty">Aucune recette ne correspond aux filtres.</div>`;
}
function toggleFavorite(id) {
  const favs = getFavorites();
  if (favs.has(id)) favs.delete(id); else favs.add(id);
  saveFavorites(favs);
  applyFilters();
  if (state.currentRecipeId === id) openRecipe(id, true);
}
function openRecipe(id, preserveServings=false) {
  const recipe = findRecipe(id);
  if (!recipe) return;
  state.currentRecipeId = id;
  state.currentStep = 0;
  document.getElementById('drawer').classList.add('open');
  const servingsInput = document.getElementById('servingsInput');
  servingsInput.value = preserveServings ? servingsInput.value : recipe.servings;
  renderRecipeDetail();
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  clearTimer();
}
function renderRecipeDetail() {
  const recipe = findRecipe(state.currentRecipeId);
  if (!recipe) return;
  const targetServings = Math.max(1, parseInt(document.getElementById('servingsInput').value || recipe.servings, 10));
  const scaledIngredients = recipe.ingredients.map(i => scaleIngredient(i, recipe.servings, targetServings));
  document.getElementById('drawerContent').innerHTML = `
    <div class="detail-head" style="border-top:8px solid ${recipe.color}">
      <div class="detail-title-row">
        <div>
          <div class="badge">${recipe.emoji} ${escapeHtml(recipe.category)}</div>
          <h2>${escapeHtml(recipe.name)}</h2>
          <div class="meta">${escapeHtml(recipe.difficulty)} · ${recipe.steps.length} étapes</div>
        </div>
        <div class="detail-actions">
          <button class="ghost" onclick="toggleFavorite('${recipe.id}')">${getFavorites().has(recipe.id) ? '★ Retirer favori' : '☆ Favori'}</button>
          <button class="ghost" onclick="addToPlanner('${recipe.id}')">Ajouter aux courses</button>
        </div>
      </div>

      <div class="servings-box">
        <label>Portions</label>
        <div class="serving-controls">
          <button class="small-btn" onclick="changeServings(-1)">-</button>
          <input id="servingsInputInline" type="number" min="1" value="${targetServings}" oninput="syncServingsFromInline()">
          <button class="small-btn" onclick="changeServings(1)">+</button>
        </div>
      </div>

      <h4>Ingrédients</h4>
      <ul class="detail-list">
        ${scaledIngredients.map(i => `<li><input type="checkbox"> ${escapeHtml(formatQty(i.scaledQty))} ${escapeHtml(i.unit || '')} ${escapeHtml(i.name)}</li>`).join('')}
      </ul>

      <h4>Mode guidé</h4>
      <div class="guided-controls">
        <button onclick="prevStep()">◀ Étape précédente</button>
        <button onclick="nextStep()">Étape suivante ▶</button>
        <button class="ghost" onclick="startCurrentStepTimer()">⏱ Lancer le minuteur</button>
      </div>
      <div id="stepBox">${renderCurrentStep(recipe)}</div>

      <h4>Conseils utiles</h4>
      <ul class="detail-list">${recipe.tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>

      <h4>Gestion de la recette</h4>
      <div class="guided-controls">
        ${isBuiltIn(recipe.id) ? '<span class="info-text">Recette intégrée : suppression désactivée.</span>' : '<button class="danger" onclick="deleteCustomRecipe(\''+recipe.id+'\')">Supprimer cette recette</button>'}
      </div>
    </div>`;
}
function renderCurrentStep(recipe) {
  const step = recipe.steps[state.currentStep];
  if (!step) return `<div class="empty">Étape introuvable.</div>`;
  return `
    <div class="step-card">
      <div class="step-top">
        <div class="step-count">Étape ${state.currentStep + 1} / ${recipe.steps.length}</div>
        <div class="step-time">${Math.round(step.durationSec/60)} min approx.</div>
      </div>
      <h3>${escapeHtml(step.title)}</h3>
      <p>${escapeHtml(step.text)}</p>
      <div class="timer-box">
        <div id="timerDisplay">${state.timerRemaining ? formatTimer(state.timerRemaining) : formatTimer(step.durationSec || 0)}</div>
      </div>
    </div>`;
}
function changeServings(delta) {
  const input = document.getElementById('servingsInput');
  input.value = Math.max(1, parseInt(input.value || "1", 10) + delta);
  if (document.getElementById('servingsInputInline')) document.getElementById('servingsInputInline').value = input.value;
  renderRecipeDetail();
}
function syncServingsFromInline() {
  const inline = document.getElementById('servingsInputInline');
  document.getElementById('servingsInput').value = Math.max(1, parseInt(inline.value || "1", 10));
  renderRecipeDetail();
}
function nextStep() {
  const recipe = findRecipe(state.currentRecipeId);
  if (!recipe) return;
  if (state.currentStep < recipe.steps.length - 1) state.currentStep++;
  clearTimer();
  document.getElementById('stepBox').innerHTML = renderCurrentStep(recipe);
}
function prevStep() {
  const recipe = findRecipe(state.currentRecipeId);
  if (!recipe) return;
  if (state.currentStep > 0) state.currentStep--;
  clearTimer();
  document.getElementById('stepBox').innerHTML = renderCurrentStep(recipe);
}
function formatTimer(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = String(Math.floor(sec/60)).padStart(2,'0');
  const s = String(sec%60).padStart(2,'0');
  return `${m}:${s}`;
}
function clearTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.timerRemaining = 0;
}
function startCurrentStepTimer() {
  const recipe = findRecipe(state.currentRecipeId);
  if (!recipe) return;
  clearTimer();
  state.timerRemaining = recipe.steps[state.currentStep].durationSec || 0;
  const display = () => {
    const el = document.getElementById('timerDisplay');
    if (el) el.textContent = formatTimer(state.timerRemaining);
  };
  display();
  state.timerInterval = setInterval(() => {
    state.timerRemaining--;
    display();
    if (state.timerRemaining <= 0) {
      clearTimer();
      alert("Temps écoulé pour cette étape.");
      nextStep();
    }
  }, 1000);
}
function addToPlanner(id) {
  const planner = loadJSONLocal(STORAGE_KEYS.planner, []);
  if (!planner.includes(id)) planner.push(id);
  saveJSONLocal(STORAGE_KEYS.planner, planner);
  renderPlanner();
}
function removeFromPlanner(id) {
  let planner = loadJSONLocal(STORAGE_KEYS.planner, []);
  planner = planner.filter(x => x !== id);
  saveJSONLocal(STORAGE_KEYS.planner, planner);
  renderPlanner();
}
function clearPlanner() {
  saveJSONLocal(STORAGE_KEYS.planner, []);
  renderPlanner();
}
function renderPlanner() {
  const planner = loadJSONLocal(STORAGE_KEYS.planner, []);
  const wrap = document.getElementById('plannerList');
  if (!planner.length) {
    wrap.innerHTML = `<div class="empty">Ajoute des recettes pour générer une liste de courses automatique.</div>`;
    document.getElementById('shoppingOutput').innerHTML = '';
    return;
  }
  const recipeObjs = planner.map(findRecipe).filter(Boolean);
  wrap.innerHTML = recipeObjs.map(r => `
    <div class="planner-item">
      <span>${r.emoji} ${escapeHtml(r.name)}</span>
      <button class="small-btn danger" onclick="removeFromPlanner('${r.id}')">Retirer</button>
    </div>
  `).join('');
  generateShoppingList(recipeObjs);
}
function generateShoppingList(recipeObjs) {
  const map = new Map();
  recipeObjs.forEach(r => {
    r.ingredients.forEach(i => {
      const key = `${i.name.toLowerCase()}|${i.unit||''}`;
      if (!map.has(key)) map.set(key, {name:i.name, unit:i.unit||'', qty:0});
      const cur = map.get(key);
      cur.qty += Number(i.qty || 0);
    });
  });
  const items = [...map.values()].sort((a,b)=>a.name.localeCompare(b.name, 'fr'));
  const out = document.getElementById('shoppingOutput');
  out.innerHTML = `
    <div class="shopping-actions">
      <button onclick="copyShoppingList()">Copier la liste</button>
    </div>
    <ul class="shopping-list">
      ${items.map(i=> `<li><input type="checkbox"> ${escapeHtml(formatQty(i.qty))} ${escapeHtml(i.unit)} ${escapeHtml(i.name)}</li>`).join('')}
    </ul>
  `;
  window.__shoppingText = items.map(i => `- ${formatQty(i.qty)} ${i.unit} ${i.name}`.trim()).join('\n');
}
async function copyShoppingList() {
  try {
    await navigator.clipboard.writeText(window.__shoppingText || "");
    alert("Liste de courses copiée.");
  } catch {
    alert("Copie impossible sur cet appareil.");
  }
}
function openTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}
function gatherCustomRecipeForm() {
  const ingredients = document.getElementById('newIngredients').value.trim().split('\n').filter(Boolean).map(line => {
    const m = line.split('|').map(x => x.trim());
    return {name: m[0] || '', qty: Number(m[1] || 0), unit: m[2] || ''};
  }).filter(i => i.name);
  const steps = document.getElementById('newSteps').value.trim().split('\n').filter(Boolean).map((line, idx) => {
    const m = line.split('|').map(x => x.trim());
    return {
      title: m[0] || `Étape ${idx+1}`,
      text: m[1] || '',
      durationSec: Number(m[2] || 120)
    };
  }).filter(s => s.text);
  return {
    id: 'custom-' + Date.now(),
    name: document.getElementById('newName').value.trim(),
    category: document.getElementById('newCategory').value,
    color: document.getElementById('newColor').value,
    emoji: document.getElementById('newEmoji').value.trim() || '🍽️',
    servings: Number(document.getElementById('newServings').value || 4),
    difficulty: 'Recette perso',
    tags: document.getElementById('newTags').value.split(',').map(x=>x.trim()).filter(Boolean),
    ingredients,
    steps,
    tips: [
      "Vérifie toujours tes quantités avant de lancer la cuisson.",
      "Si le bol est encore très chaud, manipule-le avec prudence.",
      "Goûte toujours avant de servir."
    ]
  };
}
function addCustomRecipe() {
  const data = gatherCustomRecipeForm();
  if (!data.name || !data.ingredients.length || !data.steps.length) {
    alert("Complète au minimum le nom, les ingrédients et les étapes.");
    return;
  }
  const customs = getCustomRecipes();
  customs.push(data);
  saveCustomRecipes(customs);
  document.getElementById('customForm').reset();
  setRecipes();
  rebuildSelectors();
  applyFilters();
  renderIngredientSuggestions();
  alert("Recette ajoutée.");
}
function deleteCustomRecipe(id) {
  if (!confirm("Supprimer cette recette perso ?")) return;
  const customs = getCustomRecipes().filter(r => r.id !== id);
  saveCustomRecipes(customs);
  closeDrawer();
  setRecipes();
  rebuildSelectors();
  applyFilters();
  renderIngredientSuggestions();
}
function exportRecipes() {
  const blob = new Blob([JSON.stringify(getCustomRecipes(), null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fafatraining-recettes-perso.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
function importRecipes(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error("Format invalide");
      const customs = getCustomRecipes();
      saveCustomRecipes([...customs, ...data]);
      setRecipes();
      rebuildSelectors();
      applyFilters();
      renderIngredientSuggestions();
      alert("Import terminé.");
    } catch (e) {
      alert("Import impossible : fichier JSON invalide.");
    }
  };
  reader.readAsText(file, 'utf-8');
}
function rebuildSelectors() {
  const select = document.getElementById('categorySelect');
  const newCat = document.getElementById('newCategory');
  const list = [''].concat(categories());
  select.innerHTML = list.map(c => `<option value="${escapeHtml(c)}">${c ? escapeHtml(c) : 'Toutes les catégories'}</option>`).join('');
  newCat.innerHTML = categories().map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  renderCategoryFilters();
}
function init() {
  setRecipes();
  rebuildSelectors();
  applyFilters();
  renderIngredientSuggestions();
  renderFridgeMatches();
  renderPlanner();
}
window.addEventListener('DOMContentLoaded', init);
