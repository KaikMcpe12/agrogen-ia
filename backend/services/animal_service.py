from datetime import date
from uuid import UUID
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models import AnimalModel
from schemas import AnimalCreate, AnimalUpdate
from schemas.animal_schema import AnimalResponse, DadosGeneticosOutput
from repositories.animal_repository import AnimalRepository
from repositories.dados_geneticos_repository import DadosGeneticosRepository
from models.enums import EspecieAnimal, SexoAnimal, StatusAnimal

# Máquina de estados — definida no Commit 3, validada no update
VALID_TRANSITIONS: dict[StatusAnimal, set[StatusAnimal]] = {
    StatusAnimal.ATIVA:             {StatusAnimal.PRENHA, StatusAnimal.EM_REPOUSO, StatusAnimal.REPRODUTOR_ATIVO, StatusAnimal.EM_MONITORAMENTO, StatusAnimal.DESCARTADA},
    StatusAnimal.PRENHA:            {StatusAnimal.ATIVA, StatusAnimal.EM_REPOUSO, StatusAnimal.DESCARTADA},
    StatusAnimal.EM_REPOUSO:        {StatusAnimal.ATIVA, StatusAnimal.EM_MONITORAMENTO, StatusAnimal.DESCARTADA},
    StatusAnimal.REPRODUTOR_ATIVO:  {StatusAnimal.ATIVA, StatusAnimal.EM_MONITORAMENTO, StatusAnimal.DESCARTADA},
    StatusAnimal.EM_MONITORAMENTO:  {StatusAnimal.ATIVA, StatusAnimal.EM_REPOUSO, StatusAnimal.DESCARTADA},
    StatusAnimal.DESCARTADA:        set(),
}


class AnimalService:
    def __init__(self, session: AsyncSession):
        self.repo     = AnimalRepository(session)
        self.gen_repo = DadosGeneticosRepository(session)

    def _calcular_idade_meses(self, data_nascimento: Optional[date]) -> Optional[int]:
        if not data_nascimento:
            return None
        hoje = date.today()
        return (hoje.year - data_nascimento.year) * 12 + (hoje.month - data_nascimento.month)

    async def _buscar_ultimo_evento(self, animal_id: UUID) -> Optional[dict]:
        from sqlalchemy import select, union_all, literal
        from models.inseminacao_model import InseminacaoModel
        from models.diagnostico_model import DiagnosticoModel

        # Última inseminação
        stmt_ins = (
            select(
                InseminacaoModel.data_inseminacao.label("data"),
                literal("INSEMINACAO").label("tipo"),
                InseminacaoModel.resultado.label("resultado_raw"),
            )
            .where(InseminacaoModel.animal_id == animal_id)
            .order_by(InseminacaoModel.data_inseminacao.desc())
            .limit(1)
        )
        row = (await self.repo.session.execute(stmt_ins)).first()
        if row:
            return {
                "tipo":      row.tipo,
                "data":      row.data.isoformat() if row.data else None,
                "resultado": row.resultado_raw.value if row.resultado_raw else None,
            }
        return None

    async def create(self, schema: AnimalCreate) -> AnimalModel:
        if not schema.codigo:
            codigo = await self.repo.next_codigo(schema.fazenda_id, schema.especie)
            schema = schema.model_copy(update={"codigo": codigo})
        animal = await self.repo.create(schema)
        if schema.dados_geneticos:
            await self.gen_repo.upsert(animal.animal_id, schema.dados_geneticos.model_dump(exclude_none=True))
        return animal

    async def get_by_id(self, animal_id: UUID) -> dict:
        animal = await self.repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")
        gen = await self.gen_repo.get_by_animal_id(animal_id)
        ultimo_evento = await self._buscar_ultimo_evento(animal_id)
        resp = AnimalResponse.model_validate(animal)
        resp.idade_meses     = self._calcular_idade_meses(animal.data_nascimento)
        resp.dados_geneticos = DadosGeneticosOutput.model_validate(gen) if gen else None
        resp.ultimo_evento   = ultimo_evento
        return resp.model_dump(mode="json")

    async def list_all(self, **kwargs) -> tuple[list[dict], int]:
        items, total = await self.repo.list_all(**kwargs)
        hoje = date.today()
        result = []
        for animal in items:
            resp = AnimalResponse.model_validate(animal)
            resp.idade_meses = self._calcular_idade_meses(animal.data_nascimento)
            result.append(resp.model_dump(mode="json"))
        return result, total

    async def update(self, animal_id: UUID, schema: AnimalUpdate) -> AnimalModel:
        animal = await self.repo.get_by_id(animal_id)
        if not animal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado.")

        # Máquina de estados
        if schema.status is not None and schema.status != animal.status:
            permitidas = VALID_TRANSITIONS.get(animal.status, set())
            if schema.status not in permitidas:
                nomes = ", ".join(s.value for s in permitidas) if permitidas else "nenhuma"
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Transição de status inválida: {animal.status.value} → {schema.status.value}. Permitidas: {nomes}.",
                )

        sexo       = schema.sexo        or animal.sexo
        num_partos = schema.num_partos  if schema.num_partos is not None else animal.num_partos
        especie    = schema.especie     or animal.especie
        peso       = schema.peso_inicial_kg or animal.peso_inicial_kg

        if sexo == SexoAnimal.MACHO and num_partos > 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Machos não podem ter partos.")

        limites = {EspecieAnimal.BOVINO: (50, 900), EspecieAnimal.OVINO: (10, 120), EspecieAnimal.CAPRINO: (8, 100)}
        minimo, maximo = limites[especie]
        if not (minimo <= float(peso) <= maximo):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Peso incompatível para {especie.value} ({minimo}kg–{maximo}kg).")

        return await self.repo.update(animal_id, schema)

    async def import_csv(self, conteudo: bytes, fazenda_id: UUID) -> dict:
        import csv, io
        _COLUNAS = {"nome", "especie", "sexo", "data_nascimento", "peso_inicial_kg", "condicao_corporal"}
        try:
            texto = conteudo.decode("utf-8")
        except UnicodeDecodeError:
            texto = conteudo.decode("latin-1")

        reader = csv.DictReader(io.StringIO(texto))
        if not reader.fieldnames or not _COLUNAS.issubset(set(reader.fieldnames)):
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cabeçalho CSV inválido. Colunas obrigatórias: {', '.join(sorted(_COLUNAS))}",
            )

        importados, erros = 0, []
        for i, row in enumerate(reader, start=2):
            try:
                row["fazenda_id"] = str(fazenda_id)
                schema = AnimalCreate.model_validate(row)
                await self.create(schema)
                importados += 1
            except Exception as exc:
                erros.append({"linha": i, "erro": str(exc)})

        return {"total_linhas": importados + len(erros), "importados": importados, "erros": erros}

    async def soft_delete(self, animal_id: UUID) -> None:
        sucesso = await self.repo.soft_delete(animal_id)
        if not sucesso:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal não encontrado ou já removido.")
