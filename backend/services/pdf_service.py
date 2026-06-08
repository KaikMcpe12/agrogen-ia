"""Geração de PDFs com reportlab (pure Python, compatível com Vercel)."""
import io
from datetime import date
from typing import Optional

# Importações lazy para não falhar ao inicializar se reportlab não estiver instalado
def _get_reportlab():
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    return A4, colors, getSampleStyleSheet, ParagraphStyle, cm, SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer


_VERDE_AGROGEN  = (45/255, 106/255, 79/255)   # #2D6A4F
_VERDE_CLARO    = (212/255, 237/255, 218/255)  # #D4EDDA
_CINZA_HEADER   = (52/255, 58/255, 64/255)     # #343A40


def gerar_pdf_reprodutivo(
    linhas: list[dict],
    indices: dict,
    data_inicio: date,
    data_fim:    date,
) -> bytes:
    A4, colors, getSampleStyleSheet, ParagraphStyle, cm, SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer = _get_reportlab()
    from reportlab.lib.colors import HexColor

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()

    verde = HexColor("#2D6A4F")
    verde_claro = HexColor("#D4EDDA")

    elements = []

    # ── Título ─────────────────────────────────────────────────────────────────
    title_style = ParagraphStyle("title", parent=styles["Heading1"], textColor=verde, fontSize=16)
    sub_style   = ParagraphStyle("sub",   parent=styles["Normal"],   textColor=HexColor("#6C757D"), fontSize=10)

    elements.append(Paragraph("AgroGen IA — Relatório Reprodutivo", title_style))
    elements.append(Paragraph(f"Período: {data_inicio} a {data_fim}", sub_style))
    elements.append(Spacer(1, 0.5*cm))

    # ── Índices ────────────────────────────────────────────────────────────────
    idx = indices or {}
    idx_data = [
        ["Total inseminações", str(idx.get("total_inseminacoes", "—"))],
        ["Total prenhezes",    str(idx.get("total_prenhezes", "—"))],
        ["Taxa de prenhez",    f"{idx['taxa_prenhez']*100:.1f}%" if idx.get("taxa_prenhez") else "—"],
        ["Nº serviços/concepção", str(idx.get("num_servicos_concepcao", "—"))],
    ]
    idx_table = Table(idx_data, colWidths=[8*cm, 5*cm])
    idx_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), verde_claro),
        ("FONTNAME",   (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",   (0, 0), (-1, -1), 10),
        ("GRID",       (0, 0), (-1, -1), 0.5, HexColor("#DEE2E6")),
        ("PADDING",    (0, 0), (-1, -1), 6),
    ]))
    elements.append(idx_table)
    elements.append(Spacer(1, 0.5*cm))

    # ── Tabela de dados ────────────────────────────────────────────────────────
    if linhas:
        headers = ["Código", "Animal", "Data Ins.", "Tipo", "Reprodutor", "Resultado", "Técnico"]
        dados_tab = [headers] + [
            [
                l.get("animal_codigo", ""),
                l.get("animal_nome", "")[:20],
                l.get("data_inseminacao", ""),
                l.get("tipo_ia", ""),
                l.get("reprodutor", "")[:18],
                l.get("resultado", ""),
                l.get("tecnico", "")[:18],
            ]
            for l in linhas[:200]  # limita a 200 linhas para não explodir o PDF
        ]

        col_widths = [2.5*cm, 3.5*cm, 2.5*cm, 3*cm, 3.5*cm, 2.5*cm, 3.5*cm]
        table = Table(dados_tab, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0),  verde),
            ("TEXTCOLOR",   (0, 0), (-1, 0),  HexColor("#FFFFFF")),
            ("FONTNAME",    (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#FFFFFF"), HexColor("#F8F9FA")]),
            ("GRID",        (0, 0), (-1, -1), 0.3, HexColor("#DEE2E6")),
            ("PADDING",     (0, 0), (-1, -1), 4),
            ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(table)

    # ── Rodapé ─────────────────────────────────────────────────────────────────
    elements.append(Spacer(1, 0.8*cm))
    footer_style = ParagraphStyle("footer", parent=styles["Normal"], fontSize=7, textColor=HexColor("#6C757D"))
    elements.append(Paragraph(f"Gerado pelo AgroGen IA em {date.today().strftime('%d/%m/%Y')}. Dados sujeitos a conferência.", footer_style))

    doc.build(elements)
    return buffer.getvalue()


def gerar_pdf_ficha_animal(
    animal: dict,
    pesagens: list,
    partos: list,
) -> bytes:
    A4, colors, getSampleStyleSheet, ParagraphStyle, cm, SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer = _get_reportlab()
    from reportlab.lib.colors import HexColor

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()
    verde       = HexColor("#2D6A4F")
    verde_claro = HexColor("#D4EDDA")
    elements    = []

    title_style = ParagraphStyle("title", parent=styles["Title"], textColor=verde, fontSize=16)
    elements.append(Paragraph(f"Ficha Zootécnica — {animal.get('codigo', '')} {animal.get('nome', '')}", title_style))
    elements.append(Spacer(1, 0.4*cm))

    # Dados gerais
    dados = [
        ["Espécie", animal.get("especie", "")],
        ["Raça", animal.get("raca_principal") or "—"],
        ["Sexo", animal.get("sexo", "")],
        ["Nascimento", animal.get("data_nascimento", "")],
        ["Idade (meses)", str(animal.get("idade_meses") or "—")],
        ["Status", animal.get("status", "")],
        ["Condição Corporal", str(animal.get("condicao_corporal", ""))],
        ["Peso Inicial (kg)", str(animal.get("peso_inicial_kg", ""))],
    ]
    t = Table(dados, colWidths=[6*cm, 10*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), verde_claro),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#CCCCCC")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))

    # Pesagens
    if pesagens:
        elements.append(Paragraph("Histórico de Pesagens", ParagraphStyle("h2", parent=styles["Heading2"], textColor=verde, fontSize=11)))
        elements.append(Spacer(1, 0.2*cm))
        header = [["Data", "Peso (kg)", "Estágio", "GMD", "Obs."]]
        rows = header + [
            [
                str(p.data if hasattr(p, "data") else p.get("data", "")),
                str(p.peso_kg if hasattr(p, "peso_kg") else p.get("peso_kg", "")),
                str(p.estagio.value if hasattr(p, "estagio") and hasattr(p.estagio, "value") else p.get("estagio", "")),
                str(p.gmd_calculado if hasattr(p, "gmd_calculado") else p.get("gmd_calculado") or "—"),
                str(p.observacao if hasattr(p, "observacao") else p.get("observacao") or ""),
            ]
            for p in pesagens
        ]
        tp = Table(rows, colWidths=[3*cm, 3*cm, 4*cm, 2.5*cm, 3.5*cm])
        tp.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), verde),
            ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#FFFFFF")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#CCCCCC")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
        ]))
        elements.append(tp)
        elements.append(Spacer(1, 0.5*cm))

    # Rodapé
    footer_style = ParagraphStyle("footer", parent=styles["Normal"], fontSize=7, textColor=HexColor("#6C757D"))
    elements.append(Paragraph(f"Gerado pelo AgroGen IA em {date.today().strftime('%d/%m/%Y')}.", footer_style))

    doc.build(elements)
    return buffer.getvalue()
