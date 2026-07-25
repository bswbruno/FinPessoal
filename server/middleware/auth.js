/* ============================================================================
   FinPessoal – server/middleware/auth.js
   ============================================================================
   Protege rotas exigindo um JWT válido no cabeçalho:
     Authorization: Bearer <token>
   Se o token for válido, anexa `req.userId` (usado pelas rotas seguintes
   para saber QUEM está fazendo a requisição). Se não, responde 401.
   ============================================================================ */

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
}

module.exports = { requireAuth };
