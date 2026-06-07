import type { AxiosInstance } from "axios";
import MockAdapter from "axios-mock-adapter";
import {
  animais,
  inseminacoes,
  alertas,
  reprodutores,
  fazendas,
  usuario,
  pesagensOVI0007,
  partosBOV0012,
  sanitarioBOV0012,
  ocorrenciasBOV0012,
  FAZENDA_ID,
} from "./dados";
import { dashboardKPIs, graficoReproductivo, timeline } from "./dashboard";
import { predicaoPrenhez, padroesFertilidade } from "./ia";
import { relatorioReproductivo } from "./relatorios";

const delay = (min = 200, max = 500) =>
  new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)));

export function setupMocks(client: AxiosInstance): void {
  const mock = new MockAdapter(client, { delayResponse: 0, onNoMatch: "passthrough" });

  /* ── Auth ── */
  mock.onPost("/auth/login").reply(async () => {
    await delay();
    return [
      200,
      {
        success: true,
        data: {
          access_token: "mock-jwt-access-dev",
          refresh_token: "mock-jwt-refresh-dev",
          expires_in: 86400,
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil,
            fazenda_ativa_id: FAZENDA_ID,
          },
        },
      },
    ];
  });

  mock.onPost("/auth/registro").reply(async () => {
    await delay();
    return [201, { success: true, data: { id: "usr-new-001", mensagem: "Conta criada com sucesso." } }];
  });

  mock.onPost("/auth/logout").reply(async () => {
    await delay(100, 200);
    return [200, { success: true }];
  });

  mock.onPost("/auth/recuperar-senha").reply(async () => {
    await delay(400, 700);
    return [200, { success: true, data: { mensagem: "Se o e-mail estiver cadastrado, você receberá as instruções em breve." } }];
  });

  mock.onPost("/auth/redefinir-senha").reply(async () => {
    await delay(300, 500);
    return [200, { success: true, data: { mensagem: "Senha redefinida com sucesso." } }];
  });

  /* ── Usuário ── */
  mock.onGet("/usuarios/me").reply(async () => {
    await delay();
    return [200, { success: true, data: usuario }];
  });

  mock.onPatch("/usuarios/me").reply(async (config) => {
    await delay(300, 500);
    const body = config.data ? (JSON.parse(config.data as string) as Partial<typeof usuario>) : {};
    return [200, { success: true, data: { ...usuario, ...body } }];
  });

  mock.onGet("/usuarios/me/dados").reply(async () => {
    await delay(1000, 2000);
    return [200, { success: true, data: {
      usuario,
      animais_cadastrados: animais.length,
      inseminacoes_registradas: inseminacoes.length,
      export_gerado_em: new Date().toISOString(),
    } }];
  });

  /* ── Fazendas ── */
  mock.onGet("/fazendas").reply(async () => {
    await delay();
    return [200, { success: true, data: fazendas }];
  });

  mock.onPost("/fazendas").reply(async () => {
    await delay(300, 600);
    const novaFazenda = { id: `faz-new-${Date.now()}`, total_animais: 0, created_at: new Date().toISOString() };
    return [201, { success: true, data: novaFazenda }];
  });

  mock.onPut(/\/fazendas\/[^/]+$/).reply(async (config) => {
    await delay(300, 500);
    const id = config.url?.split("/").pop() ?? "";
    const fazenda = fazendas.find((f) => f.id === id);
    if (!fazenda) return [404, { success: false, error: { codigo: "FAZENDA_NOT_FOUND" } }];
    const body = config.data ? (JSON.parse(config.data as string) as Partial<typeof fazenda>) : {};
    return [200, { success: true, data: { ...fazenda, ...body } }];
  });

  mock.onDelete(/\/fazendas\/[^/]+$/).reply(async () => {
    await delay();
    return [200, { success: true }];
  });

  /* ── Animais ── */
  mock.onGet("/animais").reply(async (config) => {
    await delay();
    const params = config.params as Record<string, string> | undefined;
    let result = [...animais];

    if (params?.["especie"]) result = result.filter((a) => a.especie === params["especie"]);
    if (params?.["sexo"]) result = result.filter((a) => a.sexo === params["sexo"]);
    if (params?.["status"]) result = result.filter((a) => a.status === params["status"]);
    if (params?.["q"]) {
      const q = params["q"].toLowerCase();
      result = result.filter(
        (a) =>
          a.nome.toLowerCase().includes(q) ||
          a.codigo.toLowerCase().includes(q)
      );
    }

    const sort = params?.["sort"] ?? "nome";
    const order = params?.["order"] ?? "asc";
    result = [...result].sort((a, b) => {
      const va = String(a[sort as keyof typeof a] ?? "");
      const vb = String(b[sort as keyof typeof b] ?? "");
      return order === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    const page = Number(params?.["page"] ?? 1);
    const limit = Number(params?.["limit"] ?? 20);
    const total = result.length;
    const start = (page - 1) * limit;
    const data = result.slice(start, start + limit);

    return [
      200,
      {
        success: true,
        data,
        meta: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
          has_next: start + limit < total,
          has_prev: page > 1,
        },
      },
    ];
  });

  mock.onGet(/\/animais\/[^/]+$/).reply(async (config) => {
    await delay();
    const id = config.url?.split("/").pop() ?? "";
    const animal = animais.find((a) => a.id === id || a.codigo === id);
    if (!animal) return [404, { success: false, error: { codigo: "ANIMAL_NOT_FOUND" } }];
    return [200, { success: true, data: animal }];
  });

  mock.onGet(/\/animais\/[^/]+\/historico/).reply(async (config) => {
    await delay();
    const id = config.url?.split("/")[2] ?? "";
    const ins = inseminacoes.filter((i) => i.animal.id === id).slice(0, 10);
    return [200, { success: true, data: { inseminacoes: ins, pesagens: [], partos: [] } }];
  });

  mock.onGet("/animais/racas").reply(async (config) => {
    await delay(100, 200);
    const especie = (config.params as Record<string, string> | undefined)?.["especie"];
    const todas = {
      BOVINO: ["Nelore", "Angus", "Brahman", "Gir Leiteiro", "Guzerá", "Tabapuã", "Simmental"],
      OVINO: ["Santa Inês", "Morada Nova", "Dorper", "Suffolk", "Somalis Brasileira"],
      CAPRINO: ["Saanen", "Anglo-nubiano", "Boer", "Moxotó", "Canindé"],
    };
    const data = especie && especie in todas
      ? { [especie]: todas[especie as keyof typeof todas] }
      : todas;
    return [200, { success: true, data }];
  });

  mock.onPost("/animais").reply(async () => {
    await delay(300, 600);
    const newAnimal = { id: `ani-new-${Date.now()}`, codigo: "BOV-0099", status: "ATIVA", created_at: new Date().toISOString() };
    return [201, { success: true, data: newAnimal }];
  });

  mock.onPut(/\/animais\/[^/]+$/).reply(async (config) => {
    await delay(300, 500);
    const id = config.url?.split("/").pop() ?? "";
    const animal = animais.find((a) => a.id === id);
    if (!animal) return [404, { success: false, error: { codigo: "ANIMAL_NOT_FOUND" } }];
    const body = config.data ? (JSON.parse(config.data as string) as Partial<typeof animal>) : {};
    return [200, { success: true, data: { ...animal, ...body } }];
  });

  mock.onDelete(/\/animais\/.+/).reply(async () => {
    await delay();
    return [200, { success: true }];
  });

  /* ── Reprodutores ── */
  mock.onGet("/reprodutores").reply(async (config) => {
    await delay();
    const params = config.params as Record<string, string> | undefined;
    let result = [...reprodutores];

    if (params?.["especie"]) result = result.filter((r) => r.especie === params["especie"]);
    if (params?.["tipo"]) result = result.filter((r) => r.tipo === params["tipo"]);
    if (params?.["ativo"] !== undefined && params["ativo"] !== "") {
      const ativo = params["ativo"] === "true";
      result = result.filter((r) => r.ativo === ativo);
    }
    if (params?.["animal_id"]) result = result.filter((r) => r.animal_id === params["animal_id"]);
    if (params?.["q"]) {
      const q = params["q"].toLowerCase();
      result = result.filter(
        (r) => r.nome.toLowerCase().includes(q) || (r.registro ?? "").toLowerCase().includes(q)
      );
    }

    const sort = params?.["sort"] ?? "nome";
    const order = params?.["order"] ?? "asc";
    result = [...result].sort((a, b) => {
      const va = String(a[sort as keyof typeof a] ?? "");
      const vb = String(b[sort as keyof typeof b] ?? "");
      return order === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    const page = Number(params?.["page"] ?? 1);
    const limit = Number(params?.["limit"] ?? 20);
    const total = result.length;
    const start = (page - 1) * limit;
    const data = result.slice(start, start + limit);

    return [200, {
      success: true,
      data,
      meta: { page, limit, total, total_pages: Math.ceil(total / limit), has_next: start + limit < total, has_prev: page > 1 },
    }];
  });

  mock.onGet(/\/reprodutores\/[^/]+$/).reply(async (config) => {
    await delay();
    const id = config.url?.split("/").pop() ?? "";
    const rep = reprodutores.find((r) => r.id === id);
    if (!rep) return [404, { success: false, error: { codigo: "REPRODUTOR_NOT_FOUND" } }];
    return [200, { success: true, data: rep }];
  });

  mock.onPost("/reprodutores").reply(async (config) => {
    await delay(300, 600);
    const body = config.data ? (JSON.parse(config.data as string) as Partial<(typeof reprodutores)[0]>) : {};
    const novoRep = {
      id: `rep-new-${Date.now()}`,
      ativo: true,
      total_inseminacoes: 0,
      taxa_prenhez: 0,
      total_crias: 0,
      created_at: new Date().toISOString(),
      ...body,
    };
    return [201, { success: true, data: novoRep }];
  });

  mock.onPatch(/\/reprodutores\/[^/]+$/).reply(async (config) => {
    await delay(300, 500);
    const id = config.url?.split("/").pop() ?? "";
    const rep = reprodutores.find((r) => r.id === id);
    if (!rep) return [404, { success: false, error: { codigo: "REPRODUTOR_NOT_FOUND" } }];
    const body = config.data ? (JSON.parse(config.data as string) as Partial<typeof rep>) : {};
    return [200, { success: true, data: { ...rep, ...body } }];
  });

  mock.onDelete(/\/reprodutores\/[^/]+$/).reply(async (config) => {
    await delay();
    const id = config.url?.split("/").pop() ?? "";
    const rep = reprodutores.find((r) => r.id === id);
    if (rep && (rep.total_inseminacoes ?? 0) > 0) {
      return [409, { success: false, error: { codigo: "REPRODUTOR_TEM_VINCULOS", total_inseminacoes: rep.total_inseminacoes } }];
    }
    return [200, { success: true }];
  });

  /* ── Inseminações ── */
  mock.onGet("/inseminacoes").reply(async (config) => {
    await delay();
    const params = config.params as Record<string, string> | undefined;
    let result = [...inseminacoes];
    if (params?.["resultado"]) result = result.filter((i) => i.resultado === params["resultado"]);
    if (params?.["animal_id"]) result = result.filter((i) => i.animal.id === params["animal_id"]);
    const sort = params?.["sort"] ?? "data_inseminacao";
    const order = params?.["order"] ?? "desc";
    result = [...result].sort((a, b) => {
      const va = sort === "data_inseminacao" ? a.data_inseminacao : String(a.resultado);
      const vb = sort === "data_inseminacao" ? b.data_inseminacao : String(b.resultado);
      return order === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    const page = Number(params?.["page"] ?? 1);
    const limit = Number(params?.["limit"] ?? 20);
    const total = result.length;
    const start = (page - 1) * limit;

    return [
      200,
      {
        success: true,
        data: result.slice(start, start + limit),
        meta: { page, limit, total, total_pages: Math.ceil(total / limit), has_next: start + limit < total, has_prev: page > 1 },
      },
    ];
  });

  mock.onGet("/inseminacoes/pendentes-diagnostico").reply(async () => {
    await delay();
    const pendentes = inseminacoes
      .filter((i) => i.resultado === "PENDENTE")
      .sort((a, b) => b.dias_decorridos - a.dias_decorridos);
    const criticos = pendentes.filter((i) => i.dias_decorridos > 30).length;
    const atencao = pendentes.filter((i) => i.dias_decorridos > 14 && i.dias_decorridos <= 30).length;
    return [200, { success: true, data: pendentes, meta: { total: pendentes.length, criticos, atencao } }];
  });

  mock.onPost("/inseminacoes").reply(async () => {
    await delay(300, 600);
    return [
      201,
      {
        success: true,
        data: {
          id: `ins-new-${Date.now()}`,
          resultado: "PENDENTE",
          alerta_criado: { id: `ale-new-${Date.now()}` },
        },
      },
    ];
  });

  mock.onPost(/\/inseminacoes\/[^/]+\/diagnostico/).reply(async () => {
    await delay(300, 500);
    return [
      200,
      {
        success: true,
        data: {
          id: `diag-new-${Date.now()}`,
          resultado: "PRENHA",
          animal_status_atualizado: "PRENHA",
          alerta_resolvido: true,
        },
      },
    ];
  });

  /* ── Diário ── */
  mock.onGet(/\/diario\/[^/]+\/pesagens/).reply(async (config) => {
    await delay();
    const animalId = config.url?.split("/")[2] ?? "";
    const data = animalId === "ani-008" ? pesagensOVI0007 : [];
    return [
      200,
      {
        success: true,
        data,
        resumo: {
          ultima_pesagem_kg: data.length > 0 ? data[data.length - 1]?.peso_kg : undefined,
          gmd_periodo: data.length > 1 ? data[data.length - 1]?.gmd_calculado : undefined,
          total_registros: data.length,
        },
        meta: { page: 1, limit: 20, total: data.length, total_pages: 1, has_next: false, has_prev: false },
      },
    ];
  });

  mock.onPost(/\/diario\/[^/]+\/pesagens/).reply(async () => {
    await delay(300, 500);
    return [201, { success: true, data: { id: `pes-new-${Date.now()}`, gmd_calculado: 0.02 } }];
  });

  mock.onGet(/\/diario\/[^/]+\/partos/).reply(async (config) => {
    await delay();
    const animalId = config.url?.split("/")[2] ?? "";
    const data = animalId === "ani-002" ? partosBOV0012 : [];
    const total_partos = data.length;
    const iep_medio_dias = total_partos > 1 ? 365 : 0;
    const prolificidade_media = total_partos > 0
      ? data.reduce((acc, p) => acc + p.num_crias_vivas, 0) / total_partos
      : 0;
    return [200, {
      success: true,
      data,
      resumo: { total_partos, iep_medio_dias, prolificidade_media: Math.round(prolificidade_media * 10) / 10 },
      meta: { page: 1, limit: 20, total: data.length, total_pages: 1, has_next: false, has_prev: false },
    }];
  });

  mock.onPost(/\/diario\/[^/]+\/partos/).reply(async () => {
    await delay(300, 500);
    return [201, { success: true, data: { id: `par-new-${Date.now()}` } }];
  });

  mock.onGet(/\/diario\/[^/]+\/sanitario/).reply(async (config) => {
    await delay();
    const animalId = config.url?.split("/")[2] ?? "";
    const data = animalId === "ani-002" ? sanitarioBOV0012 : [];
    const hoje = new Date().toISOString().slice(0, 10);
    const alertas_proxima_dose = data.filter((e) => {
      if (!e.proxima_dose) return false;
      const diff = (new Date(e.proxima_dose).getTime() - new Date(hoje).getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;
    return [200, {
      success: true,
      data,
      alertas_proxima_dose,
      meta: { page: 1, limit: 20, total: data.length, total_pages: 1, has_next: false, has_prev: false },
    }];
  });

  mock.onPost(/\/diario\/[^/]+\/sanitario/).reply(async () => {
    await delay(300, 500);
    return [201, { success: true, data: { id: `san-new-${Date.now()}` } }];
  });

  mock.onGet(/\/diario\/[^/]+\/ocorrencias/).reply(async (config) => {
    await delay();
    const animalId = config.url?.split("/")[2] ?? "";
    const data = animalId === "ani-002" ? ocorrenciasBOV0012 : [];
    return [200, { success: true, data, meta: { page: 1, limit: 20, total: data.length, total_pages: 1, has_next: false, has_prev: false } }];
  });

  mock.onPost(/\/diario\/[^/]+\/ocorrencias/).reply(async () => {
    await delay(300, 500);
    return [201, { success: true, data: { id: `oco-new-${Date.now()}` } }];
  });

  /* ── Alertas ── */
  mock.onGet("/alertas").reply(async (config) => {
    await delay();
    const params = config.params as Record<string, string> | undefined;
    let result = [...alertas];
    if (params?.["lido"] === "false") result = result.filter((a) => !a.lido);
    if (params?.["resolvido"] === "false") result = result.filter((a) => !a.resolvido);
    const naoLidos = alertas.filter((a) => !a.lido).length;
    const criticos = alertas.filter((a) => a.prioridade === "CRITICA" && !a.resolvido).length;
    return [
      200,
      {
        success: true,
        data: result,
        meta: { total: result.length, nao_lidos: naoLidos, criticos },
      },
    ];
  });

  mock.onGet("/alertas/contagem").reply(async () => {
    await delay(50, 150);
    const naoLidos = alertas.filter((a) => !a.lido).length;
    const criticos = alertas.filter((a) => a.prioridade === "CRITICA" && !a.resolvido).length;
    return [200, { success: true, data: { nao_lidos: naoLidos, criticos, total: alertas.length } }];
  });

  mock.onPatch(/\/alertas\/[^/]+\/lido/).reply(async () => {
    await delay(100, 200);
    return [200, { success: true }];
  });

  mock.onPatch(/\/alertas\/[^/]+\/resolver/).reply(async () => {
    await delay(100, 200);
    return [200, { success: true }];
  });

  /* ── Dashboard ── */
  mock.onGet("/dashboard/kpis").reply(async () => {
    await delay();
    return [200, { success: true, data: dashboardKPIs }];
  });

  mock.onGet("/dashboard/grafico-reprodutivo").reply(async (config) => {
    await delay();
    const params = config.params as Record<string, string> | undefined;
    const meses = Number(params?.["meses"] ?? 6);
    const total = graficoReproductivo.labels.length;
    const start = Math.max(0, total - meses);
    return [200, { success: true, data: {
      labels: graficoReproductivo.labels.slice(start),
      inseminacoes: graficoReproductivo.inseminacoes.slice(start),
      taxa_prenhez: graficoReproductivo.taxa_prenhez.slice(start),
      periodo: graficoReproductivo.periodo,
    } }];
  });

  mock.onGet("/dashboard/timeline").reply(async () => {
    await delay();
    return [200, { success: true, data: timeline }];
  });

  /* ── IA ── */
  mock.onPost("/ia/predicao-prenhez").reply(async () => {
    await delay(600, 900);
    return [200, { success: true, data: predicaoPrenhez }];
  });

  mock.onGet("/ia/padroes-fertilidade").reply(async () => {
    await delay(400, 700);
    return [200, { success: true, data: padroesFertilidade }];
  });

  mock.onPost("/ia/selecao-genetica").reply(async () => {
    await delay(500, 800);
    return [
      200,
      {
        success: true,
        data: {
          recomendacoes: [
            {
              matriz: { id: "ani-001", codigo: "BOV-0001", nome: "Estrela" },
              reprodutor: { id: "rep-002", nome: "Zeus Angus" },
              score_genetico: 0.87,
              heterose_esperada_pct: 12.0,
              risco_endogamia_f: 0.02,
              alerta_consanguinidade: false,
              justificativa: "Cruzamento Nelore × Angus maximiza ganho de peso com heterose positiva.",
            },
            {
              matriz: { id: "ani-002", codigo: "BOV-0012", nome: "Mimosa" },
              reprodutor: { id: "rep-001", nome: "Titan Nelore" },
              score_genetico: 0.82,
              heterose_esperada_pct: 8.0,
              risco_endogamia_f: 0.03,
              alerta_consanguinidade: false,
              justificativa: "Alta compatibilidade genética com baixo risco de endogamia.",
            },
          ],
        },
      },
    ];
  });

  /* ── Relatórios ── */
  mock.onGet("/relatorios/reprodutivo").reply(async () => {
    await delay();
    return [200, { success: true, data: relatorioReproductivo, meta: { page: 1, limit: 20, total: relatorioReproductivo.length, total_pages: 1, has_next: false, has_prev: false } }];
  });

  mock.onGet("/relatorios/ponderal").reply(async () => {
    await delay();
    return [200, { success: true, data: [
      { animal_codigo: "BOV-0012", nome: "Mimosa", ultima_pesagem_kg: 420.0, gmd_periodo: 0.285, num_pesagens: 6 },
      { animal_codigo: "OVI-0007", nome: "Branca", ultima_pesagem_kg: 34.8, gmd_periodo: 0.12, num_pesagens: 4 },
    ], meta: { page: 1, limit: 50, total: 2, total_pages: 1, has_next: false, has_prev: false } }];
  });

  mock.onGet("/relatorios/sanitario").reply(async () => {
    await delay();
    return [200, { success: true, data: [
      { animal_codigo: "BOV-0012", tipo: "VACINA", produto: "Febre Aftosa", data_aplicacao: "2026-03-01", proxima_dose: "2026-09-01", responsavel: "José da Silva" },
      { animal_codigo: "BOV-0012", tipo: "VERMIFUGACAO", produto: "Ivermectina 1%", data_aplicacao: "2026-06-05", proxima_dose: "2026-09-05", responsavel: "Maria Campos" },
    ], meta: { page: 1, limit: 50, total: 2, total_pages: 1, has_next: false, has_prev: false } }];
  });

  mock.onPost("/animais/importar-csv").reply(async () => {
    await delay(800, 1500);
    return [200, { success: true, data: { total_linhas: 5, importados: 4, erros: 1, detalhes_erros: [{ linha: 3, erro: "Peso fora da faixa válida para Bovino: 1200 kg" }] } }];
  });

  mock.onGet(/\/diario\/[^/]+\/exportar-pdf/).reply(async () => {
    await delay(1500, 2500);
    const blob = new Blob(["mock-pdf-content"], { type: "application/pdf" });
    return [200, blob];
  });
}
