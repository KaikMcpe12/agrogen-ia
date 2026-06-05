import csv
import io
from datetime import date

from fastapi.responses import StreamingResponse


def gerar_csv_streaming(colunas: list[str], linhas: list[dict], filename: str) -> StreamingResponse:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=colunas, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(linhas)
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def nome_arquivo(tipo: str, formato: str) -> str:
    hoje = date.today().isoformat()
    return f"relatorio-{tipo}-{hoje}.{formato}"
