/* ============================================================================
   FinPessoal – js/auth-client.js
   ============================================================================
   Ponte entre o front-end (index.html / login.html) e o backend de
   autenticação (pasta server/, rodando localmente por enquanto — ver
   server/server.js e o README para instruções de como subir ele).

   Onde a sessão fica guardada: localStorage, chave 'fp_auth', no formato
     { token: '...', user: { id, name, email } }
   O token é enviado em toda chamada protegida como cabeçalho
     Authorization: Bearer <token>

   IMPORTANTE: trocar API_BASE aqui é o único ajuste necessário quando o
   backend for hospedado de verdade (Render, por exemplo) em vez de rodar
   em localhost.
   ============================================================================ */

const API_BASE = 'http://localhost:3001/api';
const AUTH_KEY = 'fp_auth';

function getAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); }
  catch (e) { return null; }
}
function saveAuth(token, user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }));
}
function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}
function logout() {
  clearAuth();
  window.location.href = 'login.html';
}

// Faz uma chamada à API já anexando o token de autenticação, quando houver.
async function apiFetch(path, options = {}) {
  const auth = getAuth();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (auth && auth.token) headers['Authorization'] = 'Bearer ' + auth.token;
  let res;
  try {
    res = await fetch(API_BASE + path, { ...options, headers });
  } catch (e) {
    // Erro de rede — quase sempre significa "o servidor local não está rodando".
    throw new Error('Não foi possível falar com o servidor. Ele está rodando? (cd server && npm start)');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro inesperado.');
  return data;
}

async function apiRegister(name, email, phone, password, confirmPassword) {
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, phone, password, confirmPassword }) });
}
async function apiLogin(identifier, password) {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) });
}
async function apiMe() {
  return apiFetch('/auth/me', { method: 'GET' });
}

// Chamada no topo do index.html: garante que existe uma sessão válida antes
// de deixar o app carregar. Se não houver (ou o token tiver expirado/for
// inválido), manda para a tela de login. Retorna o usuário logado quando ok.
async function requireAuthOrRedirect() {
  const auth = getAuth();
  if (!auth || !auth.token) { window.location.href = 'login.html'; return null; }
  try {
    const { user } = await apiMe();
    return user;
  } catch (e) {
    clearAuth();
    window.location.href = 'login.html';
    return null;
  }
}
