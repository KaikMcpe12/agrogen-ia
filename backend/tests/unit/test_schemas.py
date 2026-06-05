"""
Testes dos validadores Pydantic (schemas/).
Nenhum banco de dados necessário.
"""
import pytest
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4
from pydantic import ValidationError

from schemas.animal_schema import AnimalCreate, AnimalUpdate
from schemas.fazenda_schema import FazendaCreate, FazendaUpdate
from schemas.inseminacao_schema import InseminacaoCreate
from schemas.parto_schema import PartoCreate
from schemas.pesagem_schema import PesagemCreate
from schemas.reprodutor_schema import ReproductorCreate


# ── Helpers ───────────────────────────────────────────────────────────────────

def animal_valido(**overrides) -> dict:
    base = {
        "fazenda_id":        uuid4(),
        "nome":              "Mimosa",
        "especie":           "BOVINO",
        "sexo":              "FEMEA",
        "data_nascimento":   date.today() - timedelta(days=730),
        "peso_inicial_kg":   Decimal("350.00"),
        "condicao_corporal": 3,
        "status":            "ATIVA",
        "num_partos":        0,
    }
    base.update(overrides)
    return base

def fazenda_valida(**overrides) -> dict:
    base = {
        "nome":      "Fazenda Boa Vista",
        "municipio": "Crateús",
        "estado":    "CE",
    }
    base.update(overrides)
    return base


# ── AnimalCreate ──────────────────────────────────────────────────────────────

def test_animal_valido_cria_sem_erro():
    AnimalCreate(**animal_valido())

def test_animal_data_nascimento_futura_levanta_erro():
    with pytest.raises(ValidationError) as exc:
        AnimalCreate(**animal_valido(data_nascimento=date.today() + timedelta(days=1)))
    assert "futura" in str(exc.value).lower() or "future" in str(exc.value).lower()

def test_animal_peso_bovino_minimo_valido():
    AnimalCreate(**animal_valido(peso_inicial_kg=Decimal("50.00")))

def test_animal_peso_bovino_maximo_valido():
    AnimalCreate(**animal_valido(peso_inicial_kg=Decimal("900.00")))

def test_animal_peso_bovino_abaixo_minimo_levanta_erro():
    with pytest.raises(ValidationError):
        AnimalCreate(**animal_valido(peso_inicial_kg=Decimal("40.00")))

def test_animal_peso_bovino_acima_maximo_levanta_erro():
    with pytest.raises(ValidationError):
        AnimalCreate(**animal_valido(peso_inicial_kg=Decimal("950.00")))

def test_animal_peso_ovino_valido():
    AnimalCreate(**animal_valido(especie="OVINO", peso_inicial_kg=Decimal("35.00")))

def test_animal_peso_ovino_acima_maximo_levanta_erro():
    with pytest.raises(ValidationError):
        AnimalCreate(**animal_valido(especie="OVINO", peso_inicial_kg=Decimal("130.00")))

def test_animal_peso_caprino_valido():
    AnimalCreate(**animal_valido(especie="CAPRINO", peso_inicial_kg=Decimal("25.00")))

def test_animal_peso_caprino_acima_maximo_levanta_erro():
    with pytest.raises(ValidationError):
        AnimalCreate(**animal_valido(especie="CAPRINO", peso_inicial_kg=Decimal("110.00")))

def test_animal_macho_sem_partos_valido():
    AnimalCreate(**animal_valido(sexo="MACHO", num_partos=0))

def test_animal_macho_com_partos_levanta_erro():
    with pytest.raises(ValidationError) as exc:
        AnimalCreate(**animal_valido(sexo="MACHO", num_partos=2))
    assert "macho" in str(exc.value).lower() or "parto" in str(exc.value).lower()

def test_animal_femea_com_partos_valido():
    AnimalCreate(**animal_valido(sexo="FEMEA", num_partos=3))

def test_animal_condicao_corporal_limite_inferior():
    AnimalCreate(**animal_valido(condicao_corporal=1))

def test_animal_condicao_corporal_limite_superior():
    AnimalCreate(**animal_valido(condicao_corporal=5))

def test_animal_condicao_corporal_fora_do_limite():
    with pytest.raises(ValidationError):
        AnimalCreate(**animal_valido(condicao_corporal=6))


# ── FazendaCreate ─────────────────────────────────────────────────────────────

def test_fazenda_valida_cria_sem_erro():
    FazendaCreate(**fazenda_valida())

def test_fazenda_estado_invalido_levanta_erro():
    with pytest.raises(ValidationError):
        FazendaCreate(**fazenda_valida(estado="XX"))

def test_fazenda_todos_estados_validos():
    estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
               'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
    for uf in estados:
        FazendaCreate(**fazenda_valida(estado=uf))

def test_fazenda_lat_sem_lon_levanta_erro():
    with pytest.raises(ValidationError):
        FazendaCreate(**fazenda_valida(latitude=Decimal("-5.17")))

def test_fazenda_lon_sem_lat_levanta_erro():
    with pytest.raises(ValidationError):
        FazendaCreate(**fazenda_valida(longitude=Decimal("-40.68")))

def test_fazenda_lat_e_lon_juntos_valido():
    FazendaCreate(**fazenda_valida(latitude=Decimal("-5.17"), longitude=Decimal("-40.68")))

def test_fazenda_sem_coordenadas_valido():
    FazendaCreate(**fazenda_valida())


# ── InseminacaoCreate ─────────────────────────────────────────────────────────

def test_inseminacao_valida_cria_sem_erro():
    InseminacaoCreate(
        animal_id=uuid4(),
        reprodutor_id=uuid4(),
        tecnico_id=uuid4(),
        data_inseminacao=datetime.now(timezone.utc) - timedelta(days=1),
        tipo="IA_CONVENCIONAL",
        condicao_corporal_momento=3,
    )

def test_inseminacao_data_futura_levanta_erro():
    with pytest.raises(ValidationError):
        InseminacaoCreate(
            animal_id=uuid4(),
            reprodutor_id=uuid4(),
            tecnico_id=uuid4(),
            data_inseminacao=datetime.now(timezone.utc) + timedelta(hours=2),
            tipo="IA_CONVENCIONAL",
            condicao_corporal_momento=3,
        )

def test_inseminacao_iatf_sem_protocolo_levanta_erro():
    with pytest.raises(ValidationError) as exc:
        InseminacaoCreate(
            animal_id=uuid4(),
            reprodutor_id=uuid4(),
            tecnico_id=uuid4(),
            data_inseminacao=datetime.now(timezone.utc) - timedelta(days=1),
            tipo="IATF",
            condicao_corporal_momento=3,
            protocolo_id=None,
        )
    assert "iatf" in str(exc.value).lower() or "protocolo" in str(exc.value).lower()

def test_inseminacao_iatf_com_protocolo_valido():
    InseminacaoCreate(
        animal_id=uuid4(),
        reprodutor_id=uuid4(),
        tecnico_id=uuid4(),
        data_inseminacao=datetime.now(timezone.utc) - timedelta(days=1),
        tipo="IATF",
        condicao_corporal_momento=3,
        protocolo_id=uuid4(),
    )

def test_inseminacao_cc_fora_do_limite_levanta_erro():
    with pytest.raises(ValidationError):
        InseminacaoCreate(
            animal_id=uuid4(),
            reprodutor_id=uuid4(),
            tecnico_id=uuid4(),
            data_inseminacao=datetime.now(timezone.utc) - timedelta(days=1),
            tipo="IA_CONVENCIONAL",
            condicao_corporal_momento=6,
        )


# ── PartoCreate ───────────────────────────────────────────────────────────────

def test_parto_valido_simples():
    PartoCreate(
        data_parto=date.today() - timedelta(days=10),
        tipo_parto="SIMPLES",
        num_crias=1,
        num_crias_vivas=1,
        houve_distorcia=False,
        houve_obito_matriz=False,
    )

def test_parto_data_futura_levanta_erro():
    with pytest.raises(ValidationError):
        PartoCreate(
            data_parto=date.today() + timedelta(days=5),
            tipo_parto="SIMPLES",
            num_crias=1,
            num_crias_vivas=1,
            houve_distorcia=False,
            houve_obito_matriz=False,
        )

def test_parto_crias_vivas_maior_que_crias_levanta_erro():
    with pytest.raises(ValidationError):
        PartoCreate(
            data_parto=date.today() - timedelta(days=5),
            tipo_parto="SIMPLES",
            num_crias=1,
            num_crias_vivas=2,  # impossível
            houve_distorcia=False,
            houve_obito_matriz=False,
        )

def test_parto_simples_duas_crias_levanta_erro():
    with pytest.raises(ValidationError):
        PartoCreate(
            data_parto=date.today() - timedelta(days=5),
            tipo_parto="SIMPLES",
            num_crias=2,  # SIMPLES exige 1
            num_crias_vivas=2,
            houve_distorcia=False,
            houve_obito_matriz=False,
        )

def test_parto_duplo_duas_crias_valido():
    PartoCreate(
        data_parto=date.today() - timedelta(days=5),
        tipo_parto="DUPLO",
        num_crias=2,
        num_crias_vivas=2,
        houve_distorcia=False,
        houve_obito_matriz=False,
    )

def test_parto_multiplo_tres_crias_valido():
    PartoCreate(
        data_parto=date.today() - timedelta(days=5),
        tipo_parto="MULTIPLO",
        num_crias=3,
        num_crias_vivas=3,
        houve_distorcia=False,
        houve_obito_matriz=False,
    )

def test_parto_multiplo_duas_crias_levanta_erro():
    with pytest.raises(ValidationError):
        PartoCreate(
            data_parto=date.today() - timedelta(days=5),
            tipo_parto="MULTIPLO",
            num_crias=2,  # MULTIPLO exige >= 3
            num_crias_vivas=2,
            houve_distorcia=False,
            houve_obito_matriz=False,
        )


# ── PesagemCreate ─────────────────────────────────────────────────────────────

def test_pesagem_valida():
    PesagemCreate(
        data=date.today() - timedelta(days=5),
        peso_kg=Decimal("350.00"),
        estagio="CRESCIMENTO",
    )

def test_pesagem_data_futura_levanta_erro():
    with pytest.raises(ValidationError):
        PesagemCreate(
            data=date.today() + timedelta(days=1),
            peso_kg=Decimal("350.00"),
            estagio="CRESCIMENTO",
        )

def test_pesagem_peso_zero_levanta_erro():
    with pytest.raises(ValidationError):
        PesagemCreate(
            data=date.today() - timedelta(days=1),
            peso_kg=Decimal("0"),
            estagio="ADULTO",
        )


# ── ReproductorCreate ─────────────────────────────────────────────────────────

def test_reprodutor_semen_externo_valido():
    ReproductorCreate(
        nome="Touro Elite",
        especie="BOVINO",
        raca="Nelore",
        tipo="SEMEN_EXTERNO",
    )

def test_reprodutor_animal_proprio_com_animal_id_valido():
    ReproductorCreate(
        nome="Touro próprio",
        especie="BOVINO",
        raca="Nelore",
        tipo="ANIMAL_PROPRIO",
        animal_id=uuid4(),
    )

def test_reprodutor_animal_proprio_sem_animal_id_levanta_erro():
    with pytest.raises(ValidationError) as exc:
        ReproductorCreate(
            nome="Touro próprio",
            especie="BOVINO",
            raca="Nelore",
            tipo="ANIMAL_PROPRIO",
            animal_id=None,
        )
    assert "animal_id" in str(exc.value).lower()

def test_reprodutor_semen_externo_com_animal_id_levanta_erro():
    with pytest.raises(ValidationError) as exc:
        ReproductorCreate(
            nome="Semen externo",
            especie="BOVINO",
            raca="Nelore",
            tipo="SEMEN_EXTERNO",
            animal_id=uuid4(),  # não deve ter animal_id
        )
    assert "animal_id" in str(exc.value).lower() or "semen" in str(exc.value).lower()
