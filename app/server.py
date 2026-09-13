from contextlib import asynccontextmanager
from pathlib import Path
import re
import uuid

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import PASTA_FEEDBACK, PASTA_FRONTEND, PASTA_UPLOADS
from app.core import carregar_modelo, gerar_feedback, transcrever_audio

EXTENSAO_PADRAO = ".webm"
EXTENSOES_PERMITIDAS = {".webm", ".ogg", ".wav", ".mp3", ".m4a", ".mp4"}
NOME_ARQUIVO_VALIDO = re.compile(r"^[0-9a-f]{32}\.mp3$")


@asynccontextmanager
async def lifespan(app: FastAPI):
    PASTA_UPLOADS.mkdir(parents=True, exist_ok=True)
    PASTA_FEEDBACK.mkdir(parents=True, exist_ok=True)
    carregar_modelo()  # carrega o Whisper uma única vez, evitando reload em cada requisição
    yield


app = FastAPI(title="Assistente de Pronúncia", lifespan=lifespan)


def _extensao_segura(nome_original: str | None) -> str:
    sufixo = Path(nome_original or "").suffix.lower()
    return sufixo if sufixo in EXTENSOES_PERMITIDAS else EXTENSAO_PADRAO


@app.post("/api/pronuncia")
async def avaliar_pronuncia(arquivo: UploadFile = File(...)):
    caminho_upload = PASTA_UPLOADS / f"{uuid.uuid4().hex}{_extensao_segura(arquivo.filename)}"
    conteudo = await arquivo.read()
    if not conteudo:
        raise HTTPException(status_code=400, detail="Nenhum áudio foi enviado.")

    caminho_upload.write_bytes(conteudo)
    try:
        texto = transcrever_audio(caminho_upload)
    except Exception as erro:
        raise HTTPException(status_code=500, detail=f"Falha ao transcrever o áudio: {erro}") from erro
    finally:
        caminho_upload.unlink(missing_ok=True)

    if not texto:
        return {"texto": "", "feedback_url": None}

    caminho_feedback = gerar_feedback(texto, PASTA_FEEDBACK)
    return {"texto": texto, "feedback_url": f"/api/feedback/{caminho_feedback.name}"}


@app.get("/api/feedback/{nome_arquivo}")
def obter_feedback(nome_arquivo: str):
    if not NOME_ARQUIVO_VALIDO.match(nome_arquivo):
        raise HTTPException(status_code=404, detail="Áudio de feedback não encontrado.")

    caminho = PASTA_FEEDBACK / nome_arquivo
    if not caminho.is_file():
        raise HTTPException(status_code=404, detail="Áudio de feedback não encontrado.")
    return FileResponse(caminho, media_type="audio/mpeg")


app.mount("/", StaticFiles(directory=PASTA_FRONTEND, html=True), name="frontend")
