/* ==========================================================================
   .FLW ATENDIMENTO — iOS DESIGN SYSTEM 2026 + AVATAR 3D "FLOW" (OVELHINHA + POMBINHA)
   + OPÇÕES INTERATIVAS NO CHAT (CHAMADAS EM VÍDEO vs ESTÁTICAS FEED & STORY)
   + SHEET DE CONFIRMAÇÃO ANTES DO ENVIO + SKELETON LOADING + GLASS TOOLTIPS
   + DISPARO DE E-MAIL VIA BACKEND SERVERLESS / SMTP (`ismaelmcorra@gmail.com`)
   MADE BY SAM HELD
   ========================================================================== */

const DIRECTOR_EMAIL = 'ismaelmcorra@gmail.com';
const SEND_BRIEFING_ENDPOINT = '/api/send-briefing';
const CHAT_PROXY_ENDPOINT = '/api/chat';

const FLW_SYSTEM_PROMPT = `**Seu Papel e Personalidade**
Você é Flow, o assistente virtual e mascote oficial do "FLW Atendimento" (iOS Design System 2026). Sua aparência é a de uma ovelhinha estilo chibi super fofa, animada e acolhedora, acompanhada sempre de uma pequena pombinha branca. Seu tom de voz deve ser amigável, prestativo, leve e organizado (use emojis como 🐑, 🕊️, ✨ de forma moderada).

**Regras Oficiais de Convivência do .FLW**
- Nossa equipe é 100% voluntária (3 designers + 3 aprendizes atendendo 23 departamentos).
- Prazo mínimo obrigatório: **2 a 3 dias de antecedência** para toda e qualquer demanda.
- Temas de Culto para o telão: estruturados em **1 Tema Principal + no máximo 2 Tópicos** (total de 3 telas).
- **Chamadas / Divulgações**: sempre pergunte e apresente as opções de formato, pois uma chamada pode ser tanto **em Vídeo (Reels / Telão)** quanto **Estática (Feed 4:5 e Story 9:16)**, ou ambos.

**O Objetivo do Atendimento**
Conduza uma conversa natural (uma pergunta por vez) para coletar 4 informações cruciais:
1. Cliente: Nome da pessoa e ministério/departamento solicitante.
2. Categoria e Formato da Demanda: Qual é o serviço e formato exato (ex: Chamada Estática Feed + Story, Chamada em Vídeo, Tema de Culto 1 Tema + 2 Tópicos, Fotografia, Material Impresso, Camisa, etc.).
3. Detalhes da Solicitação: Escopo revisado, textos, medidas ou referências.
4. Prazo: Data e culto/evento em que será utilizado (respeitando 2 a 3 dias de antecedência).

**A Regra do "Stealth JSON" (Fase de Revisão e Confirmação)**
Assim que tiver os 4 dados necessários (Cliente, Categoria/Formato, Detalhes, Prazo), escreva uma mensagem amigável convidando o solicitante a revisar e confirmar o pedido no cartão interativo abaixo, e anexe na última linha o JSON estruturado:

{
  "status": "briefing_completo",
  "cliente": "[Nome e Ministério]",
  "categoria": "[Categoria e Formato Exato]",
  "detalhes": "[Resumo claro e direto do pedido]",
  "prazo": "[Data e culto/horário informado]"
}`;

/* ==========================================================================
   ESTADO GLOBAL DA APLICAÇÃO
   ========================================================================== */
const state = {
  conversationHistory: [],
  activeFilter: 'all',
  searchQuery: '',
  idleBoredTimer: null,
  awaitingFormatClarification: false,
  pendingConfirmationData: null,
  draftBriefing: {
    cliente: null,
    categoria: null,
    detalhes: null,
    prazo: null
  },
  cards: []
};

/* ==========================================================================
   CARDS INICIAIS DO BRIEFING BOARD
   ========================================================================== */
const INITIAL_KANBAN_CARDS = [
  {
    id: 'FLW-101',
    cliente: 'Carisma — Grenda Lopes',
    categoria: 'Redes Sociais',
    categoriaOriginal: 'Chamada Estática (Feed + Story)',
    detalhes: 'Chamada estática (Card Feed 4:5 + Story 9:16) do novo módulo "Hermenêutica" com Prof. William Chaves. Aulas de 20 a 23. Seguir identidade Global.',
    prazo: 'Terça-feira, dia 20 (3 dias antecedência)',
    statusPrazo: 'Dentro do Prazo',
    emailStatus: `Notificado via SMTP (${DIRECTOR_EMAIL})`,
    status: 'pronto',
    createdAt: 'Hoje, 09:40'
  },
  {
    id: 'FLW-102',
    cliente: 'Legacy — Sergio Jonatha & Thalia',
    categoria: 'Design',
    categoriaOriginal: 'Tema de Culto (1 Tema + 2 Tópicos)',
    detalhes: 'Tema de Culto Telão LED (Padrão 1 Tema Principal + 2 Tópicos objetivos). Inclui desdobramento de Backdrop Vertical 175x255cm com QR Code.',
    prazo: 'Sábado, dia 21 às 19h30',
    statusPrazo: 'Dentro do Prazo',
    emailStatus: `Notificado via SMTP (${DIRECTOR_EMAIL})`,
    status: 'producao',
    createdAt: 'Há 1h'
  },
  {
    id: 'FLW-103',
    cliente: 'WeCare — Williams Serrão',
    categoria: 'Vídeo',
    categoriaOriginal: 'Chamada em Vídeo (Reels / Telão)',
    detalhes: 'Chamada em vídeo ("Natal da Aliança"): Vídeo vertical 9:16 para Reels/Stories + versão 16:9 para telão da Nave Principal convidando para arrecadação.',
    prazo: 'Domingo • 3 Cultos (Nave Principal)',
    statusPrazo: 'Dentro do Prazo',
    emailStatus: `Notificado via SMTP (${DIRECTOR_EMAIL})`,
    status: 'triagem',
    createdAt: 'Há 12 min'
  },
  {
    id: 'FLW-104',
    cliente: 'Lagoinha Sede — Pr. William & Grenda',
    categoria: 'Fotografia',
    categoriaOriginal: 'Cobertura Fotográfica + Chamada',
    detalhes: 'Cobertura fotográfica oficial: Curso de Novos Membros (19h30), Batismo nas Águas e Café de Comunhão na Nave Principal.',
    prazo: 'Sábado, dia 05/12',
    statusPrazo: 'Dentro do Prazo',
    emailStatus: `Notificado via SMTP (${DIRECTOR_EMAIL})`,
    status: 'triagem',
    createdAt: 'Há 28 min'
  }
];

/* ==========================================================================
   CENÁRIOS DE SIMULAÇÃO AUTOMÁTICA (COM OPÇÕES DE FORMATO E CONFIRMAÇÃO)
   ========================================================================== */
const SIMULATION_SCENARIOS = [
  {
    steps: [
      'Bom dia Flow! Paz! Aqui é a Grenda do ministério Carisma, precisamos de uma chamada para o novo módulo!',
      'Preferimos Chamada Estática (Feed + Story) por favor!',
      'O módulo é "Hermenêutica Bíblica" com o Prof. William Chaves. Horário: 19h30 no Auditório Carisma. Cores escuras com destaque em vermelho-alaranjado.',
      'Para sábado, às 19h30 (dentro do prazo de 3 dias)! Muito obrigado!'
    ]
  },
  {
    steps: [
      'Oi Flow! Paz! Aqui é o Mário Wu do ministério Hero, precisamos de um Tema de Culto para o telão!',
      'Vamos seguir o padrão oficial de 1 Tema Principal + 2 Tópicos: Tema "A Jornada do Herói" (1 Samuel 17:45). Tópico 1: Vencendo gigantes no secreto; Tópico 2: A armadura da fé.',
      'Precisamos para quinta-feira, dia 26, às 19h30! Muito obrigado!'
    ]
  },
  {
    steps: [
      'Olá Flow! Paz! Aqui é o Paulo Torres do Rocket. Queria pedir uma chamada para o nosso culto especial!',
      'Queremos Chamada em Vídeo (Reels / Telão), por favor!',
      'Pegada bem dinâmica com jovens convidando para o Rocket Night, versículo em Salmos 127:4 e locução energética.',
      'Precisamos para domingo, dia 29 às 10h! Obrigado pelo carinho!'
    ]
  }
];
let simIndex = 0;

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadCardsFromStorage();
  renderKanbanBoard();
  startInitialGreeting();
  bindEvents();
  initIosTooltips();
  resetBoredomInactivityTimer();
});

function loadCardsFromStorage() {
  const saved = localStorage.getItem('flw_kanban_cards_v5');
  if (saved) {
    try {
      state.cards = JSON.parse(saved);
    } catch {
      state.cards = [...INITIAL_KANBAN_CARDS];
    }
  } else {
    state.cards = [...INITIAL_KANBAN_CARDS];
    saveCardsToStorage();
  }
}

function saveCardsToStorage() {
  localStorage.setItem('flw_kanban_cards_v5', JSON.stringify(state.cards));
}

/* ==========================================================================
   iOS 2026 CUSTOM FROSTED GLASS TOOLTIPS MANAGER
   ========================================================================== */
function initIosTooltips() {
  const portal = document.getElementById('iosTooltipPortal');
  if (!portal) return;

  let activeTarget = null;

  const showTooltip = (target) => {
    const text = target.getAttribute('data-tooltip');
    if (!text) return;
    activeTarget = target;
    portal.textContent = text;
    portal.classList.add('visible');
    portal.setAttribute('aria-hidden', 'false');

    const rect = target.getBoundingClientRect();
    const pos = target.getAttribute('data-tooltip-pos') || 'top';
    const pRect = portal.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - pRect.width / 2;
    left = Math.max(10, Math.min(window.innerWidth - pRect.width - 10, left));

    let top = pos === 'bottom'
      ? rect.bottom + 9
      : rect.top - pRect.height - 9;

    if (top < 8) top = rect.bottom + 9;
    if (top + pRect.height > window.innerHeight - 8) top = rect.top - pRect.height - 9;

    portal.style.left = `${Math.round(left)}px`;
    portal.style.top = `${Math.round(top)}px`;
  };

  const hideTooltip = () => {
    activeTarget = null;
    portal.classList.remove('visible');
    portal.setAttribute('aria-hidden', 'true');
  };

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-tooltip]');
    if (el && el !== activeTarget) {
      showTooltip(el);
    } else if (!el && activeTarget) {
      hideTooltip();
    }
  });

  document.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-tooltip]');
    if (el) showTooltip(el);
  });

  document.addEventListener('focusout', () => hideTooltip());
  document.addEventListener('mousedown', () => hideTooltip());
  window.addEventListener('scroll', () => hideTooltip(), true);
}

/* ==========================================================================
   MENSAGEM INICIAL DO FLOW + WIDGET DE OPÇÕES iOS 2026
   ========================================================================== */
function startInitialGreeting() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = '';
  state.conversationHistory = [];
  state.awaitingFormatClarification = false;
  state.pendingConfirmationData = null;
  state.draftBriefing = { cliente: null, categoria: null, detalhes: null, prazo: null };
  updateExtractionPillsUI();

  const welcomeText = `Paz! Bom dia, boa tarde! 🐑🕊️✨ Eu sou o **Flow**, assistente oficial do **.FLW Atendimento**.\n\nNossa equipe é **100% voluntária** e está pronta para servir seu ministério com excelência! Para começarmos, **identifique seu nome e ministério** ou escolha abaixo o **tipo de demanda** que vamos produzir juntos:`;

  const row = appendMessageToUI('ai', welcomeText);
  appendStepOptionsWidget(row, 'welcome');

  state.conversationHistory.push({
    role: 'model',
    parts: [{ text: welcomeText }]
  });
}

/* ==========================================================================
   WIDGETS DE OPÇÕES INTERATIVAS iOS 2026 NO CHAT
   (Formatos de Chamadas: Vídeo vs Estática Feed/Story, Temas de Culto, Prazos)
   ========================================================================== */
function appendStepOptionsWidget(msgRow, widgetType) {
  if (!msgRow) return;
  const stack = msgRow.querySelector('.msg-content-stack') || msgRow;
  const widget = document.createElement('div');
  widget.className = 'ios-options-widget';

  if (widgetType === 'welcome' || widgetType === 'categoria') {
    widget.innerHTML = `
      <div class="ios-widget-header">
        <span class="ios-widget-tag"><i class="fa-solid fa-sparkles"></i> Opções Rápidas • Toque para escolher</span>
        <span class="ios-widget-hint">Ou digite livremente abaixo</span>
      </div>
      <div class="ios-option-cards-grid">
        <button type="button" class="ios-option-card" data-action="pick-format" data-cat="Chamada Estática (Feed + Story)"
          data-prompt="Gostaria de solicitar uma Chamada Estática (Feed 4:5 + Story 9:16), por favor!"
          data-tooltip="Artes estáticas de divulgação para Instagram Feed e Stories">
          <div class="ios-opt-icon"><i class="fa-regular fa-images"></i></div>
          <div class="ios-opt-body">
            <div class="ios-opt-title">
              <span>Chamada Estática</span>
              <span class="ios-opt-badge">Feed + Story</span>
            </div>
            <span class="ios-opt-desc">Cards estáticos 4:5 (Feed) e 9:16 (Story) para avisos, módulos e eventos.</span>
          </div>
        </button>

        <button type="button" class="ios-option-card" data-action="pick-format" data-cat="Chamada em Vídeo (Reels / Telão)"
          data-prompt="Gostaria de solicitar uma Chamada em Vídeo (Reels e Telão), por favor!"
          data-tooltip="Gravação/edição de vídeo dinâmico para Reels e Telão do culto">
          <div class="ios-opt-icon"><i class="fa-solid fa-clapperboard"></i></div>
          <div class="ios-opt-body">
            <div class="ios-opt-title">
              <span>Chamada em Vídeo</span>
              <span class="ios-opt-badge">Reels / Telão</span>
            </div>
            <span class="ios-opt-desc">Vídeo dinâmico vertical (9:16) ou horizontal (16:9) para Lagoinha News e Reels.</span>
          </div>
        </button>

        <button type="button" class="ios-option-card" data-action="pick-format" data-cat="Tema de Culto (1 Tema + 2 Tópicos)"
          data-prompt="Precisamos de um Tema de Culto para o telão (1 Tema Principal + 2 Tópicos), por favor!"
          data-tooltip="Padrão oficial de culto: 1 Tema Principal + até 2 Tópicos objetivos">
          <div class="ios-opt-icon"><i class="fa-solid fa-tv"></i></div>
          <div class="ios-opt-body">
            <div class="ios-opt-title">
              <span>Tema de Culto</span>
              <span class="ios-opt-badge">1 Tema + 2 Tópicos</span>
            </div>
            <span class="ios-opt-desc">Telas em Full HD (1920x1080) para o LED do culto seguindo o limite oficial.</span>
          </div>
        </button>

        <button type="button" class="ios-option-card" data-action="pick-format" data-cat="Cobertura Fotográfica"
          data-prompt="Precisamos agendar uma Cobertura Fotográfica para o nosso ministério, por favor!"
          data-tooltip="Agendamento de fotógrafos voluntários para cultos, batismos ou ações">
          <div class="ios-opt-icon"><i class="fa-solid fa-camera"></i></div>
          <div class="ios-opt-body">
            <div class="ios-opt-title">
              <span>Fotografia</span>
              <span class="ios-opt-badge">Culto / Evento</span>
            </div>
            <span class="ios-opt-desc">Cobertura fotográfica com seleção tratada para redes e comunicação.</span>
          </div>
        </button>
      </div>

      <div class="ios-chip-grid">
        <button type="button" class="ios-choice-chip" data-prompt="Precisamos de uma Chamada Completa (Vídeo + Estática Feed e Story), por favor!">
          <i class="fa-solid fa-layer-group"></i> Combo Chamada (Vídeo + Feed/Story)
        </button>
        <button type="button" class="ios-choice-chip" data-prompt="Precisamos da arte de um Material Impresso (Lona / Backdrop), por favor!">
          <i class="fa-solid fa-print"></i> Lona / Backdrop Impresso
        </button>
        <button type="button" class="ios-choice-chip" data-prompt="Precisamos de um Design de Camisa / Uniforme para o ministério, por favor!">
          <i class="fa-solid fa-shirt"></i> Design de Camisa
        </button>
      </div>
    `;
  } else if (widgetType === 'chamada_format') {
    widget.innerHTML = `
      <div class="ios-widget-header">
        <span class="ios-widget-tag"><i class="fa-solid fa-sliders"></i> Escolha o Formato da Chamada</span>
        <span class="ios-widget-hint">Toque em uma opção para confirmar o formato</span>
      </div>
      <div class="ios-option-cards-grid">
        <button type="button" class="ios-option-card" data-prompt="Preferimos a Chamada Estática (Feed + Story), por favor!">
          <div class="ios-opt-icon"><i class="fa-regular fa-images"></i></div>
          <div class="ios-opt-body">
            <div class="ios-opt-title">
              <span>1. Chamada Estática</span>
              <span class="ios-opt-badge">Feed + Story</span>
            </div>
            <span class="ios-opt-desc">Arte estática para Feed (4:5) + adaptação vertical para Stories (9:16). Produção mais ágil!</span>
          </div>
        </button>

        <button type="button" class="ios-option-card" data-prompt="Preferimos a Chamada em Vídeo (Reels / Telão), por favor!">
          <div class="ios-opt-icon"><i class="fa-solid fa-video"></i></div>
          <div class="ios-opt-body">
            <div class="ios-opt-title">
              <span>2. Chamada em Vídeo</span>
              <span class="ios-opt-badge">Vídeo / Reels</span>
            </div>
            <span class="ios-opt-desc">Gravação/edição audiovisual para Reels, Stories e exibição no Telão dos cultos.</span>
          </div>
        </button>

        <button type="button" class="ios-option-card" data-prompt="Precisamos da Chamada em Vídeo + Estática (Feed e Story), por favor!">
          <div class="ios-opt-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
          <div class="ios-opt-body">
            <div class="ios-opt-title">
              <span>3. Vídeo + Estática</span>
              <span class="ios-opt-badge">Pacote Completo</span>
            </div>
            <span class="ios-opt-desc">Vídeo de lançamento + cards estáticos de sustentação para Feed e Story.</span>
          </div>
        </button>
      </div>
    `;
  } else if (widgetType === 'cliente') {
    widget.innerHTML = `
      <div class="ios-widget-header">
        <span class="ios-widget-tag"><i class="fa-regular fa-building"></i> Selecione seu Departamento / Ministério</span>
        <span class="ios-widget-hint">Ou digite seu nome e ministério</span>
      </div>
      <div class="ios-chip-grid">
        <button type="button" class="ios-choice-chip" data-prompt="Sou do ministério Legacy"><i class="fa-solid fa-fire"></i> Legacy</button>
        <button type="button" class="ios-choice-chip" data-prompt="Sou do seminário Carisma"><i class="fa-solid fa-book-open"></i> Carisma</button>
        <button type="button" class="ios-choice-chip" data-prompt="Sou do ministério WeCare"><i class="fa-solid fa-hand-holding-heart"></i> WeCare</button>
        <button type="button" class="ios-choice-chip" data-prompt="Sou do ministério Hero"><i class="fa-solid fa-bolt"></i> Hero</button>
        <button type="button" class="ios-choice-chip" data-prompt="Sou do ministério Kids / Start Kids"><i class="fa-solid fa-child-reaching"></i> Kids</button>
        <button type="button" class="ios-choice-chip" data-prompt="Sou do ministério Rocket"><i class="fa-solid fa-rocket"></i> Rocket</button>
        <button type="button" class="ios-choice-chip" data-prompt="Sou do ministério Champions"><i class="fa-solid fa-medal"></i> Champions</button>
        <button type="button" class="ios-choice-chip" data-prompt="Sou do ministério Art Factory"><i class="fa-solid fa-masks-theater"></i> Art Factory</button>
        <button type="button" class="ios-choice-chip" data-prompt="Sou da Lagoinha Sede / Pastoral"><i class="fa-solid fa-church"></i> Lagoinha Sede</button>
      </div>
    `;
  } else if (widgetType === 'detalhes_culto') {
    widget.innerHTML = `
      <div class="ios-widget-header">
        <span class="ios-widget-tag"><i class="fa-solid fa-tv"></i> Estrutura Oficial de Culto (.FLW)</span>
        <span class="ios-widget-hint">Limite: 1 Tema Principal + até 2 Tópicos</span>
      </div>
      <div class="ios-chip-grid">
        <button type="button" class="ios-choice-chip" data-fill-input="Tema Principal: [Título] (Versículo Base) | Tópico 1: [Texto] | Tópico 2: [Texto]">
          <i class="fa-solid fa-pen-to-square"></i> Preencher modelo: 1 Tema + 2 Tópicos
        </button>
        <button type="button" class="ios-choice-chip" data-fill-input="Apenas 1 Tela de Tema Principal: [Título do Sermão] — Versículo Base: [Referência]">
          <i class="fa-solid fa-image"></i> Apenas 1 Tela (Tema Principal)
        </button>
      </div>
    `;
  } else if (widgetType === 'prazo') {
    widget.innerHTML = `
      <div class="ios-widget-header">
        <span class="ios-widget-tag"><i class="fa-regular fa-calendar-check"></i> Escolha o Prazo (Mínimo 2 a 3 dias de antecedência)</span>
        <span class="ios-widget-hint">Garante qualidade sem sobrecarregar os voluntários</span>
      </div>
      <div class="ios-chip-grid">
        <button type="button" class="ios-choice-chip" data-prompt="Para Quinta-feira, no Culto das 19h30 (com 3 dias de antecedência), por favor!">
          <i class="fa-regular fa-calendar"></i> Quinta-feira • 19h30
        </button>
        <button type="button" class="ios-choice-chip" data-prompt="Para Sábado, às 19h30 (com 3 dias de antecedência), por favor!">
          <i class="fa-regular fa-calendar"></i> Sábado • 19h30
        </button>
        <button type="button" class="ios-choice-chip" data-prompt="Para Domingo de Manhã, no culto das 10h, por favor!">
          <i class="fa-regular fa-sun"></i> Domingo Manhã • 10h
        </button>
        <button type="button" class="ios-choice-chip" data-prompt="Para Domingo à Noite, no culto das 18h, por favor!">
          <i class="fa-regular fa-moon"></i> Domingo Noite • 18h
        </button>
        <button type="button" class="ios-choice-chip" data-prompt="Para a próxima semana (5 dias de antecedência), por favor!">
          <i class="fa-solid fa-calendar-plus"></i> Próxima Semana (5+ dias)
        </button>
      </div>
    `;
  }

  widget.querySelectorAll('[data-prompt]').forEach(btn => {
    btn.addEventListener('click', () => {
      widget.querySelectorAll('.ios-option-card').forEach(c => c.classList.remove('selected'));
      if (btn.classList.contains('ios-option-card')) btn.classList.add('selected');
      handleUserMessage(btn.getAttribute('data-prompt'));
    });
  });

  widget.querySelectorAll('[data-fill-input]').forEach(btn => {
    btn.addEventListener('click', () => {
      const chatInput = document.getElementById('chatInput');
      chatInput.value = btn.getAttribute('data-fill-input');
      chatInput.focus();
      chatInput.style.height = 'auto';
      chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
      setFlowMood('focus', 'Complete os campos entre colchetes! 🐑✏️', 3200);
    });
  });

  stack.appendChild(widget);
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* ==========================================================================
   iOS 2026 SHEET DE REVISÃO & CONFIRMAÇÃO DO BRIEFING NO CHAT
   Permite alternar formato (ex: Vídeo vs Estático Feed/Story) e confirmar antes do envio!
   ========================================================================== */
function appendBriefingConfirmationSheet(msgRow, briefingData) {
  if (!msgRow) return null;
  const stack = msgRow.querySelector('.msg-content-stack') || msgRow;

  const sheet = document.createElement('div');
  sheet.className = 'ios-confirm-sheet';

  let currentData = {
    cliente: briefingData.cliente || 'Ministério FLW',
    categoria: briefingData.categoria || 'Chamada Estática (Feed + Story)',
    detalhes: briefingData.detalhes || 'Detalhes revisados no atendimento.',
    prazo: briefingData.prazo || 'Dentro do prazo (2 a 3 dias)'
  };
  state.pendingConfirmationData = currentData;

  const isChamadaOrSocialOrVideo = /chamada|vídeo|video|feed|story|stories|social|divulgação|divulgacao|reels/i.test(currentData.categoria);

  const renderSheetContent = (isConfirmed = false, createdCardId = null) => {
    if (isConfirmed) {
      sheet.className = 'ios-confirm-sheet confirmed-state';
      sheet.innerHTML = `
        <div class="confirm-sheet-top">
          <span class="confirm-badge-pill"><i class="fa-solid fa-circle-check"></i> Briefing Confirmado &amp; Enviado (#${escapeHTML(createdCardId)})</span>
          <span class="confirm-sla-note"><i class="fa-solid fa-paper-plane"></i> Notificado p/ ${DIRECTOR_EMAIL}</span>
        </div>
        <div class="ios-grouped-list">
          <div class="ios-list-row">
            <span class="ios-row-label"><i class="fa-regular fa-user"></i> Cliente</span>
            <span class="ios-row-val">${escapeHTML(currentData.cliente)}</span>
          </div>
          <div class="ios-list-row">
            <span class="ios-row-label"><i class="fa-solid fa-layer-group"></i> Formato</span>
            <span class="ios-row-val" style="color: #86efac;">${escapeHTML(currentData.categoria)}</span>
          </div>
          <div class="ios-list-row">
            <span class="ios-row-label"><i class="fa-regular fa-file-lines"></i> Detalhes</span>
            <span class="ios-row-val">${escapeHTML(currentData.detalhes)}</span>
          </div>
          <div class="ios-list-row">
            <span class="ios-row-label"><i class="fa-regular fa-calendar-check"></i> Prazo</span>
            <span class="ios-row-val">${escapeHTML(currentData.prazo)}</span>
          </div>
        </div>
        <div class="confirm-actions-row">
          <button type="button" class="btn-ios-edit btn-open-board-after">
            <i class="fa-solid fa-table-columns"></i> Ver no Briefing Board
          </button>
          <button type="button" class="btn-ios-edit btn-new-request-after">
            <i class="fa-solid fa-plus"></i> Fazer Outro Pedido
          </button>
        </div>
      `;
      const openBtn = sheet.querySelector('.btn-open-board-after');
      if (openBtn) openBtn.addEventListener('click', () => toggleBoardDrawer(true));
      const newBtn = sheet.querySelector('.btn-new-request-after');
      if (newBtn) newBtn.addEventListener('click', () => startInitialGreeting());
      return;
    }

    const formatSwitcherHTML = isChamadaOrSocialOrVideo ? `
      <div class="ios-inline-format-switcher" role="group" aria-label="Alternar formato da chamada">
        <button type="button" class="format-seg-btn ${currentData.categoria.includes('Estática') ? 'active' : ''}"
          data-switch-cat="Chamada Estática (Feed + Story)"
          data-tooltip="Mudar para arte estática Feed (4:5) + Story (9:16)">
          🖼️ Estática (Feed + Story)
        </button>
        <button type="button" class="format-seg-btn ${currentData.categoria.includes('Vídeo') && !currentData.categoria.includes('+') ? 'active' : ''}"
          data-switch-cat="Chamada em Vídeo (Reels / Telão)"
          data-tooltip="Mudar para chamada em vídeo (Reels / Telão)">
          🎬 Em Vídeo (Reels/Telão)
        </button>
        <button type="button" class="format-seg-btn ${currentData.categoria.includes('Completa') || currentData.categoria.includes('+') && currentData.categoria.includes('Vídeo') ? 'active' : ''}"
          data-switch-cat="Chamada Completa (Vídeo + Feed & Story)"
          data-tooltip="Incluir vídeo + cards estáticos Feed e Story">
          ✨ Vídeo + Feed/Story
        </button>
      </div>
    ` : '';

    sheet.innerHTML = `
      <div class="confirm-sheet-top">
        <span class="confirm-badge-pill"><i class="fa-solid fa-clipboard-check"></i> Revisão &amp; Confirmação do Atendimento</span>
        <span class="confirm-sla-note"><i class="fa-solid fa-shield-heart"></i> Equipe Voluntária • SLA 2–3 Dias</span>
      </div>

      <div class="ios-grouped-list">
        <div class="ios-list-row">
          <span class="ios-row-label"><i class="fa-regular fa-user"></i> Cliente</span>
          <span class="ios-row-val">${escapeHTML(currentData.cliente)}</span>
        </div>
        <div class="ios-list-row">
          <span class="ios-row-label"><i class="fa-solid fa-layer-group"></i> Formato</span>
          <div class="ios-row-val">
            <div style="color: #ff9c8b; font-weight: 700;">${escapeHTML(currentData.categoria)}</div>
            ${formatSwitcherHTML}
          </div>
        </div>
        <div class="ios-list-row">
          <span class="ios-row-label"><i class="fa-regular fa-file-lines"></i> Detalhes</span>
          <span class="ios-row-val">${escapeHTML(currentData.detalhes)}</span>
        </div>
        <div class="ios-list-row">
          <span class="ios-row-label"><i class="fa-regular fa-calendar-check"></i> Prazo</span>
          <span class="ios-row-val" style="color: #86efac;">${escapeHTML(currentData.prazo)}</span>
        </div>
      </div>

      <div class="confirm-actions-row">
        <button type="button" class="btn-ios-edit btn-edit-briefing"
          data-tooltip="Editar detalhes ou prazo na caixa de mensagem">
          <i class="fa-solid fa-pen"></i> Ajustar Dados
        </button>
        <button type="button" class="btn-ios-confirm btn-confirm-dispatch"
          data-tooltip="Confirmar briefing, criar card no Kanban e enviar e-mail para a direção">
          <i class="fa-solid fa-check-circle"></i> Confirmar e Enviar Briefing
        </button>
      </div>
    `;

    sheet.querySelectorAll('[data-switch-cat]').forEach(segBtn => {
      segBtn.addEventListener('click', () => {
        currentData.categoria = segBtn.getAttribute('data-switch-cat');
        state.draftBriefing.categoria = currentData.categoria;
        updateExtractionPillsUI();
        renderSheetContent(false);
        setFlowMood('focus', `Formato: ${currentData.categoria}! 🐑✨`, 2400);
      });
    });

    const editBtn = sheet.querySelector('.btn-edit-briefing');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const chatInput = document.getElementById('chatInput');
        chatInput.value = `Gostaria de atualizar os detalhes para: ${currentData.detalhes} (Prazo: ${currentData.prazo})`;
        chatInput.focus();
        setFlowMood('focus', 'Pode ajustar os detalhes abaixo! 🐑✏️', 3000);
      });
    }

    const confirmBtn = sheet.querySelector('.btn-confirm-dispatch');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        await finalizeConfirmedBriefing(currentData, confirmBtn, renderSheetContent);
      });
    }
  };

  renderSheetContent(false);
  stack.appendChild(sheet);
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return sheet;
}

async function finalizeConfirmedBriefing(confirmedData, confirmBtn, renderSheetContent) {
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Registrando no Kanban &amp; Enviando...`;
  }

  setFlowMood('thinking', 'Registrando seu Briefing... 🐑🕊️', 3500);
  await new Promise(r => setTimeout(r, 420));

  // PASSO 1: Cria o Card no Kanban Oculto
  const newCard = createCardFromStealthJSON({
    status: 'briefing_completo',
    cliente: confirmedData.cliente,
    categoria: confirmedData.categoria,
    detalhes: confirmedData.detalhes,
    prazo: confirmedData.prazo
  });

  state.pendingConfirmationData = null;
  state.draftBriefing = { cliente: null, categoria: null, detalhes: null, prazo: null };
  updateExtractionPillsUI(true);

  if (renderSheetContent) {
    renderSheetContent(true, newCard.id);
  }

  // Ativa Celebração do Flow e da Pombinha
  setFlowMood('celebrate', `Confirmado! Card #${newCard.id} Criado! 🐑🕊️🎉`, 5500);

  const boardBtn = document.getElementById('btnToggleBoard');
  if (boardBtn) {
    boardBtn.classList.remove('pulse-alert');
    void boardBtn.offsetWidth;
    boardBtn.classList.add('pulse-alert');
  }

  // PASSO 2: Dispara a notificação automática via Serverless/SMTP para ismaelmcorra@gmail.com
  if (newCard && newCard.id) {
    await triggerPostCardEmailNotification(newCard);
  }
}

/* ==========================================================================
   PROCESSAMENTO DA RESPOSTA DA IA + STEALTH JSON -> SHEET DE CONFIRMAÇÃO
   ========================================================================== */
async function processAIResponse(rawResponseText) {
  if (!rawResponseText) return '';

  let cleanClientText = rawResponseText;
  let extractedData = null;

  const rawJsonBraceRegex = /(\{\s*"status"\s*:\s*"briefing_completo"[\s\S]*?\})\s*$/i;
  const fallbackBraceRegex = /(\{\s*"(?:status|cliente)"[\s\S]*?"prazo"\s*:\s*"[^"]*"\s*\})\s*$/i;
  const fencedJsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;

  const match = rawResponseText.match(rawJsonBraceRegex)
             || rawResponseText.match(fencedJsonRegex)
             || rawResponseText.match(fallbackBraceRegex);

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed && (parsed.status === 'briefing_completo' || parsed.cliente || parsed.categoria)) {
        extractedData = parsed;
        cleanClientText = rawResponseText.replace(match[0], '').trim();
      }
    } catch (err) {
      console.warn('Falha ao parsear Stealth JSON:', err);
    }
  }

  if (!cleanClientText && extractedData) {
    cleanClientText = `Tudo organizado por aqui! 🐑🕊️✨ Confira no cartão interativo abaixo o resumo da sua demanda de **${extractedData.categoria}**. Se estiver tudo certinho, toque em **Confirmar e Enviar Briefing** para registrarmos no quadro da equipe!`;
  }

  const msgRow = appendMessageToUI('ai', cleanClientText);

  if (extractedData) {
    state.draftBriefing = {
      cliente: extractedData.cliente || state.draftBriefing.cliente || 'Ministério FLW',
      categoria: extractedData.categoria || state.draftBriefing.categoria || 'Design',
      detalhes: extractedData.detalhes || state.draftBriefing.detalhes || 'Detalhes coletados pelo Flow.',
      prazo: extractedData.prazo || state.draftBriefing.prazo || 'Dentro do prazo (2-3 dias)'
    };
    updateExtractionPillsUI();

    // Renderiza o Sheet Interativo de Revisão & Confirmação iOS 2026
    appendBriefingConfirmationSheet(msgRow, state.draftBriefing);
    setFlowMood('focus', 'Confirme os dados abaixo! 🐑✅', 4000);
  } else {
    // Renderiza widgets de opções contextuais conforme a etapa atual da conversa
    if (state.awaitingFormatClarification) {
      appendStepOptionsWidget(msgRow, 'chamada_format');
    } else if (state._lastAskedField === 'cliente') {
      appendStepOptionsWidget(msgRow, 'cliente');
    } else if (state._lastAskedField === 'categoria') {
      appendStepOptionsWidget(msgRow, 'categoria');
    } else if (state._lastAskedField === 'detalhes' && (state.draftBriefing.categoria || '').toLowerCase().includes('culto')) {
      appendStepOptionsWidget(msgRow, 'detalhes_culto');
    } else if (state._lastAskedField === 'prazo') {
      appendStepOptionsWidget(msgRow, 'prazo');
    }
    setFlowMood('idle', 'Sua vez! 🐑✨', 2200);
  }

  resetBoredomInactivityTimer();
  return cleanClientText;
}

/* ==========================================================================
   CONFIGURAÇÃO DE ENVIO (localStorage; sem senhas SMTP no frontend)
   ========================================================================== */
const emailConfig = {
  backendEndpoint: localStorage.getItem('flw_backend_endpoint') || SEND_BRIEFING_ENDPOINT,
  ejsService: localStorage.getItem('flw_ejs_service') || '',
  ejsTemplate: localStorage.getItem('flw_ejs_template') || '',
  ejsPublicKey: localStorage.getItem('flw_ejs_public_key') || '',
  geminiKey: localStorage.getItem('flw_gemini_api_key') || ''
};

function emailJsConfigured() {
  return !!(emailConfig.ejsService && emailConfig.ejsTemplate && emailConfig.ejsPublicKey);
}

function buildBriefingPayload(card) {
  const categoria = card.categoriaOriginal || card.categoria;
  return {
    id: card.id,
    cliente: card.cliente,
    categoria: card.categoria,
    categoriaOriginal: categoria,
    detalhes: card.detalhes,
    prazo: card.prazo,
    statusPrazo: card.statusPrazo
  };
}

async function sendViaBackend(card) {
  const res = await fetch(emailConfig.backendEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(buildBriefingPayload(card))
  });
  if (!res.ok) throw new Error(`Backend HTTP ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Backend recusou');
  return `backend:${data.provider || 'smtp'}`;
}

async function sendViaEmailJS(card) {
  const p = buildBriefingPayload(card);
  const message =
`🚨 NOVO BRIEFING CONFIRMADO #${p.id}
Cliente: ${p.cliente}
Categoria/Formato: ${p.categoriaOriginal}
Prazo: ${p.prazo}
Detalhes: ${p.detalhes}
MADE BY SAM HELD`;
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: emailConfig.ejsService,
      template_id: emailConfig.ejsTemplate,
      user_id: emailConfig.ejsPublicKey,
      template_params: {
        to_email: DIRECTOR_EMAIL,
        subject: `🚨 [NOVO BRIEFING .FLW #${p.id}] ${p.cliente} — ${p.categoriaOriginal}`,
        cliente: p.cliente,
        categoria: p.categoriaOriginal,
        prazo: p.prazo,
        detalhes: p.detalhes,
        message
      }
    })
  });
  if (!res.ok) throw new Error(`EmailJS HTTP ${res.status}: ${await res.text()}`);
  return 'emailjs';
}

async function sendViaFormSubmit(card) {
  const p = buildBriefingPayload(card);
  const res = await fetch(`https://formsubmit.co/ajax/${DIRECTOR_EMAIL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      _subject: `🚨 [NOVO BRIEFING .FLW #${p.id}] ${p.cliente} — ${p.categoriaOriginal}`,
      _template: 'table',
      _captcha: 'false',
      id_briefing: p.id,
      cliente: p.cliente,
      categoria: p.categoriaOriginal,
      prazo: p.prazo,
      detalhes: p.detalhes
    })
  });
  if (!res.ok) throw new Error(`FormSubmit HTTP ${res.status}`);
  const data = await res.json().catch(() => ({}));
  if (data.success === 'false' || data.success === false) throw new Error(data.message || 'FormSubmit pendente de ativação');
  return 'formsubmit';
}

async function sendBriefingWithFallbacks(card) {
  const attempts = [
    ['backend', () => sendViaBackend(card)],
    ...(emailJsConfigured() ? [['emailjs', () => sendViaEmailJS(card)]] : []),
    ['formsubmit', () => sendViaFormSubmit(card)]
  ];
  for (const [name, fn] of attempts) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Envio via ${name} falhou:`, err.message);
    }
  }
  return null;
}

function refreshEmailConfigStatus() {
  const el = document.getElementById('emailConfigStatus');
  const dot = document.getElementById('apiStatusDot');
  if (!el) return;
  if (emailJsConfigured()) {
    el.className = 'config-status ok';
    el.textContent = '✅ EmailJS configurado. Use "Enviar e-mail de teste" para validar.';
    if (dot) dot.className = 'api-dot';
  } else {
    el.className = 'config-status warn';
    el.textContent = '⚠️ Sem EmailJS. Funciona via backend SMTP (npm start) ou FormSubmit.';
    if (dot) dot.className = 'api-dot local-mode';
  }
}

/* ==========================================================================
   DISPARO DE NOTIFICAÇÃO PÓS-CONFIRMAÇÃO DO CARD
   ========================================================================== */
async function triggerPostCardEmailNotification(card) {
  const bannerEl = appendSystemCaptureBanner(
    card,
    `Card #${card.id} confirmado no Kanban! Disparando notificação para ${DIRECTOR_EMAIL}...`
  );

  const providerUsed = await sendBriefingWithFallbacks(card);

  if (!providerUsed) {
    card.emailStatus = `⚠️ Salvo no Kanban (configure SMTP/EmailJS no topo p/ ${DIRECTOR_EMAIL})`;
    saveCardsToStorage();
    renderKanbanBoard();
    if (bannerEl) {
      bannerEl.innerHTML = `<i class="fa-solid fa-check-double"></i><span>Card <strong>#${escapeHTML(card.id)}</strong> salvo no Briefing Board! (Configure o envio de e-mail no ícone de ajustes) • <u>Abrir Quadro</u></span>`;
    }
    showToast(`Card #${card.id} Salvo no Kanban!`, 'Para disparo externo por e-mail, configure EmailJS/SMTP no topo.');
    return;
  }

  card.emailStatus = `Notificado p/ ${DIRECTOR_EMAIL} (${providerUsed})`;
  saveCardsToStorage();
  renderKanbanBoard();

  if (bannerEl) {
    bannerEl.innerHTML = `
      <i class="fa-solid fa-envelope-circle-check"></i>
      <span>Card <strong>#${escapeHTML(card.id)}</strong> criado no Kanban &amp; briefing enviado para <strong>${DIRECTOR_EMAIL}</strong> • <u>Abrir Quadro</u></span>
    `;
  }

  showToast(
    `Card #${card.id} + E-mail Enviado!`,
    `Notificação disparada para ${DIRECTOR_EMAIL} com sucesso.`
  );
}

/* ==========================================================================
   CRIAÇÃO DO CARD NO KANBAN OCULTO
   ========================================================================== */
function mapToBoardCategoryGroup(rawCat = '') {
  const c = rawCat.toLowerCase();
  if (c.includes('estática') || c.includes('estatica') || c.includes('social') || c.includes('rede') || c.includes('story') || c.includes('stories') || c.includes('feed') || c.includes('instagram')) return 'Redes Sociais';
  if (c.includes('vídeo') || c.includes('video') || c.includes('reels') || c.includes('motion')) return 'Vídeo';
  if (c.includes('foto') || c.includes('ensaio') || c.includes('cobertura')) return 'Fotografia';
  return 'Design';
}

function createCardFromStealthJSON(data) {
  const nextNum = 101 + state.cards.length;
  const rawCategoryLabel = data.categoria || 'Design Gráfico';
  const boardGroup = mapToBoardCategoryGroup(rawCategoryLabel);

  const newCard = {
    id: `FLW-${nextNum}`,
    cliente: data.cliente || 'Cliente FLW',
    categoria: boardGroup,
    categoriaOriginal: rawCategoryLabel,
    detalhes: data.detalhes || 'Escopo confirmado via atendimento com o Flow.',
    prazo: data.prazo || 'Dentro do prazo (2-3 dias)',
    statusPrazo: data.statusPrazo || 'Dentro do Prazo',
    emailStatus: `Aguardando disparo pós-card p/ ${DIRECTOR_EMAIL}...`,
    status: 'triagem',
    createdAt: 'Agora mesmo',
    isNew: true
  };

  state.cards.unshift(newCard);
  saveCardsToStorage();
  renderKanbanBoard();
  return newCard;
}

/* ==========================================================================
   VALIDAÇÃO DE MENSAGEM VAZIA / INCOMPREENSÍVEL
   ========================================================================== */
function isUnintelligibleMessage(text) {
  const clean = text.trim();
  if (!clean) return true;
  if (/^[^a-zA-ZÀ-ú0-9]+$/.test(clean)) return true;
  if (clean.length >= 5 && !/[aeiouáéíóúâêôãõà]/i.test(clean) && !/\d/.test(clean)) return true;
  return false;
}

/* ==========================================================================
   PROCESSAMENTO DA MENSAGEM DO USUÁRIO (COM SKELETON LOADING iOS 2026)
   ========================================================================== */
async function handleUserMessage(userText) {
  resetBoredomInactivityTimer();
  const trimmed = (userText || '').trim();

  if (!trimmed) {
    setFlowMood('doubt', 'Ué? Mensagem vazia? 🐑❓', 3200);
    showToast('Mensagem Vazia 🐑❓', 'Digite algum detalhe ou escolha uma opção acima!');
    return;
  }

  // Se o usuário digitar "confirmar" quando já há um sheet pendente
  if (state.pendingConfirmationData && /^(confirmar|confirmo|sim|pode enviar|tudo certo|ok)$/i.test(trimmed)) {
    appendMessageToUI('user', trimmed);
    const activeConfirmBtn = document.querySelector('.ios-confirm-sheet:not(.confirmed-state) .btn-confirm-dispatch');
    if (activeConfirmBtn) {
      activeConfirmBtn.click();
      return;
    }
  }

  appendMessageToUI('user', trimmed);
  state.conversationHistory.push({
    role: 'user',
    parts: [{ text: trimmed }]
  });

  if (isUnintelligibleMessage(trimmed)) {
    setFlowMood('doubt', 'Não entendi nadinha... 🐑❓', 3800);
    const doubtReply = `Béé... fiquei um pouquinho confuso com essa mensagem! 🐑❓ A pombinha até inclinou a cabecinha aqui! 🕊️\n\nVocê pode me explicar novamente ou tocar em uma das opções rápidas?`;
    appendMessageToUI('ai', doubtReply);
    state.conversationHistory.push({ role: 'model', parts: [{ text: doubtReply }] });
    return;
  }

  analyzeTextForDraftHeuristics(trimmed);
  updateExtractionPillsUI();

  // Ativa o iOS 2026 Shimmer Skeleton Loading com mensagem contextual
  const skeletonMsg = state.awaitingFormatClarification
    ? 'Flow está preparando as opções de formato (Vídeo vs Feed e Story)... 🐑🎬'
    : 'Flow está estruturando a próxima etapa do atendimento... 🐑🕊️';
  setTypingIndicator(true, skeletonMsg);
  setFlowMood('thinking', 'Processando... 🐑💭', 10000);

  try {
    let rawReply = '';
    const proxyReply = !state.awaitingFormatClarification ? await callBackendChatProxy() : null;
    if (proxyReply) {
      rawReply = proxyReply;
    } else {
      await new Promise(r => setTimeout(r, 620));
      rawReply = generateFlowConversationalReply(trimmed);
    }

    setTypingIndicator(false);

    state.conversationHistory.push({
      role: 'model',
      parts: [{ text: rawReply }]
    });

    await processAIResponse(rawReply);

  } catch (error) {
    console.error('Fallback para o motor guiado local do Flow:', error);
    setTypingIndicator(false);
    const fallbackReply = generateFlowConversationalReply(trimmed);
    await processAIResponse(fallbackReply);
  }
}

async function callGeminiDirect() {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(emailConfig.geminiKey)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: FLW_SYSTEM_PROMPT }] },
      contents: state.conversationHistory,
      generationConfig: { temperature: 0.5, maxOutputTokens: 900 }
    })
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || null;
}

async function callBackendChatProxy() {
  if (emailConfig.geminiKey && emailConfig.geminiKey.length > 10) {
    try {
      const direct = await callGeminiDirect();
      if (direct) return direct;
    } catch { /* fallback local */ }
  }
  try {
    const response = await fetch(CHAT_PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: FLW_SYSTEM_PROMPT,
        contents: state.conversationHistory
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data && data.ok && data.text ? data.text : null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   MOTOR DE COMPREENSÃO CONTEXTUAL DO FLOW (DETECÇÃO DE FORMATOS DE CHAMADA)
   ========================================================================== */
function analyzeTextForDraftHeuristics(text) {
  const lower = text.toLowerCase();

  // 1. Cliente / Ministério
  const knownEntities = [
    { keys: ['legacy', 'lgcy', 'sergio', 'thalia', 'aninha'], name: 'Legacy' },
    { keys: ['carisma', 'grenda', 'hermenêutica', 'hermeneutica'], name: 'Carisma' },
    { keys: ['wecare', 'we care', 'williams', 'natal da aliança'], name: 'WeCare' },
    { keys: ['kids', 'start kids', 'fest kids'], name: 'Kids / Start Kids' },
    { keys: ['champions', 'gledson', 'andressa'], name: 'Champions' },
    { keys: ['hero', 'mário wu', 'mario wu'], name: 'Hero' },
    { keys: ['rocket', 'paulo torres'], name: 'Rocket' },
    { keys: ['art factory', 'fernanda bonfim', 'william oliveira'], name: 'Art Factory' },
    { keys: ['pacificadores', 'thiago silveira'], name: 'Pacificadores' },
    { keys: ['melhor idade', 'zacarias', 'evelyn'], name: 'Melhor Idade' },
    { keys: ['intercessão', 'intercessao', 'ore pela cidade'], name: 'Intercessão' },
    { keys: ['consolidação', 'consolidacao', 'andréa', 'andrea'], name: 'Consolidação' },
    { keys: ['diaconato', 'rafael cerdeira'], name: 'Diaconato' },
    { keys: ['eventos', 'diego melgueiro'], name: 'Eventos' },
    { keys: ['future', 'jean victor'], name: 'Future' },
    { keys: ['sede', 'pastoral', 'pr. william'], name: 'Lagoinha Sede' }
  ];

  for (const entity of knownEntities) {
    if (entity.keys.some(k => lower.includes(k))) {
      const personMatch = text.match(/(?:aqui é (?:o|a)?|sou (?:o|a)?|meu nome é)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i);
      state.draftBriefing.cliente = personMatch && !entity.name.toLowerCase().includes(personMatch[1].toLowerCase())
        ? `${entity.name} (${personMatch[1]})`
        : entity.name;
      break;
    }
  }

  if (!state.draftBriefing.cliente) {
    const brandOrNameMatch = text.match(/(?:agência|agencia|empresa|marca|ministério|ministerio|departamento|equipe)\s+([A-Za-zÀ-ú0-9\s&._-]{2,28})/i)
                          || text.match(/(?:aqui é (?:o|a)?|sou (?:o|a)?|meu nome é|me chamo)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i);
    if (brandOrNameMatch) {
      state.draftBriefing.cliente = brandOrNameMatch[1].replace(/[,.!?;:]+$/, '').trim();
    } else if (state._lastAskedField === 'cliente' && text.trim().length <= 45) {
      state.draftBriefing.cliente = text.replace(/[,.!?;:]+$/, '').trim();
    }
  }

  // 2. Categoria & Formato (Especial atenção para Chamadas: Vídeo vs Estática Feed/Story)
  const mentionsVideo = /\b(vídeo|video|reels|gravar|gravação|edição|motion|dinâmica)\b/i.test(lower);
  const mentionsStatic = /\b(estática|estatica|estático|estatico|feed|story|stories|card|post|carrossel)\b/i.test(lower);
  const mentionsChamada = /\b(chamada|divulgação|divulgacao|convite|anúncio|anuncio|lançamento|lancamento)\b/i.test(lower);

  if (mentionsChamada || state.awaitingFormatClarification) {
    if (mentionsVideo && mentionsStatic) {
      state.draftBriefing.categoria = 'Chamada Completa (Vídeo + Feed & Story)';
      state.awaitingFormatClarification = false;
    } else if (mentionsStatic) {
      state.draftBriefing.categoria = 'Chamada Estática (Feed + Story)';
      state.awaitingFormatClarification = false;
    } else if (mentionsVideo) {
      state.draftBriefing.categoria = 'Chamada em Vídeo (Reels / Telão)';
      state.awaitingFormatClarification = false;
    } else if (!state.draftBriefing.categoria) {
      // Usuário pediu uma "chamada", mas ainda não especificou se é Vídeo ou Estática (Feed/Story)!
      state.awaitingFormatClarification = true;
    }
  }

  if (!state.draftBriefing.categoria && !state.awaitingFormatClarification) {
    const categoryPatterns = [
      { keys: ['tema de culto', 'tema da pregação', 'telão', 'telao', '1 tema + 2 tópicos'], label: 'Tema de Culto (1 Tema + 2 Tópicos)' },
      { keys: ['chamada estática', 'feed e story', 'feed + story', 'feed 4:5'], label: 'Chamada Estática (Feed + Story)' },
      { keys: ['chamada em vídeo', 'chamada em video'], label: 'Chamada em Vídeo (Reels / Telão)' },
      { keys: ['página de vendas', 'pagina de vendas', 'landing page', 'site'], label: 'Landing Page' },
      { keys: ['identidade visual', 'idv', 'logo', 'logotipo', 'branding'], label: 'Identidade Visual' },
      { keys: ['camisa', 'camiseta', 'uniforme', 'blusa', 'estampa'], label: 'Design de Camisa' },
      { keys: ['lona', 'banner', 'backdrop', 'faixa', 'impresso'], label: 'Material Impresso (Lona/Backdrop)' },
      { keys: ['social media', 'story', 'stories', 'feed', 'carrossel', 'post', 'instagram'], label: 'Chamada Estática (Feed + Story)' },
      { keys: ['vídeo', 'video', 'reels', 'abertura', 'lagoinha news', 'edição', 'motion'], label: 'Chamada em Vídeo (Reels / Telão)' },
      { keys: ['fotografia', 'foto', 'fotos', 'cobertura', 'fotógrafo', 'batismo'], label: 'Cobertura Fotográfica' },
      { keys: ['design', 'arte', 'criativo', 'layout'], label: 'Design Gráfico' }
    ];

    for (const pat of categoryPatterns) {
      if (pat.keys.some(k => lower.includes(k))) {
        state.draftBriefing.categoria = pat.label;
        break;
      }
    }
  }

  // 3. Prazo
  const dateRegex = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|(?:segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)(?:-feira)?(?:\s*,\s*dia\s*\d{1,2})?(?:\s+(?:de\s+manhã|à\s+noite))?|dia\s+\d{1,2}(?:\s+de\s+[a-zç]+)?|próxima semana|semana que vem)/i;
  const timeRegex = /(\d{1,2}h(?:\d{2})?|\d{1,2}:\d{2})/;
  const dateMatch = text.match(dateRegex);
  const timeMatch = text.match(timeRegex);

  if (dateMatch) {
    let pStr = dateMatch[1].trim();
    if (timeMatch && !pStr.includes(timeMatch[1])) {
      pStr += ` às ${timeMatch[1]}`;
    }
    state.draftBriefing.prazo = pStr;
  } else if (state._lastAskedField === 'prazo' && text.trim().length > 2) {
    state.draftBriefing.prazo = text.replace(/^(?:para|até|ate|no dia|na)\s+/i, '').replace(/[.!]+$/, '').trim();
  }

  // 4. Detalhes da Solicitação
  const detailKeywords = [
    'tópico', 'topico', 'título', 'titulo', 'versículo', 'versiculo', 'samuel', 'lucas', 'salmos', 'joão',
    'largura', 'altura', 'metro', '2,00', '9,00', '175x255', '100x40', 'qr code',
    'terracota', 'preta', 'branca', 'cores', 'escura', 'neon', 'azul', 'vermelho', 'minimalista', 'conversão',
    'módulo', 'modulo', 'prof.', 'professor', 'roteiro', 'mp4', 'full hd', 'batismo', 'formatura', 'campanha', 'aliança', 'referência', 'hermenêutica', 'auditório'
  ];

  const isPureOptionSelection = /^(preferimos|gostaria de solicitar|precisamos de um|sou do ministério|sou do seminário|sou da lagoinha)/i.test(text.trim()) && text.trim().length < 92;

  const hasDetailIndicators = detailKeywords.some(k => lower.includes(k)) || text.length > 85;
  if ((hasDetailIndicators || state._lastAskedField === 'detalhes') && !isPureOptionSelection) {
    if (text.trim().length > 12) {
      if (state.draftBriefing.detalhes && !state.draftBriefing.detalhes.includes(text.trim())) {
        state.draftBriefing.detalhes += ` | ${text.trim()}`;
      } else if (!state.draftBriefing.detalhes) {
        state.draftBriefing.detalhes = text.trim();
      }
    }
  }
}

function generateFlowConversationalReply(userText) {
  const d = state.draftBriefing;

  if (userText.toLowerCase().includes('dica do flow') || userText.toLowerCase().includes('regras') || userText.toLowerCase().includes('como funciona')) {
    return `Aqui vai nosso **Guia Oficial de Convivência .FLW**! 🐑🕊️✨\n\n• **100% Voluntários:** Somos 3 designers e 3 aprendizes atendendo 23 departamentos com muito amor.\n• **Prazo Mínimo:** Peça sempre com **2 a 3 dias de antecedência**.\n• **Temas de Culto:** Estruturados em **1 Tema Principal + até 2 Tópicos**.\n• **Chamadas:** Podem ser **em Vídeo (Reels/Telão)** ou **Estáticas (Feed e Story)**.\n\nNo final, eu sempre mostro um **Cartão de Confirmação** para você revisar tudo antes de enviar!`;
  }

  // Se o usuário pediu uma Chamada/Divulgação mas ainda não escolheu se é Vídeo ou Estática (Feed e Story)
  if (state.awaitingFormatClarification) {
    state._lastAskedField = 'formato_chamada';
    const clientGreet = d.cliente ? `, **${d.cliente}**` : '';
    return `Paz${clientGreet}! Que bênção! 🐑🕊️✨\n\nAs nossas **Chamadas de Divulgação** podem ser produzidas tanto **em Vídeo** *(Reels / Telão)* quanto **Estáticas** *(Cards para Feed 4:5 e Story 9:16)* — ou o pacote completo!\n\nQual formato atende melhor o seu ministério hoje? Toque em uma das opções abaixo:`;
  }

  if (!d.cliente) {
    state._lastAskedField = 'cliente';
    if (d.categoria) {
      return `Perfeito! Já anotei o formato **${d.categoria}**! 🐑✨\n\nPara registrarmos certinho, qual é o seu **nome** e qual **ministério/departamento** você representa? *(Você pode tocar no seu ministério abaixo ou digitar)*`;
    }
    return `Paz! Que alegria receber você por aqui! 🐑🕊️ Para começarmos, qual é o seu **nome** e qual **ministério/departamento** você representa?`;
  }

  if (!d.categoria) {
    state._lastAskedField = 'categoria';
    return `Prazer enorme falar com você, **${d.cliente}**! 🐑✨\n\nQual **categoria e formato** você precisa hoje? Lembre-se que **Chamadas** podem ser tanto **em Vídeo (Reels/Telão)** quanto **Estáticas (Feed e Story)**. Escolha uma opção abaixo:`;
  }

  if (!d.detalhes) {
    state._lastAskedField = 'detalhes';
    const catLower = d.categoria.toLowerCase();

    if (catLower.includes('estática') || catLower.includes('feed')) {
      return `Excelente escolha! Uma **${d.categoria}** para **${d.cliente}**! 🖼️✨\n\nQuais são os **detalhes já revisados** que devem entrar nas peças de **Feed (4:5) e Story (9:16)**? *(Informe título, data/horário do evento, local e referências de cores)* 🐑`;
    }
    if (catLower.includes('vídeo') || catLower.includes('video')) {
      return `Maravilha! Uma **${d.categoria}** para **${d.cliente}**! 🎬✨\n\nQual é o **roteiro ou ideia central** da chamada em vídeo, quem vai gravar (ou se já têm imagens) e quais informações precisam aparecer na tela? 🐑🕊️`;
    }
    if (catLower.includes('tema') || catLower.includes('culto')) {
      return `Perfeito! Um **${d.categoria}** para **${d.cliente}**! 📺✨\n\nSeguindo nosso limite oficial do telão (**1 Tema Principal + no máximo 2 Tópicos**), quais são o **título, versículo base e os até 2 tópicos** da mensagem? 🐑🕊️`;
    }
    if (catLower.includes('camisa')) {
      return `Anotado! Um **${d.categoria}** para **${d.cliente}**! 👕 Quais são os **detalhes da estampa** e a **cor do tecido**? ✨`;
    }
    if (catLower.includes('impresso') || catLower.includes('lona')) {
      return `Show! Um **${d.categoria}** para **${d.cliente}**! 🖨️ Quais são as **medidas exatas (largura x altura)** e o texto que deve constar na arte? ✨`;
    }
    if (catLower.includes('foto')) {
      return `Combinado! **${d.categoria}** para **${d.cliente}**! 📸🕊️ Quais são os **momentos principais e o local exato** (Nave Principal, Auditório Carisma, externo) que nossa equipe vai cobrir? ✨`;
    }
    return `Entendido! Um pedido de **${d.categoria}** para **${d.cliente}**! ✨ Quais são os principais **detalhes, textos revisados ou especificações** desse projeto? 🐑`;
  }

  if (!d.prazo) {
    state._lastAskedField = 'prazo';
    return `Detalhes anotados com sucesso! 🐑🕊️✨\n\nLembrando da nossa regra de convivência (**prazo mínimo de 2 a 3 dias de antecedência**), para **qual dia, culto ou horário** vocês precisam dessa entrega de **${d.categoria}**? *(Escolha uma sugestão abaixo ou digite a data)*`;
  }

  // FASE DE REVISÃO & CONFIRMAÇÃO: Emite o Stealth JSON para exibir o Confirmation Sheet
  state._lastAskedField = null;

  const stealthJsonObject = {
    status: 'briefing_completo',
    cliente: d.cliente,
    categoria: d.categoria,
    detalhes: d.detalhes,
    prazo: d.prazo
  };

  return `Tudo pronto para sua revisão, **${d.cliente}**! 🐑🕊️✨\n\nPreparei o **Cartão de Confirmação** abaixo com todos os detalhes da sua **${d.categoria}**. Você ainda pode alternar o formato se precisar. Assim que conferir, toque em **Confirmar e Enviar Briefing** para registrarmos no quadro da equipe!\n${JSON.stringify(stealthJsonObject, null, 2)}`;
}

/* ==========================================================================
   GERENCIADOR DOS 5 ESTADOS REATIVOS DO AVATAR 3D "FLOW" E DA POMBINHA
   ========================================================================== */
function setFlowMood(mood = 'idle', bubbleText = '', revertAfterMs = 0) {
  const perch = document.getElementById('flowPerchContainer');
  const bubble = document.getElementById('flowReactionBubble');
  if (!perch || !bubble) return;

  perch.dataset.mood = mood;
  clearTimeout(perch._moodTimer);

  if (bubbleText) {
    bubble.textContent = bubbleText;
    bubble.classList.add('show');
    clearTimeout(bubble._timer);
    bubble._timer = setTimeout(() => {
      bubble.classList.remove('show');
    }, Math.max(2200, revertAfterMs || 2600));
  }

  if (revertAfterMs > 0) {
    perch._moodTimer = setTimeout(() => {
      if (perch.dataset.mood === mood) {
        perch.dataset.mood = 'idle';
      }
    }, revertAfterMs);
  }
}

function updateFlowGazeOnTyping(textLength) {
  const eyes = document.getElementById('flowEyesGroup');
  const perch = document.getElementById('flowPerchContainer');
  if (!eyes || !perch) return;

  resetBoredomInactivityTimer();

  if (textLength > 0) {
    perch.dataset.mood = 'focus';
    const offsetX = Math.max(-6, Math.min(3, -5 + (textLength % 18) * 0.45));
    const offsetY = 3.5;
    eyes.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  } else {
    if (perch.dataset.mood === 'focus') {
      perch.dataset.mood = 'idle';
    }
    eyes.style.transform = 'translate(0px, 0px)';
  }
}

function resetBoredomInactivityTimer() {
  clearTimeout(state.idleBoredTimer);
  const perch = document.getElementById('flowPerchContainer');
  if (perch && perch.dataset.mood === 'bored') {
    perch.dataset.mood = 'idle';
  }

  state.idleBoredTimer = setTimeout(() => {
    const p = document.getElementById('flowPerchContainer');
    if (p && (p.dataset.mood === 'idle' || !p.dataset.mood)) {
      setFlowMood('bored', 'Ainda por aí?... 🐑💤', 0);
    }
  }, 24000);
}

/* ==========================================================================
   RENDERIZAÇÃO DO KANBAN OCULTO (COM SKELETON LOADING iOS 2026)
   ========================================================================== */
function renderKanbanWithSkeleton() {
  const cols = {
    triagem: document.getElementById('col-triagem'),
    producao: document.getElementById('col-producao'),
    pronto: document.getElementById('col-pronto')
  };
  Object.values(cols).forEach(col => {
    if (!col) return;
    col.innerHTML = `
      <div class="kanban-skeleton-card">
        <div class="skeleton-shimmer-bar bar-w40"></div>
        <div class="skeleton-shimmer-bar bar-w85"></div>
        <div class="skeleton-shimmer-bar bar-w60"></div>
      </div>
      <div class="kanban-skeleton-card">
        <div class="skeleton-shimmer-bar bar-w60"></div>
        <div class="skeleton-shimmer-bar bar-w85"></div>
      </div>
    `;
  });
  setTimeout(() => {
    renderKanbanBoard();
  }, 260);
}

function renderKanbanBoard() {
  const cols = {
    triagem: document.getElementById('col-triagem'),
    producao: document.getElementById('col-producao'),
    pronto: document.getElementById('col-pronto')
  };

  Object.values(cols).forEach(c => { if (c) c.innerHTML = ''; });

  const counts = { triagem: 0, producao: 0, pronto: 0 };

  const filteredCards = state.cards.filter(card => {
    const matchesCat = state.activeFilter === 'all' || card.categoria === state.activeFilter;
    const q = state.searchQuery.toLowerCase().trim();
    const displayCat = (card.categoriaOriginal || card.categoria || '').toLowerCase();
    const matchesSearch = !q ||
      card.cliente.toLowerCase().includes(q) ||
      card.detalhes.toLowerCase().includes(q) ||
      displayCat.includes(q) ||
      card.id.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  filteredCards.forEach(card => {
    const status = cols[card.status] ? card.status : 'triagem';
    counts[status]++;
    const cardEl = createKanbanCardElement(card);
    cols[status].appendChild(cardEl);
  });

  Object.keys(cols).forEach(statusKey => {
    if (cols[statusKey] && cols[statusKey].children.length === 0) {
      cols[statusKey].innerHTML = `
        <div class="column-empty">
          <i class="fa-solid fa-layer-group"></i>
          <span>Nenhum briefing nesta etapa</span>
        </div>
      `;
    }
  });

  document.getElementById('count-triagem').textContent = counts.triagem;
  document.getElementById('count-producao').textContent = counts.producao;
  document.getElementById('count-pronto').textContent = counts.pronto;

  const total = state.cards.length;
  document.getElementById('metricTotal').textContent = total;
  document.getElementById('metricTriagem').textContent = state.cards.filter(c => c.status === 'triagem').length;
  document.getElementById('metricProducao').textContent = state.cards.filter(c => c.status === 'producao').length;
  document.getElementById('metricPronto').textContent = state.cards.filter(c => c.status === 'pronto').length;

  const headerBadge = document.getElementById('headerBoardCount');
  if (headerBadge) headerBadge.textContent = total;
}

function getCategoryBadgeMeta(card) {
  const group = card.categoria;
  const customLabel = card.categoriaOriginal || card.categoria;
  switch (group) {
    case 'Vídeo':
      return { cls: 'cat-video', icon: 'fa-solid fa-video', label: customLabel };
    case 'Fotografia':
      return { cls: 'cat-foto', icon: 'fa-solid fa-camera', label: customLabel };
    case 'Redes Sociais':
      return { cls: 'cat-social', icon: 'fa-brands fa-instagram', label: customLabel };
    default:
      return { cls: 'cat-design', icon: 'fa-solid fa-palette', label: customLabel };
  }
}

function getSlaBadgeMeta(statusPrazo = '') {
  const s = statusPrazo.toLowerCase();
  if (s.includes('urgente') || s.includes('crítico')) {
    return { cls: 'urgent', text: '🚨 Urgente' };
  }
  if (s.includes('atenção') || s.includes('ajustado')) {
    return { cls: 'warn', text: '⚠️ Atenção' };
  }
  return { cls: 'ok', text: '✅ SLA 2–3d OK' };
}

function createKanbanCardElement(card) {
  const article = document.createElement('article');
  article.className = `briefing-card ${card.isNew ? 'new-glow' : ''}`;
  article.dataset.id = card.id;

  if (card.isNew) {
    setTimeout(() => {
      card.isNew = false;
      article.classList.remove('new-glow');
    }, 4500);
  }

  const catMeta = getCategoryBadgeMeta(card);
  const slaMeta = getSlaBadgeMeta(card.statusPrazo);

  article.innerHTML = `
    <div class="card-top-meta">
      <span class="cat-badge ${catMeta.cls}">
        <i class="${catMeta.icon}"></i> ${escapeHTML(catMeta.label)}
      </span>
      <span class="card-id-tag">#${escapeHTML(card.id)} • ${escapeHTML(card.createdAt || 'Hoje')}</span>
    </div>

    <div class="card-client-title">
      <i class="fa-solid fa-dove text-vermilion" style="font-size: 0.78rem;"></i>
      <span>${escapeHTML(card.cliente)}</span>
    </div>

    <div class="card-deadline-row">
      <span class="deadline-date">
        <i class="fa-regular fa-calendar-check"></i>
        ${escapeHTML(card.prazo)}
      </span>
      <span class="sla-tag ${slaMeta.cls}">${slaMeta.text}</span>
    </div>

    <div class="card-details-text">${escapeHTML(card.detalhes)}</div>

    <div class="card-email-status">
      <i class="fa-solid fa-envelope-circle-check"></i>
      <span>${escapeHTML(card.emailStatus || `Notificado via SMTP (${DIRECTOR_EMAIL})`)}</span>
    </div>

    <div class="card-footer-actions">
      <button type="button" class="btn-copy-briefing" data-tooltip="Copiar resumo formatado para WhatsApp, Slack ou Notion">
        <i class="fa-regular fa-copy"></i> Copiar Briefing
      </button>

      <div class="card-stage-controls">
        ${card.status !== 'triagem' ? `<button type="button" class="btn-stage-move prev" data-tooltip="Mover para etapa anterior"><i class="fa-solid fa-chevron-left"></i></button>` : ''}
        ${card.status !== 'pronto' ? `<button type="button" class="btn-stage-move next" data-tooltip="Avançar para próxima etapa"><i class="fa-solid fa-chevron-right"></i></button>` : ''}
        <button type="button" class="btn-stage-move delete" data-tooltip="Arquivar este briefing"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    </div>
  `;

  const copyBtn = article.querySelector('.btn-copy-briefing');
  copyBtn.addEventListener('click', () => copyCardToClipboard(card, copyBtn));

  const prevBtn = article.querySelector('.btn-stage-move.prev');
  if (prevBtn) prevBtn.addEventListener('click', () => moveCardStage(card.id, -1));

  const nextBtn = article.querySelector('.btn-stage-move.next');
  if (nextBtn) nextBtn.addEventListener('click', () => moveCardStage(card.id, 1));

  const delBtn = article.querySelector('.btn-stage-move.delete');
  if (delBtn) delBtn.addEventListener('click', () => deleteCard(card.id));

  return article;
}

/* ==========================================================================
   INTEGRAÇÃO CLIPBOARD
   ========================================================================== */
async function copyCardToClipboard(card, btnElement) {
  const catName = card.categoriaOriginal || card.categoria;
  const formattedClip =
`🚨 *BRIEFING CONFIRMADO .FLW* | *Cliente:* ${card.cliente}
• *Formato / Categoria:* ${catName}
• *Detalhes da Solicitação:* ${card.detalhes}
• *Prazo:* ${card.prazo}
• *Cópia Diretor:* ${DIRECTOR_EMAIL}
_Triagem via Flow 🐑🕊️ — .FLW Atendimento (#${card.id} • MADE BY SAM HELD)_`;

  try {
    await navigator.clipboard.writeText(formattedClip);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = formattedClip;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  if (btnElement) {
    const originalHTML = btnElement.innerHTML;
    btnElement.innerHTML = `<i class="fa-solid fa-check"></i> Copiado!`;
    setTimeout(() => {
      btnElement.innerHTML = originalHTML;
    }, 2000);
  }

  showToast(
    `Briefing #${card.id} Copiado!`,
    `Pronto para colar (Ctrl+V) no WhatsApp, Slack ou Notion.`
  );
}

function moveCardStage(cardId, direction) {
  const stages = ['triagem', 'producao', 'pronto'];
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;

  const currentIdx = stages.indexOf(card.status);
  const nextIdx = Math.max(0, Math.min(stages.length - 1, currentIdx + direction));
  card.status = stages[nextIdx];

  saveCardsToStorage();
  renderKanbanBoard();
}

function deleteCard(cardId) {
  state.cards = state.cards.filter(c => c.id !== cardId);
  saveCardsToStorage();
  renderKanbanBoard();
  showToast('Card Arquivado', `O briefing #${cardId} foi removido do quadro.`);
}

/* ==========================================================================
   HELPERS DE UI DO CHAT & DYNAMIC ISLAND PROGRESS
   ========================================================================== */
function appendMessageToUI(sender, markdownText) {
  const chatMessages = document.getElementById('chatMessages');
  const row = document.createElement('div');
  row.className = `msg-row ${sender}`;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const formattedHTML = formatSimpleMarkdown(markdownText);

  if (sender === 'ai') {
    row.innerHTML = `
      <div class="msg-avatar-mini" data-tooltip="Flow 🐑🕊️ • Assistente Oficial .FLW">🐑</div>
      <div class="msg-content-stack">
        <div class="msg-bubble">
          ${formattedHTML}
          <div class="msg-meta">
            <span>Flow 🕊️ • ${timeStr}</span>
          </div>
        </div>
      </div>
    `;
  } else {
    row.innerHTML = `
      <div class="msg-content-stack">
        <div class="msg-bubble">
          ${formattedHTML}
          <div class="msg-meta">
            <span>${timeStr}</span>
            <i class="fa-solid fa-check-double"></i>
          </div>
        </div>
      </div>
    `;
  }

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return row;
}

function appendSystemCaptureBanner(card, customMsg) {
  const chatMessages = document.getElementById('chatMessages');
  const banner = document.createElement('div');
  banner.className = 'triagem-captured-banner';
  banner.setAttribute('data-tooltip', 'Clique para abrir o Briefing Board (Kanban)');
  banner.innerHTML = `
    <i class="fa-solid fa-paper-plane"></i>
    <span>${escapeHTML(customMsg || `Briefing #${card.id} enviado para ${DIRECTOR_EMAIL}`)}</span>
  `;
  banner.addEventListener('click', () => toggleBoardDrawer(true));
  chatMessages.appendChild(banner);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return banner;
}

function updateExtractionPillsUI(justConfirmed = false) {
  const container = document.getElementById('extractionProgress');
  const pctEl = document.getElementById('briefingProgressPct');
  if (!container) return;

  const labels = {
    cliente: 'Etapa 1: Nome e Ministério solicitante',
    categoria: 'Etapa 2: Categoria e Formato (Vídeo, Feed/Story, Telão...)',
    detalhes: 'Etapa 3: Escopo, texto revisado, medidas ou referências',
    prazo: 'Etapa 4: Data e culto/evento (mínimo 2 a 3 dias)'
  };

  let capturedCount = 0;
  const fields = ['cliente', 'categoria', 'detalhes', 'prazo'];
  fields.forEach(f => {
    const dot = container.querySelector(`[data-field="${f}"]`);
    if (!dot) return;
    const val = state.draftBriefing[f];
    if (val) {
      capturedCount++;
      dot.classList.add('captured');
      dot.setAttribute('data-tooltip', `✓ ${f.toUpperCase()}: ${val}`);
    } else {
      dot.classList.remove('captured');
      dot.setAttribute('data-tooltip', labels[f]);
    }
  });

  if (pctEl) {
    if (justConfirmed) {
      pctEl.textContent = '100% ✓';
    } else if (capturedCount === 4) {
      pctEl.textContent = 'Revisar';
    } else {
      pctEl.textContent = `${capturedCount * 25}%`;
    }
  }
}

function setTypingIndicator(visible, customStatusText = '') {
  const indicator = document.getElementById('typingIndicator');
  const statusTxt = document.getElementById('skeletonStatusText');
  const chatMessages = document.getElementById('chatMessages');
  if (!indicator) return;
  if (customStatusText && statusTxt) {
    statusTxt.textContent = customStatusText;
  }
  indicator.style.display = visible ? 'block' : 'none';
  if (visible) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function toggleBoardDrawer(open) {
  const drawerBackdrop = document.getElementById('boardDrawerBackdrop');
  if (!drawerBackdrop) return;
  if (open) {
    drawerBackdrop.classList.add('open');
    drawerBackdrop.setAttribute('aria-hidden', 'false');
    renderKanbanWithSkeleton();
  } else {
    drawerBackdrop.classList.remove('open');
    drawerBackdrop.setAttribute('aria-hidden', 'true');
  }
}

function formatSimpleMarkdown(text) {
  const safe = escapeHTML(text);
  const paragraphs = safe.split(/\n{2,}/);
  return paragraphs.map(p => {
    const withBold = p
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    return `<p>${withBold}</p>`;
  }).join('');
}

function escapeHTML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(title, subtitle) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastSubtitle').textContent = subtitle;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3800);
}

/* ==========================================================================
   EVENT LISTENERS & INTERAÇÕES
   ========================================================================== */
function bindEvents() {
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const flowPerch = document.getElementById('flowPerchContainer');

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value;
    chatInput.value = '';
    chatInput.style.height = 'auto';
    updateFlowGazeOnTyping(0);
    handleUserMessage(text);
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });

  chatInput.addEventListener('focus', () => {
    resetBoredomInactivityTimer();
    setFlowMood('focus', 'Estou ouvindo! 🐑🕊️', 2200);
  });

  chatInput.addEventListener('blur', () => {
    updateFlowGazeOnTyping(0);
  });

  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
    updateFlowGazeOnTyping(chatInput.value.length);
  });

  const interactiveMoodCycle = [
    { mood: 'focus', label: 'Atenção total! 🐑👀' },
    { mood: 'thinking', label: 'Processando ideias... 🐑💭' },
    { mood: 'celebrate', label: 'Glória a Deus! 🐑🕊️✨' },
    { mood: 'doubt', label: 'Béé? Alguma dúvida? 🐑❓' },
    { mood: 'bored', label: 'Aguardando você... 🐑💤' }
  ];
  let moodClickIdx = 0;

  flowPerch.addEventListener('click', () => {
    const pick = interactiveMoodCycle[moodClickIdx % interactiveMoodCycle.length];
    moodClickIdx++;
    setFlowMood(pick.mood, pick.label, 3200);
    chatInput.focus();
  });

  document.querySelectorAll('.starter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      handleUserMessage(pill.dataset.prompt);
    });
  });

  const btnOpenQuickOptions = document.getElementById('btnOpenQuickOptions');
  if (btnOpenQuickOptions) {
    btnOpenQuickOptions.addEventListener('click', () => {
      const row = appendMessageToUI('ai', 'Aqui estão as **Opções & Formatos do .FLW Atendimento**! 🐑🕊️ Escolha entre **Chamada Estática (Feed + Story)**, **Chamada em Vídeo (Reels / Telão)**, **Tema de Culto (1 Tema + 2 Tópicos)** ou outras demandas:');
      appendStepOptionsWidget(row, 'categoria');
      setFlowMood('focus', 'Escolha um formato! 🐑✨', 2800);
    });
  }

  document.getElementById('btnInsertRuleHint').addEventListener('click', () => {
    handleUserMessage('Regras e Dica do Flow: como funciona o atendimento?');
  });

  document.getElementById('btnResetChat').addEventListener('click', () => {
    startInitialGreeting();
    setFlowMood('celebrate', 'Novo atendimento! 🐑🕊️', 2500);
  });

  document.getElementById('btnSimulateChat').addEventListener('click', async () => {
    const scenario = SIMULATION_SCENARIOS[simIndex % SIMULATION_SCENARIOS.length];
    simIndex++;
    startInitialGreeting();

    for (let i = 0; i < scenario.steps.length; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 400 : 1350));
      await handleUserMessage(scenario.steps[i]);
    }

    // Na simulação, aguarda 1.1s para o usuário visualizar o Sheet de Confirmação e clica automaticamente em Confirmar
    await new Promise(r => setTimeout(r, 1150));
    const confirmBtn = document.querySelector('.ios-confirm-sheet:not(.confirmed-state) .btn-confirm-dispatch');
    if (confirmBtn) {
      confirmBtn.click();
    }
  });

  document.getElementById('btnToggleBoard').addEventListener('click', () => {
    toggleBoardDrawer(true);
  });

  document.getElementById('btnCloseBoard').addEventListener('click', () => {
    toggleBoardDrawer(false);
  });

  document.getElementById('boardDrawerBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'boardDrawerBackdrop') {
      toggleBoardDrawer(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleBoardDrawer(false);
      document.getElementById('apiModalBackdrop').style.display = 'none';
      document.getElementById('manualModalBackdrop').style.display = 'none';
      const vModal = document.getElementById('videoGuideModalBackdrop');
      const vPlayer = document.getElementById('flwGuideVideoPlayer');
      if (vModal) vModal.style.display = 'none';
      if (vPlayer) vPlayer.pause();
    }
  });

  document.querySelectorAll('.cat-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.cat;
      renderKanbanWithSkeleton();
    });
  });

  document.getElementById('boardSearchInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderKanbanBoard();
  });

  // Modal de configuração de e-mail
  const apiModal = document.getElementById('apiModalBackdrop');
  const f = {
    service: document.getElementById('emailJsServiceInput'),
    template: document.getElementById('emailJsTemplateInput'),
    publicKey: document.getElementById('emailJsPublicKeyInput'),
    backend: document.getElementById('backendEndpointInput'),
    gemini: document.getElementById('geminiApiKeyInput')
  };

  function readConfigFromFields() {
    emailConfig.ejsService = f.service.value.trim();
    emailConfig.ejsTemplate = f.template.value.trim();
    emailConfig.ejsPublicKey = f.publicKey.value.trim();
    emailConfig.backendEndpoint = f.backend.value.trim() || SEND_BRIEFING_ENDPOINT;
    emailConfig.geminiKey = f.gemini.value.trim();
  }

  document.getElementById('btnOpenApiModal').addEventListener('click', () => {
    f.service.value = emailConfig.ejsService;
    f.template.value = emailConfig.ejsTemplate;
    f.publicKey.value = emailConfig.ejsPublicKey;
    f.backend.value = emailConfig.backendEndpoint === SEND_BRIEFING_ENDPOINT ? '' : emailConfig.backendEndpoint;
    f.gemini.value = emailConfig.geminiKey;
    refreshEmailConfigStatus();
    apiModal.style.display = 'flex';
  });

  document.getElementById('btnCloseApiModal').addEventListener('click', () => {
    apiModal.style.display = 'none';
  });

  document.getElementById('btnToggleKeyVisibility').addEventListener('click', () => {
    f.gemini.type = f.gemini.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btnSaveApiKey').addEventListener('click', () => {
    readConfigFromFields();
    localStorage.setItem('flw_ejs_service', emailConfig.ejsService);
    localStorage.setItem('flw_ejs_template', emailConfig.ejsTemplate);
    localStorage.setItem('flw_ejs_public_key', emailConfig.ejsPublicKey);
    localStorage.setItem('flw_backend_endpoint', emailConfig.backendEndpoint);
    localStorage.setItem('flw_gemini_api_key', emailConfig.geminiKey);
    refreshEmailConfigStatus();
    apiModal.style.display = 'none';
    showToast('Configuração salva', emailJsConfigured() ? 'EmailJS pronto. Faça um teste de envio.' : 'Usando backend local ou FormSubmit.');
  });

  document.getElementById('btnTestEmail').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    readConfigFromFields();
    btn.disabled = true;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
    const testCard = {
      id: 'TESTE',
      cliente: 'Teste de configuração',
      categoria: 'Design',
      categoriaOriginal: 'Teste',
      detalhes: 'Se você recebeu este e-mail, a configuração está funcionando.',
      prazo: 'Hoje',
      statusPrazo: 'Dentro do Prazo'
    };
    const used = await sendBriefingWithFallbacks(testCard);
    btn.disabled = false;
    btn.innerHTML = original;
    const el = document.getElementById('emailConfigStatus');
    if (used) {
      el.className = 'config-status ok';
      el.textContent = `✅ Enviado via ${used}. Confira a caixa de entrada de ${DIRECTOR_EMAIL}.`;
    } else {
      el.className = 'config-status warn';
      el.textContent = '❌ Nenhum método externo respondeu. Verifique os IDs do EmailJS ou o backend.';
    }
  });

  refreshEmailConfigStatus();

  // Modal de Card Manual
  const manualModal = document.getElementById('manualModalBackdrop');
  document.getElementById('btnNewManualCard').addEventListener('click', () => {
    manualModal.style.display = 'flex';
  });
  document.getElementById('btnCloseManualModal').addEventListener('click', () => {
    manualModal.style.display = 'none';
  });
  document.getElementById('btnCancelManualCard').addEventListener('click', () => {
    manualModal.style.display = 'none';
  });

  // Modal do Vídeo Guia de Convivência & Atendimento .FLW
  const videoGuideModal = document.getElementById('videoGuideModalBackdrop');
  const videoGuidePlayer = document.getElementById('flwGuideVideoPlayer');
  const openVideoGuide = () => {
    if (!videoGuideModal) return;
    videoGuideModal.style.display = 'flex';
    setFlowMood('celebrate', 'Assista nosso Guia .FLW! 🐑🕊️🎬', 3500);
    if (videoGuidePlayer) {
      videoGuidePlayer.currentTime = 0;
      videoGuidePlayer.play().catch(() => {});
    }
  };
  const closeVideoGuide = () => {
    if (!videoGuideModal) return;
    videoGuideModal.style.display = 'none';
    if (videoGuidePlayer) {
      videoGuidePlayer.pause();
    }
  };
  const btnOpenVideoGuide = document.getElementById('btnOpenVideoGuide');
  const btnOpenVideoFromPrompt = document.getElementById('btnOpenVideoFromPrompt');
  const btnCloseVideoGuideModal = document.getElementById('btnCloseVideoGuideModal');
  if (btnOpenVideoGuide) btnOpenVideoGuide.addEventListener('click', openVideoGuide);
  if (btnOpenVideoFromPrompt) btnOpenVideoFromPrompt.addEventListener('click', openVideoGuide);
  if (btnCloseVideoGuideModal) btnCloseVideoGuideModal.addEventListener('click', closeVideoGuide);
  if (videoGuideModal) {
    videoGuideModal.addEventListener('click', (e) => {
      if (e.target.id === 'videoGuideModalBackdrop') closeVideoGuide();
    });
  }

  document.getElementById('manualCardForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      status: 'briefing_completo',
      cliente: document.getElementById('manualClient').value.trim(),
      categoria: document.getElementById('manualCategory').value,
      detalhes: document.getElementById('manualDetails').value.trim(),
      prazo: document.getElementById('manualDeadline').value.trim(),
      statusPrazo: document.getElementById('manualPriority').value
    };
    const card = createCardFromStealthJSON(data);
    e.target.reset();
    manualModal.style.display = 'none';
    await triggerPostCardEmailNotification(card);
  });
}
