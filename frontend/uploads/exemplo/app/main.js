/* ============================================================
   AgroGen IA - Páginas: IA, Relatórios, Perfil + Main/Router
   ============================================================ */

/* ====================== ANÁLISE IA ====================== */
function renderAIPage(root) {
  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div class="title">
          <h1><i data-lucide="sparkles" style="width:22px;height:22px;color:var(--amber);display:inline-block;vertical-align:-3px;"></i> Análise com IA</h1>
          <span class="subtitle">Inteligência artificial aplicada à reprodução do seu rebanho</span>
        </div>
      </div>

      <div class="ai-tabs">
        <div class="ai-tab ${AppState.aiTab==='predicao'?'active':''}" data-tab="predicao">
          <div class="ico"><i data-lucide="gauge" style="width:20px;height:20px;"></i></div>
          <div><div class="ttl">Predição de prenhez</div><div class="sub">Probabilidade individual</div></div>
        </div>
        <div class="ai-tab ${AppState.aiTab==='padroes'?'active':''}" data-tab="padroes">
          <div class="ico"><i data-lucide="chart-spline" style="width:20px;height:20px;"></i></div>
          <div><div class="ttl">Padrões de fertilidade</div><div class="sub">Análise do rebanho</div></div>
        </div>
        <div class="ai-tab ${AppState.aiTab==='selecao'?'active':''}" data-tab="selecao">
          <div class="ico"><i data-lucide="git-fork" style="width:20px;height:20px;"></i></div>
          <div><div class="ttl">Seleção genética</div><div class="sub">Cruzamentos recomendados</div></div>
        </div>
      </div>

      <div class="card" id="ai-content" style="padding:28px;"></div>
    </div>
  `;
  $$('.ai-tab').forEach(t => t.addEventListener('click', () => {
    AppState.aiTab = t.dataset.tab;
    renderPage();
  }));
  const content = $('#ai-content');
  if (AppState.aiTab === 'predicao') renderAIPredicao(content);
  else if (AppState.aiTab === 'padroes') renderAIPadroes(content);
  else renderAISelecao(content);
  lucide.createIcons();
}

function renderAIPredicao(c) {
  c.innerHTML = `
    <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:18px;">
      <div>
        <h3>Predição de taxa de prenhez</h3>
        <div class="text-muted text-sm">Selecione uma matriz para estimar a probabilidade de sucesso da próxima inseminação.</div>
      </div>
    </div>
    <div class="form-row" style="grid-template-columns:2fr 1fr;align-items:end;">
      <div class="form-group autocomplete">
        <label>Matriz (fêmea)</label>
        <input class="input" id="pred-search" placeholder="Buscar por nome ou ID..." autocomplete="off" />
        <div class="autocomplete-list" id="pred-ac"></div>
      </div>
      <button class="btn btn-primary btn-lg" id="pred-run" disabled>
        <i data-lucide="sparkles" style="width:16px;height:16px;"></i> Analisar com IA
      </button>
    </div>
    <div id="pred-context" style="margin-top:8px;"></div>
    <div id="pred-result" style="margin-top:24px;"></div>
  `;
  let selected = null;
  setupAutocomplete($('#pred-search'), $('#pred-ac'),
    () => AppState.animais.filter(a => a.sexo === 'Fêmea'),
    (a) => {
      selected = a;
      $('#pred-search').value = `${a.nome} (${a.id})`;
      $('#pred-ac').classList.remove('open');
      $('#pred-run').disabled = false;
      const insems = AppState.inseminacoes.filter(i => i.animalId === a.id);
      const taxaHist = insems.length === 0 ? '—' : Math.round(insems.filter(x => x.resultado === 'Prenha').length / Math.max(1, insems.filter(x => x.resultado !== 'Aguardando').length) * 100) + '%';
      $('#pred-context').innerHTML = `
        <div class="animal-pick">
          <div class="ava">${ESPECIE_EMOJI[a.especie]}</div>
          <div class="info">
            <div class="name">${a.nome}</div>
            <div class="meta">${renderBadgeEspecie(a.especie)} · ${a.raca} · CC ${a.condicaoCorporal||3}/5 · ${insems.length} inseminações no histórico · Taxa histórica: ${taxaHist}</div>
          </div>
        </div>
      `;
    }
  );
  $('#pred-run').addEventListener('click', () => {
    if (!selected) return;
    const out = $('#pred-result');
    out.innerHTML = '';
    out.appendChild(renderLoader('Analisando dados genéticos e histórico reprodutivo...'));
    setTimeout(() => {
      const result = preverPrenhez(selected, AppState.inseminacoes);
      const factors = fatoresPrenhez(selected, result);
      const rec = recomendacaoIA(selected, result.score);
      out.innerHTML = `
        <div class="form-row" style="grid-template-columns:1fr 1.2fr;gap:24px;">
          <div class="card" style="background:var(--beige);border:0;padding:14px;">
            <div id="gauge-target"></div>
          </div>
          <div>
            <h3 style="margin-bottom:12px;">Fatores que influenciaram</h3>
            <div class="factor-list">
              ${factors.map(f => `
                <div class="factor ${f.tipo}">
                  <i data-lucide="${f.tipo==='pos'?'check-circle-2':f.tipo==='neg'?'x-circle':'alert-triangle'}" style="width:18px;height:18px;"></i>
                  <div>${f.txt}</div>
                </div>
              `).join('')}
            </div>
            <div class="recommendation" style="margin-top:18px;">
              <i data-lucide="lightbulb" style="width:18px;height:18px;"></i>
              <div>
                <div class="ttl">Recomendação da IA</div>
                <div class="txt">${rec}</div>
              </div>
            </div>
          </div>
        </div>
      `;
      renderGaugePrenhez(result.score, $('#gauge-target'));
      AppState.logAtividade(`IA prediu ${result.score}% de prenhez para ${selected.nome}`, 'ai');
      lucide.createIcons();
    }, 2400);
  });
  lucide.createIcons();
}

function renderAIPadroes(c) {
  c.innerHTML = `
    <h3>Identificação de padrões de fertilidade</h3>
    <div class="text-muted text-sm" style="margin-bottom:18px;">Análise do rebanho inteiro para encontrar padrões que explicam sucesso ou falha reprodutiva.</div>
    <div class="form-row" style="grid-template-columns:1fr 2fr;">
      <div class="form-group">
        <label>Grupo de análise</label>
        <select class="select" id="pad-grupo">
          <option value="">Todo o rebanho</option>
          <option value="Bovino">Apenas bovinos</option>
          <option value="Ovino">Apenas ovinos</option>
          <option value="Caprino">Apenas caprinos</option>
        </select>
      </div>
      <div class="form-group">
        <label>Período</label>
        <div class="toggle-group" id="pad-periodo">
          <div class="toggle-pill" data-val="90">3 meses</div>
          <div class="toggle-pill active" data-val="180">6 meses</div>
          <div class="toggle-pill" data-val="365">12 meses</div>
        </div>
      </div>
    </div>
    <button class="btn btn-primary" id="pad-run"><i data-lucide="sparkles" style="width:16px;height:16px;"></i> Gerar análise</button>
    <div id="pad-result" style="margin-top:24px;"></div>
  `;
  let periodo = 180;
  $$('#pad-periodo .toggle-pill').forEach(p => p.addEventListener('click', () => {
    $$('#pad-periodo .toggle-pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    periodo = parseInt(p.dataset.val);
  }));
  $('#pad-run').addEventListener('click', () => {
    const grupo = $('#pad-grupo').value;
    const out = $('#pad-result');
    out.innerHTML = '';
    out.appendChild(renderLoader('Cruzando dados históricos e identificando padrões...'));

    setTimeout(() => {
      const cutoff = new Date(Date.now() - periodo * 86400000);
      let insems = AppState.inseminacoes.filter(i => new Date(i.data) >= cutoff && i.resultado !== 'Aguardando');
      if (grupo) {
        const ids = AppState.animais.filter(a => a.especie === grupo).map(a => a.id);
        insems = insems.filter(i => ids.includes(i.animalId));
      }

      // taxa por raça
      const racas = {};
      insems.forEach(i => {
        const a = AppState.animais.find(x => x.id === i.animalId);
        if (!a) return;
        racas[a.raca] = racas[a.raca] || { total: 0, prenha: 0 };
        racas[a.raca].total++;
        if (i.resultado === 'Prenha') racas[a.raca].prenha++;
      });
      const racaArr = Object.entries(racas).map(([r, v]) => ({ raca: r, taxa: Math.round(v.prenha / v.total * 100), n: v.total })).sort((a,b) => b.taxa - a.taxa);
      const melhorRaca = racaArr[0];
      const piorRaca = racaArr[racaArr.length - 1];

      // por técnico
      const tec = {};
      insems.forEach(i => {
        tec[i.tecnico] = tec[i.tecnico] || { total: 0, prenha: 0 };
        tec[i.tecnico].total++;
        if (i.resultado === 'Prenha') tec[i.tecnico].prenha++;
      });
      const tecArr = Object.entries(tec).map(([n, v]) => ({ nome: n, taxa: Math.round(v.prenha / v.total * 100), n: v.total })).sort((a,b)=>b.taxa-a.taxa);
      const melhorTec = tecArr[0];

      // ranking de matrizes
      const matriz = {};
      AppState.inseminacoes.forEach(i => {
        const a = AppState.animais.find(x => x.id === i.animalId);
        if (!a || a.sexo !== 'Fêmea') return;
        matriz[i.animalId] = matriz[i.animalId] || { animal: a, total: 0, prenha: 0 };
        if (i.resultado === 'Prenha') matriz[i.animalId].prenha++;
        if (i.resultado !== 'Aguardando') matriz[i.animalId].total++;
      });
      const ranking = Object.values(matriz).filter(m => m.total > 0)
        .map(m => ({ ...m, taxa: Math.round(m.prenha / m.total * 100) }))
        .sort((a,b)=>b.taxa-a.taxa).slice(0, 5);

      // evolução mensal
      const months = [];
      const labels = [];
      const nMonths = Math.min(12, Math.ceil(periodo / 30));
      for (let i = nMonths - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push({ m: d.getMonth(), y: d.getFullYear() });
        labels.push(d.toLocaleDateString('pt-BR', { month: 'short' }));
      }
      const evol = months.map(({m,y}) => {
        const l = insems.filter(i => { const d = new Date(i.data); return d.getMonth()===m && d.getFullYear()===y; });
        if (l.length === 0) return 0;
        return Math.round(l.filter(x => x.resultado === 'Prenha').length / l.length * 100);
      });

      out.innerHTML = `
        <div class="form-row" style="grid-template-columns:1fr 1fr;gap:16px;">
          <div class="card" style="padding:18px;">
            <h4 style="margin-bottom:8px;">Taxa de prenhez por raça</h4>
            <div style="height:240px;position:relative;"><canvas id="raca-chart"></canvas></div>
          </div>
          <div class="card" style="padding:18px;">
            <h4 style="margin-bottom:8px;">Evolução mensal (%)</h4>
            <div style="height:240px;position:relative;"><canvas id="evol-chart"></canvas></div>
          </div>
        </div>

        <div class="form-row" style="grid-template-columns:repeat(2,1fr);gap:12px;margin-top:18px;">
          ${melhorRaca?`<div class="card" style="border-left:4px solid var(--ok);">
            <div class="text-xs text-muted">RAÇA COM MAIOR TAXA</div>
            <div style="font-family:var(--font-display);font-weight:700;font-size:22px;margin-top:4px;">${melhorRaca.raca} <span style="color:var(--ok);">${melhorRaca.taxa}%</span></div>
            <div class="text-sm text-muted">Baseado em ${melhorRaca.n} inseminações no período</div>
          </div>`:''}
          ${piorRaca && piorRaca !== melhorRaca?`<div class="card" style="border-left:4px solid var(--danger);">
            <div class="text-xs text-muted">RAÇA COM MENOR TAXA</div>
            <div style="font-family:var(--font-display);font-weight:700;font-size:22px;margin-top:4px;">${piorRaca.raca} <span style="color:var(--danger);">${piorRaca.taxa}%</span></div>
            <div class="text-sm text-muted">Possível inadaptação ao clima do semiárido</div>
          </div>`:''}
          ${melhorTec?`<div class="card" style="border-left:4px solid var(--green-700);">
            <div class="text-xs text-muted">TÉCNICO COM MELHOR DESEMPENHO</div>
            <div style="font-family:var(--font-display);font-weight:700;font-size:22px;margin-top:4px;">${melhorTec.nome}</div>
            <div class="text-sm text-muted">${melhorTec.taxa}% de sucesso em ${melhorTec.n} eventos</div>
          </div>`:''}
          <div class="card" style="border-left:4px solid var(--amber);">
            <div class="text-xs text-muted">CONDIÇÃO CORPORAL IDEAL</div>
            <div style="font-family:var(--font-display);font-weight:700;font-size:22px;margin-top:4px;">3,5 a 4,5</div>
            <div class="text-sm text-muted">Faixa com maior probabilidade de sucesso</div>
          </div>
          <div class="card" style="border-left:4px solid var(--green-700);">
            <div class="text-xs text-muted">MELHORES MESES</div>
            <div style="font-family:var(--font-display);font-weight:700;font-size:22px;margin-top:4px;">Maio – Julho</div>
            <div class="text-sm text-muted">Após período chuvoso · maior CC do rebanho</div>
          </div>
          <div class="card" style="border-left:4px solid var(--terra-700);">
            <div class="text-xs text-muted">TAXA GERAL DO PERÍODO</div>
            <div style="font-family:var(--font-display);font-weight:700;font-size:22px;margin-top:4px;">${insems.length?Math.round(insems.filter(i=>i.resultado==='Prenha').length/insems.length*100):0}%</div>
            <div class="text-sm text-muted">${insems.length} inseminações analisadas</div>
          </div>
        </div>

        <div class="card" style="margin-top:18px;">
          <h4 style="margin-bottom:10px;">Ranking de matrizes</h4>
          <table class="tbl">
            <thead><tr><th>#</th><th>Matriz</th><th>Espécie</th><th>Inseminações</th><th>Taxa de sucesso</th></tr></thead>
            <tbody>${ranking.map((m,i) => `
              <tr>
                <td><strong>${i+1}º</strong></td>
                <td>${m.animal.nome} <span class="id-mono">${m.animal.id}</span></td>
                <td>${renderBadgeEspecie(m.animal.especie)}</td>
                <td>${m.total}</td>
                <td><span class="badge ${m.taxa>=70?'badge-ok':m.taxa>=50?'badge-warn':'badge-danger'}">${m.taxa}%</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
      const cc = chartColors();
      destroyChart('raca'); destroyChart('evol');
      chartInstances.raca = new Chart($('#raca-chart'), {
        type: 'bar',
        data: { labels: racaArr.map(r=>r.raca), datasets: [{ data: racaArr.map(r=>r.taxa), backgroundColor: racaArr.map(r => r.taxa>=70?'#15803D':r.taxa>=50?'#D4A017':'#B91C1C'), borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: cc.text }, grid: { color: cc.grid } }, y: { beginAtZero: true, max: 100, ticks: { color: cc.text, callback: v => v+'%' }, grid: { color: cc.grid } } } }
      });
      chartInstances.evol = new Chart($('#evol-chart'), {
        type: 'line',
        data: { labels, datasets: [{ data: evol, borderColor: cc.amber, backgroundColor: cc.amber+'33', fill: true, tension: .35, borderWidth: 3, pointBackgroundColor: cc.amber }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: cc.text }, grid: { color: cc.grid } }, y: { beginAtZero: true, max: 100, ticks: { color: cc.text, callback: v => v+'%' }, grid: { color: cc.grid } } } }
      });
      AppState.logAtividade('IA analisou padrões de fertilidade do rebanho', 'ai');
      lucide.createIcons();
    }, 2400);
  });
  lucide.createIcons();
}

function renderAISelecao(c) {
  c.innerHTML = `
    <h3>Recomendação de seleção genética</h3>
    <div class="text-muted text-sm" style="margin-bottom:18px;">Cruzamentos sugeridos para maximizar a qualidade genética da próxima geração.</div>
    <div class="form-group">
      <label>Objetivos do cruzamento (selecione um ou mais)</label>
      <div id="sel-obj" style="display:flex;flex-wrap:wrap;gap:8px;">
        ${['Ganho de peso','Precocidade','Resistência ao calor','Qualidade do leite','Prolificidade','Tamanho da carcaça'].map(o => `
          <label class="toggle-pill" style="flex:none;padding:8px 14px;display:flex;align-items:center;gap:6px;">
            <input type="checkbox" value="${o}" /> ${o}
          </label>`).join('')}
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Espécie alvo</label>
        <select class="select" id="sel-esp">
          <option>Bovino</option><option>Ovino</option><option>Caprino</option>
        </select>
      </div>
      <div class="form-group">
        <label>Origem dos reprodutores</label>
        <select class="select" id="sel-rep-src">
          <option value="ambos">Cadastrados + sêmen externo</option>
          <option value="interno">Apenas cadastrados</option>
          <option value="externo">Apenas sêmen externo</option>
        </select>
      </div>
    </div>
    <button class="btn btn-primary" id="sel-run"><i data-lucide="sparkles" style="width:16px;height:16px;"></i> Gerar recomendações</button>
    <div id="sel-result" style="margin-top:24px;"></div>
  `;
  // toggle pill click toggles checkbox visually
  $$('#sel-obj label').forEach(lbl => {
    lbl.addEventListener('click', () => setTimeout(() => {
      const cb = lbl.querySelector('input');
      lbl.classList.toggle('active', cb.checked);
    }, 0));
  });
  $('#sel-run').addEventListener('click', () => {
    const objetivos = [...$$('#sel-obj input:checked')].map(i => i.value);
    const especie = $('#sel-esp').value;
    const repSrc = $('#sel-rep-src').value;
    const out = $('#sel-result');
    out.innerHTML = '';
    out.appendChild(renderLoader('Modelando combinações genéticas e avaliando variabilidade...'));
    setTimeout(() => {
      const femeas = AppState.animais.filter(a => a.especie === especie && a.sexo === 'Fêmea' && (a.status === 'Ativa' || a.status === 'Em repouso'));
      const machosInternos = AppState.animais.filter(a => a.especie === especie && a.sexo === 'Macho');
      const semenExterno = [
        { nome: 'Touro Imperador (NLR)', raca: 'Nelore', origem: 'Externo', perfil: ['Ganho de peso', 'Tamanho da carcaça'] },
        { nome: 'Reprodutor Sertão Brahman', raca: 'Brahman', origem: 'Externo', perfil: ['Resistência ao calor', 'Ganho de peso'] },
        { nome: 'Carneiro Dorper Plus', raca: 'Dorper', origem: 'Externo', perfil: ['Precocidade', 'Tamanho da carcaça'] },
        { nome: 'Bode Anglo Real', raca: 'Anglo Nubiana', origem: 'Externo', perfil: ['Qualidade do leite', 'Prolificidade'] },
      ].filter(s => {
        if (especie === 'Bovino') return ['Nelore','Brahman','Angus','Gir'].includes(s.raca);
        if (especie === 'Ovino') return ['Dorper','Santa Inês'].includes(s.raca);
        return ['Anglo Nubiana','Boer','Saanen'].includes(s.raca);
      });
      let pool = [];
      if (repSrc !== 'externo') pool = pool.concat(machosInternos.map(m => ({ nome: m.nome + ' (' + m.id + ')', raca: m.raca, origem: 'Cadastrado', perfil: ['Ganho de peso'], linhagem: m.linhagem })));
      if (repSrc !== 'interno') pool = pool.concat(semenExterno);

      // gerar recomendações
      const recs = femeas.slice(0, 6).map(f => {
        // escolher melhor reprodutor
        const scored = pool.map(r => {
          let s = 50;
          objetivos.forEach(o => { if (r.perfil?.includes(o)) s += 12; });
          if (r.linhagem && f.linhagem && r.linhagem === f.linhagem) s -= 25; // consanguinidade
          if (r.raca === f.raca) s += 3;
          return { rep: r, score: Math.min(95, s + Math.floor(Math.random() * 6)) };
        }).sort((a,b)=>b.score-a.score);
        const top = scored[0];
        const consang = top?.rep?.linhagem && top.rep.linhagem === f.linhagem;
        return { matriz: f, rep: top?.rep, score: top?.score || 60, consang };
      });

      const semConsang = recs.filter(r => !r.consang);
      const comConsang = recs.filter(r => r.consang);

      out.innerHTML = `
        <h4 style="margin-bottom:10px;">Cruzamentos recomendados</h4>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Matriz</th><th>Reprodutor recomendado</th><th>Origem</th><th>Score genético</th><th>Justificativa</th></tr></thead>
            <tbody>${semConsang.map(r => `
              <tr>
                <td><strong>${r.matriz.nome}</strong> <span class="id-mono">${r.matriz.id}</span><br><span class="text-xs text-muted">${r.matriz.raca} · CC ${r.matriz.condicaoCorporal||3}/5</span></td>
                <td><strong>${r.rep?.nome||'—'}</strong><br><span class="text-xs text-muted">${r.rep?.raca||''}</span></td>
                <td><span class="badge ${r.rep?.origem==='Externo'?'badge-amber':'badge-bovino'}">${r.rep?.origem||'—'}</span></td>
                <td><span class="badge ${r.score>=75?'badge-ok':r.score>=60?'badge-warn':'badge-danger'}">${r.score}/100</span></td>
                <td class="text-sm">Alinhado com ${objetivos.length?objetivos.slice(0,2).join(', '):'objetivos gerais'} · linhagens distintas</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${comConsang.length > 0 ? `
          <h4 style="margin-top:22px;margin-bottom:10px;color:var(--danger);">⚠ Cruzamentos a evitar (consanguinidade detectada)</h4>
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Matriz</th><th>Reprodutor</th><th>Motivo</th></tr></thead>
              <tbody>${comConsang.map(r => `
                <tr>
                  <td><strong>${r.matriz.nome}</strong></td>
                  <td>${r.rep?.nome||'—'}</td>
                  <td class="text-sm text-muted">Mesma linhagem (${r.matriz.linhagem}) — risco de consanguinidade. Buscar reprodutor de outra linhagem ou banco externo.</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        ${pool.length < 4 ? `
          <div class="recommendation" style="margin-top:18px;">
            <i data-lucide="info" style="width:18px;height:18px;"></i>
            <div>
              <div class="ttl">Amplie a variabilidade genética</div>
              <div class="txt">Você tem apenas ${pool.length} reprodutor(es) disponível(eis). Considere adquirir sêmen externo de touros provados para diversificar o pool genético.</div>
            </div>
          </div>` : ''}
      `;
      AppState.logAtividade('IA gerou recomendações de seleção genética', 'ai');
      lucide.createIcons();
    }, 2400);
  });
  lucide.createIcons();
}

/* ====================== RELATÓRIOS ====================== */
function renderRelatoriosPage(root) {
  root.innerHTML = `
    <div class="page">
      <div class="page-head no-print">
        <div class="title">
          <h1>Relatórios</h1>
          <span class="subtitle">Gere relatórios detalhados de desempenho reprodutivo</span>
        </div>
      </div>

      <div class="card no-print" style="margin-bottom:20px;">
        <div class="form-row-3">
          <div class="form-group">
            <label>Tipo de relatório</label>
            <select class="select" id="rep-tipo">
              <option>Desempenho reprodutivo geral</option>
              <option>Desempenho por espécie</option>
              <option>Desempenho por técnico</option>
              <option>Histórico individual de animal</option>
              <option>Análise genética do rebanho</option>
            </select>
          </div>
          <div class="form-group">
            <label>Espécie</label>
            <select class="select" id="rep-esp">
              <option value="">Todas</option><option>Bovino</option><option>Ovino</option><option>Caprino</option>
            </select>
          </div>
          <div class="form-group">
            <label>Custo por dose (R$)</label>
            <input class="input" type="number" id="rep-custo" value="120" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Data inicial</label>
            <input class="input" type="date" id="rep-ini" value="${daysAgo(180)}" />
          </div>
          <div class="form-group">
            <label>Data final</label>
            <input class="input" type="date" id="rep-fim" value="${daysAgo(0)}" />
          </div>
        </div>
        <div class="row" style="gap:8px;margin-top:8px;">
          <button class="btn btn-primary" id="rep-gen"><i data-lucide="file-bar-chart" style="width:16px;height:16px;"></i> Gerar relatório</button>
          <button class="btn btn-amber" id="rep-pdf"><i data-lucide="file-down" style="width:16px;height:16px;"></i> Exportar PDF</button>
          <button class="btn btn-secondary" id="rep-csv"><i data-lucide="download" style="width:16px;height:16px;"></i> Exportar CSV</button>
        </div>
      </div>

      <div id="report-output"></div>
    </div>
  `;
  function generate() {
    const ini = new Date($('#rep-ini').value);
    const fim = new Date($('#rep-fim').value);
    fim.setHours(23,59,59);
    const esp = $('#rep-esp').value;
    const custo = parseFloat($('#rep-custo').value) || 0;
    let insems = AppState.inseminacoes.filter(i => {
      const d = new Date(i.data);
      return d >= ini && d <= fim;
    });
    if (esp) {
      const ids = AppState.animais.filter(a => a.especie === esp).map(a => a.id);
      insems = insems.filter(i => ids.includes(i.animalId));
    }
    const resolvidas = insems.filter(i => i.resultado !== 'Aguardando');
    const prenhas = insems.filter(i => i.resultado === 'Prenha').length;
    const taxa = resolvidas.length ? Math.round(prenhas / resolvidas.length * 100) : 0;
    const out = $('#report-output');
    out.innerHTML = `
      <div class="card" style="padding:30px;">
        <!-- HEADER -->
        <div style="display:flex;justify-content:space-between;align-items:start;padding-bottom:18px;border-bottom:2px solid var(--green-900);">
          <div class="row">
            <div class="logo-mark"><i data-lucide="dna" style="width:20px;height:20px;"></i></div>
            <div>
              <div style="font-family:var(--font-display);font-weight:700;font-size:20px;">AgroGen IA</div>
              <div class="text-xs text-muted">${AppState.currentUser?.nome||'Produtor'} · Fazenda Boa Esperança</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div class="text-xs text-muted">PERÍODO</div>
            <div style="font-weight:600;">${fmtDate(ini)} → ${fmtDate(fim)}</div>
            <div class="text-xs text-muted" style="margin-top:6px;">Gerado em ${fmtDate(new Date())}</div>
          </div>
        </div>

        <!-- RESUMO -->
        <div class="stat-grid" style="margin-top:24px;margin-bottom:24px;">
          <div class="card stat-card"><span class="label">Inseminações</span><div class="num">${insems.length}</div><div class="meta">no período</div></div>
          <div class="card stat-card"><span class="label">Taxa de prenhez</span><div class="num">${taxa}%</div><div class="meta">${prenhas} prenhas · ${resolvidas.length - prenhas} falhas</div></div>
          <div class="card stat-card"><span class="label">Nascimentos esperados</span><div class="num">${prenhas}</div><div class="meta">Em até 9-11 meses</div></div>
          <div class="card stat-card"><span class="label">Custo por prenhez</span><div class="num">R$ ${prenhas ? (insems.length * custo / prenhas).toFixed(0) : '—'}</div><div class="meta">Custo médio estimado</div></div>
        </div>

        <!-- GRÁFICOS -->
        <div class="form-row" style="grid-template-columns:1fr 1fr;">
          <div class="card" style="padding:16px;">
            <h4 style="margin-bottom:8px;">Distribuição de resultados</h4>
            <div style="height:240px;position:relative;"><canvas id="rep-pie"></canvas></div>
          </div>
          <div class="card" style="padding:16px;">
            <h4 style="margin-bottom:8px;">Taxa de prenhez por raça</h4>
            <div style="height:240px;position:relative;"><canvas id="rep-bar"></canvas></div>
          </div>
        </div>

        <!-- TABELA -->
        <h4 style="margin-top:24px;margin-bottom:10px;">Eventos detalhados</h4>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Animal</th><th>Espécie</th><th>Raça</th><th>Data</th><th>Reprodutor</th><th>Técnico</th><th>Resultado</th></tr></thead>
            <tbody>${insems.map(i => {
              const a = AppState.animais.find(x => x.id === i.animalId) || {};
              const bg = i.resultado === 'Prenha' ? 'background:rgba(21,128,61,.06);' : i.resultado === 'Falha' ? 'background:rgba(185,28,28,.06);' : 'background:rgba(212,160,23,.06);';
              return `<tr style="${bg}">
                <td><strong>${a.nome||i.animalId}</strong></td>
                <td>${a.especie?renderBadgeEspecie(a.especie):'—'}</td>
                <td>${a.raca||'—'}</td>
                <td>${fmtDate(i.data)}</td>
                <td>${i.reprodutor}</td>
                <td>${i.tecnico}</td>
                <td>${renderBadgeResultado(i.resultado)}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>

        <!-- RODAPÉ -->
        <div style="margin-top:30px;padding-top:18px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;">
          <div class="text-xs text-muted">Assinatura digital: AGRO-${Date.now().toString(36).toUpperCase()}</div>
          <div class="text-xs text-muted">Dados tratados conforme <strong>LGPD (Lei nº 13.709/2018)</strong></div>
        </div>
      </div>
    `;
    // pizza
    const c = chartColors();
    destroyChart('reppie'); destroyChart('repbar');
    const aguar = insems.length - resolvidas.length;
    const falhas = resolvidas.length - prenhas;
    chartInstances.reppie = new Chart($('#rep-pie'), {
      type: 'doughnut',
      data: { labels: ['Prenha','Falha','Aguardando'], datasets: [{ data: [prenhas, falhas, aguar], backgroundColor: ['#15803D', '#B91C1C', '#D4A017'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: c.text } } }, cutout: '60%' }
    });
    // taxa por raça
    const racas = {};
    resolvidas.forEach(i => {
      const a = AppState.animais.find(x => x.id === i.animalId);
      if (!a) return;
      racas[a.raca] = racas[a.raca] || { total: 0, prenha: 0 };
      racas[a.raca].total++;
      if (i.resultado === 'Prenha') racas[a.raca].prenha++;
    });
    const racaLbl = Object.keys(racas);
    const racaData = racaLbl.map(r => Math.round(racas[r].prenha / racas[r].total * 100));
    chartInstances.repbar = new Chart($('#rep-bar'), {
      type: 'bar',
      data: { labels: racaLbl, datasets: [{ data: racaData, backgroundColor: c.greenLight, borderRadius: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: c.text }, grid: { color: c.grid } }, y: { beginAtZero: true, max: 100, ticks: { color: c.text, callback: v => v+'%' }, grid: { color: c.grid } } } }
    });
    lucide.createIcons();
    AppState.logAtividade('Relatório gerado', 'report');
    return insems;
  }
  $('#rep-gen').addEventListener('click', () => { generate(); renderToast('Relatório gerado!', 'success'); });
  $('#rep-pdf').addEventListener('click', () => {
    if (!$('#report-output').innerHTML.trim()) generate();
    setTimeout(() => window.print(), 200);
  });
  $('#rep-csv').addEventListener('click', () => {
    const insems = generate();
    const rows = [['Animal','ID','Especie','Raca','Data','Reprodutor','Tecnico','Resultado']];
    insems.forEach(i => {
      const a = AppState.animais.find(x => x.id === i.animalId) || {};
      rows.push([a.nome||'', i.animalId, a.especie||'', a.raca||'', i.data, i.reprodutor, i.tecnico, i.resultado]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `agrogen-relatorio-${Date.now()}.csv`;
    a.click();
    renderToast('CSV exportado!', 'success');
  });
  // auto-generate first
  setTimeout(generate, 100);
  lucide.createIcons();
}

/* ====================== PERFIL ====================== */
function renderPerfilPage(root) {
  const u = AppState.currentUser || {};
  const initials = (u.nome||'').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() || 'PR';
  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div class="title">
          <h1>Meu perfil</h1>
          <span class="subtitle">Gerencie seus dados e preferências</span>
        </div>
      </div>

      <div class="form-row" style="grid-template-columns:1fr 1.5fr;align-items:start;">
        <div class="card" style="text-align:center;padding:28px;">
          <div style="width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,var(--green-900),var(--terra-700));color:#fff;display:grid;place-items:center;font-family:var(--font-display);font-size:34px;font-weight:700;margin:0 auto 14px;">${initials}</div>
          <h3>${u.nome || '—'}</h3>
          <div class="text-sm text-muted" style="margin-top:2px;">${u.email || '—'}</div>
          <div style="margin-top:10px;"><span class="badge badge-bovino">${u.tipo || 'Produtor Rural'}</span></div>

          <div class="section-block" style="text-align:left;">
            <div class="section-title">Dados de contato</div>
            <div class="text-xs text-muted">CPF</div>
            <div style="font-weight:600;font-family:var(--font-mono);">${u.cpf ? '***.***.***-' + (u.cpf.slice(-2)) : '***.***.***-XX'}</div>
            <div class="text-xs text-muted" style="margin-top:8px;">Telefone</div>
            <div style="font-weight:600;">${u.telefone || '(88) 9 9999-9999'}</div>
            <div class="text-xs text-muted" style="margin-top:8px;">E-mail</div>
            <div style="font-weight:600;">${u.email || '—'}</div>
          </div>
        </div>

        <div class="col">
          <div class="card">
            <div class="section-title">Fazendas associadas</div>
            <div class="table-wrap">
              <table class="tbl">
                <thead><tr><th>Nome</th><th>Município</th><th>Área (ha)</th><th>Espécies</th></tr></thead>
                <tbody>
                  <tr><td><strong>Fazenda Boa Esperança</strong></td><td>Crateús/CE</td><td>320</td><td>${renderBadgeEspecie('Bovino')} ${renderBadgeEspecie('Caprino')}</td></tr>
                  <tr><td><strong>Sítio Vale Verde</strong></td><td>Independência/CE</td><td>85</td><td>${renderBadgeEspecie('Ovino')} ${renderBadgeEspecie('Caprino')}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="section-title">Alterar senha</div>
            <div class="form-row-3">
              <div class="form-group"><label>Senha atual</label><input class="input" type="password" /></div>
              <div class="form-group"><label>Nova senha</label><input class="input" type="password" /></div>
              <div class="form-group"><label>Confirmar</label><input class="input" type="password" /></div>
            </div>
            <button class="btn btn-primary" onclick="renderToast('Senha alterada com sucesso!', 'success')">Atualizar senha</button>
          </div>

          <div class="card">
            <div class="section-title">Preferências de notificação</div>
            <div class="col" style="gap:10px;">
              ${[
                ['Alertas de ciclo reprodutivo', true],
                ['Diagnósticos vencidos', true],
                ['Novos resultados de IA', true],
                ['Boletim mensal por e-mail', false],
              ].map(([txt,on],i) => `
                <label class="between" style="cursor:pointer;font-weight:500;">
                  <span>${txt}</span>
                  <span style="position:relative;width:42px;height:24px;display:inline-block;">
                    <input type="checkbox" ${on?'checked':''} style="opacity:0;width:0;height:0;" id="tog-${i}" onchange="document.querySelector('#tog-${i}-bg').style.background = this.checked ? 'var(--green-700)' : 'var(--line-2)'; document.querySelector('#tog-${i}-h').style.transform = this.checked ? 'translateX(18px)' : 'translateX(2px)';">
                    <span id="tog-${i}-bg" style="position:absolute;inset:0;border-radius:999px;background:${on?'var(--green-700)':'var(--line-2)'};transition:.2s;"></span>
                    <span id="tog-${i}-h" style="position:absolute;top:2px;width:20px;height:20px;background:#fff;border-radius:50%;transform:${on?'translateX(18px)':'translateX(2px)'};transition:.2s;"></span>
                  </span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <div class="section-title">Tema da interface</div>
            <div class="toggle-group" style="max-width:280px;">
              <div class="toggle-pill ${!AppState.darkMode?'active':''}" onclick="setTheme(false)"><i data-lucide="sun" style="width:14px;height:14px;display:inline-block;vertical-align:-2px;"></i> Claro</div>
              <div class="toggle-pill ${AppState.darkMode?'active':''}" onclick="setTheme(true)"><i data-lucide="moon" style="width:14px;height:14px;display:inline-block;vertical-align:-2px;"></i> Escuro</div>
            </div>
          </div>

          <div class="card" style="border:1px solid var(--warn-bg);">
            <div class="section-title" style="color:var(--warn);"><i data-lucide="shield" style="width:14px;height:14px;"></i> Meus dados (LGPD)</div>
            <p class="text-sm text-muted" style="margin-bottom:14px;">Conforme a Lei nº 13.709/2018, você tem direito de exportar ou excluir seus dados a qualquer momento.</p>
            <div class="row" style="flex-wrap:wrap;gap:8px;">
              <button class="btn btn-secondary" onclick="exportarDados()"><i data-lucide="download" style="width:14px;height:14px;"></i> Exportar meus dados</button>
              <button class="btn btn-danger" onclick="confirmDeleteAccount()"><i data-lucide="trash-2" style="width:14px;height:14px;"></i> Solicitar exclusão da conta</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  lucide.createIcons();
}

function exportarDados() {
  const data = JSON.stringify({ usuario: AppState.currentUser, animais: AppState.animais, inseminacoes: AppState.inseminacoes }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `agrogen-meus-dados-${Date.now()}.json`;
  a.click();
  renderToast('Dados exportados (LGPD)', 'success');
}
function confirmDeleteAccount() {
  renderModal({
    title: 'Solicitar exclusão da conta',
    body: '<p>Esta é uma ação <strong>irreversível</strong>. Todos os seus dados, animais e registros de inseminação serão excluídos conforme a LGPD.</p><p style="margin-top:12px;color:var(--ink-3);font-size:13px;">A solicitação é processada em até 30 dias úteis.</p>',
    confirmText: 'Confirmar exclusão',
    danger: true,
    onConfirm: () => renderToast('Solicitação de exclusão registrada. Você receberá um e-mail em até 24h.', 'info')
  });
}

/* ====================== MAIN / ROUTING ====================== */
function signIn(data) {
  AppState.currentUser = data;
  $('#login-screen').classList.add('hidden');
  $('#app-shell').classList.remove('hidden');
  $('#avatar-initials').textContent = data.nome.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
  $('#menu-user-name').textContent = data.nome;
  $('#menu-user-role').textContent = data.tipo + ' · ' + data.email;
  navigate('dashboard');
}
function signOut() {
  AppState.currentUser = null;
  $('#login-screen').classList.remove('hidden');
  $('#app-shell').classList.add('hidden');
  window.location.hash = '';
}

function setTheme(dark) {
  AppState.darkMode = dark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const ti = $('#theme-toggle i');
  if (ti) ti.setAttribute('data-lucide', dark ? 'sun' : 'moon');
  lucide.createIcons();
  if (AppState.currentPage && AppState.currentUser) renderPage();
}

function initLogin() {
  // tab switch
  $$('.login-tab').forEach(t => t.addEventListener('click', () => {
    $$('.login-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    if (t.dataset.tab === 'signin') {
      $('#form-signin').classList.remove('hidden');
      $('#form-signup').classList.add('hidden');
    } else {
      $('#form-signup').classList.remove('hidden');
      $('#form-signin').classList.add('hidden');
    }
  }));
  // signin
  $('#form-signin').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get('email');
    if (!email || !fd.get('senha')) { renderToast('Preencha e-mail e senha', 'error'); return; }
    signIn({ nome: 'Maria Cavalcante', email, telefone: '(88) 9 9123-4567', cpf: '123.456.789-12', tipo: 'Técnico Agropecuário' });
  });
  // signup
  $('#form-signup').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (fd.get('senha') !== fd.get('senha2')) { renderToast('As senhas não conferem', 'error'); return; }
    signIn({
      nome: fd.get('nome'),
      email: fd.get('email'),
      cpf: fd.get('cpf'),
      telefone: fd.get('telefone'),
      tipo: fd.get('tipo'),
    });
  });
  // forgot password
  $('#forgot-link').addEventListener('click', (e) => {
    e.preventDefault();
    const body = el('div', {}, [
      el('p', { class: 'text-sm text-muted', style: 'margin-bottom:14px;' }, ['Informe seu e-mail. Enviaremos um link para redefinir sua senha.']),
      el('div', { class: 'form-group' }, [el('label', {}, ['E-mail']), el('input', { class: 'input', type: 'email', id: 'forgot-email', placeholder: 'seu@email.com' })])
    ]);
    renderModal({
      title: 'Recuperar senha', body, confirmText: 'Enviar link',
      onConfirm: () => renderToast('Link enviado! Verifique sua caixa de entrada.', 'success')
    });
  });

  // inline validation
  $$('.input').forEach(inp => {
    inp.addEventListener('blur', () => {
      if (inp.required && !inp.value.trim()) {
        inp.classList.add('error');
        if (!inp.nextElementSibling?.classList?.contains('field-error')) {
          const e = document.createElement('div');
          e.className = 'field-error';
          e.textContent = 'Campo obrigatório';
          inp.parentNode.appendChild(e);
        }
      }
    });
    inp.addEventListener('input', () => {
      inp.classList.remove('error');
      const next = inp.parentNode.querySelector('.field-error');
      if (next) next.remove();
    });
  });
}

function initApp() {
  initLogin();
  // theme toggle
  $('#theme-toggle').addEventListener('click', () => setTheme(!AppState.darkMode));
  // hamburger
  $('#hamburger-btn').addEventListener('click', () => {
    $('#drawer').classList.add('open');
    $('#drawer-overlay').classList.add('open');
  });
  $('#drawer-overlay').addEventListener('click', () => {
    $('#drawer').classList.remove('open');
    $('#drawer-overlay').classList.remove('open');
  });
  // avatar menu
  $('#avatar-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    $('#avatar-menu').classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!$('#avatar-menu').contains(e.target) && e.target !== $('#avatar-btn')) {
      $('#avatar-menu').classList.remove('open');
    }
  });
  // nav links
  $$('.nav a, .drawer a').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(a.dataset.page);
  }));
  // hash routing
  window.addEventListener('hashchange', () => {
    const page = window.location.hash.replace('#', '') || 'dashboard';
    if (AppState.currentUser) {
      AppState.currentPage = page;
      renderPage();
    }
  });

  lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', initApp);
