/* ============================================================================
   FinPessoal – server/server.js
   ============================================================================
   Servidor de autenticação (login/cadastro multiusuário) do FinPessoal.

   COMO RODAR (primeira vez):
     cd server
     npm install
     copy .env.example .env      (Windows)   |   cp .env.example .env   (Mac/Linux)
     -> abra o .env e troque JWT_SECRET por um texto aleatório qualquer
     npm start

   O servidor sobe em http://localhost:3001 por padrão. O front-end
   (index.html/login.html) já está configurado para chamar esse endereço —
   ver js/auth-client.js, constante API_BASE.
   ============================================================================ */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

// Versão do backend — usada só pra diagnóstico: se você acabou de trocar os
// arquivos do servidor mas esse número não bateu com o que eu te falei,
// significa que o processo antigo do "npm start" ainda está rodando em
// memória (o Node NÃO recarrega sozinho quando os arquivos mudam). Pare o
// terminal com Ctrl+C e rode "npm start" de novo.
const SERVER_VERSION = '3.9';

if (!process.env.JWT_SECRET) {
  console.error('\n❌ Faltou configurar o arquivo .env (variável JWT_SECRET).');
  console.error('   Copie server/.env.example para server/.env e defina um valor.\n');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS liberado para qualquer origem — está OK enquanto o app roda local
// (aberto via file:// ou http://localhost). Se um dia isso for exposto na
// internet (Render/produção), troque `origin: true` por uma lista fechada
// com o domínio real do seu front-end.
app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, version: SERVER_VERSION }));

app.listen(PORT, () => {
  console.log(`\n✅ FinPessoal server v${SERVER_VERSION} rodando em http://localhost:${PORT}`);
  console.log(`   Rotas disponíveis: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me\n`);
});
