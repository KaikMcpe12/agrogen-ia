from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")


class SuccessEnvelope(BaseModel, Generic[T]):
    success: bool = True
    data: T
    request_id: Optional[str] = None


class PaginatedMeta(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int


class PaginatedEnvelope(BaseModel, Generic[T]):
    success: bool = True
    data: list[T]
    meta: PaginatedMeta
    request_id: Optional[str] = None


class ErrorDetail(BaseModel):
    codigo_interno: str
    mensagem: str
    detalhes: Optional[str] = None


class ErrorEnvelope(BaseModel):
    success: bool = False
    error: ErrorDetail
    request_id: Optional[str] = None
