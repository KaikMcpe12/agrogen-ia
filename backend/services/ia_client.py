"""Cliente httpx assíncrono para o microsserviço ML externo."""
import time
from typing import Optional

import httpx

from core.config import settings


class IAClient:
    async def predict(self, features: dict) -> Optional[dict]:
        """
        Chama POST {IA_SERVICE_URL}/predict.
        Retorna dict {score, top_5_fatores, modelo_versao} se sucesso.
        Retorna None em URL vazia, ConnectError, TimeoutException ou status != 200.
        """
        if not settings.IA_SERVICE_URL:
            return None

        timeout = settings.IA_SERVICE_TIMEOUT_MS / 1000
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(timeout)) as client:
                t0 = time.monotonic()
                resp = await client.post(
                    f"{settings.IA_SERVICE_URL.rstrip('/')}/predict",
                    json=features,
                )
                elapsed_ms = int((time.monotonic() - t0) * 1000)
                if resp.status_code != 200:
                    return None
                data = resp.json()
                data["processado_em_ms"] = elapsed_ms
                return data
        except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPError):
            return None
