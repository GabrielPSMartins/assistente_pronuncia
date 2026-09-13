"""Caminhos e constantes compartilhados pelo CLI e pelo servidor web."""

import os
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

PASTA_AUDIO = RAIZ / "audio"
PASTA_UPLOADS = PASTA_AUDIO / "uploads"
PASTA_FEEDBACK = PASTA_AUDIO / "feedback"
PASTA_FRONTEND = RAIZ / "frontend"

MODELO_WHISPER = os.environ.get("WHISPER_MODEL", "small")
