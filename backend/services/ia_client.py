"""Cliente httpx assíncrono para o microsserviço ML externo."""
import time
from typing import Optional

import httpx

from core.config import settings


def _auth_headers() -> dict:
    """Header Bearer estático quando BACKEND_AUTH_SECRET está configurado (senão, vazio)."""
    if settings.BACKEND_AUTH_SECRET:
        return {"Authorization": f"Bearer {settings.BACKEND_AUTH_SECRET}"}
    return {}


def _adaptar_fatores(fatores_determinantes: list[dict], features: dict) -> list[dict]:
    """
    Converte os FatorDeterminante do microsserviço ({feature, impacto, label}) para o
    formato consumido pelo backend (motor de regras): {feature, sentido, valor_atual, ...}.
    `sentido` é derivado do sinal de `impacto`; `valor_atual` vem das features de entrada.
    """
    adaptados = []
    for f in fatores_determinantes or []:
        impacto = f.get("impacto", 0.0) or 0.0
        feature = f.get("feature")
        adaptados.append({
            "feature":     feature,
            "sentido":     "positivo" if impacto >= 0 else "negativo",
            "valor_atual": features.get(feature),
            "impacto":     impacto,
            "label":       f.get("label"),
        })
    return adaptados


class IAClient:
    async def modelo_info(self) -> Optional[dict]:
        """Chama GET {IA_SERVICE_URL}/model-info. Retorna dict de metadados ou None."""
        if not settings.IA_SERVICE_URL:
            return None
        timeout = settings.IA_SERVICE_TIMEOUT_MS / 1000
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(timeout)) as client:
                resp = await client.get(
                    f"{settings.IA_SERVICE_URL.rstrip('/')}/model-info",
                    headers=_auth_headers(),
                )
                if resp.status_code != 200:
                    return None
                return resp.json()
        except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPError):
            return None

    async def predict(self, payload: dict, features: dict | None = None) -> Optional[dict]:
        """
        Chama POST {IA_SERVICE_URL}/predicao com o `payload` no contrato do microsserviço
        (PredicaoRequest). Mapeia a PredicaoResponse de volta para o formato esperado pelo
        backend: {score, top_5_fatores, modelo_versao, processado_em_ms}.

        Retorna None em URL vazia, erro de conexão/timeout, status != 200 ou resposta inválida
        — nesse caso o chamador deve cair no motor de regras local (fallback sempre disponível).
        """
        if not settings.IA_SERVICE_URL:
            return None

        features = features if features is not None else payload
        timeout = settings.IA_SERVICE_TIMEOUT_MS / 1000
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(timeout)) as client:
                t0 = time.monotonic()
                resp = await client.post(
                    f"{settings.IA_SERVICE_URL.rstrip('/')}/predicao",
                    json=payload,
                    headers=_auth_headers(),
                )
                elapsed_ms = int((time.monotonic() - t0) * 1000)
                if resp.status_code != 200:
                    return None
                data = resp.json()
                return {
                    "score":              data.get("score_prenhez"),
                    "top_5_fatores":      _adaptar_fatores(data.get("fatores_determinantes", []), features),
                    "modelo_versao":      data.get("modelo_versao", "ml_unknown"),
                    "processado_em_ms":   data.get("processado_em_ms", elapsed_ms),
                }
        except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPError):
            return None
