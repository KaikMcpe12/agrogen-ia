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
  mock.onPost("/auth/login").reply(async (_config) => {
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

  /* ── Usuário ── */
  mock.onGet("/usuarios/me").reply(async () => {
    await delay();
    return [200, { success: true, data: usuario }];
  });

  /* ── Fazendas ── */
  mock.onGet("/fazendas").reply(async () => {
    await delay();
    return [200, { success: true, data: fazendas }];
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

  mock.onGet("/animais/counts").reply(async () => {
    await delay(50, 150);
    return [200, {
      success: true,
      data: {
        total: animais.length,
        bovino: animais.filter((a) => a.especie === "BOVINO").length,
        ovino: animais.filter((a) => a.especie === "OVINO").length,
        caprino: animais.filter((a) => a.especie === "CAPRINO").length,
        ativa: animais.filter((a) => a.status === "ATIVA").length,
        prenha: animais.filter((a) => a.status === "PRENHA").length,
        em_repouso: animais.filter((a) => a.status === "EM_REPOUSO").length,
        descartada: animais.filter((a) => a.status === "DESCARTADA").length,
      },
    }];
  });

  mock.onGet("/animais/racas").reply(async () => {
    await delay(100, 200);
    return [200, { success: true, data: ["Nelore", "Angus", "Brahman", "Gir Leiteiro", "Dorper", "Santa Inês", "Boer", "Saanen"] }];
  });

  mock.onPost("/animais").reply(async (_config) => {
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
    return [200, { success: true, data: result }];
  });

  mock.onPost("/reprodutores").reply(async () => {
    await delay();
    return [201, { success: true, data: { id: `rep-new-${Date.now()}`, nome: "Novo Reprodutor" } }];
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
    return [200, { success: true, data: pendentes }];
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
    return [200, { success: true, data, meta: { page: 1, limit: 20, total: data.length, total_pages: 1, has_next: false, has_prev: false } }];
  });

  mock.onPost(/\/diario\/[^/]+\/partos/).reply(async () => {
    await delay(300, 500);
    return [201, { success: true, data: { id: `par-new-${Date.now()}` } }];
  });

  mock.onGet(/\/diario\/[^/]+\/sanitario/).reply(async (config) => {
    await delay();
    const animalId = config.url?.split("/")[2] ?? "";
    const data = animalId === "ani-002" ? sanitarioBOV0012 : [];
    return [200, { success: true, data, meta: { page: 1, limit: 20, total: data.length, total_pages: 1, has_next: false, has_prev: false } }];
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
    return [200, { success: true, data: graficoReproductivo.slice(-meses) }];
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
            { matriz: "BOV-0001 Estrela", reprodutor: "Zeus Angus", score_genetico: 87, heterose_esperada: "12%", risco_endogamia: "0.02" },
            { matriz: "BOV-0012 Mimosa", reprodutor: "Titan Nelore", score_genetico: 82, heterose_esperada: "8%", risco_endogamia: "0.03" },
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

  mock.onGet("/relatorios/reprodutivo/exportar").reply(async () => {
    await delay(3000, 4000);
    return [200, { success: true, data: { url: "/mock-report.pdf" } }];
  });
}
