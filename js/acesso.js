/* ============================================================================
   FinPessoal – js/acesso.js
   ============================================================================
   Controle de acesso simples (SEM senha) — não é autenticação de verdade,
   é só uma identificação do testador antes de liberar o sistema.

   No primeiro acesso deste navegador, pedimos Nome / E-mail / Telefone
   (ver login.html), guardamos em localStorage e registramos o acesso numa
   planilha Google Sheets através de um Google Apps Script já publicado.

   Nos acessos seguintes não pedimos nada de novo: só registramos mais um
   acesso na planilha (em segundo plano) e liberamos o app direto.

   Onde os dados ficam guardados: localStorage, chave 'fp_usuario':
     { nome, email, telefone, navegador, sistema, versao }
   ============================================================================ */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzvm5_z3yR4DPZkCYDLk2FlD7dl_34dhUB3L2falS4P1RBkjkfKUibJ7m6_Jw9BSJsa/exec';
const USUARIO_KEY = 'fp_usuario';
const VERSAO_APP = '1.0.0';

// Lê o usuário salvo (ou null se ainda não existir / estiver corrompido).
function getUsuario() {
  try { return JSON.parse(localStorage.getItem(USUARIO_KEY) || 'null'); }
  catch (e) { return null; }
}

// Salva os dados do usuário no localStorage.
function salvarUsuario(dados) {
  localStorage.setItem(USUARIO_KEY, JSON.stringify(dados));
}

function detectarNavegador() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/')) return 'Safari';
  return 'Desconhecido';
}

function detectarSistema() {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Desconhecido';
}

// Envia o registro de acesso pro Apps Script (que grava na planilha).
// Usa modo 'no-cors' de propósito: o Apps Script não devolve cabeçalhos
// CORS, então não conseguimos ler a resposta mesmo — e não precisamos,
// só garantir que o POST saia. Falha de rede aqui não pode travar o app.
function registrarAcesso(dados) {
  try {
    fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(dados)
    }).catch(function (e) {
      console.warn('Não foi possível registrar o acesso na planilha:', e);
    });
  } catch (e) {
    console.warn('Não foi possível registrar o acesso na planilha:', e);
  }
}

// Chamada no topo do index.html. Se não existir usuário salvo, manda pra
// tela de identificação. Se existir, registra mais um acesso (em segundo
// plano) e devolve os dados do usuário pra liberar o sistema.
function verificarAcessoOuRedirecionar() {
  const usuario = getUsuario();
  if (!usuario || !usuario.nome || !usuario.email || !usuario.telefone) {
    window.location.href = 'login.html';
    return null;
  }
  registrarAcesso(usuario);
  return usuario;
}
