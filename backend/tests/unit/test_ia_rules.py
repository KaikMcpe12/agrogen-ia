"""
Testes do motor de regras local (core/ia_rules.py).
Cobre os 12 deltas, truncamento, classificação e top_5_fatores.
Nenhum banco de dados necessário — lógica pura Python.
"""
import pytest
from core.ia_rules import calcular_score, classificar, AVISO_CLINICO, PROB_BASE


# ── Helpers ────────────────────────────────────────────────────────────────────

def features_neutras(especie="BOVINO") -> dict:
    """Features que não ativam nenhum delta — retorna exatamente a prob_base."""
    return {
        "especie":                      especie,
        "condicao_corporal":            None,
        "intervalo_pos_parto_dias":     None,
        "num_partos_anteriores":        None,
        "historico_taxa_prenhez":       None,
        "dias_desde_ultima_inseminacao": None,
        "tipo_inseminacao":             "IA_CONVENCIONAL",
        "temperatura_ambiente_c":       25.0,   # neutro (18-28)
        "raca_femea":                   "Senepol",
        "heterose_esperada_pct":        0.0,
        "coeficiente_endogamia":        0.01,
        "dep_fertilidade_somada":       5.0,
        "dep_acuracia_media":           0.80,
    }


# ── Probabilidades base ────────────────────────────────────────────────────────

def test_prob_base_bovino():
    score, _ = calcular_score({"especie": "BOVINO"})
    assert score == pytest.approx(0.60, abs=0.01)

def test_prob_base_ovino():
    score, _ = calcular_score({"especie": "OVINO"})
    assert score == pytest.approx(0.65, abs=0.01)

def test_prob_base_caprino():
    score, _ = calcular_score({"especie": "CAPRINO"})
    assert score == pytest.approx(0.65, abs=0.01)

def test_features_vazias_retorna_base():
    """Nenhuma feature ativa → retorna exatamente a prob_base."""
    score, fatores = calcular_score({})
    assert score == pytest.approx(PROB_BASE.get("BOVINO", 0.60), abs=0.001)
    assert fatores == []


# ── Condição corporal ──────────────────────────────────────────────────────────

def test_cc_ideal_adiciona_10pp():
    """CC entre 3 e 4 deve adicionar +10 pontos percentuais."""
    f = features_neutras()
    f["condicao_corporal"] = 3.5
    score, fatores = calcular_score(f)
    base = PROB_BASE["BOVINO"]
    assert score == pytest.approx(base + 0.10, abs=0.001)
    assert any(fa["feature"] == "condicao_corporal" and fa["sentido"] == "positivo" for fa in fatores)

def test_cc_3_ideal():
    f = features_neutras(); f["condicao_corporal"] = 3
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] + 0.10, abs=0.001)

def test_cc_4_ideal():
    f = features_neutras(); f["condicao_corporal"] = 4
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] + 0.10, abs=0.001)

def test_cc_marginal_adiciona_3pp():
    """CC 4.5 (limiar superior) → +3pp."""
    f = features_neutras(); f["condicao_corporal"] = 4.5
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] + 0.03, abs=0.001)

def test_cc_ruim_subtrai_12pp():
    """CC < 2.5 → -12pp."""
    f = features_neutras(); f["condicao_corporal"] = 1.5
    score, fatores = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] - 0.12, abs=0.001)
    assert any(fa["sentido"] == "negativo" for fa in fatores)

def test_cc_acima_45_subtrai_12pp():
    """CC > 4.5 → -12pp."""
    f = features_neutras(); f["condicao_corporal"] = 5
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] - 0.12, abs=0.001)


# ── Intervalo pós-parto ────────────────────────────────────────────────────────

def test_pos_parto_adequado_adiciona_4pp():
    """≥ 60 dias → +4pp."""
    f = features_neutras(); f["intervalo_pos_parto_dias"] = 90
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] + 0.04, abs=0.001)

def test_pos_parto_neutro_45_a_59():
    """45-59 dias → sem delta."""
    f = features_neutras(); f["intervalo_pos_parto_dias"] = 50
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"], abs=0.001)

def test_pos_parto_critico_subtrai_15pp():
    """< 45 dias → -15pp."""
    f = features_neutras(); f["intervalo_pos_parto_dias"] = 30
    score, fatores = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] - 0.15, abs=0.001)
    assert any(fa["feature"] == "intervalo_pos_parto_dias" and fa["sentido"] == "negativo" for fa in fatores)


# ── Número de partos ───────────────────────────────────────────────────────────

def test_primipara_subtrai_4pp():
    """0 partos (primípara) → -4pp."""
    f = features_neutras(); f["num_partos_anteriores"] = 0
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] - 0.04, abs=0.001)

def test_partos_otimos_adicionam_6pp():
    """2-4 partos → +6pp."""
    for np in (2, 3, 4):
        f = features_neutras(); f["num_partos_anteriores"] = np
        score, _ = calcular_score(f)
        assert score == pytest.approx(PROB_BASE["BOVINO"] + 0.06, abs=0.001), f"falhou com {np} partos"

def test_partos_elevados_subtrai_5pp():
    """≥ 7 partos → -5pp."""
    f = features_neutras(); f["num_partos_anteriores"] = 8
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] - 0.05, abs=0.001)


# ── Histórico de taxa de prenhez ───────────────────────────────────────────────

def test_historico_alta_adiciona_8pp():
    """Taxa ≥ 0.70 → +8pp."""
    f = features_neutras(); f["historico_taxa_prenhez"] = 0.75
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] + 0.08, abs=0.001)

def test_historico_baixo_subtrai_7pp():
    """Taxa < 0.40 → -7pp."""
    f = features_neutras(); f["historico_taxa_prenhez"] = 0.30
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] - 0.07, abs=0.001)

def test_historico_medio_neutro():
    """0.40-0.69 → sem delta."""
    f = features_neutras(); f["historico_taxa_prenhez"] = 0.55
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"], abs=0.001)


# ── Intervalo desde última inseminação ────────────────────────────────────────

def test_intervalo_curto_bovino_subtrai_10pp():
    """< 21 dias para bovino → -10pp."""
    f = features_neutras("BOVINO"); f["dias_desde_ultima_inseminacao"] = 15
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] - 0.10, abs=0.001)

def test_intervalo_curto_ovino_subtrai_10pp():
    """< 17 dias para ovino → -10pp."""
    f = features_neutras("OVINO"); f["dias_desde_ultima_inseminacao"] = 10
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["OVINO"] - 0.10, abs=0.001)

def test_intervalo_adequado_neutro():
    """≥ ciclo → sem delta."""
    f = features_neutras("BOVINO"); f["dias_desde_ultima_inseminacao"] = 30
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"], abs=0.001)


# ── Tipo de inseminação ────────────────────────────────────────────────────────

def test_iatf_adiciona_5pp():
    f = features_neutras(); f["tipo_inseminacao"] = "IATF"
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] + 0.05, abs=0.001)

def test_convencional_neutro():
    f = features_neutras(); f["tipo_inseminacao"] = "IA_CONVENCIONAL"
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"], abs=0.001)


# ── Temperatura ambiente ───────────────────────────────────────────────────────

def test_temperatura_neutra_18_28():
    f = features_neutras(); f["temperatura_ambiente_c"] = 25
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"], abs=0.001)

def test_temperatura_alta_subtrai_2pp():
    """29-33°C → -2pp."""
    f = features_neutras(); f["temperatura_ambiente_c"] = 31
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] - 0.02, abs=0.001)

def test_temperatura_extrema_subtrai_8pp():
    """≥ 34°C → -8pp."""
    f = features_neutras(); f["temperatura_ambiente_c"] = 36
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] - 0.08, abs=0.001)


# ── Raça adaptada ──────────────────────────────────────────────────────────────

def test_raca_nelore_adiciona_4pp():
    f = features_neutras(); f["raca_femea"] = "Nelore"
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] + 0.04, abs=0.001)

def test_raca_santa_ines_adiciona_4pp():
    f = features_neutras("OVINO"); f["raca_femea"] = "Santa Inês"
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["OVINO"] + 0.04, abs=0.001)

def test_raca_nao_adaptada_neutro():
    f = features_neutras(); f["raca_femea"] = "Angus"
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"], abs=0.001)


# ── Endogamia ─────────────────────────────────────────────────────────────────

def test_endogamia_alta_subtrai_10pp():
    """F > 0.0625 → -10pp."""
    f = features_neutras(); f["coeficiente_endogamia"] = 0.10
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] - 0.10, abs=0.001)

def test_endogamia_baixa_neutro():
    f = features_neutras(); f["coeficiente_endogamia"] = 0.03
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"], abs=0.001)


# ── DEP fertilidade ───────────────────────────────────────────────────────────

def test_dep_fertilidade_alta_adiciona_6pp():
    """DEP ≥ 12 com acurácia boa → +6pp."""
    f = features_neutras()
    f["dep_fertilidade_somada"] = 15
    f["dep_acuracia_media"]     = 0.80
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] + 0.06, abs=0.001)

def test_dep_fertilidade_alta_acuracia_baixa_metade():
    """DEP ≥ 12 mas acurácia < 0.40 → apenas 50% do delta (+3pp)."""
    f = features_neutras()
    f["dep_fertilidade_somada"] = 15
    f["dep_acuracia_media"]     = 0.30
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"] + 0.03, abs=0.001)

def test_dep_fertilidade_baixa_neutro():
    f = features_neutras(); f["dep_fertilidade_somada"] = 8
    score, _ = calcular_score(f)
    assert score == pytest.approx(PROB_BASE["BOVINO"], abs=0.001)


# ── Truncamento ───────────────────────────────────────────────────────────────

def test_score_nao_excede_1():
    """Soma de todos os deltas positivos não pode exceder 1.0."""
    f = {
        "especie": "BOVINO",
        "condicao_corporal": 3,
        "intervalo_pos_parto_dias": 90,
        "num_partos_anteriores": 3,
        "historico_taxa_prenhez": 0.80,
        "tipo_inseminacao": "IATF",
        "temperatura_ambiente_c": 22,
        "raca_femea": "Nelore",
        "heterose_esperada_pct": 6.0,
        "dep_fertilidade_somada": 20,
        "dep_acuracia_media": 0.90,
        "coeficiente_endogamia": 0.01,
    }
    score, _ = calcular_score(f)
    assert score <= 1.0

def test_score_nao_abaixo_de_0():
    """Soma de todos os deltas negativos não pode ser menor que 0."""
    f = {
        "especie": "BOVINO",
        "condicao_corporal": 1,
        "intervalo_pos_parto_dias": 10,
        "num_partos_anteriores": 0,
        "historico_taxa_prenhez": 0.10,
        "dias_desde_ultima_inseminacao": 5,
        "temperatura_ambiente_c": 40,
        "coeficiente_endogamia": 0.15,
        "dep_fertilidade_somada": 5,
    }
    score, _ = calcular_score(f)
    assert score >= 0.0


# ── Classificação ─────────────────────────────────────────────────────────────

def test_classificacao_favoravel():
    assert classificar(0.70) == "FAVORAVEL"
    assert classificar(0.85) == "FAVORAVEL"
    assert classificar(1.00) == "FAVORAVEL"

def test_classificacao_medio():
    assert classificar(0.50) == "MEDIO"
    assert classificar(0.60) == "MEDIO"
    assert classificar(0.699) == "MEDIO"

def test_classificacao_desfavoravel():
    assert classificar(0.00) == "DESFAVORAVEL"
    assert classificar(0.30) == "DESFAVORAVEL"
    assert classificar(0.499) == "DESFAVORAVEL"


# ── Top 5 fatores ─────────────────────────────────────────────────────────────

def test_top_5_fatores_nao_excede_5():
    """Mesmo com 12 features ativas, retorna no máximo 5 fatores."""
    f = {
        "especie": "BOVINO",
        "condicao_corporal": 3,
        "intervalo_pos_parto_dias": 90,
        "num_partos_anteriores": 3,
        "historico_taxa_prenhez": 0.75,
        "tipo_inseminacao": "IATF",
        "raca_femea": "Nelore",
        "heterose_esperada_pct": 5.0,
        "dep_fertilidade_somada": 15,
        "dep_acuracia_media": 0.85,
    }
    _, fatores = calcular_score(f)
    assert len(fatores) <= 5

def test_fatores_ordenados_por_impacto():
    """Fatores são ordenados do maior para o menor impacto."""
    f = {
        "especie": "BOVINO",
        "condicao_corporal": 1,        # -0.12 (maior impacto)
        "intervalo_pos_parto_dias": 30, # -0.15 (maior ainda)
        "temperatura_ambiente_c": 35,   # -0.08
    }
    _, fatores = calcular_score(f)
    impactos = [fa["impacto"] for fa in fatores]
    assert impactos == sorted(impactos, reverse=True)

def test_aviso_clinico_nao_vazio():
    assert len(AVISO_CLINICO) > 50
    assert "julgamento clínico" in AVISO_CLINICO.lower() or "veterinário" in AVISO_CLINICO.lower()
