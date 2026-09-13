const btnGravar = document.getElementById("btn-gravar");
const status = document.getElementById("status");
const resultado = document.getElementById("resultado");
const textoTranscrito = document.getElementById("texto-transcrito");
const areaFeedback = document.getElementById("area-feedback");
const audioFeedback = document.getElementById("audio-feedback");
const elementoErro = document.getElementById("erro");

let mediaRecorder = null;
let chunks = [];

function mostrarErro(mensagem) {
  elementoErro.textContent = mensagem;
  elementoErro.hidden = false;
}

function limparErro() {
  elementoErro.hidden = true;
  elementoErro.textContent = "";
}

function definirStatus(texto) {
  status.textContent = texto;
}

async function iniciarGravacao() {
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    mostrarErro("Este navegador não suporta gravação de áudio.");
    return;
  }

  limparErro();
  resultado.hidden = true;
  areaFeedback.hidden = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.addEventListener("dataavailable", (evento) => {
      if (evento.data.size > 0) {
        chunks.push(evento.data);
      }
    });

    mediaRecorder.addEventListener("stop", () => {
      stream.getTracks().forEach((faixa) => faixa.stop());
      enviarGravacao(new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" }));
    });

    mediaRecorder.start();
    btnGravar.textContent = "Parar";
    btnGravar.classList.add("gravando");
    definirStatus("Gravando... fale agora.");
  } catch (erro) {
    mostrarErro("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
  }
}

function pararGravacao() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  btnGravar.textContent = "Gravar";
  btnGravar.classList.remove("gravando");
}

async function enviarGravacao(blob) {
  btnGravar.disabled = true;
  definirStatus("Transcrevendo com Whisper... isso pode levar alguns segundos.");

  const dadosFormulario = new FormData();
  dadosFormulario.append("arquivo", blob, "gravacao.webm");

  try {
    const resposta = await fetch("/api/pronuncia", {
      method: "POST",
      body: dadosFormulario,
    });

    if (!resposta.ok) {
      const detalhe = await resposta.json().catch(() => null);
      throw new Error(detalhe?.detail || `Erro do servidor (${resposta.status}).`);
    }

    const dados = await resposta.json();
    resultado.hidden = false;

    if (!dados.texto) {
      textoTranscrito.textContent = "Nenhuma fala foi identificada.";
      areaFeedback.hidden = true;
    } else {
      textoTranscrito.textContent = dados.texto;
      if (dados.feedback_url) {
        audioFeedback.src = dados.feedback_url;
        areaFeedback.hidden = false;
      }
    }

    definirStatus("Pronto para gravar");
  } catch (erro) {
    mostrarErro(erro.message || "Falha ao processar o áudio.");
    definirStatus("Pronto para gravar");
  } finally {
    btnGravar.disabled = false;
  }
}

btnGravar.addEventListener("click", () => {
  const estaGravando = mediaRecorder && mediaRecorder.state === "recording";
  if (estaGravando) {
    pararGravacao();
  } else {
    iniciarGravacao();
  }
});
