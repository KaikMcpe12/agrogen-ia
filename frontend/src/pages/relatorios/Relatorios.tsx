import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { relatoriosApi } from "@/lib/api/endpoints/relatorios";
import { useChartTheme } from "@/hooks/useChartTheme";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const RESULTADO_VARIANT: Record<string, "ok" | "warn" | "danger" | "ghost"> = {
  PRENHA: "ok",
  PENDENTE: "warn",
  VAZIA: "danger",
  CANCELADA: "ghost",
};

export function RelatoriosPage() {
  const chartTheme = useChartTheme();
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [especie, setEspecie] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["relatorio-reprodutivo", dataInicio, dataFim, especie],
    queryFn: () =>
      relatoriosApi.reprodutivo({
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        especie: especie || undefined,
      }),
  });

  const exportarPDF = useMutation({
    mutationFn: () => relatoriosApi.exportarPDF("reprodutivo"),
    onMutate: () => setPdfLoading(true),
    onSettled: () => setPdfLoading(false),
  });

  const rows = data?.data ?? [];

  const resumoChart = (() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => { counts[r.resultado] = (counts[r.resultado] ?? 0) + 1; });
    return Object.entries(counts).map(([resultado, count]) => ({ resultado, count }));
  })();

  const exportCSV = () => {
    const headers = ["Código", "Nome", "Data", "Tipo IA", "Reprodutor", "Resultado", "Técnico"];
    const lines = rows.map((r) =>
      [r.animal_codigo, r.animal_nome, r.data_inseminacao, r.tipo_ia, r.reprodutor, r.resultado, r.tecnico].join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "relatorio-reprodutivo.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Relatórios
          </h1>
          <p className="text-[14px] text-ink-3 mt-0.5">Exportação e análise de dados do rebanho</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={exportCSV} disabled={rows.length === 0}>
            <Download size={14} /> CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => exportarPDF.mutate()} loading={pdfLoading}>
            <FileText size={14} /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card padding="sm">
        <p className="text-[13px] font-semibold text-ink-2 mb-3">Filtros</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="Data início" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          <Input label="Data fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-ink-2">Espécie</label>
            <select
              value={especie}
              onChange={(e) => setEspecie(e.target.value)}
              className="w-full appearance-none px-3 py-[10px] rounded-[10px] border border-line text-[14px] text-ink bg-surface outline-none focus:border-green-700 focus:ring-[3px] focus:ring-green-700/18 transition-all cursor-pointer"
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
              onClick={() => { setDataInicio(""); setDataFim(""); setEspecie(""); }}
            >
              Limpar
            </Button>
          </div>
        </div>
      </Card>

      {/* Gráfico de resumo */}
      {resumoChart.length > 0 && (
        <Card padding="sm">
          <p className="text-[13px] font-semibold text-ink-2 mb-3">Resumo por resultado</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={resumoChart} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
              <XAxis dataKey="resultado" tick={{ fontSize: 11, fill: chartTheme.textColor }} />
              <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} />
              <Tooltip
                contentStyle={{ background: chartTheme.tooltipBg, border: "1px solid #e6e3dc", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [String(v), "Registros"] as [string, string]}
              />
              <Bar dataKey="count" fill={chartTheme.primaryColor} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Tabela */}
      <div>
        <p className="text-[13px] text-ink-3 mb-2">
          Exibindo {Math.min(rows.length, 50)} de {rows.length} registros
        </p>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => <Card key={i} className="h-12 animate-pulse bg-beige">{null}</Card>)}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
            <table className="w-full">
              <thead>
                <tr className="bg-beige border-b border-line">
                  {["Animal", "Data", "Tipo IA", "Reprodutor", "Resultado", "Técnico"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-ink-2 uppercase tracking-[0.04em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0 hover:bg-beige/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[14px] font-medium text-ink">{r.animal_nome}</p>
                      <p className="text-[11px] font-mono text-ink-4">{r.animal_codigo}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-ink-2">
                      {new Date(r.data_inseminacao).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-mono text-ink-3 bg-transparent">
                      <span className="bg-beige px-2 py-0.5 rounded-[6px]">{r.tipo_ia}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-ink-2">{r.reprodutor}</td>
                    <td className="px-4 py-3">
                      <Badge variant={RESULTADO_VARIANT[r.resultado] ?? "ghost"}>{r.resultado}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-ink-3">{r.tecnico}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
