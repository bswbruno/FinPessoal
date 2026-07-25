/* ============================================================================
   FinPessoal v4.9 – js/categorias.js
   ============================================================================
   Responsabilidade deste arquivo: permitir que o usuário cadastre seus
   próprios GRUPOS (categorias de despesa, ex: "Pets", "Viagem") e STATUS
   extras (ex: "Aguardando reembolso", "Parcial"), além de gerenciar as
   listas já existentes.

   Onde isso aparece na interface:
   - Em Configurações (js/modals.js chama renderCategoriasCard()), o usuário
     vê a lista atual de grupos/status com um "×" para remover e um campo
     para adicionar um novo.
   - Os <select> de Grupo/Status nos formulários de despesa e receita
     (index.html) começam vazios e são preenchidos dinamicamente por
     refreshGroupSelect()/refreshExpStatusSelect()/refreshIncStatusSelect(),
     chamadas sempre que um modal é aberto (ver js/pagar.js e js/receber.js).

   Por que "status core" não podem ser removidos:
   'pendente', 'pago' e 'atrasado' (despesas) e 'pendente'/'recebido'
   (receitas) são usados diretamente pela lógica do app (cálculo de atraso,
   KPIs do dashboard, botão "Pagar/Receber" etc. — ver isLate() e
   toggleE()/toggleI() em utils.js/pagar.js/receber.js). Por isso o botão de
   remover fica desabilitado para eles; o usuário só apaga os que ele mesmo
   cadastrou.
   ============================================================================ */

/* ----------------------------------------------------------------------
   GRUPOS (categorias de despesa)
------------------------------------------------------------------------ */

// Adiciona um novo grupo (ignora duplicados e nomes vazios).
function addGroup(name) {
  const n = (name || '').trim();
  if (!n) return;
  if (ST.groups.some(g => g.toLowerCase() === n.toLowerCase())) { notify('Esse grupo já existe', 'err'); return; }
  ST.groups.push(n); sv(); notify('Grupo adicionado!'); renderConfig();
}

// Remove um grupo cadastrado pelo usuário (grupos já usados em despesas
// existentes continuam aparecendo normalmente nelas, só não ficam mais
// disponíveis para novos lançamentos).
function removeGroup(name) {
  ST.groups = ST.groups.filter(g => g !== name);
  sv(); notify('Grupo removido', 'err'); renderConfig();
}

// Preenche o <select> de Grupo no formulário de despesa com ST.groups atual.
function refreshGroupSelect() {
  const s = document.getElementById('exp-grp');
  if (!s) return;
  const current = s.value;
  s.innerHTML = ST.groups.map(g => `<option>${g}</option>`).join('');
  if (ST.groups.includes(current)) s.value = current;
}

/* ----------------------------------------------------------------------
   STATUS (despesas e receitas)
------------------------------------------------------------------------ */

function addExpStatus(name) {
  const n = (name || '').trim();
  if (!n) return;
  if (ST.expStatuses.some(s => s.toLowerCase() === n.toLowerCase())) { notify('Esse status já existe', 'err'); return; }
  ST.expStatuses.push(n); sv(); notify('Status adicionado!'); renderConfig();
}
function removeExpStatus(name) {
  if (CORE_EXP_STATUSES.includes(name)) return; // status principal, não pode remover
  ST.expStatuses = ST.expStatuses.filter(s => s !== name);
  sv(); notify('Status removido', 'err'); renderConfig();
}
function addIncStatus(name) {
  const n = (name || '').trim();
  if (!n) return;
  if (ST.incStatuses.some(s => s.toLowerCase() === n.toLowerCase())) { notify('Esse status já existe', 'err'); return; }
  ST.incStatuses.push(n); sv(); notify('Status adicionado!'); renderConfig();
}
function removeIncStatus(name) {
  if (CORE_INC_STATUSES.includes(name)) return; // status principal, não pode remover
  ST.incStatuses = ST.incStatuses.filter(s => s !== name);
  sv(); notify('Status removido', 'err'); renderConfig();
}

// Deixa a primeira letra maiúscula só para exibição (o valor salvo continua como digitado).
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

function refreshExpStatusSelect() {
  const s = document.getElementById('exp-status');
  if (!s) return;
  const current = s.value;
  s.innerHTML = ST.expStatuses.map(st => `<option value="${st}">${cap(st)}</option>`).join('');
  if (ST.expStatuses.includes(current)) s.value = current;
}
function refreshIncStatusSelect() {
  const s = document.getElementById('inc-status');
  if (!s) return;
  const current = s.value;
  s.innerHTML = ST.incStatuses.map(st => `<option value="${st}">${cap(st)}</option>`).join('');
  if (ST.incStatuses.includes(current)) s.value = current;
}

/* ----------------------------------------------------------------------
   Bloco de HTML exibido dentro de Configurações (chamado por js/modals.js)
------------------------------------------------------------------------ */
function renderCategoriasCard() {
  const chip = (label, onRemove, removable) => `<span class="cat-chip">${cap(label)}${removable ? `<button type="button" onclick="${onRemove}" title="Remover">×</button>` : ''}</span>`;

  const groupsHtml = ST.groups.map(g => chip(g, `removeGroup('${g.replace(/'/g,"\\'")}')`, true)).join('');
  const expStatusHtml = ST.expStatuses.map(s => chip(s, `removeExpStatus('${s}')`, !CORE_EXP_STATUSES.includes(s))).join('');
  const incStatusHtml = ST.incStatuses.map(s => chip(s, `removeIncStatus('${s}')`, !CORE_INC_STATUSES.includes(s))).join('');

  return `
  <div class="settings-card">
    <h3>Grupos de Despesa</h3>
    <div class="cat-chip-row">${groupsHtml}</div>
    <div class="cat-add-row">
      <input type="text" id="new-group-input" placeholder="Nome do novo grupo..." onkeydown="if(event.key==='Enter'){addGroup(this.value);this.value='';}">
      <button class="btn btn-primary" onclick="const i=document.getElementById('new-group-input');addGroup(i.value);i.value='';">${icon('plus')} Adicionar</button>
    </div>
  </div>
  <div class="settings-card">
    <h3>Status de Despesas (A Pagar)</h3>
    <div class="cat-chip-row">${expStatusHtml}</div>
    <div class="cat-add-row">
      <input type="text" id="new-exp-status-input" placeholder="Novo status..." onkeydown="if(event.key==='Enter'){addExpStatus(this.value);this.value='';}">
      <button class="btn btn-primary" onclick="const i=document.getElementById('new-exp-status-input');addExpStatus(i.value);i.value='';">${icon('plus')} Adicionar</button>
    </div>
  </div>
  <div class="settings-card">
    <h3>Status de Receitas (A Receber)</h3>
    <div class="cat-chip-row">${incStatusHtml}</div>
    <div class="cat-add-row">
      <input type="text" id="new-inc-status-input" placeholder="Novo status..." onkeydown="if(event.key==='Enter'){addIncStatus(this.value);this.value='';}">
      <button class="btn btn-primary" onclick="const i=document.getElementById('new-inc-status-input');addIncStatus(i.value);i.value='';">${icon('plus')} Adicionar</button>
    </div>
  </div>`;
}
