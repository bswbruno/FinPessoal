/* ============================================================================
   FinPessoal – server/validators.js
   ============================================================================
   Regras de validação do cadastro/login. Mantidas num arquivo só para ficar
   fácil de ajustar (ex: exigir senha mais forte) sem mexer nas rotas.
   ============================================================================ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Deixa só os dígitos do telefone (remove espaços, parênteses, traços, +55...).
// Assim "(21) 99999-9999" e "21999999999" são tratados como o mesmo número.
function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

// Retorna null se válido, ou uma mensagem de erro (string) explicando o problema.
function validateRegister({ name, email, phone, password, confirmPassword }) {
  if (!name || name.trim().length < 2) return 'Informe seu nome (mínimo 2 letras).';
  if (!email || !EMAIL_RE.test(email)) return 'Informe um e-mail válido.';
  const digits = normalizePhone(phone);
  if (!digits || digits.length < 10 || digits.length > 11) return 'Informe um telefone válido, com DDD (10 ou 11 dígitos).';
  if (!password || password.length < 6) return 'A senha deve ter no mínimo 6 caracteres.';
  if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos um número.';
  if (confirmPassword !== undefined && password !== confirmPassword) return 'As senhas não coincidem.';
  return null;
}

// O login aceita um único campo "identifier", que pode ser e-mail OU
// telefone — quem decide qual é qual é a rota (routes/auth.js), tentando
// achar o usuário primeiro pelo e-mail e, se não achar, pelo telefone.
function validateLogin({ identifier, password }) {
  if (!identifier || !identifier.trim()) return 'Informe seu e-mail ou telefone.';
  if (!password) return 'Informe sua senha.';
  return null;
}

module.exports = { validateRegister, validateLogin, EMAIL_RE, normalizePhone };

