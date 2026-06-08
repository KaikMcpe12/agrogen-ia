from datetime import datetime, timedelta, timezone, date
from uuid import UUID
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.inseminacao_model import InseminacaoModel
from models.enums import (
    EspecieAnimal, SexoAnimal, StatusAnimal,
    ResultadoInseminacao, ResultadoDiagnostico,
    TipoAlerta, PrioridadeAlerta,
)
from repositories.inseminacao_repository import InseminacaoRepository
from repositories.animal_repository import AnimalRepository
from repositories.alerta_repository import AlertaRepository
from repositories.protocolo_hormonal_repository import ProtocoloHormonalRepository
from schemas.inseminacao_schema import InseminacaoCreate, InseminacaoUpdate, DiagnosticoViaInseminacaoCreate

_CICLO_DIAS: dict[EspecieAnimal, int] = {
    EspecieAnimal.BOVINO:  21,
    EspecieAnimal.OVINO:   17,
    EspecieAnimal.CAPRINO: 21,
}
_GESTACAO_DIAS: dict[EspecieAnimal, int] = {
    EspecieAnimal.BOVINO:  283,
    EspecieAnimal.OVINO:   150,
    EspecieAnimal.CAPRINO: 150,
}
_POS_PARTO_AVISO: dict[EspecieAnimal, int] = {
    EspecieAnimal.BOVINO:  45,
    EspecieAnimal.OVINO:   30,
    EspecieAnimal.CAPRINO: 30,
}
_STATUS_BLOQUEADOS = {StatusAnimal.PRENHA, StatusAnimal.DESCARTADA}


class InseminacaoService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo            = InseminacaoRepository(session)
        self.animal_repo     = AnimalRepository(session)
        self.alerta_repo     = AlertaRepository(session)
        self.protocolo_repo  = ProtocoloHormonalRepository(session)
        self.session         = session

    async def _resolver_protocolo_id(self, schema: InseminacaoCreate, especie: EspecieAnimal) -> Optional[UUID]:
        """Retorna protocolo_id: usa o fornecido, ou busca/cria pelo protocolo_descricao."""
        if schema.protocolo_id:
            return schema.protocolo_id
        if schema.protocolo_descricao:
            existente = await self.protocolo_repo.get_by_nome(schema.protocolo_descricao, especie)
            if existente:
                return existente.protocolo_id
            novo = await self.protocolo_repo.create({
                "nome": schema.protocolo_descricao.strip(),
                "especie": especie,
                "duracao_dias": 7,
            })
            return novo.protocolo_id
        return None

    async def create(self, schema: InseminacaoCreate, tecnico_id: UUID) -> tuple[InseminacaoModel, list[str], Optional[dict], Optional[dict]]:
        animal = await self.animal_repo.get_by_id(schema.animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")

        if animal.sexo != SexoAnimal.FEMEA:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Apenas fêmeas podem ser inseminadas.")

        if animal.status in _STATUS_BLOQUEADOS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Animal com status {animal.status.value} não pode ser inseminado.",
            )

        warnings: list[str] = []
        aviso_intervalo: Optional[dict] = None
        now = datetime.now(timezone.utc)
        data_ins = schema.data_inseminacao
        if data_ins.tzinfo is None:
            data_ins = data_ins.replace(tzinfo=timezone.utc)

        # Resolve protocolo_id via descrição se necessário
        protocolo_id = await self._resolver_protocolo_id(schema, animal.especie)

        # Calcula dias_desde_ultima_ins
        dias_desde_ultima: Optional[int] = None
        ultima = await self.repo.get_ultima_inseminacao(animal.animal_id)
        if ultima:
            ultima_dt = ultima.data_inseminacao
            if ultima_dt.tzinfo is None:
                ultima_dt = ultima_dt.replace(tzinfo=timezone.utc)
            dias_desde_ultima = (data_ins - ultima_dt).days
            ciclo = _CICLO_DIAS[animal.especie]
            if dias_desde_ultima < ciclo:
                if not schema.forcar_registro:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"Intervalo de {dias_desde_ultima} dias abaixo do ciclo da espécie ({ciclo} dias). Use forcar_registro=true para confirmar.",
                    )
                msg = f"Intervalo curto: {dias_desde_ultima} dias (ciclo mínimo {ciclo} dias)."
                warnings.append(msg)
                aviso_intervalo = {"dias_decorridos": dias_desde_ultima, "mensagem": msg}

        # Calcula dias_pos_parto + aviso
        dias_pos_parto: Optional[int] = None
        if animal.data_ultimo_parto:
            ultimo_parto_dt = animal.data_ultimo_parto
            if isinstance(ultimo_parto_dt, date) and not isinstance(ultimo_parto_dt, datetime):
                ultimo_parto_dt = datetime(ultimo_parto_dt.year, ultimo_parto_dt.month, ultimo_parto_dt.day, tzinfo=timezone.utc)
            dias_pos_parto = (data_ins - ultimo_parto_dt).days
            minimo = _POS_PARTO_AVISO[animal.especie]
            if dias_pos_parto < minimo:
                warnings.append(f"Dias pós-parto ({dias_pos_parto}) abaixo do recomendado ({minimo} dias).")

        # Conta ciclos sem concepção via COUNT SQL
        _, ciclos_sem_concepcao = await self.repo.list_all(
            animal_id=animal.animal_id, resultado=ResultadoInseminacao.VAZIA, limit=1
        )
        _, historico_prenhez = await self.repo.list_all(
            animal_id=animal.animal_id, resultado=ResultadoInseminacao.PRENHA, limit=1
        )

        payload = schema.model_dump(exclude={"forcar_registro", "protocolo_descricao"})
        payload["tecnico_id"]            = tecnico_id
        payload["protocolo_id"]          = protocolo_id
        payload["dias_desde_ultima_ins"] = dias_desde_ultima
        payload["dias_pos_parto"]        = dias_pos_parto
        payload["ciclos_sem_concepcao"]  = ciclos_sem_concepcao
        payload["historico_prenhez"]     = historico_prenhez

        ins = await self.repo.create(payload)

        # Alerta DIAGNOSTICO_PENDENTE — disparo em 30 dias
        data_disparo = (data_ins + timedelta(days=30)).date()
        alerta = await self.alerta_repo.create({
            "animal_id":      animal.animal_id,
            "inseminacao_id": ins.inseminacao_id,
            "tipo":           TipoAlerta.DIAGNOSTICO_PENDENTE,
            "mensagem":       f"Diagnóstico de gestação pendente para {animal.codigo} ({animal.nome}).",
            "data_disparo":   data_disparo,
            "prioridade":     PrioridadeAlerta.MEDIA,
        })
        alerta_dict = {
            "id":          str(alerta.alerta_id),
            "data_disparo": str(data_disparo),
            "mensagem":    f"Diagnóstico de gestação pendente para {animal.codigo} ({animal.nome}).",
        }

        return ins, warnings, alerta_dict, aviso_intervalo

    async def get_by_id(self, inseminacao_id: UUID) -> InseminacaoModel:
        obj = await self.repo.get_by_id(inseminacao_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inseminação não encontrada.")
        return obj

    async def get_by_id_enriched(self, inseminacao_id: UUID) -> dict:
        obj = await self.repo.get_by_id_enriched(inseminacao_id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inseminação não encontrada.")
        return obj

    async def list_all(self, **kwargs) -> tuple[list[InseminacaoModel], int]:
        return await self.repo.list_all(**kwargs)

    async def list_all_enriched(self, **kwargs) -> tuple[list[dict], int]:
        return await self.repo.list_all_enriched(**kwargs)

    async def list_pendentes_diagnostico(self, **kwargs) -> list[InseminacaoModel]:
        return await self.repo.list_pendentes_diagnostico(**kwargs)

    async def registrar_diagnostico(
        self, inseminacao_id: UUID, schema: DiagnosticoViaInseminacaoCreate
    ) -> dict:
        from repositories.diagnostico_repository import DiagnosticoRepository
        from models.enums import ResultadoDiagnostico

        ins = await self.get_by_id(inseminacao_id)
        diag_repo = DiagnosticoRepository(self.session)

        # Verifica se já existe diagnóstico
        existente = await diag_repo.get_by_id(inseminacao_id)
        if existente:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esta inseminação já possui diagnóstico registrado.")

        data_ins = ins.data_inseminacao.date() if isinstance(ins.data_inseminacao, datetime) else ins.data_inseminacao
        if schema.data_diagnostico <= data_ins:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Data do diagnóstico ({schema.data_diagnostico}) deve ser posterior à data da inseminação ({data_ins}).",
            )

        # Calcula data_parto_prevista automaticamente se PRENHA e não informada
        resultado = ResultadoDiagnostico(schema.resultado)
        data_parto_prevista = schema.data_parto_prevista
        if resultado == ResultadoDiagnostico.PRENHA and not data_parto_prevista:
            animal = await self.animal_repo.get_by_id(ins.animal_id)
            gestacao = _GESTACAO_DIAS.get(animal.especie, 283)
            data_parto_prevista = data_ins + timedelta(days=gestacao)

        from schemas.diagnostico_schema import DiagnosticoCreate
        diag_schema = DiagnosticoCreate(
            inseminacao_id=inseminacao_id,
            animal_id=ins.animal_id,
            data_diagnostico=schema.data_diagnostico,
            metodo=schema.metodo,
            resultado=resultado,
            dias_gestacao_est=schema.dias_gestacao_est,
            data_parto_prevista=data_parto_prevista,
            veterinario_id=schema.veterinario_id,
            observacoes=schema.observacoes,
        )
        diag = await diag_repo.create(diag_schema)

        # Atualiza status do animal
        animal = await self.animal_repo.get_by_id(ins.animal_id)
        if resultado == ResultadoDiagnostico.PRENHA:
            animal.status = StatusAnimal.PRENHA
        elif resultado == ResultadoDiagnostico.VAZIA and animal.status == StatusAnimal.PRENHA:
            animal.status = StatusAnimal.ATIVA
        await self.session.commit()

        # Resolve alertas DIAGNOSTICO_PENDENTE do animal
        alertas = await self.alerta_repo.list_pendentes(animal_id=ins.animal_id, tipo=TipoAlerta.DIAGNOSTICO_PENDENTE, limit=10)
        for alerta in alertas:
            await self.alerta_repo.marcar_resolvido(alerta.alerta_id)

        return {
            "diagnostico_id": str(diag.diagnostico_id),
            "resultado": resultado.value,
            "data_parto_prevista": str(data_parto_prevista) if data_parto_prevista else None,
            "animal_status_atualizado": animal.status.value,
            "alerta_resolvido": True,
        }
