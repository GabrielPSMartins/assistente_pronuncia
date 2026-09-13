"""Lógica compartilhada: transcrição com Whisper e geração de feedback com gTTS."""

from pathlib import Path
import uuid

import whisper
from gtts import gTTS

from app.config import MODELO_WHISPER

_modelo = None


def carregar_modelo():
    """Carrega o modelo Whisper uma única vez e reaproveita entre chamadas."""
    global _modelo
    if _modelo is None:
        _modelo = whisper.load_model(MODELO_WHISPER)
    return _modelo


def transcrever_audio(caminho_audio) -> str:
    """Transcreve um arquivo de áudio em inglês e retorna o texto reconhecido."""
    modelo = carregar_modelo()
    resultado = modelo.transcribe(str(caminho_audio), fp16=False, language="en")
    return resultado["text"].strip()


def gerar_feedback(texto: str, pasta_destino: Path) -> Path:
    """Gera um áudio com a pronúncia nativa do texto e salva em pasta_destino."""
    pasta_destino.mkdir(parents=True, exist_ok=True)
    caminho = pasta_destino / f"{uuid.uuid4().hex}.mp3"
    tts = gTTS(text=texto, lang="en", slow=False)
    tts.save(caminho)
    return caminho
