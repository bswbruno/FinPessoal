/* ============================================================================
   FinPessoal – server/routes/auth.js
   ============================================================================
   Rotas:
     POST /api/auth/register  → cria a conta
     POST /api/auth/login     → autentica e devolve um token
     GET  /api/auth/me        → confirma se o token ainda é válido (usado
                                 pelo front no carregamento da página, pra
                                 decidir se mostra o app ou manda pro login)
   ============================================================================ */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { validateRegister, validateLogin, normalizePhone } = require('../validators');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const TOKEN_EXPIRY = '30d'; // sessão válida por 30 dias (uso pessoal, sem necessidade de logins frequentes)

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}
function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone };
}

router.post('/register', (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body || {};

  const validationError = validateRegister({ name, email, phone, password, confirmPassword });
  if (validationError) return res.status(400).json({ error: validationError });

  const phoneDigits = normalizePhone(phone);

  if (db.findUserByEmail(email)) {
    return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
  }
  if (db.findUserByPhone(phoneDigits)) {
    return res.status(409).json({ error: 'Já existe uma conta com esse telefone.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = db.createUser({
    id: crypto.randomUUID(),
    name: name.trim(),
    email,
    phone: phoneDigits,
    passwordHash,
    createdAt: new Date().toISOString()
  });

  const token = signToken(user.id);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { identifier, password } = req.body || {};

  const validationError = validateLogin({ identifier, password });
  if (validationError) return res.status(400).json({ error: validationError });

  // Tenta achar por e-mail primeiro; se não bater com nenhum, tenta por
  // telefone (normalizando os dígitos, pra aceitar qualquer formatação).
  const trimmed = identifier.trim();
  const user = db.findUserByEmail(trimmed) || db.findUserByPhone(normalizePhone(trimmed));

  // Mensagem genérica de propósito: não revelamos se o problema foi o
  // e-mail/telefone não encontrado ou a senha errada (evita que alguém
  // descubra quais contas existem por tentativa e erro).
  const invalidMsg = 'E-mail/telefone ou senha incorretos.';
  if (!user) return res.status(401).json({ error: invalidMsg });

  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: invalidMsg });

  const token = signToken(user.id);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.findUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ user: publicUser(user) });
});

module.exports = router;
