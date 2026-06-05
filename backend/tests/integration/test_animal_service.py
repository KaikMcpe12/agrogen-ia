"""
Testes do AnimalService — máquina de estados e validações.
Usa mock da sessão AsyncSession para não precisar de banco real.
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi import HTTPException

from models.enums import StatusAnimal, SexoAnimal, EspecieAnimal
from services.animal_service import AnimalService, VALID_TRANSITIONS
from schemas.animal_schema import AnimalUpdate


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_animal(
    status=StatusAnimal.ATIVA,
    sexo=SexoAnimal.FEMEA,
    especie=EspecieAnimal.BOVINO,
    num_partos=0,
    peso=Decimal("350.00"),
):
    a = MagicMock()
    a.animal_id       = uuid4()
    a.status          = status
    a.sexo            = sexo
    a.especie         = especie
    a.num_partos      = num_partos
    a.peso_inicial_kg = peso
    a.data_nascimento = date.today() - timedelta(days=730)
    a.ativo           = True
    return a

def make_service() -> AnimalService:
    session = AsyncMock()
    return AnimalService(session)


# ── Máquina de estados ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_transicao_valida_ativa_para_prenha():
    svc = make_service()
    animal = make_animal(status=StatusAnimal.ATIVA)
    svc.repo.get_by_id = AsyncMock(return_value=animal)
    svc.repo.update    = AsyncMock(return_value=animal)

    schema = AnimalUpdate(status=StatusAnimal.PRENHA)
    result = await svc.update(animal.animal_id, schema)
    svc.repo.update.assert_called_once()

@pytest.mark.asyncio
async def test_transicao_valida_prenha_para_ativa():
    svc = make_service()
    animal = make_animal(status=StatusAnimal.PRENHA)
    svc.repo.get_by_id = AsyncMock(return_value=animal)
    svc.repo.update    = AsyncMock(return_value=animal)

    schema = AnimalUpdate(status=StatusAnimal.ATIVA)
    await svc.update(animal.animal_id, schema)

@pytest.mark.asyncio
async def test_transicao_valida_ativa_para_em_repouso():
    svc = make_service()
    animal = make_animal(status=StatusAnimal.ATIVA)
    svc.repo.get_by_id = AsyncMock(return_value=animal)
    svc.repo.update    = AsyncMock(return_value=animal)

    await svc.update(animal.animal_id, AnimalUpdate(status=StatusAnimal.EM_REPOUSO))

@pytest.mark.asyncio
async def test_descartada_e_terminal_nenhuma_transicao():
    """DESCARTADA não pode transitar para nenhum status."""
    svc = make_service()
    animal = make_animal(status=StatusAnimal.DESCARTADA)
    svc.repo.get_by_id = AsyncMock(return_value=animal)

    for novo_status in StatusAnimal:
        if novo_status == StatusAnimal.DESCARTADA:
            continue
        with pytest.raises(HTTPException) as exc:
            await svc.update(animal.animal_id, AnimalUpdate(status=novo_status))
        assert exc.value.status_code == 422, f"Deveria ser 422 para DESCARTADA→{novo_status}"

@pytest.mark.asyncio
async def test_transicao_invalida_prenha_para_reprodutor_ativo():
    svc = make_service()
    animal = make_animal(status=StatusAnimal.PRENHA)
    svc.repo.get_by_id = AsyncMock(return_value=animal)

    with pytest.raises(HTTPException) as exc:
        await svc.update(animal.animal_id, AnimalUpdate(status=StatusAnimal.REPRODUTOR_ATIVO))
    assert exc.value.status_code == 422

@pytest.mark.asyncio
async def test_mesmo_status_nao_valida_transicao():
    """Atualizar com o mesmo status não deve chamar a máquina de estados."""
    svc = make_service()
    animal = make_animal(status=StatusAnimal.ATIVA)
    svc.repo.get_by_id = AsyncMock(return_value=animal)
    svc.repo.update    = AsyncMock(return_value=animal)

    # mesmo status → não deve lançar exceção
    await svc.update(animal.animal_id, AnimalUpdate(status=StatusAnimal.ATIVA))


# ── Validações de peso e sexo ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_macho_com_partos_levanta_422():
    svc = make_service()
    animal = make_animal(sexo=SexoAnimal.MACHO, num_partos=0)
    svc.repo.get_by_id = AsyncMock(return_value=animal)

    with pytest.raises(HTTPException) as exc:
        await svc.update(animal.animal_id, AnimalUpdate(num_partos=2))
    assert exc.value.status_code == 422

@pytest.mark.asyncio
async def test_peso_incompativel_bovino_levanta_422():
    svc = make_service()
    animal = make_animal(especie=EspecieAnimal.BOVINO, peso=Decimal("300.00"))
    svc.repo.get_by_id = AsyncMock(return_value=animal)

    with pytest.raises(HTTPException) as exc:
        await svc.update(animal.animal_id, AnimalUpdate(peso_inicial_kg=Decimal("1200.00")))
    assert exc.value.status_code == 422

@pytest.mark.asyncio
async def test_peso_compativel_bovino_ok():
    svc = make_service()
    animal = make_animal(especie=EspecieAnimal.BOVINO, peso=Decimal("300.00"))
    svc.repo.get_by_id = AsyncMock(return_value=animal)
    svc.repo.update    = AsyncMock(return_value=animal)

    await svc.update(animal.animal_id, AnimalUpdate(peso_inicial_kg=Decimal("500.00")))

@pytest.mark.asyncio
async def test_peso_incompativel_ovino_levanta_422():
    svc = make_service()
    animal = make_animal(especie=EspecieAnimal.OVINO, peso=Decimal("30.00"))
    svc.repo.get_by_id = AsyncMock(return_value=animal)

    with pytest.raises(HTTPException) as exc:
        await svc.update(animal.animal_id, AnimalUpdate(peso_inicial_kg=Decimal("200.00")))
    assert exc.value.status_code == 422


# ── get_by_id e soft_delete ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_by_id_nao_encontrado_levanta_404():
    svc = make_service()
    svc.repo.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(HTTPException) as exc:
        await svc.get_by_id(uuid4())
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_get_by_id_encontrado_retorna_animal():
    svc = make_service()
    animal = make_animal()
    svc.repo.get_by_id = AsyncMock(return_value=animal)

    result = await svc.get_by_id(animal.animal_id)
    assert result == animal

@pytest.mark.asyncio
async def test_soft_delete_nao_encontrado_levanta_404():
    svc = make_service()
    svc.repo.soft_delete = AsyncMock(return_value=False)

    with pytest.raises(HTTPException) as exc:
        await svc.soft_delete(uuid4())
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_soft_delete_encontrado_sem_erro():
    svc = make_service()
    svc.repo.soft_delete = AsyncMock(return_value=True)
    await svc.soft_delete(uuid4())  # não deve lançar exceção


# ── VALID_TRANSITIONS — cobertura completa do mapa ────────────────────────────

def test_valid_transitions_mapa_completo():
    """Todos os StatusAnimal devem estar no mapa de transições."""
    for s in StatusAnimal:
        assert s in VALID_TRANSITIONS, f"{s} não está em VALID_TRANSITIONS"

def test_descartada_sem_transicoes_no_mapa():
    assert VALID_TRANSITIONS[StatusAnimal.DESCARTADA] == set()

def test_ativa_pode_ir_para_prenha():
    assert StatusAnimal.PRENHA in VALID_TRANSITIONS[StatusAnimal.ATIVA]

def test_prenha_nao_pode_ir_para_reprodutor_ativo():
    assert StatusAnimal.REPRODUTOR_ATIVO not in VALID_TRANSITIONS[StatusAnimal.PRENHA]

def test_todas_podem_descartar():
    """Todo status exceto DESCARTADA deve poder ir para DESCARTADA."""
    for status, destinos in VALID_TRANSITIONS.items():
        if status != StatusAnimal.DESCARTADA:
            assert StatusAnimal.DESCARTADA in destinos, \
                f"{status} deveria poder ir para DESCARTADA"
