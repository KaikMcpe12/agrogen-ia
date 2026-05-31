import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/Logo";
import { relatoriosApi } from "@/lib/api/endpoints/relatorios";
import { fazendasApi } from "@/lib/api/endpoints/fazendas";
import { useDebounce } from "@/hooks/useDebounce";
import { useFazendaAtiva } from "@/hooks/useFazendaAtiva";
import { pdf } from "@react-pdf/renderer";
import { RelatorioPDF } from "@/components/pdf/RelatorioPDF";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type TipoRelatorio =
  | "reprodutivo"
  | "ponderal"
  | "sanitario"
  | "reprodutores"
  | "especies";

const TIPO_LABELS: Record<TipoRelatorio, string> = {
  reprodutivo: "Reprodutivo",
  ponderal: "Ponderal",
  sanitario: "Sanitário",
  reprodutores: "Comparativo Reprodutores",
  especies: "Resumo por Espécie",
};

function getPeriod(type: "mes" | "trimestre" | "ano") {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0] ?? "";
  if (type === "mes") {
    return {
      inicio: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
      fim: fmt(now),
    };
  }
  if (type === "trimestre") {
    return {
      inicio: fmt(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
      fim: fmt(now),
    };
  }
  return { inicio: fmt(new Date(now.getFullYear(), 0, 1)), fim: fmt(now) };
}

const RESULTADO_LABEL: Record<string, string> = {
  PRENHA: "Prenha",
  PENDENTE: "Pendente",
  VAZIA: "Vazia",
  CANCELADA: "Cancelada",
};

const DONUT_COLORS: Record<string, string> = {
  PRENHA: "#2d6a4f",
  VAZIA: "#dc2626",
  PENDENTE: "#d4a017",
  CANCELADA: "#9ca3af",
};

const BADGE_CLASSES: Record<string, string> = {
  PRENHA: "bg-green-50 text-green-800 border border-green-200",
  VAZIA: "bg-red-50 text-red-800 border border-red-200",
  PENDENTE: "bg-amber-50 text-amber-800 border border-amber-200",
  CANCELADA: "bg-gray-100 text-gray-600 border border-gray-200",
};

export function RelatoriosPage() {
  const { fazendaId } = useFazendaAtiva();
  const [tipo, setTipo] = useState<TipoRelatorio>("reprodutivo");
  const [dataInicio, setDataInicio] = useState(() => getPeriod("mes").inicio);
  const [dataFim, setDataFim] = useState(() => getPeriod("mes").fim);
  const [especie, setEspecie] = useState("");

  const debouncedInicio = useDebounce(dataInicio, 500);
  const debouncedFim = useDebounce(dataFim, 500);
  const debouncedEspecie = useDebounce(especie, 500);

  const { data, isLoading } = useQuery({
    queryKey: [
      "relatorio-reprodutivo",
      debouncedInicio,
      debouncedFim,
      debouncedEspecie,
    ],
    queryFn: () =>
      relatoriosApi.reprodutivo({
        data_inicio: debouncedInicio || undefined,
        data_fim: debouncedFim || undefined,
        especie: debouncedEspecie || undefined,
      }),
    enabled: tipo === "reprodutivo",
  });

  const { data: fazendasData } = useQuery({
    queryKey: ["fazendas"],
    queryFn: () => fazendasApi.listar(),
    staleTime: 5 * 60 * 1000,
  });
  const fazendas = fazendasData?.data ?? [];
  const fazendaAtiva =
    fazendas.find((f) => f.id === fazendaId) ?? fazendas[0] ?? null;

  const hasFilter = !!dataInicio || !!dataFim || !!especie;

  const rows = data?.data ?? [];
  const prenhas = rows.filter((r) => r.resultado === "PRENHA").length;
  const falhas = rows.filter((r) => r.resultado === "VAZIA").length;
  const taxaPrenhez =
    rows.length > 0 ? Math.round((prenhas / rows.length) * 100) : 0;

  const donutData = (() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      counts[r.resultado] = (counts[r.resultado] ?? 0) + 1;
    });
    return Object.entries(counts).map(([resultado, value]) => ({
      name: RESULTADO_LABEL[resultado] ?? resultado,
      value,
      key: resultado,
    }));
  })();

  const chartReprodutor = (() => {
    const acc: Record<string, { total: number; prenhas: number }> = {};
    rows.forEach((r) => {
      if (!acc[r.reprodutor]) acc[r.reprodutor] = { total: 0, prenhas: 0 };
      (acc[r.reprodutor] as { total: number; prenhas: number }).total++;
      if (r.resultado === "PRENHA")
        (acc[r.reprodutor] as { total: number; prenhas: number }).prenhas++;
    });
    return Object.entries(acc).map(([name, v]) => ({
      name,
      taxa: Math.round((v.prenhas / v.total) * 100),
    }));
  })();

  const fmtDate = (iso: string) =>
    iso ? new Date(iso + "T00:00:00").toLocaleDateString("pt-BR") : "—";
  const hoje = new Date().toLocaleDateString("pt-BR");

  const exportCSV = () => {
    const headers = [
      "Código",
      "Nome",
      "Data",
      "Tipo IA",
      "Reprodutor",
      "Resultado",
      "Técnico",
    ];
    const lines = rows.map((r) =>
      [
        r.animal_codigo,
        r.animal_nome,
        r.data_inseminacao,
        r.tipo_ia,
        r.reprodutor,
        r.resultado,
        r.tecnico,
      ].join(","),
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-reprodutivo.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleExportPDF = async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      if (!hasFilter || isLoading || rows.length === 0) {
        setPdfError("Selecione um período e aguarde os dados carregarem antes de exportar.");
        return;
      }

      // Captura a logo (SVG puro com cores HEX) — sem CSS, sem oklch
      const svgToPng = (svgEl: SVGSVGElement, w: number, h: number, scale = 2): Promise<string> => {
        const clone = svgEl.cloneNode(true) as SVGSVGElement;
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
        clone.setAttribute("width", String(Math.round(w)));
        clone.setAttribute("height", String(Math.round(h)));
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
        return new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(w * scale);
            canvas.height = Math.round(h * scale);
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(""); return; }
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/png"));
          };
          img.onerror = () => resolve("");
          img.src = dataUrl;
        });
      };

      const logoSvgEl = document.querySelector<SVGSVGElement>(
        "#relatorio-print-area svg[aria-hidden='true']"
      );
      const logoImg = logoSvgEl ? await svgToPng(logoSvgEl, 72, 72) : "";

      const blob = await pdf(
        <RelatorioPDF
          fazendaNome={fazendaAtiva?.nome ?? "Fazenda"}
          dataInicio={dataInicio ? fmtDate(dataInicio) : "—"}
          dataFim={dataFim ? fmtDate(dataFim) : "—"}
          hoje={hoje}
          rows={rows}
          prenhas={prenhas}
          falhas={falhas}
          taxaPrenhez={taxaPrenhez}
          logoImg={logoImg}
          donutData={donutData}
          chartReprodutor={chartReprodutor}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-reprodutivo-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido ao gerar PDF.";
      setPdfError(msg);
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="max-w-360 mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
      {/* ── ZONA 1: Controles (ocultos na impressão) ── */}
      <div className="print:hidden flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-[22px] font-bold text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Relatórios
            </h1>
            <p className="text-[14px] text-ink-3 mt-0.5">
              Exportação e análise de dados do rebanho
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] text-ink-4 hidden sm:block">
              Exportar:
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportCSV}
              disabled={!hasFilter || isLoading || rows.length === 0}
            >
              <Download size={14} /> CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportPDF}
              loading={pdfLoading}
              disabled={!hasFilter || isLoading || rows.length === 0}
            >
              <FileText size={14} /> PDF
            </Button>
          </div>
        </div>

        {/* Feedback de erro do PDF */}
        {pdfError && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-[10px] bg-danger-bg border border-danger/30 text-[12px] text-danger">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{pdfError}</span>
          </div>
        )}

        {/* Tabs de tipo */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none [-ms-overflow-style:none] pb-1">
          {(Object.entries(TIPO_LABELS) as [TipoRelatorio, string][]).map(
            ([t, label]) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={[
                  "px-3 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors",
                  tipo === t
                    ? "bg-green-900 text-white border-green-900"
                    : "bg-surface text-ink-3 border-line hover:bg-beige",
                  t !== "reprodutivo" ? "opacity-60" : "",
                ].join(" ")}
              >
                {label}
                {t !== "reprodutivo" && (
                  <span className="ml-1 text-[10px]">(em breve)</span>
                )}
              </button>
            ),
          )}
        </div>

        {/* Filtros */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink-2">Filtros</p>
            <div className="flex gap-1.5">
              {(["mes", "trimestre", "ano"] as const).map((p) => {
                const labels = {
                  mes: "Este mês",
                  trimestre: "Último trim.",
                  ano: "Este ano",
                };
                return (
                  <button
                    key={p}
                    onClick={() => {
                      const r = getPeriod(p);
                      setDataInicio(r.inicio);
                      setDataFim(r.fim);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[12px] font-medium border border-line bg-surface hover:bg-white text-ink-3 transition-colors"
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              label="Data início"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
            <Input
              label="Data fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-ink-2">
                Espécie
              </label>
              <select
                value={especie}
                onChange={(e) => setEspecie(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 rounded-[10px] border border-line text-[14px] text-ink bg-surface outline-none focus:border-green-700 focus:ring-[3px] focus:ring-green-700/18 transition-all cursor-pointer"
              >
                <option value="">Todas</option>
                <option value="BOVINO">Bovino</option>
                <option value="OVINO">Ovino</option>
                <option value="CAPRINO">Caprino</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDataInicio("");
                  setDataFim("");
                  setEspecie("");
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* ── ZONA 2: Contêiner do Relatório (capturado pelo PDF) ── */}
      {!hasFilter ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-gray-200 bg-white text-center">
          <FileText size={36} className="text-gray-300" />
          <p className="text-[15px] font-semibold text-gray-500" style={{ fontFamily: "var(--font-display)" }}>
            Selecione um período
          </p>
          <p className="text-[13px] text-gray-400 max-w-xs">
            Defina as datas de início e fim para visualizar o relatório reprodutivo.
          </p>
        </div>
      ) : (
      <div
        id="relatorio-print-area"
        className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_24px_rgba(0,0,0,0.07)] overflow-hidden"
      >
        {/* Header interno */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-6 sm:px-8 py-6 border-b border-gray-100 print-no-break">
          <div className="flex flex-col gap-1.5">
            <Logo variant="full" size={26} />
            <h2
              className="text-[20px] font-bold text-gray-900 mt-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Relatório Reprodutivo
            </h2>
            <p className="text-[13px] text-gray-500">
              {fazendaAtiva?.nome ?? "—"}
            </p>
          </div>
          <div className="flex flex-col gap-0.5 sm:text-right">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Período
            </p>
            <p className="text-[14px] font-bold text-gray-800">
              {dataInicio ? fmtDate(dataInicio) : "—"} →{" "}
              {dataFim ? fmtDate(dataFim) : "—"}
            </p>
            <p className="text-[12px] text-gray-400 mt-1">Gerado em {hoje}</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 print-no-break">
          {[
            {
              label: "Inseminações",
              value: rows.length > 0 ? String(rows.length) : "—",
              sub: "no período",
            },
            {
              label: "Taxa de prenhez",
              value: rows.length > 0 ? `${taxaPrenhez}%` : "—",
              sub:
                rows.length > 0
                  ? `${prenhas} prenhas · ${falhas} falhas`
                  : "sem dados",
            },
            {
              label: "Nascimentos esperados",
              value: rows.length > 0 ? String(prenhas) : "—",
              sub: "Em até 9–11 meses",
            },
            {
              label: "Falhas registradas",
              value: rows.length > 0 ? String(falhas) : "—",
              sub:
                rows.length > 0
                  ? `de ${rows.length} inseminações`
                  : "sem dados",
            },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white px-5 py-5 flex flex-col gap-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {label}
              </p>
              <span
                className="text-[34px] font-bold text-gray-900 leading-none"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {value}
              </span>
              <p className="text-[12px] text-gray-500">{sub}</p>
            </div>
          ))}
        </div>

        {/* Gráficos duplos */}
        {donutData.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-px bg-gray-100 print-no-break">
            {/* Donut — Distribuição de resultados */}
            <div id="chart-donut" className="bg-white px-6 py-6">
              <h3
                className="text-[14px] font-semibold text-gray-800 mb-0.5"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Distribuição de resultados
              </h3>
              <p className="text-[12px] text-gray-400 mb-3">
                Inseminações no período
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {donutData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={DONUT_COLORS[entry.key] ?? "#9ca3af"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v) =>
                      [String(v), "Registros"] as [string, string]
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar — Taxa por reprodutor */}
            <div id="chart-reprodutor" className="bg-white px-6 py-6">
              <h3
                className="text-[14px] font-semibold text-gray-800 mb-0.5"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Taxa de prenhez por reprodutor
              </h3>
              <p className="text-[12px] text-gray-400 mb-3">
                % de prenhez por sêmen utilizado
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartReprodutor}
                  margin={{ top: 0, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v) =>
                      [`${String(v)}%`, "Taxa de prenhez"] as [string, string]
                    }
                  />
                  <Bar dataKey="taxa" fill="#2d6a4f" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tabela de eventos */}
        <div className="px-6 sm:px-8 py-6 print-no-break">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-[14px] font-semibold text-gray-800"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Eventos detalhados
            </h3>
            <span className="text-[12px] text-gray-400">
              {rows.length > 0
                ? `Exibindo ${Math.min(rows.length, 50)} de ${rows.length} registros`
                : "Nenhum registro"}
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse bg-gray-50 rounded-lg"
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <BarChart2 size={28} className="text-gray-300" />
              <p
                className="text-[15px] font-semibold text-gray-600"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sem dados no período
              </p>
              <p className="text-[13px] text-gray-400 max-w-xs">
                Ajuste os filtros ou selecione um período diferente.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {rows.slice(0, 50).map((r, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-gray-900 truncate">
                          {r.animal_nome}
                        </p>
                        <p className="text-[11px] font-mono text-gray-400">
                          {r.animal_codigo}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${BADGE_CLASSES[r.resultado] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}
                      >
                        {RESULTADO_LABEL[r.resultado] ?? r.resultado}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                      <div>
                        <span className="text-gray-400">Data: </span>
                        <span className="text-gray-700">
                          {fmtDate(r.data_inseminacao)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Tipo: </span>
                        <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                          {r.tipo_ia}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Reprodutor: </span>
                        <span className="text-gray-700">{r.reprodutor}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Técnico: </span>
                        <span className="text-gray-700">{r.tecnico}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: tabela com zebra */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-beige">
                      {[
                        "Animal",
                        "Data",
                        "Tipo IA",
                        "Reprodutor",
                        "Resultado",
                        "Técnico",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-medium text-gray-900">
                            {r.animal_nome}
                          </p>
                          <p className="text-[10px] font-mono text-gray-400">
                            {r.animal_codigo}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-gray-600">
                          {fmtDate(r.data_inseminacao)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {r.tipo_ia}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-gray-600">
                          {r.reprodutor}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${BADGE_CLASSES[r.resultado] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}
                          >
                            {RESULTADO_LABEL[r.resultado] ?? r.resultado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-gray-500">
                          {r.tecnico}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Rodapé de impressão (visível apenas no @media print) */}
        <div className="hidden print:flex justify-between items-center px-8 py-4 border-t border-gray-200 text-[10px] text-gray-400">
          <span>Assinatura digital: AGRO-MPTZVBYS</span>
          <span>Dados tratados conforme LGPD (Lei nº 13.709/2018)</span>
        </div>
      </div>
      )}
    </div>
  );
}
