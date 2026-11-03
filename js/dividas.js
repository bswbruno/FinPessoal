// FinPessoal – Gerenciamento centralizado de dívidas
function debtRows(key) {
  const selected = ST.expenses.find(x => x.gid === key || x.id === key);
  if (!selected) return [];
  return selected.gid
    ? ST.expenses.filter(x => x.gid === selected.gid).sort((a, b) => new Date(a.date) - new Date(b.date))
    : [selected];
}

function renderDividas() {
  const groups = new Map();
  ST.expenses.filter(x => x.type === 'parcelada' || x.type === 'fixa').forEach(expense => {
    const key = expense.gid || expense.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(expense);
  });

  const sorted = [...groups.entries()].sort(([, a], [, b]) =>
    b.filter(x => x.status !== 'pago').length - a.filter(x => x.status !== 'pago').length
  );
  const pendingCount = ST.expenses.filter(x =>
    (x.type === 'parcelada' || x.type === 'fixa') && x.status !== 'pago'
  ).length;
  const pendingAmount = ST.expenses.filter(x =>
    (x.type === 'parcelada' || x.type === 'fixa') && x.status !== 'pago'
  ).reduce((sum, x) => sum + expRemaining(x), 0);

  if (!sorted.length) {
    document.getElementById('content').innerHTML =
      '<div class="empty" style="padding:80px">Nenhuma dívida cadastrada.<br>Cadastre uma despesa fixa ou parcelada em "A Pagar".</div>';
    return;
  }

  document.getElementById('content').innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <div class="kpi" style="flex:1;min-width:150px"><div class="kpi-label">Dívidas cadastradas</div><div class="kpi-value">${sorted.length}</div></div>
      <div class="kpi" style="flex:1;min-width:150px;border-left-color:var(--red)"><div class="kpi-label">Lançamentos pendentes</div><div class="kpi-value" style="color:var(--red)">${pendingCount} · ${fmt(pendingAmount)}</div></div>
    </div>
    ${sorted.map(([key, unsortedRows]) => {
      const rows = [...unsortedRows].sort((a, b) => new Date(a.date) - new Date(b.date));
      const first = rows[0];
      const paid = rows.filter(x => x.status === 'pago').length;
      const remaining = rows.filter(x => x.status !== 'pago').reduce((sum, x) => sum + expRemaining(x), 0);
      const total = rows.reduce((sum, x) => sum + (+x.value || 0), 0);
      const next = rows.find(x => x.status !== 'pago');
      const ongoing = rows.some(x => x.recurrence === 'continua');
      const complete = !ongoing && paid === rows.length;
      const card = ST.cards.find(c => c.id === first.cardId);
      const kind = first.type === 'fixa'
        ? `<span class="pill pill-info">Dívida fixa</span>`
        : `<span class="pill pill-purple">Parcelada</span>`;
      const recurrence = ongoing
        ? ' · Recorrência contínua'
        : first.recurrence === '12' || (!first.recurrence && first.type === 'fixa' && rows.length === 12)
          ? ' · Repetida por 12 meses'
          : '';
      const installmentText = first.type === 'parcelada'
        ? `${rows.length} parcelas`
        : ongoing
          ? `${rows.length} lançamentos registrados`
          : first.recurrence === '12' || (!first.recurrence && rows.length === 12)
            ? '12 meses'
            : 'Lançamento único';
      const progress = rows.length ? paid / rows.length * 100 : 0;
      const nextAction = next
        ? `<button class="btn btn-primary" style="font-size:11px;padding:5px 10px" onclick="toggleEP('${next.id}','${key}')">Pagar próxima</button>`
        : '';

      return `<div class="div-card" style="${complete ? 'opacity:.65' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px">
          <div style="min-width:0">
            <div style="font-weight:700;font-size:14px">${first.desc}</div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11px;color:var(--text2);margin-top:5px">
              ${kind}<span>${first.grp || 'Outros'} · ${installmentText}${recurrence} · ${fmt(first.value)}/mês</span>
              ${card ? `<span style="color:${card.color};font-weight:600">${card.name}</span>` : ''}
            </div>
          </div>
          <div style="text-align:right;white-space:nowrap">
            <div style="font-size:16px;font-weight:700;color:${complete ? 'var(--green)' : 'var(--red)'}">${fmt(remaining)}</div>
            <div style="font-size:10px;color:var(--text3)">${complete ? 'Quitada' : ongoing ? 'pendente nos meses registrados' : `restante de ${fmt(total)}`}</div>
          </div>
        </div>
        <div class="progress" style="margin-bottom:7px"><div class="progress-fill" style="background:${complete ? 'var(--green)' : 'var(--purple)'};width:${progress}%"></div></div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:11px;color:var(--text2)">${paid}/${rows.length} pagas${next ? ` · próxima: ${fmtD(next.date)} (${fmt(next.value)})` : ''}</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${nextAction}
            <button class="btn" style="font-size:11px;padding:4px 10px" onclick="showParcelas('${key}')">Ver lançamentos</button>
            <button class="btn-sm edit" title="Editar dívida" onclick="editE('${first.id}',${Boolean(first.gid)})">${icon('pencil')}</button>
            <button class="btn-sm del" title="Excluir dívida completa" onclick="deleteDebt('${key}')">${icon('trash-2')}</button>
          </div>
        </div>
      </div>`;
    }).join('')}
  `;
}

function showParcelas(key) {
  const rows = debtRows(key);
  if (!rows.length) return;
  const first = rows[0];
  const paid = rows.filter(x => x.status === 'pago').length;
  const remaining = rows.filter(x => x.status !== 'pago').reduce((sum, x) => sum + expRemaining(x), 0);
  const ongoing = rows.some(x => x.recurrence === 'continua');
  const groupKey = first.gid || first.id;

  document.getElementById('parc-modal-title').textContent =
    first.type === 'fixa' ? `${first.desc} – Dívida fixa` : `${first.desc} – Parcelas`;
  document.getElementById('parc-modal-body').innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <div style="flex:1;background:var(--bg3);border-radius:8px;padding:10px 12px">
        <div style="font-size:10px;color:var(--text2);text-transform:uppercase">Pagas</div>
        <div style="font-size:18px;font-weight:700;color:var(--green)">${paid}/${rows.length}</div>
      </div>
      <div style="flex:1;background:var(--bg3);border-radius:8px;padding:10px 12px">
        <div style="font-size:10px;color:var(--text2);text-transform:uppercase">Restante</div>
        <div style="font-size:18px;font-weight:700;color:var(--red)">${fmt(remaining)}</div>
      </div>
    </div>
    <div class="progress" style="margin-bottom:12px"><div class="progress-fill" style="background:var(--purple);width:${rows.length ? paid / rows.length * 100 : 0}%"></div></div>
    ${ongoing ? '<p style="font-size:11px;color:var(--text2);margin-bottom:10px">Esta dívida fixa continua sendo gerada mensalmente, sem limite de meses.</p>' : ''}
    <div class="table-wrap"><table><thead><tr><th>${first.type === 'parcelada' ? 'Parcela' : 'Lançamento'}</th><th>Vencimento</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.map(row => {
        const partial = isPartial(row);
        const state = row.status === 'pago' ? 'Pago' : partial ? 'Parcial' : isLate(row) ? 'Atrasado' : 'Pendente';
        const statusClass = row.status === 'pago' ? 'pill-pago' : partial ? 'pill-info' : isLate(row) ? 'pill-late' : 'pill-pend';
        const valueCell = partial
          ? `${fmt(row.value)}<div style="font-size:10px;font-weight:400;color:var(--text2)">pago ${fmt(row.paidAmount)} · falta ${fmt(expRemaining(row))}</div>`
          : fmt(row.value);
        const rowLabel = row.type === 'parcelada'
          ? `${row.num}/${row.totalInstallments}`
          : row.recurrence === 'continua' ? `Mês ${row.num}` : fmtD(row.date);
        const payButton = row.status === 'pago'
          ? `<button class="btn-sm marked" disabled>${icon('check')} Pago</button>`
          : `<button class="btn-sm mark" onclick="toggleEP('${row.id}','${groupKey}')">${partial ? 'Pagar restante' : 'Pagar'}</button>`;
        return `<tr><td>${rowLabel}</td><td style="color:${isLate(row) ? 'var(--red)' : 'inherit'}">${fmtD(row.date)}</td><td style="font-weight:600">${valueCell}</td><td><span class="pill ${statusClass}">${state}</span></td><td style="white-space:nowrap">${payButton} ${row.receipt ? `<button class="btn-sm receipt" onclick="viewReceipt('${row.id}')" title="Ver recibo">${icon('paperclip')}</button>` : ''}</td></tr>`;
      }).join('')}
    </tbody></table></div>`;
  openModal('modal-parcelas');
}

function toggleEP(id, key) {
  const expense = ST.expenses.find(x => x.id === id);
  if (!expense || expense.status === 'pago') return;
  openPayModal(id, 'divida', key);
}

function deleteDebt(key) {
  const rows = debtRows(key);
  if (!rows.length) return;
  const ids = new Set(rows.map(x => x.id));
  const description = rows[0].desc;
  confirm2(`Excluir a dívida "${description}" e todos os seus lançamentos relacionados?`, () => {
    ST.expenses = ST.expenses.filter(x => !ids.has(x.id));
    ST.movements = ST.movements.filter(m => !ids.has(m.linkedId));
    sv();
    closeModal('modal-parcelas');
    notify('Dívida e lançamentos relacionados removidos', 'err');
    render();
  });
}
