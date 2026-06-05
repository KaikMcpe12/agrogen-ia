"""
Testes do InseminacaoService — regras zootécnicas e alertas automáticos.
Usa mock da sessão AsyncSession para não precisar de banco real.
"""
import pytest
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi import HTTPException

from models.enums import StatusAnimal, SexoAnimal, EspecieAnimal, TipoAlerta
from services.inseminacao_service import InseminacaoService
from schemas.inseminacao_schema import InseminacaoCreate


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_animal_femea(
    especie=EspecieAnimal.BOVINO,
    status=StatusAnimal.ATIVA,
    data_ultimo_parto=None,
):
    a = MagicMock()
    a.animal_id        = uuid4()
    a.especie          = especie
    a.sexo             = SexoAnimal.FEMEA
    a.status           = status
    a.data_ultimo_parto = data_ultimo_parto
    a.raca_principal   = "Nelore"
    a.num_partos       = 2
    a.codigo           = "BOV-0001"
    a.nome             = "Mimosa"
    return a

def make_inseminacao_schema(**overrides) -> InseminacaoCreate:
    base = dict(
        animal_id=uuid4(),
        reprodutor_id=uuid4(),
        tecnico_id=uuid4(),
        data_inseminacao=datetime.now(timezone.utc) - timedelta(days=30),
        tipo="IA_CONVENCIONAL",
        condicao_corporal_momento=3,
        forcar_registro=False,
    )
    base.update(overrides)
    return InseminacaoCreate(**base)

def make_service() -> InseminacaoService:
    session = AsyncMock()
    svc = InseminacaoService(session)
    # Por padrão: sem última inseminação, alerta criado com sucesso
    svc.repo.get_ultima_inseminacao = AsyncMock(return_value=None)
    svc.repo.create                 = AsyncMock()
    svc.repo.list_all               = AsyncMock(return_value=([], 0))
    svc.alerta_repo.create          = AsyncMock(return_value=MagicMock(alerta_id=uuid4()))
    return svc


# ── Bloqueios por status do animal ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_animal_prenha_bloqueado():
    svc = make_service()
    animal = make_animal_femea(status=StatusAnimal.PRENHA)
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)

    with pytest.raises(HTTPException) as exc:
        await svc.create(make_inseminacao_schema(animal_id=animal.animal_id))
    assert exc.value.status_code == 422
    assert "prenha" in exc.value.detail.lower() or "status" in exc.value.detail.lower()

@pytest.mark.asyncio
async def test_animal_descartado_bloqueado():
    svc = make_service()
    animal = make_animal_femea(status=StatusAnimal.DESCARTADA)
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)

    with pytest.raises(HTTPException) as exc:
        await svc.create(make_inseminacao_schema(animal_id=animal.animal_id))
    assert exc.value.status_code == 422

@pytest.mark.asyncio
async def test_animal_em_repouso_permitido():
    """EM_REPOUSO não bloqueia inseminação."""
    svc = make_service()
    animal = make_animal_femea(status=StatusAnimal.EM_REPOUSO)
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)
    svc.repo.create = AsyncMock(return_value=MagicMock(
        inseminacao_id=uuid4(), data_inseminacao=datetime.now(timezone.utc) - timedelta(days=30)
    ))

    ins, warnings = await svc.create(make_inseminacao_schema(animal_id=animal.animal_id))
    svc.repo.create.assert_called_once()


# ── Bloqueio por sexo ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_animal_macho_bloqueado():
    svc = make_service()
    animal = MagicMock()
    animal.animal_id = uuid4()
    animal.sexo      = SexoAnimal.MACHO
    animal.status    = StatusAnimal.ATIVA
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)

    with pytest.raises(HTTPException) as exc:
        await svc.create(make_inseminacao_schema(animal_id=animal.animal_id))
    assert exc.value.status_code == 422
    assert "fêmea" in exc.value.detail.lower() or "femea" in exc.value.detail.lower()


# ── Animal não encontrado ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_animal_nao_encontrado_levanta_404():
    svc = make_service()
    svc.animal_repo.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(HTTPException) as exc:
        await svc.create(make_inseminacao_schema())
    assert exc.value.status_code == 404


# ── Regra de intervalo mínimo ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_intervalo_curto_sem_forcar_levanta_422():
    """Inseminação há 10 dias (< 21 ciclo bovino) sem forcar_registro → 422."""
    svc = make_service()
    animal = make_animal_femea()
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)

    ultima = MagicMock()
    ultima.data_inseminacao = datetime.now(timezone.utc) - timedelta(days=10)
    svc.repo.get_ultima_inseminacao = AsyncMock(return_value=ultima)

    with pytest.raises(HTTPException) as exc:
        await svc.create(make_inseminacao_schema(
            animal_id=animal.animal_id,
            forcar_registro=False,
        ))
    assert exc.value.status_code == 422
    assert "intervalo" in exc.value.detail.lower() or "ciclo" in exc.value.detail.lower()

@pytest.mark.asyncio
async def test_intervalo_curto_com_forcar_permitido_com_warning():
    """Com forcar_registro=True → inseminação realizada com warning."""
    svc = make_service()
    animal = make_animal_femea()
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)

    ultima = MagicMock()
    ultima.data_inseminacao = datetime.now(timezone.utc) - timedelta(days=10)
    svc.repo.get_ultima_inseminacao = AsyncMock(return_value=ultima)
    svc.repo.create = AsyncMock(return_value=MagicMock(
        inseminacao_id=uuid4(),
        data_inseminacao=datetime.now(timezone.utc),
    ))

    ins, warnings = await svc.create(make_inseminacao_schema(
        animal_id=animal.animal_id,
        forcar_registro=True,
    ))
    assert len(warnings) >= 1
    assert any("intervalo" in w.lower() or "ciclo" in w.lower() for w in warnings)

@pytest.mark.asyncio
async def test_intervalo_adequado_sem_warning():
    """Intervalo ≥ ciclo → nenhum warning de intervalo.
    ultima_ins = 60 dias atrás, data_ins = 30 dias atrás → intervalo = 30d ≥ 21d (bovino).
    """
    svc = make_service()
    animal = make_animal_femea()
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)

    ultima = MagicMock()
    ultima.data_inseminacao = datetime.now(timezone.utc) - timedelta(days=60)  # 60 dias atrás
    svc.repo.get_ultima_inseminacao = AsyncMock(return_value=ultima)
    svc.repo.create = AsyncMock(return_value=MagicMock(
        inseminacao_id=uuid4(),
        data_inseminacao=datetime.now(timezone.utc) - timedelta(days=30),
    ))

    # data_inseminacao = now-30d; última = now-60d → intervalo 30 dias ≥ 21
    ins, warnings = await svc.create(make_inseminacao_schema(animal_id=animal.animal_id))
    intervalo_warnings = [w for w in warnings if "intervalo" in w.lower()]
    assert len(intervalo_warnings) == 0

@pytest.mark.asyncio
async def test_sem_inseminacao_anterior_sem_check_de_intervalo():
    """Primeira inseminação → não verifica intervalo."""
    svc = make_service()
    animal = make_animal_femea()
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)
    svc.repo.get_ultima_inseminacao = AsyncMock(return_value=None)
    svc.repo.create = AsyncMock(return_value=MagicMock(
        inseminacao_id=uuid4(),
        data_inseminacao=datetime.now(timezone.utc),
    ))

    ins, warnings = await svc.create(make_inseminacao_schema(animal_id=animal.animal_id))
    # Nenhum warning de intervalo
    assert not any("intervalo" in w.lower() for w in warnings)


# ── Aviso de pós-parto ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_pos_parto_abaixo_minimo_gera_warning():
    """data_ultimo_parto há 20 dias (< 45 para bovino) → warning."""
    svc = make_service()
    animal = make_animal_femea(data_ultimo_parto=date.today() - timedelta(days=20))
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)
    svc.repo.create = AsyncMock(return_value=MagicMock(
        inseminacao_id=uuid4(),
        data_inseminacao=datetime.now(timezone.utc),
    ))

    ins, warnings = await svc.create(make_inseminacao_schema(animal_id=animal.animal_id))
    assert any("pós-parto" in w.lower() or "pos_parto" in w.lower() or "parto" in w.lower()
               for w in warnings)

@pytest.mark.asyncio
async def test_pos_parto_adequado_sem_warning():
    """data_ultimo_parto há 90 dias, data_ins ontem → 89 dias pós-parto ≥ 45 (bovino) → sem warning."""
    svc = make_service()
    animal = make_animal_femea(data_ultimo_parto=date.today() - timedelta(days=90))
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)
    data_ins = datetime.now(timezone.utc) - timedelta(days=1)
    svc.repo.create = AsyncMock(return_value=MagicMock(
        inseminacao_id=uuid4(),
        data_inseminacao=data_ins,
    ))

    ins, warnings = await svc.create(make_inseminacao_schema(
        animal_id=animal.animal_id,
        data_inseminacao=data_ins,  # ontem; parto foi 90 dias atrás → 89 dias ≥ 45
    ))
    parto_warnings = [w for w in warnings if "parto" in w.lower()]
    assert len(parto_warnings) == 0


# ── Alerta DIAGNOSTICO_PENDENTE ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_inseminacao_cria_alerta_diagnostico_pendente():
    """Toda inseminação bem-sucedida deve criar alerta DIAGNOSTICO_PENDENTE."""
    svc = make_service()
    animal = make_animal_femea()
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)
    svc.repo.create = AsyncMock(return_value=MagicMock(
        inseminacao_id=uuid4(),
        data_inseminacao=datetime.now(timezone.utc),
    ))

    await svc.create(make_inseminacao_schema(animal_id=animal.animal_id))

    svc.alerta_repo.create.assert_called_once()
    call_kwargs = svc.alerta_repo.create.call_args[0][0]
    assert call_kwargs["tipo"] == TipoAlerta.DIAGNOSTICO_PENDENTE
    assert call_kwargs["animal_id"] == animal.animal_id

@pytest.mark.asyncio
async def test_alerta_dispara_em_30_dias():
    """O alerta de diagnóstico deve ser disparado 30 dias após a inseminação."""
    svc = make_service()
    animal = make_animal_femea()
    svc.animal_repo.get_by_id = AsyncMock(return_value=animal)

    data_ins = datetime.now(timezone.utc) - timedelta(days=2)
    svc.repo.create = AsyncMock(return_value=MagicMock(
        inseminacao_id=uuid4(),
        data_inseminacao=data_ins,
    ))

    await svc.create(make_inseminacao_schema(
        animal_id=animal.animal_id,
        data_inseminacao=data_ins,
    ))

    call_kwargs = svc.alerta_repo.create.call_args[0][0]
    data_disparo = call_kwargs["data_disparo"]
    esperado = (data_ins + timedelta(days=30)).date()
    assert data_disparo == esperado


# ── get_by_id ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_by_id_nao_encontrado_levanta_404():
    svc = make_service()
    svc.repo.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(HTTPException) as exc:
        await svc.get_by_id(uuid4())
    assert exc.value.status_code == 404
