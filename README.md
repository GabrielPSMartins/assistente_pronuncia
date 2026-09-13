# Assistente de Pronúncia

Grava uma fala em inglês, transcreve com o [Whisper](https://github.com/openai/whisper) e
reproduz um áudio de feedback com a pronúncia nativa (gTTS). Disponível como script de
terminal ou como aplicação web (FastAPI + HTML/JS).

## Estrutura do projeto

```
app/
  config.py   caminhos e configurações compartilhadas
  core.py     transcrição (Whisper) e geração de feedback (gTTS)
  cli.py      versão de terminal: grava do microfone local e reproduz com ffplay
  server.py   backend FastAPI: recebe áudio do navegador e serve o frontend
frontend/
  index.html, style.css, app.js   interface web (grava no navegador via MediaRecorder)
main.py       ponto de entrada do modo terminal (python main.py)
```

## Pré-requisitos do sistema

- `ffmpeg` (usado pelo Whisper e pelo `ffplay` no modo terminal): `sudo apt install ffmpeg`
- `PortAudio` (necessário apenas no modo terminal, para gravar do microfone local):
  `sudo apt install libportaudio2`

## Instalação

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Uso — modo terminal

```bash
python main.py
```

Grava 5 segundos do microfone local, transcreve e reproduz o feedback com `ffplay`.

## Uso — modo web

```bash
uvicorn app.server:app --reload
```

Acesse `http://127.0.0.1:8000` no navegador, permita o uso do microfone e clique em
**Gravar**. A gravação é feita no próprio navegador (sem depender de microfone/ffplay do
servidor); o áudio é enviado para o backend, transcrito com Whisper e o feedback em
áudio é reproduzido automaticamente.

## Configuração

- `WHISPER_MODEL` (variável de ambiente, padrão `small`): tamanho do modelo Whisper a
  carregar (`tiny`, `base`, `small`, `medium`, `large`). Modelos maiores são mais
  precisos, porém mais lentos e pesados.
