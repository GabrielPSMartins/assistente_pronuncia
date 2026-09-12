"""Grava uma pronuncia, transcreve com Whisper e reproduz o feedback em ingles."""

from pathlib import Path
import shutil
import subprocess

import soundfile as sf
import whisper
from gtts import gTTS

try:
  import sounddevice as sd
  PORTAUDIO_ERROR = None
except OSError as error:
  sd = None
  PORTAUDIO_ERROR = error


PASTA_AUDIO = Path(__file__).resolve().parent / "audio"
ARQUIVO_GRAVACAO = PASTA_AUDIO / "user_voice.wav"
ARQUIVO_RESPOSTA = PASTA_AUDIO / "native_feedback.mp3"


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


def transcrever_pronuncia(record_file):
  print("Carregando o modelo Whisper...")
  model = whisper.load_model("small")
  result = model.transcribe(str(record_file), fp16=False, language="en")
  return result["text"].strip()


def gerar_feedback(texto_transcrito):
  tts = gTTS(text=texto_transcrito, lang="en", slow=False)
  tts.save(ARQUIVO_RESPOSTA)
  return ARQUIVO_RESPOSTA


def main():
  record_file = gravar_pronuncia(sec=5)
  texto_transcrito = transcrever_pronuncia(record_file)

  print("\nO que o Whisper entendeu:")
  print(f"-> {texto_transcrito}")

  if not texto_transcrito:
    print("Nenhuma fala foi identificada.")
    return

  response_audio = gerar_feedback(texto_transcrito)
  print("\nOuça a pronúncia nativa:")
  reproduzir_audio(response_audio)


if __name__ == "__main__":
  try:
    main()
  except KeyboardInterrupt:
    print("\nGravação interrompida.")
  except Exception as error:
    print(f"\nNão foi possível executar o assistente: {error}")