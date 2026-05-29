/* ============================================================
   AgroGen IA - Estado Global e Dados Pré-Populados
   ============================================================ */

const RACAS = {
  Bovino: ['Nelore', 'Angus', 'Girolando', 'Gir', 'Brahman', 'Sindi', 'Guzerá', 'Outro'],
  Ovino: ['Santa Inês', 'Dorper', 'Morada Nova', 'Texel', 'Somalis', 'Outro'],
  Caprino: ['Anglo Nubiana', 'Saanen', 'Toggenburg', 'Boer', 'Moxotó', 'Outro'],
};

const ESPECIE_EMOJI = { Bovino: '🐄', Ovino: '🐑', Caprino: '🐐' };

const TECNICOS = ['João Silva', 'Maria Oliveira', 'Carlos Mendes', 'Ana Pereira', 'Eu mesmo'];

const STATUS_REPRO = ['Ativa', 'Prenha', 'Em repouso', 'Descartada', 'Reprodutor ativo', 'Em observação'];

// Datas relativas (para últimos 6 meses)
function daysAgo(d) {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString().split('T')[0];
}
function isoNow() { return new Date().toISOString(); }

const ANIMAIS_SEED = [
  { id: 'BOV-001', nome: 'Mimosa',    especie: 'Bovino',  raca: 'Nelore',         sexo: 'Fêmea',  linhagem: 'Linhagem A', historico: '2 partos',   status: 'Em observação',     peso: 480, condicaoCorporal: 4, nascimento: '2020-03-12', brinco: 'BRC-1023' },
  { id: 'BOV-002', nome: 'Trovão',    especie: 'Bovino',  raca: 'Angus',          sexo: 'Macho',  linhagem: 'Linhagem B', historico: 'Reprodutor', status: 'Reprodutor ativo',  peso: 820, condicaoCorporal: 5, nascimento: '2019-07-01', brinco: 'BRC-1024' },
  { id: 'BOV-003', nome: 'Bonita',    especie: 'Bovino',  raca: 'Gir',            sexo: 'Fêmea',  linhagem: 'Linhagem A', historico: '3 partos',   status: 'Prenha',            peso: 510, condicaoCorporal: 4, nascimento: '2018-11-22', brinco: 'BRC-1025' },
  { id: 'BOV-004', nome: 'Estrela',   especie: 'Bovino',  raca: 'Girolando',      sexo: 'Fêmea',  linhagem: 'Linhagem A', historico: '1 parto',    status: 'Ativa',             peso: 460, condicaoCorporal: 3, nascimento: '2021-05-08', brinco: 'BRC-1026' },
  { id: 'BOV-005', nome: 'Sultão',    especie: 'Bovino',  raca: 'Brahman',        sexo: 'Macho',  linhagem: 'Linhagem E', historico: 'Reprodutor', status: 'Reprodutor ativo',  peso: 890, condicaoCorporal: 5, nascimento: '2019-02-14', brinco: 'BRC-1027' },
  { id: 'BOV-006', nome: 'Linda',     especie: 'Bovino',  raca: 'Nelore',         sexo: 'Fêmea',  linhagem: 'Linhagem A', historico: '2 partos',   status: 'Ativa',             peso: 495, condicaoCorporal: 4, nascimento: '2020-09-30', brinco: 'BRC-1028' },
  { id: 'OVI-001', nome: 'Faísca',    especie: 'Ovino',   raca: 'Santa Inês',     sexo: 'Fêmea',  linhagem: 'Linhagem C', historico: '1 parto',    status: 'Prenha',            peso:  52, condicaoCorporal: 4, nascimento: '2022-04-15', brinco: 'OVI-201' },
  { id: 'OVI-002', nome: 'Nuvem',     especie: 'Ovino',   raca: 'Dorper',         sexo: 'Fêmea',  linhagem: 'Linhagem F', historico: '2 partos',   status: 'Ativa',             peso:  58, condicaoCorporal: 4, nascimento: '2021-08-21', brinco: 'OVI-202' },
  { id: 'OVI-003', nome: 'Relâmpago', especie: 'Ovino',   raca: 'Dorper',         sexo: 'Macho',  linhagem: 'Linhagem F', historico: 'Reprodutor', status: 'Reprodutor ativo',  peso:  88, condicaoCorporal: 5, nascimento: '2020-10-10', brinco: 'OVI-203' },
  { id: 'OVI-004', nome: 'Brisa',     especie: 'Ovino',   raca: 'Morada Nova',    sexo: 'Fêmea',  linhagem: 'Linhagem C', historico: '0 partos',   status: 'Ativa',             peso:  45, condicaoCorporal: 3, nascimento: '2023-01-18', brinco: 'OVI-204' },
  { id: 'CAP-001', nome: 'Serena',    especie: 'Caprino', raca: 'Anglo Nubiana',  sexo: 'Fêmea',  linhagem: 'Linhagem D', historico: '3 partos',   status: 'Ativa',             peso:  62, condicaoCorporal: 4, nascimento: '2019-12-05', brinco: 'CAP-301' },
  { id: 'CAP-002', nome: 'Aurora',    especie: 'Caprino', raca: 'Saanen',         sexo: 'Fêmea',  linhagem: 'Linhagem D', historico: '2 partos',   status: 'Em observação',     peso:  68, condicaoCorporal: 4, nascimento: '2020-06-14', brinco: 'CAP-302' },
  { id: 'CAP-003', nome: 'Pedra',     especie: 'Caprino', raca: 'Boer',           sexo: 'Macho',  linhagem: 'Linhagem G', historico: 'Reprodutor', status: 'Reprodutor ativo',  peso:  95, condicaoCorporal: 5, nascimento: '2019-04-22', brinco: 'CAP-303' },
  { id: 'CAP-004', nome: 'Lua',       especie: 'Caprino', raca: 'Moxotó',         sexo: 'Fêmea',  linhagem: 'Linhagem H', historico: '1 parto',    status: 'Prenha',            peso:  55, condicaoCorporal: 4, nascimento: '2021-11-08', brinco: 'CAP-304' },
  { id: 'CAP-005', nome: 'Cigana',    especie: 'Caprino', raca: 'Anglo Nubiana',  sexo: 'Fêmea',  linhagem: 'Linhagem D', historico: '0 partos',   status: 'Ativa',             peso:  48, condicaoCorporal: 3, nascimento: '2023-03-25', brinco: 'CAP-305' },
];

const INSEMINACOES_SEED = [
  // últimos 180 dias - distribuídos
  { id: 'INS-001', animalId: 'BOV-001', reprodutor: 'Trovão (BOV-002)', tipo: 'IATF',           data: daysAgo(12),  tecnico: 'João Silva',   resultado: 'Aguardando', condicao: 4, palheta: 'P-238' },
  { id: 'INS-002', animalId: 'BOV-003', reprodutor: 'Sêmen externo - Touro Imperador',     tipo: 'IA Convencional', data: daysAgo(28),  tecnico: 'Maria Oliveira', resultado: 'Prenha',    condicao: 4, palheta: 'P-198' },
  { id: 'INS-003', animalId: 'BOV-004', reprodutor: 'Sultão (BOV-005)',  tipo: 'IATF',           data: daysAgo(45),  tecnico: 'João Silva',   resultado: 'Falha',     condicao: 3, palheta: 'P-201' },
  { id: 'INS-004', animalId: 'OVI-001', reprodutor: 'Relâmpago (OVI-003)',  tipo: 'IA Convencional',data: daysAgo(35), tecnico: 'Carlos Mendes',resultado: 'Prenha',    condicao: 4, palheta: 'P-220' },
  { id: 'INS-005', animalId: 'OVI-002', reprodutor: 'Relâmpago (OVI-003)',  tipo: 'IA Convencional',data: daysAgo(60), tecnico: 'Ana Pereira',  resultado: 'Falha',     condicao: 3, palheta: 'P-189' },
  { id: 'INS-006', animalId: 'CAP-001', reprodutor: 'Pedra (CAP-003)',   tipo: 'IATF',           data: daysAgo(75),  tecnico: 'João Silva',   resultado: 'Prenha',    condicao: 4, palheta: 'P-175' },
  { id: 'INS-007', animalId: 'CAP-002', reprodutor: 'Pedra (CAP-003)',   tipo: 'IATF',           data: daysAgo(10),  tecnico: 'Maria Oliveira', resultado: 'Aguardando', condicao: 4, palheta: 'P-241' },
  { id: 'INS-008', animalId: 'BOV-006', reprodutor: 'Sêmen externo - Touro Sertão',        tipo: 'IATF',           data: daysAgo(95),  tecnico: 'João Silva',   resultado: 'Prenha',    condicao: 4, palheta: 'P-150' },
  { id: 'INS-009', animalId: 'BOV-001', reprodutor: 'Trovão (BOV-002)',  tipo: 'IA Convencional',data: daysAgo(110),  tecnico: 'João Silva',   resultado: 'Falha',     condicao: 3, palheta: 'P-140' },
  { id: 'INS-010', animalId: 'CAP-004', reprodutor: 'Pedra (CAP-003)',   tipo: 'Transferência de Embrião', data: daysAgo(50),  tecnico: 'Ana Pereira',  resultado: 'Prenha',    condicao: 4, palheta: 'P-195' },
  { id: 'INS-011', animalId: 'OVI-004', reprodutor: 'Relâmpago (OVI-003)',  tipo: 'IATF',           data: daysAgo(20),  tecnico: 'Carlos Mendes',resultado: 'Aguardando', condicao: 3, palheta: 'P-230' },
  { id: 'INS-012', animalId: 'BOV-003', reprodutor: 'Sultão (BOV-005)',  tipo: 'IATF',           data: daysAgo(130), tecnico: 'João Silva',   resultado: 'Prenha',    condicao: 4, palheta: 'P-110' },
  { id: 'INS-013', animalId: 'CAP-005', reprodutor: 'Pedra (CAP-003)',   tipo: 'IA Convencional',data: daysAgo(40),  tecnico: 'Maria Oliveira', resultado: 'Falha',     condicao: 3, palheta: 'P-210' },
  { id: 'INS-014', animalId: 'BOV-006', reprodutor: 'Trovão (BOV-002)',  tipo: 'IATF',           data: daysAgo(155), tecnico: 'João Silva',   resultado: 'Prenha',    condicao: 4, palheta: 'P-090' },
  { id: 'INS-015', animalId: 'OVI-002', reprodutor: 'Relâmpago (OVI-003)',  tipo: 'IATF',           data: daysAgo(15),  tecnico: 'Carlos Mendes',resultado: 'Aguardando', condicao: 4, palheta: 'P-236' },
  { id: 'INS-016', animalId: 'CAP-001', reprodutor: 'Sêmen externo - Bode Real',         tipo: 'IA Convencional',data: daysAgo(165), tecnico: 'Ana Pereira',  resultado: 'Prenha',    condicao: 4, palheta: 'P-080' },
  { id: 'INS-017', animalId: 'BOV-004', reprodutor: 'Sultão (BOV-005)',  tipo: 'IATF',           data: daysAgo(170), tecnico: 'João Silva',   resultado: 'Prenha',    condicao: 4, palheta: 'P-075' },
  { id: 'INS-018', animalId: 'OVI-001', reprodutor: 'Sêmen externo - Carneiro Dorper Plus', tipo: 'IATF',         data: daysAgo(140), tecnico: 'Maria Oliveira', resultado: 'Falha',     condicao: 3, palheta: 'P-100' },
  { id: 'INS-019', animalId: 'CAP-004', reprodutor: 'Pedra (CAP-003)',   tipo: 'IA Convencional',data: daysAgo(85),  tecnico: 'João Silva',   resultado: 'Falha',     condicao: 3, palheta: 'P-160' },
  { id: 'INS-020', animalId: 'BOV-003', reprodutor: 'Trovão (BOV-002)',  tipo: 'IATF',           data: daysAgo(8),   tecnico: 'João Silva',   resultado: 'Aguardando', condicao: 4, palheta: 'P-245' },
];

const AppState = {
  currentUser: null,
  animais: JSON.parse(JSON.stringify(ANIMAIS_SEED)),
  inseminacoes: JSON.parse(JSON.stringify(INSEMINACOES_SEED)),
  atividades: [],
  currentPage: 'login',
  darkMode: false,
  aiTab: 'predicao',
  animaisSubpage: 'list', // list | form
  insemSubpage: 'wizard', // wizard | history
  insemStep: 1,
  insemDraft: {
    animalId: null,
    tipo: 'IATF',
    reprodutor: '',
    reprodutorTipo: 'interno',
    semenExterno: { touro: '', raca: '', registro: '', empresa: '', dose: '' },
    palheta: '',
    tecnico: 'João Silva',
    data: new Date().toISOString().slice(0,16),
    fase: '',
    condicao: 3,
    temperatura: 28,
    observacoes: '',
  },
  editingAnimalId: null,

  // Métodos
  adicionarAnimal(animal) {
    this.animais.unshift(animal);
    this.logAtividade(`Cadastrou ${animal.nome} — ${animal.raca} ${animal.sexo.toLowerCase()}`, 'animal');
  },
  atualizarAnimal(id, dados) {
    const idx = this.animais.findIndex(a => a.id === id);
    if (idx >= 0) this.animais[idx] = { ...this.animais[idx], ...dados };
  },
  removerAnimal(id) {
    const a = this.animais.find(x => x.id === id);
    this.animais = this.animais.filter(x => x.id !== id);
    if (a) this.logAtividade(`Excluiu animal ${a.nome} (${a.id})`, 'remove');
  },
  registrarInseminacao(evento) {
    this.inseminacoes.unshift(evento);
    const a = this.animais.find(x => x.id === evento.animalId);
    this.logAtividade(`Inseminação registrada — ${a ? a.nome : evento.animalId}`, 'insem');
  },
  registrarDiagnostico(insemId, resultado) {
    const idx = this.inseminacoes.findIndex(i => i.id === insemId);
    if (idx >= 0) {
      this.inseminacoes[idx].resultado = resultado;
      this.inseminacoes[idx].dataDiagnostico = new Date().toISOString().split('T')[0];
      const a = this.animais.find(x => x.id === this.inseminacoes[idx].animalId);
      this.logAtividade(`Diagnóstico: ${resultado} — ${a ? a.nome : ''}`, resultado === 'Prenha' ? 'ok' : 'warn');
    }
  },
  logAtividade(texto, tipo) {
    this.atividades.unshift({ texto, tipo, hora: new Date() });
    if (this.atividades.length > 30) this.atividades.pop();
  },
  calcularTaxaPrenhez(filtro = () => true) {
    const lista = this.inseminacoes.filter(filtro).filter(i => i.resultado !== 'Aguardando');
    if (lista.length === 0) return 0;
    return lista.filter(i => i.resultado === 'Prenha').length / lista.length * 100;
  },
  getAnimaisPorEspecie(especie) {
    return this.animais.filter(a => a.especie === especie);
  },
  getProximoId(especie) {
    const prefix = especie === 'Bovino' ? 'BOV' : especie === 'Ovino' ? 'OVI' : 'CAP';
    const existentes = this.animais.filter(a => a.id.startsWith(prefix));
    const max = existentes.reduce((m, a) => {
      const n = parseInt(a.id.split('-')[1]) || 0;
      return Math.max(m, n);
    }, 0);
    return `${prefix}-${String(max + 1).padStart(3, '0')}`;
  },
};

// Pré-popular algumas atividades históricas para o feed
AppState.atividades = [
  { texto: 'Inseminação registrada — Mimosa (Lote B3)', tipo: 'insem', hora: new Date(Date.now() - 2 * 3600 * 1000) },
  { texto: 'IA analisou rebanho da Fazenda Boa Esperança', tipo: 'ai', hora: new Date(Date.now() - 5 * 3600 * 1000) },
  { texto: 'Diagnóstico: Prenha — Bonita', tipo: 'ok', hora: new Date(Date.now() - 18 * 3600 * 1000) },
  { texto: 'Cadastrou Cigana — Anglo Nubiana fêmea', tipo: 'animal', hora: new Date(Date.now() - 26 * 3600 * 1000) },
  { texto: 'Relatório mensal gerado e exportado', tipo: 'report', hora: new Date(Date.now() - 48 * 3600 * 1000) },
];

// helper format
function fmtDate(d) {
  if (!d) return '—';
  const dt = (typeof d === 'string') ? new Date(d) : d;
  return dt.toLocaleDateString('pt-BR');
}
function fmtDateTime(d) {
  if (!d) return '—';
  const dt = (typeof d === 'string') ? new Date(d) : d;
  return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function fmtRelative(d) {
  const dt = (typeof d === 'string') ? new Date(d) : d;
  const diff = (Date.now() - dt.getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `há ${Math.floor(diff / 86400)} dias`;
  return fmtDate(dt);
}
function daysBetween(a, b = new Date()) {
  const da = new Date(a), db = new Date(b);
  return Math.floor((db - da) / 86400000);
}
