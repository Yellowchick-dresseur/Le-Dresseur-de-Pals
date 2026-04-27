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
  if (page === 'journal')    { initJournal(); }
  if (page === 'stats')     { initStats(); }
  if (page === 'tracker')   { initTracker(); }
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



/* ── Mode Clair / Sombre ── */
function initTheme() {
  const saved = localStorage.getItem('dresseur_theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('dresseur_theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
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
    <div class="pm-name" style="display:flex;align-items:center;gap:.3rem">
      ${p.name}
      ${(function(){try{const n=JSON.parse(localStorage.getItem('dresseur_pal_notes')||'{}');return n[p.id]?'<span style="font-size:.6rem;opacity:.7" title="Tu as une note sur ce Pal">📝</span>':'';}catch{return '';}})()}
    </div>
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
  initHabitatFilters();
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
  const habFilter  = typeof _habitatFilter !== 'undefined' ? _habitatFilter : null;
  const levelMin = parseInt(document.getElementById('work-level-min')?.value || '0');

  let list = PALS.filter(p => {
    const matchText = !q || p.name.toLowerCase().includes(q)
      || (p.nameEN && p.nameEN.toLowerCase().includes(q));
    const matchEl = !state.palFilter.element || p.el.includes(state.palFilter.element);
    const matchWork    = workFilter === 'all' || ((p.work||{})[workFilter] !== undefined);
    const matchHabitat = !habFilter || (HABITATS[habFilter]||[]).includes(p.name);
    const matchLevel = levelMin === 0 || ((p.work||{})[workFilter] || 0) >= levelMin;
    return matchText && matchEl && matchWork && matchLevel && matchHabitat;
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
  // BREEDING_COMBOS format : {p1, p2, child, note}
  const combosForPal = BREEDING_COMBOS.filter(c =>
    c.child === p.name || c.p1 === p.name || c.p2 === p.name
  );
  const breedHTML = combosForPal.length
    ? combosForPal.slice(0, 6).map(c => {
        const isChild = c.child === p.name;
        const p1obj = PALS.find(x=>x.name===c.p1), p2obj = PALS.find(x=>x.name===c.p2), chObj = PALS.find(x=>x.name===c.child);
        return `<div class="breed-row" style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;padding:.4rem .5rem;background:var(--paper-d);border-radius:6px;margin-bottom:.3rem">
          <div style="display:flex;align-items:center;gap:.25rem">${palImg(c.p1,28)}<strong style="font-size:.75rem">${c.p1}</strong></div>
          <span class="breed-x">×</span>
          <div style="display:flex;align-items:center;gap:.25rem">${palImg(c.p2,28)}<strong style="font-size:.75rem">${c.p2}</strong></div>
          <span class="breed-arr">→</span>
          <div style="display:flex;align-items:center;gap:.25rem">${palImg(c.child,32)}<strong style="font-size:.78rem;color:${isChild?'var(--sun)':'var(--mint-d)'}">${c.child}</strong></div>
          ${c.note?`<span style="font-size:.62rem;color:var(--ink-f);margin-left:auto">${c.note}</span>`:''}
        </div>`;
      }).join('')
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
        <div class="modal-section" style="border-top:var(--bdr);padding-top:1rem;margin-top:1rem">
          <div class="modal-section-ttl">📝 Mes notes</div>
          <textarea id="pal-note-${p.id}"
            placeholder="Ajoute tes observations (passives, spawn confirmé, stratégie…)"
            oninput="savePalNote('${p.id}', this.value)"
            style="width:100%;min-height:70px;padding:.5rem .75rem;font-size:.8rem;
              border-radius:6px;border:1.5px solid var(--line);background:var(--paper-d);
              color:var(--ink);font-family:var(--ff-m);resize:vertical;box-sizing:border-box;
              transition:border-color .15s;line-height:1.5"
            onfocus="this.style.borderColor='var(--mint)'"
            onblur="this.style.borderColor='var(--line)'"
          >${getPalNote('${p.id}')}</textarea>
        </div>
        <div style="margin-top:1.25rem;display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="addToCompare('${p.id}');closeModal()">⚖️ Comparer</button>
          <button class="btn btn-ghost btn-sm" onclick="navigate('breeding');setTimeout(()=>{setBreedTab('arbre');document.getElementById('tree-target').value='${p.name}';buildBreedTree();},200);closeModal()">🌳 Arbre élevage</button>
          <button class="btn btn-ghost btn-sm" onclick="closeModal()">Fermer</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.body.style.overflow = 'hidden';
}


/* ── Notes personnelles par Pal ── */
function getPalNote(id) {
  try {
    const notes = JSON.parse(localStorage.getItem('dresseur_pal_notes') || '{}');
    return (notes[id] || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  } catch { return ''; }
}

function savePalNote(id, text) {
  try {
    const notes = JSON.parse(localStorage.getItem('dresseur_pal_notes') || '{}');
    if (text.trim()) notes[id] = text;
    else delete notes[id];
    localStorage.setItem('dresseur_pal_notes', JSON.stringify(notes));
    showToast('💾 Note sauvegardée', 'success', 1500);
  } catch {}
}

function getAllPalNotes() {
  try { return JSON.parse(localStorage.getItem('dresseur_pal_notes') || '{}'); }
  catch { return {}; }
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
  // Activer le bon bouton tab (cherche par onclick ou par texte)
  document.querySelectorAll('#pg-breeding .tab').forEach(t => {
    const match = t.getAttribute('onclick')?.includes("'" + id + "'");
    t.classList.toggle('active', !!match);
  });
  // Afficher le bon panel
  document.querySelectorAll('#pg-breeding .tab-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('br-' + id);
  if (panel) panel.classList.add('active');
  state.breedTab = id;
  // Hooks d'initialisation
  if (id === 'reverse') initReverseCalc();
  if (id === 'arbre')   initBreedTree();
  if (id === 'simu')    initSimulator();
}

function setComboFilter(tag) {
  state.comboFilter = tag;
  document.querySelectorAll('.combo-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.tag === tag));
  renderCombos(tag);
}

function renderCombos(tag) {
  const list = tag === 'all' ? BREEDING_COMBOS : BREEDING_COMBOS.filter(c => c.tags && c.tags.includes(tag));
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
  // Détecter le type d'item à partir de son nom
  function inferType(name) {
    const n = name.toLowerCase();
    if (/selle|harnais|gants|collier|pistolet-mitrailleur|lance-|minigun|bandeau|anneau/.test(n)) return 'monture';
    if (/armure|heaume|casque|vêtement|bouclier|bottes|ceinture|planeur|parachute|habits/.test(n)) return 'armure';
    if (/fusil|pistolet|arbalète|arc|lance|batte|katana|épée|matraque|détecteur|canon|gatling/.test(n)) return 'arme';
    if (/sphère|méga sphère|giga sphère|téra sphère|ultra sphère|sphère légendaire|sphère ultime|chaîne de production de sphères|usine de sphères/.test(n)) return 'sphère';
    return 'structure';
  }

  function inferIcon(name) {
    const n = name.toLowerCase();
    if (/selle/.test(n)) return '🐉';
    if (/harnais|gants|collier|bandeau/.test(n)) return '🎽';
    if (/armure|casque|heaume|vêtement/.test(n)) return '🛡️';
    if (/bouclier/.test(n)) return '🛡️';
    if (/bottes/.test(n)) return '👢';
    if (/fusil|pistolet-mitrailleur|pistolet|mitrailleuse|gatling/.test(n)) return '🔫';
    if (/lance-fusées|lance-missiles|lance-grenades|lance-flammes/.test(n)) return '🚀';
    if (/arc|arbalète/.test(n)) return '🏹';
    if (/épée|katana|lance|batte/.test(n)) return '⚔️';
    if (/sphère/.test(n)) return '🎯';
    if (/fonderie|fournaise/.test(n)) return '🔥';
    if (/ferme|ranch|plantation/.test(n)) return '🌾';
    if (/incubateur/.test(n)) return '🥚';
    if (/table|établi|chaîne|usine/.test(n)) return '🏭';
    if (/coffre|boîte|silo|stockage/.test(n)) return '📦';
    if (/planeur|parachute/.test(n)) return '🪂';
    if (/grenade|mine/.test(n)) return '💣';
    if (/générateur|énergie/.test(n)) return '⚡';
    if (/lit|chambre/.test(n)) return '🛏️';
    if (/canne à pêche|bassin de pêche/.test(n)) return '🎣';
    if (/condensateur/.test(n)) return '✨';
    if (/statue/.test(n)) return '🗿';
    if (/autel/.test(n)) return '🏛️';
    if (/polymère|fibre|plastacier|hexolite/.test(n)) return '🧪';
    return '🔧';
  }

  const TYPE_LABELS = {
    all:'TOUT', structure:'🏗️ Structures', arme:'⚔️ Armes',
    armure:'🛡️ Armures', monture:'🐉 Montures', sphère:'🎯 Sphères',
  };

  document.getElementById('tech-tree').innerHTML = TECH_TREE.map(lvl => {
    // Normaliser les items en objets
    const normalized = (lvl.items || []).map(i => {
      if (typeof i === 'string') {
        return { name: i, icon: inferIcon(i), type: inferType(i) };
      }
      return { name: i.name || i, icon: i.icon || inferIcon(i.name||''), type: i.type || inferType(i.name||'') };
    });

    const filtered = normalized.filter(i => {
      const matchType   = state.techFilter.type === 'all' || i.type === state.techFilter.type;
      const matchSearch = !state.techFilter.search || i.name.toLowerCase().includes(state.techFilter.search);
      return matchType && matchSearch;
    });

    if (!filtered.length) return '';

    const preview = filtered.slice(0, 2).map(i => `${i.icon} ${i.name}`).join(' · ');
    const extra   = filtered.length > 2 ? `…` : '';

    return `<div class="tech-lvl open">
      <div class="tech-lvl-hdr" onclick="this.parentElement.classList.toggle('open')">
        <span class="tech-lvl-num">Niv. ${lvl.lv || lvl.lvl}</span>
        <span class="tech-pts">${lvl.pts} pt${lvl.pts > 1 ? 's' : ''}</span>
        <span class="tech-lvl-title">${preview}${extra}</span>
        <span class="tech-lvl-count">${filtered.length} tech ›</span>
      </div>
      <div class="tech-lvl-body">
        ${filtered.map(i => `
          <div class="tech-item">
            <span class="tech-icon">${i.icon}</span>
            <span class="tech-name">${i.name}</span>
            <span class="tech-type-badge">${TYPE_LABELS[i.type] || i.type}</span>
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function renderRecipes() {
  document.getElementById('recipes-list').innerHTML = RECIPES.map(r => {
    // Normaliser : supporte {station/via} et {ing/ingredients}
    const station     = r.station || r.via || '';
    const ingredients = r.ing
      ? r.ing.map(i => `${i.q}× ${i.n}`)
      : (r.ingredients || []);
    const note = r.note || '';

    return `
    <div class="recipe-card">
      <div class="recipe-name">${r.icon || '🔧'} ${r.name}</div>
      <div class="recipe-station">📍 ${station}</div>
      ${note ? `<div class="recipe-note">💡 ${note}</div>` : ''}
      <div class="recipe-ing">
        ${ingredients.map(ing => {
          const [qty, ...nameParts] = typeof ing === 'string'
            ? ing.split('×').map(s => s.trim())
            : [ing.q, ing.n];
          const matName = nameParts.length ? nameParts.join(' ').trim() : qty;
          const matQty  = nameParts.length ? qty : '';
          return `<div class="recipe-row">
            <span>${matName}</span>
            ${matQty ? `<span class="recipe-qty">×${matQty}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
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
  const EL_COLORS_R = {
    fire:'#FF6B35',water:'#4FC3F7',electric:'#FFD54F',
    dark:'#7B5EA7',neutral:'#9E9E9E',ice:'#80DEEA',
    dragon:'#6C4CF2',grass:'#66BB6A',ground:'#A1887F',
  };
  const RAID_TIPS = {
    'Bellanoir':        ['Équipe recommandée : Pals avec passives Legend + Musclehead.','Utilise les piliers pour éviter les AoE.','Lv 30+ requis.'],
    'Bellanoir Libero': ['Version hardcore — groupe de 4 joueurs conseillé.','Pals endgame minimum (Tier A+) nécessaires.','Slabs condensés via donjons difficiles.'],
    'Blazamut Ryu':     ['Pals Eau ou Dragon contre Feu.','Blazamut Ryu attaque plus vite que Blazamut normal.','Lv 50+ conseillé.'],
    'Xenolord':         ['4× Fragments de Slab Xeno dans les donjons de Feybreak.','Pals Dragon + Glace contre Ténèbres.','Niveau 60 requis. Boss le plus dur du jeu.'],
    'Moon Lord':        ['Collab Terraria — boss aquatique massif.','Pals Électricité conseillés.','Sceau Céleste obtenu en progressant dans Terraria.'],
    'Hartalis':         ['Home Sweet Home — boss niveau 65.','Armures V1/V2 en récompense.','Pals Feu ou Ténèbres.'],
  };

  document.getElementById('raids-list').innerHTML = RAIDS.map(r => {
    const elColor = EL_COLORS_R[r.el] || '#888';
    const palObj  = PALS.find(p => p.name === r.name || r.name.startsWith(p.name));
    const bossImg = palImg(r.name, 64) || (palObj ? palImg(palObj.name, 64) : '');
    const tips    = r.tips || RAID_TIPS[r.name] || [];
    const req     = r.req || r.mat || '—';
    const src     = r.src || '';
    const reward  = r.reward || '';
    const note    = r.note || '';
    const elIcon  = elIconImg(r.el, 16) || '';
    const diff    = r.diff || (r.lvl >= 55 ? '★★★★★' : r.lvl >= 45 ? '★★★★' : r.lvl >= 35 ? '★★★' : '★★');

    return `
    <div class="raid-card" style="border-left:4px solid ${elColor}">
      <div style="display:flex;gap:.85rem;align-items:flex-start;margin-bottom:.85rem">
        <div style="flex-shrink:0">${bossImg}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.3rem">
            <span style="font-family:var(--ff-d);font-size:1.05rem;font-weight:700">${r.name}</span>
            <span style="font-family:var(--ff-m);font-size:.62rem;padding:.1rem .4rem;border-radius:4px;background:${elColor};color:${['#FFD54F','#80DEEA'].includes(elColor)?'#000':'#fff'}">${elIcon} ${r.el}</span>
            <span style="font-family:var(--ff-m);font-size:.62rem;color:var(--coral)">Lv ${r.lvl}</span>
          </div>
          <div style="font-size:.78rem;margin-bottom:.3rem">
            <strong>📦 Invocation :</strong> ${req}
          </div>
          ${src ? `<div style="font-size:.7rem;color:var(--ink-f);margin-bottom:.25rem"><em>Source : ${src}</em></div>` : ''}
          ${note ? `<div style="font-size:.72rem;color:var(--lagoon);margin-bottom:.25rem">ℹ️ ${note}</div>` : ''}
          <div style="font-size:.75rem;color:var(--sun);font-weight:700">🎁 ${reward}</div>
        </div>
      </div>
      ${tips.length ? `
        <div style="border-top:var(--bdr);padding-top:.65rem">
          ${tips.map(t => `<div style="font-size:.72rem;color:var(--ink-s);margin-bottom:.2rem;padding-left:.5rem;border-left:2px solid ${elColor}">▸ ${t}</div>`).join('')}
        </div>` : ''}
      ${palObj ? `<button class="btn btn-ghost btn-sm" onclick="openModal('${palObj.id}')" style="margin-top:.5rem;font-size:.65rem">Voir fiche ${palObj.name}</button>` : ''}
    </div>`;
  }).join('');
}

function renderLegendaires() {
  const EL_COLORS_L = {
    fire:'#FF6B35',water:'#4FC3F7',electric:'#FFD54F',
    dark:'#7B5EA7',neutral:'#9E9E9E',ice:'#80DEEA',
    dragon:'#6C4CF2',grass:'#66BB6A',ground:'#A1887F',
  };

  document.getElementById('leg-list').innerHTML = LEGENDAIRES.map((l, i) => {
    // Normaliser : supporte ancien format {el:[], elColor:[]} et nouveau {el:'ice', loc, note}
    const elArr   = Array.isArray(l.el) ? l.el : [l.el].filter(Boolean);
    const palObj  = PALS.find(p => p.name === l.name);
    const img     = palImg(l.name, 80);
    const stats   = palObj || {};
    const note    = l.note || l.desc || '';

    return `
    <div class="leg-card" style="animation-delay:${i * 60}ms">
      <div style="display:flex;align-items:flex-start;gap:.85rem;margin-bottom:.85rem">
        ${img}
        <div style="flex:1">
          <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.3rem">
            ${elArr.map(e => {
              const color = EL_COLORS_L[e] || '#888';
              return `<span style="background:${color};color:${['#FFD54F','#80DEEA'].includes(color)?'#000':'#fff'};font-size:.65rem;padding:.1rem .4rem;border-radius:4px;font-family:var(--ff-m);font-weight:700">${elIconImg(e,13)||''} ${EL[e]?.name||e}</span>`;
            }).join('')}
          </div>
          <div style="font-family:var(--ff-d);font-size:1.2rem;font-weight:700;margin-bottom:.25rem">${l.name}</div>
          <div style="font-size:.72rem;color:var(--ink-f)">📍 ${l.loc || ''}</div>
        </div>
      </div>

      ${stats.hp ? `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem;margin-bottom:.75rem">
        ${[['❤️','HP',stats.hp,'var(--coral)'],['⚔️','ATK',stats.atk,'#FF8800'],['🛡️','DEF',stats.def,'var(--lagoon)'],['💨','Vitesse',stats.spd,'var(--mint)']].map(([ic,lb,vl,cl]) => `
          <div style="text-align:center;padding:.4rem;background:var(--paper-d);border-radius:6px;border:var(--bdr)">
            <div style="font-size:.65rem;color:var(--ink-f)">${ic} ${lb}</div>
            <div style="font-family:var(--ff-m);font-weight:800;font-size:.85rem;color:${cl}">${vl||'—'}</div>
          </div>`).join('')}
      </div>` : ''}

      ${note ? `<p style="font-size:.78rem;color:var(--ink-s);line-height:1.5;margin-bottom:.5rem">${note}</p>` : ''}

      ${l.tips ? `<div>${(Array.isArray(l.tips)?l.tips:[l.tips]).map(t=>`<div style="font-size:.72rem;color:var(--ink-s);padding-left:.5rem;border-left:2px solid var(--sun);margin-bottom:.2rem">▸ ${t}</div>`).join('')}</div>` : ''}

      ${l.passives ? `<div style="font-family:var(--ff-m);font-size:.72rem;color:var(--mint-d);font-weight:700;margin-top:.5rem">⭐ ${l.passives.join(' · ')}</div>` : ''}

      ${palObj ? `<button class="btn btn-ghost btn-sm" onclick="openModal('${palObj.id}')" style="margin-top:.6rem;font-size:.65rem">Voir fiche ${palObj.name}</button>` : ''}
    </div>`;
  }).join('');
}

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
initTheme();
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
  if (btn) btn.classList.add('active');
  const allTabs = ['missing','captured','passives','gems','base-opt','breed-rec','dupes'];
  allTabs.forEach(t => {
    const el = document.getElementById('save-tab-' + t);
    if (el) el.style.display = (t === tab) ? '' : 'none';
  });
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
   PAGE MAPS — Carte Canvas interactive
   Coordonnées in-game Palworld (confirmées via communauté)
   X : -900 (ouest) → +950 (est)
   Y : -850 (nord) → +650 (sud)
══════════════════════════════════════════════════ */

const MAP_MARKERS = [
  // ── TOURS ──
  {cat:'tower',     name:'Tour Syndicat Rayne',        boss:'Zoe & Grizzbolt',    lv:15,  gx:-100,  gy:-408, pal:'Grizzbolt'},
  {cat:'tower',     name:'Tour Free Pal Alliance',     boss:'Lily & Lyleen',       lv:30,  gx:-580,  gy:  22, pal:'Lyleen'},
  {cat:'tower',     name:'Tour PAL Moonflowers',       boss:'Axel & Orserk',       lv:45,  gx:-590,  gy:-490, pal:'Orserk'},
  {cat:'tower',     name:'Tour PIDF',                  boss:'Marcus & Faleris',    lv:40,  gx: 490,  gy:-720, pal:'Faleris'},
  {cat:'tower',     name:'Tour Brothers Eternal Pyre', boss:'Victor & Shadowbeak', lv:45,  gx:-127,  gy: 460, pal:'Shadowbeak'},
  {cat:'tower',     name:'Tour Sakurajima',            boss:'Saya & Selyne',       lv:50,  gx: 750,  gy:-380, pal:'Selyne'},
  {cat:'tower',     name:'Tour Feybreak',              boss:'Bjorn & Bastigor',    lv:60,  gx:-480,  gy:-650, pal:'Bastigor'},
  // ── LÉGENDAIRES ──
  {cat:'legendary', name:'Jetragon',    lv:55, gx:-789, gy:-320, pal:'Jetragon',    note:'Sprint 3300'},
  {cat:'legendary', name:'Frostallion', lv:55, gx: 426, gy: 168, pal:'Frostallion', note:'Meilleure monture volante'},
  {cat:'legendary', name:'Paladius',    lv:55, gx: 447, gy:-671, pal:'Paladius',    note:'Partage spawn avec Necromus'},
  {cat:'legendary', name:'Necromus',    lv:55, gx: 460, gy:-680, pal:'Necromus',    note:'Partage spawn avec Paladius'},
  {cat:'legendary', name:'Neptilius',   lv:60, gx:  50, gy: 500, pal:'Neptilius',   note:'Arrosage Lv4'},
  // ── BOSS ALPHA ──
  {cat:'alpha', name:'Anubis',     lv:47, gx: 122, gy:-462, pal:'Anubis',    note:'Artisanat Lv4 + Minage Lv3'},
  {cat:'alpha', name:'Lyleen',     lv:49, gx:-178, gy: 449, pal:'Lyleen',    note:'Plantation+Pharmacie Lv3'},
  {cat:'alpha', name:'Grizzbolt',  lv:23, gx:-113, gy:-408, pal:'Grizzbolt'},
  {cat:'alpha', name:'Mammorest',  lv:38, gx:-210, gy: -20, pal:'Mammorest'},
  {cat:'alpha', name:'Blazamut',   lv:49, gx:-569, gy:-482, pal:'Blazamut',  note:'Minage+Allumage Lv4'},
  {cat:'alpha', name:'Shadowbeak', lv:50, gx:-120, gy: 450, pal:'Shadowbeak'},
  {cat:'alpha', name:'Orserk',     lv:47, gx:-110, gy: 440, pal:'Orserk',    note:'Génération Lv4'},
  {cat:'alpha', name:'Menasting',  lv:44, gx: 355, gy:-595, pal:'Menasting'},
  {cat:'alpha', name:'Cryolinx',   lv:43, gx: 426, gy: 131, pal:'Cryolinx'},
  {cat:'alpha', name:'Digtoise',   lv:30, gx: 187, gy:-283, pal:'Digtoise'},
  {cat:'alpha', name:'Warsect',    lv:38, gx: 205, gy: -55, pal:'Warsect'},
  {cat:'alpha', name:'Kingpaca',   lv:38, gx:-124, gy:-197, pal:'Kingpaca'},
  {cat:'alpha', name:'Bastigor',   lv:60, gx:-450, gy:-600, pal:'Bastigor'},
  // ── TÉLÉPORTS ──
  {cat:'teleport', name:'Plateau des Bénédictions', gx: -31, gy:-499, note:'Départ'},
  {cat:'teleport', name:'Petit Village',             gx:-110, gy:-482, note:'Marchand permanent'},
  {cat:'teleport', name:'Désert Desséché',           gx: 351, gy:-630, note:'Accès désert endgame'},
  {cat:'teleport', name:'Sommet du Dragon',          gx:-789, gy:-300, note:'Proche Jetragon'},
  {cat:'teleport', name:'Toundra Absolue',           gx: 420, gy: 180, note:'Proche Frostallion'},
  {cat:'teleport', name:'Île de la Désolation',      gx:-120, gy: 440, note:'Shadowbeak + Orserk'},
  {cat:'teleport', name:'Oil Rig Syndicat',          gx:  50, gy: 600, note:'Ressources Lv55'},
  // ── DONJONS ──
  {cat:'dungeon', name:'Collines Ventées',    gx: -80, gy:-390, note:'Niv 1-20'},
  {cat:'dungeon', name:'Plateau Crépuscule',  gx: 180, gy:-280, note:'Niv 20-35'},
  {cat:'dungeon', name:'Dunes Arides',        gx: 360, gy:-600, note:'Niv 35-45'},
  {cat:'dungeon', name:'Île Volcanique',      gx:-580, gy:-450, note:'Niv 40-55'},
  {cat:'dungeon', name:'Île Désolation',      gx:-110, gy: 420, note:'Niv 45-55'},
  {cat:'dungeon', name:'Feybreak',            gx:-460, gy:-580, note:'Niv 55-65 · Slabs Xeno'},
  {cat:'dungeon', name:'Sakurajima',          gx: 740, gy:-400, note:'Niv 50+'},
  // ── PÊCHE ──
  {cat:'fishing', name:'Spot Maître (Île Été)',  gx:-408, gy:-825, note:'Lurker Hunter'},
  {cat:'fishing', name:'Spot Maître (Côte O.)',  gx: 920, gy: 208, note:'2e spot Lurker'},
  {cat:'fishing', name:'Archipel Brise',         gx:-200, gy:-580, note:'Kelpsea, Celaray'},
];

const CAT_CFG = {
  tower:     {color:'#FF6B35', emoji:'🗼', label:'Tours'},
  legendary: {color:'#FFD700', emoji:'💎', label:'Légendaires'},
  alpha:     {color:'#FF3333', emoji:'⭐', label:'Boss Alpha'},
  dungeon:   {color:'#00BFFF', emoji:'⛏️', label:'Donjons'},
  teleport:  {color:'#00E34A', emoji:'⚡', label:'Téléports'},
  fishing:   {color:'#4FC3F7', emoji:'🎣', label:'Pêche'},
};

// Zones géographiques pour le fond de carte (dessinées en SVG)
const MAP_ZONES = [
  // [nom, color, points GX/GY polygone]
  {name:'Îles Centrales',     color:'#2D5A27', points:[[-400,-500],[400,-500],[400,100],[-400,100]]},
  {name:'Désert (Dunes)',     color:'#8B6914', points:[[200,-800],[650,-800],[650,-400],[200,-400]]},
  {name:'Toundra (Glace)',    color:'#B0D4E8', points:[[200,-300],[600,-300],[600, 300],[200, 300]]},
  {name:'Île Volcanique',     color:'#8B2500', points:[[-750,-650],[-400,-650],[-400,-300],[-750,-300]]},
  {name:'Île Désolation',     color:'#3D1F5C', points:[[-300, 300],[  0, 300],[  0, 600],[-300, 600]]},
  {name:'Sakurajima',         color:'#6B3A5C', points:[[ 600,-500],[ 900,-500],[ 900,-250],[ 600,-250]]},
  {name:'Feybreak',           color:'#1A3D6B', points:[[-750,-700],[-300,-700],[-300,-500],[-750,-500]]},
  {name:'Mer',                color:'#0F3050', points:[[-950,-850],[950,-850],[950,700],[-950,700]]},
];

// Étiquettes des zones
const MAP_LABELS = [
  {name:'Îles de Palpagos',   gx:   0, gy:-200, size:14},
  {name:'Désert',             gx: 420, gy:-600, size:12},
  {name:'Toundra',            gx: 400, gy:   0, size:12},
  {name:'Île Volcanique',     gx:-580, gy:-480, size:11},
  {name:'Île Désolation',     gx:-140, gy: 470, size:11},
  {name:'Sakurajima',         gx: 750, gy:-380, size:11},
  {name:'Feybreak',           gx:-540, gy:-580, size:11},
];

let _canvas = null, _ctx = null;
let _scale = 1, _panX = 0, _panY = 0;
let _isDragging = false, _dragStart = {x:0, y:0};
let _activeLayers = new Set(['tower','legendary','alpha','dungeon','teleport','fishing']);
let _tooltip = null;
let _animFrame = null;

// Bornes in-game
const GX_MIN = -950, GX_MAX = 950, GY_MIN = -850, GY_MAX = 700;

function initMaps() {
  const container = document.getElementById('palworld-map');
  if (!container) return;

  // Créer le canvas s’il n'existe pas encore
  if (!document.getElementById('map-canvas')) {
    container.innerHTML = '';
    _canvas = document.createElement('canvas');
    _canvas.id = 'map-canvas';
    _canvas.style.cssText = 'display:block;cursor:grab;touch-action:none';
    container.appendChild(_canvas);

    // Tooltip
    _tooltip = document.createElement('div');
    _tooltip.id = 'map-tooltip';
    _tooltip.style.cssText = `
      position:absolute;background:rgba(10,26,6,.95);color:#fff;
      padding:.5rem .85rem;border-radius:8px;font-size:.78rem;
      pointer-events:none;display:none;z-index:100;
      border:1.5px solid rgba(255,255,255,.2);max-width:240px;line-height:1.5;
      box-shadow:0 4px 16px rgba(0,0,0,.5);`;
    container.style.position = 'relative';
    container.appendChild(_tooltip);

    setupMapEvents();
  } else {
    _canvas = document.getElementById('map-canvas');
    _ctx = _canvas.getContext('2d');
  }

  resizeMap();
  renderMap();

  window.addEventListener('resize', () => { resizeMap(); renderMap(); });
}

function resizeMap() {
  const container = document.getElementById('palworld-map');
  if (!_canvas || !container) return;
  _canvas.width  = container.clientWidth;
  _canvas.height = container.clientHeight;
  _ctx = _canvas.getContext('2d');

  // Centrer la carte au reset
  if (_scale === 1 && _panX === 0 && _panY === 0) {
    _scale = Math.min(_canvas.width, _canvas.height) / (GX_MAX - GX_MIN) * 0.85;
    _panX = _canvas.width  / 2;
    _panY = _canvas.height / 2;
  }
}

// Convertir coordonnées in-game → pixels canvas
function toScreen(gx, gy) {
  const nx = (gx - GX_MIN) / (GX_MAX - GX_MIN) - 0.5;
  const ny = (gy - GY_MIN) / (GY_MAX - GY_MIN) - 0.5;
  return {
    x: _panX + nx * (GX_MAX - GX_MIN) * _scale,
    y: _panY + ny * (GY_MAX - GY_MIN) * _scale,
  };
}

// Convertir pixels canvas → coordonnées in-game
function toGame(px, py) {
  const nx = (px - _panX) / ((GX_MAX - GX_MIN) * _scale) + 0.5;
  const ny = (py - _panY) / ((GY_MAX - GY_MIN) * _scale) + 0.5;
  return {
    gx: Math.round(nx * (GX_MAX - GX_MIN) + GX_MIN),
    gy: Math.round(ny * (GY_MAX - GY_MIN) + GY_MIN),
  };
}

function renderMap() {
  if (!_ctx || !_canvas) return;
  const W = _canvas.width, H = _canvas.height;
  _ctx.clearRect(0, 0, W, H);

  // ── Fond mer ──
  _ctx.fillStyle = '#0F3050';
  _ctx.fillRect(0, 0, W, H);

  // ── Zones géographiques ──
  MAP_ZONES.forEach(zone => {
    if (!zone.points.length) return;
    _ctx.beginPath();
    zone.points.forEach(([gx, gy], i) => {
      const {x, y} = toScreen(gx, gy);
      i === 0 ? _ctx.moveTo(x, y) : _ctx.lineTo(x, y);
    });
    _ctx.closePath();
    _ctx.fillStyle = zone.color;
    _ctx.fill();
    _ctx.strokeStyle = 'rgba(255,255,255,.08)';
    _ctx.lineWidth = 1;
    _ctx.stroke();
  });

  // ── Grille légère ──
  _ctx.strokeStyle = 'rgba(255,255,255,.04)';
  _ctx.lineWidth = 0.5;
  for (let gx = -800; gx <= 800; gx += 200) {
    const {x} = toScreen(gx, 0);
    _ctx.beginPath(); _ctx.moveTo(x, 0); _ctx.lineTo(x, H); _ctx.stroke();
  }
  for (let gy = -800; gy <= 800; gy += 200) {
    const {y} = toScreen(0, gy);
    _ctx.beginPath(); _ctx.moveTo(0, y); _ctx.lineTo(W, y); _ctx.stroke();
  }

  // ── Étiquettes de zones ──
  MAP_LABELS.forEach(lbl => {
    const {x, y} = toScreen(lbl.gx, lbl.gy);
    if (x < -50 || x > W+50 || y < -20 || y > H+20) return;
    _ctx.font = `bold ${Math.max(8, lbl.size * _scale * 0.6)}px 'Georgia',serif`;
    _ctx.fillStyle = 'rgba(255,255,255,.35)';
    _ctx.textAlign = 'center';
    _ctx.fillText(lbl.name.toUpperCase(), x, y);
  });

  // ── Marqueurs ──
  const r = Math.max(10, Math.min(20, 16 * _scale * 0.4));

  MAP_MARKERS.forEach(m => {
    if (!_activeLayers.has(m.cat)) return;
    const cfg = CAT_CFG[m.cat];
    if (!cfg) return;
    const {x, y} = toScreen(m.gx, m.gy);
    if (x < -r || x > W+r || y < -r || y > H+r) return;

    // Cercle de fond
    _ctx.beginPath();
    _ctx.arc(x, y, r, 0, Math.PI*2);
    _ctx.fillStyle = cfg.color;
    _ctx.fill();
    _ctx.strokeStyle = '#fff';
    _ctx.lineWidth = 2;
    _ctx.stroke();

    // Emoji
    _ctx.font = `${r * 1.1}px sans-serif`;
    _ctx.textAlign = 'center';
    _ctx.textBaseline = 'middle';
    _ctx.fillText(cfg.emoji, x, y);

    // Niveau (zoom suffisant)
    if (_scale > 0.5 && m.lv) {
      _ctx.font = `bold ${Math.max(7, r * 0.65)}px monospace`;
      _ctx.fillStyle = '#fff';
      _ctx.textBaseline = 'top';
      _ctx.fillText(`${m.lv}`, x + r * 0.7, y - r);
    }
  });

  _ctx.textBaseline = 'alphabetic';
}

function setupMapEvents() {
  let _lastTouches = null;

  // ── Souris ──
  _canvas.addEventListener('mousedown', e => {
    _isDragging = true;
    _dragStart = {x: e.clientX - _panX, y: e.clientY - _panY};
    _canvas.style.cursor = 'grabbing';
  });

  _canvas.addEventListener('mousemove', e => {
    const rect = _canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (_isDragging) {
      _panX = e.clientX - _dragStart.x;
      _panY = e.clientY - _dragStart.y;
      if (_animFrame) cancelAnimationFrame(_animFrame);
      _animFrame = requestAnimationFrame(renderMap);
      _tooltip.style.display = 'none';
      return;
    }

    // Survol : chercher le marqueur le plus proche
    const r = Math.max(10, Math.min(20, 16 * _scale * 0.4));
    let closest = null, closestDist = r * 1.5;
    MAP_MARKERS.forEach(m => {
      if (!_activeLayers.has(m.cat)) return;
      const {x, y} = toScreen(m.gx, m.gy);
      const dist = Math.hypot(mx - x, my - y);
      if (dist < closestDist) { closestDist = dist; closest = m; }
    });

    if (closest) {
      const cfg = CAT_CFG[closest.cat];
      const palObj = closest.pal ? PALS.find(p => p.name === closest.pal) : null;
      _tooltip.innerHTML = `
        <div style="font-weight:700;font-size:.85rem;margin-bottom:.25rem">${cfg.emoji} ${closest.name}</div>
        ${closest.boss ? `<div style="color:#aaa;font-size:.72rem">👑 ${closest.boss}</div>` : ''}
        ${closest.lv   ? `<div style="color:${cfg.color};font-weight:700;font-size:.72rem">Lv ${closest.lv}</div>` : ''}
        ${closest.note ? `<div style="color:#ccc;font-size:.7rem;margin-top:.2rem">${closest.note}</div>` : ''}
        ${palObj       ? `<div style="color:#00E34A;font-size:.68rem;margin-top:.25rem">🖱️ Clic → fiche ${palObj.name}</div>` : ''}
        <div style="color:#555;font-size:.6rem;margin-top:.25rem">(${closest.gx}, ${closest.gy})</div>`;
      _tooltip.style.display = 'block';
      _tooltip.style.left = (mx + 16) + 'px';
      _tooltip.style.top  = (my - 10) + 'px';
      _canvas.style.cursor = 'pointer';
    } else {
      _tooltip.style.display = 'none';
      _canvas.style.cursor = 'grab';
    }
  });

  _canvas.addEventListener('mouseup',   () => { _isDragging = false; _canvas.style.cursor = 'grab'; });
  _canvas.addEventListener('mouseleave',() => { _isDragging = false; _tooltip.style.display='none'; });

  // ── Clic : ouvrir fiche Pal ──
  _canvas.addEventListener('click', e => {
    if (_isDragging) return;
    const rect = _canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const r = Math.max(10, Math.min(22, 18 * _scale * 0.4));
    MAP_MARKERS.forEach(m => {
      if (!_activeLayers.has(m.cat)) return;
      const {x, y} = toScreen(m.gx, m.gy);
      if (Math.hypot(mx-x, my-y) < r) {
        const palObj = m.pal ? PALS.find(p => p.name === m.pal) : null;
        if (palObj) { navigate('pals'); setTimeout(() => openModal(palObj.id), 200); }
      }
    });
  });

  // ── Molette zoom ──
  _canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = _canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.max(0.12, Math.min(4, _scale * factor));
    // Zoom centré sur le curseur
    _panX = mx + (_panX - mx) * (newScale / _scale);
    _panY = my + (_panY - my) * (newScale / _scale);
    _scale = newScale;
    if (_animFrame) cancelAnimationFrame(_animFrame);
    _animFrame = requestAnimationFrame(renderMap);
  }, {passive: false});

  // ── Touch (mobile) ──
  _canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      _isDragging = true;
      _dragStart = {x: e.touches[0].clientX - _panX, y: e.touches[0].clientY - _panY};
    }
    _lastTouches = e.touches;
  });

  _canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && _isDragging) {
      _panX = e.touches[0].clientX - _dragStart.x;
      _panY = e.touches[0].clientY - _dragStart.y;
    } else if (e.touches.length === 2 && _lastTouches?.length === 2) {
      // Pinch zoom
      const d0 = Math.hypot(_lastTouches[0].clientX-_lastTouches[1].clientX, _lastTouches[0].clientY-_lastTouches[1].clientY);
      const d1 = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
      if (d0 > 0) {
        const factor = d1/d0;
        const cx = (e.touches[0].clientX+e.touches[1].clientX)/2 - _canvas.getBoundingClientRect().left;
        const cy = (e.touches[0].clientY+e.touches[1].clientY)/2 - _canvas.getBoundingClientRect().top;
        const newScale = Math.max(0.12, Math.min(4, _scale * factor));
        _panX = cx + (_panX-cx)*(newScale/_scale);
        _panY = cy + (_panY-cy)*(newScale/_scale);
        _scale = newScale;
      }
    }
    _lastTouches = e.touches;
    if (_animFrame) cancelAnimationFrame(_animFrame);
    _animFrame = requestAnimationFrame(renderMap);
  }, {passive:false});

  _canvas.addEventListener('touchend', () => { _isDragging = false; });
}

function toggleLayer(cat, btn) {
  btn.classList.toggle('active');
  if (_activeLayers.has(cat)) _activeLayers.delete(cat);
  else _activeLayers.add(cat);
  renderMap();
}

function resetMapView() {
  if (!_canvas) return;
  _scale = Math.min(_canvas.width, _canvas.height) / (GX_MAX - GX_MIN) * 0.85;
  _panX = _canvas.width / 2;
  _panY = _canvas.height / 2;
  renderMap();
}

// Stub pour compatibilité
function setMapFilter() {}
function renderMapPOI() {}


/* ══════════════════════════════════════════════════
   CALCULATEUR INVERSÉ — Trouver les parents d’un Pal
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
  const analysis = window._saveAnalysis;
  renderProfileBar(analysis || {capturedNames:new Set(), level:0});
  renderMissions(analysis);
  renderRaidGuide(analysis);
  renderDashboard();
  if (analysis) {
    renderBaseScore(analysis);
    renderProgressTimeline(analysis);
  }
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
    <div id="base-score-panel"></div>
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

      <!-- Couverture de base -->
      <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:1.25rem;box-shadow:var(--sh)">
        <h3 style="font-family:var(--ff-d);font-size:1rem;margin-bottom:.75rem">🏗️ Couverture de ta base</h3>
        <div style="display:flex;flex-direction:column;gap:.4rem">
          ${Object.entries(BASE_ESSENTIALS).map(([work, label]) => {
            const best = capturedPals.filter(p=>(p.work||{})[work]).sort((a,b)=>(b.work[work]||0)-(a.work[work]||0))[0];
            const lv = best ? best.work[work] : 0;
            const color = lv >= 3 ? 'var(--mint-d)' : lv >= 2 ? 'var(--sun)' : lv >= 1 ? 'var(--coral)' : '#888';
            const stars = '★'.repeat(lv) + '☆'.repeat(Math.max(0,4-lv));
            return `<div style="display:flex;align-items:center;gap:.6rem;padding:.35rem .5rem;background:var(--paper-d);border-radius:6px">
              ${workIconImg(work,16)}
              <span style="font-size:.75rem;flex:1">${label}</span>
              ${best ? `${palImg(best.name,22)}` : '<div style="width:22px;height:22px"></div>'}
              <span style="font-family:var(--ff-m);font-size:.65rem;color:${color}">${stars}</span>
              <span style="font-size:.65rem;color:${color};font-weight:700">Lv${lv}</span>
            </div>`;
          }).join('')}
        </div>
        ${baseGaps.length > 0 ? `<div style="margin-top:.75rem;font-size:.72rem;color:var(--coral)">⚠️ ${baseGaps.length} poste${baseGaps.length>1?'s':''} sous Lv3 — <button onclick="navigate('planner')" style="background:none;border:none;color:var(--coral);text-decoration:underline;cursor:pointer;font-size:.72rem">Planificateur →</button></div>` : '<div style="margin-top:.6rem;font-size:.72rem;color:var(--mint-d);font-weight:700">✅ Base bien couverte !</div>'}
      </div>
    </div>

    <!-- Timeline de progression -->
    <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:1.25rem;margin-bottom:1.5rem;box-shadow:var(--sh)">
      <h3 style="font-family:var(--ff-d);font-size:1rem;margin-bottom:.85rem">📈 Ta progression</h3>
      <div id="dash-timeline"></div>
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
    </div>` : `<div style="padding:.75rem;background:rgba(255,100,50,.1);border-radius:var(--r-sm);border-left:3px solid var(--coral);font-size:.82rem;margin-bottom:1.25rem">Aucun combo fixe — ${target} s’obtient uniquement par calcul Power Rank ou en capturant dans la nature.</div>`}

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


/* ══════════════════════════════════════════════════
   SIMULATEUR D'INCUBATION
   Taux officiels Palworld (dataminés) :
   - Père  : 24% par passive héritée
   - Mère  : 20% par passive héritée
   - Aléa  : 21% chance passive aléatoire
   - Aucune: reste → 34% (4 slots potentiels par enfant)
══════════════════════════════════════════════════ */

let _simuTarget = 1;

function initSimulator() {
  runSimulator();
}

function setSimuTarget(n, btn) {
  _simuTarget = n;
  document.querySelectorAll('[id^="simu-want-"]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  runSimulator();
}

function runSimulator() {
  const dadS  = Math.min(4, Math.max(0, parseInt(document.getElementById('simu-dad')?.value || 2)));
  const momS  = Math.min(4, Math.max(0, parseInt(document.getElementById('simu-mom')?.value || 2)));
  const want  = _simuTarget;
  const result = document.getElementById('simu-result');
  if (!result) return;

  // ── Calcul probabiliste ──
  // Chaque slot de l’enfant peut recevoir :
  //   P(passive S du père)  = dadS/4 × 0.24 = dadS × 0.06
  //   P(passive S de la mère) = momS/4 × 0.20 = momS × 0.05
  //   P(passive S aléatoire)  = 0.21 × (S_dans_pool / total_passives) ≈ 0.21 × 0.30
  // → probabilité qu'UN slot soit une passive S
  const pSlotDad  = dadS * 0.24 / 4;
  const pSlotMom  = momS * 0.20 / 4;
  const pSlotRand = 0.21 * 0.10; // ~10% des passives aléatoires sont S
  const pSlot     = Math.min(0.85, pSlotDad + pSlotMom + pSlotRand);

  // Probabilité d'avoir exactement `want` passives S ou plus (distribution binomiale, 4 slots)
  function binomial(n, k) {
    if (k < 0 || k > n) return 0;
    let c = 1;
    for (let i = 0; i < k; i++) c = c * (n-i) / (i+1);
    return c;
  }
  function pAtLeast(slots, target, p) {
    let prob = 0;
    for (let k = target; k <= slots; k++) {
      prob += binomial(slots, k) * Math.pow(p, k) * Math.pow(1-p, slots-k);
    }
    return prob;
  }

  const pSuccess = pAtLeast(4, want, pSlot);

  // Nombre moyen d'œufs pour 1 succès
  const eggsFor1    = pSuccess > 0 ? 1 / pSuccess : 9999;
  // Pour avoir 50%, 80%, 95% de chance d'en avoir au moins un
  const eggsFor50   = pSuccess > 0 ? Math.ceil(Math.log(0.5)  / Math.log(1 - pSuccess)) : 9999;
  const eggsFor80   = pSuccess > 0 ? Math.ceil(Math.log(0.2)  / Math.log(1 - pSuccess)) : 9999;
  const eggsFor95   = pSuccess > 0 ? Math.ceil(Math.log(0.05) / Math.log(1 - pSuccess)) : 9999;

  // Simulation Monte Carlo pour validation (1000 itérations)
  let successes = 0;
  const ITER = 2000;
  for (let i = 0; i < ITER; i++) {
    let sCount = 0;
    for (let slot = 0; slot < 4; slot++) {
      if (Math.random() < pSlot) sCount++;
    }
    if (sCount >= want) successes++;
  }
  const simPct = Math.round(successes / ITER * 100);

  // Difficulté relative
  const difficulty = pSuccess > 0.5 ? {label:'Facile', color:'var(--mint-d)', emoji:'😊'}
    : pSuccess > 0.15 ? {label:'Modéré', color:'var(--sun)', emoji:'😐'}
    : pSuccess > 0.03 ? {label:'Difficile', color:'var(--coral)', emoji:'😓'}
    : {label:'Extrême', color:'#c00', emoji:'😱'};

  const fmt = n => n > 9999 ? '∞' : n < 1 ? '<1' : n.toFixed(n < 10 ? 1 : 0);

  result.innerHTML = `
    <!-- Résumé visuel -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.75rem;margin-bottom:1.5rem">
      ${[
        {label:'Probabilité / œuf', val:(pSuccess*100).toFixed(1)+'%', color:'var(--lagoon)', sub:'par tentative'},
        {label:'Œufs en moyenne',   val:fmt(eggsFor1),                 color:'var(--sun)',    sub:'pour 1 succès'},
        {label:'50% de chance',     val:eggsFor50,                     color:'var(--mint)',   sub:'œufs nécessaires'},
        {label:'95% de chance',     val:eggsFor95,                     color:'var(--coral)',  sub:'œufs nécessaires'},
      ].map(s => `
        <div style="text-align:center;padding:.85rem .5rem;background:var(--paper-d);
          border-radius:var(--r-md);border:1.5px solid ${s.color}44">
          <div style="font-family:var(--ff-d);font-size:1.5rem;font-weight:900;color:${s.color}">${s.val}</div>
          <div style="font-size:.7rem;font-weight:700;margin:.2rem 0">${s.label}</div>
          <div style="font-size:.62rem;color:var(--ink-f)">${s.sub}</div>
        </div>`).join('')}
    </div>

    <!-- Difficulté + validation Monte Carlo -->
    <div style="display:flex;align-items:center;gap:.75rem;padding:.85rem 1rem;
      background:var(--glass);border:1.5px solid ${difficulty.color};border-radius:var(--r-md);margin-bottom:1.25rem">
      <span style="font-size:1.75rem">${difficulty.emoji}</span>
      <div>
        <div style="font-weight:700;color:${difficulty.color}">${difficulty.label}</div>
        <div style="font-size:.72rem;color:var(--ink-f)">
          Simulation Monte Carlo (${ITER} essais) : <strong>${simPct}%</strong> de succès · 
          Probabilité théorique : <strong>${(pSuccess*100).toFixed(1)}%</strong>
        </div>
      </div>
    </div>

    <!-- Barre de progression probabilité -->
    <div style="margin-bottom:1.25rem">
      <div style="display:flex;justify-content:space-between;font-size:.72rem;margin-bottom:.3rem">
        <span>Probabilité de succès par œuf</span>
        <span style="font-family:var(--ff-m);font-weight:700">${(pSuccess*100).toFixed(2)}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${Math.min(100, pSuccess*100*3)}%;background:${difficulty.color}"></div>
      </div>
    </div>

    <!-- Tableau de progression -->
    <div style="margin-bottom:1rem">
      <div style="font-family:var(--ff-d);font-weight:700;font-size:.88rem;margin-bottom:.6rem">
        Nombre d'œufs pour atteindre une probabilité cible
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.4rem">
        ${[[25,eggsFor50],[50,eggsFor50],[75,Math.ceil(Math.log(0.25)/Math.log(1-pSuccess))],[80,eggsFor80],[90,Math.ceil(Math.log(0.10)/Math.log(1-pSuccess))],[95,eggsFor95],[99,Math.ceil(Math.log(0.01)/Math.log(1-pSuccess))]].map(([pct,n]) => `
          <div style="display:flex;justify-content:space-between;padding:.35rem .6rem;
            background:var(--paper-d);border-radius:5px;font-size:.75rem">
            <span style="color:var(--ink-f)">${pct}% de chance</span>
            <span style="font-family:var(--ff-m);font-weight:700">${n > 9999 ? '∞' : n} œufs</span>
          </div>`).join('')}
      </div>
    </div>

    <!-- Conseils -->
    <div style="padding:.85rem 1rem;background:rgba(0,227,74,.08);border-left:3px solid var(--mint-d);border-radius:var(--r-sm);font-size:.78rem;color:var(--ink-s);line-height:1.6">
      💡 <strong>Conseils :</strong>
      Chaque parent avec 4 passives S améliore considérablement les chances.
      ${want === 4 ? 'Pour 4 passives S, utilise des parents ayant déjà 3-4 passives S et répète l’opération plusieurs générations.' : ''}
      ${want <= 2 ? 'Avec 2 parents bien optimisés, les 1-2 premières passives S viennent rapidement.' : ''}
      Gobfin est souvent utilisé pour farmer des passives S rapidement grâce à son spawn abondant.
    </div>`;
}

/* ══════════════════════════════════════════════════
   VUE PAR HABITAT dans le Paldeck
══════════════════════════════════════════════════ */

const HABITATS = {
  'Collines ventées':     ['Lamball','Cattiva','Lifmunk','Foxparks','Fuack','Sparkit','Jolthog','Vixy','Rushoar','Mau','Celaray','Flopie','Gumoss','Grizzbolt','Kingpaca','Direhowl'],
  'Forêts':               ['Tanzee','Lifmunk','Ribbuny','Cinnamoth','Beegarde','Elizabee','Bristla','Robinquill','Verdash','Vaelet','Broncherry','Wumpo'],
  'Plaines centrales':    ['Cattiva','Rooby','Chikipi','Mozzarina','Caprity','Melpaca','Eikthyrdeer','Nitewing','Galeclaw','Gorirat','Mammorest','Lunaris','Woolipop'],
  'Plateau du Crépuscule':['Digtoise','Tombat','Foxcicle','Maraith','Kitsun','Wixen','Dinossom','Surfent','Quivern','Vanwyrm'],
  'Désert (Dunes)':       ['Anubis','Arsox','Leezpunk','Menasting','Dumud','Foxcicle','Reptyro','Loupmoon','Cawgnito'],
  'Toundra (Glace)':      ['Jolthog Cryst','Mau Cryst','Reindrix','Swee','Sweepa','Cryolinx','Hangyu Cryst','Sibelyx','Whalaska','Frostallion'],
  'Île Volcanique':       ['Jetragon','Blazamut','Blazehowl','Arsox','Leezpunk Ignis','Ragnahawk','Gobfin Ignis','Kelpsea Ignis','Jormuntide Ignis'],
  'Île de la Désolation': ['Shadowbeak','Helzephyr','Orserk','Felbat','Maraith','Menasting','Astegon','Cawgnito'],
  'Sanctuaires':          ['Grizzbolt','Anubis','Shadowbeak','Lyleen','Blazamut','Jormuntide','Suzaku','Relaxaurus'],
  'Sakurajima':           ['Selyne','Bushi','Blazehowl Noct','Lyleen Noct','Katress','Kitsun','Pyrin'],
  'Feybreak':             ['Bastigor','Xenolord','Xenogard','Silvegis','Gildane','Celesdir','Braloha','Shroomer','Finsider','Croajiro','Lullu'],
  'Zones aquatiques':     ['Kelpsea','Fuack','Teafant','Pengullet','Surfent','Azurobe','Jormuntide','Whalaska','Neptilius'],
};

let _habitatFilter = null;

function initHabitatFilters() {
  const container = document.getElementById('habitat-filter-chips');
  if (!container || container.dataset.built) return;
  container.dataset.built = '1';

  const allBtn = document.createElement('button');
  allBtn.className = 'work-filter-btn active';
  allBtn.textContent = '🌍 Tous';
  allBtn.onclick = () => { _habitatFilter = null; document.querySelectorAll('#habitat-filter-chips .work-filter-btn').forEach(b=>b.classList.remove('active')); allBtn.classList.add('active'); applyPalFilters(); };
  container.appendChild(allBtn);

  Object.keys(HABITATS).forEach(hab => {
    const btn = document.createElement('button');
    btn.className = 'work-filter-btn';
    btn.textContent = hab;
    btn.onclick = () => {
      _habitatFilter = hab;
      document.querySelectorAll('#habitat-filter-chips .work-filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      applyPalFilters();
    };
    container.appendChild(btn);
  });
}


/* ══════════════════════════════════════════════════
   ANALYSE AVANCÉE DE SAVE — Passives, Stats, Optimiseur
══════════════════════════════════════════════════ */

/* ── Table info passives (miroir de save-parser.js pour l'UI) ── */
const PASSIVE_UI = {
  'Legend':         {tier:'S', fr:'Légende',           color:'#FFD700'},
  'Musclehead':     {tier:'S', fr:'Seigneur Âmes',      color:'#FFD700'},
  'Brave':          {tier:'S', fr:'Courageux',          color:'#FFD700'},
  'Ferocious':      {tier:'S', fr:'Féroce',             color:'#FFD700'},
  'Hooligan':       {tier:'S', fr:'Voyou',              color:'#FFD700'},
  'CrafterMinimum': {tier:'S', fr:'Artisan Sérieux',    color:'#FFD700'},
  'WorkSlave':      {tier:'S', fr:'Âme de Travailleur', color:'#FFD700'},
  'Serious':        {tier:'S', fr:'Consciencieux',      color:'#FFD700'},
  'Lucky':          {tier:'A', fr:'Veinard',            color:'#00E34A'},
  'Masochist':      {tier:'A', fr:'Masochiste',         color:'#00E34A'},
  'Coward':         {tier:'A', fr:'Lâche',              color:'#00E34A'},
  'Daredevil':      {tier:'A', fr:'Téméraire',          color:'#00E34A'},
  'Swift':          {tier:'B', fr:'Agile',              color:'#4FC3F7'},
  'Durable':        {tier:'B', fr:'Robuste',            color:'#4FC3F7'},
  'Conceited':      {tier:'B', fr:'Fier',               color:'#4FC3F7'},
  'Lazy':           {tier:'C', fr:'Paresseux',          color:'#888'},
  'Pacifist':       {tier:'C', fr:'Pacifiste',          color:'#888'},
  'Pessimistic':    {tier:'C', fr:'Pessimiste',         color:'#888'},
  'Glutton':        {tier:'C', fr:'Glouton',            color:'#888'},
};

function getPassiveInfo(name) {
  return PASSIVE_UI[name] || {tier:'?', fr:name, color:'#555'};
}

function renderPassiveBadge(name) {
  const info = getPassiveInfo(name);
  const tierColors = {S:'#FFD700',A:'#00E34A',B:'#4FC3F7',C:'#888','?':'#555'};
  const color = tierColors[info.tier] || '#555';
  return `<span style="
    display:inline-flex;align-items:center;gap:.2rem;
    font-family:var(--ff-m);font-size:.62rem;font-weight:700;
    padding:.15rem .45rem;border-radius:4px;
    background:${color}22;border:1.5px solid ${color};color:${color};
    white-space:nowrap" title="${name}">
    ${info.tier} · ${info.fr}
  </span>`;
}

/* ── Page Analyse de Save (onglets dans Ma Save) ── */
function renderSaveResults(capturedIds, filename, analysis) {
  const total    = PALS.length;
  const found    = capturedIds.size;
  const pct      = Math.round((found / total) * 100);
  const missing  = PALS.filter(p => !capturedIds.has(p.id));
  const captured = PALS.filter(p =>  capturedIds.has(p.id));

  const methodBadge = analysis.method === 'gvas'
    ? '<span style="background:var(--mint);color:#fff;font-size:.65rem;padding:.15rem .5rem;border-radius:4px;border:1.5px solid var(--ink);font-weight:800;font-family:var(--ff-m);margin-left:.5rem">GVAS ✓</span>'
    : '<span style="background:var(--sun);color:var(--ink);font-size:.65rem;padding:.15rem .5rem;border-radius:4px;border:1.5px solid var(--ink);font-weight:800;font-family:var(--ff-m);margin-left:.5rem">SCAN</span>';

  const playerInfo = analysis.playerName ? `· Joueur : <strong>${escHtml(analysis.playerName)}</strong>` : '';
  const levelInfo  = analysis.level > 0  ? `· Niveau <strong>${analysis.level}</strong>` : '';

  // Stats des palObjects (si GVAS complet)
  const palObjs = analysis.palObjects || [];
  const hasRich = palObjs.length > 0;

  document.getElementById('save-status').innerHTML = `
    <div class="save-success">
      ✅ <strong>${escHtml(filename)}</strong>${methodBadge}
      ${playerInfo} ${levelInfo}<br>
      <strong>${found}</strong> Pal${found>1?'s':''} détecté${found>1?'s':''} sur ${total}
      ${hasRich ? `· <strong>${palObjs.length}</strong> objets Pal complets extraits` : ''}
    </div>`;

  // Onglets enrichis si données GVAS riches disponibles
  const richTabs = hasRich ? `
    <button class="tab" onclick="showSaveTab('passives',this)">🧬 Passives</button>
    <button class="tab" onclick="showSaveTab('gems',this)">💎 Perles rares</button>
    <button class="tab" onclick="showSaveTab('base-opt',this)">🏗️ Optimiseur base</button>
    <button class="tab" onclick="showSaveTab('breed-rec',this)">💞 Breeding recommandé</button>
    <button class="tab" onclick="showSaveTab('dupes',this)">♻️ Doublons</button>
  ` : '';

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

    <div class="tabs" style="margin-bottom:1.5rem;flex-wrap:wrap">
      <button class="tab active" onclick="showSaveTab('missing',this)">❌ À capturer (${missing.length})</button>
      <button class="tab"        onclick="showSaveTab('captured',this)">✅ Capturés (${found})</button>
      ${richTabs}
    </div>

    <div id="save-tab-missing">${renderPalGrid(missing,'coral','Non capturé')}</div>
    <div id="save-tab-captured"   style="display:none">${renderPalGrid(captured,'mint','✓ Capturé')}</div>
    ${hasRich ? `
    <div id="save-tab-passives"  style="display:none">${renderPassivesTab(palObjs)}</div>
    <div id="save-tab-gems"      style="display:none">${renderGemsTab(palObjs)}</div>
    <div id="save-tab-base-opt"  style="display:none">${renderBaseOptTab(palObjs)}</div>
    <div id="save-tab-breed-rec" style="display:none">${renderBreedRecTab(palObjs)}</div>
    <div id="save-tab-dupes"     style="display:none">${renderDupesTab(palObjs)}</div>
    ` : ''}`;

  requestAnimationFrame(() => {
    document.getElementById('save-fill').style.width = pct + '%';
  });
  onSaveAnalyzed(analysis);
}

function renderPalGrid(pals, colorVar, label) {
  if (!pals.length) return `<div class="empty-state"><div style="font-size:3rem;margin-bottom:.75rem">🎉</div><div class="empty-title">Aucun Pal dans cette catégorie</div></div>`;
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:.75rem">
    ${pals.map(p => `
      <div class="pal-mini" onclick="openModal('${p.id}')" ${colorVar==='coral'?'style="opacity:.65;border-color:var(--coral)"':''}>
        <div class="pm-hdr">
          <span class="pm-id mono">№ ${p.id}</span>
          <div class="pm-els">${p.el.map(e=>`<span class="pm-el" style="background:${EL[e].color}">${EL[e].icon}</span>`).join('')}</div>
        </div>
        ${palImg(p.name,44)}
        <div class="pm-name">${p.name}</div>
        <div style="margin-top:.3rem;font-size:.65rem;padding:.15rem .4rem;background:rgba(${colorVar==='coral'?'255,61,26':'0,227,74'},.12);border-radius:4px;color:var(--${colorVar});font-weight:700;display:inline-block">${label}</div>
      </div>`).join('')}
  </div>`;
}

/* ── Onglet PASSIVES — vue de toutes les passives ── */
function renderPassivesTab(palObjs) {
  // Regrouper par Pal
  const byPal = {};
  palObjs.forEach(obj => {
    if (!obj.charId || !obj.passives?.length) return;
    if (!byPal[obj.charId]) byPal[obj.charId] = [];
    byPal[obj.charId].push(obj);
  });

  // Trier : Pals avec passives S en premier
  const sorted = Object.entries(byPal).sort((a, b) => {
    const sA = a[1].reduce((n,o)=>n+o.passives.filter(p=>getPassiveInfo(p).tier==='S').length,0);
    const sB = b[1].reduce((n,o)=>n+o.passives.filter(p=>getPassiveInfo(p).tier==='S').length,0);
    return sB - sA;
  });

  if (!sorted.length) return '<p style="color:var(--ink-f)">Aucune passive détectée — essaie avec un fichier Level.sav (GVAS complet).</p>';

  return `
    <div style="margin-bottom:1rem;font-size:.8rem;color:var(--ink-f)">
      Passives de <strong>${sorted.length}</strong> espèces de Pals dans ta boîte.
    </div>
    <div style="display:flex;flex-direction:column;gap:.6rem">
    ${sorted.map(([name, objs]) => {
      const palObj = PALS.find(p => p.name === name);
      // Regrouper par set de passives identique
      const sets = {};
      objs.forEach(o => {
        const key = [...(o.passives||[])].sort().join('|');
        sets[key] = (sets[key]||0) + 1;
      });

      return `
      <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:.85rem 1rem;box-shadow:var(--sh)">
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.6rem">
          ${palImg(name, 40)}
          <div>
            <strong style="font-family:var(--ff-d)">${name}</strong>
            <span style="font-size:.68rem;color:var(--ink-f);margin-left:.4rem">${objs.length} exemplaire${objs.length>1?'s':''}</span>
          </div>
          ${palObj ? `<button onclick="openModal('${palObj.id}')" class="btn btn-ghost btn-sm" style="margin-left:auto;font-size:.65rem">Fiche</button>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:.35rem">
          ${Object.entries(sets).map(([key, count]) => {
            const passives = key ? key.split('|') : [];
            const sCount = passives.filter(p => getPassiveInfo(p).tier === 'S').length;
            return `<div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;padding:.3rem .5rem;background:var(--paper-d);border-radius:6px;border-left:3px solid ${sCount>=3?'var(--sun)':sCount>=2?'var(--mint-d)':'var(--line)'}">
              ${count > 1 ? `<span style="font-family:var(--ff-m);font-size:.62rem;color:var(--ink-f)">×${count}</span>` : ''}
              ${passives.length ? passives.map(renderPassiveBadge).join('') : '<span style="font-size:.7rem;color:var(--ink-f)">Aucune passive</span>'}
              ${sCount > 0 ? `<span style="margin-left:auto;font-family:var(--ff-m);font-size:.6rem;color:var(--sun);font-weight:800">${sCount}S</span>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
    </div>`;
}

/* ── Onglet PERLES RARES — Pals avec 2+ passives S ── */
function renderGemsTab(palObjs) {
  const gems = palObjs.filter(o => {
    const sCount = (o.passives||[]).filter(p => getPassiveInfo(p).tier === 'S').length;
    return sCount >= 2;
  }).sort((a,b) => {
    const sA = (a.passives||[]).filter(p=>getPassiveInfo(p).tier==='S').length;
    const sB = (b.passives||[]).filter(p=>getPassiveInfo(p).tier==='S').length;
    return sB - sA || b.rank - a.rank;
  });

  if (!gems.length) return `
    <div style="text-align:center;padding:2rem;color:var(--ink-f)">
      <div style="font-size:3rem;margin-bottom:.75rem">💎</div>
      <div style="font-weight:700">Aucune perle rare détectée</div>
      <p style="font-size:.82rem">Les perles rares sont des Pals avec 2+ passives S.<br>Continue à farmer et à breeder !</p>
    </div>`;

  return `
    <div style="margin-bottom:1rem;font-size:.8rem;color:var(--ink-f)">
      🏆 <strong>${gems.length}</strong> Pal${gems.length>1?'s':''} avec 2+ passives S dans ta boîte
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:.75rem">
    ${gems.map(obj => {
      const palObj = PALS.find(p => p.name === obj.charId);
      const sCount = (obj.passives||[]).filter(p=>getPassiveInfo(p).tier==='S').length;
      const stars = '★'.repeat(obj.rank||0)+'☆'.repeat(4-(obj.rank||0));
      const borderColor = sCount>=4?'var(--sun)':sCount>=3?'var(--mint-d)':'var(--lagoon)';
      return `
      <div style="background:var(--glass);border:2px solid ${borderColor};border-radius:var(--r-md);
        padding:1rem;box-shadow:var(--sh);position:relative" onclick="${palObj?`openModal('${palObj.id}')`:''}'" style="cursor:${palObj?'pointer':'default'}">
        ${sCount===4?'<div style="position:absolute;top:.5rem;right:.5rem;font-size:.65rem;background:var(--sun);color:#000;padding:.15rem .45rem;border-radius:4px;font-weight:800;font-family:var(--ff-m)">PARFAIT</div>':''}
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.65rem">
          ${palImg(obj.charId, 48)}
          <div>
            <div style="font-family:var(--ff-d);font-weight:700">${obj.charId}</div>
            <div style="font-size:.65rem;color:var(--sun)">${stars}</div>
            <div style="font-size:.62rem;color:var(--ink-f)">
              ${obj.gender==='F'?'♀':'♂'} · Lv ${obj.level||'?'}
              ${obj.isAlpha?'· <span style="color:var(--sun)">★ Alpha</span>':''}
            </div>
          </div>
          <div style="margin-left:auto;text-align:center">
            <div style="font-family:var(--ff-d);font-size:1.8rem;font-weight:900;color:${borderColor}">${sCount}</div>
            <div style="font-size:.6rem;color:var(--ink-f)">passives S</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.3rem">
          ${(obj.passives||[]).map(renderPassiveBadge).join('')}
        </div>
        ${obj.rankAtk||obj.rankDef||obj.rankHp ? `
        <div style="margin-top:.5rem;display:flex;gap:.3rem;flex-wrap:wrap">
          ${obj.rankAtk?`<span style="font-size:.6rem;color:var(--coral);font-weight:700">ATK+${obj.rankAtk*10}%</span>`:''}
          ${obj.rankDef?`<span style="font-size:.6rem;color:var(--lagoon);font-weight:700">DEF+${obj.rankDef*10}%</span>`:''}
          ${obj.rankHp?`<span style="font-size:.6rem;color:var(--mint-d);font-weight:700">HP+${obj.rankHp*10}%</span>`:''}
        </div>` : ''}
      </div>`;
    }).join('')}
    </div>`;
}

/* ── Onglet OPTIMISEUR BASE ── */
function renderBaseOptTab(palObjs) {
  const JOBS_OPT = [
    {id:'kindling', label:'🔥 Allumage'},    {id:'watering', label:'💧 Arrosage'},
    {id:'planting', label:'🌱 Plantation'},  {id:'electric', label:'⚡ Énergie'},
    {id:'handiwork',label:'🔨 Artisanat'},   {id:'gathering',label:'🌿 Collecte'},
    {id:'lumbering',label:'🪓 Abattage'},    {id:'mining',   label:'⛏️ Minage'},
    {id:'medicine', label:'💊 Pharmacie'},   {id:'cooling',  label:'❄️ Réfrigération'},
    {id:'transporting',label:'🚚 Transport'},{id:'farming',  label:'🐄 Élevage'},
  ];

  return `
    <div style="margin-bottom:1rem;font-size:.8rem;color:var(--ink-f)">
      Meilleur Pal pour chaque poste, basé sur tes <strong>${palObjs.length}</strong> Pals capturés et leurs passives.
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:.75rem">
    ${JOBS_OPT.map(job => {
      // Trouver les Pals qui ont ce type de travail parmi les capturés
      const candidates = palObjs.filter(obj => {
        const palData = PALS.find(p => p.name === obj.charId);
        return palData && (palData.work||{})[job.id] > 0;
      }).map(obj => {
        const palData = PALS.find(p => p.name === obj.charId);
        const workLv = palData.work[job.id] || 0;
        const sCount = (obj.passives||[]).filter(p => getPassiveInfo(p).tier === 'S').length;
        // Score = workLv × 10 + sPassives × 5 + rank × 2 + isAlpha × 3
        const score = workLv * 10 + sCount * 5 + (obj.rank||0) * 2 + (obj.isAlpha?3:0);
        return { ...obj, workLv, sCount, score, palData };
      }).sort((a,b) => b.score - a.score).slice(0, 3);

      const best = candidates[0];

      return `
      <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);
        padding:.85rem 1rem;box-shadow:var(--sh);border-left:3px solid ${best?'var(--mint-d)':'var(--coral)'}">
        <div style="font-size:.78rem;font-weight:700;margin-bottom:.6rem">${job.label}</div>
        ${!best ? `<p style="font-size:.75rem;color:var(--coral)">Aucun Pal capturé pour ce poste</p>` : `
          <div style="display:flex;flex-direction:column;gap:.35rem">
            ${candidates.map((c, idx) => `
            <div style="display:flex;align-items:center;gap:.5rem;padding:.3rem .5rem;
              background:${idx===0?'rgba(0,227,74,.08)':'var(--paper-d)'};border-radius:6px">
              ${palImg(c.charId, 32)}
              <div style="flex:1;min-width:0">
                <div style="font-size:.75rem;font-weight:700">${c.charId}</div>
                <div style="font-size:.62rem;color:var(--ink-f)">
                  Lv${c.workLv} · ${c.sCount}S · ★${c.rank||0}${c.isAlpha?' · ⭐Alpha':''}
                </div>
              </div>
              ${idx===0?'<span style="font-size:.6rem;background:var(--mint-d);color:#fff;padding:.1rem .35rem;border-radius:3px;font-weight:800">TOP</span>':''}
            </div>`).join('')}
          </div>`}
      </div>`;
    }).join('')}
    </div>`;
}

/* ── Onglet BREEDING RECOMMANDÉ ── */
function renderBreedRecTab(palObjs) {
  // Trouver les meilleurs couples pour transmettre des passives S
  const withS = palObjs.filter(o => (o.passives||[]).some(p=>getPassiveInfo(p).tier==='S'));

  // Paires de Pals qui peuvent se reproduire ET ont de bonnes passives
  const pairs = [];
  const seen = new Set();

  withS.forEach(dad => {
    withS.forEach(mom => {
      if (dad === mom || dad.charId === mom.charId) return;
      const key = [dad.charId, mom.charId].sort().join('×');
      if (seen.has(key)) return;
      seen.add(key);

      const dadS = (dad.passives||[]).filter(p=>getPassiveInfo(p).tier==='S');
      const momS = (mom.passives||[]).filter(p=>getPassiveInfo(p).tier==='S');
      const combined = new Set([...dadS, ...momS]);

      // Score : passives S combinées uniques
      if (combined.size >= 2) {
        pairs.push({ dad, mom, combined, score: combined.size + dadS.length * 0.3 + momS.length * 0.3 });
      }
    });
  });

  pairs.sort((a,b) => b.score - a.score);
  const top = pairs.slice(0, 12);

  if (!top.length) return `
    <div style="text-align:center;padding:2rem;color:var(--ink-f)">
      <div style="font-size:3rem;margin-bottom:.75rem">💞</div>
      <div style="font-weight:700">Pas assez de Pals avec passives S</div>
      <p style="font-size:.82rem">Il faut au moins 2 Pals avec des passives S pour des recommandations de breeding.</p>
    </div>`;

  return `
    <div style="margin-bottom:1rem;font-size:.8rem;color:var(--ink-f)">
      💞 <strong>${top.length}</strong> meilleurs couples identifiés pour maximiser les passives S sur l'enfant.
    </div>
    <div style="display:flex;flex-direction:column;gap:.65rem">
    ${top.map(pair => {
      const childName = BREEDING_COMBOS.find(c=>
        (c.p1===pair.dad.charId&&c.p2===pair.mom.charId)||(c.p1===pair.mom.charId&&c.p2===pair.dad.charId)
      )?.child || null;
      const childPal = childName ? PALS.find(p=>p.name===childName) : null;

      return `
      <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:.85rem 1rem;box-shadow:var(--sh)">
        <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.5rem">
          <div style="display:flex;align-items:center;gap:.3rem">
            ${palImg(pair.dad.charId,36)}
            <div>
              <div style="font-size:.75rem;font-weight:700">${pair.dad.charId} ♂</div>
              <div style="display:flex;gap:.2rem;flex-wrap:wrap">${(pair.dad.passives||[]).filter(p=>getPassiveInfo(p).tier==='S').map(renderPassiveBadge).join('')}</div>
            </div>
          </div>
          <span style="color:var(--ink-f);font-size:1.2rem">×</span>
          <div style="display:flex;align-items:center;gap:.3rem">
            ${palImg(pair.mom.charId,36)}
            <div>
              <div style="font-size:.75rem;font-weight:700">${pair.mom.charId} ♀</div>
              <div style="display:flex;gap:.2rem;flex-wrap:wrap">${(pair.mom.passives||[]).filter(p=>getPassiveInfo(p).tier==='S').map(renderPassiveBadge).join('')}</div>
            </div>
          </div>
          ${childPal ? `
          <span style="color:var(--ink-f)">→</span>
          <div style="display:flex;align-items:center;gap:.3rem">
            ${palImg(childName,36)}
            <span style="font-size:.72rem;font-weight:700;color:var(--mint-d)">${childName}</span>
          </div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap">
          <span style="font-size:.68rem;color:var(--ink-f)">Passives S transmissibles :</span>
          ${[...pair.combined].map(renderPassiveBadge).join('')}
        </div>
      </div>`;
    }).join('')}
    </div>`;
}

/* ── Onglet DOUBLONS ── */
function renderDupesTab(palObjs) {
  const byName = {};
  palObjs.forEach(obj => {
    if (!obj.charId) return;
    if (!byName[obj.charId]) byName[obj.charId] = [];
    byName[obj.charId].push(obj);
  });

  const dupes = Object.entries(byName).filter(([,objs]) => objs.length >= 2)
    .sort((a,b) => b[1].length - a[1].length);

  if (!dupes.length) return '<p style="color:var(--ink-f);padding:1rem">Aucun doublon détecté.</p>';

  return `
    <div style="margin-bottom:1rem;font-size:.8rem;color:var(--ink-f)">
      ♻️ <strong>${dupes.length}</strong> espèces en doublon. Fusionne les moins bons au <strong>Condenseur d’essence</strong> pour monter les étoiles des meilleurs.
    </div>
    <div style="display:flex;flex-direction:column;gap:.65rem">
    ${dupes.map(([name, objs]) => {
      const palObj = PALS.find(p=>p.name===name);
      // Trier : meilleur en premier (passives S + rang)
      const sorted = [...objs].sort((a,b) => {
        const sA = (a.passives||[]).filter(p=>getPassiveInfo(p).tier==='S').length;
        const sB = (b.passives||[]).filter(p=>getPassiveInfo(p).tier==='S').length;
        return sB-sA || b.rank-a.rank;
      });
      const best = sorted[0];
      const fodder = sorted.slice(1);
      const bestSCount = (best.passives||[]).filter(p=>getPassiveInfo(p).tier==='S').length;

      return `
      <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:.85rem 1rem;box-shadow:var(--sh)">
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.65rem">
          ${palImg(name,44)}
          <div>
            <span style="font-family:var(--ff-d);font-weight:700">${name}</span>
            <span style="font-size:.68rem;color:var(--ink-f);margin-left:.4rem">${objs.length} exemplaires</span>
          </div>
          ${palObj?`<button onclick="openModal('${palObj.id}')" class="btn btn-ghost btn-sm" style="margin-left:auto;font-size:.65rem">Fiche</button>`:''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
          <div>
            <div style="font-size:.65rem;font-weight:800;color:var(--mint-d);margin-bottom:.3rem">✅ GARDER</div>
            <div style="padding:.4rem .6rem;background:rgba(0,227,74,.08);border:1px solid var(--mint-d);border-radius:6px">
              <div style="font-size:.68rem">★${best.rank||0} · ${best.gender==='F'?'♀':'♂'} · Lv${best.level||'?'}${best.isAlpha?' · ⭐':''}</div>
              <div style="display:flex;flex-wrap:wrap;gap:.2rem;margin-top:.2rem">
                ${(best.passives||[]).map(renderPassiveBadge).join('')||'<span style="font-size:.65rem;color:var(--ink-f)">Aucune passive</span>'}
              </div>
            </div>
          </div>
          <div>
            <div style="font-size:.65rem;font-weight:800;color:var(--coral);margin-bottom:.3rem">♻️ FUSIONNER (${fodder.length})</div>
            <div style="display:flex;flex-direction:column;gap:.2rem">
              ${fodder.slice(0,3).map(obj=>`
              <div style="padding:.3rem .5rem;background:var(--paper-d);border-radius:5px;font-size:.65rem">
                ★${obj.rank||0} · ${(obj.passives||[]).filter(p=>getPassiveInfo(p).tier==='S').length}S passives
              </div>`).join('')}
              ${fodder.length>3?`<div style="font-size:.62rem;color:var(--ink-f)">+${fodder.length-3} autres</div>`:''}
            </div>
          </div>
        </div>
        <div style="margin-top:.5rem;font-size:.7rem;color:var(--sun)">
          💡 Fusionner ${fodder.length} exemplaire${fodder.length>1?'s':''} → +${Math.min(4,fodder.length)} étoile${fodder.length>1?'s':''} au condenseur
        </div>
      </div>`;
    }).join('')}
    </div>`;
}


/* ── Timeline de progression du joueur ── */
function renderProgressTimeline(analysis) {
  const tl = document.getElementById('dash-timeline');
  if (!tl) return;

  const lv  = analysis.level || 0;
  const cap = analysis.capturedNames?.size || 0;

  const phase = lv < 20 ? 'early' : lv < 40 ? 'mid' : lv < 55 ? 'late' : 'endgame';

  const phases = [
    {id:'early',   label:'Niv 1-20',  emoji:'🌱', done: lv >= 20},
    {id:'mid',     label:'Niv 20-40', emoji:'⚔️', done: lv >= 40},
    {id:'late',    label:'Niv 40-55', emoji:'🔥', done: lv >= 55},
    {id:'endgame', label:'Niv 55+',   emoji:'👑', done: lv >= 60},
  ];

  const PRIOS = {
    early:   ['Capture 10 Pals différents','Construis ta première Fonderie','Débloquer Nitewing (Lv15)','Battre la Tour de Rayne'],
    mid:     ['Construire le Ranch + Gâteau d\u2019élevage','Obtenir Anubis par breeding','Battre les 5 Tours','Débloquer Giga Sphère'],
    late:    ['Capturer les 4 Légendaires','Lancer les raids Bellanoir','Monter 4 passives S sur tes meilleurs Pals','Farm Oil Rig Lv55'],
    endgame: ['Raid Xenolord (Feybreak)','Capturer Neptilius (Arrosage Lv4)','PvP Home Sweet Home','Compléter le Paldeck 100%'],
  };

  const current = phases.find(p => !p.done) || phases[phases.length-1];
  const prios = PRIOS[phase] || PRIOS.endgame;

  const phaseHtml = phases.map((p, i) => {
    const color = p.done ? 'var(--mint-d)' : (p.id === phase ? 'var(--sun)' : 'var(--paper-d)');
    const txt   = p.done ? '#fff' : (p.id === phase ? '#000' : 'var(--ink-f)');
    return `<div style="display:flex;align-items:center;gap:.3rem;padding:.3rem .7rem;border-radius:20px;
      font-size:.72rem;font-weight:700;background:${color};color:${txt}">
      ${p.emoji} ${p.label} ${p.done ? '✓' : ''}
    </div>${i < phases.length-1 ? '<span style="color:var(--line);font-size:.8rem">→</span>' : ''}`;
  }).join('');

  const prioHtml = prios.map((p, i) =>
    `<div style="display:flex;align-items:flex-start;gap:.5rem;font-size:.78rem;margin-bottom:.3rem">
      <span style="font-family:var(--ff-m);font-weight:800;color:var(--sun);flex-shrink:0">${i+1}.</span>${p}
    </div>`).join('');

  tl.innerHTML = `
    <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;margin-bottom:.85rem">
      ${phaseHtml}
    </div>
    <div style="font-weight:700;font-size:.82rem;margin-bottom:.5rem">
      🎯 Priorités — Phase ${current.emoji} ${current.label}
    </div>
    ${prioHtml}`;
}

/* ══════════════════════════════════════════════════════════════
   JOURNAL DE BORD — Système complet de personnalisation
   localStorage keys :
     dresseur_profile   → profil joueur
     dresseur_sessions  → historique des sessions
     dresseur_objectives→ objectifs personnalisés
══════════════════════════════════════════════════════════════ */

/* ── Titres automatiques selon la progression ── */
const PLAYER_TITLES = [
  {minLv:0,  minCap:0,   title:'Nouveau Dresseur',     emoji:'🥚'},
  {minLv:10, minCap:10,  title:'Apprenti Dresseur',    emoji:'🌱'},
  {minLv:20, minCap:25,  title:'Dresseur Confirmé',    emoji:'⚔️'},
  {minLv:30, minCap:50,  title:'Chasseur de Pals',     emoji:'🎯'},
  {minLv:40, minCap:80,  title:'Expert Dresseur',      emoji:'🔥'},
  {minLv:50, minCap:100, title:'Maître Dresseur',      emoji:'👑'},
  {minLv:55, minCap:130, title:'Légende de Palpagos',  emoji:'💎'},
  {minLv:60, minCap:160, title:'Dresseur Légendaire',  emoji:'⭐'},
];

function getPlayerTitle(level, captured) {
  let best = PLAYER_TITLES[0];
  for (const t of PLAYER_TITLES) {
    if (level >= t.minLv && captured >= t.minCap) best = t;
  }
  return best;
}

/* ── Gestion du profil ── */
function loadProfile() {
  try { return JSON.parse(localStorage.getItem('dresseur_profile') || 'null'); }
  catch { return null; }
}
function saveProfile(data) {
  localStorage.setItem('dresseur_profile', JSON.stringify(data));
}

function initProfile(analysis) {
  let profile = loadProfile();
  const now = new Date().toISOString();
  if (!profile) {
    profile = {
      name: analysis.playerName || 'Dresseur',
      createdAt: now,
      lastSeen: now,
      totalImports: 1,
      bestLevel: analysis.level || 0,
      bestCaptured: analysis.capturedNames?.size || 0,
    };
  } else {
    profile.lastSeen = now;
    profile.totalImports = (profile.totalImports || 0) + 1;
    if ((analysis.level || 0) > (profile.bestLevel || 0)) profile.bestLevel = analysis.level;
    if ((analysis.capturedNames?.size || 0) > (profile.bestCaptured || 0)) profile.bestCaptured = analysis.capturedNames.size;
    if (analysis.playerName && !profile.name) profile.name = analysis.playerName;
  }
  saveProfile(profile);
  return profile;
}

/* ── Rendu de la barre de profil ── */
function renderProfileBar(analysis) {
  const bar = document.getElementById('player-profile-bar');
  if (!bar) return;
  const profile = loadProfile() || { name: analysis?.playerName || 'Dresseur', totalImports: 0 };
  const lv   = analysis?.level || 0;
  const cap  = analysis?.capturedNames?.size || 0;
  const t    = getPlayerTitle(lv, cap);
  const days = profile.createdAt
    ? Math.floor((Date.now() - new Date(profile.createdAt)) / 86400000)
    : 0;
  const lastSeen = profile.lastSeen
    ? new Date(profile.lastSeen).toLocaleDateString('fr-FR', {day:'numeric', month:'long'})
    : 'Jamais';

  bar.innerHTML = `
    <div style="background:linear-gradient(135deg,var(--paper-d),var(--glass));border:var(--bdr);
      border-radius:var(--r-lg);padding:1.25rem 1.5rem;box-shadow:var(--sh);
      display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap">

      <!-- Avatar / titre -->
      <div style="display:flex;align-items:center;gap:.85rem;flex-shrink:0">
        <div style="width:56px;height:56px;border-radius:50%;
          background:linear-gradient(135deg,var(--sun),var(--coral));
          display:flex;align-items:center;justify-content:center;
          font-size:1.8rem;border:3px solid var(--ink);box-shadow:3px 3px 0 var(--ink)">
          ${t.emoji}
        </div>
        <div>
          <div style="font-family:var(--ff-d);font-size:1.15rem;font-weight:700">
            ${escHtml(profile.name || 'Dresseur')}
            <button onclick="editProfileName()" style="background:none;border:none;cursor:pointer;font-size:.7rem;color:var(--ink-f);margin-left:.3rem" title="Modifier le nom">✏️</button>
          </div>
          <div style="font-family:var(--ff-m);font-size:.72rem;color:var(--sun);font-weight:700">${t.title}</div>
          <div style="font-size:.65rem;color:var(--ink-f);margin-top:.1rem">
            ${days > 0 ? `Aventurier depuis ${days} jour${days>1?'s':''} ·` : ''} ${profile.totalImports || 0} import${(profile.totalImports||0)>1?'s':''} de save
          </div>
        </div>
      </div>

      <!-- Stats rapides -->
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;flex:1">
        ${lv > 0 ? `<div style="text-align:center;padding:.5rem .85rem;background:var(--paper);border-radius:var(--r-sm);border:var(--bdr)">
          <div style="font-family:var(--ff-d);font-size:1.3rem;font-weight:900;color:var(--sun)">${lv}</div>
          <div style="font-size:.62rem;color:var(--ink-f)">Niveau</div>
        </div>` : ''}
        ${cap > 0 ? `<div style="text-align:center;padding:.5rem .85rem;background:var(--paper);border-radius:var(--r-sm);border:var(--bdr)">
          <div style="font-family:var(--ff-d);font-size:1.3rem;font-weight:900;color:var(--mint-d)">${cap}</div>
          <div style="font-size:.62rem;color:var(--ink-f)">Pals</div>
        </div>` : ''}
        <div style="text-align:center;padding:.5rem .85rem;background:var(--paper);border-radius:var(--r-sm);border:var(--bdr)">
          <div style="font-family:var(--ff-d);font-size:1.3rem;font-weight:900;color:var(--lagoon)">${Math.round(cap/PALS.length*100)||0}%</div>
          <div style="font-size:.62rem;color:var(--ink-f)">Paldeck</div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div style="display:flex;flex-direction:column;gap:.35rem;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" onclick="navigate('saveimport')" style="font-size:.72rem">💾 Importer save</button>
        <button class="btn btn-ghost btn-sm" onclick="navigate('journal')"    style="font-size:.72rem">📔 Journal</button>
      </div>
    </div>`;
}

function editProfileName() {
  const profile = loadProfile() || {};
  const newName = prompt('Ton nom de dresseur :', profile.name || '');
  if (newName !== null && newName.trim()) {
    profile.name = newName.trim().slice(0, 30);
    saveProfile(profile);
    renderProfileBar(window._saveAnalysis || {capturedNames:new Set(), level:0});
    showToast('✅ Nom mis à jour !', 'success');
  }
}

/* ── Missions dynamiques ── */
function generateMissions(analysis) {
  const missions = [];
  const captured    = analysis?.capturedNames || new Set();
  const palObjs     = analysis?.palObjects || [];
  const lv          = analysis?.level || 0;
  const cap         = captured.size;
  const capturedPals = PALS.filter(p => captured.has(p.name));

  // ── Missions de capture ──
  const captureThresholds = [
    {n:10, ach:'Newbie Pal Tamer'}, {n:20, ach:'Intermediate'}, {n:50, ach:'Skilled'},
    {n:90, ach:'Seasoned'}, {n:140, ach:'Exceptional'},
  ];
  const nextThreshold = captureThresholds.find(t => cap < t.n);
  if (nextThreshold) {
    const remaining = nextThreshold.n - cap;
    missions.push({
      type:'capture', priority: remaining <= 5 ? 'urgent' : 'normal',
      icon:'📖', title:`Capture ${remaining} Pal${remaining>1?'s':''} de plus`,
      desc:`Il te manque ${remaining} Pal${remaining>1?'s':''} pour atteindre ${nextThreshold.n} et débloquer "${nextThreshold.ach}"`,
      action:"navigate('pals')", actionLabel:'Voir le Paldeck',
      progress: Math.round(cap/nextThreshold.n*100), progressMax: 100,
    });
  }

  // ── Légendaires manquants ──
  const legendMissing = ['Jetragon','Frostallion','Paladius','Necromus','Neptilius']
    .filter(n => !captured.has(n));
  if (legendMissing.length && lv >= 40) {
    missions.push({
      type:'legendary', priority: lv >= 55 ? 'urgent' : 'normal',
      icon:'💎', title:`${legendMissing.length} Légendaire${legendMissing.length>1?'s':''} à capturer`,
      desc:`Manquants : ${legendMissing.join(', ')}. ${lv < 55 ? 'Atteins le niveau 55 avant de te lancer.' : 'Tu as le niveau requis — fonce !'}`,
      action:"navigate('guides');setTimeout(()=>setGuideTab('legendaires'),200)", actionLabel:'Voir les guides',
      pals: legendMissing.slice(0,3),
    });
  }

  // ── Breeding disponibles non exploités ──
  const availCombos = BREEDING_COMBOS.filter(c =>
    captured.has(c.p1) && captured.has(c.p2) && !captured.has(c.child)
  );
  if (availCombos.length) {
    const best = availCombos[0];
    missions.push({
      type:'breeding', priority:'normal',
      icon:'💞', title:`${availCombos.length} combo${availCombos.length>1?'s':''} de breeding disponible${availCombos.length>1?'s':''}`,
      desc:`Tu peux déjà obtenir ${best.child} en combinant ${best.p1} × ${best.p2} sans rien capturer de plus.`,
      action:"navigate('breeding');setTimeout(()=>setBreedTab('calculateur'),200)", actionLabel:'Calculateur breeding',
      pals:[best.p1, best.p2, best.child],
    });
  }

  // ── Lacunes de base ──
  const weakJobs = ['kindling','watering','electric','mining','handiwork'].filter(job => {
    const best = capturedPals.filter(p=>(p.work||{})[job]).sort((a,b)=>(b.work[job]||0)-(a.work[job]||0))[0];
    return !best || best.work[job] < 2;
  });
  if (weakJobs.length) {
    const jobLabels = {kindling:'Allumage', watering:'Arrosage', electric:'Énergie', mining:'Minage', handiwork:'Artisanat'};
    const topJob = weakJobs[0];
    const topPalNeeded = PALS.filter(p => (p.work||{})[topJob] >= 3 && !captured.has(p.name))
      .sort((a,b)=>(b.work[topJob]||0)-(a.work[topJob]||0))[0];
    missions.push({
      type:'base', priority: weakJobs.length >= 3 ? 'urgent' : 'normal',
      icon:'🏗️', title:`${weakJobs.length} poste${weakJobs.length>1?'s':''} de base sous-optimisé${weakJobs.length>1?'s':''}`,
      desc:`Ton poste "${jobLabels[topJob]||topJob}" est faible.${topPalNeeded ? ` Capture ${topPalNeeded.name} pour l'améliorer.` : ''}`,
      action:"navigate('planner')", actionLabel:'Planificateur de base',
      pals: topPalNeeded ? [topPalNeeded.name] : [],
    });
  }

  // ── Tours non battues ──
  if (lv >= 15 && lv < 50) {
    const towerPals = ['Grizzbolt','Lyleen','Orserk','Faleris','Shadowbeak'];
    const notDefeated = towerPals.filter(p => !captured.has(p));
    if (notDefeated.length) {
      missions.push({
        type:'tower', priority:'normal',
        icon:'🗼', title:`${notDefeated.length} Tour${notDefeated.length>1?'s':''} probablement non vaincue${notDefeated.length>1?'s':''}`,
        desc:`Les boss de tours (${notDefeated.slice(0,2).join(', ')}…) ne sont pas dans ta boîte. Bats les tours pour débloquer les expéditions.`,
        action:"navigate('guides');setTimeout(()=>setGuideTab('tours'),200)", actionLabel:'Guide des tours',
        pals: notDefeated.slice(0,2),
      });
    }
  }

  // ── Doublons à fusionner ──
  if (palObjs.length > 0) {
    const byName = {};
    palObjs.forEach(o => { if(o.charId) byName[o.charId]=(byName[o.charId]||0)+1; });
    const dupeCount = Object.values(byName).filter(n=>n>=4).length;
    if (dupeCount > 0) {
      missions.push({
        type:'condenser', priority:'normal',
        icon:'✨', title:`${dupeCount} espèce${dupeCount>1?'s':''} prête${dupeCount>1?'s':''} pour le Condenseur`,
        desc:`Tu as 4+ exemplaires du même Pal — fusionne-les pour obtenir des étoiles et augmenter leurs stats de 20%.`,
        action:"navigate('saveimport');setTimeout(()=>showSaveTab('dupes',document.querySelector('.tab')),300)", actionLabel:'Voir les doublons',
      });
    }
  }

  // ── Passives S à améliorer ──
  if (palObjs.length > 0 && lv >= 40) {
    const poorPals = palObjs.filter(o => {
      const sCount = (o.passives||[]).filter(p=>getPassiveInfo(p).tier==='S').length;
      return sCount === 0;
    });
    if (poorPals.length > palObjs.length * 0.7) {
      missions.push({
        type:'breeding', priority:'normal',
        icon:'🧬', title:'Améliore les passives de tes Pals',
        desc:`${poorPals.length} de tes Pals n'ont aucune passive S. Commence par farmer Legend + Musclehead sur Gobfin (spawn abondant).`,
        action:"navigate('breeding');setTimeout(()=>setBreedTab('simu'),200)", actionLabel:'Simulateur breeding',
      });
    }
  }

  // ── Mission niveau ──
  const nextMilestone = [20,30,40,50,55,60,65].find(m => lv < m);
  if (nextMilestone && lv > 0) {
    missions.push({
      type:'level', priority: (nextMilestone - lv) <= 3 ? 'urgent' : 'low',
      icon:'⬆️', title:`Atteindre le niveau ${nextMilestone}`,
      desc:`Il te manque ${nextMilestone - lv} niveau${nextMilestone-lv>1?'x':''}. ${nextMilestone === 20 ? 'Priorité : donjons + captures en masse.' : nextMilestone <= 40 ? 'Fais les donjons et bats les Tours.' : 'Farm les boss Alpha et explore les nouvelles zones.'}`,
      progress: lv, progressMax: nextMilestone,
    });
  }

  // Trier : urgent d'abord, puis par type
  const order = {urgent:0, normal:1, low:2};
  return missions.sort((a,b) => (order[a.priority]||1) - (order[b.priority]||1));
}

function renderMissions(analysis) {
  const panel = document.getElementById('missions-panel');
  if (!panel) return;

  if (!analysis || !analysis.capturedNames?.size) {
    panel.innerHTML = `
      <div style="background:rgba(255,208,0,.08);border:1.5px solid var(--sun);border-radius:var(--r-md);
        padding:1rem 1.25rem;display:flex;align-items:center;gap:.85rem">
        <span style="font-size:1.75rem">💾</span>
        <div>
          <div style="font-weight:700;font-size:.9rem">Importe ta sauvegarde pour voir tes missions personnalisées</div>
          <div style="font-size:.78rem;color:var(--ink-f);margin-top:.2rem">Le journal de bord analyse ton état actuel et génère des recommandations sur mesure.</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="navigate('saveimport')" style="margin-left:auto;flex-shrink:0">💾 Importer</button>
      </div>`;
    return;
  }

  const missions = generateMissions(analysis);
  if (!missions.length) {
    panel.innerHTML = `<div style="color:var(--mint-d);font-weight:700;padding:.75rem">✅ Aucune mission urgente — tu gères parfaitement !</div>`;
    return;
  }

  const priorityStyle = {
    urgent: 'border-color:var(--coral);background:rgba(255,61,26,.06)',
    normal: '',
    low:    'opacity:.85',
  };
  const priorityBadge = {
    urgent: '<span style="font-family:var(--ff-m);font-size:.58rem;background:var(--coral);color:#fff;padding:.1rem .4rem;border-radius:3px;font-weight:800;vertical-align:middle">URGENT</span>',
    normal: '', low: '',
  };

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.85rem;flex-wrap:wrap;gap:.5rem">
      <h3 style="font-family:var(--ff-d);font-size:1rem">🎯 Tes missions (${missions.length})</h3>
      <button onclick="renderMissions(window._saveAnalysis)" class="btn btn-ghost btn-sm" style="font-size:.68rem">🔄 Actualiser</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:.65rem">
    ${missions.map(m => `
      <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);
        padding:.85rem 1rem;box-shadow:var(--sh);${priorityStyle[m.priority]||''}">
        <div style="display:flex;align-items:flex-start;gap:.6rem;margin-bottom:.5rem">
          <span style="font-size:1.3rem;flex-shrink:0">${m.icon}</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:.85rem">${m.title} ${priorityBadge[m.priority]||''}</div>
            <div style="font-size:.75rem;color:var(--ink-s);line-height:1.5;margin-top:.2rem">${m.desc}</div>
          </div>
        </div>
        ${m.pals?.length ? `<div style="display:flex;gap:.3rem;margin-bottom:.5rem;flex-wrap:wrap">
          ${m.pals.map(n=>palImg(n,28)).join('')}
        </div>` : ''}
        ${m.progress !== undefined ? `
        <div style="margin-bottom:.5rem">
          <div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--ink-f);margin-bottom:.2rem">
            <span>Progression</span><span>${m.progress} / ${m.progressMax}</span>
          </div>
          <div class="progress-track" style="height:4px">
            <div class="progress-fill" style="width:${Math.round(m.progress/m.progressMax*100)}%;height:100%"></div>
          </div>
        </div>` : ''}
        <div style="display:flex;align-items:center;gap:.5rem;margin-top:.25rem;flex-wrap:wrap">
          ${m.action ? `<button onclick="${m.action}" class="btn btn-ghost btn-sm" style="font-size:.68rem">${m.actionLabel} →</button>` : ''}
          <button onclick="pinMission('${m.type}_${m.title.slice(0,15).replace(/[^a-zA-Z0-9]/g,'_')}')" class="btn btn-ghost btn-sm" style="font-size:.62rem;opacity:.6" title="Épingler dans le journal">📌</button>
        </div>
      </div>`).join('')}
    </div>`;
}

/* ── Score de puissance de base ── */
function computeBaseScore(analysis) {
  const capturedPals = PALS.filter(p => analysis?.capturedNames?.has(p.name));
  const palObjs      = analysis?.palObjects || [];

  const JOBS = ['kindling','watering','planting','electric','handiwork','gathering','lumbering','mining','medicine','cooling'];
  let total = 0, max = JOBS.length * 100;

  JOBS.forEach(job => {
    const best = capturedPals.filter(p=>(p.work||{})[job]).sort((a,b)=>(b.work[job]||0)-(a.work[job]||0))[0];
    const lv = best?.work?.[job] || 0;
    // Score sur 100 = niveau × 25 (Lv4 = 100)
    total += lv * 25;
  });

  const baseScore = Math.round(total / max * 100);

  // Score de passives
  const palCount   = palObjs.length || 1;
  const avgSpassiv = palObjs.reduce((s,o)=>(s+(o.passives||[]).filter(p=>getPassiveInfo(p).tier==='S').length),0) / palCount;
  const passiveScore = Math.min(100, Math.round(avgSpassiv * 25));

  // Score Paldeck
  const paldeckScore = Math.round((analysis?.capturedNames?.size || 0) / PALS.length * 100);

  return {baseScore, passiveScore, paldeckScore, total: Math.round((baseScore+passiveScore+paldeckScore)/3)};
}

function renderBaseScore(analysis) {
  const existing = document.getElementById('base-score-panel');
  if (!existing) return;
  if (!analysis?.capturedNames?.size) { existing.innerHTML=''; return; }

  const {baseScore, passiveScore, paldeckScore, total} = computeBaseScore(analysis);
  const scoreColor = total >= 70 ? 'var(--mint-d)' : total >= 40 ? 'var(--sun)' : 'var(--coral)';
  const scoreLabel = total >= 70 ? 'Excellent' : total >= 40 ? 'Correct' : 'À améliorer';

  existing.innerHTML = `
    <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:1.1rem 1.25rem;box-shadow:var(--sh);margin-bottom:1.25rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <div style="text-align:center;flex-shrink:0">
          <div style="font-family:var(--ff-d);font-size:2.5rem;font-weight:900;color:${scoreColor};line-height:1">${total}</div>
          <div style="font-size:.68rem;font-family:var(--ff-m);color:${scoreColor};font-weight:800">${scoreLabel}</div>
          <div style="font-size:.6rem;color:var(--ink-f)">Score global</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:.4rem">
          ${[['🏗️ Base',baseScore,'var(--lagoon)'],['🧬 Passives',passiveScore,'var(--sun)'],['📖 Paldeck',paldeckScore,'var(--mint-d)']].map(([lbl,sc,col])=>`
          <div>
            <div style="display:flex;justify-content:space-between;font-size:.7rem;margin-bottom:.15rem">
              <span>${lbl}</span><span style="font-weight:700;color:${col}">${sc}/100</span>
            </div>
            <div class="progress-track" style="height:5px">
              <div class="progress-fill" style="width:${sc}%;height:100%;background:${col}"></div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
}

/* ── Journal de sessions ── */
function loadSessions() {
  try { return JSON.parse(localStorage.getItem('dresseur_sessions') || '[]'); }
  catch { return []; }
}
function saveSessions(sessions) {
  // Garder les 50 dernières entrées
  const trimmed = sessions.slice(-50);
  localStorage.setItem('dresseur_sessions', JSON.stringify(trimmed));
}

function addJournalEntry() {
  const text = document.getElementById('journal-new-text')?.value?.trim();
  const mood = document.getElementById('journal-mood')?.value || '📝';
  if (!text) { showToast('⚠️ Écris quelque chose d\u2019abord !', 'warning'); return; }

  const sessions = loadSessions();
  const analysis = window._saveAnalysis;

  const entry = {
    id: Date.now(),
    date: new Date().toISOString(),
    mood,
    text,
    level: analysis?.level || 0,
    captured: analysis?.capturedNames?.size || 0,
    snapshot: {
      palNames: analysis ? [...analysis.capturedNames].slice(-5) : [],
    },
  };

  sessions.push(entry);
  saveSessions(sessions);

  document.getElementById('journal-new-text').value = '';
  showToast('📔 Entrée ajoutée au journal !', 'success');
  renderJournalHistory();

  // Détecter et noter les nouvelles captures vs session précédente
  autoDetectSessionChanges(entry, sessions);
}

function autoDetectSessionChanges(newEntry, sessions) {
  if (sessions.length < 2) return;
  const prev = sessions[sessions.length - 2];
  if (!prev) return;

  const newCap = newEntry.captured - (prev.captured || 0);
  const newLv  = newEntry.level - (prev.level || 0);

  if (newCap > 0 || newLv > 0) {
    const hint = document.getElementById('journal-autosave-hint');
    if (hint) {
      hint.textContent = `Depuis ta dernière entrée : ${newLv>0?`+${newLv} niv `:''} ${newCap>0?`+${newCap} Pals`:''}`;
      hint.style.color = 'var(--mint-d)';
    }
  }
}

function initJournal() {
  renderJournalHistory();
  // Afficher les changements depuis la dernière session si save importée
  if (window._saveAnalysis) {
    const hint = document.getElementById('journal-autosave-hint');
    if (hint) {
      const sessions = loadSessions();
      if (sessions.length > 0) {
        const last = sessions[sessions.length-1];
        const newCap = (window._saveAnalysis.capturedNames?.size||0) - (last.captured||0);
        const newLv  = (window._saveAnalysis.level||0) - (last.level||0);
        if (newCap > 0 || newLv > 0) {
          hint.textContent = `Depuis ta dernière note : ${newLv>0?`+${newLv} niv `:''}${newCap>0?`+${newCap} Pals`:''}`;
          hint.style.color = 'var(--mint-d)';
        }
      }
    }
  }
}

function renderJournalHistory() {
  const container = document.getElementById('journal-history');
  if (!container) return;
  const sessions = loadSessions().reverse(); // Plus récent en premier

  if (!sessions.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size:3rem;margin-bottom:.75rem">📔</div>
        <div class="empty-title">Journal vide</div>
        <p style="color:var(--ink-f);max-width:380px;margin:.5rem auto 0">
          Commence à noter tes sessions ! Importe ta save pour que le journal enregistre aussi ton niveau et tes Pals.
        </p>
      </div>`;
    return;
  }

  // Grouper par date
  const byDate = {};
  sessions.forEach(s => {
    const d = new Date(s.date).toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(s);
  });

  container.innerHTML = Object.entries(byDate).map(([date, entries]) => `
    <div style="margin-bottom:1.5rem">
      <div style="font-family:var(--ff-d);font-size:.85rem;font-weight:700;color:var(--ink-f);
        text-transform:capitalize;margin-bottom:.65rem;padding-bottom:.35rem;border-bottom:var(--bdr)">
        📅 ${date}
      </div>
      <div style="display:flex;flex-direction:column;gap:.55rem">
        ${entries.map(e => {
          const time = new Date(e.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
          return `
          <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);
            padding:.85rem 1rem;box-shadow:var(--sh);display:flex;gap:.85rem">
            <div style="flex-shrink:0;font-size:1.6rem">${e.mood || '📝'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:.82rem;line-height:1.6;color:var(--ink-s)">${escHtml(e.text)}</div>
              <div style="display:flex;gap:.75rem;margin-top:.4rem;flex-wrap:wrap">
                <span style="font-size:.65rem;color:var(--ink-f)">${time}</span>
                ${e.level ? `<span style="font-size:.65rem;color:var(--sun)">Niv ${e.level}</span>` : ''}
                ${e.captured ? `<span style="font-size:.65rem;color:var(--mint-d)">${e.captured} Pals</span>` : ''}
              </div>
            </div>
            <button onclick="deleteJournalEntry(${e.id})" style="background:none;border:none;cursor:pointer;
              color:var(--ink-f);font-size:.8rem;flex-shrink:0;opacity:.5;align-self:flex-start"
              title="Supprimer">✕</button>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('');
}

function deleteJournalEntry(id) {
  const sessions = loadSessions().filter(s => s.id !== id);
  saveSessions(sessions);
  renderJournalHistory();
  showToast('🗑️ Entrée supprimée', 'info', 2000);
}

/* ── Intégration dans navigate() + onSaveAnalyzed ── */

/* ══════════════════════════════════════════════════════════════
   PAGE STATS — Visualisations Chart.js
══════════════════════════════════════════════════════════════ */

let _charts = {};

function destroyChart(id) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

function pinMission(id) {
  const missions = JSON.parse(localStorage.getItem('dresseur_pinned_missions') || '{}');
  if (missions[id]) {
    delete missions[id];
    showToast('📌 Mission désépinglée', 'info', 1500);
  } else {
    missions[id] = { pinnedAt: new Date().toISOString() };
    showToast('📌 Mission épinglée dans le journal !', 'success', 2000);
  }
  localStorage.setItem('dresseur_pinned_missions', JSON.stringify(missions));
}

function initStats() {
  renderStatsTab_progression();
}


function setStatsTab(tab, btn) {
  document.querySelectorAll('#pg-stats .tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  ['progression','elements','travail','galerie'].forEach(t => {
    const el = document.getElementById('stats-tab-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  if (tab === 'progression') renderStatsTab_progression();
  if (tab === 'elements')    renderStatsTab_elements();
  if (tab === 'travail')     renderStatsTab_travail();
  if (tab === 'galerie')     renderStatsTab_galerie();
}

/* ── Progression dans le temps ── */
function renderStatsTab_progression() {
  const sessions = loadSessions();
  const analysis = window._saveAnalysis;

  if (!sessions.length && !analysis) {
    document.getElementById('stats-no-save').style.display = '';
    document.getElementById('stats-progression-content').style.display = 'none';
    return;
  }

  document.getElementById('stats-no-save').style.display = 'none';
  document.getElementById('stats-progression-content').style.display = '';

  // Construire les séries de données depuis les sessions
  const points = sessions.map(s => ({
    date: new Date(s.date).toLocaleDateString('fr-FR', {day:'numeric', month:'short'}),
    level: s.level || 0,
    captured: s.captured || 0,
  }));

  // Ajouter l'état actuel si save importée
  if (analysis?.level) {
    const today = new Date().toLocaleDateString('fr-FR', {day:'numeric', month:'short'});
    const last = points[points.length-1];
    if (!last || last.date !== today) {
      points.push({date: today, level: analysis.level, captured: analysis.capturedNames?.size || 0});
    }
  }

  const chartDefaults = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.05)' } },
      y: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.05)' } },
    },
  };

  // Chart niveaux
  destroyChart('levels');
  if (points.length >= 1) {
    const ctx = document.getElementById('chart-levels')?.getContext('2d');
    if (ctx) _charts['levels'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: points.map(p => p.date),
        datasets: [{
          data: points.map(p => p.level),
          borderColor: '#FFD700', backgroundColor: 'rgba(255,208,0,.1)',
          borderWidth: 2, fill: true, tension: 0.4,
          pointBackgroundColor: '#FFD700', pointRadius: 4,
        }],
      },
      options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0 } } },
    });
  }

  // Chart captures
  destroyChart('captures');
  if (points.length >= 1) {
    const ctx = document.getElementById('chart-captures')?.getContext('2d');
    if (ctx) _charts['captures'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: points.map(p => p.date),
        datasets: [{
          data: points.map(p => p.captured),
          borderColor: '#00E34A', backgroundColor: 'rgba(0,227,74,.1)',
          borderWidth: 2, fill: true, tension: 0.4,
          pointBackgroundColor: '#00E34A', pointRadius: 4,
        }],
      },
      options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0, max: PALS.length } } },
    });
  }

  // Chart scores (calculés depuis les sessions)
  destroyChart('scores');
  if (points.length >= 1 && analysis) {
    const scores = points.map(p => {
      const pct = PALS.length > 0 ? Math.round(p.captured / PALS.length * 100) : 0;
      return pct;
    });
    const ctx = document.getElementById('chart-scores')?.getContext('2d');
    if (ctx) _charts['scores'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: points.map(p => p.date),
        datasets: [{
          label: '% Paldeck',
          data: scores,
          backgroundColor: scores.map(s => s >= 70 ? '#00E34A' : s >= 40 ? '#FFD700' : '#FF6B35'),
          borderRadius: 4,
        }],
      },
      options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0, max: 100 } } },
    });
  }
}

/* ── Distribution par éléments ── */
function renderStatsTab_elements() {
  const analysis = window._saveAnalysis;
  const capturedNames = analysis?.capturedNames || new Set();

  const EL_COLORS_CHART = {
    fire:'#FF6B35', water:'#4FC3F7', electric:'#FFD54F',
    grass:'#66BB6A', ice:'#80DEEA', dark:'#9C27B0',
    dragon:'#6C4CF2', ground:'#A1887F', neutral:'#9E9E9E',
  };

  // Compter par élément
  function countByEl(palList) {
    const counts = {};
    palList.forEach(p => p.el.forEach(e => { counts[e] = (counts[e]||0) + 1; }));
    return counts;
  }

  const mine    = PALS.filter(p => capturedNames.has(p.name));
  const allPals = PALS;

  const countsMine = countByEl(mine);
  const countsAll  = countByEl(allPals);
  const labels     = Object.keys(EL[Object.keys(EL)[0]] ? EL : {}).length
    ? Object.keys(EL).filter(e => countsAll[e])
    : ['fire','water','electric','grass','ice','dark','dragon','ground','neutral'];

  const makeDonut = (canvasId, counts, labelMap) => {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const validLabels = labels.filter(e => counts[e]);
    _charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: validLabels.map(e => EL[e]?.name || e),
        datasets: [{
          data: validLabels.map(e => counts[e] || 0),
          backgroundColor: validLabels.map(e => EL_COLORS_CHART[e] || '#888'),
          borderWidth: 2,
          borderColor: 'var(--paper)',
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { color: '#aaa', font: { size: 11 }, boxWidth: 14 } },
        },
      },
    });
  };

  makeDonut('chart-elements-mine', countsMine);
  makeDonut('chart-elements-all',  countsAll);

  // Barres comparatives
  const barsEl = document.getElementById('stats-elements-bars');
  if (barsEl) {
    barsEl.innerHTML = `
      <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:1rem;box-shadow:var(--sh)">
        <div style="font-family:var(--ff-d);font-weight:700;margin-bottom:.85rem;font-size:.9rem">Couverture par élément</div>
        <div style="display:flex;flex-direction:column;gap:.45rem">
          ${labels.filter(e => countsAll[e]).map(e => {
            const total   = countsAll[e]  || 0;
            const have    = countsMine[e] || 0;
            const pct     = total > 0 ? Math.round(have/total*100) : 0;
            const color   = EL_COLORS_CHART[e] || '#888';
            return `<div style="display:flex;align-items:center;gap:.75rem">
              <div style="width:90px;display:flex;align-items:center;gap:.3rem;flex-shrink:0">
                ${elIconImg(e,16)||EL[e]?.icon||''}
                <span style="font-size:.72rem;font-weight:700">${EL[e]?.name||e}</span>
              </div>
              <div style="flex:1">
                <div class="progress-track" style="height:8px">
                  <div class="progress-fill" style="width:${pct}%;height:100%;background:${color}"></div>
                </div>
              </div>
              <div style="font-family:var(--ff-m);font-size:.7rem;width:70px;text-align:right;flex-shrink:0">
                <strong style="color:${color}">${have}</strong><span style="color:var(--ink-f)">/${total}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }
}

/* ── Couverture travail ── */
function renderStatsTab_travail() {
  const analysis = window._saveAnalysis;
  const capturedPals = PALS.filter(p => analysis?.capturedNames?.has(p.name));

  const JOBS_CHART = [
    {id:'kindling', label:'Allumage'},     {id:'watering', label:'Arrosage'},
    {id:'planting', label:'Plantation'},   {id:'electric', label:'Énergie'},
    {id:'handiwork',label:'Artisanat'},    {id:'gathering',label:'Collecte'},
    {id:'lumbering',label:'Abattage'},     {id:'mining',   label:'Minage'},
    {id:'medicine', label:'Pharmacie'},    {id:'cooling',  label:'Réfrigération'},
    {id:'transporting',label:'Transport'}, {id:'farming',  label:'Élevage'},
  ];

  const scores = JOBS_CHART.map(job => {
    const best = capturedPals.filter(p=>(p.work||{})[job.id]).sort((a,b)=>(b.work[job.id]||0)-(a.work[job.id]||0))[0];
    return { ...job, lv: best?.work?.[job.id] || 0, palName: best?.name || null };
  });

  destroyChart('travail');
  const ctx = document.getElementById('chart-travail')?.getContext('2d');
  if (ctx) _charts['travail'] = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: scores.map(s => s.label),
      datasets: [{
        label: 'Niveau max',
        data: scores.map(s => s.lv),
        backgroundColor: 'rgba(0,227,74,.15)',
        borderColor: '#00E34A',
        borderWidth: 2,
        pointBackgroundColor: scores.map(s => s.lv >= 3 ? '#00E34A' : s.lv >= 2 ? '#FFD700' : '#FF6B35'),
        pointRadius: 5,
      }],
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0, max: 4,
          ticks: { color: '#888', stepSize: 1, backdropColor: 'transparent' },
          grid:  { color: 'rgba(255,255,255,.08)' },
          pointLabels: { color: '#aaa', font: { size: 11 } },
        },
      },
      plugins: { legend: { display: false } },
    },
  });

  const details = document.getElementById('stats-travail-details');
  if (details) {
    details.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.5rem">
        ${scores.map(s => {
          const color = s.lv >= 3 ? 'var(--mint-d)' : s.lv >= 2 ? 'var(--sun)' : s.lv >= 1 ? 'var(--coral)' : '#555';
          const stars = '★'.repeat(s.lv) + '☆'.repeat(4-s.lv);
          return `<div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-sm);
            padding:.5rem .75rem;display:flex;align-items:center;gap:.5rem;border-left:3px solid ${color}">
            ${workIconImg(s.id,18)}
            <div style="flex:1">
              <div style="font-size:.72rem;font-weight:700">${s.label}</div>
              ${s.palName ? `<div style="font-size:.62rem;color:var(--ink-f)">${s.palName}</div>` : ''}
            </div>
            <span style="font-family:var(--ff-m);font-size:.7rem;color:${color}">${stars}</span>
          </div>`;
        }).join('')}
      </div>`;
  }
}

/* ── Mode Galerie ── */
let _galerieFilter = 'all';

function setGalerieFilter(f, btn) {
  _galerieFilter = f;
  document.querySelectorAll('#stats-tab-galerie .map-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderStatsTab_galerie();
}

function renderStatsTab_galerie() {
  const captured = window._saveAnalysis?.capturedNames || new Set();
  let pals = [...PALS].sort((a,b) => a.id.localeCompare(b.id));
  if (_galerieFilter === 'captured') pals = pals.filter(p => captured.has(p.name));
  if (_galerieFilter === 'missing')  pals = pals.filter(p => !captured.has(p.name));

  const count = document.getElementById('galerie-count');
  if (count) count.textContent = `${pals.length} Pals`;

  const grid = document.getElementById('galerie-grid');
  if (!grid) return;

  grid.innerHTML = pals.map(p => {
    const isCaptured = captured.has(p.name);
    const imgUrl = PAL_IMAGES?.[p.name] || '';
    return `<div onclick="openModal('${p.id}')" title="${p.name}"
      style="width:64px;height:64px;border-radius:8px;cursor:pointer;flex-shrink:0;
        border:2px solid ${isCaptured?'var(--mint-d)':'var(--line)'};
        opacity:${isCaptured?1:.3};transition:transform .12s,opacity .12s;
        background:var(--paper-d);display:flex;align-items:center;justify-content:center;position:relative"
      onmouseover="this.style.transform='scale(1.18)';this.style.opacity='1';this.style.zIndex='5'"
      onmouseout="this.style.transform='';this.style.opacity='${isCaptured?1:.3}';this.style.zIndex=''">
      ${imgUrl
        ? `<img src="${imgUrl}" alt="${p.name}" width="52" height="52" loading="lazy" style="border-radius:5px" onerror="this.style.display='none'">`
        : `<span style="font-size:1.3rem">🐾</span>`}
      ${isCaptured ? `<div style="position:absolute;bottom:1px;right:2px;font-size:.5rem;color:var(--mint-d);font-weight:900;line-height:1">✓</div>` : ''}
    </div>`;
  }).join('');
}


/* ══════════════════════════════════════════════════════════════
   TRACKER ALPHA — Checklist des boss Alpha
══════════════════════════════════════════════════════════════ */

const ALPHA_BOSSES = [
  // Sanctuaires
  {name:'Grizzbolt',    zone:'Sanctuaire No.1', lv:23, el:'electric', note:'Boss de la Tour Rayne aussi'},
  {name:'Anubis',       zone:'Sanctuaire No.2 (Désert)', lv:47, el:'ground',   note:'Meilleur Artisanat Lv4'},
  {name:'Lyleen',       zone:'Sanctuaire No.2 (Île oubliée)', lv:49, el:'grass', note:'Plantation+Pharmacie Lv3'},
  {name:'Blazamut',     zone:'Sanctuaire No.3', lv:49, el:'fire',     note:'Minage+Allumage Lv4'},
  {name:'Shadowbeak',   zone:'Sanctuaire No.3', lv:50, el:'dark',     note:'Monture volante endgame'},
  {name:'Jormuntide',   zone:'Investigator Fork', lv:45, el:'water',  note:'Dragon eau Lv4'},
  {name:'Orserk',       zone:'Île Désolation', lv:47, el:'electric',  note:'Énergie Lv4'},
  // Zones principales
  {name:'Mammorest',    zone:'Forêt de bambous', lv:38, el:'grass',   note:'Grande capture early/mid'},
  {name:'Warsect',      zone:'Collines Résurrection', lv:38, el:'grass', note:'Bug en combat Lv1'},
  {name:'Quivern',      zone:'Collines Résurrection', lv:23, el:'dragon', note:'Accessible tôt'},
  {name:'Kingpaca',     zone:'Collines verdoyantes', lv:38, el:'neutral'},
  {name:'Digtoise',     zone:'Plateau Crépuscule', lv:30, el:'ground', note:'Minage Lv3'},
  {name:'Tombat',       zone:'Plateau Crépuscule', lv:28, el:'dark'},
  {name:'Penking',      zone:'Archipel Brise de mer', lv:15, el:'water'},
  {name:'Elizabee',     zone:'Archipel Brise de mer', lv:30, el:'grass', note:'Élevage Lv1'},
  {name:'Mossanda',     zone:'Collines ventées', lv:28, el:'grass'},
  {name:'Cryolinx',     zone:'Montagne glacée', lv:43, el:'ice', note:'Abattage+Réfrigération Lv3'},
  {name:'Menasting',    zone:'Dunes arides', lv:44, el:'dark', note:'Minage Lv2 + combat'},
  {name:'Relaxaurus',   zone:'Collines verdoyantes', lv:25, el:'dragon'},
  {name:'Beakon',       zone:'Collines ventées', lv:29, el:'electric', note:'Énergie Lv3, monture'},
  {name:'Ragnahawk',    zone:'Île volcanique', lv:32, el:'fire', note:'Allumage Lv3, monture'},
  {name:'Katress',      zone:'Collines ventées', lv:23, el:'dark'},
  {name:'Wixen',        zone:'Collines ventées', lv:19, el:'fire'},
  {name:'Azurobe',      zone:'Côte centrale', lv:29, el:'water'},
  {name:'Helzephyr',    zone:'Hypocrite Hill', lv:39, el:'dark'},
  {name:'Astegon',      zone:'Sanctuaire obscur', lv:48, el:'dragon', note:'Meilleur mineur Lv4'},
  {name:'Faleris',      zone:'Désert', lv:32, el:'fire', note:'Boss Tour PIDF aussi'},
  {name:'Lyleen Noct',  zone:'Île oubliée', lv:47, el:'dark'},
  {name:'Suzaku',       zone:'Rive écarlate', lv:45, el:'fire'},
  {name:'Reptyro',      zone:'Île volcanique', lv:40, el:'fire'},
  {name:'Blazehowl',    zone:'Île volcanique', lv:36, el:'fire'},
  {name:'Fenglope',     zone:'Toundra', lv:36, el:'neutral'},
  {name:'Vanwyrm',      zone:'Falaises crépuscule', lv:24, el:'fire'},
  {name:'Pyrin',        zone:'Toundra', lv:32, el:'fire'},
  {name:'Nitewing',     zone:'Collines ventées', lv:18, el:'neutral'},
  {name:'Incineram',    zone:'Zone forestière', lv:26, el:'fire'},
  {name:'Chillet',      zone:'Zone côtière', lv:11, el:'ice'},
  {name:'Univolt',      zone:'Toundra', lv:31, el:'electric'},
  // Légendaires (considérés comme Alpha)
  {name:'Jetragon',     zone:'Île Volcanique', lv:55, el:'dragon', note:'★ LÉGENDAIRE — Sprint 3300'},
  {name:'Frostallion',  zone:'Toundra Absolue', lv:55, el:'ice',  note:'★ LÉGENDAIRE — Meilleure monture volante'},
  {name:'Paladius',     zone:'Plaines Saintes', lv:55, el:'neutral', note:'★ LÉGENDAIRE'},
  {name:'Necromus',     zone:'Désert des Âmes', lv:55, el:'dark', note:'★ LÉGENDAIRE'},
  {name:'Neptilius',    zone:'Eaux profondes', lv:60, el:'water', note:'★ LÉGENDAIRE — Arrosage Lv4'},
  // Feybreak
  {name:'Bastigor',     zone:'Feybreak', lv:60, el:'ice', note:'Boss Tour Feybreak'},
  {name:'Xenolord',     zone:'Feybreak (Raid)', lv:60, el:'dark', note:'Raid uniquement'},
  {name:'Silvegis',     zone:'Feybreak', lv:55, el:'neutral'},
  {name:'Azurmane',     zone:'Feybreak', lv:52, el:'electric', note:'Énergie Lv4'},
];

let _trackerFilter = 'all';

function loadTrackerData() {
  try { return JSON.parse(localStorage.getItem('dresseur_tracker_alpha') || '{}'); }
  catch { return {}; }
}
function saveTrackerData(data) {
  localStorage.setItem('dresseur_tracker_alpha', JSON.stringify(data));
}

function initTracker() {
  renderTracker();
}

function setTrackerFilter(f, btn) {
  _trackerFilter = f;
  document.querySelectorAll('#pg-tracker .map-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTracker();
}

function toggleAlpha(name) {
  const data = loadTrackerData();
  if (data[name]) delete data[name]; else data[name] = true;
  saveTrackerData(data);
  renderTracker();
  showToast(data[name] ? `⭐ ${name} marqué capturé !` : `❌ ${name} retiré`, 'info', 1500);
}

function resetTracker() {
  if (!confirm('Remettre à zéro le tracker Alpha ?')) return;
  localStorage.removeItem('dresseur_tracker_alpha');
  renderTracker();
  showToast('🗑️ Tracker réinitialisé', 'info');
}

function renderTracker() {
  const data = loadTrackerData();
  const analysis = window._saveAnalysis;
  const capturedNames = analysis?.capturedNames || new Set();

  // Auto-cocher depuis la save si disponible
  if (capturedNames.size > 0) {
    ALPHA_BOSSES.forEach(boss => {
      if (capturedNames.has(boss.name) && !data[boss.name]) data[boss.name] = true;
    });
    saveTrackerData(data);
  }

  const done  = ALPHA_BOSSES.filter(b => data[b.name]).length;
  const total = ALPHA_BOSSES.length;
  const pct   = Math.round(done / total * 100);

  // Barre de progression
  const fillEl = document.getElementById('tracker-fill');
  if (fillEl) setTimeout(() => fillEl.style.width = pct + '%', 100);

  const textEl = document.getElementById('tracker-progress-text');
  if (textEl) textEl.textContent = `${done} / ${total} Alpha capturés (${pct}%)`;

  // Filtrer
  let bosses = ALPHA_BOSSES;
  if (_trackerFilter === 'done')    bosses = bosses.filter(b => data[b.name]);
  if (_trackerFilter === 'missing') bosses = bosses.filter(b => !data[b.name]);

  const EL_COLORS_T = {
    fire:'#FF6B35', water:'#4FC3F7', electric:'#FFD54F',
    grass:'#66BB6A', ice:'#80DEEA', dark:'#9C27B0',
    dragon:'#6C4CF2', ground:'#A1887F', neutral:'#9E9E9E',
  };

  const grid = document.getElementById('tracker-grid');
  if (!grid) return;

  if (!bosses.length) {
    grid.innerHTML = `<div class="empty-state"><div style="font-size:3rem">🎉</div><div class="empty-title">${_trackerFilter==='done'?'Aucun Alpha capturé pour l\'instant':'Tous les Alpha sont capturés !'}</div></div>`;
    return;
  }

  grid.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.65rem">
    ${bosses.map(boss => {
      const isDone    = !!data[boss.name];
      const elColor   = EL_COLORS_T[boss.el] || '#888';
      const palObj    = PALS.find(p => p.name === boss.name);
      const isLeg     = boss.note?.includes('LÉGENDAIRE');

      return `<div onclick="toggleAlpha('${boss.name}')"
        style="background:var(--glass);border:2px solid ${isDone ? 'var(--mint-d)' : isLeg ? 'var(--sun)' : 'var(--line)'};
          border-radius:var(--r-md);padding:.75rem 1rem;cursor:pointer;
          opacity:${isDone?1:.8};transition:all .15s;box-shadow:var(--sh);
          ${isDone?'background:rgba(0,227,74,.06)':''}"
        onmouseover="this.style.transform='translateY(-2px)'"
        onmouseout="this.style.transform=''">
        <div style="display:flex;align-items:center;gap:.65rem">
          <div style="flex-shrink:0;position:relative">
            ${palImg(boss.name, 44)}
            <div style="position:absolute;bottom:-2px;right:-2px;width:16px;height:16px;border-radius:50%;
              background:${isDone?'var(--mint-d)':'var(--line)'};display:flex;align-items:center;justify-content:center;
              font-size:.55rem;border:2px solid var(--paper)">${isDone?'✓':'○'}</div>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:.85rem;display:flex;align-items:center;gap:.3rem">
              ${boss.name}
              ${isLeg ? '<span style="font-size:.55rem;background:var(--sun);color:#000;padding:.1rem .3rem;border-radius:3px;font-weight:800">LEG</span>' : ''}
            </div>
            <div style="font-size:.68rem;color:var(--ink-f);margin-top:.1rem">
              📍 ${boss.zone} · <span style="color:${elColor};font-weight:700">Lv ${boss.lv}</span>
            </div>
            ${boss.note && !isLeg ? `<div style="font-size:.62rem;color:var(--ink-f);margin-top:.1rem;font-style:italic">${boss.note}</div>` : ''}
          </div>
          <div style="font-size:1.3rem;flex-shrink:0">${isDone?'✅':'⬜'}</div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

/* ══════════════════════════════════════════════════════════════
   GUIDE DE RAID PERSONNALISÉ dans le Dashboard
══════════════════════════════════════════════════════════════ */

function renderRaidGuide(analysis) {
  const panel = document.getElementById('raid-guide-panel');
  if (!panel || !analysis?.capturedNames?.size) { if(panel) panel.innerHTML=''; return; }

  const capturedPals = PALS.filter(p => analysis.capturedNames.has(p.name));
  const lv = analysis.level || 0;

  // Raids accessibles selon le niveau
  const accessibleRaids = RAIDS.filter(r => lv >= (r.lvl - 5));
  if (!accessibleRaids.length) { panel.innerHTML=''; return; }

  // Pour chaque raid, trouver les meilleurs Pals de la collection
  const RAID_COUNTERS = {
    'Bellanoir':         ['dark','neutral'],
    'Bellanoir Libero':  ['dark','neutral'],
    'Blazamut Ryu':      ['water','ice'],
    'Xenolord':          ['dragon','ice'],
    'Moon Lord':         ['electric','grass'],
    'Hartalis':          ['fire','dark'],
  };

  const EL_COLORS_R = {fire:'#FF6B35',water:'#4FC3F7',electric:'#FFD54F',dark:'#9C27B0',neutral:'#9E9E9E',ice:'#80DEEA',dragon:'#6C4CF2'};

  panel.innerHTML = `
    <div style="background:var(--glass);border:var(--bdr);border-radius:var(--r-md);padding:1.1rem 1.25rem;box-shadow:var(--sh)">
      <h3 style="font-family:var(--ff-d);font-size:1rem;margin-bottom:.85rem">⚔️ Guide de raid personnalisé</h3>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        ${accessibleRaids.slice(0,3).map(raid => {
          const counters  = RAID_COUNTERS[raid.name] || [];
          const elColor   = EL_COLORS_R[raid.el] || '#888';

          // Trouver les meilleurs Pals depuis la collection contre ce raid
          const bestPals  = capturedPals
            .filter(p => counters.some(el => p.el.includes(el)))
            .sort((a,b) => b.atk - a.atk)
            .slice(0, 4);

          // Pals manquants conseillés
          const missingPals = PALS
            .filter(p => !analysis.capturedNames.has(p.name) && counters.some(el => p.el.includes(el)))
            .filter(p => getTier(p.name) === 'S' || getTier(p.name) === 'A')
            .slice(0, 2);

          return `<div style="border-left:4px solid ${elColor};padding:.75rem 1rem;background:var(--paper-d);border-radius:0 var(--r-sm) var(--r-sm) 0">
            <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;flex-wrap:wrap">
              <strong style="font-family:var(--ff-d)">${raid.name}</strong>
              <span style="font-size:.65rem;padding:.1rem .4rem;background:${elColor};color:${['#FFD54F','#80DEEA'].includes(elColor)?'#000':'#fff'};border-radius:4px;font-weight:700">Lv ${raid.lvl}</span>
              <span style="font-size:.65rem;color:var(--ink-f)">${raid.req}</span>
            </div>
            ${bestPals.length ? `
              <div style="font-size:.68rem;color:var(--mint-d);font-weight:700;margin-bottom:.3rem">✅ Tes meilleurs Pals pour ce raid</div>
              <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
                ${bestPals.map(p => `<div style="display:flex;align-items:center;gap:.3rem;padding:.2rem .5rem;background:rgba(0,227,74,.1);border-radius:5px;font-size:.7rem">
                  ${palImg(p.name,24)} <strong>${p.name}</strong>
                </div>`).join('')}
              </div>` : `<div style="font-size:.72rem;color:var(--coral);margin-bottom:.4rem">⚠️ Aucun Pal adapté dans ta collection — capture des Pals ${counters.join('/')} !</div>`}
            ${missingPals.length ? `
              <div style="font-size:.68rem;color:var(--ink-f);font-weight:700;margin-bottom:.3rem">🎯 Renforcer avec</div>
              <div style="display:flex;gap:.3rem;flex-wrap:wrap">
                ${missingPals.map(p => `<div style="display:flex;align-items:center;gap:.3rem;padding:.2rem .4rem;background:var(--glass);border:var(--bdr);border-radius:5px;font-size:.68rem;opacity:.8">
                  ${palImg(p.name,20)} ${p.name}
                </div>`).join('')}
              </div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ── Hooker dans onSaveAnalyzed et initDashboard ── */

/* ══════════════════════════════════════════════════════════════
   RECETTES DÉBLOQUÉES — Depuis la save
   Utilise TECH_ID_MAP (techids.js) pour mapper IDs → noms
══════════════════════════════════════════════════════════════ */

/* ── Onglet Recettes dans Ma Save ── */
function renderRecipesTab(unlockedRecipes) {
  if (!unlockedRecipes || unlockedRecipes.size === 0) {
    return `<div class="empty-state">
      <div style="font-size:3rem;margin-bottom:.75rem">🔒</div>
      <div class="empty-title">Aucune recette détectée</div>
      <p style="color:var(--ink-f);max-width:380px;margin:.5rem auto 0">
        Le parser n'a pas trouvé de données de technologie dans ce fichier.
        Essaie avec ton fichier <code>Players/{id}.sav</code> ou <code>Level.sav</code>.
      </p>
    </div>`;
  }

  // Mapper les IDs débloqués vers les noms via TECH_ID_MAP
  const unlockedNames = new Set();
  const unknownIds    = new Set();

  unlockedRecipes.forEach(id => {
    // Nettoyer l'ID (enlever préfixes communs)
    const clean = id
      .replace(/^EPalTechnologyID::/,'')
      .replace(/^PalTechnology_Id_/,'')
      .replace(/^Product_/,'Product_')
      .trim();

    if (typeof TECH_ID_MAP !== 'undefined' && TECH_ID_MAP[clean]) {
      unlockedNames.add(TECH_ID_MAP[clean]);
    } else if (typeof TECH_ID_MAP !== 'undefined' && TECH_ID_MAP[id]) {
      unlockedNames.add(TECH_ID_MAP[id]);
    } else {
      unknownIds.add(id);
    }
  });

  // Croiser avec TECH_TREE pour voir quels niveaux sont couverts
  const techStatus = TECH_TREE.map(lvl => {
    const items = lvl.items || [];
    const unlocked = items.filter(item => {
      const name = typeof item === 'string' ? item : item.name;
      return unlockedNames.has(name);
    });
    return {
      lv: lvl.lv || lvl.lvl,
      pts: lvl.pts,
      total: items.length,
      unlocked: unlocked.length,
      items: items.map(item => {
        const name = typeof item === 'string' ? item : item.name;
        return { name, done: unlockedNames.has(name) };
      }),
    };
  }).filter(l => l.total > 0);

  const totalItems    = techStatus.reduce((s,l) => s + l.total, 0);
  const totalUnlocked = techStatus.reduce((s,l) => s + l.unlocked, 0);
  const pct = Math.round(totalUnlocked / totalItems * 100);

  // Trouver le niveau max débloqué
  const maxUnlockedLv = techStatus.filter(l => l.unlocked > 0).slice(-1)[0]?.lv || 0;

  // Niveaux incomplets (des items manquants)
  const incomplete = techStatus.filter(l => l.unlocked > 0 && l.unlocked < l.total);

  return `
    <!-- Résumé -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.75rem;margin-bottom:1.5rem">
      <div style="text-align:center;padding:.85rem;background:var(--paper-d);border-radius:var(--r-md);border:var(--bdr)">
        <div style="font-family:var(--ff-d);font-size:1.6rem;font-weight:900;color:var(--sun)">${totalUnlocked}</div>
        <div style="font-size:.72rem;font-weight:700">Recettes débloquées</div>
        <div style="font-size:.62rem;color:var(--ink-f)">sur ${totalItems} au total</div>
      </div>
      <div style="text-align:center;padding:.85rem;background:var(--paper-d);border-radius:var(--r-md);border:var(--bdr)">
        <div style="font-family:var(--ff-d);font-size:1.6rem;font-weight:900;color:var(--mint-d)">${pct}%</div>
        <div style="font-size:.72rem;font-weight:700">Arbre technologique</div>
        <div style="font-size:.62rem;color:var(--ink-f)">complété</div>
      </div>
      <div style="text-align:center;padding:.85rem;background:var(--paper-d);border-radius:var(--r-md);border:var(--bdr)">
        <div style="font-family:var(--ff-d);font-size:1.6rem;font-weight:900;color:var(--lagoon)">${maxUnlockedLv}</div>
        <div style="font-size:.72rem;font-weight:700">Niveau max atteint</div>
        <div style="font-size:.62rem;color:var(--ink-f)">dans l'arbre tech</div>
      </div>
      <div style="text-align:center;padding:.85rem;background:var(--paper-d);border-radius:var(--r-md);border:var(--bdr)">
        <div style="font-family:var(--ff-d);font-size:1.6rem;font-weight:900;color:var(--coral)">${incomplete.length}</div>
        <div style="font-size:.72rem;font-weight:700">Niveaux partiels</div>
        <div style="font-size:.62rem;color:var(--ink-f)">recettes manquantes</div>
      </div>
    </div>

    <!-- Barre progression -->
    <div style="margin-bottom:1.5rem">
      <div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:.35rem">
        <span>Progression de l'arbre technologique</span>
        <span style="font-family:var(--ff-m);font-weight:700;color:var(--mint-d)">${totalUnlocked} / ${totalItems}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
    </div>

    <!-- Recettes manquantes prioritaires -->
    ${incomplete.length > 0 ? `
    <div style="background:rgba(255,208,0,.08);border:1.5px solid var(--sun);border-radius:var(--r-md);padding:1rem 1.25rem;margin-bottom:1.25rem">
      <div style="font-family:var(--ff-d);font-weight:700;font-size:.9rem;margin-bottom:.75rem">
        ⚠️ Recettes manquantes dans des niveaux partiellement débloqués
      </div>
      <div style="display:flex;flex-direction:column;gap:.4rem">
        ${incomplete.slice(0,5).map(l => {
          const missing = l.items.filter(i => !i.done);
          return `<div style="padding:.5rem .75rem;background:var(--paper-d);border-radius:6px;border-left:3px solid var(--sun)">
            <div style="font-size:.72rem;font-weight:700;margin-bottom:.2rem">Niveau ${l.lv} — ${l.unlocked}/${l.total} débloquées</div>
            <div style="font-size:.68rem;color:var(--ink-f)">${missing.map(i=>`🔒 ${i.name}`).join(' · ')}</div>
          </div>`;
        }).join('')}
        ${incomplete.length > 5 ? `<div style="font-size:.72rem;color:var(--ink-f);text-align:center">+${incomplete.length-5} autres niveaux partiels</div>` : ''}
      </div>
    </div>` : '<div style="color:var(--mint-d);font-weight:700;padding:.5rem 0;font-size:.85rem">✅ Tous les niveaux partiellement ou totalement complétés !</div>'}

    <!-- Arbre complet niveau par niveau -->
    <div style="font-family:var(--ff-d);font-weight:700;font-size:.9rem;margin-bottom:.85rem">📋 Détail par niveau</div>
    <div style="display:flex;flex-direction:column;gap:.4rem">
      ${techStatus.map(l => {
        const pctL = l.total > 0 ? Math.round(l.unlocked/l.total*100) : 0;
        const color = pctL === 100 ? 'var(--mint-d)' : pctL > 0 ? 'var(--sun)' : 'var(--line)';
        return `<details style="background:var(--glass);border:var(--bdr);border-radius:var(--r-sm);overflow:hidden">
          <summary style="padding:.55rem .85rem;cursor:pointer;display:flex;align-items:center;gap:.75rem;list-style:none">
            <span style="font-family:var(--ff-m);font-size:.7rem;font-weight:800;
              padding:.2rem .5rem;border-radius:4px;background:${color};
              color:${pctL>0?'#fff':'var(--ink-f)'}">Niv ${l.lv}</span>
            <div style="flex:1">
              <div style="height:4px;background:var(--line);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${pctL}%;background:${color};border-radius:2px"></div>
              </div>
            </div>
            <span style="font-family:var(--ff-m);font-size:.68rem;color:${color};font-weight:700">${l.unlocked}/${l.total}</span>
            <span style="font-size:.65rem;color:var(--ink-f)">${pctL===100?'✓ Complet':pctL>0?'Partiel':'Non commencé'}</span>
          </summary>
          <div style="padding:.5rem .85rem .85rem;display:flex;flex-wrap:wrap;gap:.3rem">
            ${l.items.map(i => `
              <span style="font-size:.68rem;padding:.2rem .5rem;border-radius:4px;
                background:${i.done?'rgba(0,227,74,.12)':'var(--paper-d)'};
                border:1px solid ${i.done?'var(--mint-d)':'var(--line)'};
                color:${i.done?'var(--mint-d)':'var(--ink-f)'};
                text-decoration:${i.done?'none':'line-through'};opacity:${i.done?1:.6}">
                ${i.done?'✓':''} ${i.name}
              </span>`).join('')}
          </div>
        </details>`;
      }).join('')}
    </div>

    ${unknownIds.size > 0 ? `
    <details style="margin-top:1rem;opacity:.5">
      <summary style="cursor:pointer;font-size:.7rem;color:var(--ink-f)">
        ${unknownIds.size} IDs non reconnus (cliquer pour voir)
      </summary>
      <div style="font-family:var(--ff-m);font-size:.62rem;color:var(--ink-f);padding:.5rem;word-break:break-all">
        ${[...unknownIds].join(', ')}
      </div>
    </details>` : ''}`;
}

/* ── Hooker dans renderSaveResults pour ajouter l'onglet Recettes ── */
// Patch de renderSaveResults pour inclure l'onglet recettes si données disponibles
const _origRenderSaveResults = renderSaveResults;
function renderSaveResults(capturedIds, filename, analysis) {
  _origRenderSaveResults(capturedIds, filename, analysis);

  // Ajouter le bouton "Recettes" dans les onglets si recettes disponibles
  const tabsContainer = document.querySelector('#save-results .tabs');
  if (tabsContainer && !document.getElementById('save-tab-btn-recipes')) {
    const btn = document.createElement('button');
    btn.id = 'save-tab-btn-recipes';
    btn.className = 'tab';
    btn.innerHTML = '🔓 Recettes';
    btn.onclick = () => {
      showSaveTab('recipes', btn);
      const existing = document.getElementById('save-tab-recipes');
      if (existing && !existing.dataset.rendered) {
        existing.innerHTML = renderRecipesTab(analysis.unlockedRecipes);
        existing.dataset.rendered = '1';
      }
    };
    tabsContainer.appendChild(btn);

    // Créer le panneau recettes
    const panel = document.createElement('div');
    panel.id = 'save-tab-recipes';
    panel.style.display = 'none';
    panel.innerHTML = renderRecipesTab(analysis.unlockedRecipes);
    panel.dataset.rendered = '1';
    tabsContainer.parentElement.appendChild(panel);
  }
}

