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
  comparePals: [null, null],
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
  if (page === 'breeding' && !state.breedingInitialized) { initBreeding(); state.breedingInitialized = true; }
  if (page === 'crafting' && !state.craftingInitialized) { initCrafting(); state.craftingInitialized = true; }
  if (page === 'guides' && !state.guidesInitialized) { initGuides(); state.guidesInitialized = true; }
  if (page === 'comparateur') initComparateur();
  if (page === 'checklist') initChecklist();
}


/* ── HERO FEATURED PALS ── */
function renderFeatured() {
  const ids = ['001', '037', '102', '110'];
  document.getElementById('feat-grid').innerHTML = PALS
    .filter(p => ids.includes(p.id))
    .map((p, i) => palMiniCard(p, i))
    .join('');
}

function palMiniCard(p, i = 0) {
  return `<div class="pal-mini fade-up" style="animation-delay:${i * 70}ms" onclick="openModal('${p.id}')">
    <div class="pm-hdr">
      <span class="pm-id mono">№ ${p.id}</span>
      <div class="pm-els">${p.el.map(e => `<span class="pm-el" style="background:${EL[e].color}" title="${EL[e].name}">${EL[e].icon}</span>`).join('')}</div>
    </div>
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
  renderPals(PALS);
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
  renderPals(filteredPals());
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
  return PALS.filter(p => {
    const q = state.palFilter.search;
    const matchText = !q || p.name.toLowerCase().includes(q) || (p.nameEN && p.nameEN.toLowerCase().includes(q));
    const matchEl = !state.palFilter.element || p.el.includes(state.palFilter.element);
    return matchText && matchEl;
  });
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
         `<span class="work-chip">${WK[k]}<span class="work-lvl">Lv.${v}</span></span>`).join('')}</div></div>`
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
            <div class="modal-id mono">№ ${p.id} · Power Rank ${p.rank} · Tier ${getTier(p.name)}</div>
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
  const [a, b] = state.comparePals;
  const slot = (p, idx) => p
    ? `<div class="compare-slot">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><div class="pc-id mono">№ ${p.id}</div><div class="pc-name">${p.name}</div>${p.nameEN && p.nameEN !== p.name ? `<div style="font-size:.68rem;color:var(--ink-f);font-family:var(--ff-m);margin-top:2px" title="Nom FR">🇫🇷 ${p.nameEN}</div>` : ''}</div>
          <button class="btn btn-ghost btn-sm" onclick="removeCompare(${idx})">✕</button>
        </div>
        <div class="pc-els" style="margin:.5rem 0">${p.el.map(e=>`<span class="pc-el" style="background:${EL[e].color}">${EL[e].icon} ${EL[e].name}</span>`).join('')}</div>
        <p class="pm-desc">${p.desc}</p>
        <div style="font-size:.8rem;color:var(--ink-f);margin-top:.5rem">Power Rank : <strong class="mono">${p.rank}</strong></div>
      </div>`
    : `<div class="compare-slot empty" onclick="navigate('pals')">
        <div style="text-align:center;color:var(--ink-f)">
          <div style="font-size:2.5rem">🔍</div>
          <div style="font-weight:700;margin-top:.5rem">Sélectionne un Pal</div>
          <div style="font-size:.8rem;margin-top:.3rem">Va dans le Paldeck et clique "Comparer"</div>
        </div>
      </div>`;

  document.getElementById('compare-slots').innerHTML = `${slot(a, 0)}<div class="compare-vs">VS</div>${slot(b, 1)}`;

  if (!a || !b) {
    document.getElementById('compare-results').innerHTML = '<p style="text-align:center;color:var(--ink-f);padding:1.5rem">Sélectionne deux Pals pour voir la comparaison</p>';
    return;
  }

  const stats = [
    { lbl: 'HP ❤️', ka: 'hp', kb: 'hp' },
    { lbl: 'ATQ ⚔️', ka: 'atk', kb: 'atk' },
    { lbl: 'DEF 🛡️', ka: 'def', kb: 'def' },
    { lbl: 'Vitesse 💨', ka: 'spd', kb: 'spd' },
    { lbl: 'Power Rank', ka: 'rank', kb: 'rank' },
  ];

  const maxVals = stats.map(s => Math.max(a[s.ka], b[s.kb], 1));
  let aWins = 0, bWins = 0;

  const rows = stats.map((s, i) => {
    const av = a[s.ka], bv = b[s.kb], maxV = maxVals[i];
    const aPct = Math.round((av / maxV) * 100);
    const bPct = Math.round((bv / maxV) * 100);
    if (av > bv) aWins++; else if (bv > av) bWins++;
    return `<div class="compare-bar-row">
      <span class="compare-val-a">${av}</span>
      <div class="compare-bar-a" style="width:${aPct}%"></div>
      <div class="compare-winner">${s.lbl}</div>
      <div class="compare-bar-b" style="width:${bPct}%"></div>
      <span class="compare-val-b">${bv}</span>
    </div>`;
  }).join('');

  const winner = aWins > bWins ? a.name : bWins > aWins ? b.name : 'Égalité';
  document.getElementById('compare-results').innerHTML = `
    <div class="modal-section-ttl" style="margin-bottom:1rem">Comparaison stat par stat</div>
    <div style="display:flex;justify-content:space-between;margin-bottom:1rem;font-family:var(--ff-m);font-size:.72rem">
      <span style="color:var(--coral);font-weight:700">${a.name}</span>
      <span style="color:var(--lagoon);font-weight:700">${b.name}</span>
    </div>
    ${rows}
    <div style="text-align:center;margin-top:1.25rem;padding:1rem;background:${winner==='Égalité'?'var(--paper-d)':'rgba(255,208,0,.2)'};border-radius:var(--r-md);border:var(--bdr)">
      <div style="font-size:1.1rem;font-weight:800;font-family:var(--ff-d)">
        ${winner === 'Égalité' ? '🤝 Égalité parfaite !' : `🏆 ${winner} l'emporte (${Math.max(aWins,bWins)}/5)`}
      </div>
    </div>`;
}

/* ── CHECKLIST ── */
const CHECKLIST_ITEMS = [
  { id:'tour1', cat:'Tours', label:'Tour Rayne Syndicate — Zoe & Grizzbolt', badge:'Niv. 20', color:'#FFD000' },
  { id:'tour2', cat:'Tours', label:'Tour Free Pal Alliance — Lily & Lyleen', badge:'Niv. 30', color:'#00E34A' },
  { id:'tour3', cat:'Tours', label:'Tour Brothers of the Eternal Pyre — Victor & Shadowbeak', badge:'Niv. 40', color:'#8B2FFF' },
  { id:'tour4', cat:'Tours', label:'Tour PIDF — Marcus & Faleris', badge:'Niv. 45', color:'#FF3D1A' },
  { id:'tour5', cat:'Tours', label:'Tour PAL Moonflowers — Axel & Orserk', badge:'Niv. 50', color:'#00BBFF' },
  { id:'anubis', cat:'Breeding', label:'Obtenir Anubis (Caprity × Beegarde)', badge:'Artisanat Lv.4', color:'#C49A6C' },
  { id:'lyleen', cat:'Breeding', label:'Obtenir Lyleen (Mossanda × Petallia)', badge:'Médecine Lv.3', color:'#00E34A' },
  { id:'orserk', cat:'Breeding', label:'Obtenir Orserk (Relaxaurus × Sparkit)', badge:'Électricité Lv.4', color:'#9B5BE0' },
  { id:'jormun', cat:'Breeding', label:'Obtenir Jormuntide (farming endgame)', badge:'Arrosage Lv.4', color:'#00BBFF' },
  { id:'4pass', cat:'Breeding', label:'Obtenir un Pal avec 4 passives S (Legend, Musclehead, Ferocious, Lucky)', badge:'Objectif ultime', color:'#FFD000' },
  { id:'nitewing', cat:'Exploration', label:'Capturer Nitewing — 1ère monture volante', badge:'Niv. 15', color:'#AAAAAA' },
  { id:'kitsun', cat:'Exploration', label:'Capturer Kitsun — immunité chaleur', badge:'Zone volcanique', color:'#FF5533' },
  { id:'digtoise', cat:'Exploration', label:'Capturer Digtoise — minage Lv.2', badge:'Grottes', color:'#C49A6C' },
  { id:'oilrig', cat:'Endgame', label:'Compléter un run Oil Rig (Sakurajima)', badge:'Farm endgame', color:'#FF8800' },
  { id:'bellanoir', cat:'Raids', label:'Vaincre Bellanoir (raid normal)', badge:'Boss de raid', color:'#8B2FFF' },
  { id:'bellalib', cat:'Raids', label:'Vaincre Bellanoir Libero (raid hard)', badge:'⭐⭐⭐⭐', color:'#FF3D1A' },
  { id:'xenolord', cat:'Raids', label:'Vaincre Xenolord (raid Feybreak)', badge:'⭐⭐⭐⭐⭐', color:'#9B5BE0' },
  { id:'jetragon', cat:'Légendaires', label:'Capturer Jetragon — Pic du Dragon', badge:'Légendaire', color:'#9B5BE0' },
  { id:'frostallion', cat:'Légendaires', label:'Capturer Frostallion — Sommet des neiges', badge:'Légendaire', color:'#88DDFF' },
  { id:'paladius', cat:'Légendaires', label:'Capturer Paladius', badge:'Légendaire', color:'#AAAAAA' },
  { id:'necromus', cat:'Légendaires', label:'Capturer Necromus', badge:'Légendaire', color:'#8B2FFF' },
  { id:'blazryu', cat:'Légendaires', label:'Capturer Blazamut Ryu — Sakurajima', badge:'Légendaire', color:'#FF5533' },
  { id:'frostnoct', cat:'Légendaires', label:'Obtenir Frostallion Noct (Frostallion × Necromus)', badge:'Breeding unique', color:'#6B2FBF' },
  { id:'paldeck', cat:'Collection', label:'Compléter le Paldeck (137+ Pals)', badge:'100% Paldeck', color:'#FFD000' },
];

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

function resetChecklist() {
  if (!confirm('Réinitialiser toute la progression ?')) return;
  state.checklist = {};
  localStorage.removeItem('dresseur_checklist');
  renderChecklist();
}

/* ── BREEDING PAGE ── */
function initBreeding() {
  // Par défaut sur l'onglet mécanique — déjà visible
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
  document.getElementById('combos-list').innerHTML = list.map(c => `
    <div class="combo-card">
      <div class="combo-parents">
        <span class="combo-p">${c.parents[0]}</span>
        <span class="combo-x">×</span>
        <span class="combo-p">${c.parents[1]}</span>
        <span class="combo-arr">→</span>
        <span class="combo-child">${c.child}</span>
      </div>
      <div class="combo-tags">${c.tags.map(t => `<span class="ctag ctag-${t}">${t}</span>`).join('')}</div>
      <p class="combo-note">${c.note}</p>
    </div>`).join('');
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
  document.getElementById('postes-list').innerHTML = POSTES.map(p => `
    <div class="poste-card">
      <div class="poste-hdr"><span class="poste-icon">${p.icon}</span><span class="poste-name">${p.name}</span></div>
      <div class="poste-body">
        <p class="poste-desc">${p.desc}</p>
        <div class="poste-pals">${p.pals.map(pal => `
          <div class="poste-pal-row">
            <span class="poste-pal-name">${pal.n}</span>
            <span class="poste-pal-note">${pal.note}</span>
            <span class="poste-pal-lvl">Lv.${pal.lvl}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`).join('');
}

/* ── GUIDES PAGE ── */
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
  document.getElementById('tours-list').innerHTML = TOURS.map((t, i) => `
    <div class="tour-card" style="animation-delay:${i * 60}ms">
      <div class="tour-hdr" style="border-left:5px solid ${t.color}">
        <span class="tour-num">Tour ${t.num}</span>
        <span class="tour-name">${t.name}</span>
        <span class="tour-lvl">${t.lvl}</span>
      </div>
      <div class="tour-body">
        <div class="tour-boss">👑 ${t.boss} <span class="tour-boss-el" style="background:${t.color};color:${t.color==='#FFD000'?'#000':'#fff'}">${t.el}</span></div>
        <p style="font-size:.75rem;color:var(--ink-f);font-family:var(--ff-m)">📍 ${t.loc}</p>
        <p class="tour-desc">${t.desc}</p>
        <div class="tour-tips">${t.tips.map(tip => `<div class="tour-tip">💡 ${tip}</div>`).join('')}</div>
        <div class="tour-reward">🎁 ${t.reward}</div>
      </div>
    </div>`).join('');
}

function renderRaids() {
  document.getElementById('raids-list').innerHTML = RAIDS.map(r => `
    <div class="raid-card">
      <div class="raid-hdr">
        <span class="raid-name">${r.name}</span>
        <span class="raid-diff diff-${r.diff}">${r.diff}</span>
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
    </div>`).join('');
}

function renderLegendaires() {
  document.getElementById('leg-list').innerHTML = LEGENDAIRES.map((l, i) => `
    <div class="leg-card" style="animation-delay:${i * 60}ms">
      <div class="leg-hdr">
        <div class="leg-els">${l.el.map((e, j) => `<span class="leg-el-chip" style="background:${l.elColor[j]};color:${l.elColor[j]==='#88DDFF'||l.elColor[j]==='#E8E8E8'?'#000':'#fff'}">${EL[e]?.icon||''} ${EL[e]?.name||e}</span>`).join('')}</div>
        <div class="leg-name">${l.name}</div>
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
      </div>
    </div>`).join('');
}

/* ── RECHERCHE GLOBALE ── */
function onGlobalSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  if (!q) { document.getElementById('global-results').innerHTML = ''; return; }
  const palResults = PALS.filter(p => p.name.toLowerCase().includes(q) || (p.nameEN && p.nameEN.toLowerCase().includes(q))).slice(0, 5);
  const recipeResults = RECIPES.filter(r => r.name.toLowerCase().includes(q)).slice(0, 3);
  const comboResults = COMBOS.filter(c => c.child.toLowerCase().includes(q) || c.parents.some(p => p.toLowerCase().includes(q))).slice(0, 3);

  let html = '';
  if (palResults.length) html += `<div class="sr-section"><div class="sr-ttl">Pals</div>${palResults.map(p => `<div class="sr-item" onclick="navigate('pals');setTimeout(()=>openModal('${p.id}'),300)">${p.el.map(e=>EL[e].icon).join('')} <strong>${p.name}</strong> <span>№${p.id}</span></div>`).join('')}</div>`;
  if (recipeResults.length) html += `<div class="sr-section"><div class="sr-ttl">Recettes</div>${recipeResults.map(r => `<div class="sr-item" onclick="navigate('crafting')">${r.icon} <strong>${r.name}</strong> <span>${r.station}</span></div>`).join('')}</div>`;
  if (comboResults.length) html += `<div class="sr-section"><div class="sr-ttl">Breeding</div>${comboResults.map(c => `<div class="sr-item" onclick="navigate('breeding')">${c.parents[0]} × ${c.parents[1]} → <strong>${c.child}</strong></div>`).join('')}</div>`;
  if (!html) html = '<div style="padding:.75rem;color:var(--ink-f);font-size:.85rem">Aucun résultat</div>';
  document.getElementById('global-results').innerHTML = html;
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
            <small>Assure-toi d'importer <strong>Level.sav</strong> ou ton fichier joueur
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
    tip:'Auto-détecté dès qu'un Pal est trouvé dans ta sauvegarde.'
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
    desc:'Capturer l'Oil Rig (Syndicat Rayne — niveau 55).',
    detect:(a) => false, manual:true,
    tip:'Oil Rig au sud-est de l'île des Marais. Arrive en vol avec Jetragon.'
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
    tip:'Les Notes se trouvent près des monuments, tours et zones d'intérêt.'
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
    desc:'Maximisez le rang d'un Pal (4 fusions dans le Condenseur).',
    detect:(a) => a.capturedNames.size >= 10, manual:true,
    tip:'Fusionne 4× le même Pal dans le Condenseur d'essence Pal.'
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
    tip:'Il faut battre les 6 tours d'affilée en mode Hard. Nécessite endgame complet.'
  },
  {
    id:'ach_spheres', cat:'Craft', icon:'🟢', update:'Sakurajima',
    name:'Sphere Craftsman',
    desc:'Craftez 2 000 Sphères Pal (tous types confondus).',
    detect:(a) => false, manual:true,
    tip:'Automatise avec Usine d'assemblage + Pals Travaux manuels.'
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
    tip:'Automatise avec Usine d'assemblage. Craft des balles basiques en masse.'
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
    desc:'Vaincre l'hélicoptère d'attaque sur l'Oil Rig de Feybreak (niveau 60).',
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
    tip:'Station d'Expédition (niveau 15). Envoie des Pals sur des missions hors-base.'
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
    tip:'Chaque nouvelle zone découverte affiche son nom à l'écran.'
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
    tip:'Canne à pêche débloquée au niveau 15 (2 points Tech). Pêche dans n'importe quel plan d'eau.'
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
    tip:'Spot Maître : Île Éternelle de l'Été (coords -408,-825 ou 920,208). Utilise la meilleure canne.'
  },
  {
    id:'ach_arena1', cat:'Arène', icon:'🥊', update:'Tides of Terraria',
    name:'Silver Champ',
    desc:'Atteindre le rang Argent à l'Arène (300 points).',
    detect:(a) => false, manual:true,
    tip:'Arène au sud du Désert Desséché. Bats les adversaires Bronze puis Argent.'
  },
  {
    id:'ach_arena2', cat:'Arène', icon:'🏆', update:'Tides of Terraria',
    name:'Arena Champion',
    desc:'Atteindre le rang Maître à l'Arène (3 800 points).',
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
    tip:'Utilise un Hartalis Slab dans l'Autel de combat. Boss de niveau 65.'
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

  // Calculer d'abord le total pour la barre
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
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.85rem">
          <h3 style="font-family:var(--ff-d);font-size:1.1rem">${catIcon(cat)} ${cat}</h3>
          <span class="stamp" style="color:${catUnlocked===items.length?'var(--mint-d)':'var(--ink-f)'};border-color:${catUnlocked===items.length?'var(--mint-d)':'var(--line)'};font-size:.65rem">
            ${catUnlocked}/${items.length}
          </span>
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
  // Si l'utilisateur est sur la page succès, re-rendre
  if (state.page === 'achievements') renderAchievements(analysis);
}

/* ══════════════════════════════════════════════════
   PAGE MAPS — Points d'intérêt + filtres
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
