/* =============================================
   LE DRESSEUR DE PALS — app.js
============================================= */

/* ── ÉTAT GLOBAL ── */
const state = {
  page: 'home',
  palFilter: { search: '', element: null },
  breedTab: 'mecanique',
  craftTab: 'arbre',
  guideTab: 'progression',
  comparePals: [null, null, null, null],
  checklist: JSON.parse(localStorage.getItem('dresseur_checklist') || '{}'),
  techFilter: { search: '', type: 'all' },
  comboFilter: 'all',
  palsInitialized: false,
  breedingInitialized: false,
  craftingInitialized: false,
  guidesInitialized: false,
  achievementsInitialized: false,
};

// Populate power ranks from PALS data
const POWER_RANKS = {};
PALS.forEach(p => { POWER_RANKS[p.name] = p.rank; });

function getTier(name) {
  if (typeof TIER_LIST === 'undefined') return '—';
  for (const [t, pals] of Object.entries(TIER_LIST)) {
    if (pals.includes(name)) return t;
  }
  return '—';
}
// Merger avec BREEDING_RANKS depuis game.js (Pals sans fiche complète)
if (typeof BREEDING_RANKS !== 'undefined') {
  for (const [name, rank] of Object.entries(BREEDING_RANKS)) {
    if (!POWER_RANKS[name]) POWER_RANKS[name] = rank;
  }
}

/* ── NAVIGATION ── */
function navigate(page) {
  document.getElementById('pg-' + state.page)?.classList.remove('active');
  document.querySelector(`[data-nav="${state.page}"]`)?.classList.remove('active');
  state.page = page;
  document.getElementById('pg-' + page)?.classList.add('active');
  document.querySelector(`[data-nav="${page}"]`)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Lazy init des pages
  if (page === 'pals' && !state.palsInitialized) { initPals(); state.palsInitialized = true; }
  if (page === 'achievements') initAchievements();
  if (page === 'maps') initMaps();
  if (page === 'tierlist') initTierList();
  if (page === 'dashboard') initDashboard();
  if (page === 'planner') initPlanner();
  if (page === 'saveimport') { /* page statique — aucun init requis */ }
  if (page === 'breeding' && !state.breedingInitialized) { initBreeding(); state.breedingInitialized = true; }
  if (page === 'crafting' && !state.craftingInitialized) { initCrafting(); state.craftingInitialized = true; }
  if (page === 'guides' && !state.guidesInitialized) { initGuides(); state.guidesInitialized = true; }
  if (page === 'comparateur') initComparateur();
  if (page === 'checklist') initChecklist();
}


const WORK_ICONS = {"kindling": "https://palworld.gg/images/icons/T_icon_palwork_00.png", "watering": "https://palworld.gg/images/icons/T_icon_palwork_01.png", "planting": "https://palworld.gg/images/icons/T_icon_palwork_02.png", "electric": "https://palworld.gg/images/icons/T_icon_palwork_03.png", "handiwork": "https://palworld.gg/images/icons/T_icon_palwork_04.png", "gathering": "https://palworld.gg/images/icons/T_icon_palwork_05.png", "lumbering": "https://palworld.gg/images/icons/T_icon_palwork_06.png", "mining": "https://palworld.gg/images/icons/T_icon_palwork_07.png", "medicine": "https://palworld.gg/images/icons/T_icon_palwork_08.png", "oilextract": "https://palworld.gg/images/icons/T_icon_palwork_09.png", "cooling": "https://palworld.gg/images/icons/T_icon_palwork_10.png", "transporting": "https://palworld.gg/images/icons/T_icon_palwork_11.png", "farming": "https://palworld.gg/images/icons/T_icon_palwork_12.png"};
const EL_ICONS = {"neutral": "https://palworld.gg/images/icons/T_Icon_element_s_00.png", "fire": "https://palworld.gg/images/icons/T_Icon_element_s_01.png", "water": "https://palworld.gg/images/icons/T_Icon_element_s_02.png", "electric": "https://palworld.gg/images/icons/T_Icon_element_s_03.png", "grass": "https://palworld.gg/images/icons/T_Icon_element_s_04.png", "dark": "https://palworld.gg/images/icons/T_Icon_element_s_05.png", "dragon": "https://palworld.gg/images/icons/T_Icon_element_s_06.png", "ground": "https://palworld.gg/images/icons/T_Icon_element_s_07.png", "ice": "https://palworld.gg/images/icons/T_Icon_element_s_08.png"};

function workIconImg(type, size=18) {
  const url = WORK_ICONS[type];
  if (!url) return '';
  return `<img src="${url}" alt="${type}" width="${size}" height="${size}" style="vertical-align:middle;margin-right:2px" loading="lazy">`;
}
function elIconImg(type, size=20) {
  const url = EL_ICONS[type];
  if (!url) return '';
  return `<img src="${url}" alt="${type}" width="${size}" height="${size}" style="vertical-align:middle" loading="lazy">`;
}

/* ── Système de notifications Toast ── */
let _toastTimer = null;
function showToast(msg, type = 'info', duration = 3000) {
  let toast = document.getElementById('toast-notif');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notif';
    toast.style.cssText = `
      position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(80px);
      background:var(--ink);color:var(--paper);padding:.65rem 1.25rem;border-radius:var(--r-md);
      font-family:var(--ff-m);font-size:.82rem;font-weight:700;
      box-shadow:4px 4px 0 rgba(0,0,0,.3);z-index:9999;
      transition:transform .25s cubic-bezier(.34,1.56,.64,1),opacity .25s;
      opacity:0;pointer-events:none;white-space:nowrap;max-width:90vw;text-align:center;
    `;
    document.body.appendChild(toast);
  }
  const colors = { info:'var(--ink)', success:'var(--mint-d)', error:'var(--coral)', warning:'#C87000' };
  toast.style.background = colors[type] || colors.info;
  toast.textContent = msg;
  toast.style.transform = 'translateX(-50%) translateY(0)';
  toast.style.opacity = '1';
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(80px)';
    toast.style.opacity = '0';
  }, duration);
}


/* ── HERO FEATURED PALS ── */
function renderFeatured() {
  // ── Barre de stats globale ──
  const statsBar = document.getElementById('home-stats-bar');
  if (statsBar) {
    const totalPals   = PALS.length;
    const totalRec    = typeof RECIPES !== 'undefined' ? RECIPES.length : 0;
    const totalCombos = typeof BREEDING_COMBOS !== 'undefined' ? BREEDING_COMBOS.length : 0;
    const totalAchs   = typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS.length : 0;
    const stats = [
      { icon:'🐾', val:totalPals,   label:'Pals',    color:'var(--mint)',   page:'pals' },
      { icon:'⚒️', val:totalRec,    label:'Recettes', color:'var(--sun)',    page:'crafting' },
      { icon:'💞', val:totalCombos, label:'Combos',   color:'var(--coral)',  page:'breeding' },
      { icon:'🏆', val:totalAchs,   label:'Succès',   color:'var(--purple)', page:'achievements' },
      { icon:'📊', val:'S→C',       label:'Tier List', color:'var(--lagoon)', page:'tierlist' },
    ];
    statsBar.innerHTML = stats.map(s => `
      <div onclick="navigate('${s.page}')" style="
        display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;
        background:var(--glass);border:1.5px solid ${s.color}44;border-radius:var(--r-md);
        cursor:pointer;transition:all .15s;box-shadow:var(--sh);flex:1;min-width:120px"
        onmouseover="this.style.borderColor='${s.color}'" onmouseout="this.style.borderColor='${s.color}44'">
        <span style="font-size:1.3rem">${s.icon}</span>
        <div>
          <div style="font-family:var(--ff-d);font-size:1.1rem;font-weight:900;color:${s.color}">${s.val}</div>
          <div style="font-size:.65rem;font-family:var(--ff-m);color:var(--ink-f)">${s.label}</div>
        </div>
      </div>`).join('');
  }

  // ── Featured Pals ──
  // Pals de la semaine : Tier S variés + un nouveau Feybreak
  const featuredIds = ['112','001','100','115','145'];
  const grid = document.getElementById('feat-grid');
  if (!grid) return;
  const featured = featuredIds.map(id => PALS.find(p => p.id === id)).filter(Boolean);
  grid.innerHTML = featured.map((p, i) => palMiniCard(p, i)).join('');
}

function palMiniCard(p, i = 0) {
  const imgHtml = palImg(p.name, 56);
  return `<div class="pal-mini fade-up" style="animation-delay:${i * 70}ms" onclick="openModal('${p.id}')">
    <div class="pm-hdr">
      <span class="pm-id mono">№ ${p.id}</span>
      <div class="pm-els">${p.el.map(e => `<span class="pm-el" style="background:${EL[e].color}" title="${EL[e].name}">${elIconImg(e, 14) || EL[e].icon}</span>`).join('')}</div>
    </div>
    ${imgHtml ? `<div style="text-align:center;margin:.3rem 0">${imgHtml}</div>` : ''}
    <div class="pm-name">${p.name}</div>
    <p class="pm-desc">${p.desc}</p>
    <div class="pm-stats">
      <div class="pm-stat"><span class="pm-stat-l">HP</span><span class="pm-stat-v" style="color:var(--coral)">${p.hp}</span></div>
      <div class="pm-stat"><span class="pm-stat-l">ATQ</span><span class="pm-stat-v" style="color:#FF8800">${p.atk}</span></div>
      <div class="pm-stat"><span class="pm-stat-l">DEF</span><span class="pm-stat-v" style="color:var(--lagoon)">${p.def}</span></div>
      <div class="pm-stat"><span class="pm-stat-l">VIT</span><span class="pm-stat-v" style="color:var(--mint-d)">${p.spd}</span></div>
    </div>
  </div>`;
}

/* ── PAGE PALS ── */
function initPals() {
  buildElementFilters();
  buildWorkFilters();
  renderPals(PALS);
}

/* Construire les boutons filtres travail */
function buildWorkFilters() {
  const container = document.getElementById('work-filter-chips');
  if (!container) return;
  // Garder le span "TRAVAIL :" existant
  const label = container.querySelector('span');
  container.innerHTML = '';
  if (label) container.appendChild(label);

  const WORK_LABELS = {
    kindling:'🔥 Allumage', watering:'💧 Arrosage', planting:'🌱 Plantation',
    electric:'⚡ Énergie', handiwork:'🔨 Artisanat', gathering:'🌿 Collecte',
    lumbering:'🪓 Abattage', mining:'⛏️ Minage', medicine:'💊 Pharmacie',
    cooling:'❄️ Réfrig.', transporting:'🚚 Transport', farming:'🐄 Élevage',
  };

  // Bouton "Tous"
  const allBtn = document.createElement('button');
  allBtn.className = 'work-filter-btn active';
  allBtn.dataset.work = 'all';
  allBtn.textContent = 'Tous';
  allBtn.onclick = () => { setWorkFilter('all', allBtn); };
  container.appendChild(allBtn);

  // Un bouton par type de travail présent dans les Pals
  const presentWorks = new Set();
  PALS.forEach(p => Object.keys(p.work || {}).forEach(w => presentWorks.add(w)));

  Object.entries(WORK_LABELS).forEach(([key, label]) => {
    if (!presentWorks.has(key)) return;
    const btn = document.createElement('button');
    btn.className = 'work-filter-btn';
    btn.dataset.work = key;
    const iconImg = WORK_ICONS?.[key]
      ? `<img src="${WORK_ICONS[key]}" width="14" height="14" style="vertical-align:middle;margin-right:3px">`
      : '';
    btn.innerHTML = iconImg + label;
    btn.onclick = () => setWorkFilter(key, btn);
    container.appendChild(btn);
  });
}

let _activeWorkFilter = 'all';

function setWorkFilter(work, btn) {
  _activeWorkFilter = work;
  document.querySelectorAll('.work-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyPalFilters();
}

function resetPalFilters() {
  _activeWorkFilter = 'all';
  document.querySelectorAll('.work-filter-btn').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('.work-filter-btn[data-work="all"]');
  if (allBtn) allBtn.classList.add('active');
  setElFilter('all');
  document.getElementById('pal-search').value = '';
  document.getElementById('work-level-min').value = '0';
  applyPalFilters();
}

function buildElementFilters() {
  const c = document.getElementById('el-filter-chips');
  c.innerHTML = `<button class="chip active" data-el="all" onclick="setElFilter('all')">Tous</button>`
    + Object.entries(EL).map(([k, v]) =>
      `<button class="chip" data-el="${k}" onclick="setElFilter('${k}')" style="border-color:var(--ink)">${v.icon} ${v.name}</button>`
    ).join('');
}

function setElFilter(key) {
  state.palFilter.element = key === 'all' ? null : key;
  document.querySelectorAll('#el-filter-chips .chip').forEach(b => {
    b.classList.toggle('active', b.dataset.el === key);
    b.style.background = (b.dataset.el === key && key !== 'all') ? EL[key]?.color || '' : '';
  });
  applyPalFilters();
}

function onPalSearch() {
  state.palFilter.search = document.getElementById('pal-search').value.toLowerCase();
  document.getElementById('pal-search-clear').style.display = state.palFilter.search ? 'flex' : 'none';
  renderPals(filteredPals());
}

function clearPalSearch() {
  document.getElementById('pal-search').value = '';
  state.palFilter.search = '';
  document.getElementById('pal-search-clear').style.display = 'none';
  renderPals(filteredPals());
}

function filteredPals() {
  const q = state.palFilter.search;
  const workFilter = typeof _activeWorkFilter !== 'undefined' ? _activeWorkFilter : 'all';
  const levelMin = parseInt(document.getElementById('work-level-min')?.value || '0');

  let list = PALS.filter(p => {
    const matchText = !q || p.name.toLowerCase().includes(q)
      || (p.nameEN && p.nameEN.toLowerCase().includes(q));
    const matchEl = !state.palFilter.element || p.el.includes(state.palFilter.element);
    const matchWork = workFilter === 'all' || ((p.work||{})[workFilter] !== undefined);
    const matchLevel = levelMin === 0 || ((p.work||{})[workFilter] || 0) >= levelMin;
    return matchText && matchEl && matchWork && matchLevel;
  });

  // Tri
  const sortKey = document.getElementById('pal-sort')?.value || 'id';
  list.sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    if (sortKey === 'hp') return b.hp - a.hp;
    if (sortKey === 'atk') return b.atk - a.atk;
    if (sortKey === 'rank') return a.rank - b.rank;
    return a.id.localeCompare(b.id);
  });

  return list;
}

function applyPalFilters() {
  state.palFilter.search = document.getElementById('pal-search')?.value.toLowerCase().trim() || '';
  renderPals(filteredPals());
}

function renderPals(list) {
  const grid = document.getElementById('pals-grid');
  const empty = document.getElementById('pals-empty');
  document.getElementById('pals-count').textContent = `${list.length} Pal${list.length > 1 ? 's' : ''} trouvé${list.length > 1 ? 's' : ''}`;
  if (!list.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  grid.innerHTML = list.map((p, i) => palFullCard(p, i)).join('');
}

function palFullCard(p, i) {
  const statsHTML = [
    { lbl: 'HP', val: p.hp, pct: Math.min(100, (p.hp / 165) * 100), c: 'var(--coral)' },
    { lbl: 'ATQ', val: p.atk, pct: Math.min(100, (p.atk / 155) * 100), c: '#FF8800' },
    { lbl: 'DEF', val: p.def, pct: Math.min(100, (p.def / 145) * 100), c: 'var(--lagoon)' },
  ].map(s => `<div class="pc-stat-row">
    <span class="pc-stat-lbl">${s.lbl}</span>
    <div class="pc-stat-bar"><div class="pc-stat-fill" style="width:${s.pct}%;background:${s.c}"></div></div>
    <span class="pc-stat-val">${s.val}</span>
  </div>`).join('');

  const workHTML = Object.keys(p.work).length
    ? `<div><span class="sec-lbl">Affinités de travail</span>
       <div class="work-chips">${Object.entries(p.work).map(([k, v]) =>
         `<span class="work-chip">${workIconImg(k, 16)}${WK[k]}<span class="work-lvl">Lv.${v}</span></span>`).join('')}</div></div>`
    : '';

  return `<article class="pal-card" style="animation-delay:${i * 30}ms" onclick="openModal('${p.id}')">
    <div class="pc-head">
      <span class="pc-id mono">№ ${p.id}</span>
      <div class="pc-els">${p.el.map(e => `<span class="pc-el" style="background:${EL[e].color}">${EL[e].icon} ${EL[e].name}</span>`).join('')}</div>
    </div>
    <div class="pc-name">${p.name}</div>
    <p class="pc-desc">${p.desc}</p>
    <div class="pc-stats">${statsHTML}</div>
    ${workHTML}
    <div><span class="sec-lbl">Compétence de partenaire</span>
    <p class="partner-txt">${p.partner}</p></div>
    ${p.hab?.length ? `<div class="habitats"><strong>Habitat :</strong>${p.hab.join(' · ')}</div>` : ''}
  </article>`;
}

/* ── MODAL DÉTAIL PAL ── */
function openModal(id) {
  const p = PALS.find(x => x.id === id);
  if (!p) return;
  const combosForPal = COMBOS.filter(c => c.child === p.name || c.parents.includes(p.name));
  const breedHTML = combosForPal.length
    ? combosForPal.slice(0, 4).map(c => `
      <div class="breed-row">
        <strong>${c.parents[0]}</strong>
        <span class="breed-x">×</span>
        <strong>${c.parents[1]}</strong>
        <span class="breed-arr">→</span>
        <strong>${c.child}</strong>
      </div>`).join('')
    : '<p style="color:var(--ink-f);font-size:.82rem">Aucun combo recensé pour ce Pal.</p>';

  const html = `
    <div class="modal-backdrop" id="modal-backdrop" onclick="closeModalOutside(event)">
      <div class="modal">
        <button class="modal-close" onclick="closeModal()">✕</button>
        <div class="modal-header">
          <div>
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:.75rem">
              ${palImg(p.name, 80)}
              <div>
                <div class="modal-id mono">№ ${p.id} · Power Rank ${p.rank} · Tier <span style="color:var(--sun);font-weight:800">${getTier(p.name)}</span></div>
              </div>
            </div>
            <div class="modal-name">${p.name}</div>
            ${p.nameEN && p.nameEN !== p.name ? `<div style="font-size:.78rem;color:var(--ink-f);font-family:var(--ff-m);margin-bottom:.3rem" title="Nom FR communautaire">🇫🇷 ${p.nameEN}</div>` : ''}
            <div class="modal-els">${p.el.map(e => `<span class="modal-el" style="background:${EL[e].color}">${EL[e].icon} ${EL[e].name}</span>`).join('')}</div>
          </div>
        </div>
        <div class="modal-stats-grid">
          <div class="modal-stat-box"><div class="modal-stat-icon">❤️</div><div class="modal-stat-val" style="color:var(--coral)">${p.hp}</div><div class="modal-stat-lbl">HP</div></div>
          <div class="modal-stat-box"><div class="modal-stat-icon">⚔️</div><div class="modal-stat-val" style="color:#FF8800">${p.atk}</div><div class="modal-stat-lbl">ATQ</div></div>
          <div class="modal-stat-box"><div class="modal-stat-icon">🛡️</div><div class="modal-stat-val" style="color:var(--lagoon)">${p.def}</div><div class="modal-stat-lbl">DEF</div></div>
          <div class="modal-stat-box"><div class="modal-stat-icon">💨</div><div class="modal-stat-val" style="color:var(--mint-d)">${p.spd}</div><div class="modal-stat-lbl">Vitesse</div></div>
        </div>
        <p style="color:var(--ink-s);margin-bottom:1.25rem;line-height:1.6;font-size:.9rem">${p.desc}</p>
        ${Object.keys(p.work).length ? `<div class="modal-section">
          <div class="modal-section-ttl">Affinités de travail</div>
          <div class="work-chips">${Object.entries(p.work).map(([k,v])=>`<span class="work-chip">${WK[k]}<span class="work-lvl">Lv.${v}</span></span>`).join('')}</div>
        </div>` : ''}
        <div class="modal-section">
          <div class="modal-section-ttl">Compétence de partenaire</div>
          <p class="partner-txt">${p.partner}</p>
        </div>
        ${p.skills ? `<div class="modal-section">
          <div class="modal-section-ttl">Compétences actives</div>
          <div class="skills-list">${p.skills.map(s=>`<span class="skill-chip">${s}</span>`).join('')}</div>
        </div>` : ''}
        ${p.drops ? `<div class="modal-section">
          <div class="modal-section-ttl">Drops</div>
          <div class="drops-list">${p.drops.map(d=>`<span class="drop-chip">🎁 ${d}</span>`).join('')}</div>
        </div>` : ''}
        ${p.hab ? `<div class="modal-section">
          <div class="modal-section-ttl">Habitats</div>
          <p style="font-size:.85rem;color:var(--ink-s)">📍 ${p.hab.join(' · ')}</p>
        </div>` : ''}
        <div class="modal-section">
          <div class="modal-section-ttl">Combos de breeding</div>
          <div class="breeding-results">${breedHTML}</div>
        </div>
        <div style="margin-top:1.5rem;display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="addToCompare('${p.id}');closeModal()">+ Comparer</button>
          <button class="btn btn-ghost btn-sm" onclick="closeModal()">Fermer</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-backdrop')?.remove();
  document.body.style.overflow = '';
}
function closeModalOutside(e) { if (e.target.id === 'modal-backdrop') closeModal(); }

/* ── COMPARATEUR ── */
function initComparateur() {
  renderComparateur();
}

function addToCompare(id) {
  const p = PALS.find(x => x.id === id);
  if (!p) return;
  if (!state.comparePals[0]) state.comparePals[0] = p;
  else if (!state.comparePals[1]) state.comparePals[1] = p;
  else { state.comparePals[0] = state.comparePals[1]; state.comparePals[1] = p; }
  if (state.page === 'comparateur') renderComparateur();
}

function removeCompare(idx) {
  state.comparePals[idx] = null;
  renderComparateur();
}

function renderComparateur() {
  const pals = state.comparePals.filter(Boolean);
  const container = document.getElementById('compare-container');
  if (!container) return;

  const STATS = [
    { key:'hp',   label:'❤️ HP',      color:'var(--coral)' },
    { key:'atk',  label:'⚔️ ATK',     color:'#FF8800' },
    { key:'def',  label:'🛡️ DEF',     color:'var(--lagoon)' },
    { key:'spd',  label:'💨 Vitesse', color:'var(--mint)' },
    { key:'rank', label:'⭐ Power',   color:'var(--sun)', invert:true },
  ];

  // Slots vides à 4
  const slots = [...state.comparePals];
  while (slots.length < 4) slots.push(null);

  const slotHtml = slots.map((p, idx) => p ? `
    <div class="compare-slot" style="flex:1;min-width:180px;max-width:260px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem">
        <div>
          <div class="pc-id mono" style="font-size:.65rem;color:var(--ink-f)">№ ${p.id} · Tier ${getTier(p.name)}</div>
          <div class="pc-name" style="font-family:var(--ff-d);font-size:1rem;font-weight:700">${p.name}</div>
          ${p.nameEN ? `<div style="font-size:.62rem;color:var(--ink-f);font-family:var(--ff-m)">🇫🇷 ${p.nameEN}</div>` : ''}
        </div>
        <button class="btn btn-ghost btn-sm" onclick="removeCompare(${idx})" style="font-size:.65rem">✕</button>
      </div>
      <div style="text-align:center;margin-bottom:.6rem">${palImg(p.name, 72)}</div>
      <div style="display:flex;gap:.3rem;justify-content:center;margin-bottom:.75rem;flex-wrap:wrap">
        ${p.el.map(e => `<span style="background:${EL[e].color};color:#fff;font-size:.62rem;padding:.15rem .45rem;border-radius:4px;font-family:var(--ff-m);font-weight:700">${elIconImg(e,12)||EL[e].icon} ${EL[e].name}</span>`).join('')}
      </div>
      <div style="display:flex;flex-direction:column;gap:.35rem">
        ${STATS.map(s => {
          const maxVal = Math.max(...slots.filter(Boolean).map(x => s.invert ? (1/x[s.key]) : x[s.key]));
          const val = s.invert ? (1/p[s.key]) : p[s.key];
          const pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
          const isWinner = slots.filter(Boolean).length > 1 && pct === 100;
          return `<div>
            <div style="display:flex;justify-content:space-between;font-size:.68rem;margin-bottom:.15rem">
              <span style="color:var(--ink-f)">${s.label}</span>
              <span style="font-weight:700;font-family:var(--ff-m);color:${isWinner ? s.color : 'var(--ink-s)'}">${s.invert ? p[s.key] : p[s.key]}${isWinner ? ' 🏆' : ''}</span>
            </div>
            <div style="height:5px;background:var(--line);border-radius:3px">
              <div style="height:100%;width:${pct}%;background:${s.color};border-radius:3px;transition:width .6s ease-out"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
      ${Object.keys(p.work||{}).length ? `
      <div style="margin-top:.75rem;padding-top:.75rem;border-top:var(--bdr)">
        <div style="font-size:.65rem;color:var(--ink-f);font-family:var(--ff-m);font-weight:700;margin-bottom:.35rem">AFFINITÉS</div>
        <div style="display:flex;flex-wrap:wrap;gap:.25rem">
          ${Object.entries(p.work).map(([k,v]) => `<span style="display:flex;align-items:center;gap:.2rem;font-size:.62rem;padding:.15rem .4rem;background:var(--paper-d);border-radius:4px;border:var(--bdr)">${workIconImg(k,12)}Lv${v}</span>`).join('')}
        </div>
      </div>` : ''}
    </div>`
  : `<div class="compare-slot compare-empty" style="flex:1;min-width:180px;max-width:260px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;opacity:.5;border:2px dashed var(--line);border-radius:var(--r-md);padding:2rem">
      <div style="font-size:2.5rem">➕</div>
      <div style="font-size:.8rem;color:var(--ink-f);text-align:center">Clique sur un Pal<br>dans le Paldeck</div>
    </div>`
  ).join('');

  // Résumé gagnant global
  let winnerHtml = '';
  if (pals.length >= 2) {
    const scores = Object.fromEntries(pals.map(p => [p.name, 0]));
    STATS.forEach(s => {
      const best = pals.reduce((a,b) => {
        if (s.invert) return a[s.key] < b[s.key] ? a : b;
        return a[s.key] > b[s.key] ? a : b;
      });
      // En cas d'égalité exacte, pas de point
      const bestVal = s.invert ? best[s.key] : best[s.key];
      const allSame = pals.every(p => p[s.key] === bestVal);
      if (!allSame) scores[best.name]++;
    });
    const maxScore = Math.max(...Object.values(scores));
    const winners = Object.entries(scores).filter(([,v]) => v === maxScore).map(([k]) => k);
    const isTie = winners.length > 1;
    winnerHtml = `
      <div style="margin-top:1.25rem;padding:.85rem 1.1rem;background:${isTie?'var(--glass)':'rgba(255,208,0,.15)'};border:1.5px solid ${isTie?'var(--line)':'var(--sun)'};border-radius:var(--r-md);display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
        ${isTie
          ? `<span style="font-size:1.4rem">🤝</span><strong>Égalité !</strong> <span style="color:var(--ink-f);font-size:.82rem">${winners.join(' & ')} sont à égalité (${maxScore} stat${maxScore>1?'s':''} gagnées)</span>`
          : `${palImg(winners[0],48)}<div><strong style="font-family:var(--ff-d);font-size:1rem">${winners[0]}</strong> remporte la comparaison<br><span style="font-size:.72rem;color:var(--ink-f)">${maxScore} stat${maxScore>1?'s':''} gagnée${maxScore>1?'s':''} sur ${STATS.length}</span></div>`
        }
      </div>`;
  }

  container.innerHTML = `
    <div style="margin-bottom:1rem;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
      <span style="font-size:.78rem;color:var(--ink-f)">Compare jusqu'à <strong>4 Pals</strong> — clique "Comparer" dans une fiche Pal pour l'ajouter.</span>
      <button class="btn btn-ghost btn-sm" onclick="state.comparePals=[null,null,null,null];renderComparateur()" style="margin-left:auto">🗑️ Vider</button>
    </div>
    <div style="display:flex;gap:.75rem;flex-wrap:wrap">${slotHtml}</div>
    ${winnerHtml}`;
}

function removeCompare(idx) {
  state.comparePals[idx] = null;
  renderComparateur();
}

function initChecklist() {
  renderChecklist();
}

function renderChecklist() {
  const done = Object.values(state.checklist).filter(Boolean).length;
  const total = CHECKLIST_ITEMS.length;
  const pct = Math.round((done / total) * 100);
  document.getElementById('checklist-progress-fill').style.width = pct + '%';
  document.getElementById('checklist-count').textContent = `${done} / ${total} objectifs accomplis (${pct}%)`;

  const cats = [...new Set(CHECKLIST_ITEMS.map(i => i.cat))];
  document.getElementById('checklist-container').innerHTML = cats.map(cat => {
    const items = CHECKLIST_ITEMS.filter(i => i.cat === cat);
    return `<div style="margin-bottom:1.5rem">
      <h3 style="font-family:var(--ff-d);font-size:1.1rem;margin-bottom:.75rem;color:var(--ink)">${cat}</h3>
      <div class="checklist-grid">
        ${items.map(item => {
          const done = state.checklist[item.id];
          return `<div class="check-item ${done ? 'done' : ''}" onclick="toggleCheck('${item.id}')">
            <div class="check-box">${done ? '✓' : ''}</div>
            <span class="check-text">${item.label}</span>
            <span class="check-badge" style="background:${done ? 'var(--mint)' : 'transparent'}">${item.badge}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

function toggleCheck(id) {
  state.checklist[id] = !state.checklist[id];
  localStorage.setItem('dresseur_checklist', JSON.stringify(state.checklist));
  renderChecklist();
}

function exportChecklist() {
  const items = document.querySelectorAll('.check-item');
  const done  = [], todo = [];
  items.forEach(el => {
    const lbl = el.querySelector('.check-label')?.textContent?.trim();
    const checked = el.querySelector('.check-box')?.classList.contains('checked');
    if (lbl) (checked ? done : todo).push((checked?'[x] ':'[ ] ') + lbl);
  });
  const text = [
    '=== LE DRESSEUR DE PALS — Ma Checklist ===',
    `Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
    '',
    `COMPLÉTÉ (${done.length})`,
    ...done,
    '',
    `À FAIRE (${todo.length})`,
    ...todo,
  ].join("\n");
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
  a.download = 'palworld-checklist.txt';
  a.click();
  showToast("📋 Checklist exportée !", "success");
}

function exportDashboard() {
  if (!window._saveAnalysis || window._saveAnalysis.capturedNames.size === 0) {
    showToast("⚠️ Importe d’abord une sauvegarde", "warning");
    return;
  }
  const captured = [...window._saveAnalysis.capturedNames].sort();
  const missing  = PALS.filter(p => !window._saveAnalysis.capturedNames.has(p.name)).map(p => p.name).sort();
  const text = [
    '=== LE DRESSEUR DE PALS — Mon Dashboard ===',
    `Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
    `Pals capturés : ${captured.length} / ${PALS.length}`,
    '',
    'CAPTURÉS :',
    ...captured.map(n => '  ✓ ' + n),
    '',
    'MANQUANTS :',
    ...missing.map(n => '  ✗ ' + n),
  ].join("\n");
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
  a.download = 'palworld-paldeck.txt';
  a.click();
  showToast("💾 Paldeck exporté !", "success");
}

function resetChecklist() {
  if (!confirm('Réinitialiser toute la progression ?')) return;
  state.checklist = {};
  localStorage.removeItem('dresseur_checklist');
  renderChecklist();
}

/* ── BREEDING PAGE ── */
function initBreeding() {
  // Par défaut sur l’onglet mécanique — déjà visible
  renderCombos('all');
  renderPassives();
  populateCalcSelects();
}

function setBreedTab(id) {
  document.querySelectorAll('#pg-breeding .tab').forEach((t, i) =>
    t.classList.toggle('active', ['mecanique','combos','passives','calculateur'][i] === id));
  document.querySelectorAll('#pg-breeding .tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('br-' + id).classList.add('active');
  state.breedTab = id;
}

function setComboFilter(tag) {
  state.comboFilter = tag;
  document.querySelectorAll('.combo-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.tag === tag));
  renderCombos(tag);
}

function renderCombos(tag) {
  const list = tag === 'all' ? COMBOS : COMBOS.filter(c => c.tags.includes(tag));
  document.getElementById('combos-list').innerHTML = list.map(c => {
    const palA = PALS.find(p => p.name === c.parents[0]);
    const palB = PALS.find(p => p.name === c.parents[1]);
    const palC = PALS.find(p => p.name === c.child);
    const elA = palA ? palA.el.map(e => elIconImg(e,14)||EL[e]?.icon).join('') : '';
    const elB = palB ? palB.el.map(e => elIconImg(e,14)||EL[e]?.icon).join('') : '';
    const elC = palC ? palC.el.map(e => elIconImg(e,14)||EL[e]?.icon).join('') : '';
    return `
    <div class="combo-card" onclick="openModal('${palC?.id||''}')" style="cursor:pointer">
      <div class="combo-parents">
        <div style="text-align:center">
          ${palImg(c.parents[0], 44)}
          <div class="combo-p" style="margin-top:.25rem">${c.parents[0]}</div>
          <div style="font-size:.6rem">${elA}</div>
        </div>
        <span class="combo-x">×</span>
        <div style="text-align:center">
          ${palImg(c.parents[1], 44)}
          <div class="combo-p" style="margin-top:.25rem">${c.parents[1]}</div>
          <div style="font-size:.6rem">${elB}</div>
        </div>
      </div>
      <div class="combo-arrow">→</div>
      <div class="combo-child">
        ${palImg(c.child, 52)}
        <div class="combo-child-name">${c.child}</div>
        <div style="font-size:.62rem;margin-top:.1rem">${elC}</div>
        ${c.note ? `<div class="combo-note">${c.note}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderPassives() {
  document.getElementById('passives-list').innerHTML = PASSIVES.map(p => `
    <div class="passive-card">
      <div class="passive-hdr">
        <span class="passive-name">${p.name}</span>
        <span class="tier tier-${p.tier}">Tier ${p.tier}</span>
      </div>
      <p class="passive-effect">✦ ${p.effect}</p>
      <p class="passive-note">${p.note}</p>
    </div>`).join('');
}

function populateCalcSelects() {
  const sorted = PALS.slice().sort((a, b) => a.name.localeCompare(b.name));
  const opts = sorted.map(p => `<option value="${p.name}">${p.name}${p.nameEN ? ' / '+p.nameEN : ''} · ${p.rank}</option>`).join('');
  ['calc-a', 'calc-b'].forEach(id => {
    document.getElementById(id).innerHTML = '<option value="">— Choisir un Pal —</option>' + opts;
  });
}

function calcBreed() {
  const aName = document.getElementById('calc-a').value;
  const bName = document.getElementById('calc-b').value;
  const ra = POWER_RANKS[aName], rb = POWER_RANKS[bName];
  document.getElementById('calc-rank-a').textContent = ra ? `Power Rank : ${ra}` : '—';
  document.getElementById('calc-rank-b').textContent = rb ? `Power Rank : ${rb}` : '—';
  if (!aName || !bName || !ra || !rb) {
    document.getElementById('calc-result').innerHTML = '<span style="color:var(--ink-f);font-size:.88rem">Sélectionne deux parents pour voir le résultat</span>';
    return;
  }
  const avg = (ra + rb) / 2;
  let best = null, bestDiff = Infinity;
  for (const [name, rank] of Object.entries(POWER_RANKS)) {
    const diff = Math.abs(rank - avg);
    if (diff < bestDiff) { bestDiff = diff; best = { name, rank }; }
  }
  const pal = PALS.find(p => p.name === best.name);
  document.getElementById('calc-result').innerHTML = `
    <div class="calc-result-pal">
      <div style="font-size:.75rem;color:var(--ink-f);font-family:var(--ff-m)">Moyenne : ${avg} → enfant estimé</div>
      <div class="calc-res-name">${best.name}</div>
      <div class="calc-res-rank">Power Rank : ${best.rank} ${pal ? `· ${pal.el.map(e => EL[e].icon).join('')}` : ''}</div>
    </div>`;
}

/* ── CRAFTING PAGE ── */
function initCrafting() {
  renderTechTree();
  renderRecipes();
  renderPostes();
}

function setCraftTab(id) {
  document.querySelectorAll('#pg-crafting .tab').forEach((t, i) =>
    t.classList.toggle('active', ['arbre','recettes','postes'][i] === id));
  document.querySelectorAll('#pg-crafting .tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('cr-' + id).classList.add('active');
  state.craftTab = id;
}

function setTechFilter(type) {
  state.techFilter.type = type;
  document.querySelectorAll('.tech-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  renderTechTree();
}

function onTechSearch() {
  state.techFilter.search = document.getElementById('tech-search-input').value.toLowerCase();
  renderTechTree();
}

function renderTechTree() {
  document.getElementById('tech-tree').innerHTML = TECH_TREE.map(lvl => {
    const items = lvl.items.filter(i =>
      (state.techFilter.type === 'all' || i.type === state.techFilter.type) &&
      (!state.techFilter.search || i.name.toLowerCase().includes(state.techFilter.search))
    );
    if (!items.length) return '';
    return `<div class="tech-lvl open">
      <div class="tech-lvl-hdr" onclick="this.parentElement.classList.toggle('open');this.parentElement.querySelector('.tech-lvl-arrow').textContent=this.parentElement.classList.contains('open')?'›':'›'">
        <span class="tech-lvl-num">Niv. ${lvl.lvl}</span>
        <span class="tech-pts">${lvl.pts} pt${lvl.pts > 1 ? 's' : ''}</span>
        <span class="tech-lvl-title">${items.slice(0, 2).map(i => i.icon + ' ' + i.name).join(' · ')}${items.length > 2 ? '…' : ''}</span>
        <span class="tech-lvl-count">${items.length} tech</span>
        <span class="tech-lvl-arrow">›</span>
      </div>
      <div class="tech-lvl-body">
        ${items.map(i => `<div class="tech-item">
          <div class="tech-item-hdr">${i.icon} <span class="tech-item-name">${i.name}</span>
            <span class="tech-type-badge badge-${i.type}">${i.type}</span></div>
          <div class="tech-recipe">${i.recipe}</div>
          ${i.desc ? `<div class="tech-item-desc">${i.desc}</div>` : ''}
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function renderRecipes() {
  document.getElementById('recipes-list').innerHTML = RECIPES.map(r => `
    <div class="recipe-card">
      <div class="recipe-name">${r.icon} ${r.name}</div>
      <div class="recipe-station">${r.station}</div>
      ${r.note ? `<div class="recipe-note">${r.note}</div>` : ''}
      <div class="recipe-ing">${r.ing.map(i => `
        <div class="recipe-row">
          <span>${i.n}</span>
          <span class="recipe-qty">×${i.q}</span>
        </div>`).join('')}
      </div>
    </div>`).join('');
}

function renderPostes() {
  document.getElementById('postes-list').innerHTML = POSTES.map(p => {
    const workIconHtml = WORK_ICONS?.[p.id]
      ? `<img src="${WORK_ICONS[p.id]}" width="22" height="22" style="vertical-align:middle;margin-right:.4rem">`
      : `<span class="poste-icon">${p.icon}</span>`;

    const palRows = p.pals.map(pal => {
      const palObj = PALS.find(x => x.name === pal.n);
      const img = palImg(pal.n, 38);
      const els  = palObj ? palObj.el.map(e => elIconImg(e,12) || EL[e]?.icon || '').join('') : '';
      const stars = '★'.repeat(pal.lvl || 0) + '☆'.repeat(Math.max(0, 4-(pal.lvl||0)));
      return `
        <div class="poste-pal-row" onclick="${palObj ? `openModal('${palObj.id}')` : ''}"
             style="${palObj ? 'cursor:pointer;' : ''}display:flex;align-items:center;gap:.6rem;
             padding:.45rem .6rem;border-radius:8px;background:var(--paper-d);border:var(--bdr);
             transition:background .15s" onmouseover="this.style.background='var(--paper-h)'" onmouseout="this.style.background='var(--paper-d)'">
          ${img || '<div style="width:38px;height:38px;background:var(--line);border-radius:6px"></div>'}
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:.8rem;display:flex;align-items:center;gap:.3rem">
              ${pal.n}
              <span style="font-size:.55rem">${els}</span>
              ${pal.note ? `<span class="stamp" style="font-size:.55rem;margin-left:.2rem">${pal.note}</span>` : ''}
            </div>
            <div style="font-family:var(--ff-m);font-size:.62rem;color:var(--sun);letter-spacing:.05em">${stars}</div>
          </div>
          <span style="font-family:var(--ff-m);font-weight:800;font-size:.75rem;color:var(--mint-d);flex-shrink:0">Lv ${pal.lvl||'?'}</span>
        </div>`;
    }).join('');

    return `
    <div class="poste-card">
      <div class="poste-hdr">
        ${workIconHtml}
        <span class="poste-name">${p.name}</span>
      </div>
      <div class="poste-body">
        <p class="poste-desc">${p.desc}</p>
        <div style="display:flex;flex-direction:column;gap:.35rem">${palRows}</div>
      </div>
    </div>`;
  }).join('');
}

function initGuides() {
  renderTimeline();
  renderTours();
  renderRaids();
  renderLegendaires();
}

function setGuideTab(id) {
  document.querySelectorAll('#pg-guides .tab').forEach((t, i) =>
    t.classList.toggle('active', ['progression','tours','raids','legendaires'][i] === id));
  document.querySelectorAll('#pg-guides .tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('gu-' + id).classList.add('active');
  state.guideTab = id;
}

function renderTimeline() {
  document.getElementById('guides-timeline').innerHTML = [
    { range:'Niv. 1–15', color:'#00E34A', title:'🌱 Early Game — Poser les bases', intro:'Monter vite et établir une base fonctionnelle.',
      steps:['Capture massivement les Pals (chaque capture donne de l\'XP). Vise 10× le même Pal pour le bonus Paldeck.','Construis : Palbox → Atelier → Fonderie → Ferme de baies → Marmite.','Équipe idéale : Tanzee (artisanat), Lifmunk (médecine), Foxparks (feu), Pengullet (eau+glace), Cattiva (porteur).','Niveau 15 : capture un Nitewing et fabrique sa selle → 1ère monture volante, exploration décuplée.','Explore les donjons dès le niv. 10 pour les ressources et l\'XP.']},
    { range:'Niv. 15–30', color:'#FFD000', title:'⚒️ Mid Game — Spécialisation', intro:'Automatiser la base et préparer les premiers boss.',
      steps:['Débloque la Ferme d\'élevage (niv. 19) et commence à farmer du Gâteau (Mozzarina + Beegarde + Chikipi = essentiels).','Installe : Fonderie avancée, Usine d\'assemblage, Atelier de médecine, Ferme à blé.','Recrute Anubis via breeding (Caprity × Beegarde) → Artisanat Lv.4 change tout.','Capture Direhowl pour monture rapide, puis vise Kitsun (immunité chaleur).','Attaque les Tours Rayne (niv. 20) et Free Pal Alliance (niv. 30).']},
    { range:'Niv. 30–50', color:'#FF5533', title:'🔥 Late Game — Domination', intro:'Compléter les 5 Tours et accéder à Sakurajima.',
      steps:['Complète les 5 Tours dans l\'ordre conseillé (voir onglet Tours).','Farm Sakurajima (Oil Rig) pour les matériaux endgame : Composants avancés, Fibre de carbone, armes rang 5.','Recrute Lyleen (Plantation+Médecine Lv.3) et Orserk (Électricité Lv.4).','Améliore tes Pals via le Condenseur d\'essence (α+4 = +20% stats). Fusionne 4× le même Pal.','Prépare des Pals avec 4 passives S pour les raids.']},
    { range:'Niv. 55–60', color:'#8B2FFF', title:'👑 Endgame — Maîtrise absolue', intro:'Légendaires, raids Xenolord et PvP (v0.7).',
      steps:['Capture tous les légendaires : Jetragon, Frostallion, Paladius, Necromus, Blazamut Ryu.','Lance les raids Bellanoir → Bellanoir Libero → Xenolord (ordre conseillé).','Explore les zones Feybreak pour les Pals 127–140 (Azurmane, Bastigor, Gildane…).','Optimise tes Pals via breeding 4 passives S : Legend + Musclehead + Ferocious + Lucky.','PvP (v0.7) : meta centrée sur Jetragon, Orserk et Legend + Swift.']},
  ].map(step => `
    <div class="tl-item">
      <div class="tl-badge" style="background:${step.color};${step.color==='#FFD000'?'color:var(--ink)':'color:#fff'}">${step.range}</div>
      <div class="tl-card">
        <div class="tl-title">${step.title}</div>
        <p class="tl-p"><strong>Objectif :</strong> ${step.intro}</p>
        <ul class="tl-list">${step.steps.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
    </div>`).join('');
}

function renderTours() {
  // Mapping boss name → Pal name pour les portraits
  const BOSS_PAL = {
    'Grizzbolt':'Grizzbolt','Lyleen':'Lyleen','Orserk':'Orserk',
    'Faleris':'Faleris','Shadowbeak':'Shadowbeak','Selyne':'Selyne','Bastigor':'Bastigor',
  };
  const EL_COLORS = {fire:'#FF6B35',water:'#4FC3F7',electric:'#FFD54F',
    grass:'#66BB6A',ice:'#80DEEA',dark:'#7B5EA7',dragon:'#6C4CF2',
    ground:'#A1887F',neutral:'#9E9E9E'};

  document.getElementById('tours-list').innerHTML = TOURS.map((t, i) => {
    const elColor = EL_COLORS[t.el] || '#888';
    const palName = BOSS_PAL[t.name.split(' & ')[1]] || null;
    const palObj = palName ? PALS.find(p => p.name === palName) : null;
    const bossImg = palName ? palImg(palName, 72) : '';
    const palElIcons = palObj ? palObj.el.map(e => elIconImg(e,16)||EL[e]?.icon||'').join('') : '';

    return `
    <div class="tour-card" style="animation-delay:${i * 60}ms;border-left:5px solid ${elColor}">
      <div style="display:flex;gap:1rem;align-items:flex-start">
        ${bossImg ? `<div style="flex-shrink:0;text-align:center">
          ${bossImg}
          <div style="font-size:.55rem;color:var(--ink-f);margin-top:.2rem">${palElIcons}</div>
        </div>` : ''}
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.4rem">
            <span style="font-family:var(--ff-m);font-size:.65rem;font-weight:800;padding:.15rem .5rem;border-radius:4px;background:${elColor};color:${['#FFD54F','#80DEEA'].includes(elColor)?'#000':'#fff'}">TOUR ${i+1}</span>
            <span style="font-family:var(--ff-d);font-weight:700;font-size:.9rem">${t.name}</span>
            <span style="font-family:var(--ff-m);font-size:.65rem;background:var(--coral);color:#fff;padding:.1rem .4rem;border-radius:4px">Lv ${t.lvl}</span>
          </div>
          <div style="font-size:.78rem;font-weight:700;margin-bottom:.3rem">👑 ${t.boss}</div>
          ${t.tips ? `<div style="font-size:.72rem;color:var(--ink-s);font-style:italic;margin-bottom:.35rem">💡 ${typeof t.tips === 'string' ? t.tips : t.tips}</div>` : ''}
          ${t.unlock ? `<div style="font-family:var(--ff-m);font-size:.65rem;color:var(--mint-d)">🔓 ${t.unlock}</div>` : ''}
          ${palObj ? `<button class="btn btn-ghost btn-sm" onclick="openModal('${palObj.id}')" style="margin-top:.4rem;font-size:.65rem">Voir fiche ${palObj.name}</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderRaids() {
  document.getElementById('raids-list').innerHTML = RAIDS.map(r => {
    const palObj = PALS.find(p => p.name === r.name || p.name === r.name.replace(' Libero','').replace(' Ryu',''));
    const bossImg = palImg(r.name, 64) || (palObj ? palImg(palObj.name, 64) : '');
    const EL_COLORS2 = {fire:'#FF6B35',water:'#4FC3F7',electric:'#FFD54F',dark:'#7B5EA7',neutral:'#9E9E9E',ice:'#80DEEA'};
    const elColor2 = EL_COLORS2[r.el] || '#888';
    return `
    <div class="raid-card" style="border-left:4px solid ${elColor2}">
      <div style="display:flex;gap:.75rem;align-items:flex-start;margin-bottom:.75rem">
        ${bossImg}
        <div>
          <div class="raid-hdr" style="margin-bottom:.25rem">
            <span class="raid-name">${r.name}</span>
          </div>
      <div class="raid-body">
        <div class="raid-mat">📦 <strong>Matériaux requis :</strong> ${r.mat}<br><em style="font-size:.75rem;color:var(--ink-f)">Source : ${r.src}</em></div>
        <p class="raid-desc">${r.desc}</p>
        <div class="raid-compo"><div class="raid-ttl">Composition recommandée</div>
          ${r.compo.map(p => `<div class="raid-pal-row"><strong>${p.pal}</strong><span class="raid-role">${p.role}</span></div>`).join('')}
        </div>
        <div class="raid-tips">${r.tips.map(t => `<div class="raid-tip">▸ ${t}</div>`).join('')}</div>
        <div class="raid-reward">🎁 ${r.reward}</div>
      </div>
    </div>`;
  }).join('');
}

function renderLegendaires() {
  document.getElementById('leg-list').innerHTML = LEGENDAIRES.map((l, i) => {
    const palObj = PALS.find(p => p.name === l.name);
    const img = palImg(l.name, 80);
    return `
    <div class="leg-card" style="animation-delay:${i * 60}ms">
      <div class="leg-hdr" style="display:flex;align-items:flex-start;gap:.85rem">
        ${img}
        <div>
          <div class="leg-els">${l.el.map((e, j) => `<span class="leg-el-chip" style="background:${l.elColor?.[j]||'#888'};color:#fff">${elIconImg(e,14)||EL[e]?.icon||''} ${EL[e]?.name||e}</span>`).join('')}</div>
          <div class="leg-name">${l.name}</div>
        </div>
      </div>
      <div class="leg-body">
        <div class="leg-diff">${l.diff}</div>
        <div class="leg-stats-row">
          <div class="leg-stat-box"><div class="leg-stat-lbl">HP</div><div class="leg-stat-val" style="color:var(--coral)">${l.hp}</div></div>
          <div class="leg-stat-box"><div class="leg-stat-lbl">ATQ</div><div class="leg-stat-val" style="color:#FF8800">${l.atk}</div></div>
          <div class="leg-stat-box"><div class="leg-stat-lbl">DEF</div><div class="leg-stat-val" style="color:var(--lagoon)">${l.def}</div></div>
          <div class="leg-stat-box"><div class="leg-stat-lbl">VIT</div><div class="leg-stat-val" style="color:var(--mint-d)">${l.spd}</div></div>
        </div>
        <div class="leg-loc">📍 <strong>Localisation :</strong> ${l.loc}</div>
        <div class="leg-tips">${l.tips.map(t => `<div class="leg-tip">▸ ${t}</div>`).join('')}</div>
        ${l.passives ? `<div style="font-family:var(--ff-m);font-size:.72rem;color:var(--mint-d);font-weight:700">⭐ ${l.passives.join(' · ')}</div>` : ''}
        ${palObj ? `<button class="btn btn-ghost btn-sm" onclick="openModal('${palObj.id}')" style="margin-top:.5rem;font-size:.65rem">Voir fiche ${palObj.name}</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

/* ── RECHERCHE GLOBALE ── */
function onGlobalSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  const box = document.getElementById('global-results');
  if (!q) { box.innerHTML = ''; box.style.display = 'none'; return; }
  box.style.display = 'block';

  const palRes   = PALS.filter(p => p.name.toLowerCase().includes(q) || (p.nameEN && p.nameEN.toLowerCase().includes(q))).slice(0, 6);
  const recRes   = (typeof RECIPES !== 'undefined' ? RECIPES : []).filter(r => r.name.toLowerCase().includes(q)).slice(0, 3);
  const comboRes = BREEDING_COMBOS.filter(c => c.child.toLowerCase().includes(q) || c.p1.toLowerCase().includes(q) || c.p2.toLowerCase().includes(q)).slice(0, 3);
  const achRes   = (typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS : []).filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)).slice(0, 2);

  let html = '';

  if (palRes.length) html += `
    <div class="sr-section">
      <div class="sr-ttl">📖 Pals (${palRes.length})</div>
      ${palRes.map(p => `
        <div class="sr-item" onclick="closeGlobalSearch();navigate('pals');setTimeout(()=>openModal('${p.id}'),200)">
          ${palImg(p.name, 28)}
          <div>
            <strong>${p.name}</strong>
            ${p.nameEN ? `<span style="color:var(--ink-f);font-size:.72rem"> / ${p.nameEN}</span>` : ''}
          </div>
          <span style="margin-left:auto;font-family:var(--ff-m);font-size:.65rem;color:var(--ink-f)">№${p.id}</span>
          <span style="font-size:.7rem">${p.el.map(e=>elIconImg(e,14)||EL[e]?.icon||'').join('')}</span>
        </div>`).join('')}
    </div>`;

  if (comboRes.length) html += `
    <div class="sr-section">
      <div class="sr-ttl">💞 Breeding (${comboRes.length})</div>
      ${comboRes.map(c => `
        <div class="sr-item" onclick="closeGlobalSearch();navigate('breeding');setTimeout(()=>setBreedTab('combos'),200)">
          ${palImg(c.p1, 22)} <span style="font-size:.75rem">${c.p1}</span>
          <span style="color:var(--ink-f);margin:0 .2rem">×</span>
          ${palImg(c.p2, 22)} <span style="font-size:.75rem">${c.p2}</span>
          <span style="color:var(--ink-f);margin:0 .2rem">→</span>
          ${palImg(c.child, 24)} <strong style="font-size:.75rem;color:var(--mint-d)">${c.child}</strong>
        </div>`).join('')}
    </div>`;

  if (recRes.length) html += `
    <div class="sr-section">
      <div class="sr-ttl">⚒️ Recettes (${recRes.length})</div>
      ${recRes.map(r => `
        <div class="sr-item" onclick="closeGlobalSearch();navigate('crafting')">
          <span style="font-size:1.1rem">${r.icon}</span>
          <strong>${r.name}</strong>
          <span style="color:var(--ink-f);font-size:.72rem;margin-left:auto">${r.via}</span>
        </div>`).join('')}
    </div>`;

  if (achRes.length) html += `
    <div class="sr-section">
      <div class="sr-ttl">🏆 Succès (${achRes.length})</div>
      ${achRes.map(a => `
        <div class="sr-item" onclick="closeGlobalSearch();navigate('achievements')">
          <span style="font-size:1.1rem">${a.icon}</span>
          <div>
            <strong style="font-size:.78rem">${a.name}</strong>
            <div style="font-size:.65rem;color:var(--ink-f)">${a.desc.slice(0,60)}…</div>
          </div>
        </div>`).join('')}
    </div>`;

  if (!html) html = '<div style="padding:.85rem 1rem;color:var(--ink-f);font-size:.85rem;text-align:center">🔍 Aucun résultat pour "<strong>${q}</strong>"</div>';
  box.innerHTML = html;
}

function closeGlobalSearch() {
  setTimeout(() => { document.getElementById('global-results').innerHTML = ''; }, 200);
}


/* ── INIT ── */
// Les boutons nav ont onclick direct dans le HTML, pas de binding JS nécessaire
renderFeatured();

/* ══════════════════════════════════════════════════
   IMPORT SAUVEGARDE — utilise js/save-parser.js
   analyzeSaveFile() retourne { capturedNames, playerName, level, method }
   capturedNames = Set de noms anglais officiels (ex: 'Anubis', 'Lyleen'…)
══════════════════════════════════════════════════ */

function onSaveFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  const sz = (file.size / 1024 / 1024).toFixed(1);
  document.getElementById('save-status').innerHTML =
    `<div class="save-loading">⏳ Lecture de <strong>${escHtml(file.name)}</strong> (${sz} Mo)…</div>`;
  document.getElementById('save-results').innerHTML = '';

  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const analysis = await analyzeSaveFile(ev.target.result);
      if (analysis.method === 'none') {
        document.getElementById('save-status').innerHTML = `
          <div class="save-error">
            ⚠️ Aucun Pal détecté dans ce fichier.<br>
            <small>Assure-toi d’importer <strong>Level.sav</strong> ou ton fichier joueur
            depuis <code>%LOCALAPPDATA%\\Pal\\Saved\\SaveGames\\</code></small>
          </div>`;
        return;
      }

      // Mapper les noms officiels anglais → objets Pal du site
      const capturedIds = new Set();
      for (const officialName of analysis.capturedNames) {
        // Cherche par name (anglais) ou nameEN (français)
        const pal = PALS.find(p =>
          p.name === officialName ||
          (p.nameEN && p.nameEN === officialName)
        );
        if (pal) capturedIds.add(pal.id);
      }

      renderSaveResults(capturedIds, file.name, analysis);
    } catch (err) {
      document.getElementById('save-status').innerHTML =
        `<div class="save-error">❌ Erreur : ${escHtml(err.message)}</div>`;
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

function renderSaveResults(capturedIds, filename, analysis) {
  const total    = PALS.length;
  const found    = capturedIds.size;
  const pct      = Math.round((found / total) * 100);
  const missing  = PALS.filter(p => !capturedIds.has(p.id));
  const captured = PALS.filter(p =>  capturedIds.has(p.id));

  // Badge méthode
  const methodBadge = analysis.method === 'gvas'
    ? '<span style="background:var(--mint);color:#fff;font-size:.65rem;padding:.15rem .5rem;border-radius:4px;border:1.5px solid var(--ink);font-weight:800;font-family:var(--ff-m);margin-left:.5rem">GVAS ✓</span>'
    : '<span style="background:var(--sun);color:var(--ink);font-size:.65rem;padding:.15rem .5rem;border-radius:4px;border:1.5px solid var(--ink);font-weight:800;font-family:var(--ff-m);margin-left:.5rem">SCAN</span>';

  const playerInfo = analysis.playerName
    ? `· Joueur : <strong>${escHtml(analysis.playerName)}</strong>`
    : '';
  const levelInfo = analysis.level > 0
    ? `· Niveau <strong>${analysis.level}</strong>` : '';

  document.getElementById('save-status').innerHTML = `
    <div class="save-success">
      ✅ <strong>${escHtml(filename)}</strong>${methodBadge}
      ${playerInfo} ${levelInfo}<br>
      <strong>${found}</strong> Pal${found>1?'s':''} détecté${found>1?'s':''} sur ${total}
    </div>`;

  document.getElementById('save-results').innerHTML = `
    <div class="progress-bar-wrap" style="margin-bottom:1.5rem">
      <div class="progress-label">
        <span style="font-weight:700;font-size:.95rem">Complétion du Paldeck — ${pct}%</span>
        <span class="mono" style="color:var(--mint-d);font-weight:700">${found} / ${total}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" id="save-fill" style="width:0%;transition:width .8s ease-out"></div>
      </div>
    </div>

    <div class="tabs" style="margin-bottom:1.5rem">
      <button class="tab active" onclick="showSaveTab('missing',this)">❌ À capturer (${missing.length})</button>
      <button class="tab"        onclick="showSaveTab('captured',this)">✅ Capturés (${found})</button>
    </div>

    <div id="save-tab-missing">
      ${missing.length === 0
        ? '<div class="empty-state"><div style="font-size:3rem;margin-bottom:.75rem">🎉</div><div class="empty-title">Paldeck complet !</div></div>'
        : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:.75rem">
            ${missing.map(p => `
              <div class="pal-mini" onclick="openModal('${p.id}')" style="opacity:.65;border-color:var(--coral)">
                <div class="pm-hdr">
                  <span class="pm-id mono">№ ${p.id}</span>
                  <div class="pm-els">${p.el.map(e=>`<span class="pm-el" style="background:${EL[e].color}">${EL[e].icon}</span>`).join('')}</div>
                </div>
                <div class="pm-name">${p.name}</div>
                ${p.nameEN ? `<div style="font-size:.65rem;color:var(--ink-f);font-family:var(--ff-m)">${p.nameEN}</div>` : ''}
                <div style="margin-top:.4rem;font-size:.7rem;padding:.2rem .45rem;background:rgba(255,61,26,.1);border-radius:5px;border:1px solid var(--coral);color:var(--coral);font-weight:700;display:inline-block">Non capturé</div>
              </div>`).join('')}
          </div>`
      }
    </div>

    <div id="save-tab-captured" style="display:none">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:.75rem">
        ${captured.map(p => `
          <div class="pal-mini" onclick="openModal('${p.id}')">
            <div class="pm-hdr">
              <span class="pm-id mono">№ ${p.id}</span>
              <div class="pm-els">${p.el.map(e=>`<span class="pm-el" style="background:${EL[e].color}">${EL[e].icon}</span>`).join('')}</div>
            </div>
            <div class="pm-name">${p.name}</div>
            ${p.nameEN ? `<div style="font-size:.65rem;color:var(--ink-f);font-family:var(--ff-m)">${p.nameEN}</div>` : ''}
            <div style="margin-top:.4rem;font-size:.7rem;padding:.2rem .45rem;background:rgba(0,227,74,.12);border-radius:5px;border:1px solid var(--mint-d);color:var(--mint-d);font-weight:700;display:inline-block">✓ Capturé</div>
          </div>`).join('')}
      </div>
    </div>`;

  requestAnimationFrame(() => {
    document.getElementById('save-fill').style.width = pct + '%';
  });
  // Notifier la page succès
  onSaveAnalyzed(analysis);
}

function showSaveTab(tab, btn) {
  document.querySelectorAll('#save-results .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('save-tab-missing').style.display  = tab === 'missing'  ? '' : 'none';
  document.getElementById('save-tab-captured').style.display = tab === 'captured' ? '' : 'none';
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════════════
   SUCCÈS STEAM — Détection depuis la sauvegarde
   33 succès au total (v0.7 Feybreak)
══════════════════════════════════════════════════ */

const ACHIEVEMENTS = [
  // ════════════════════════════════════════════
  // JEUX DE BASE EA — 12 succès
  // ════════════════════════════════════════════
  {
    id:'ach_first', cat:'Paldeck', icon:'🥚', update:'EA',
    name:'Beginning of the Legend',
    desc:'Capturez votre premier Pal.',
    detect:(a) => a.capturedNames.size >= 1,
    threshold:1, manual:false,
    tip:'Auto-détecté dès qu’un Pal est trouvé dans ta sauvegarde.'
  },
  {
    id:'ach_10', cat:'Paldeck', icon:'🟢', update:'EA',
    name:'Newbie Pal Tamer',
    desc:'Capturez 10 espèces de Pals différentes.',
    detect:(a) => a.capturedNames.size >= 10,
    threshold:10, manual:false
  },
  {
    id:'ach_20', cat:'Paldeck', icon:'🔵', update:'EA',
    name:'Intermediate Pal Tamer',
    desc:'Capturez 20 espèces de Pals différentes.',
    detect:(a) => a.capturedNames.size >= 20,
    threshold:20, manual:false
  },
  {
    id:'ach_50', cat:'Paldeck', icon:'🟡', update:'EA',
    name:'Skilled Pal Tamer',
    desc:'Capturez 50 espèces de Pals différentes.',
    detect:(a) => a.capturedNames.size >= 50,
    threshold:50, manual:false
  },
  {
    id:'ach_90', cat:'Paldeck', icon:'🟠', update:'EA',
    name:'Seasoned Pal Tamer',
    desc:'Capturez 90 espèces de Pals différentes.',
    detect:(a) => a.capturedNames.size >= 90,
    threshold:90, manual:false
  },
  {
    id:'ach_t1', cat:'Tours', icon:'🗼', update:'EA',
    name:'Hillside Sovereign',
    desc:'Vaincre Zoe & Grizzbolt — Tour du Syndicat Rayne.',
    detect:(a) => false, manual:true,
    tip:'Niveau recommandé : 20. Pals Terre contre Grizzbolt.'
  },
  {
    id:'ach_t2', cat:'Tours', icon:'🗼', update:'EA',
    name:'Snowfall Sovereign',
    desc:'Vaincre Lily & Lyleen — Tour de la Free Pal Alliance.',
    detect:(a) => false, manual:true,
    tip:'Niveau recommandé : 30. Pals Feu contre Lyleen.'
  },
  {
    id:'ach_t3', cat:'Tours', icon:'🗼', update:'EA',
    name:'Volcano Sovereign',
    desc:'Vaincre Axel & Orserk — Tour des PAL Moonflowers.',
    detect:(a) => false, manual:true,
    tip:'Niveau recommandé : 50. Pals Glace contre Orserk.'
  },
  {
    id:'ach_t4', cat:'Tours', icon:'🗼', update:'EA',
    name:'Desert Sovereign',
    desc:'Vaincre Marcus & Faleris — Tour du PIDF.',
    detect:(a) => false, manual:true,
    tip:'Niveau recommandé : 45. Pals Eau contre Faleris.'
  },
  {
    id:'ach_t5', cat:'Tours', icon:'🗼', update:'EA',
    name:'Astral Sovereign',
    desc:'Vaincre Victor & Shadowbeak — Tour des Brothers of the Eternal Pyre.',
    detect:(a) => false, manual:true,
    tip:'Niveau recommandé : 40. Pals Dragon contre Shadowbeak.'
  },

  {
    id:'ach_oilrig', cat:'Exploration', icon:'🛢️', update:'EA',
    name:'Conqueror of the Sea',
    desc:'Capturer l’Oil Rig (Syndicat Rayne — niveau 55).',
    detect:(a) => false, manual:true,
    tip:'Oil Rig au sud-est de l’île des Marais. Arrive en vol avec Jetragon.'
  },

  // ════════════════════════════════════════════
  // SAKURAJIMA v0.3 — 19 succès
  // ════════════════════════════════════════════
  {
    id:'ach_140', cat:'Paldeck', icon:'🔴', update:'Sakurajima',
    name:'Exceptional Pal Tamer',
    desc:'Capturez 140 espèces de Pals différentes (variants inclus).',
    detect:(a) => a.capturedNames.size >= 140,
    threshold:140, manual:false
  },
  {
    id:'ach_1000', cat:'Paldeck', icon:'💎', update:'Sakurajima',
    name:'Overhunting',
    desc:'Capturez 1 000 Pals au total (toutes espèces).',
    detect:(a) => false, manual:true,
    tip:'Non détectable depuis le Paldeck. À cocher une fois atteint en jeu.'
  },
  {
    id:'ach_human', cat:'Paldeck', icon:'🙋', update:'Sakurajima',
    name:'Inhuman Act',
    desc:'Capturez un être humain avec une Sphère Pal.',
    detect:(a) => false, manual:true,
    tip:'Capture un bandit ou un garde de faction. Succès obtenu à la capture.'
  },
  {
    id:'ach_jetragon', cat:'Légendaires', icon:'🚀', update:'Sakurajima',
    name:'Legendary Celestial Dragon',
    desc:'Capturez Jetragon. (Pic du Dragon, nord-est)',
    detect:(a) => a.capturedNames.has('Jetragon'), manual:false,
    tip:'Auto-détecté si Jetragon est dans ta sauvegarde.'
  },
  {
    id:'ach_paladius', cat:'Légendaires', icon:'🤍', update:'Sakurajima',
    name:'Holy Knight of Legend',
    desc:'Capturez Paladius. (Plaines saintes)',
    detect:(a) => a.capturedNames.has('Paladius'), manual:false
  },
  {
    id:'ach_necromus', cat:'Légendaires', icon:'🖤', update:'Sakurajima',
    name:'Dark Knight of Legend',
    desc:'Capturez Necromus. (Désert des âmes)',
    detect:(a) => a.capturedNames.has('Necromus'), manual:false
  },
  {
    id:'ach_frostallion', cat:'Légendaires', icon:'❄️', update:'Sakurajima',
    name:'Legendary Steed of Ice',
    desc:'Capturez Frostallion. (Sommet des neiges éternelles)',
    detect:(a) => a.capturedNames.has('Frostallion'), manual:false
  },
  {
    id:'ach_t6', cat:'Tours', icon:'🗼', update:'Sakurajima',
    name:'Blossom Sovereign',
    desc:'Vaincre Saya & Selyne — Tour de Sakurajima.',
    detect:(a) => false, manual:true,
    tip:'Niveau recommandé : 50+. Saya se trouve sur Sakurajima.'
  },
  {
    id:'ach_notes', cat:'Collection', icon:'📜', update:'Sakurajima',
    name:'Trail of the Castaway',
    desc:'Collectez 40 Notes éparpillées dans le monde.',
    detect:(a) => false, manual:true,
    tip:'Les Notes se trouvent près des monuments, tours et zones d’intérêt.'
  },
  {
    id:'ach_effigies', cat:'Collection', icon:'🗿', update:'Sakurajima',
    name:'Palpagos Guru',
    desc:'Collectez 255 Effigies de Lifmunk.',
    detect:(a) => false, manual:true,
    tip:'255 sur les 280 statues disponibles. Utilise la carte interactive palworld.gg.'
  },
  {
    id:'ach_rank1', cat:'Progression', icon:'⬆️', update:'Sakurajima',
    name:'All for One',
    desc:'Maximisez le rang d’un Pal (4 fusions dans le Condenseur).',
    detect:(a) => a.capturedNames.size >= 10, manual:true,
    tip:'Fusionne 4× le même Pal dans le Condenseur d’essence Pal.'
  },
  {
    id:'ach_rank5', cat:'Progression', icon:'🏅', update:'Sakurajima',
    name:'Voice of Resentment',
    desc:'Maximisez le rang de 5 Pals différents.',
    detect:(a) => a.capturedNames.size >= 30, manual:true,
    tip:'Nécessite 5 × 4 fusions. Gobfin est facile à farmer en masse.'
  },
  {
    id:'ach_dungeon', cat:'Progression', icon:'⛏️', update:'Sakurajima',
    name:'Senior Adventurer',
    desc:'Complétez 20 Donjons.',
    detect:(a) => a.level >= 25, manual:true,
    tip:'Les donjons sont des zones temporisées sur la carte. 20 à compléter.'
  },
  {
    id:'ach_hard', cat:'Progression', icon:'🏆', update:'Sakurajima',
    name:'Champion of the Palpagos Islands',
    desc:'Vaincre 6 Tours de boss en mode Difficile.',
    detect:(a) => false, manual:true,
    tip:'Il faut battre les 6 tours d’affilée en mode Hard. Nécessite endgame complet.'
  },
  {
    id:'ach_spheres', cat:'Craft', icon:'🟢', update:'Sakurajima',
    name:'Sphere Craftsman',
    desc:'Craftez 2 000 Sphères Pal (tous types confondus).',
    detect:(a) => false, manual:true,
    tip:'Automatise avec Usine d’assemblage + Pals Travaux manuels.'
  },
  {
    id:'ach_ingots', cat:'Craft', icon:'⚙️', update:'Sakurajima',
    name:'Iron Heart',
    desc:'Craftez 10 000 Lingots de métal.',
    detect:(a) => false, manual:true,
    tip:'Fonderie automatique avec Pals Allumage. Prend du temps.'
  },
  {
    id:'ach_ammo', cat:'Craft', icon:'🔫', update:'Sakurajima',
    name:'Blood and Iron',
    desc:'Craftez 20 000 munitions (tous types confondus).',
    detect:(a) => false, manual:true,
    tip:'Automatise avec Usine d’assemblage. Craft des balles basiques en masse.'
  },
  {
    id:'ach_raid1', cat:'Raids', icon:'💀', update:'Sakurajima',
    name:'Twilight Siren',
    desc:'Invoquer et vaincre Bellanoir (raid normal).',
    detect:(a) => false, manual:true,
    tip:'Nécessite 4× Fragments de Slab. Autel de combat en base.'
  },
  {
    id:'ach_raid2', cat:'Raids', icon:'💀', update:'Sakurajima',
    name:'Eclipsed Siren',
    desc:'Invoquer et vaincre Bellanoir Libero (raid difficile).',
    detect:(a) => false, manual:true,
    tip:'Version hard de Bellanoir — groupe recommandé. Nécessite Slabs condensés.'
  },

  // ════════════════════════════════════════════
  // FEYBREAK v0.4 — 4 succès
  // ════════════════════════════════════════════
  {
    id:'ach_t7', cat:'Tours', icon:'🗼', update:'Feybreak',
    name:'Sovereign of the Feybreak Realm',
    desc:'Vaincre Bjorn & Bastigor — Tour de Feybreak.',
    detect:(a) => false, manual:true,
    tip:'Nécessite des Bounty Tokens obtenus en battant les boss de Feybreak.'
  },
  {
    id:'ach_raid3', cat:'Raids', icon:'💀', update:'Feybreak',
    name:'Incarnation of the Eternal Flame',
    desc:'Invoquer et vaincre Blazamut Ryu (raid Sakurajima).',
    detect:(a) => false, manual:true,
    tip:'Autel de combat. Pals Eau contre Blazamut Ryu.'
  },
  {
    id:'ach_raid4', cat:'Raids', icon:'💀', update:'Feybreak',
    name:'Invader from Space',
    desc:'Invoquer et vaincre Xenolord (raid Feybreak).',
    detect:(a) => false, manual:true,
    tip:'4× Fragments de Slab Xeno depuis les Donjons Feybreak. Niveau 60 requis.'
  },
  {
    id:'ach_chopper', cat:'Exploration', icon:'🚁', update:'Feybreak',
    name:'No Fly Zone',
    desc:'Vaincre l’hélicoptère d’attaque sur l’Oil Rig de Feybreak (niveau 60).',
    detect:(a) => false, manual:true,
    tip:'Oil Rig niveau 60, sud-ouest de Feybreak. Apparaît en hackant la cage au sommet.'
  },

  // ════════════════════════════════════════════
  // CROSSPLAY v0.5 — 11 succès
  // ════════════════════════════════════════════
  {
    id:'ach_effigies2', cat:'Collection', icon:'🗿', update:'Crossplay v0.5',
    name:'Palpagos Guardian',
    desc:'Collectez 300 Effigies de Lifmunk.',
    detect:(a) => false, manual:true,
    tip:'Progression de Palpagos Guru (255). 300 = presque toutes les statues.'
  },
  {
    id:'ach_research1', cat:'Progression', icon:'🔬', update:'Crossplay v0.5',
    name:'Pal Labor Student',
    desc:'Complétez 10 projets de Recherche sur le Travail des Pals.',
    detect:(a) => a.level >= 20, manual:true,
    tip:'Laboratoire de Recherche (niveau 20 requis). Améliore les capacités de travail.'
  },
  {
    id:'ach_research2', cat:'Progression', icon:'🔬', update:'Crossplay v0.5',
    name:'Pal Labor Researcher',
    desc:'Complétez 30 projets de Recherche sur le Travail des Pals.',
    detect:(a) => false, manual:true,
    tip:'150 projets disponibles. Focus sur les moins chers en premier.'
  },
  {
    id:'ach_research3', cat:'Progression', icon:'🔬', update:'Crossplay v0.5',
    name:'Pal Labor Professor',
    desc:'Complétez 70 projets de Recherche sur le Travail des Pals.',
    detect:(a) => false, manual:true,
    tip:'Garde toujours des Manuscripts Anciens via les Expéditions.'
  },
  {
    id:'ach_exp1', cat:'Progression', icon:'🗺️', update:'Crossplay v0.5',
    name:'Novice Pal Dispatcher',
    desc:'Effectuez 10 Expéditions de Pals.',
    detect:(a) => false, manual:true,
    tip:'Station d’Expédition (niveau 15). Envoie des Pals sur des missions hors-base.'
  },
  {
    id:'ach_exp2', cat:'Progression', icon:'🗺️', update:'Crossplay v0.5',
    name:'Elite Pal Dispatcher',
    desc:'Effectuez 20 Expéditions de Pals.',
    detect:(a) => false, manual:true,
    tip:'Enchaîne les expéditions Risque : Faible pour speedrunner ce succès.'
  },
  {
    id:'ach_survey1', cat:'Exploration', icon:'🔭', update:'Crossplay v0.5',
    name:'Freshman Surveyor',
    desc:'Découvrez 10 nouvelles zones.',
    detect:(a) => a.level >= 5, manual:true,
    tip:'Chaque nouvelle zone découverte affiche son nom à l’écran.'
  },
  {
    id:'ach_survey2', cat:'Exploration', icon:'🔭', update:'Crossplay v0.5',
    name:'Junior Surveyor',
    desc:'Découvrez 30 nouvelles zones.',
    detect:(a) => a.level >= 15, manual:true
  },
  {
    id:'ach_survey3', cat:'Exploration', icon:'🔭', update:'Crossplay v0.5',
    name:'Senior Surveyor',
    desc:'Découvrez 70 nouvelles zones.',
    detect:(a) => a.level >= 40, manual:true,
    tip:'Visite les Tours et Sanctuaires — ils ont souvent des téléporteurs à proximité.'
  },
  {
    id:'ach_pred', cat:'Exploration', icon:'⚔️', update:'Crossplay v0.5',
    name:'Predator Hunter',
    desc:'Vaincre un Pal Prédateur (Alpha aux yeux rouges).',
    detect:(a) => a.level >= 10, manual:true,
    tip:'Diffère du succès EA — ce Prédator Hunter est ajouté en v0.5. Même condition.'
  },

  // ════════════════════════════════════════════
  // TIDES OF TERRARIA v0.6 — 12 succès
  // ════════════════════════════════════════════
  {
    id:'ach_fish1', cat:'Pêche', icon:'🎣', update:'Tides of Terraria',
    name:'Novice Angler',
    desc:'Pêchez 10 Pals.',
    detect:(a) => false, manual:true,
    tip:'Canne à pêche débloquée au niveau 15 (2 points Tech). Pêche dans n’importe quel plan d’eau.'
  },
  {
    id:'ach_fish2', cat:'Pêche', icon:'🎣', update:'Tides of Terraria',
    name:'Seasoned Angler',
    desc:'Pêchez 30 Pals.',
    detect:(a) => false, manual:true
  },
  {
    id:'ach_fish3', cat:'Pêche', icon:'🎣', update:'Tides of Terraria',
    name:'Veteran Angler',
    desc:'Pêchez 50 Pals.',
    detect:(a) => false, manual:true
  },
  {
    id:'ach_lurker', cat:'Pêche', icon:'🎣', update:'Tides of Terraria',
    name:'Lurker Hunter',
    desc:'Pêchez un Pal avec la passive "Lurker" dans un spot de pêche Maître.',
    detect:(a) => false, manual:true,
    tip:'Spot Maître : Île Éternelle de l’Été (coords -408,-825 ou 920,208). Utilise la meilleure canne.'
  },
  {
    id:'ach_arena1', cat:'Arène', icon:'🥊', update:'Tides of Terraria',
    name:'Silver Champ',
    desc:'Atteindre le rang Argent à l’Arène (300 points).',
    detect:(a) => false, manual:true,
    tip:'Arène au sud du Désert Desséché. Bats les adversaires Bronze puis Argent.'
  },
  {
    id:'ach_arena2', cat:'Arène', icon:'🏆', update:'Tides of Terraria',
    name:'Arena Champion',
    desc:'Atteindre le rang Maître à l’Arène (3 800 points).',
    detect:(a) => false, manual:true,
    tip:'Bats The Master encore et encore pour accumuler les points. Pals endgame requis.'
  },
  {
    id:'ach_trust', cat:'Progression', icon:'❤️', update:'Tides of Terraria',
    name:'Best Friends Forever',
    desc:'Atteignez le niveau de Confiance 10 avec un Pal.',
    detect:(a) => false, manual:true,
    tip:'La confiance monte avec le temps passé avec un Pal. Utilise des Kinship Peach pour accélérer.'
  },
  {
    id:'ach_base1', cat:'Exploration', icon:'🏚️', update:'Tides of Terraria',
    name:'Successful Infiltration',
    desc:'Vider 1 base de faction ennemie.',
    detect:(a) => false, manual:true,
    tip:'Les bases ennemies apparaissent aléatoirement. Trouve un coffre doré pour valider.'
  },
  {
    id:'ach_base2', cat:'Exploration', icon:'🏚️', update:'Tides of Terraria',
    name:'Unstoppable Streak',
    desc:'Vider 10 bases de faction ennemie.',
    detect:(a) => false, manual:true,
    tip:'Les bases peuvent respawn — pas besoin de 10 bases différentes.'
  },
  {
    id:'ach_treasure', cat:'Exploration', icon:'💰', update:'Tides of Terraria',
    name:'A Nose for Treasure',
    desc:'Trouver 5 trésors avec des Cartes au Trésor.',
    detect:(a) => false, manual:true,
    tip:'Les Cartes au Trésor se lootent dans les bases ennemies. Une icône apparaît sur la carte.'
  },
  {
    id:'ach_bounty1', cat:'Exploration', icon:'🏹', update:'Tides of Terraria',
    name:'Rookie Pal Slayer',
    desc:'Obtenir 5 Pal Bounty Tokens (en battant/capturant des Pals Alpha).',
    detect:(a) => a.capturedNames.size >= 5, manual:true,
    tip:'Les Bounty Tokens viennent des Pals Alpha — chaque premier kill donne 1 token.'
  },
  {
    id:'ach_bounty2', cat:'Exploration', icon:'🏹', update:'Tides of Terraria',
    name:'Alpha Pal Slayer',
    desc:'Obtenir 20 Pal Bounty Tokens.',
    detect:(a) => a.capturedNames.size >= 20, manual:true,
    tip:'20 Pals Alpha à vaincre. Vérifie sous "Objets clés" ton inventaire.'
  },

  // ════════════════════════════════════════════
  // HOME SWEET HOME v0.7 — 1 succès
  // ════════════════════════════════════════════
  {
    id:'ach_hartalis', cat:'Raids', icon:'👑', update:'Home Sweet Home',
    name:'King of Salvation',
    desc:'Invoquer et vaincre Hartalis (raid Home Sweet Home).',
    detect:(a) => false, manual:true,
    tip:'Utilise un Hartalis Slab dans l’Autel de combat. Boss de niveau 65.'
  },
];
/* ── Charger/sauvegarder les succès cochés manuellement ── */
function loadManualAchs() {
  try { return JSON.parse(localStorage.getItem('dresseur_achs') || '{}'); }
  catch { return {}; }
}
function saveManualAchs(achs) {
  localStorage.setItem('dresseur_achs', JSON.stringify(achs));
}

/* ── Initialiser la page succès ── */
let currentAnalysis = null; // résultats de la dernière save analysée

function initAchievements() {
  renderAchievements(null);
}

function renderAchievements(analysis) {
  const manual = loadManualAchs();
  const cats = [...new Set(ACHIEVEMENTS.map(a => a.cat))];
  let totalUnlocked = 0;
  const total = ACHIEVEMENTS.length;

  // Calculer d’abord le total pour la barre
  ACHIEVEMENTS.forEach(ach => {
    const autoUnlocked = analysis && !ach.manual && ach.detect(analysis);
    if (autoUnlocked || manual[ach.id]) totalUnlocked++;
  });

  const pct = Math.round((totalUnlocked / total) * 100);
  const hasSave = !!analysis;

  document.getElementById('ach-container').innerHTML = `
    ${hasSave ? `
    <div class="progress-bar-wrap" style="margin-bottom:1.75rem">
      <div class="progress-label">
        <span style="font-weight:700">Succès débloqués — ${pct}%</span>
        <span class="mono" style="color:var(--sun);font-weight:700">${totalUnlocked} / ${total}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--sun),#FFAA00)"></div>
      </div>
    </div>` : `
    <div style="padding:1rem 1.25rem;background:rgba(255,208,0,.1);border:1.5px solid var(--sun);border-radius:var(--r-md);margin-bottom:1.5rem;font-size:.88rem;color:var(--ink-s)">
      💡 <strong>Astuce :</strong> Importe ta sauvegarde depuis la page
      <button onclick="navigate('saveimport')" style="background:none;border:none;color:var(--purple);font-weight:700;cursor:pointer;font-size:.88rem;text-decoration:underline">💾 Ma Save</button>
      pour détecter automatiquement les succès liés aux captures et au niveau.
    </div>`}

    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem;flex-wrap:wrap">
      <span style="font-size:.82rem;color:var(--ink-f)">🔒 = manuel uniquement · ✨ = détectable via sauvegarde</span>
      <button class="btn btn-ghost btn-sm" onclick="resetAchievements()" style="margin-left:auto">🗑️ Réinitialiser</button>
    </div>

    ${cats.map(cat => {
      const items = ACHIEVEMENTS.filter(a => a.cat === cat);
      const catUnlocked = items.filter(a => {
        const auto = analysis && !a.manual && a.detect(analysis);
        return auto || manual[a.id];
      }).length;

      return `
      <div style="margin-bottom:2rem">
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.85rem;flex-wrap:wrap">
          <h3 style="font-family:var(--ff-d);font-size:1.1rem">${catIcon(cat)} ${cat}</h3>
          <span class="stamp" style="color:${catUnlocked===items.length?'var(--mint-d)':'var(--ink-f)'};border-color:${catUnlocked===items.length?'var(--mint-d)':'var(--line)'};font-size:.65rem">
            ${catUnlocked}/${items.length}
          </span>
          <div style="flex:1;min-width:80px;max-width:200px">
            <div style="height:4px;background:var(--line);border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${Math.round(catUnlocked/items.length*100)}%;background:${catUnlocked===items.length?'var(--mint-d)':'var(--sun)'};border-radius:2px;transition:width .6s ease-out"></div>
            </div>
          </div>
          ${catUnlocked===items.length?'<span style="font-size:.7rem;color:var(--mint-d);font-weight:800">✓ COMPLET</span>':''}
        </div>
        <div class="ach-grid">
          ${items.map(ach => {
            const autoUnlocked = analysis && !ach.manual && ach.detect(analysis);
            const manualUnlocked = !!manual[ach.id];
            const unlocked = autoUnlocked || manualUnlocked;
            const autoDetectable = !ach.manual;

            return `
            <div class="ach-card ${unlocked ? 'ach-unlocked' : 'ach-locked'}"
                 onclick="${ach.manual || !autoUnlocked ? `toggleAchievement('${ach.id}')` : ''}"
                 style="${(ach.manual || !autoUnlocked) ? 'cursor:pointer' : 'cursor:default'}">
              <div class="ach-icon">${unlocked ? '🏆' : ach.icon}</div>
              <div class="ach-body">
                <div class="ach-name">${ach.name} <span style="font-family:var(--ff-m);font-size:.58rem;color:var(--ink-f);font-weight:600;opacity:.8">${ach.update}</span></div>
                <p class="ach-desc">${ach.desc}</p>
                ${ach.tip ? `<div class="ach-tip">💡 ${ach.tip}</div>` : ''}
                <div class="ach-footer">
                  ${autoDetectable
                    ? `<span class="ach-badge ach-auto">✨ Auto-détecté</span>`
                    : `<span class="ach-badge ach-man">🔒 Manuel</span>`}
                  ${unlocked
                    ? `<span class="ach-badge ach-done">✓ Débloqué</span>`
                    : ach.threshold
                      ? `<span style="font-family:var(--ff-m);font-size:.65rem;color:var(--ink-f)">${analysis ? analysis.capturedNames.size : '?'} / ${ach.threshold}</span>`
                      : ''}
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}`;
}

function catIcon(cat) {
  return {Paldeck:'📖', Légendaires:'⭐', Tours:'🗼', Raids:'💀',
          Exploration:'🗺️', Progression:'📈', Craft:'⚒️',
          Collection:'📚', Pêche:'🎣', Arène:'🥊'}[cat] || '🎯';
}

function toggleAchievement(id) {
  const manual = loadManualAchs();
  manual[id] = !manual[id];
  saveManualAchs(manual);
  renderAchievements(currentAnalysis);
}

function resetAchievements() {
  if (!confirm('Réinitialiser tous les succès cochés manuellement ?')) return;
  localStorage.removeItem('dresseur_achs');
  renderAchievements(currentAnalysis);
}

/* ── Hook : quand une save est analysée, mettre à jour les succès ── */
function onSaveAnalyzed(analysis) {
  currentAnalysis = analysis;
  // Si l’utilisateur est sur la page succès, re-rendre
  if (state.page === 'achievements') renderAchievements(analysis);
}

/* ══════════════════════════════════════════════════
   PAGE MAPS — Points d’intérêt + filtres
══════════════════════════════════════════════════ */

const MAP_POI = [
  // ── BOSS ALPHA ──
  {cat:'alpha', icon:'⭐', name:'Anubis (Alpha)', pal:'Anubis', lv:47, coord:'122, -462', note:'Sanctuaire du Désert. Boss Terre le plus utile du jeu — Artisanat Lv4 + Minage Lv3.'},
  {cat:'alpha', icon:'⭐', name:'Jetragon (Alpha)', pal:'Jetragon', lv:55, coord:'-789, -320', note:'Pic du Dragon, Île Volcanique. Sprint monture 3300 — le plus rapide.'},
  {cat:'alpha', icon:'⭐', name:'Frostallion (Alpha)', pal:'Frostallion', lv:55, coord:'426, 168', note:'Sommet des neiges éternelles. Meilleure monture volante.'},
  {cat:'alpha', icon:'⭐', name:'Paladius (Alpha)', pal:'Paladius', lv:55, coord:'447, -671', note:'Plaines Saintes. Légendaire Neutre. Partage spawn avec Necromus.'},
  {cat:'alpha', icon:'⭐', name:'Necromus (Alpha)', pal:'Necromus', lv:55, coord:'447, -671', note:'Désert des Âmes. Légendaire Ténèbres. Partage spawn avec Paladius.'},
  {cat:'alpha', icon:'⭐', name:'Lyleen (Alpha)', pal:'Lyleen', lv:49, coord:'-178, 449', note:'Île Oubliée. Légendaire niveau 49 — meilleure Plantation + Pharmacie.'},
  {cat:'alpha', icon:'⭐', name:'Blazamut (Alpha)', pal:'Blazamut', lv:49, coord:'-569, -482', note:'Île Volcanique. Minage + Allumage Lv4.'},
  {cat:'alpha', icon:'⭐', name:'Grizzbolt (Alpha)', pal:'Grizzbolt', lv:23, coord:'-113, -408', note:'Collines ventées. Boss de tour mais aussi Alpha accessible tôt.'},
  {cat:'alpha', icon:'⭐', name:'Mammorest (Alpha)', pal:'Mammorest', lv:38, coord:'-210, -20', note:'Forêt de bambous.'},
  {cat:'alpha', icon:'⭐', name:'Warsect (Alpha)', pal:'Warsect', lv:38, coord:'205, -55', note:'Collines de la Résurrection.'},
  {cat:'alpha', icon:'⭐', name:'Shadowbeak (Alpha)', pal:'Shadowbeak', lv:50, coord:'-120, 450', note:'Île de la Désolation.'},
  {cat:'alpha', icon:'⭐', name:'Orserk (Alpha)', pal:'Orserk', lv:47, coord:'-120, 450', note:'Île de la Désolation.'},
  {cat:'alpha', icon:'⭐', name:'Quivern (Alpha)', pal:'Quivern', lv:23, coord:'228, -78', note:'Collines de la Résurrection.'},
  {cat:'alpha', icon:'⭐', name:'Menasting (Alpha)', pal:'Menasting', lv:44, coord:'355, -595', note:'Dunes arides.'},
  {cat:'alpha', icon:'⭐', name:'Cryolinx (Alpha)', pal:'Cryolinx', lv:43, coord:'426, 131', note:'Montagne glacée.'},
  {cat:'alpha', icon:'⭐', name:'Digtoise (Alpha)', pal:'Digtoise', lv:30, coord:'187, -283', note:'Plateau du crépuscule.'},
  {cat:'alpha', icon:'⭐', name:'Kingpaca (Alpha)', pal:'Kingpaca', lv:38, coord:'-124, -197', note:'Collines verdoyantes.'},
  // Feybreak
  {cat:'alpha', icon:'⭐', name:'Xenolord (Alpha Raid)', pal:'Xenolord', lv:60, coord:'Feybreak Island', note:'Boss Raid Feybreak. 4× Fragments de Slab Xeno dans les donjons.'},
  {cat:'alpha', icon:'⭐', name:'Neptilius (Alpha)', pal:'Neptilius', lv:60, coord:'Eaux profondes', note:'Légendaire Eau. Arrosage Lv4. Zone endgame.'},

  // ── TOURS ──
  {cat:'tower', icon:'🗼', name:'Tour Syndicat Rayne', boss:'Zoe & Grizzbolt', lv:15, coord:'-99, -418', note:'1ère tour. Pals Terre recommandés. Débloque expédition Verdant Hollow.'},
  {cat:'tower', icon:'🗼', name:'Tour Alliance Libre Pals', boss:'Lily & Lyleen', lv:30, coord:'-580, 22', note:'Pals Feu. Débloque expédition Moonlit Forest.'},
  {cat:'tower', icon:'🗼', name:'Tour PAL Moonflowers', boss:'Axel & Orserk', lv:45, coord:'-590, -490', note:'Île Volcanique. Pals Terre + Glace. La plus longue tour.'},
  {cat:'tower', icon:'🗼', name:'Tour PIDF', boss:'Marcus & Faleris', lv:40, coord:'490, -720', note:'Désert. Pals Eau. Attaques rapides — Faleris est brutal.'},
  {cat:'tower', icon:'🗼', name:'Tour Frères Flamme Éternelle', boss:'Victor & Shadowbeak', lv:45, coord:'-127, 460', note:'Île de la Désolation. Pals Dragon. La plus difficile.'},
  {cat:'tower', icon:'🗼', name:'Tour Sakurajima', boss:'Saya & Selyne', lv:50, coord:'Sakurajima Island', note:'Mise à jour Sakurajima.'},
  {cat:'tower', icon:'🗼', name:'Tour Feybreak', boss:'Bjorn & Bastigor', lv:60, coord:'Feybreak Island SW', note:'Nécessite des Bounty Tokens de boss Feybreak. Pals Feu.'},

  // ── LÉGENDAIRES ──
  {cat:'legendary', icon:'💎', name:'Jetragon', pal:'Jetragon', lv:55, coord:'-789, -320', note:'Monture la + rapide (sprint 3300). Île Volcanique nord.'},
  {cat:'legendary', icon:'💎', name:'Frostallion', pal:'Frostallion', lv:55, coord:'426, 168', note:'Meilleure monture volante. Toundra absolue.'},
  {cat:'legendary', icon:'💎', name:'Paladius', pal:'Paladius', lv:55, coord:'447, -671', note:'Légendaire Neutre. Partage spawn avec Necromus.'},
  {cat:'legendary', icon:'💎', name:'Necromus', pal:'Necromus', lv:55, coord:'447, -671', note:'Légendaire Ténèbres. Partage spawn avec Paladius.'},
  {cat:'legendary', icon:'💎', name:'Neptilius', pal:'Neptilius', lv:60, coord:'Eaux profondes endgame', note:'★ NOUVEAU — Arrosage Lv4. Zone endgame.'},

  // ── DONJONS RECOMMANDÉS ──
  {cat:'dungeon', icon:'⛏️', name:'Donjons Collines Ventées', coord:'0, -500 (zone)', note:'Niveau 1-20. Faciles à trouver, parfaits pour débuter. Gumoss, Jolthog à l\'intérieur.'},
  {cat:'dungeon', icon:'⛏️', name:'Donjons Plateau du Crépuscule', coord:'200, -280 (zone)', note:'Niveau 20-35. Nombreux Alpha en fin de donjon. Digtoise, Tombat.'},
  {cat:'dungeon', icon:'⛏️', name:'Donjons Dunes Arides', coord:'400, -600 (zone)', note:'Niveau 35-45. Menasting, Anubis. Boss de fin difficiles.'},
  {cat:'dungeon', icon:'⛏️', name:'Donjons Île Volcanique', coord:'-600, -400 (zone)', note:'Niveau 40-55. Les plus rentables. Blazamut, Orserk en Alpha final.'},
  {cat:'dungeon', icon:'⛏️', name:'Donjons Feybreak', coord:'Feybreak Island', note:'Niveau 55-65. Fragments de Slab Xeno. Nouveaux Pals Feybreak.'},
  {cat:'dungeon', icon:'⛏️', name:'Sanctuaires Scellés', coord:'Éparpillés sur la carte', note:'16 sanctuaires. Contiennent les plus gros Alpha (Anubis, Grizzbolt, Shadowbeak…).'},

  // ── EFFIGIES DE LIFMUNK ──
  {cat:'effigy', icon:'🗿', name:'Zone Effigies — Collines Ventées', coord:'0, -450 (zone)', note:'~40 effigies. Zone de départ, facile d\'accès.'},
  {cat:'effigy', icon:'🗿', name:'Zone Effigies — Archipel Brise de Mer', coord:'-200, -600 (zone)', note:'~35 effigies. Sur les falaises côtières. Monture volante recommandée.'},
  {cat:'effigy', icon:'🗿', name:'Zone Effigies — Désert', coord:'400, -680 (zone)', note:'~50 effigies. Surtout sur les formations rocheuses. Attention à la chaleur.'},
  {cat:'effigy', icon:'🗿', name:'Zone Effigies — Montagne Glacée', coord:'420, 100 (zone)', note:'~45 effigies. Éparpillées sur les falaises. Équipement froid nécessaire.'},
  {cat:'effigy', icon:'🗿', name:'Zone Effigies — Île Volcanique', coord:'-600, -450 (zone)', note:'~30 effigies. Pénibles à récupérer. Jetragon recommandé.'},
  {cat:'effigy', icon:'🗿', name:'Zone Effigies — Sakurajima', coord:'Sakurajima Island', note:'~40 effigies sur la nouvelle île.'},
  {cat:'effigy', icon:'🗿', name:'Zone Effigies — Feybreak', coord:'Feybreak Island', note:'~60 effigies nouvelles (v0.4+). Nécessite d\'explorer toute l\'île.'},

  // ── TÉLÉPORTS CLÉS ──
  {cat:'teleport', icon:'⚡', name:'Plateau des Bénédictions', coord:'-31, -499', note:'Téléport de départ. Accès rapide aux premières ressources.'},
  {cat:'teleport', icon:'⚡', name:'Petit Village', coord:'-110, -482', note:'Marchand permanent. Acheter des Pals et des blueprints.'},
  {cat:'teleport', icon:'⚡', name:'Désert Desséché', coord:'351, -630', note:'Accès rapide au désert endgame et à Paladius/Necromus.'},
  {cat:'teleport', icon:'⚡', name:'Sommet du Dragon', coord:'-789, -300', note:'Île Volcanique. Téléport le plus proche de Jetragon.'},
  {cat:'teleport', icon:'⚡', name:'Toundra Absolue', coord:'420, 180', note:'Proche de Frostallion. Équipement froid obligatoire.'},
  {cat:'teleport', icon:'⚡', name:'Île de la Désolation', coord:'-120, 440', note:'Shadowbeak + Orserk en Alpha. Équipement Tier 3 minimum.'},

  // ── SPOTS DE PÊCHE ──
  {cat:'fishing', icon:'🎣', name:'Spot de Pêche Maître — Île Éternelle Été', coord:'-408, -825', note:'Pals avec passive Lurker. Nécessaire pour succès "Lurker Hunter".'},
  {cat:'fishing', icon:'🎣', name:'Spot de Pêche Maître — Côte Ouest', coord:'920, 208', note:'Deuxième spot confirmé pour les Lurkers.'},
  {cat:'fishing', icon:'🎣', name:'Spots de Pêche Archipel Brise de Mer', coord:'-200, -580 (zone)', note:'Nombreux spots pour débuter. Kelpsea et Celaray fréquents.'},
  {cat:'fishing', icon:'🎣', name:'Spots de Pêche Tides of Terraria', coord:'Nouvelles îles Tropicales', note:'Nouveaux Pals aquatiques de la collab Terraria. Bassin de pêche recommandé.'},
];

let currentMapFilter = 'all';

function initMaps() {
  renderMapPOI('all');
}

function setMapFilter(filter, btn) {
  currentMapFilter = filter;
  document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMapPOI(filter);
}

function renderMapPOI(filter) {
  const filtered = filter === 'all' ? MAP_POI : MAP_POI.filter(p => p.cat === filter);

  const labels = {
    all:'Tous', alpha:'Boss Alpha', dungeon:'Donjons',
    tower:'Tours de Boss', legendary:'Pals Légendaires',
    effigy:'Zones d\'Effigies', teleport:'Téléports Clés', fishing:'Spots de Pêche'
  };

  document.getElementById('map-poi-title').textContent = `📍 Points d\'intérêt — ${labels[filter] || filter} (${filtered.length})`;

  const catColors = {
    alpha:'var(--sun)', tower:'var(--coral)', legendary:'var(--purple)',
    dungeon:'var(--lagoon)', effigy:'var(--mint)', teleport:'var(--electric)',
    fishing:'var(--water)'
  };

  document.getElementById('map-poi-grid').innerHTML = filtered.map(poi => {
    const palObj = poi.pal ? PALS.find(p => p.name === poi.pal) : null;
    const elIcons = palObj ? palObj.el.map(e => EL[e]?.icon || '').join('') : '';
    const color = catColors[poi.cat] || 'var(--ink-f)';

    return `
    <div class="map-poi-card" style="border-left:3px solid ${color}">
      <h4>
        ${poi.icon} ${poi.name}
        ${poi.lv ? `<span class="map-poi-lv">Lv ${poi.lv}</span>` : ''}
        ${elIcons ? `<span style="margin-left:.35rem;font-size:1rem">${elIcons}</span>` : ''}
      </h4>
      ${poi.boss ? `<p style="font-size:.72rem;color:${color};font-weight:700">👤 ${poi.boss}</p>` : ''}
      <p>${poi.note}</p>
      <div class="map-poi-coords">📍 ${poi.coord}</div>
      ${palObj ? `<button class="btn btn-ghost btn-sm" style="margin-top:.5rem;font-size:.65rem" onclick="openModal('${palObj.id}')">Voir fiche ${palObj.name}</button>` : ''}
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════
   CALCULATEUR INVERSÉ — Trouver les parents d'un Pal
══════════════════════════════════════════════════ */

function initReverseCalc() {
  const sel = document.getElementById('rev-target');
  if (!sel || sel.options.length > 1) return;

  // Peupler avec tous les Pals triés par nom
  const sorted = [...PALS].sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = `${p.name}${p.nameEN ? ' / ' + p.nameEN : ''} (PR ${p.rank})`;
    sel.appendChild(opt);
  });

  // Aussi ajouter les Pals dans BREEDING_RANKS qui ne sont pas dans PALS
  Object.keys(BREEDING_RANKS).forEach(name => {
    if (!PALS.find(p => p.name === name)) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = `${name} (PR ${BREEDING_RANKS[name]})`;
      sel.appendChild(opt);
    }
  });
}

function calcReverse() {
  const target = document.getElementById('rev-target').value;
  if (!target) return;

  const targetRank = POWER_RANKS[target];
  const resultDiv = document.getElementById('rev-result');
  const previewDiv = document.getElementById('rev-target-preview');

  if (!targetRank) {
    resultDiv.innerHTML = '<span style="color:var(--coral)">Power Rank inconnu pour ce Pal.</span>';
    return;
  }

  const palObj = PALS.find(p => p.name === target);

  // Preview du Pal cible
  previewDiv.innerHTML = `
    <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem;background:var(--paper-d);border-radius:var(--r-sm);border:var(--bdr)">
      ${palImg(target, 52)}
      <div>
        <div style="font-family:var(--ff-d);font-weight:700;font-size:1rem">${target}</div>
        <div style="font-family:var(--ff-m);font-size:.72rem;color:var(--mint-d)">Power Rank : <strong>${targetRank}</strong></div>
        <div style="font-size:.7rem;color:var(--ink-f);margin-top:.15rem">
          ${palObj ? palObj.el.map(e => `${elIconImg(e, 16) || EL[e]?.icon} ${EL[e]?.name}`).join(' · ') : ''}
        </div>
      </div>
    </div>`;

  // 1. Combos fixes qui donnent ce Pal
  const fixedCombos = BREEDING_COMBOS.filter(c => c.child === target);

  // 2. Calcul mathématique : trouver les paires de parents dont la moyenne = targetRank
  // Pour chaque Pal A, chercher Pal B tel que (rankA + rankB) / 2 ≈ targetRank
  // → rankB = 2 * targetRank - rankA
  const allPals = Object.entries(POWER_RANKS);
  const mathCombos = [];
  const seen = new Set();

  for (const [nameA, rankA] of allPals) {
    if (nameA === target) continue;
    const neededB = 2 * targetRank - rankA;
    // Chercher le Pal dont le rank est le plus proche de neededB
    let bestB = null, bestDiff = Infinity;
    for (const [nameB, rankB] of allPals) {
      if (nameB === target || nameB === nameA) continue;
      const diff = Math.abs(rankB - neededB);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestB = { name: nameB, rank: rankB };
      }
    }
    if (bestB && bestDiff <= 5) {
      // Vérifier que ce combo donne bien le target
      const avg = (rankA + bestB.rank) / 2;
      // Trouver le Pal le plus proche de cette moyenne
      let closestPal = null, closestDiff = Infinity;
      for (const [name, rank] of allPals) {
        const d = Math.abs(rank - avg);
        if (d < closestDiff) { closestDiff = d; closestPal = name; }
      }
      if (closestPal === target) {
        const key = [nameA, bestB.name].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          // Exclure les combos fixes déjà listés
          const isFixed = fixedCombos.some(c =>
            (c.p1 === nameA && c.p2 === bestB.name) ||
            (c.p1 === bestB.name && c.p2 === nameA)
          );
          mathCombos.push({
            p1: nameA, r1: rankA,
            p2: bestB.name, r2: bestB.rank,
            avg: avg.toFixed(0),
            isFixed
          });
        }
      }
    }
  }

  // Limiter à 30 résultats, trier par accessibilité (rank élevé = Pal plus commun)
  const sortedMath = mathCombos
    .filter(c => !c.isFixed)
    .sort((a, b) => Math.min(b.r1, b.r2) - Math.min(a.r1, a.r2))
    .slice(0, 30);

  let html = '';

  // Combos fixes
  if (fixedCombos.length > 0) {
    html += `<div style="margin-bottom:1.5rem">
      <div style="font-family:var(--ff-d);font-weight:700;font-size:.95rem;margin-bottom:.75rem;color:var(--sun)">
        ⭐ Combos fixes garantis (${fixedCombos.length})
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:.6rem">
      ${fixedCombos.map(c => {
        const pa = PALS.find(p => p.name === c.p1), pb = PALS.find(p => p.name === c.p2);
        return `<div style="background:rgba(255,208,0,.12);border:1.5px solid var(--sun);border-radius:var(--r-md);padding:.75rem 1rem;display:flex;align-items:center;gap:.6rem;cursor:pointer" onclick="setBreedTab('calculateur')">
          <div style="display:flex;align-items:center;gap:.35rem">
            ${palImg(c.p1, 36)}<span style="font-size:.75rem;font-weight:700">${c.p1}</span>
          </div>
          <span style="color:var(--ink-f)">×</span>
          <div style="display:flex;align-items:center;gap:.35rem">
            ${palImg(c.p2, 36)}<span style="font-size:.75rem;font-weight:700">${c.p2}</span>
          </div>
          <span style="font-size:.65rem;color:var(--ink-f);margin-left:auto">${c.note || ''}</span>
        </div>`;
      }).join('')}
      </div>
    </div>`;
  }

  // Combos mathématiques
  if (sortedMath.length > 0) {
    html += `<div>
      <div style="font-family:var(--ff-d);font-weight:700;font-size:.95rem;margin-bottom:.75rem;color:var(--lagoon)">
        🧮 Combinaisons par calcul Power Rank (${sortedMath.length} trouvées)
        <span style="font-size:.68rem;color:var(--ink-f);font-weight:400;margin-left:.5rem">Triées par facilité d'accès</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:.5rem">
      ${sortedMath.map(c => `
        <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-sm);padding:.6rem .9rem;display:flex;align-items:center;gap:.5rem;font-size:.75rem">
          <div style="display:flex;align-items:center;gap:.3rem;flex:1">
            ${palImg(c.p1, 30)}<div><div style="font-weight:700">${c.p1}</div><div style="color:var(--ink-f);font-size:.65rem">PR ${c.r1}</div></div>
          </div>
          <span style="color:var(--ink-f);font-size:.85rem">×</span>
          <div style="display:flex;align-items:center;gap:.3rem;flex:1">
            ${palImg(c.p2, 30)}<div><div style="font-weight:700">${c.p2}</div><div style="color:var(--ink-f);font-size:.65rem">PR ${c.r2}</div></div>
          </div>
          <div style="font-family:var(--ff-m);font-size:.62rem;color:var(--mint-d);flex-shrink:0">≈${c.avg}</div>
        </div>`).join('')}
      </div>
    </div>`;
  } else if (fixedCombos.length === 0) {
    html += '<p style="color:var(--ink-f);font-size:.88rem">Aucune combinaison trouvée — ce Pal s\'obtient peut-être uniquement dans la nature.</p>';
  }

  resultDiv.innerHTML = html;
}


/* ══════════════════════════════════════════════════
   TIER LIST VISUELLE
══════════════════════════════════════════════════ */

// Tier list étendue avec catégories
const TIER_LIST_FULL = {
  combat: {
    S:['Jetragon','Necromus','Paladius','Frostallion Noct','Bellanoir Libero','Neptilius'],
    A:['Shadowbeak','Blazamut Ryu','Faleris','Suzaku Aqua','Jormuntide Ignis','Astegon','Orserk','Xenolord'],
    B:['Grizzbolt','Blazamut','Menasting','Cryolinx','Lyleen Noct','Helzephyr Lux','Warsect Terra','Silvegis'],
    C:['Pyrin Noct','Incineram Noct','Blazehowl Noct','Vanwyrm Cryst','Kitsun Noct','Foxcicle'],
  },
  travail: {
    S:['Anubis','Lyleen','Neptilius','Whalaska','Astegon','Blazamut','Braloha','Celesdir'],
    A:['Verdash','Vaelet','Orserk','Grizzbolt','Jormuntide','Elizabee','Wumpo','Petallia','Sibelyx','Azurmane'],
    B:['Mossanda Lux','Digtoise','Bushi','Ragnahawk','Cryolinx','Beakon','Lyleen Noct','Warsect','Kingpaca'],
    C:['Mossanda','Robinquill','Tanzee','Lifmunk','Caprity','Beegarde','Dazzi','Eikthyrdeer'],
  },
  monture: {
    S:['Jetragon','Frostallion','Frostallion Noct','Necromus','Paladius','Neptilius'],
    A:['Shadowbeak','Ragnahawk','Beakon','Faleris Aqua','Whalaska Ignis','Helzephyr Lux','Gildane'],
    B:['Nitewing','Fenglope Lux','Quivern','Blazehowl','Vanwyrm','Univolt','Rayhound','Elphidran Aqua'],
    C:['Galeclaw','Eikthyrdeer','Kitsun','Dinossom','Celaray','Melpaca'],
  },
};

let _tierCat = 'all';

function initTierList() {
  renderTierList();
}

function setTierCat(cat, btn) {
  _tierCat = cat;
  document.querySelectorAll('#tier-cat-filters .tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTierList();
}

function renderTierList() {
  const container = document.getElementById('tierlist-container');
  if (!container) return;

  const source = _tierCat === 'all' ? TIER_LIST :
                 _tierCat === 'combat' ? TIER_LIST_FULL.combat :
                 _tierCat === 'travail' ? TIER_LIST_FULL.travail :
                 TIER_LIST_FULL.monture;

  const TIER_STYLES = {
    S: { bg:'linear-gradient(135deg,#FFD700,#FF8C00)', label:'S', desc:'Meilleur absolu' },
    A: { bg:'linear-gradient(135deg,#00E34A,#00C040)', label:'A', desc:'Excellent' },
    B: { bg:'linear-gradient(135deg,#00BFFF,#0080CC)', label:'B', desc:'Bon' },
    C: { bg:'linear-gradient(135deg,#888,#555)', label:'C', desc:'Correct' },
  };

  container.innerHTML = Object.entries(TIER_STYLES).map(([tier, style]) => {
    const pals = source[tier] || [];
    if (!pals.length) return '';

    const palCards = pals.map(name => {
      const p = PALS.find(x => x.name === name);
      const imgHtml = palImg(name, 52);
      const els = p ? p.el.map(e => elIconImg(e, 12) || EL[e]?.icon || '').join('') : '';
      return `
        <div onclick="${p ? `openModal('${p.id}')` : ''}" style="
          display:flex;flex-direction:column;align-items:center;gap:.3rem;
          padding:.6rem .5rem;background:var(--glass);border:var(--bdr);
          border-radius:var(--r-md);cursor:${p ? 'pointer' : 'default'};
          min-width:80px;text-align:center;transition:transform .15s,box-shadow .15s;
          box-shadow:var(--sh)" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform=''">
          ${imgHtml || `<div style="width:52px;height:52px;background:var(--paper-d);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.5rem">🐾</div>`}
          <div style="font-size:.68rem;font-weight:700;font-family:var(--ff-m);line-height:1.2">${name}</div>
          <div style="font-size:.55rem">${els}</div>
        </div>`;
    }).join('');

    return `
      <div style="display:flex;gap:0;margin-bottom:.75rem;border-radius:var(--r-md);overflow:hidden;border:var(--bdr);box-shadow:var(--sh)">
        <div style="min-width:64px;background:${style.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:.75rem .5rem;flex-shrink:0">
          <div style="font-family:var(--ff-d);font-size:2rem;font-weight:900;color:#fff;text-shadow:2px 2px 0 rgba(0,0,0,.3)">${style.label}</div>
          <div style="font-size:.55rem;color:rgba(255,255,255,.85);font-family:var(--ff-m);font-weight:700;text-align:center">${style.desc}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;padding:.75rem;background:var(--paper-d);flex:1;align-items:center">
          ${palCards}
        </div>
      </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════
   TABLEAU DE BORD PERSONNALISÉ
══════════════════════════════════════════════════ */

// Variable globale — remplie quand une save est importée
window._saveAnalysis = null;

function initDashboard() {
  renderDashboard();
}

function renderDashboard() {
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  const analysis = window._saveAnalysis;
  if (!analysis || analysis.capturedNames.size === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size:3.5rem;margin-bottom:1rem">💾</div>
        <div class="empty-title">Aucune sauvegarde importée</div>
        <p style="color:var(--ink-f);max-width:400px;margin:.5rem auto 1.5rem">Importe ton fichier <code>Level.sav</code> pour activer le tableau de bord personnalisé.</p>
        <button class="btn btn-primary" onclick="navigate('saveimport')">💾 Importer ma sauvegarde</button>
      </div>`;
    return;
  }

  const captured = analysis.capturedNames;
  const total = PALS.length;
  const capturedPals = PALS.filter(p => captured.has(p.name));
  const missingPals = PALS.filter(p => !captured.has(p.name));
  const pct = Math.round((captured.size / total) * 100);

  // Succès proches (80%+ des conditions remplies)
  const nearAchs = ACHIEVEMENTS.filter(a => {
    if (a.manual) return false;
    if (a.detect(analysis)) return false; // déjà débloqué
    // Succès de captures : vérifier combien il manque
    if (a.threshold) {
      const needed = a.threshold;
      const have = captured.size;
      return have >= needed * 0.75; // à moins de 25% de l'objectif
    }
    return false;
  });

  // Combos breeding disponibles avec les Pals capturés
  const availableCombos = BREEDING_COMBOS.filter(c =>
    captured.has(c.p1) && captured.has(c.p2) && !captured.has(c.child)
  );

  // Légendaires manquants
  const legendaryMissing = ['Jetragon','Frostallion','Paladius','Necromus','Neptilius']
    .filter(n => !captured.has(n));

  // Pals Tier S/A manquants
  const topMissing = [...(TIER_LIST.S || []), ...(TIER_LIST.A || [])]
    .filter(n => !captured.has(n));

  // Recommandations de base depuis la save
  const BASE_ESSENTIALS = {
    kindling:'Allumage', watering:'Arrosage', planting:'Plantation',
    electric:'Énergie', handiwork:'Artisanat', gathering:'Collecte',
    lumbering:'Abattage', mining:'Minage', medicine:'Pharmacie',
    cooling:'Réfrigération', transporting:'Transport',
  };

  const baseGaps = Object.entries(BASE_ESSENTIALS).map(([work, label]) => {
    const best = capturedPals
      .filter(p => (p.work||{})[work])
      .sort((a,b) => (b.work[work]||0) - (a.work[work]||0))[0];
    return { work, label, best, level: best ? best.work[work] : 0 };
  }).filter(g => g.level < 3); // postes à améliorer (< Lv3)

  container.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:1rem">
      <button class="btn btn-ghost btn-sm" onclick="exportDashboard()">📤 Exporter Paldeck .txt</button>
    </div>
    <!-- Header stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.75rem;margin-bottom:2rem">
      ${[
        { icon:'📖', val:captured.size, label:'Pals capturés', sub:`/${total} · ${pct}%`, color:'var(--mint)' },
        { icon:'🏆', val:ACHIEVEMENTS.filter(a => a.detect(analysis) || false).length, label:'Succès auto-détectés', sub:`/ ${ACHIEVEMENTS.filter(a=>!a.manual).length}`, color:'var(--sun)' },
        { icon:'💞', val:availableCombos.length, label:'Combos disponibles', sub:'avec tes Pals actuels', color:'var(--coral)' },
        { icon:'⭐', val:legendaryMissing.length, label:'Légendaires restants', sub:legendaryMissing.join(', ') || 'Tous capturés !', color:'var(--purple)' },
      ].map(s => `
        <div style="background:var(--glass);border:1.5px solid ${s.color}33;border-left:4px solid ${s.color};border-radius:var(--r-md);padding:1rem;box-shadow:var(--sh)">
          <div style="font-size:1.75rem;margin-bottom:.25rem">${s.icon}</div>
          <div style="font-family:var(--ff-d);font-size:1.6rem;font-weight:900;color:${s.color}">${s.val}</div>
          <div style="font-size:.78rem;font-weight:700;margin-bottom:.15rem">${s.label}</div>
          <div style="font-size:.65rem;color:var(--ink-f)">${s.sub}</div>
        </div>`).join('')}
    </div>

    <!-- Barre progression Paldeck -->
    <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:1.25rem;margin-bottom:1.5rem;box-shadow:var(--sh)">
      <div style="display:flex;justify-content:space-between;margin-bottom:.5rem">
        <span style="font-family:var(--ff-d);font-weight:700">📖 Progression Paldeck</span>
        <span style="font-family:var(--ff-m);color:var(--mint-d);font-weight:700">${captured.size} / ${total}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div style="font-size:.72rem;color:var(--ink-f);margin-top:.4rem">${missingPals.length} Pals restants à capturer</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.5rem">
      <!-- Combos breeding disponibles -->
      <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:1.25rem;box-shadow:var(--sh)">
        <h3 style="font-family:var(--ff-d);font-size:1rem;margin-bottom:.75rem">💞 Combos breeding disponibles <span style="color:var(--coral);font-size:.75rem">(${availableCombos.length})</span></h3>
        ${availableCombos.length === 0
          ? '<p style="font-size:.8rem;color:var(--ink-f)">Aucun combo disponible avec tes Pals actuels.</p>'
          : `<div style="display:flex;flex-direction:column;gap:.4rem;max-height:280px;overflow-y:auto">
              ${availableCombos.slice(0,12).map(c => {
                const child = PALS.find(p=>p.name===c.child);
                return `<div style="display:flex;align-items:center;gap:.5rem;padding:.4rem .6rem;background:var(--paper-d);border-radius:6px;cursor:pointer" onclick="openModal('${child?.id||''}')">
                  ${palImg(c.p1,24)}
                  <span style="font-size:.68rem;font-weight:700">${c.p1}</span>
                  <span style="color:var(--ink-f);font-size:.8rem">×</span>
                  ${palImg(c.p2,24)}
                  <span style="font-size:.68rem;font-weight:700">${c.p2}</span>
                  <span style="color:var(--ink-f);font-size:.75rem">→</span>
                  ${palImg(c.child,28)}
                  <span style="font-size:.7rem;font-weight:700;color:var(--mint-d)">${c.child}</span>
                </div>`;
              }).join('')}
              ${availableCombos.length > 12 ? `<div style="font-size:.7rem;color:var(--ink-f);text-align:center;padding:.3rem">+${availableCombos.length-12} autres combos disponibles</div>` : ''}
             </div>`}
      </div>

      <!-- Lacunes de base -->
      <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:1.25rem;box-shadow:var(--sh)">
        <h3 style="font-family:var(--ff-d);font-size:1rem;margin-bottom:.75rem">🏗️ Postes à améliorer <span style="color:var(--sun);font-size:.75rem">(< Lv3)</span></h3>
        ${baseGaps.length === 0
          ? '<p style="font-size:.8rem;color:var(--mint-d);font-weight:700">✓ Tous tes postes sont bien couverts !</p>'
          : `<div style="display:flex;flex-direction:column;gap:.4rem">
              ${baseGaps.map(g => {
                const alternatives = PALS.filter(p => !captured.has(p.name) && (p.work||{})[g.work] >= 3)
                  .sort((a,b)=>(b.work[g.work]||0)-(a.work[g.work]||0)).slice(0,2);
                return `<div style="padding:.5rem .7rem;background:var(--paper-d);border-radius:6px;border-left:3px solid var(--coral)">
                  <div style="font-size:.75rem;font-weight:700">${g.label} — actuellement Lv${g.level || '?'}</div>
                  ${alternatives.length ? `<div style="font-size:.65rem;color:var(--ink-f);margin-top:.2rem">
                    💡 Capture : ${alternatives.map(p=>`${palImg(p.name,20)} <strong>${p.name}</strong> (Lv${p.work[g.work]})`).join(', ')}
                  </div>` : ''}
                </div>`;
              }).join('')}
             </div>`}
      </div>
    </div>

    <!-- Succès proches + Légendaires -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
      <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:1.25rem;box-shadow:var(--sh)">
        <h3 style="font-family:var(--ff-d);font-size:1rem;margin-bottom:.75rem">🏆 Succès presque débloqués</h3>
        ${nearAchs.length === 0
          ? `<p style="font-size:.8rem;color:var(--ink-f)">Aucun succès proche — continue à jouer !</p>`
          : nearAchs.slice(0,6).map(a => `
            <div style="padding:.5rem .7rem;background:var(--paper-d);border-radius:6px;margin-bottom:.4rem;display:flex;align-items:center;gap:.5rem">
              <span style="font-size:1.2rem">${a.icon}</span>
              <div>
                <div style="font-size:.75rem;font-weight:700">${a.name}</div>
                ${a.threshold ? `<div style="font-size:.65rem;color:var(--mint-d)">${captured.size} / ${a.threshold} Pals</div>` : ''}
              </div>
            </div>`).join('')}
      </div>
      <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:1.25rem;box-shadow:var(--sh)">
        <h3 style="font-family:var(--ff-d);font-size:1rem;margin-bottom:.75rem">💎 Légendaires & Top Tier à capturer</h3>
        ${[...legendaryMissing.map(n=>({n,leg:true})), ...topMissing.filter(n=>!legendaryMissing.includes(n)).slice(0,5).map(n=>({n,leg:false}))].slice(0,8).map(({n,leg}) => {
          const p = PALS.find(x=>x.name===n);
          return `<div style="padding:.4rem .6rem;background:var(--paper-d);border-radius:6px;margin-bottom:.35rem;display:flex;align-items:center;gap:.5rem">
            ${palImg(n,28)}
            <div>
              <span style="font-size:.75rem;font-weight:700">${n}</span>
              ${leg ? '<span style="font-size:.55rem;background:var(--sun);color:var(--ink);padding:.1rem .3rem;border-radius:3px;margin-left:.3rem;font-weight:800">LEG</span>' : '<span style="font-size:.55rem;background:var(--lagoon);color:#fff;padding:.1rem .3rem;border-radius:3px;margin-left:.3rem;font-weight:800">TIER A</span>'}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════
   PLANIFICATEUR DE BASE
══════════════════════════════════════════════════ */

const PLANNER_JOBS = [
  {id:'kindling',  icon:'🔥', label:'Allumage',        desc:'Fonderies & cuisine',     color:'#FF6B35'},
  {id:'watering',  icon:'💧', label:'Arrosage',         desc:'Plantations & Roues à eau',color:'#4FC3F7'},
  {id:'planting',  icon:'🌱', label:'Plantation',       desc:'Cultures & semences',     color:'#66BB6A'},
  {id:'electric',  icon:'⚡', label:'Énergie',          desc:'Machines électriques',    color:'#FFD54F'},
  {id:'handiwork', icon:'🔨', label:'Artisanat',        desc:'Construction & établis',  color:'#A1887F'},
  {id:'gathering', icon:'🌿', label:'Collecte',         desc:'Herbes & ressources',     color:'#81C784'},
  {id:'lumbering', icon:'🪓', label:'Abattage',         desc:'Bois de charpente',       color:'#795548'},
  {id:'mining',    icon:'⛏️', label:'Minage',           desc:'Minerais & pierre',       color:'#90A4AE'},
  {id:'medicine',  icon:'💊', label:'Pharmacie',        desc:'Médicaments & remèdes',   color:'#F48FB1'},
  {id:'cooling',   icon:'❄️', label:'Réfrigération',    desc:'Glacières & conservation',color:'#80DEEA'},
  {id:'transporting',icon:'🚚',label:'Transport',       desc:'Déplacement d\'objets',   color:'#FFCC02'},
  {id:'farming',   icon:'🐄', label:'Élevage',          desc:'Ranch & œufs',            color:'#FFAB40'},
];

let _plannerSelected = new Set();
let _plannerLevel = 1;

function initPlanner() {
  renderPlannerJobs();
}

function renderPlannerJobs() {
  const container = document.getElementById('planner-jobs');
  if (!container) return;
  container.innerHTML = PLANNER_JOBS.map(job => {
    const selected = _plannerSelected.has(job.id);
    const iconImg = WORK_ICONS?.[job.id]
      ? `<img src="${WORK_ICONS[job.id]}" width="28" height="28" style="margin-bottom:.3rem">`
      : `<span style="font-size:1.6rem">${job.icon}</span>`;
    return `<div onclick="togglePlanJob('${job.id}')" style="
      padding:.75rem;border-radius:var(--r-md);border:2px solid ${selected ? job.color : 'var(--line)'};
      background:${selected ? job.color+'22' : 'var(--glass)'};cursor:pointer;text-align:center;
      transition:all .15s;box-shadow:${selected ? '0 0 0 2px '+job.color+'44' : 'var(--sh)'}">
      ${iconImg}
      <div style="font-size:.78rem;font-weight:700;margin-bottom:.1rem">${job.label}</div>
      <div style="font-size:.62rem;color:var(--ink-f)">${job.desc}</div>
      ${selected ? '<div style="font-size:.6rem;color:'+job.color+';font-weight:800;margin-top:.25rem">✓ SÉLECTIONNÉ</div>' : ''}
    </div>`;
  }).join('');
}

function togglePlanJob(id) {
  if (_plannerSelected.has(id)) _plannerSelected.delete(id);
  else _plannerSelected.add(id);
  renderPlannerJobs();
}

function setPlanLevel(lv, btn) {
  _plannerLevel = lv;
  document.querySelectorAll('[id^="plan-lv-"]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function runPlanner() {
  const result = document.getElementById('planner-result');
  if (!result) return;

  if (_plannerSelected.size === 0) {
    result.innerHTML = '<p style="color:var(--coral)">Sélectionne au moins un poste de production.</p>';
    result.style.display = 'block';
    return;
  }

  const captured = window._saveAnalysis?.capturedNames || null;

  // Pour chaque poste sélectionné, trouver les meilleurs Pals
  const recommendations = [];

  _plannerSelected.forEach(jobId => {
    const job = PLANNER_JOBS.find(j => j.id === jobId);
    if (!job) return;

    // Trouver tous les Pals avec ce type de travail >= niveau minimum
    const candidates = PALS.filter(p => (p.work||{})[jobId] >= _plannerLevel)
      .sort((a,b) => (b.work[jobId]||0) - (a.work[jobId]||0));

    const hasCaptured = candidates.filter(p => captured?.has(p.name));
    const toCapture = candidates.filter(p => !captured?.has(p.name));

    recommendations.push({ job, candidates, hasCaptured, toCapture });
  });

  // Score de couverture global
  const totalJobs = _plannerSelected.size;
  const coveredJobs = recommendations.filter(r => r.hasCaptured.length > 0).length;

  result.style.display = 'block';
  result.innerHTML = `
    <div style="margin-bottom:1.5rem;padding:1rem 1.25rem;background:var(--glass);border:var(--bdr);border-radius:var(--r-md);box-shadow:var(--sh)">
      <div style="font-family:var(--ff-d);font-size:1.1rem;font-weight:700;margin-bottom:.5rem">
        📋 Plan optimal — ${totalJobs} poste${totalJobs>1?'s':''} sélectionné${totalJobs>1?'s':''}
      </div>
      ${captured ? `<div style="font-size:.82rem;color:${coveredJobs===totalJobs?'var(--mint-d)':'var(--coral)'}">
        ${coveredJobs===totalJobs ? '✅ Tu as déjà les Pals pour couvrir tous tes postes !' : `⚠️ ${totalJobs-coveredJobs} poste${totalJobs-coveredJobs>1?'s':''} non couvert${totalJobs-coveredJobs>1?'s':''} avec tes Pals actuels.`}
      </div>` : '<div style="font-size:.78rem;color:var(--ink-f)">💡 Importe ta sauvegarde pour voir quels Pals tu possèdes déjà.</div>'}
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem">
    ${recommendations.map(({job, candidates, hasCaptured, toCapture}) => `
      <div style="background:var(--glass);border:var(--bdr);border-left:4px solid ${job.color};border-radius:var(--r-md);padding:1.1rem;box-shadow:var(--sh)">
        <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.85rem">
          ${WORK_ICONS?.[job.id] ? `<img src="${WORK_ICONS[job.id]}" width="24" height="24">` : job.icon}
          <span style="font-family:var(--ff-d);font-weight:700">${job.label}</span>
          <span style="font-family:var(--ff-m);font-size:.65rem;background:${job.color};color:#fff;padding:.15rem .45rem;border-radius:4px;margin-left:auto">Lv ${_plannerLevel}+ requis</span>
        </div>

        ${hasCaptured.length > 0 ? `
          <div style="font-size:.7rem;font-weight:700;color:var(--mint-d);margin-bottom:.4rem">✅ Déjà capturés</div>
          <div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.75rem">
            ${hasCaptured.slice(0,4).map(p => `
              <div onclick="openModal('${p.id}')" style="display:flex;align-items:center;gap:.3rem;padding:.3rem .5rem;background:rgba(0,227,74,.1);border:1px solid var(--mint-d);border-radius:6px;cursor:pointer;font-size:.68rem;font-weight:700">
                ${palImg(p.name,22)} ${p.name}
                <span style="font-family:var(--ff-m);color:var(--mint-d);font-size:.6rem">Lv${p.work[job.id]}</span>
              </div>`).join('')}
          </div>` : captured ? `<div style="font-size:.72rem;color:var(--coral);margin-bottom:.6rem">❌ Aucun Pal capturé pour ce poste</div>` : ''}

        ${toCapture.length > 0 ? `
          <div style="font-size:.7rem;font-weight:700;color:var(--ink-f);margin-bottom:.4rem">🎯 À capturer en priorité</div>
          <div style="display:flex;flex-wrap:wrap;gap:.35rem">
            ${toCapture.slice(0,4).map(p => `
              <div onclick="openModal('${p.id}')" style="display:flex;align-items:center;gap:.3rem;padding:.3rem .5rem;background:var(--paper-d);border:var(--bdr);border-radius:6px;cursor:pointer;font-size:.68rem">
                ${palImg(p.name,22)} <strong>${p.name}</strong>
                <span style="font-family:var(--ff-m);color:${job.color};font-size:.6rem">Lv${p.work[job.id]}</span>
              </div>`).join('')}
          </div>` : ''}
      </div>`).join('')}
    </div>`;
}

/* ── Raccourcis clavier ── */
document.addEventListener('keydown', e => {
  // Esc = fermer modal / recherche
  if (e.key === 'Escape') {
    if (document.getElementById('modal-overlay')?.style.display !== 'none') {
      closeModal();
    } else {
      const results = document.getElementById('global-results');
      if (results && results.innerHTML) {
        results.innerHTML = '';
        results.style.display = 'none';
        document.getElementById('global-search-input')?.blur();
      }
    }
  }
  // / = focus recherche globale (si pas dans un input)
  if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    const inp = document.getElementById('global-search-input');
    if (inp) { inp.focus(); inp.select(); }
  }
  // P = Paldeck, B = Breeding, C = Crafting, G = Guides, T = Tier List, D = Dashboard
  if (!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !e.ctrlKey && !e.metaKey) {
    const shortcuts = { p:'pals', b:'breeding', c:'crafting', g:'guides', t:'tierlist', d:'dashboard', m:'maps' };
    const page = shortcuts[e.key.toLowerCase()];
    if (page) navigate(page);
  }
});


/* ══════════════════════════════════════════════════
   ARBRE D'ÉLEVAGE VISUEL
   Montre le chemin depuis les Pals communs jusqu'à la cible
══════════════════════════════════════════════════ */

function initBreedTree() {
  const sel = document.getElementById('tree-target');
  if (!sel || sel.options.length > 1) return;
  const sorted = [...PALS].sort((a,b) => a.name.localeCompare(b.name));
  sorted.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = `${p.name}${p.nameEN ? ' / '+p.nameEN : ''}`;
    sel.appendChild(opt);
  });
}

function buildBreedTree() {
  const target = document.getElementById('tree-target').value;
  const container = document.getElementById('tree-result');
  if (!target || !container) return;

  const palObj = PALS.find(p => p.name === target);

  // Trouver les combos directs (cible = enfant)
  const directCombos = BREEDING_COMBOS.filter(c => c.child === target);

  // Calculateur inversé : combos mathématiques
  const targetRank = POWER_RANKS[target];
  const mathCombos = [];
  if (targetRank) {
    const allEntries = Object.entries(POWER_RANKS);
    const seen = new Set();
    for (const [nameA, rankA] of allEntries) {
      if (nameA === target) continue;
      const neededB = 2 * targetRank - rankA;
      let bestB = null, bestDiff = Infinity;
      for (const [nameB, rankB] of allEntries) {
        if (nameB === target || nameB === nameA) continue;
        const diff = Math.abs(rankB - neededB);
        if (diff < bestDiff) { bestDiff = diff; bestB = {name:nameB, rank:rankB}; }
      }
      if (bestB && bestDiff <= 3) {
        const avg = (rankA + bestB.rank) / 2;
        let closestPal = null, closestDiff = Infinity;
        for (const [name, rank] of allEntries) {
          const d = Math.abs(rank - avg);
          if (d < closestDiff) { closestDiff = d; closestPal = name; }
        }
        if (closestPal === target) {
          const key = [nameA, bestB.name].sort().join('|');
          if (!seen.has(key) && !directCombos.some(c=>(c.p1===nameA&&c.p2===bestB.name)||(c.p1===bestB.name&&c.p2===nameA))) {
            seen.add(key);
            mathCombos.push({ p1:nameA, r1:rankA, p2:bestB.name, r2:bestB.rank });
          }
        }
      }
    }
  }

  // Calculer la "rareté d'accès" = PR moyen des parents
  const sortedMath = mathCombos.sort((a,b) => {
    const commonA = Math.min(a.r1, a.r2); // plus le rang est élevé, plus le Pal est commun
    const commonB = Math.min(b.r1, b.r2);
    return commonB - commonA;
  }).slice(0, 20);

  // Trouver les combos niveau 2 (parents des parents — pour les combos fixes)
  function getParentCombos(palName) {
    return BREEDING_COMBOS.filter(c => c.child === palName).slice(0, 2);
  }

  const renderPalNode = (name, size = 40) => {
    const p = PALS.find(x => x.name === name);
    const els = p ? p.el.map(e => elIconImg(e,10)||EL[e]?.icon||'').join('') : '';
    const rank = POWER_RANKS[name] || '?';
    return `<div onclick="${p?`openModal('${p.id}')`:''}'" style="text-align:center;cursor:${p?'pointer':'default'};min-width:${size+30}px">
      ${palImg(name, size) || `<div style="width:${size}px;height:${size}px;background:var(--paper-d);border-radius:6px;display:inline-flex;align-items:center;justify-content:center">🐾</div>`}
      <div style="font-size:${size>50?.65:.58}rem;font-weight:700;margin-top:.2rem;line-height:1.2">${name}</div>
      <div style="font-size:.5rem;color:var(--ink-f)">${els}</div>
      <div style="font-family:var(--ff-m);font-size:.52rem;color:var(--mint-d)">PR${rank}</div>
    </div>`;
  };

  const renderComboRow = (p1, p2, child, note, isFixed) => `
    <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;
      background:${isFixed?'rgba(255,208,0,.1)':'var(--glass)'};
      border:1.5px solid ${isFixed?'var(--sun)':'var(--line)'};
      border-radius:var(--r-md);flex-wrap:wrap">
      ${renderPalNode(p1, 44)}
      <div style="display:flex;flex-direction:column;align-items:center;gap:.2rem;flex-shrink:0">
        <span style="font-size:1.4rem;color:var(--ink-f)">×</span>
        ${isFixed?'<span style="font-size:.55rem;color:var(--sun);font-weight:800;font-family:var(--ff-m)">FIXE</span>':'<span style="font-size:.55rem;color:var(--lagoon);font-weight:800;font-family:var(--ff-m)">MATH</span>'}
      </div>
      ${renderPalNode(p2, 44)}
      <span style="font-size:1.4rem;color:var(--ink-f);flex-shrink:0">→</span>
      ${renderPalNode(child, 56)}
      ${note?`<span style="font-size:.65rem;color:var(--ink-f);font-style:italic;align-self:flex-end">${note}</span>`:''}
    </div>`;

  // Construire l'arbre niveau 2 pour les combos fixes
  const level2Html = directCombos.slice(0,3).map(combo => {
    const parentCombosA = getParentCombos(combo.p1);
    const parentCombosB = getParentCombos(combo.p2);
    if (!parentCombosA.length && !parentCombosB.length) return '';
    return `
      <details style="margin-top:.5rem;margin-left:1.5rem">
        <summary style="cursor:pointer;font-size:.72rem;color:var(--ink-f);padding:.3rem .5rem;background:var(--paper-d);border-radius:5px;list-style:none">
          🌿 Comment obtenir ${combo.p1} et ${combo.p2} ?
        </summary>
        <div style="margin-top:.5rem;display:flex;flex-direction:column;gap:.4rem;padding:.5rem;border-left:2px solid var(--line)">
          ${parentCombosA.length ? `<div style="font-size:.68rem;color:var(--ink-f);font-weight:700">${combo.p1} :</div>${parentCombosA.map(c=>renderComboRow(c.p1,c.p2,c.child,c.note,true)).join('')}` : `<div style="font-size:.68rem;color:var(--ink-f)">${combo.p1} se capture dans la nature.</div>`}
          ${parentCombosB.length ? `<div style="font-size:.68rem;color:var(--ink-f);font-weight:700;margin-top:.3rem">${combo.p2} :</div>${parentCombosB.map(c=>renderComboRow(c.p1,c.p2,c.child,c.note,true)).join('')}` : `<div style="font-size:.68rem;color:var(--ink-f)">${combo.p2} se capture dans la nature.</div>`}
        </div>
      </details>`;
  }).join('');

  container.innerHTML = `
    <!-- Cible -->
    <div style="display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:var(--paper-d);border-radius:var(--r-md);border:var(--bdr);margin-bottom:1.25rem">
      ${palImg(target, 64)}
      <div>
        <div style="font-family:var(--ff-d);font-size:1.2rem;font-weight:700">${target}</div>
        <div style="font-size:.72rem;color:var(--ink-f)">
          Power Rank : <strong>${targetRank || '?'}</strong> ·
          Tier : <strong style="color:var(--sun)">${getTier(target)}</strong> ·
          ${directCombos.length} combo${directCombos.length>1?'s':''} fixe${directCombos.length>1?'s':''}
        </div>
        ${palObj ? `<div style="font-size:.68rem;margin-top:.3rem">${palObj.el.map(e=>elIconImg(e,14)||EL[e]?.icon||'').join(' ')}</div>` : ''}
      </div>
    </div>

    ${directCombos.length ? `
    <div style="margin-bottom:1.5rem">
      <div style="font-family:var(--ff-d);font-weight:700;font-size:.95rem;margin-bottom:.75rem;color:var(--sun)">⭐ Combos fixes garantis (${directCombos.length})</div>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        ${directCombos.map(c => renderComboRow(c.p1, c.p2, c.child, c.note, true)).join('')}
      </div>
      ${level2Html}
    </div>` : `<div style="padding:.75rem;background:rgba(255,100,50,.1);border-radius:var(--r-sm);border-left:3px solid var(--coral);font-size:.82rem;margin-bottom:1.25rem">Aucun combo fixe — ${target} s'obtient uniquement par calcul Power Rank ou en capturant dans la nature.</div>`}

    ${sortedMath.length ? `
    <div>
      <div style="font-family:var(--ff-d);font-weight:700;font-size:.95rem;margin-bottom:.75rem;color:var(--lagoon)">
        🧮 Combinaisons par Power Rank (${sortedMath.length} trouvées · triées par accessibilité)
      </div>
      <div style="display:flex;flex-direction:column;gap:.45rem">
        ${sortedMath.slice(0,10).map(c => renderComboRow(c.p1, c.p2, target, `PR${c.r1}+${c.r2}`, false)).join('')}
      </div>
      ${sortedMath.length>10?`<div style="font-size:.72rem;color:var(--ink-f);text-align:center;margin-top:.5rem">+${sortedMath.length-10} autres combinaisons — utilise le Calc. Inversé pour tout voir</div>`:''}
    </div>` : ''}`;
}

