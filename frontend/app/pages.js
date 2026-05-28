/* ============================================================
   AgroGen IA - Renderização das Páginas
   ============================================================ */

function renderPage() {
  const root = $('#page-root');
  root.innerHTML = '';
  setActiveNav(AppState.currentPage);
  const pageFns = {
    dashboard: renderDashboard,
    animais: renderAnimaisPage,
    inseminacao: renderInseminacaoPage,
    ia: renderAIPage,
    relatorios: renderRelatoriosPage,
    perfil: renderPerfilPage,
  };
  const fn = pageFns[AppState.currentPage] || renderDashboard;
  fn(root);
  lucide.createIcons();
  window.scrollTo(0, 0);
}

/* ====================== DASHBOARD ====================== */
function renderDashboard(root) {
  const animais = AppState.animais;
  const totalAnimais = animais.length;
  const bov = animais.filter(a => a.especie === 'Bovino').length;
  const ovi = animais.filter(a => a.especie === 'Ovino').length;
  const cap = animais.filter(a => a.especie === 'Caprino').length;

  // este mês
  const now = new Date();
  const insmonth = AppState.inseminacoes.filter(i => {
    const d = new Date(i.data);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const insLastMonth = AppState.inseminacoes.filter(i => {
    const d = new Date(i.data);
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
  });
  const monthDelta = insLastMonth.length === 0 ? 100 : Math.round((insmonth.length - insLastMonth.length) / insLastMonth.length * 100);
  const taxa = AppState.calcularTaxaPrenhez();
  const taxaBadge = taxa >= 60 ? 'badge-ok' : taxa >= 40 ? 'badge-warn' : 'badge-danger';
  const taxaTxt = taxa >= 60 ? 'Excelente' : taxa >= 40 ? 'Moderada' : 'Atenção';

  // alertas — animais aguardando diagnóstico
  const alertas = AppState.inseminacoes.filter(i => i.resultado === 'Aguardando').map(i => {
    const a = AppState.animais.find(x => x.id === i.animalId);
    if (!a) return null;
    const dias = daysBetween(i.data);
    const limite = a.especie === 'Bovino' ? 30 : 21;
    const restante = limite - dias;
    return { animal: a, insem: i, dias, restante };
  }).filter(x => x && x.restante <= 7).sort((a,b) => a.restante - b.restante).slice(0, 6);

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div class="title">
          <h1>Olá, ${AppState.currentUser?.nome?.split(' ')[0] || 'Produtor'} 👋</h1>
          <span class="subtitle">Resumo do rebanho · ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <div class="row">
          <button class="btn btn-secondary" onclick="navigate('relatorios')"><i data-lucide="file-text" style="width:16px;height:16px;"></i> Relatórios</button>
          <button class="btn btn-primary" onclick="navigate('inseminacao', {subpage:'wizard'})"><i data-lucide="plus" style="width:16px;height:16px;"></i> Nova inseminação</button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="card stat-card">
          <div class="stat-head">
            <span class="label">Animais cadastrados</span>
            <div class="icon-pill" style="background:var(--green-100); color:var(--green-900);"><i data-lucide="rabbit" style="width:18px;height:18px;"></i></div>
          </div>
          <div class="num">${totalAnimais}</div>
          <div class="meta">${bov} bovinos · ${ovi} ovinos · ${cap} caprinos</div>
        </div>
        <div class="card stat-card">
          <div class="stat-head">
            <span class="label">Inseminações no mês</span>
            <div class="icon-pill" style="background:var(--amber-bg); color:var(--warn);"><i data-lucide="syringe" style="width:18px;height:18px;"></i></div>
          </div>
          <div class="num">${insmonth.length}</div>
          <div class="meta"><span class="${monthDelta >= 0 ? 'trend-up' : 'trend-down'}">${monthDelta >= 0 ? '▲' : '▼'} ${Math.abs(monthDelta)}%</span> vs mês anterior</div>
        </div>
        <div class="card stat-card">
          <div class="stat-head">
            <span class="label">Taxa média de prenhez</span>
            <div class="icon-pill" style="background:var(--green-100); color:var(--green-900);"><i data-lucide="trending-up" style="width:18px;height:18px;"></i></div>
          </div>
          <div class="num">${taxa.toFixed(0)}%</div>
          <div class="meta"><span class="badge ${taxaBadge}">${taxaTxt}</span> · IA preditiva</div>
        </div>
        <div class="card stat-card">
          <div class="stat-head">
            <span class="label">Alertas ativos</span>
            <div class="icon-pill" style="background:var(--warn-bg); color:var(--warn);"><i data-lucide="bell-ring" style="width:18px;height:18px;"></i></div>
          </div>
          <div class="num">${alertas.length}</div>
          <div class="meta">Aguardando diagnóstico nos próximos 7 dias</div>
        </div>
      </div>

      <div class="dash-grid">
        <div class="card chart-card">
          <div class="chart-head">
            <div>
              <h3>Desempenho reprodutivo</h3>
              <div class="text-muted text-sm">Inseminações e taxa de prenhez nos últimos 6 meses</div>
            </div>
            <span class="badge badge-ghost">Últimos 6 meses</span>
          </div>
          <div class="chart-wrap"><canvas id="dash-chart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title">
            <i data-lucide="activity" style="width:18px;height:18px;color:var(--green-700);"></i>
            <h3>Atividades recentes</h3>
          </div>
          <div class="timeline" id="timeline"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <i data-lucide="calendar-clock" style="width:18px;height:18px;color:var(--warn);"></i>
          <h3>Próximos diagnósticos de gestação</h3>
        </div>
        <div class="table-wrap" id="alert-table"></div>
      </div>
    </div>
  `;

  // chart data
  const months = [];
  const monthsLabel = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ m: d.getMonth(), y: d.getFullYear() });
    monthsLabel.push(d.toLocaleDateString('pt-BR', { month: 'short' }));
  }
  const bars = months.map(({m,y}) => AppState.inseminacoes.filter(i => {
    const d = new Date(i.data);
    return d.getMonth() === m && d.getFullYear() === y;
  }).length);
  const taxasMes = months.map(({m,y}) => {
    const list = AppState.inseminacoes.filter(i => {
      const d = new Date(i.data);
      return d.getMonth() === m && d.getFullYear() === y && i.resultado !== 'Aguardando';
    });
    if (list.length === 0) return 0;
    return Math.round(list.filter(i => i.resultado === 'Prenha').length / list.length * 100);
  });
  makeBarLineChart($('#dash-chart'), monthsLabel, bars, taxasMes, 'dash');

  // timeline
  const tl = $('#timeline');
  const tipoIcon = {
    insem: { ico: 'syringe', bg: 'var(--amber-bg)', fg: 'var(--warn)' },
    ai: { ico: 'sparkles', bg: 'var(--green-100)', fg: 'var(--green-700)' },
    ok: { ico: 'check-circle-2', bg: 'var(--ok-bg)', fg: 'var(--ok)' },
    warn: { ico: 'alert-triangle', bg: 'var(--warn-bg)', fg: 'var(--warn)' },
    animal: { ico: 'rabbit', bg: 'var(--terra-200)', fg: 'var(--terra-700)' },
    report: { ico: 'file-bar-chart', bg: 'var(--green-100)', fg: 'var(--green-900)' },
    remove: { ico: 'trash-2', bg: 'var(--danger-bg)', fg: 'var(--danger)' },
  };
  AppState.atividades.slice(0, 6).forEach(a => {
    const t = tipoIcon[a.tipo] || tipoIcon.ai;
    tl.innerHTML += `
      <div class="timeline-item">
        <div class="timeline-dot" style="background:${t.bg};color:${t.fg};">
          <i data-lucide="${t.ico}" style="width:16px;height:16px;"></i>
        </div>
        <div class="timeline-content">
          <div class="text">${a.texto}</div>
          <div class="time">${fmtRelative(a.hora)}</div>
        </div>
      </div>
    `;
  });

  // alert table
  $('#alert-table').innerHTML = alertas.length === 0
    ? `<div style="padding:20px;text-align:center;color:var(--ink-3);font-size:14px;">Nenhum diagnóstico pendente nos próximos 7 dias.</div>`
    : `<table class="tbl">
      <thead><tr><th>Animal</th><th>Espécie</th><th>Data inseminação</th><th>Dias decorridos</th><th>Vence em</th><th>Ação</th></tr></thead>
      <tbody>${alertas.map(x => `
        <tr>
          <td><strong>${x.animal.nome}</strong> <span class="id-mono">${x.animal.id}</span></td>
          <td>${renderBadgeEspecie(x.animal.especie)}</td>
          <td>${fmtDate(x.insem.data)}</td>
          <td>${x.dias} dias</td>
          <td><span class="badge ${x.restante <= 2 ? 'badge-danger' : 'badge-warn'}">${x.restante} dias</span></td>
          <td><button class="btn btn-sm btn-secondary" onclick="openDiagnosticoModal('${x.insem.id}')"><i data-lucide="stethoscope" style="width:14px;height:14px;"></i> Registrar</button></td>
        </tr>
      `).join('')}</tbody>
    </table>`;
  lucide.createIcons();
}

/* ====================== ANIMAIS ====================== */
function renderAnimaisPage(root) {
  if (AppState.animaisSubpage === 'form') return renderAnimaisForm(root);
  renderAnimaisList(root);
}

function renderAnimaisList(root) {
  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div class="title">
          <h1>Animais</h1>
          <span class="subtitle">${AppState.animais.length} animais cadastrados no rebanho</span>
        </div>
        <button class="btn btn-primary" onclick="newAnimal()"><i data-lucide="plus" style="width:16px;height:16px;"></i> Cadastrar animal</button>
      </div>

      <div class="filter-row">
        <div class="grow" style="position:relative;">
          <i data-lucide="search" style="width:16px;height:16px;position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--ink-3);"></i>
          <input class="input" id="f-search" placeholder="Buscar por nome ou identificador..." style="padding-left:36px;" />
        </div>
        <select class="select" id="f-especie">
          <option value="">Todas as espécies</option><option>Bovino</option><option>Ovino</option><option>Caprino</option>
        </select>
        <select class="select" id="f-sexo">
          <option value="">Todos os sexos</option><option>Fêmea</option><option>Macho</option>
        </select>
        <select class="select" id="f-raca">
          <option value="">Todas as raças</option>
          ${[...new Set(AppState.animais.map(a=>a.raca))].sort().map(r => `<option>${r}</option>`).join('')}
        </select>
      </div>

      <div id="animais-table"></div>
      <div id="animais-pag" style="display:flex;justify-content:center;gap:6px;margin-top:18px;"></div>
    </div>
  `;
  let page = 1;
  const perPage = 10;
  function refresh() {
    const q = $('#f-search').value.trim().toLowerCase();
    const fe = $('#f-especie').value;
    const fs = $('#f-sexo').value;
    const fr = $('#f-raca').value;
    let list = AppState.animais.filter(a => {
      if (q && !(a.nome.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))) return false;
      if (fe && a.especie !== fe) return false;
      if (fs && a.sexo !== fs) return false;
      if (fr && a.raca !== fr) return false;
      return true;
    });
    const totalPages = Math.max(1, Math.ceil(list.length / perPage));
    if (page > totalPages) page = totalPages;
    const slice = list.slice((page - 1) * perPage, page * perPage);

    $('#animais-table').innerHTML = `
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>ID</th><th>Nome</th><th>Espécie</th><th>Raça</th><th>Sexo</th><th>Linhagem</th><th>Histórico</th><th>Status</th><th style="text-align:right;">Ações</th></tr></thead>
          <tbody>
            ${slice.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--ink-3);">Nenhum animal encontrado.</td></tr>` : slice.map(a => `
              <tr>
                <td><span class="id-mono">${a.id}</span></td>
                <td><strong>${a.nome}</strong></td>
                <td>${renderBadgeEspecie(a.especie)}</td>
                <td>${a.raca}</td>
                <td>${a.sexo}</td>
                <td>${a.linhagem}</td>
                <td>${a.historico}</td>
                <td>${renderBadgeStatus(a.status)}</td>
                <td>
                  <div class="row-actions" style="justify-content:flex-end;">
                    <button class="icon-btn" title="Detalhes" onclick="openAnimalDetail('${a.id}')"><i data-lucide="eye" style="width:14px;height:14px;"></i></button>
                    <button class="icon-btn" title="Registrar inseminação" onclick="navigate('inseminacao',{subpage:'wizard',animalId:'${a.id}'})"><i data-lucide="syringe" style="width:14px;height:14px;"></i></button>
                    <button class="icon-btn" title="Editar" onclick="editAnimal('${a.id}')"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
                    <button class="icon-btn" title="Excluir" onclick="confirmRemoveAnimal('${a.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    // pagination
    const pag = $('#animais-pag');
    pag.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const b = el('button', {
        class: 'btn ' + (i === page ? 'btn-primary' : 'btn-secondary') + ' btn-sm',
        onClick: () => { page = i; refresh(); }
      }, [String(i)]);
      pag.appendChild(b);
    }
    lucide.createIcons();
  }
  ['f-search', 'f-especie', 'f-sexo', 'f-raca'].forEach(id => {
    const e = $('#' + id);
    e.addEventListener('input', () => { page = 1; refresh(); });
    e.addEventListener('change', () => { page = 1; refresh(); });
  });
  refresh();
}

function newAnimal() {
  AppState.editingAnimalId = null;
  navigate('animais', { subpage: 'form' });
}
function editAnimal(id) {
  AppState.editingAnimalId = id;
  navigate('animais', { subpage: 'form' });
}
function confirmRemoveAnimal(id) {
  const a = AppState.animais.find(x => x.id === id);
  if (!a) return;
  renderModal({
    title: 'Excluir animal',
    body: `<p>Tem certeza que deseja excluir <strong>${a.nome}</strong> (${a.id})? Esta ação não pode ser desfeita.</p>`,
    confirmText: 'Excluir',
    danger: true,
    onConfirm: () => {
      AppState.removerAnimal(id);
      renderToast('Animal excluído com sucesso', 'success');
      renderPage();
    }
  });
}
function openAnimalDetail(id) {
  const a = AppState.animais.find(x => x.id === id);
  if (!a) return;
  const insems = AppState.inseminacoes.filter(i => i.animalId === id);
  const body = el('div', {}, [
    el('div', { class: 'row', style: 'gap:14px;margin-bottom:18px;align-items:center;' }, [
      el('div', { style: 'width:60px;height:60px;border-radius:14px;background:var(--beige);display:grid;place-items:center;font-size:32px;' }, [ESPECIE_EMOJI[a.especie]]),
      el('div', { class: 'col', style: 'gap:2px;' }, [
        el('h3', {}, [a.nome]),
        el('div', { html: `${renderBadgeEspecie(a.especie)} · ${a.raca} · ${a.sexo}` }),
        el('div', { class: 'text-xs text-muted', style: 'margin-top:4px;' }, [a.id + ' · Brinco ' + (a.brinco||'—')])
      ])
    ]),
    el('div', { class: 'form-row-3' }, [
      el('div', {}, [el('div', { class: 'text-xs text-muted' }, ['Peso']), el('div', { style: 'font-weight:600;' }, [(a.peso||'—') + ' kg'])]),
      el('div', {}, [el('div', { class: 'text-xs text-muted' }, ['Condição corporal']), el('div', { style: 'font-weight:600;' }, [(a.condicaoCorporal||'—') + '/5'])]),
      el('div', {}, [el('div', { class: 'text-xs text-muted' }, ['Nascimento']), el('div', { style: 'font-weight:600;' }, [a.nascimento ? fmtDate(a.nascimento) : '—'])]),
    ]),
    el('div', { style: 'margin-top:14px;' }, [
      el('div', { class: 'text-xs text-muted' }, ['Status reprodutivo']),
      el('div', { html: renderBadgeStatus(a.status), style: 'margin-top:4px;' })
    ]),
    el('div', { class: 'section-block' }, [
      el('div', { class: 'section-title' }, ['Histórico reprodutivo (' + insems.length + ')']),
      insems.length === 0
        ? el('div', { class: 'text-sm text-muted' }, ['Nenhuma inseminação registrada.'])
        : el('div', { html: `<table class="tbl" style="width:100%;font-size:13px;"><thead><tr><th>Data</th><th>Reprodutor</th><th>Resultado</th></tr></thead><tbody>${insems.map(i => `<tr><td>${fmtDate(i.data)}</td><td>${i.reprodutor}</td><td>${renderBadgeResultado(i.resultado)}</td></tr>`).join('')}</tbody></table>` })
    ])
  ]);
  renderModal({ title: 'Detalhes do animal', body, confirmText: 'Fechar', hideConfirm: true, cancelText: 'Fechar' });
}

function renderAnimaisForm(root) {
  const editing = AppState.editingAnimalId ? AppState.animais.find(a => a.id === AppState.editingAnimalId) : null;
  const draft = editing ? { ...editing } : {
    id: AppState.getProximoId('Bovino'),
    nome: '',
    especie: 'Bovino',
    raca: 'Nelore',
    sexo: 'Fêmea',
    nascimento: '',
    peso: '',
    brinco: '',
    linhagem: '',
    pai: '',
    mae: '',
    dep: '',
    certificado: '',
    obsGenetica: '',
    partos: 0,
    ultimoParto: '',
    status: 'Ativa',
    historico: '0 partos',
    condicaoCorporal: 3,
  };

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div class="title">
          <button class="btn btn-ghost btn-sm" onclick="navigate('animais',{subpage:'list'})" style="padding-left:0;">
            <i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Voltar para listagem
          </button>
          <h1>${editing ? 'Editar animal' : 'Cadastrar novo animal'}</h1>
          <span class="subtitle">${editing ? `Editando ${editing.nome} (${editing.id})` : 'Preencha os dados do animal abaixo'}</span>
        </div>
      </div>

      <form id="animal-form" class="card" style="padding:24px;">

        <!-- IDENTIFICAÇÃO -->
        <div class="section-block">
          <div class="section-title"><i data-lucide="badge-info" style="width:14px;height:14px;"></i> Identificação</div>
          <div class="form-row">
            <div class="form-group">
              <label>ID do animal <span class="req">*</span></label>
              <input class="input" id="f-id" value="${draft.id}" />
            </div>
            <div class="form-group">
              <label>Nome <span class="req">*</span></label>
              <input class="input" id="f-nome" value="${draft.nome}" required />
            </div>
          </div>

          <div class="form-group">
            <label>Espécie <span class="req">*</span></label>
            <div class="radio-cards" id="f-especie-cards">
              ${['Bovino','Ovino','Caprino'].map(e => `
                <div class="radio-card ${draft.especie===e?'active':''}" data-val="${e}">
                  <div class="emoji">${ESPECIE_EMOJI[e]}</div>
                  <div class="label">${e}</div>
                </div>`).join('')}
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Raça <span class="req">*</span></label>
              <select class="select" id="f-raca"></select>
            </div>
            <div class="form-group">
              <label>Sexo <span class="req">*</span></label>
              <div class="toggle-group" id="f-sexo-toggle">
                <div class="toggle-pill ${draft.sexo==='Fêmea'?'active':''}" data-val="Fêmea">♀ Fêmea</div>
                <div class="toggle-pill ${draft.sexo==='Macho'?'active':''}" data-val="Macho">♂ Macho</div>
              </div>
            </div>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label>Data de nascimento</label>
              <input class="input" type="date" id="f-nasc" value="${draft.nascimento}" />
            </div>
            <div class="form-group">
              <label>Peso atual (kg)</label>
              <input class="input" type="number" min="0" step="0.1" id="f-peso" value="${draft.peso}" />
            </div>
            <div class="form-group">
              <label>Brinco / Tatuagem</label>
              <input class="input" id="f-brinco" value="${draft.brinco}" />
            </div>
          </div>
        </div>

        <!-- GENÉTICA -->
        <div class="section-block">
          <div class="section-title"><i data-lucide="dna" style="width:14px;height:14px;"></i> Dados genéticos</div>
          <div class="form-row">
            <div class="form-group">
              <label>Linhagem / Genealogia</label>
              <input class="input" id="f-linhagem" value="${draft.linhagem}" placeholder="Ex: Linhagem A" />
            </div>
            <div class="form-group">
              <label>DEP — Diferença Esperada na Progênie
                <span class="text-xs text-muted" title="Indicador genético do potencial transmitido aos descendentes">ⓘ</span>
              </label>
              <input class="input" type="number" step="0.01" id="f-dep" value="${draft.dep||''}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Pai (ID ou nome)</label>
              <input class="input" id="f-pai" value="${draft.pai||''}" />
            </div>
            <div class="form-group">
              <label>Mãe (ID ou nome)</label>
              <input class="input" id="f-mae" value="${draft.mae||''}" />
            </div>
          </div>
          <div class="form-group">
            <label>Certificado de registro genético</label>
            <div class="row">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('f-cert').click()">
                <i data-lucide="upload" style="width:14px;height:14px;"></i> Selecionar arquivo
              </button>
              <input type="file" id="f-cert" style="display:none;" onchange="document.getElementById('cert-name').textContent = this.files[0]?.name || 'Nenhum arquivo'" />
              <span class="text-sm text-muted" id="cert-name">${draft.certificado||'Nenhum arquivo selecionado'}</span>
            </div>
          </div>
          <div class="form-group">
            <label>Observações genéticas</label>
            <textarea class="input" id="f-obs-gen">${draft.obsGenetica||''}</textarea>
          </div>
        </div>

        <!-- REPRODUTIVO -->
        <div class="section-block">
          <div class="section-title"><i data-lucide="heart" style="width:14px;height:14px;"></i> Histórico reprodutivo</div>
          <div class="form-row-3">
            <div class="form-group">
              <label>Partos / crias anteriores</label>
              <input class="input" type="number" min="0" id="f-partos" value="${draft.partos||0}" />
            </div>
            <div class="form-group">
              <label>Data do último parto</label>
              <input class="input" type="date" id="f-ultimo-parto" value="${draft.ultimoParto||''}" />
            </div>
            <div class="form-group">
              <label>Status reprodutivo</label>
              <select class="select" id="f-status">
                ${STATUS_REPRO.map(s => `<option ${s===draft.status?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Condição corporal (1 a 5)</label>
            <div class="cc-scale">
              <input type="range" id="f-cc" min="1" max="5" step="1" value="${draft.condicaoCorporal||3}" oninput="document.getElementById('cc-val').textContent=this.value;" />
              <div class="cc-display" id="cc-val">${draft.condicaoCorporal||3}</div>
            </div>
          </div>
        </div>

        <div class="section-block" style="display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:18px;">
          <button type="submit" class="btn btn-primary"><i data-lucide="check" style="width:16px;height:16px;"></i> Salvar animal</button>
          <button type="button" class="btn btn-amber" onclick="document.getElementById('animal-form').dataset.next='ins'; document.getElementById('animal-form').requestSubmit();">
            <i data-lucide="syringe" style="width:16px;height:16px;"></i> Salvar e registrar inseminação
          </button>
          <button type="button" class="btn btn-secondary" onclick="navigate('animais',{subpage:'list'})">Cancelar</button>
        </div>

      </form>
    </div>
  `;

  // raca dropdown dinâmico
  function refreshRacas() {
    const esp = draft.especie;
    const sel = $('#f-raca');
    sel.innerHTML = RACAS[esp].map(r => `<option ${r===draft.raca?'selected':''}>${r}</option>`).join('');
    if (!RACAS[esp].includes(draft.raca)) draft.raca = RACAS[esp][0];
  }
  refreshRacas();

  $$('#f-especie-cards .radio-card').forEach(c => c.addEventListener('click', () => {
    $$('#f-especie-cards .radio-card').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    draft.especie = c.dataset.val;
    if (!AppState.editingAnimalId) $('#f-id').value = AppState.getProximoId(draft.especie);
    refreshRacas();
  }));
  $$('#f-sexo-toggle .toggle-pill').forEach(p => p.addEventListener('click', () => {
    $$('#f-sexo-toggle .toggle-pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    draft.sexo = p.dataset.val;
  }));

  $('#animal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = $('#f-nome').value.trim();
    if (!nome) { renderToast('Informe o nome do animal', 'error'); return; }
    const nasc = $('#f-nasc').value;
    if (nasc && new Date(nasc) > new Date()) { renderToast('Data de nascimento não pode ser futura', 'error'); return; }
    const peso = parseFloat($('#f-peso').value) || 0;
    if (peso < 0) { renderToast('Peso deve ser número positivo', 'error'); return; }

    const animal = {
      id: $('#f-id').value || AppState.getProximoId(draft.especie),
      nome,
      especie: draft.especie,
      raca: $('#f-raca').value,
      sexo: draft.sexo,
      nascimento: nasc,
      peso,
      brinco: $('#f-brinco').value,
      linhagem: $('#f-linhagem').value || 'Linhagem ' + draft.especie[0],
      pai: $('#f-pai').value,
      mae: $('#f-mae').value,
      dep: $('#f-dep').value,
      certificado: $('#cert-name').textContent !== 'Nenhum arquivo selecionado' ? $('#cert-name').textContent : '',
      obsGenetica: $('#f-obs-gen').value,
      partos: parseInt($('#f-partos').value) || 0,
      ultimoParto: $('#f-ultimo-parto').value,
      status: $('#f-status').value,
      condicaoCorporal: parseInt($('#f-cc').value) || 3,
      historico: ($('#f-partos').value || '0') + ' parto' + ($('#f-partos').value === '1' ? '' : 's')
    };

    const next = e.target.dataset.next;
    if (AppState.editingAnimalId) {
      AppState.atualizarAnimal(AppState.editingAnimalId, animal);
      renderToast('Animal atualizado com sucesso!', 'success');
    } else {
      AppState.adicionarAnimal(animal);
      renderToast('Animal cadastrado com sucesso!', 'success');
    }
    AppState.editingAnimalId = null;
    if (next === 'ins') navigate('inseminacao', { subpage: 'wizard', animalId: animal.id });
    else navigate('animais', { subpage: 'list' });
  });

  lucide.createIcons();
}

/* ====================== INSEMINAÇÃO ====================== */
function renderInseminacaoPage(root) {
  if (AppState.insemSubpage === 'history') return renderInseminacaoHistory(root);
  renderInseminacaoWizard(root);
}

function renderInseminacaoWizard(root) {
  const step = AppState.insemStep;
  const draft = AppState.insemDraft;

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div class="title">
          <h1>Registrar inseminação</h1>
          <span class="subtitle">Siga os 4 passos para registrar um novo evento de IA</span>
        </div>
        <div class="row">
          <button class="btn btn-secondary" onclick="AppState.insemSubpage='history'; renderPage();"><i data-lucide="history" style="width:16px;height:16px;"></i> Ver histórico</button>
        </div>
      </div>

      <div class="card" style="padding:28px;">
        <div class="stepper">
          ${[1,2,3,4].map((n,i) => `
            <div class="step-item ${step===n?'active':''} ${step>n?'done':''}" onclick="if(${n}<=${step})AppState.insemStep=${n},renderPage()">
              <div class="step-circle">${step>n?'✓':n}</div>
              <div class="step-label">${['Selecionar animal','Reprodutor/Sêmen','Dados do evento','Confirmação'][i]}</div>
            </div>
            ${n<4?'<div class="step-line"></div>':''}
          `).join('')}
        </div>

        <div id="step-content"></div>
      </div>
    </div>
  `;
  const content = $('#step-content');
  if (step === 1) renderInsemStep1(content);
  else if (step === 2) renderInsemStep2(content);
  else if (step === 3) renderInsemStep3(content);
  else if (step === 4) renderInsemStep4(content);
  lucide.createIcons();
}

function renderInsemStep1(c) {
  const draft = AppState.insemDraft;
  const animal = draft.animalId ? AppState.animais.find(a => a.id === draft.animalId) : null;
  c.innerHTML = `
    <h3 style="margin-bottom:14px;">1. Qual animal será inseminado?</h3>
    <div class="form-group autocomplete">
      <label>Buscar animal (nome ou ID)</label>
      <input class="input" id="ins-search" placeholder="Ex: Mimosa ou BOV-001" autocomplete="off" />
      <div class="autocomplete-list" id="ins-ac-list"></div>
    </div>
    <div id="selected-animal"></div>
    <div style="display:flex;justify-content:flex-end;margin-top:24px;">
      <button class="btn btn-primary" id="ins-next-1" ${animal?'':'disabled'}>Próximo <i data-lucide="arrow-right" style="width:14px;height:14px;"></i></button>
    </div>
  `;
  const ac = $('#ins-ac-list');
  setupAutocomplete($('#ins-search'), ac,
    () => AppState.animais.filter(a => a.sexo === 'Fêmea'),
    (a) => { draft.animalId = a.id; renderInsemStep1(c); lucide.createIcons(); }
  );
  function showSel() {
    const a = AppState.animais.find(x => x.id === draft.animalId);
    if (!a) { $('#selected-animal').innerHTML = ''; return; }
    const ultima = AppState.inseminacoes.filter(i => i.animalId === a.id).sort((x,y)=>new Date(y.data)-new Date(x.data))[0];
    const dias = ultima ? daysBetween(ultima.data) : null;
    const limite = a.especie === 'Bovino' ? 21 : 17;
    const alerta = ultima && dias < limite;
    $('#selected-animal').innerHTML = `
      <div class="animal-pick" style="margin-top:8px;">
        <div class="ava">${ESPECIE_EMOJI[a.especie]}</div>
        <div class="info">
          <div class="name">${a.nome} <span class="id-mono" style="font-weight:400;color:var(--ink-3);">${a.id}</span></div>
          <div class="meta">${renderBadgeEspecie(a.especie)} · ${a.raca} · ${a.sexo} · ${renderBadgeStatus(a.status)}</div>
          <div class="meta" style="margin-top:4px;">Último ciclo: ${ultima ? fmtDate(ultima.data) + ' (' + dias + ' dias)' : 'sem registros'}</div>
        </div>
      </div>
      ${alerta ? `<div class="recommendation" style="margin-top:12px;"><i data-lucide="alert-triangle" style="width:18px;height:18px;"></i><div><div class="ttl">Atenção: inseminação recente</div><div class="txt">Este animal foi inseminado há ${dias} dias. Para ${a.especie.toLowerCase()}s, recomenda-se aguardar pelo menos ${limite} dias entre eventos.</div></div></div>` : ''}
    `;
  }
  if (draft.animalId) showSel();
  $('#ins-next-1').addEventListener('click', () => {
    if (!draft.animalId) return;
    AppState.insemStep = 2;
    renderPage();
  });
  lucide.createIcons();
}

function renderInsemStep2(c) {
  const draft = AppState.insemDraft;
  c.innerHTML = `
    <h3 style="margin-bottom:14px;">2. Reprodutor e sêmen</h3>
    <div class="form-group">
      <label>Tipo de inseminação <span class="req">*</span></label>
      <div class="radio-cards" id="ins-tipo">
        ${['IA Convencional','IATF','Transferência de Embrião'].map(t => `
          <div class="radio-card ${draft.tipo===t?'active':''}" data-val="${t}" style="text-align:left;padding:14px;">
            <div class="emoji" style="font-size:18px;">${t==='IATF'?'⚙️':t==='IA Convencional'?'💉':'🧬'}</div>
            <div class="label">${t}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="form-group">
      <label>Origem do reprodutor</label>
      <div class="toggle-group" id="ins-rep-toggle">
        <div class="toggle-pill ${draft.reprodutorTipo==='interno'?'active':''}" data-val="interno">Reprodutor cadastrado</div>
        <div class="toggle-pill ${draft.reprodutorTipo==='externo'?'active':''}" data-val="externo">Sêmen externo</div>
      </div>
    </div>

    <div id="rep-interno" style="${draft.reprodutorTipo==='externo'?'display:none;':''}">
      <div class="form-group autocomplete">
        <label>Buscar reprodutor</label>
        <input class="input" id="ins-rep-search" value="${draft.reprodutorTipo==='interno'?draft.reprodutor:''}" placeholder="Ex: Trovão ou BOV-002" autocomplete="off" />
        <div class="autocomplete-list" id="ins-rep-ac"></div>
      </div>
    </div>

    <div id="rep-externo" style="${draft.reprodutorTipo==='interno'?'display:none;':''}">
      <div class="form-row">
        <div class="form-group">
          <label>Touro/Carneiro/Bode</label>
          <input class="input" id="ext-touro" value="${draft.semenExterno.touro}" />
        </div>
        <div class="form-group">
          <label>Raça</label>
          <input class="input" id="ext-raca" value="${draft.semenExterno.raca}" />
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Registro</label>
          <input class="input" id="ext-reg" value="${draft.semenExterno.registro}" />
        </div>
        <div class="form-group">
          <label>Empresa fornecedora</label>
          <input class="input" id="ext-emp" value="${draft.semenExterno.empresa}" />
        </div>
        <div class="form-group">
          <label>Dose nº</label>
          <input class="input" id="ext-dose" value="${draft.semenExterno.dose}" />
        </div>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Palheta / Lote</label>
        <input class="input" id="ins-palheta" value="${draft.palheta}" />
      </div>
      <div class="form-group">
        <label>Técnico responsável</label>
        <select class="select" id="ins-tec">
          ${TECNICOS.map(t => `<option ${t===draft.tecnico?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-top:24px;">
      <button class="btn btn-secondary" onclick="AppState.insemStep=1;renderPage();"><i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Voltar</button>
      <button class="btn btn-primary" id="ins-next-2">Próximo <i data-lucide="arrow-right" style="width:14px;height:14px;"></i></button>
    </div>
  `;
  $$('#ins-tipo .radio-card').forEach(c2 => c2.addEventListener('click', () => {
    $$('#ins-tipo .radio-card').forEach(x => x.classList.remove('active'));
    c2.classList.add('active');
    draft.tipo = c2.dataset.val;
  }));
  $$('#ins-rep-toggle .toggle-pill').forEach(p => p.addEventListener('click', () => {
    $$('#ins-rep-toggle .toggle-pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    draft.reprodutorTipo = p.dataset.val;
    $('#rep-interno').style.display = draft.reprodutorTipo === 'interno' ? '' : 'none';
    $('#rep-externo').style.display = draft.reprodutorTipo === 'externo' ? '' : 'none';
  }));
  setupAutocomplete($('#ins-rep-search'), $('#ins-rep-ac'),
    () => AppState.animais.filter(a => a.sexo === 'Macho'),
    (a) => { draft.reprodutor = `${a.nome} (${a.id})`; $('#ins-rep-search').value = draft.reprodutor; $('#ins-rep-ac').classList.remove('open'); }
  );
  $('#ins-next-2').addEventListener('click', () => {
    if (draft.reprodutorTipo === 'interno') {
      draft.reprodutor = $('#ins-rep-search').value.trim();
      if (!draft.reprodutor) { renderToast('Selecione um reprodutor', 'error'); return; }
    } else {
      draft.semenExterno = {
        touro: $('#ext-touro').value, raca: $('#ext-raca').value,
        registro: $('#ext-reg').value, empresa: $('#ext-emp').value, dose: $('#ext-dose').value,
      };
      draft.reprodutor = `Sêmen externo - ${draft.semenExterno.touro || 'Não identificado'}`;
      if (!draft.semenExterno.touro) { renderToast('Informe o nome do reprodutor externo', 'error'); return; }
    }
    draft.palheta = $('#ins-palheta').value;
    draft.tecnico = $('#ins-tec').value;
    AppState.insemStep = 3;
    renderPage();
  });
  lucide.createIcons();
}

function renderInsemStep3(c) {
  const draft = AppState.insemDraft;
  c.innerHTML = `
    <h3 style="margin-bottom:14px;">3. Dados do evento</h3>
    <div class="form-row">
      <div class="form-group">
        <label>Data e hora <span class="req">*</span></label>
        <input class="input" type="datetime-local" id="ev-data" value="${draft.data}" />
      </div>
      <div class="form-group">
        <label>Temperatura ambiente (°C)</label>
        <input class="input" type="number" step="0.1" id="ev-temp" value="${draft.temperatura}" />
      </div>
    </div>
    <div class="form-group">
      <label>Fase do cio / protocolo hormonal</label>
      <input class="input" id="ev-fase" value="${draft.fase}" placeholder="Ex: Protocolo IATF — 9 dias com CIDR + EB" />
    </div>
    <div class="form-group">
      <label>Condição corporal da fêmea (1 a 5)</label>
      <div class="cc-scale">
        <input type="range" id="ev-cc" min="1" max="5" step="1" value="${draft.condicao}" oninput="document.getElementById('ev-cc-val').textContent=this.value;" />
        <div class="cc-display" id="ev-cc-val">${draft.condicao}</div>
      </div>
    </div>
    <div class="form-group">
      <label>Observações do técnico</label>
      <textarea class="input" id="ev-obs">${draft.observacoes}</textarea>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:24px;">
      <button class="btn btn-secondary" onclick="AppState.insemStep=2;renderPage();"><i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Voltar</button>
      <button class="btn btn-primary" id="ins-next-3">Próximo <i data-lucide="arrow-right" style="width:14px;height:14px;"></i></button>
    </div>
  `;
  $('#ins-next-3').addEventListener('click', () => {
    draft.data = $('#ev-data').value;
    draft.temperatura = parseFloat($('#ev-temp').value);
    draft.fase = $('#ev-fase').value;
    draft.condicao = parseInt($('#ev-cc').value);
    draft.observacoes = $('#ev-obs').value;
    AppState.insemStep = 4;
    renderPage();
  });
  lucide.createIcons();
}

function renderInsemStep4(c) {
  const draft = AppState.insemDraft;
  const a = AppState.animais.find(x => x.id === draft.animalId);
  c.innerHTML = `
    <h3 style="margin-bottom:14px;">4. Revisão e confirmação</h3>
    <div class="card" style="background:var(--beige);padding:18px;">
      <div class="form-row-3" style="gap:18px;">
        <div><div class="text-xs text-muted">Animal</div><div style="font-weight:600;">${a?.nome} <span class="id-mono">${a?.id}</span></div></div>
        <div><div class="text-xs text-muted">Espécie / Raça</div><div style="font-weight:600;">${a?.especie} · ${a?.raca}</div></div>
        <div><div class="text-xs text-muted">Tipo</div><div style="font-weight:600;">${draft.tipo}</div></div>
        <div><div class="text-xs text-muted">Reprodutor</div><div style="font-weight:600;">${draft.reprodutor}</div></div>
        <div><div class="text-xs text-muted">Palheta / Lote</div><div style="font-weight:600;">${draft.palheta||'—'}</div></div>
        <div><div class="text-xs text-muted">Técnico</div><div style="font-weight:600;">${draft.tecnico}</div></div>
        <div><div class="text-xs text-muted">Data e hora</div><div style="font-weight:600;">${fmtDateTime(draft.data)}</div></div>
        <div><div class="text-xs text-muted">Temperatura</div><div style="font-weight:600;">${draft.temperatura} °C</div></div>
        <div><div class="text-xs text-muted">Condição corporal</div><div style="font-weight:600;">${draft.condicao}/5</div></div>
      </div>
      ${draft.fase?`<div style="margin-top:14px;"><div class="text-xs text-muted">Protocolo / Fase</div><div>${draft.fase}</div></div>`:''}
      ${draft.observacoes?`<div style="margin-top:14px;"><div class="text-xs text-muted">Observações</div><div>${draft.observacoes}</div></div>`:''}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:24px;">
      <button class="btn btn-secondary" onclick="AppState.insemStep=3;renderPage();"><i data-lucide="pencil" style="width:14px;height:14px;"></i> Editar</button>
      <button class="btn btn-primary btn-lg" id="ins-confirm"><i data-lucide="check" style="width:16px;height:16px;"></i> Confirmar e salvar</button>
    </div>
  `;
  $('#ins-confirm').addEventListener('click', () => {
    const id = 'INS-' + String(AppState.inseminacoes.length + 1).padStart(3, '0');
    AppState.registrarInseminacao({
      id, animalId: draft.animalId, tipo: draft.tipo, reprodutor: draft.reprodutor,
      data: draft.data, tecnico: draft.tecnico, palheta: draft.palheta,
      condicao: draft.condicao, temperatura: draft.temperatura, fase: draft.fase,
      observacoes: draft.observacoes, resultado: 'Aguardando',
    });
    // reset draft
    AppState.insemStep = 1;
    AppState.insemDraft = {
      animalId: null, tipo: 'IATF', reprodutor: '', reprodutorTipo: 'interno',
      semenExterno: { touro:'', raca:'', registro:'', empresa:'', dose:'' },
      palheta:'', tecnico:'João Silva',
      data: new Date().toISOString().slice(0,16), fase:'', condicao:3, temperatura:28, observacoes:'',
    };
    renderToast('Inseminação registrada com sucesso!', 'success');
    navigate('dashboard');
  });
  lucide.createIcons();
}

function renderInseminacaoHistory(root) {
  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div class="title">
          <h1>Histórico de inseminações</h1>
          <span class="subtitle">${AppState.inseminacoes.length} eventos registrados</span>
        </div>
        <div class="row">
          <button class="btn btn-secondary" onclick="AppState.insemSubpage='wizard';renderPage();"><i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Voltar</button>
          <button class="btn btn-primary" onclick="AppState.insemStep=1;AppState.insemSubpage='wizard';AppState.insemDraft.animalId=null;renderPage();"><i data-lucide="plus" style="width:14px;height:14px;"></i> Novo evento</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Animal</th><th>Espécie</th><th>Reprodutor</th><th>Data</th><th>Técnico</th><th>Status</th><th style="text-align:right;">Ação</th></tr></thead>
          <tbody>
            ${AppState.inseminacoes.map(i => {
              const a = AppState.animais.find(x => x.id === i.animalId);
              return `
                <tr>
                  <td><strong>${a?.nome||i.animalId}</strong> <span class="id-mono">${i.animalId}</span></td>
                  <td>${a?renderBadgeEspecie(a.especie):'—'}</td>
                  <td>${i.reprodutor}</td>
                  <td>${fmtDate(i.data)}</td>
                  <td>${i.tecnico}</td>
                  <td>${renderBadgeResultado(i.resultado)}</td>
                  <td style="text-align:right;">
                    ${i.resultado === 'Aguardando'
                      ? `<button class="btn btn-sm btn-secondary" onclick="openDiagnosticoModal('${i.id}')"><i data-lucide="stethoscope" style="width:14px;height:14px;"></i> Diagnóstico</button>`
                      : `<span class="text-xs text-muted">${i.dataDiagnostico?fmtDate(i.dataDiagnostico):'—'}</span>`}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  lucide.createIcons();
}

function openDiagnosticoModal(insemId) {
  const ins = AppState.inseminacoes.find(i => i.id === insemId);
  if (!ins) return;
  const a = AppState.animais.find(x => x.id === ins.animalId);
  const body = el('div', {}, [
    el('p', { class: 'text-sm text-muted', style: 'margin-bottom:14px;' }, [`Animal: ${a?.nome} · Inseminação em ${fmtDate(ins.data)}`]),
    el('div', { class: 'form-group' }, [
      el('label', {}, ['Resultado do diagnóstico']),
      el('div', { class: 'toggle-group', id: 'diag-toggle' }, [
        el('div', { class: 'toggle-pill active', 'data-val': 'Prenha', style: 'border-color:var(--ok);color:var(--ok);' }, ['✓ Prenha']),
        el('div', { class: 'toggle-pill', 'data-val': 'Falha' }, ['✗ Não prenha'])
      ])
    ]),
    el('div', { class: 'form-group' }, [
      el('label', {}, ['Data do diagnóstico']),
      el('input', { class: 'input', type: 'date', id: 'diag-data', value: new Date().toISOString().split('T')[0] })
    ])
  ]);
  let escolha = 'Prenha';
  setTimeout(() => {
    $$('#diag-toggle .toggle-pill').forEach(p => p.addEventListener('click', () => {
      $$('#diag-toggle .toggle-pill').forEach(x => { x.classList.remove('active'); x.style.borderColor = ''; x.style.color = ''; });
      p.classList.add('active');
      escolha = p.dataset.val;
      if (escolha === 'Prenha') { p.style.borderColor = 'var(--ok)'; p.style.color = 'var(--ok)'; }
      else { p.style.borderColor = 'var(--danger)'; p.style.color = 'var(--danger)'; }
    }));
  }, 0);
  renderModal({
    title: 'Registrar diagnóstico',
    body,
    confirmText: 'Salvar diagnóstico',
    onConfirm: () => {
      AppState.registrarDiagnostico(insemId, escolha);
      renderToast('Diagnóstico registrado!', 'success');
      renderPage();
    }
  });
}
