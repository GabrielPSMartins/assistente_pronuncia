const elementosEtapa = {
  preparar: document.getElementById("tela-preparar"),
  gravar: document.getElementById("tela-gravar"),
  analisar: document.getElementById("tela-analisar"),
  resultado: document.getElementById("tela-resultado"),
};
const indicadoresEtapa = Array.from(document.querySelectorAll(".etapa"));
const ORDEM_ETAPAS = ["preparar", "gravar", "analisar", "resultado"];

const btnPermitir = document.getElementById("btn-permitir");
const btnGravar = document.getElementById("btn-gravar");
const btnTentarNovamente = document.getElementById("btn-tentar-novamente");
const cronometroEl = document.getElementById("cronometro");
const dicaGravar = document.getElementById("dica-gravar");
const canvasOnda = document.getElementById("onda");
const contextoCanvas = canvasOnda.getContext("2d");
const textoTranscrito = document.getElementById("texto-transcrito");
const areaFeedback = document.getElementById("area-feedback");
const audioFeedback = document.getElementById("audio-feedback");
const elementoErro = document.getElementById("erro");

let streamAtual = null;
let mediaRecorder = null;
let chunks = [];
let contextoAudio = null;
let analisador = null;
let animacaoId = null;
let inicioGravacao = 0;
let intervaloCronometro = null;

function mostrarErro(mensagem) {
  elementoErro.textContent = mensagem;
  elementoErro.hidden = false;
}

function limparErro() {
  elementoErro.hidden = true;
  elementoErro.textContent = "";
}

function irParaEtapa(nomeEtapa) {
  Object.entries(elementosEtapa).forEach(([nome, elemento]) => {
    elemento.hidden = nome !== nomeEtapa;
  });

  const indiceAtual = ORDEM_ETAPAS.indexOf(nomeEtapa);
  indicadoresEtapa.forEach((li) => {
    const indiceLi = ORDEM_ETAPAS.indexOf(li.dataset.etapa);
    li.classList.toggle("ativa", indiceLi === indiceAtual);
    li.classList.toggle("concluida", indiceLi < indiceAtual);
  });
}

function formatarTempo(segundosTotais) {
  const minutos = Math.floor(segundosTotais / 60).toString().padStart(2, "0");
  const segundos = Math.floor(segundosTotais % 60).toString().padStart(2, "0");
  return `${minutos}:${segundos}`;
}

function iniciarCronometro() {
  inicioGravacao = Date.now();
  cronometroEl.textContent = "00:00";
  intervaloCronometro = setInterval(() => {
    cronometroEl.textContent = formatarTempo((Date.now() - inicioGravacao) / 1000);
  }, 250);
}

function pararCronometro() {
  clearInterval(intervaloCronometro);
  intervaloCronometro = null;
}

function desenharOndaOciosa() {
  const largura = canvasOnda.width;
  const altura = canvasOnda.height;
  contextoCanvas.clearRect(0, 0, largura, altura);
  contextoCanvas.strokeStyle = "rgba(37, 99, 235, 0.4)";
  contextoCanvas.lineWidth = 2;
  contextoCanvas.beginPath();
  contextoCanvas.moveTo(0, altura / 2);
  contextoCanvas.lineTo(largura, altura / 2);
  contextoCanvas.stroke();
}

function desenharOndaAtiva() {
  const largura = canvasOnda.width;
  const altura = canvasOnda.height;
  const dados = new Uint8Array(analisador.frequencyBinCount);
  analisador.getByteTimeDomainData(dados);

  contextoCanvas.clearRect(0, 0, largura, altura);
  contextoCanvas.lineWidth = 2;
  contextoCanvas.strokeStyle = "#2563eb";
  contextoCanvas.beginPath();

  const passo = largura / dados.length;
  let x = 0;
  for (let i = 0; i < dados.length; i += 1) {
    const valorNormalizado = dados[i] / 128.0;
    const y = (valorNormalizado * altura) / 2;
    if (i === 0) {
      contextoCanvas.moveTo(x, y);
    } else {
      contextoCanvas.lineTo(x, y);
    }
    x += passo;
  }
  contextoCanvas.stroke();

  animacaoId = requestAnimationFrame(desenharOndaAtiva);
}

function pararVisualizacao() {
  if (animacaoId) {
    cancelAnimationFrame(animacaoId);
    animacaoId = null;
  }
  desenharOndaOciosa();
}

async function ativarMicrofone() {
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    mostrarErro("Este navegador não suporta gravação de áudio.");
    return;
  }

  limparErro();
  btnPermitir.disabled = true;

  try {
    streamAtual = await navigator.mediaDevices.getUserMedia({ audio: true });

    contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
    const fonte = contextoAudio.createMediaStreamSource(streamAtual);
    analisador = contextoAudio.createAnalyser();
    analisador.fftSize = 2048;
    fonte.connect(analisador);

    desenharOndaOciosa();
    irParaEtapa("gravar");
  } catch (erro) {
    mostrarErro("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
  } finally {
    btnPermitir.disabled = false;
  }
}

function iniciarGravacao() {
  limparErro();
  chunks = [];
  mediaRecorder = new MediaRecorder(streamAtual);

  mediaRecorder.addEventListener("dataavailable", (evento) => {
    if (evento.data.size > 0) {
      chunks.push(evento.data);
    }
  });

  mediaRecorder.addEventListener("stop", () => {
    pararVisualizacao();
    pararCronometro();
    enviarGravacao(new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" }));
  });

  mediaRecorder.start();
  btnGravar.classList.add("gravando");
  btnGravar.setAttribute("aria-label", "Parar gravação");
  dicaGravar.textContent = "Gravando... toque novamente para parar";
  iniciarCronometro();
  animacaoId = requestAnimationFrame(desenharOndaAtiva);
}

function pararGravacao() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  btnGravar.classList.remove("gravando");
  btnGravar.setAttribute("aria-label", "Iniciar gravação");
}

async function enviarGravacao(blob) {
  irParaEtapa("analisar");

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

    if (!dados.texto) {
      textoTranscrito.textContent = "Nenhuma fala foi identificada. Tente falar mais perto do microfone.";
      areaFeedback.hidden = true;
    } else {
      textoTranscrito.textContent = dados.texto;
      if (dados.feedback_url) {
        audioFeedback.src = dados.feedback_url;
        areaFeedback.hidden = false;
      } else {
        areaFeedback.hidden = true;
      }
    }

    irParaEtapa("resultado");
  } catch (erro) {
    mostrarErro(erro.message || "Falha ao processar o áudio.");
    dicaGravar.textContent = "Toque no microfone para começar a gravar";
    irParaEtapa("gravar");
  }
}

function reiniciarFluxo() {
  limparErro();
  textoTranscrito.textContent = "";
  areaFeedback.hidden = true;
  audioFeedback.removeAttribute("src");
  cronometroEl.textContent = "00:00";
  dicaGravar.textContent = "Toque no microfone para começar a gravar";

  if (streamAtual && streamAtual.getTracks().every((faixa) => faixa.readyState === "live")) {
    irParaEtapa("gravar");
    desenharOndaOciosa();
  } else {
    irParaEtapa("preparar");
  }
}

btnPermitir.addEventListener("click", ativarMicrofone);

btnGravar.addEventListener("click", () => {
  const estaGravando = mediaRecorder && mediaRecorder.state === "recording";
  if (estaGravando) {
    pararGravacao();
  } else {
    iniciarGravacao();
  }
});

btnTentarNovamente.addEventListener("click", reiniciarFluxo);

irParaEtapa("preparar");
