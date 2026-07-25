
// FinPessoal v4.9 – Suporte
// Página simples e estática com os canais de contato do desenvolvedor.
// Se um dia esses dados mudarem, é só editar as constantes abaixo.

const SUPPORT_EMAIL = 'wanderley.bruno@gmail.com';
const SUPPORT_WHATSAPP = '5521980488310'; // formato internacional, sem símbolos (usado no link wa.me)
const SUPPORT_WHATSAPP_DISPLAY = '(21) 98048-8310';

function renderSuporte(){
  document.getElementById('content').innerHTML = `
    <div class="settings-card" style="max-width:480px">
      <h3>Precisa de ajuda?</h3>
      <p style="font-size:12px;color:var(--text2);margin-bottom:20px">Fale direto com quem desenvolveu o FinPessoal.</p>

      <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--border)">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${icon('mail')}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px">E-mail</div>
          <div style="font-size:13px;font-weight:600">${SUPPORT_EMAIL}</div>
        </div>
        <a href="mailto:${SUPPORT_EMAIL}" class="btn btn-primary" style="text-decoration:none;flex-shrink:0">Enviar e-mail</a>
      </div>

      <div style="display:flex;align-items:center;gap:14px;padding:14px 0;">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--green-light);color:var(--green);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${icon('message-circle')}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px">WhatsApp</div>
          <div style="font-size:13px;font-weight:600">${SUPPORT_WHATSAPP_DISPLAY}</div>
        </div>
        <a href="https://wa.me/${SUPPORT_WHATSAPP}" target="_blank" rel="noopener" class="btn btn-success" style="text-decoration:none;flex-shrink:0">Abrir WhatsApp</a>
      </div>
    </div>`;
}
