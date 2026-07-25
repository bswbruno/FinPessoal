/* ============================================================================
   FinPessoal – server/db.js
   ============================================================================
   "Banco de dados" simples baseado em arquivo JSON (data.json), sem nenhuma
   dependência nativa/compilada — funciona igual em Windows, Mac ou Linux sem
   precisar de ferramentas de build (Python, Visual Studio Build Tools, etc.).

   Por que não SQLite/Postgres agora? Para o número de usuários que esse
   projeto terá (uso pessoal/família), um arquivo JSON é mais que suficiente
   e elimina qualquer dor de cabeça de instalação. Quando for hospedar de
   verdade (Render + Supabase, como conversamos), trocar esse arquivo por um
   cliente Postgres é uma mudança isolada — só este arquivo precisa mudar,
   as rotas em server.js continuam iguais (elas só chamam as funções daqui).
   ============================================================================ */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

// Garante que o arquivo existe antes de qualquer leitura.
function ensureDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2));
  }
}

function readDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function findUserByEmail(email) {
  const db = readDB();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function findUserByPhone(phone) {
  const db = readDB();
  return db.users.find(u => u.phone === phone) || null;
}

function findUserById(id) {
  const db = readDB();
  return db.users.find(u => u.id === id) || null;
}

function createUser({ id, name, email, phone, passwordHash, createdAt }) {
  const db = readDB();
  const user = { id, name, email: email.toLowerCase(), phone, passwordHash, createdAt };
  db.users.push(user);
  writeDB(db);
  return user;
}

module.exports = { findUserByEmail, findUserByPhone, findUserById, createUser };
