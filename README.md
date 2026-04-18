# Assistente de Prática de Idiomas 

Este é um projeto prático e direto ao ponto que desenvolvi para explorar tecnologias de processamento de áudio e inteligência artificial (Speech-to-Text e Text-to-Speech) usando Python. 

A ideia aqui é criar uma ferramenta simples de "Shadowing" — uma técnica de estudo onde você escuta e repete frases para melhorar a pronúncia em inglês (ou outro idioma).

## O que o projeto faz?

O fluxo da aplicação é dividido em três passos simples:
1. **Você fala:** O sistema grava a sua voz pelo microfone direto no navegador.
2. **A IA valida:** O modelo ouve o seu áudio e transcreve para texto. Se a transcrição bater com o que você quis dizer, parabéns, sua pronúncia foi compreendida!
3. **A IA repete:** O sistema pega esse mesmo texto e lê de volta para você, utilizando um sotaque nativo para você comparar com a sua própria gravação.

> **Nota:** Este projeto foca em rodar a inteligência de transcrição sem depender de APIs pagas de conversação (como ChatGPT), tornando o fluxo mais leve e focado apenas na validação da fala.

## Tecnologias Utilizadas

* **Python:** A linguagem principal da lógica.
* **JavaScript / HTML5:** Utilizados em conjunto com o Python para habilitar a captura de áudio do microfone diretamente no Google Colab.
* **OpenAI Whisper (`whisper`):** Modelo de IA de código aberto utilizado para fazer o Reconhecimento de Fala (STT - Speech-to-Text). Ele processa o áudio gravado e o transforma em texto.
* **Google Text-to-Speech (`gTTS`):** Biblioteca utilizada para sintetizar a resposta em voz (TTS - Text-to-Speech), gerando o áudio com a pronúncia nativa do idioma configurado.

## Como funciona o código (Passo a Passo)

O código foi construído para ser executado no **Google Colab**, dividindo-se em três blocos principais:

1.  **Gravação de Áudio:** Um script injeta JavaScript no notebook para pedir permissão de uso do microfone. Ele grava 5 segundos de áudio e salva localmente como `user_voice.wav`.
2.  **Reconhecimento (Whisper):** O modelo `small` do Whisper é carregado em memória. Ele analisa o arquivo `user_voice.wav` configurado para o idioma inglês (`language="en"`) e imprime na tela o que entendeu da sua pronúncia.
3.  **Sintetização de Voz (gTTS):** O texto gerado pelo Whisper é passado para o gTTS, que cria um novo arquivo de áudio (`native_feedback.wav`), reproduzindo a frase com a cadência e o sotaque corretos.

## Como testar você mesmo

Como o projeto utiliza recursos de captura de mídia do navegador integrados ao Python, a maneira mais fácil de rodar é utilizando o Google Colab:

1. Abra um novo notebook no [Google Colab](https://colab.research.google.com/).
2. Copie os blocos de código deste repositório e cole em células separadas.
3. Execute a primeira célula. O navegador pedirá permissão para acessar o microfone.
4. Fale uma frase em inglês!
5. Rode as células seguintes para ver a mágica da transcrição e ouvir o feedback de pronúncia.
