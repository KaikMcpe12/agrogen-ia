/* ============================================================
   AgroGen IA - Componentes Reutilizáveis e Helpers
   ============================================================ */

function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (v !== false && v != null) node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null || c === false) return;
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  });
  return node;
}

// ============ TOAST ============
function renderToast(msg, tipo = 'success') {
  const icons = { success: 'check-circle-2', error: 'x-circle', info: 'info', warn: 'alert-triangle' };
  const t = el('div', { class: `toast ${tipo}` }, [
    el('i', { 'data-lucide': icons[tipo] || 'info', style: 'width:18px;height:18px;' }),
    el('div', { class: 'grow', style: 'font-size:14px;font-weight:500;' }, [msg]),
    el('button', { class: 'icon-btn', style: 'width:24px;height:24px;border:0;background:transparent;', onClick: () => t.remove() },
      [el('i', { 'data-lucide': 'x', style: 'width:14px;height:14px;' })])
  ]);
  $('#toast-wrap').appendChild(t);
  lucide.createIcons();
  setTimeout(() => {
    t.style.transition = 'opacity .25s, transform .25s';
    t.style.opacity = '0';
    t.style.transform = 'translateY(10px)';
    setTimeout(() => t.remove(), 280);
  }, 3000);
}

// ============ MODAL ============
function renderModal({ title, body, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false, onConfirm, onCancel, hideConfirm = false }) {
  const root = $('#modal-root');
  const overlay = el('div', { class: 'modal-overlay' });
  const close = () => { overlay.remove(); onCancel && onCancel(); };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  const modal = el('div', { class: 'modal' }, [
    el('div', { class: 'modal-head' }, [
      el('h3', {}, [title]),
      el('button', { class: 'icon-btn', style: 'border:0;background:transparent;', onClick: close },
        [el('i', { 'data-lucide': 'x', style: 'width:16px;height:16px;' })])
    ]),
    el('div', { class: 'modal-body' }, typeof body === 'string' ? [el('div', { html: body })] : [body]),
    el('div', { class: 'modal-foot' }, [
      el('button', { class: 'btn btn-secondary', onClick: close }, [cancelText]),
      hideConfirm ? null : el('button', {
        class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'),
        onClick: () => { onConfirm && onConfirm(modal); overlay.remove(); }
      }, [confirmText])
    ])
  ]);
  overlay.appendChild(modal);
  root.appendChild(overlay);
  lucide.createIcons();
  return { modal, close };
}

// ============ BADGE ============
function renderBadgeEspecie(especie) {
  const cls = especie === 'Bovino' ? 'badge-bovino' : especie === 'Ovino' ? 'badge-ovino' : 'badge-caprino';
  return `<span class="badge ${cls}">${ESPECIE_EMOJI[especie] || ''} ${especie}</span>`;
}

function renderBadgeStatus(status) {
  const map = {
    'Prenha': 'badge-ok',
    'Ativa': 'badge-ghost',
    'Reprodutor ativo': 'badge-ghost',
    'Em observação': 'badge-warn',
    'Em repouso': 'badge-ghost',
    'Descartada': 'badge-danger',
  };
  return `<span class="badge ${map[status] || 'badge-ghost'}">${status}</span>`;
}

function renderBadgeResultado(r) {
  if (r === 'Prenha') return `<span class="badge badge-ok">Prenha</span>`;
  if (r === 'Falha') return `<span class="badge badge-danger">Falha</span>`;
  return `<span class="badge badge-warn">Aguardando</span>`;
}

// ============ LOADER ============
function renderLoader(texto = 'Processando dados genéticos...') {
  return el('div', { class: 'ai-loader' }, [
    el('div', { class: 'ai-spinner' }),
    el('div', { class: 'ai-loader-text', style: 'text-align:center;' }, [
      texto,
      el('span', { class: 'mono' }, ['> conectando modelo · analisando histórico · calculando probabilidades'])
    ])
  ]);
}

// ============ GAUGE PRENHEZ ============
function renderGaugePrenhez(percentual, container) {
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentual / 100) * circumference;
  let color = '#15803D', label = 'Alta probabilidade de sucesso';
  if (percentual < 65 && percentual >= 40) { color = '#D4A017'; label = 'Probabilidade moderada'; }
  if (percentual < 40) { color = '#B91C1C'; label = 'Baixa probabilidade — avalie o protocolo'; }

  container.innerHTML = `
    <div class="gauge-wrap">
      <div class="gauge">
        <svg width="240" height="240" viewBox="0 0 240 240">
          <circle class="circle-bg" cx="120" cy="120" r="${radius}"></circle>
          <circle class="circle-fg" cx="120" cy="120" r="${radius}"
            stroke="${color}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${circumference}"
            id="gauge-fg-circle"></circle>
        </svg>
        <div class="gauge-num">
          <div class="v">${percentual}<span class="pct">%</span></div>
          <div class="lbl">probabilidade de prenhez</div>
        </div>
      </div>
      <div style="margin-top:14px; padding:8px 14px; border-radius:999px;
        background:${color}22; color:${color}; font-weight:600; font-size:14px;">
        ${label}
      </div>
    </div>
  `;
  // animate
  setTimeout(() => {
    const c = container.querySelector('#gauge-fg-circle');
    if (c) c.setAttribute('stroke-dashoffset', offset);
  }, 100);
}

// ============ AUTOCOMPLETE ============
function setupAutocomplete(inputEl, listEl, source, onSelect, renderItem) {
  inputEl.addEventListener('input', () => {
    const q = inputEl.value.trim().toLowerCase();
    if (!q) { listEl.classList.remove('open'); return; }
    const items = source().filter(it => {
      const txt = (it.nome + ' ' + it.id + ' ' + it.raca).toLowerCase();
      return txt.includes(q);
    }).slice(0, 8);
    if (items.length === 0) { listEl.classList.remove('open'); return; }
    listEl.innerHTML = '';
    items.forEach(it => {
      const node = el('div', { class: 'autocomplete-item', onClick: () => { onSelect(it); listEl.classList.remove('open'); } });
      node.innerHTML = renderItem ? renderItem(it) :
        `<span>${ESPECIE_EMOJI[it.especie] || ''}</span><span><strong>${it.nome}</strong> · ${it.raca}</span><span class="id-mono" style="margin-left:auto;">${it.id}</span>`;
      listEl.appendChild(node);
    });
    listEl.classList.add('open');
  });
  document.addEventListener('click', (e) => {
    if (!listEl.contains(e.target) && e.target !== inputEl) listEl.classList.remove('open');
  });
}

// ============ AI SIMULATION ============
function preverPrenhez(animal, inseminacoes) {
  let score = 50;
  const historicoAnimal = inseminacoes.filter(i => i.animalId === animal.id);
  const resolvidas = historicoAnimal.filter(i => i.resultado !== 'Aguardando');
  const taxaHistorica = resolvidas.length > 0
    ? resolvidas.filter(i => i.resultado === 'Prenha').length / resolvidas.length
    : 0.5;
  score += taxaHistorica * 30;
  if (animal.condicaoCorporal >= 4) score += 10;
  if (animal.condicaoCorporal <= 2) score -= 15;
  const racasFerteis = ['Nelore', 'Gir', 'Santa Inês', 'Anglo Nubiana'];
  if (racasFerteis.includes(animal.raca)) score += 8;
  const ultimaIns = historicoAnimal.sort((a,b) => new Date(b.data) - new Date(a.data))[0];
  if (ultimaIns) {
    const diasDesde = (Date.now() - new Date(ultimaIns.data)) / 86400000;
    if (diasDesde < 21 && animal.especie === 'Bovino') score -= 20;
    if (diasDesde < 17 && (animal.especie === 'Ovino' || animal.especie === 'Caprino')) score -= 15;
    if (diasDesde > 60) score += 5;
  }
  return { score: Math.min(95, Math.max(5, Math.round(score))), taxaHistorica, ultimaIns, totalInsem: historicoAnimal.length };
}

function fatoresPrenhez(animal, result) {
  const fatores = [];
  if (result.taxaHistorica >= 0.6) fatores.push({ tipo: 'pos', txt: `Histórico positivo: ${Math.round(result.taxaHistorica*100)}% de sucesso em ${result.totalInsem} eventos anteriores` });
  else if (result.totalInsem > 0) fatores.push({ tipo: 'neg', txt: `Histórico abaixo da média: ${Math.round(result.taxaHistorica*100)}% de sucesso` });
  if (animal.condicaoCorporal >= 4) fatores.push({ tipo: 'pos', txt: `Boa condição corporal (${animal.condicaoCorporal}/5)` });
  else if (animal.condicaoCorporal <= 2) fatores.push({ tipo: 'neg', txt: `Condição corporal baixa (${animal.condicaoCorporal}/5) — risco elevado` });
  const racasFerteis = ['Nelore', 'Gir', 'Santa Inês', 'Anglo Nubiana'];
  if (racasFerteis.includes(animal.raca)) fatores.push({ tipo: 'pos', txt: `Raça ${animal.raca} com alta fertilidade na região do semiárido` });
  if (result.ultimaIns) {
    const dias = Math.floor((Date.now() - new Date(result.ultimaIns.data)) / 86400000);
    const limite = animal.especie === 'Bovino' ? 21 : 17;
    if (dias < limite) fatores.push({ tipo: 'warn', txt: `Intervalo curto desde última inseminação (${dias} dias)` });
    else if (dias > 60) fatores.push({ tipo: 'pos', txt: `Intervalo adequado desde último evento (${dias} dias)` });
  }
  if (fatores.length === 0) fatores.push({ tipo: 'pos', txt: 'Primeira inseminação registrada — sem histórico negativo' });
  return fatores;
}

function recomendacaoIA(animal, score) {
  if (score >= 65) return 'Excelente momento para inseminação. Protocolo padrão recomendado. Mantenha a condição corporal e ambiente controlado.';
  if (score >= 40) return 'Considere protocolo IATF para maximizar a sincronização. Avalie suplementação nutricional 30 dias antes do procedimento.';
  return 'Recomenda-se aguardar 15-21 dias para o próximo ciclo e melhorar a condição corporal. Avalie diagnóstico veterinário antes de nova tentativa.';
}

// ============ NAVIGATION ============
function navigate(page, params = {}) {
  AppState.currentPage = page;
  if (params.subpage) {
    if (page === 'animais') AppState.animaisSubpage = params.subpage;
    if (page === 'inseminacao') AppState.insemSubpage = params.subpage;
  }
  if (params.editId) AppState.editingAnimalId = params.editId;
  if (params.animalId) AppState.insemDraft.animalId = params.animalId;
  window.location.hash = page;
  renderPage();
  // close drawer if open
  $('#drawer').classList.remove('open');
  $('#drawer-overlay').classList.remove('open');
}

function setActiveNav(page) {
  $$('#main-nav a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
  $$('#drawer a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
}

// ============ CHARTS ============
let chartInstances = {};
function destroyChart(key) {
  if (chartInstances[key]) { chartInstances[key].destroy(); delete chartInstances[key]; }
}
function chartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    green: '#2D6A4F',
    greenLight: 'rgba(45, 106, 79, .85)',
    amber: '#D4A017',
    grid: isDark ? '#2A3A30' : '#E6E3DC',
    text: isDark ? '#D5D1C5' : '#3A3A3A',
  };
}

function makeBarLineChart(canvas, labels, bars, lines, key) {
  destroyChart(key);
  const c = chartColors();
  chartInstances[key] = new Chart(canvas, {
    data: {
      labels,
      datasets: [
        { type: 'bar', label: 'Inseminações', data: bars, backgroundColor: c.greenLight, borderRadius: 8, borderSkipped: false, yAxisID: 'y' },
        { type: 'line', label: 'Taxa de prenhez (%)', data: lines, borderColor: c.amber, backgroundColor: c.amber, tension: .35, borderWidth: 3, pointRadius: 4, pointBackgroundColor: c.amber, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: c.text, font: { family: 'Inter' } } } },
      scales: {
        x: { grid: { color: c.grid, drawBorder: false }, ticks: { color: c.text } },
        y: { beginAtZero: true, grid: { color: c.grid, drawBorder: false }, ticks: { color: c.text } },
        y1: { beginAtZero: true, max: 100, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: c.text, callback: v => v + '%' } }
      }
    }
  });
}
