"""
Motor de regras determinístico para predição de prenhez.
Fonte: AgroGen-IA-Matriz-IA.pdf — fórmula: Score = Prob_Base + Σ Deltas
Truncado em [0.0, 1.0].
"""
from models.enums import EspecieAnimal

# ── Probabilidades base por espécie ──────────────────────────────────────────
PROB_BASE: dict[str, float] = {
    EspecieAnimal.BOVINO.value:  0.60,
    EspecieAnimal.OVINO.value:   0.65,
    EspecieAnimal.CAPRINO.value: 0.65,
}

# Raças tropicais com maior adaptação (fator positivo)
_RACAS_ADAPTADAS = {"nelore", "santa ines", "santa inês", "anglo-nubiano", "moxoto", "moxotó"}

# Ciclo estral mínimo por espécie (dias)
CICLO_DIAS: dict[str, int] = {
    EspecieAnimal.BOVINO.value:  21,
    EspecieAnimal.OVINO.value:   17,
    EspecieAnimal.CAPRINO.value: 21,
}


def calcular_score(features: dict) -> tuple[float, list[dict]]:
    """
    Recebe dict de features e retorna (score_0_a_1, fatores_lista).
    Features esperadas (todas opcionais, defaults conservadores):
      especie, condicao_corporal, intervalo_pos_parto_dias,
      num_partos_anteriores, historico_taxa_prenhez, ciclos_sem_concepcao,
      dias_desde_ultima_ins, tipo_inseminacao, temperatura_ambiente_c,
      raca_femea, heterose_esperada_pct, coeficiente_endogamia,
      dep_fertilidade_somada, dep_acuracia_media
    """
    especie = features.get("especie", EspecieAnimal.BOVINO.value)
    base = PROB_BASE.get(especie, 0.60)
    fatores: list[dict] = []

    def _delta(feature: str, valor, delta: float, sentido: str) -> float:
        fatores.append({"feature": feature, "valor_atual": valor, "impacto": round(abs(delta), 4), "sentido": sentido})
        return delta

    total_delta = 0.0

    # 1. Condição corporal (1–5)
    cc = features.get("condicao_corporal")
    if cc is not None:
        if 3.0 <= cc <= 4.0:
            total_delta += _delta("condicao_corporal", cc, +0.10, "positivo")
        elif cc in (2.5, 4.5) or (2.5 < cc < 3.0) or (4.0 < cc < 4.5):
            total_delta += _delta("condicao_corporal", cc, +0.03, "positivo")
        else:
            total_delta += _delta("condicao_corporal", cc, -0.12, "negativo")

    # 2. Intervalo pós-parto (dias)
    ipp = features.get("intervalo_pos_parto_dias")
    if ipp is not None:
        if ipp >= 60:
            total_delta += _delta("intervalo_pos_parto_dias", ipp, +0.04, "positivo")
        elif 45 <= ipp < 60:
            total_delta += _delta("intervalo_pos_parto_dias", ipp, 0.0, "neutro")
        else:
            total_delta += _delta("intervalo_pos_parto_dias", ipp, -0.15, "negativo")

    # 3. Número de partos anteriores
    np_ = features.get("num_partos_anteriores")
    if np_ is not None:
        if np_ == 0:
            total_delta += _delta("num_partos_anteriores", np_, -0.04, "negativo")
        elif 2 <= np_ <= 4:
            total_delta += _delta("num_partos_anteriores", np_, +0.06, "positivo")
        elif np_ >= 7:
            total_delta += _delta("num_partos_anteriores", np_, -0.05, "negativo")

    # 4. Histórico taxa de prenhez (0–1)
    htp = features.get("historico_taxa_prenhez")
    if htp is not None:
        if htp >= 0.70:
            total_delta += _delta("historico_taxa_prenhez", htp, +0.08, "positivo")
        elif htp < 0.40:
            total_delta += _delta("historico_taxa_prenhez", htp, -0.07, "negativo")

    # 5. Dias desde última inseminação
    ddui = features.get("dias_desde_ultima_ins")
    ciclo = CICLO_DIAS.get(especie, 21)
    if ddui is not None and ddui < ciclo:
        total_delta += _delta("dias_desde_ultima_ins", ddui, -0.10, "negativo")

    # 5b. Ciclos consecutivos sem concepção
    ciclos = features.get("ciclos_sem_concepcao")
    if ciclos is not None and ciclos > 2:
        total_delta += _delta("ciclos_sem_concepcao", ciclos, -0.08, "negativo")

    # 6. Tipo de inseminação
    tipo = features.get("tipo_inseminacao", "")
    if tipo == "IATF":
        total_delta += _delta("tipo_inseminacao", tipo, +0.05, "positivo")

    # 7. Temperatura ambiente
    temp = features.get("temperatura_ambiente_c")
    if temp is not None:
        if 29 <= temp <= 33:
            total_delta += _delta("temperatura_ambiente_c", temp, -0.02, "negativo")
        elif temp >= 34:
            total_delta += _delta("temperatura_ambiente_c", temp, -0.08, "negativo")

    # 8. Raça fêmea (adaptadas ao semiárido)
    raca = (features.get("raca_femea") or "").lower().strip()
    if any(r in raca for r in _RACAS_ADAPTADAS):
        total_delta += _delta("raca_femea", features.get("raca_femea"), +0.04, "positivo")

    # 9. Heterose esperada (%)
    heterose = features.get("heterose_esperada_pct")
    if heterose is not None and heterose >= 4.0:
        total_delta += _delta("heterose_esperada_pct", heterose, +0.04, "positivo")

    # 10. Coeficiente de endogamia (F)
    endogamia = features.get("coeficiente_endogamia")
    if endogamia is not None and endogamia > 0.0625:
        total_delta += _delta("coeficiente_endogamia", endogamia, -0.10, "negativo")

    # 11. DEP fertilidade somada (animal + reprodutor)
    dep_fert = features.get("dep_fertilidade_somada")
    dep_acc = features.get("dep_acuracia_media", 1.0)
    if dep_fert is not None:
        multiplicador = 0.5 if (dep_acc is not None and dep_acc < 0.40) else 1.0
        if dep_fert >= 12:
            total_delta += _delta("dep_fertilidade_somada", dep_fert, round(+0.06 * multiplicador, 4), "positivo")

    # Truncamento final
    score = max(0.0, min(1.0, base + total_delta))

    # Ordena fatores por impacto absoluto, retorna top 5
    fatores_significativos = sorted(fatores, key=lambda f: f["impacto"], reverse=True)[:5]

    return round(score, 4), fatores_significativos


def classificar(score: float) -> str:
    if score >= 0.70:
        return "FAVORAVEL"
    if score >= 0.50:
        return "MEDIO"
    return "DESFAVORAVEL"


AVISO_CLINICO = (
    "Este score é uma estimativa probabilística baseada em dados históricos "
    "e não substitui o julgamento clínico veterinário."
)
