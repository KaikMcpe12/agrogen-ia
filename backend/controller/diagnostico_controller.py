from fastapi import HTTPException
from core.database import supabase


class DiagnosticoController:

    @staticmethod
    def listar():
        response = supabase.table("diagnosticos").select("*").execute()
        return response.data


    @staticmethod
    def buscar_por_id(diagnostico_id):
        response = (
            supabase
            .table("diagnosticos")
            .select("*")
            .eq("id", diagnostico_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Diagnóstico não encontrado"
            )

        return response.data[0]


    @staticmethod
    def criar(diagnostico):
        response = (
            supabase
            .table("diagnosticos")
            .insert(diagnostico.model_dump())
            .execute()
        )

        return response.data[0]


    @staticmethod
    def deletar(diagnostico_id):
        response = (
            supabase
            .table("diagnosticos")
            .delete()
            .eq("id", diagnostico_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Diagnóstico não encontrado"
            )

        return {"message": "Diagnóstico removido"}