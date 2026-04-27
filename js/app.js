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
};

// Populate power ranks from PALS data
PALS.forEach(p => { POWER_RANKS[p.name] = p.rank; });

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
            <div class="modal-id mono">№ ${p.id} · Power Rank ${p.rank}</div>
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
