/* ============================================================================
   FinPessoal v4.9 – js/receipts.js
   ============================================================================
   Responsabilidade deste arquivo: tudo relacionado a comprovantes de
   pagamento anexados a uma despesa (módulos "A Pagar" e "Dívidas").

   FLUXO (a partir da v3.2):
   O recibo NÃO é mais escolhido na criação/edição da despesa. Ele é
   solicitado apenas no momento em que o usuário clica em "Pagar":
     1) toggleE() (js/pagar.js) ou toggleEP() (js/dividas.js) chamam
        openPayModal(id, origem, gid?) em vez de marcar como pago direto.
     2) openPayModal() abre o modal "modal-pay-confirm" com um campo de
        upload opcional.
     3) O usuário confirma em confirmPayment(), que:
          - marca a despesa como 'pago'
          - salva o recibo (se algum foi escolhido) no campo x.receipt
          - atualiza a tela de origem (A Pagar ou Dívidas)
   Depois de paga, a despesa mostra um botão 📎 na tabela, que chama
   viewReceipt(id) para reabrir o comprovante salvo.

   Armazenamento: o arquivo escolhido é convertido para uma "data URL" em
   Base64 (texto), guardada dentro do próprio objeto da despesa
   (x.receipt = { data, name, type }) e persistida via sv()/ld() (localStorage).
   Imagens são comprimidas (máx. 1000px de largura, JPEG 70%) antes de salvar
   para não estourar o limite de armazenamento do navegador. PDFs são
   guardados como estão.
   ============================================================================ */

const RECEIPT_MAX_SIZE = 8 * 1024 * 1024; // 8MB — tamanho máx. aceito do arquivo original

// Recibo escolhido dentro da modal de pagamento, antes de confirmar (ou null).
let _pendingReceipt = null;

// Guarda qual despesa está sendo paga enquanto a modal de pagamento está aberta.
// { id: '...', source: 'pagar'|'divida', gid: '...' (só quando source==='divida') }
let _payTarget = null;

/* ----------------------------------------------------------------------
   Upload + compressão de imagem (usado dentro da modal de pagamento)
------------------------------------------------------------------------ */
function handleReceiptUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > RECEIPT_MAX_SIZE) {
    notify('Arquivo muito grande (máx. 8MB)', 'err');
    event.target.value = '';
    return;
  }

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  if (!isImage && !isPdf) {
    notify('Envie uma imagem ou um PDF', 'err');
    event.target.value = '';
    return;
  }

  if (isImage) {
    compressImage(file, (dataUrl) => {
      _pendingReceipt = { data: dataUrl, name: file.name, type: 'image/jpeg' };
      renderReceiptPreview();
    });
  } else {
    const reader = new FileReader();
    reader.onload = () => {
      _pendingReceipt = { data: reader.result, name: file.name, type: file.type };
      renderReceiptPreview();
    };
    reader.readAsDataURL(file);
  }
}

// Redimensiona a imagem (máx. 1000px de largura) e reexporta como JPEG 70%.
function compressImage(file, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 1000;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Desenha a miniatura do recibo escolhido dentro da modal de pagamento.
function renderReceiptPreview() {
  const box = document.getElementById('pay-receipt-preview');
  if (!box) return;
  if (!_pendingReceipt) { box.innerHTML = ''; return; }
  const thumb = _pendingReceipt.type.startsWith('image/')
    ? `<img src="${_pendingReceipt.data}" alt="Recibo">`
    : `<div class="receipt-icon">${icon('file-text')}</div>`;
  box.innerHTML = `<div class="receipt-preview">${thumb}<span class="receipt-name">${_pendingReceipt.name}</span><button type="button" class="receipt-remove" onclick="removePendingReceipt()" title="Remover recibo">×</button></div>`;
  refreshIcons();
}
function removePendingReceipt() {
  _pendingReceipt = null;
  const input = document.getElementById('pay-receipt-input');
  if (input) input.value = '';
  renderReceiptPreview();
}

/* ----------------------------------------------------------------------
   Modal de confirmação de pagamento
------------------------------------------------------------------------ */

// Abre a modal de pagamento para a despesa `id`.
// origem: 'pagar' (tela A Pagar) ou 'divida' (parcela dentro de Dívidas).
// gid: obrigatório quando origem === 'divida', usado para reabrir a lista de parcelas.
function openPayModal(id, origem, gid) {
  const x = ST.expenses.find(e => e.id === id);
  if (!x) return;
  _payTarget = { id, source: origem, gid };
  _pendingReceipt = null;
  document.getElementById('pay-receipt-input').value = '';
  renderReceiptPreview();
  refreshAccountSelect('pay-account-select', 'Não vincular a nenhuma conta');
  const remaining = expRemaining(x);
  document.getElementById('pay-modal-desc').textContent = `${x.desc} — total ${fmt(x.value)}`;
  document.getElementById('pay-modal-remaining').textContent = isPartial(x)
    ? `Já foi pago ${fmt(x.paidAmount)} — falta ${fmt(remaining)}`
    : `Valor a pagar: ${fmt(remaining)}`;
  document.getElementById('pay-amount-input').value = remaining.toFixed(2);
  document.getElementById('pay-amount-input').max = remaining;
  openModal('modal-pay-confirm');
}

// Confirma o pagamento — total ou PARCIAL. Se o valor digitado for menor que
// o que falta, a despesa continua "pendente" (com o valor já pago
// acumulado); se cobrir o restante todo, marca como "pago". Cada pagamento
// (mesmo parcial) gera sua própria movimentação de saída, se uma conta foi
// escolhida — por isso várias movimentações podem apontar pra mesma despesa
// (uma por pagamento parcial feito).
function confirmPayment() {
  if (!_payTarget) return;
  const x = ST.expenses.find(e => e.id === _payTarget.id);
  const accountId = document.getElementById('pay-account-select').value;
  if (x) {
    const remaining = expRemaining(x);
    let payAmount = parseFloat(document.getElementById('pay-amount-input').value);
    if (isNaN(payAmount) || payAmount <= 0) { notify('Informe um valor válido pra pagar', 'err'); return; }
    if (payAmount > remaining + 0.01) payAmount = remaining; // nunca deixa pagar mais que o que falta

    x.paidAmount = Math.round(((+x.paidAmount||0) + payAmount) * 100) / 100;
    const isFull = x.paidAmount >= x.value - 0.01;
    if (isFull) { x.status = 'pago'; x.paidAmount = x.value; }

    if (_pendingReceipt) x.receipt = _pendingReceipt;
    if (accountId) addMovement({ date: x.date, desc: x.desc + (isFull?'':' (pagamento parcial)'), accountId, category: x.grp, value: payAmount, type: 'saida', linkedId: x.id });
    sv();
  }
  closeModal('modal-pay-confirm');
  if (_payTarget.source === 'divida') { showParcelas(_payTarget.gid); renderDividas(); }
  else { render(); }
  notify(x && x.status==='pago' ? 'Pagamento confirmado!' : 'Pagamento parcial registrado — falta ' + fmt(expRemaining(x)));
  _payTarget = null;
}

/* ----------------------------------------------------------------------
   Visualização do recibo já salvo (botão 📎 nas tabelas)
------------------------------------------------------------------------ */
function viewReceipt(id) {
  const x = ST.expenses.find(e => e.id === id);
  if (!x || !x.receipt) return;
  const r = x.receipt;
  const view = document.getElementById('receipt-view');
  view.innerHTML = r.type.startsWith('image/')
    ? `<img src="${r.data}" alt="Recibo" style="max-width:100%;border-radius:var(--radius-lg);display:block;margin:0 auto;">`
    : `<embed src="${r.data}" type="application/pdf" style="width:100%;height:420px;border-radius:var(--radius);border:1px solid var(--border);">`;
  const dl = document.getElementById('receipt-download-btn');
  dl.onclick = () => downloadReceipt(id);
  openModal('modal-receipt');
}
function downloadReceipt(id) {
  const x = ST.expenses.find(e => e.id === id);
  if (!x || !x.receipt) return;
  const a = document.createElement('a');
  a.href = x.receipt.data;
  a.download = x.receipt.name || 'recibo';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
