import {
  Document, Page, View, Text, Image, StyleSheet,
  Svg, Path,
} from "@react-pdf/renderer";
import type { RelatorioReprodutivoRow } from "@/lib/api/endpoints/relatorios";

interface RelatorioPDFProps {
  fazendaNome: string;
  dataInicio: string;
  dataFim: string;
  hoje: string;
  rows: RelatorioReprodutivoRow[];
  prenhas: number;
  falhas: number;
  taxaPrenhez: number;
  logoImg: string;
  donutData: Array<{ name: string; value: number; key: string }>;
  chartReprodutor: Array<{ name: string; taxa: number }>;
}

const CHART_COLORS: Record<string, string> = {
  PRENHA:    "#2d6a4f",
  VAZIA:     "#dc2626",
  PENDENTE:  "#d4a017",
  CANCELADA: "#9ca3af",
};

// ---------------------------------------------------------------------------
// Helpers para calcular o caminho SVG de cada segmento do donut
// ---------------------------------------------------------------------------
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArc(
  cx: number, cy: number,
  or_: number, ir: number,
  startDeg: number, endDeg: number,
): string {
  const s = polar(cx, cy, or_, startDeg);
  const e = polar(cx, cy, or_, endDeg);
  const si = polar(cx, cy, ir, endDeg);
  const ei = polar(cx, cy, ir, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(3);
  return [
    `M ${f(s.x)} ${f(s.y)}`,
    `A ${or_} ${or_} 0 ${large} 1 ${f(e.x)} ${f(e.y)}`,
    `L ${f(si.x)} ${f(si.y)}`,
    `A ${ir} ${ir} 0 ${large} 0 ${f(ei.x)} ${f(ei.y)}`,
    "Z",
  ].join(" ");
}
// ---------------------------------------------------------------------------

// Proporções de colunas da tabela
const COL = { animal: 1.8, codigo: 1, data: 1.1, tipoIA: 1.1, reprodutor: 1.8, resultado: 1 };

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
  },

  // Cabeçalho
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  logoImg:    { width: 36, height: 36 },
  brandTitle: { fontSize: 17, fontFamily: "Helvetica-Bold", color: "#1b4332" },
  reportTitle:{ fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 3 },
  metaText:   { fontSize: 9,  color: "#6b7280", marginTop: 2 },
  periodLabel:{ fontSize: 8,  color: "#9ca3af", textTransform: "uppercase" },
  periodValue:{ fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 2 },

  // KPIs
  kpiGrid:  { flexDirection: "row", gap: 1, backgroundColor: "#e5e7eb", marginBottom: 1 },
  kpiCard:  { flex: 1, backgroundColor: "#ffffff", padding: 10 },
  kpiLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase" },
  kpiValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#111827", marginTop: 3 },
  kpiSub:   { fontSize: 8,  color: "#6b7280", marginTop: 2 },

  // Gráficos
  chartsRow: { flexDirection: "row", gap: 1, backgroundColor: "#e5e7eb", marginBottom: 1 },
  chartBox:  { flex: 1, backgroundColor: "#ffffff", padding: 14 },
  chartTitle:{ fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  chartSub:  { fontSize: 8,  color: "#6b7280", marginBottom: 8 },

  // Donut — legenda ao lado do SVG
  donutWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  donutLegend:  { flex: 1 },
  donutRow:     { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  donutDot:     { width: 9, height: 9, borderRadius: 2, marginRight: 5 },
  donutLabel:   { flex: 1, fontSize: 8, color: "#374151" },
  donutCount:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#111827", width: 16, textAlign: "right" },
  donutPct:     { fontSize: 8, color: "#9ca3af", width: 30, textAlign: "right" },

  // Barras horizontais (taxa por reprodutor)
  barRow:      { marginBottom: 10 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  barName:     { fontSize: 8, color: "#374151", flex: 1, marginRight: 8 },
  barValue:    { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#2d6a4f" },
  barTrack:    { height: 13, backgroundColor: "#e5e7eb", borderRadius: 7 },
  barFill:     { height: 13, backgroundColor: "#2d6a4f", borderRadius: 7 },

  // Tabela
  tableSection: { marginTop: 1 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5efe6",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "center",
  },
  tableRowEven: { backgroundColor: "#ffffff" },
  tableRowOdd:  { backgroundColor: "#f9fafb" },

  cellAnimal:     { flex: 1.8, fontSize: 9, color: "#374151" },
  cellCodigo:     { flex: 1,   fontSize: 8, color: "#9ca3af" },
  cellData:       { flex: 1.1, fontSize: 9, color: "#374151" },
  cellTipoIA:     { flex: 1.1, fontSize: 8, color: "#9ca3af" },
  cellReprodutor: { flex: 1.8, fontSize: 9, color: "#374151" },
  cellBadgeWrap:  { flex: 1 },

  badgeGreen: { fontSize: 8, color: "#166534", backgroundColor: "#dcfce7", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  badgeRed:   { fontSize: 8, color: "#991b1b", backgroundColor: "#fee2e2", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  badgeAmber: { fontSize: 8, color: "#92400e", backgroundColor: "#fef3c7", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  badgeGray:  { fontSize: 8, color: "#374151", backgroundColor: "#f3f4f6", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },

  // Rodapé
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

const BADGE_LABEL: Record<string, string> = {
  PRENHA: "Prenha", VAZIA: "Vazia", PENDENTE: "Pendente", CANCELADA: "Cancelada",
};

const TABLE_COLS = [
  { label: "Animal",     flex: COL.animal },
  { label: "Codigo",     flex: COL.codigo },
  { label: "Data",       flex: COL.data },
  { label: "Tipo IA",    flex: COL.tipoIA },
  { label: "Reprodutor", flex: COL.reprodutor },
  { label: "Resultado",  flex: COL.resultado },
];

// Dimensões do donut SVG
const DONUT_SIZE = 88;
const DONUT_CX   = DONUT_SIZE / 2;
const DONUT_OR   = 40;
const DONUT_IR   = 24;

export function RelatorioPDF({
  fazendaNome,
  dataInicio,
  dataFim,
  hoje,
  rows,
  prenhas,
  falhas,
  taxaPrenhez,
  logoImg,
  donutData,
  chartReprodutor,
}: RelatorioPDFProps) {
  const badgeStyle = (resultado: string) => {
    if (resultado === "PRENHA")   return styles.badgeGreen;
    if (resultado === "VAZIA")    return styles.badgeRed;
    if (resultado === "PENDENTE") return styles.badgeAmber;
    return styles.badgeGray;
  };

  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  const kpis = [
    { label: "Inseminacoes",        value: rows.length > 0 ? String(rows.length) : "-", sub: "no periodo" },
    {
      label: "Taxa de prenhez",
      value: rows.length > 0 ? `${taxaPrenhez}%` : "-",
      sub: rows.length > 0 ? `${prenhas} prenhas / ${falhas} falhas` : "sem dados",
    },
    {
      label: "Nascimentos esperados",
      value: rows.length > 0 ? String(prenhas) : "-",
      sub: "em ate 9-11 meses",
    },
    {
      label: "Falhas registradas",
      value: rows.length > 0 ? String(falhas) : "-",
      sub: rows.length > 0 ? `de ${rows.length} inseminacoes` : "sem dados",
    },
  ];

  const hasCharts = donutData.length > 0 || chartReprodutor.length > 0;

  const donutSegments = donutData.reduce<
    Array<(typeof donutData)[number] & { startAngle: number; endAngle: number }>
  >((acc, d) => {
    const startAngle = acc.length > 0 ? acc[acc.length - 1]!.endAngle : 0;
    const sweep = donutTotal > 0 ? (d.value / donutTotal) * 360 : 0;
    const endAngle = startAngle + (sweep >= 360 ? 359.99 : sweep);
    acc.push({ ...d, startAngle, endAngle });
    return acc;
  }, []);

  return (
    <Document title="Relatorio Reprodutivo - AgroGen IA">
      <Page size="A4" style={styles.page}>

        {/* Rodape fixo */}
        <View fixed style={styles.footer}>
          <Text style={styles.footerText}>Assinatura digital: AGRO-MPTZVBYS</Text>
          <Text style={styles.footerText}>Dados tratados conforme LGPD (Lei n. 13.709/2018)</Text>
        </View>

        {/* Cabecalho */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoImg ? <Image src={logoImg} style={styles.logoImg} /> : null}
            <View>
              <Text style={styles.brandTitle}>AgroGen IA</Text>
              <Text style={styles.reportTitle}>Relatorio Reprodutivo</Text>
              <Text style={styles.metaText}>{fazendaNome}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.periodLabel}>PERIODO</Text>
            {/* Usa "a" em vez de ">" — Helvetica suporta apenas Latin-1 */}
            <Text style={styles.periodValue}>{dataInicio} a {dataFim}</Text>
            <Text style={styles.metaText}>Gerado em {hoje}</Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          {kpis.map(({ label, value, sub }) => (
            <View key={label} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{label}</Text>
              <Text style={styles.kpiValue}>{value}</Text>
              <Text style={styles.kpiSub}>{sub}</Text>
            </View>
          ))}
        </View>

        {/* Graficos nativos vetoriais */}
        {hasCharts && (
          <View style={styles.chartsRow}>

            {/* Donut SVG + legenda */}
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>Distribuicao de resultados</Text>
              <Text style={styles.chartSub}>Inseminacoes no periodo</Text>
              <View style={styles.donutWrap}>
                {/* Donut SVG */}
                {donutTotal > 0 && (
                  <Svg
                    width={DONUT_SIZE}
                    height={DONUT_SIZE}
                    viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
                  >
                    {donutSegments.map((seg) => (
                      <Path
                        key={seg.key}
                        d={donutArc(DONUT_CX, DONUT_CX, DONUT_OR, DONUT_IR, seg.startAngle, seg.endAngle)}
                        fill={CHART_COLORS[seg.key] ?? "#9ca3af"}
                      />
                    ))}
                  </Svg>
                )}
                {/* Legenda */}
                <View style={styles.donutLegend}>
                  {donutData.map((d) => {
                    const pct = donutTotal > 0 ? Math.round((d.value / donutTotal) * 100) : 0;
                    return (
                      <View key={d.key} style={styles.donutRow}>
                        <View style={[styles.donutDot, { backgroundColor: CHART_COLORS[d.key] ?? "#9ca3af" }]} />
                        <Text style={styles.donutLabel}>{d.name}</Text>
                        <Text style={styles.donutCount}>{d.value}</Text>
                        <Text style={styles.donutPct}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Barras horizontais — View com % (yoga-layout) */}
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>Taxa de prenhez por reprodutor</Text>
              <Text style={styles.chartSub}>% de prenhez por semen utilizado</Text>
              {chartReprodutor.map(({ name, taxa }) => (
                <View key={name} style={styles.barRow}>
                  {/* Label: nome à esquerda (quebra linha se longo) + % fixo à direita */}
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barName}>{name}</Text>
                    <Text style={styles.barValue}>{taxa}%</Text>
                  </View>
                  {/* Barra via View — yoga-layout resolve "n%" correctamente */}
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: taxa > 0 ? `${taxa}%` : "0%" }]} />
                  </View>
                </View>
              ))}
            </View>

          </View>
        )}

        {/* Tabela */}
        <View style={styles.tableSection}>
          <View fixed style={styles.tableHeader}>
            {TABLE_COLS.map(({ label, flex }) => (
              <Text key={label} style={[styles.tableHeaderCell, { flex }]}>{label}</Text>
            ))}
          </View>

          {rows.slice(0, 50).map((r, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
              wrap={false}
            >
              <Text style={styles.cellAnimal}>{r.animal_nome}</Text>
              <Text style={styles.cellCodigo}>{r.animal_codigo}</Text>
              <Text style={styles.cellData}>{r.data_inseminacao}</Text>
              <Text style={styles.cellTipoIA}>{r.tipo_ia}</Text>
              <Text style={styles.cellReprodutor}>{r.reprodutor}</Text>
              <View style={styles.cellBadgeWrap}>
                <Text style={badgeStyle(r.resultado)}>
                  {BADGE_LABEL[r.resultado] ?? r.resultado}
                </Text>
              </View>
            </View>
          ))}
        </View>

      </Page>
    </Document>
  );
}
