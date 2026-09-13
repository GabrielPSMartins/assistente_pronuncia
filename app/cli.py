"""Assistente de pronúncia via terminal: grava o microfone local, transcreve com
Whisper e reproduz o feedback em inglês."""

import shutil
import subprocess

import soundfile as sf

from app.config import PASTA_AUDIO
from app.core import gerar_feedback, transcrever_audio

try:
    import sounddevice as sd
    PORTAUDIO_ERROR = None
except OSError as error:
    sd = None
    PORTAUDIO_ERROR = error


ARQUIVO_GRAVACAO = PASTA_AUDIO / "user_voice.wav"


def gravar_pronuncia(sec=5, taxa_amostragem=44100):
    """Grava o microfone local e salva o resultado em WAV."""
    if sd is None:
        raise RuntimeError(
            "A biblioteca PortAudio não foi encontrada. "
            "Instale-a com: sudo apt install libportaudio2"
        ) from PORTAUDIO_ERROR

    PASTA_AUDIO.mkdir(exist_ok=True)
    print(f"Gravando por {sec} segundos... Fale agora.")
    audio = sd.rec(
        int(sec * taxa_amostragem),
        samplerate=taxa_amostragem,
        channels=1,
        dtype="float32",
    )
    sd.wait()
    sf.write(ARQUIVO_GRAVACAO, audio, taxa_amostragem)
    return ARQUIVO_GRAVACAO


def reproduzir_audio(caminho):
    """Reproduz um arquivo usando o ffplay instalado no sistema."""
    ffplay = shutil.which("ffplay")
    if ffplay is None:
        raise RuntimeError("O comando 'ffplay' não foi encontrado. Instale o ffmpeg.")

    subprocess.run(
        [ffplay, "-nodisp", "-autoexit", "-loglevel", "quiet", str(caminho)],
        check=True,
    )


def main():
    record_file = gravar_pronuncia(sec=5)

    print("Carregando o modelo Whisper...")
    texto_transcrito = transcrever_audio(record_file)

    print("\nO que o Whisper entendeu:")
    print(f"-> {texto_transcrito}")

    if not texto_transcrito:
        print("Nenhuma fala foi identificada.")
        return

    caminho_feedback = gerar_feedback(texto_transcrito, PASTA_AUDIO)
    print("\nOuça a pronúncia nativa:")
    reproduzir_audio(caminho_feedback)


def executar():
    """Executa o assistente tratando interrupções e erros de forma amigável."""
    try:
        main()
    except KeyboardInterrupt:
        print("\nGravação interrompida.")
    except Exception as error:
        print(f"\nNão foi possível executar o assistente: {error}")


if __name__ == "__main__":
    executar()
