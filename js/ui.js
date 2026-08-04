/* ============================================================================
   FinPessoal v5.0 – js/ui.js
   ============================================================================
   Responsabilidade deste arquivo: apenas comportamento "de interface" que
   não depende de nenhuma regra de negócio (finanças, cartões, etc.):

     1) Tema claro/escuro (salvo no navegador e lembrado na próxima visita)
     2) Menu lateral (sidebar) em modo "gaveta" (off-canvas) para
        tablet/celular, aberto/fechado pelo botão hamburguer
     3) Ocultar/mostrar valores monetários em toda a interface

   Por que um arquivo separado?
   Assim, qualquer ajuste futuro de tema ou de menu mobile fica isolado aqui,
   sem precisar mexer em nav.js, dashboard.js, etc. — que cuidam só da lógica
   financeira do app.
   ============================================================================ */

/* ----------------------------------------------------------------------
   1) TEMA CLARO / ESCURO
   ------------------------------------------------------------------------
   Estratégia:
   - O tema ativo é guardado em localStorage na chave 'fp-theme' ('light'
     ou 'dark') para persistir entre sessões, igual ao restante dos dados
     do app (que usam a chave 'fp3').
   - Se o usuário nunca escolheu um tema, respeitamos a preferência do
     sistema operacional/navegador (prefers-color-scheme).
   - Trocar de tema é só: alterar o atributo data-theme na tag <html>.
     Todo o resto (cores) já está resolvido via variáveis CSS em style.css.
------------------------------------------------------------------------ */

const THEME_KEY = 'fp-theme';

// Lê o tema salvo, ou cai para a preferência do sistema, ou 'light'.
function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

// Aplica um tema: atualiza <html data-theme="..."> e o ícone do botão.
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
    if (typeof refreshIcons === 'function') refreshIcons();
  }
}

// Alterna entre claro e escuro e salva a escolha do usuário.
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

// Aplica o tema o quanto antes (chamado no <head> ou logo no início do body
// evitaria "flash" de tema errado; aqui chamamos na inicialização do app).
applyTheme(getPreferredTheme());

/* ----------------------------------------------------------------------
   2) MENU LATERAL EM TABLET/CELULAR (sidebar off-canvas)
   ------------------------------------------------------------------------
   Em telas largas a sidebar já aparece fixa (CSS cuida disso). Em telas
   estreitas (ver breakpoints em style.css, seção 20), a sidebar fica fora
   da tela e só aparece quando a classe "sidebar-open" é adicionada em
   .app. Um overlay escurecido é mostrado atrás dela, permitindo fechar o
   menu ao tocar fora.
------------------------------------------------------------------------ */

function openSidebar() {
  document.querySelector('.app').classList.add('sidebar-open');
  document.getElementById('sidebar-overlay').classList.add('open');
}

function closeSidebar() {
  document.querySelector('.app').classList.remove('sidebar-open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

function toggleSidebar() {
  const isOpen = document.querySelector('.app').classList.contains('sidebar-open');
  isOpen ? closeSidebar() : openSidebar();
}

// Fecha o menu automaticamente ao navegar para outra página no celular/tablet
// (chamado de dentro de goTo(), em nav.js, de forma independente/opcional:
// aqui apenas expomos a função; nav.js decide quando chamar closeSidebar()).

/* ----------------------------------------------------------------------
   3) OCULTAR / MOSTRAR VALORES
   ------------------------------------------------------------------------
   A máscara em si é feita dentro de fmt() (js/utils.js) — aqui só cuidamos
   de alternar o estado (ST.settings.hideValues), salvar, re-renderizar a
   página atual e atualizar o ícone do botão. Como fmt() é usado em
   praticamente toda exibição de dinheiro do sistema, isso já cobre
   Dashboard, Contas, Cartões, Despesas, Receitas e Patrimônio de uma vez.
------------------------------------------------------------------------ */
function toggleHideValues() {
  ST.settings.hideValues = !ST.settings.hideValues;
  sv();
  applyHideValuesIcon();
  render();
}
function applyHideValuesIcon() {
  const btn = document.getElementById('hide-values-btn');
  if (btn) {
    btn.innerHTML = `<i data-lucide="${ST.settings.hideValues ? 'eye-off' : 'eye'}"></i>`;
    btn.classList.toggle('active', ST.settings.hideValues);
    btn.setAttribute('aria-pressed', ST.settings.hideValues ? 'true' : 'false');
    btn.style.opacity = ST.settings.hideValues ? '.7' : '1';
    refreshIcons();
  }
}
/* A barra inferior do mobile agora é fixa (5 itens sempre visíveis, ver
   index.html) — não depende mais de preferências salvas nem precisa
   recalcular quais botões mostrar a cada render. */
function openQuickAddMenu(){ openModal('modal-quick-add'); }

/* ----------------------------------------------------------------------
   4) MODAL DE BOAS-VINDAS / AVISO DE PRIVACIDADE
   ------------------------------------------------------------------------
   Aparece uma vez só, na primeira vez que o app é aberto NESTE navegador
   (guardado numa chave própria do localStorage, separada de ST — assim
   "Apagar todos os dados" em Configurações não faz ela voltar a aparecer
   toda hora sem necessidade). Pensada pro cenário de portfólio: quem clicar
   no link do GitHub Pages precisa saber, logo de cara, que os dados ficam
   só no navegador dele.
------------------------------------------------------------------------ */
const WELCOME_SEEN_KEY = 'fp-welcome-seen';

function maybeShowWelcomeModal() {
  if (localStorage.getItem(WELCOME_SEEN_KEY)) return;
  openModal('modal-welcome');
}
function closeWelcomeModal() {
  localStorage.setItem(WELCOME_SEEN_KEY, '1');
  closeModal('modal-welcome');
}
