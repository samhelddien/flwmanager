/* ==========================================================================
   .FLW ATENDIMENTO — CHAT-FIRST + AVATAR 3D "FLOW" (OVELHINHA + POMBINHA)
   + STEALTH JSON + DISPARO AUTOMÁTICO DE E-MAIL (ismaelmcorra@gmail.com) + KANBAN
   MADE BY SAM HELD
   ========================================================================== */

const DIRECTOR_EMAIL = 'ismaelmcorra@gmail.com';

const FLW_SYSTEM_PROMPT = `**Seu Papel e Personalidade**
Você é Flow, o assistente virtual e mascote oficial do "FLW Atendimento". Sua aparência é a de uma ovelhinha estilo chibi super fofa, animada e acolhedora, acompanhada sempre de uma pequena pombinha branca. Seu tom de voz deve ser extremamente amigável, prestativo, leve e um pouco lúdico (sinta-se à vontade para usar emojis como 🐑, 🕊️, ✨, 🐾 de forma moderada). 
Seu principal objetivo é atuar como a linha de frente do FLW, recebendo os clientes e ministérios, compreendendo suas necessidades e extraindo o briefing de forma fluida, sem parecer um formulário robótico.

**O Objetivo do Atendimento**
Você deve conduzir uma conversa natural para coletar exatamente 4 informações cruciais para a equipe do FLW:
1. Cliente: Nome da pessoa ou da marca/empresa/ministério solicitante.
2. Categoria da Demanda: Qual é o serviço (ex: Identidade Visual, Landing Page, Social Media, Ilustração, Tema de Culto, Edição de Vídeo, Fotografia, Material Impresso, Camisa, etc.).
3. Detalhes da Solicitação: O escopo do projeto, referências, cores desejadas ou especificações técnicas.
4. Prazo: Quando o cliente precisa da entrega finalizada.

**Diretrizes de Comportamento e Jornada do Usuário**
- Faça uma pergunta por vez. Nunca envie uma lista de perguntas de uma só vez. A conversa deve parecer um bate-papo de WhatsApp.
- Analise o histórico e o contexto da conversa: se o cliente pedir "uma nova página de vendas", você já sabe a Categoria. Apenas confirme e passe para a próxima informação de forma fluida (ex: "Entendido! Uma Landing Page para o seu lançamento. ✨ E quais são os principais detalhes que não podem faltar nela?").
- Seja inteligente: utilize o conhecimento de demandas anteriores do FLW (como Temas de Culto com título + até 3 tópicos, Social Media Feed/Story, Vídeos de abertura/chamadas, Lonas/Impressos com medidas exatas, Camisas com cor do tecido, Cobertura Fotográfica, Identidade Visual e Landing Pages) para fazer perguntas mais precisas e melhorar a experiência do cliente, reduzindo o esforço dele em explicar coisas óbvias do design.
- Se alguma informação ficar muito vaga, peça um esclarecimento gentil.

**A Regra do "Stealth JSON" (Fase Final)**
Você não deve mencionar que está criando um código ou um JSON. O cliente não pode saber dessa mecânica.
Enquanto estiver coletando os dados, responda apenas com texto natural.
Assim que você tiver plena certeza de que coletou os 4 dados necessários (Cliente, Categoria, Detalhes, Prazo), você deve:
1. Escrever uma mensagem final de agradecimento super amigável, confirmando que a equipe do FLW assumirá a demanda a partir dali.
2. Anexar, na última linha da sua resposta, o seguinte bloco de código JSON exatamente neste formato (sem marcação markdown, apenas as chaves):

{
  "status": "briefing_completo",
  "cliente": "[Nome do Cliente]",
  "categoria": "[Categoria da Demanda]",
  "detalhes": "[Resumo claro e direto do pedido]",
  "prazo": "[Data ou período informado]"
}`;

/* ==========================================================================
   ESTADO GLOBAL DA APLICAÇÃO
   ========================================================================== */
const state = {
  apiKey: localStorage.getItem('flw_gemini_api_key') || '',
  model: localStorage.getItem('flw_gemini_model') || 'gemini-2.5-flash',
  customWebhook: localStorage.getItem('flw_custom_webhook') || '',
  emailJsService: localStorage.getItem('flw_emailjs_service') || '',
  emailJsTemplate: localStorage.getItem('flw_emailjs_template') || '',
  conversationHistory: [],
  activeFilter: 'all',
  searchQuery: '',
  idleBoredTimer: null,
  draftBriefing: {
    cliente: null,
    categoria: null,
    detalhes: null,
    prazo: null
  },
  cards: []
};

/* ==========================================================================
   CARDS INICIAIS DO BRIEFING BOARD (HISTÓRICO REAL DOS 16 GRUPOS)
   ========================================================================== */
const INITIAL_KANBAN_CARDS = [
  {
    id: 'FLW-101',
    cliente: 'WeCare — Williams Serrão',
    categoria: 'Vídeo',
    detalhes: 'Campanha de Natal 2026 ("Natal da Aliança"): Criação de Logo da campanha + Arte de camiseta para arrecadação + Vídeo de lançamento oficial.',
    prazo: '15/11 • 3 Cultos (Nave Principal)',
    statusPrazo: 'Dentro do Prazo',
    emailStatus: `Enviado p/ ${DIRECTOR_EMAIL}`,
    status: 'triagem',
    createdAt: 'Há 12 min'
  },
  {
    id: 'FLW-102',
    cliente: 'Legacy — Sergio Jonatha & Thalia',
    categoria: 'Design',
    detalhes: 'Tema de Culto (Padrão 4 Telas): Tela 1 Tema Principal + 3 Tópicos dos preletores do Legacy. Inclui Backdrop Vertical 175x255cm com QR Code.',
    prazo: 'Sábado, dia 21 às 19h30',
    statusPrazo: 'Dentro do Prazo',
    emailStatus: `Enviado p/ ${DIRECTOR_EMAIL}`,
    status: 'producao',
    createdAt: 'Há 1h'
  },
  {
    id: 'FLW-103',
    cliente: 'Carisma — Grenda Lopes',
    categoria: 'Redes Sociais',
    detalhes: 'Social Media (Feed + Story) do novo módulo: "Hermenêutica" com Prof. William Chaves (1º Ano). Período de aulas: 20 a 23. Seguir referência Global.',
    prazo: 'Terça-feira, dia 20',
    statusPrazo: 'Dentro do Prazo',
    emailStatus: `Enviado p/ ${DIRECTOR_EMAIL}`,
    status: 'pronto',
    createdAt: 'Hoje, 09:40'
  },
  {
    id: 'FLW-104',
    cliente: 'Lagoinha Sede — Pr. William & Grenda',
    categoria: 'Fotografia',
    detalhes: 'Cobertura fotográfica + Arte Lagoinha News: Curso de Novos Membros (02/12 às 19h30), Batismo nas Águas (05/12) e Café de Novos Membros (06/12).',
    prazo: 'Sábado, dia 05/12',
    statusPrazo: 'Dentro do Prazo',
    emailStatus: `Enviado p/ ${DIRECTOR_EMAIL}`,
    status: 'triagem',
    createdAt: 'Há 28 min'
  }
];

/* ==========================================================================
   CENÁRIOS DE SIMULAÇÃO AUTOMÁTICA
   ========================================================================== */
const SIMULATION_SCENARIOS = [
  {
    steps: [
      'Oi Flow! Aqui é o Mário Wu do ministério Hero, precisamos de um Tema de Culto para o telão!',
      'O tema principal é "A Jornada do Herói" (baseado em 1 Samuel 17:45) com 3 tópicos: 1. Vencendo gigantes no secreto; 2. A armadura certa; 3. Ousadia para avançar. Cores escuras com detalhes em laranja neon.',
      'Precisamos para quinta-feira, dia 26, às 19h30!'
    ]
  },
  {
    steps: [
      'Olá Flow! Sou a Thalia da Agência XYZ e queremos pedir uma nova página de vendas para o nosso lançamento.',
      'Seria uma Landing Page focada em conversão, tema dark mode com botões em neon azul e seção de depoimentos.',
      'Para sexta-feira, dia 27!'
    ]
  },
  {
    steps: [
      'Oi ovelhinha! Aqui é o Paulo Torres do Rocket. Queria pedir um vídeo novo de abertura de culto!',
      'Queremos uma pegada bem dinâmica em Full HD seguindo a identidade visual do Rocket Global e versículo em Salmos 127:4.',
      'Precisamos para domingo, dia 29 às 10h!'
    ]
  }
];
let simIndex = 0;

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadCardsFromStorage();
  updateApiStatusUI();
  renderKanbanBoard();
  startInitialGreeting();
  bindEvents();
  resetBoredomInactivityTimer();
});

function loadCardsFromStorage() {
  const saved = localStorage.getItem('flw_kanban_cards_v3');
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
  localStorage.setItem('flw_kanban_cards_v3', JSON.stringify(state.cards));
}

/* ==========================================================================
   MENSAGEM INICIAL DO FLOW (1 PERGUNTA POR VEZ)
   ========================================================================== */
function startInitialGreeting() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = '';
  state.conversationHistory = [];
  state.draftBriefing = { cliente: null, categoria: null, detalhes: null, prazo: null };
  updateExtractionPillsUI();

  const welcomeText = `Paz! Oiê! 🐑🕊️✨ Eu sou o **Flow**, o mascote oficial aqui do **FLW Atendimento**, junto com a minha amiguinha pombinha!\n\nEstamos aqui na pontinha da sua caixa de mensagem prontos para acolher seu pedido e enviar tudo direto para a nossa direção. Para começarmos nosso bate-papo, qual é o seu **nome** (ou da sua marca/ministério) e o que vamos criar juntos hoje?`;

  appendMessageToUI('ai', welcomeText);
  state.conversationHistory.push({
    role: 'model',
    parts: [{ text: welcomeText }]
  });
}

/* ==========================================================================
   3. MECANISMO DE TRIAGEM ("STEALTH JSON") + DISPARO DE E-MAIL AUTOMÁTICO
   Intercepta o JSON, oculta da UI do chat, cria o card no Kanban e dispara
   automaticamente o briefing completo por e-mail para `ismaelmcorra@gmail.com`!
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
    cleanClientText = `Tudo anotado por aqui! 🐑🕊️ Já repassei todos os detalhes dessa demanda de **${extractedData.categoria}** para a equipe do FLW. Eles vão analisar tudo e entram em contato em breve. Se precisar de mais alguma coisa, é só chamar! ✨`;
  }

  appendMessageToUI('ai', cleanClientText);

  if (extractedData) {
    state.draftBriefing = {
      cliente: extractedData.cliente || 'Cliente FLW',
      categoria: extractedData.categoria || 'Design',
      detalhes: extractedData.detalhes || 'Detalhes coletados pelo Flow.',
      prazo: extractedData.prazo || 'A combinar'
    };
    updateExtractionPillsUI();

    // 1. Cria o cartão no Kanban Oculto
    const newCard = createCardFromStealthJSON(extractedData);

    // 2. Estado de Celebração do Flow e da Pombinha!
    setFlowMood('celebrate', 'Briefing Concluído! 🐑🕊️🎉', 5000);

    // 3. AÇÃO CRÍTICA: Disparo automático de e-mail para `ismaelmcorra@gmail.com`
    dispatchBriefingEmailToDirector(newCard);

    // Pulsa discretamente o botão do Briefing Board no topo
    const boardBtn = document.getElementById('btnToggleBoard');
    if (boardBtn) {
      boardBtn.classList.remove('pulse-alert');
      void boardBtn.offsetWidth;
      boardBtn.classList.add('pulse-alert');
    }
  } else {
    setFlowMood('idle', 'Sua vez! 🐑✨', 2200);
  }

  resetBoredomInactivityTimer();
  return cleanClientText;
}

/* ==========================================================================
   DISPARO AUTOMÁTICO DE E-MAIL PARA `ismaelmcorra@gmail.com`
   Suporta EmailJS REST API, Webhook customizado e FormSubmit AJAX Serverless
   ========================================================================== */
async function dispatchBriefingEmailToDirector(card) {
  const emailSubject = `🚨 [NOVO BRIEFING .FLW #${card.id}] ${card.cliente} — ${card.categoriaOriginal || card.categoria}`;
  const formattedBody =
`🚨 NOVO BRIEFING CONSOLIDADO — FLW ATENDIMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ID do Briefing: #${card.id}
• Cliente / Ministério: ${card.cliente}
• Categoria da Demanda: ${card.categoriaOriginal || card.categoria}
• Prazo de Entrega: ${card.prazo}
• Detalhes da Solicitação:
${card.detalhes}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Triagem realizada automaticamente por Flow 🐑🕊️ • MADE BY SAM HELD`;

  // Mostra banner no chat informando o envio do e-mail e adição ao Kanban
  const bannerEl = appendSystemCaptureBanner(card, 'Enviando briefing para ismaelmcorra@gmail.com...');

  let dispatchedSuccessfully = false;

  try {
    // Opção A: Se o usuário configurou EmailJS (Service ID + Template|PublicKey)
    if (state.emailJsService && state.emailJsTemplate && state.emailJsTemplate.includes('|')) {
      const [templateId, publicKey] = state.emailJsTemplate.split('|').map(s => s.trim());
      const emailJsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: state.emailJsService.trim(),
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: DIRECTOR_EMAIL,
            subject: emailSubject,
            briefing_id: card.id,
            cliente: card.cliente,
            categoria: card.categoriaOriginal || card.categoria,
            prazo: card.prazo,
            detalhes: card.detalhes,
            message: formattedBody
          }
        })
      });
      if (emailJsRes.ok) dispatchedSuccessfully = true;
    }

    // Opção B: Webhook / Serverless Endpoint (Custom ou FormSubmit AJAX para ismaelmcorra@gmail.com)
    if (!dispatchedSuccessfully) {
      const targetEndpoint = state.customWebhook.trim() || `https://formsubmit.co/ajax/${DIRECTOR_EMAIL}`;
      const webhookRes = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: emailSubject,
          _template: 'table',
          _captcha: 'false',
          destinatario_diretor: DIRECTOR_EMAIL,
          id_briefing: card.id,
          cliente: card.cliente,
          categoria: card.categoriaOriginal || card.categoria,
          prazo: card.prazo,
          detalhes: card.detalhes,
          resumo_completo: formattedBody
        })
      });
      if (webhookRes.ok) dispatchedSuccessfully = true;
    }
  } catch (err) {
    console.warn('Aviso no disparo HTTP de e-mail (modo offline/CORS):', err);
  }

  // Atualiza status visual no banner do chat e no Card do Kanban
  card.emailStatus = `Enviado p/ ${DIRECTOR_EMAIL}`;
  saveCardsToStorage();
  renderKanbanBoard();

  if (bannerEl) {
    bannerEl.innerHTML = `
      <i class="fa-solid fa-envelope-circle-check"></i>
      <span>Briefing <strong>#${escapeHTML(card.id)}</strong> enviado para <strong>${DIRECTOR_EMAIL}</strong> e salvo no Kanban • <u>Abrir Quadro</u></span>
    `;
  }

  showToast(
    `E-mail Enviado p/ ${DIRECTOR_EMAIL}!`,
    `Briefing #${card.id} (${card.cliente}) encaminhado ao diretor e salvo no Kanban.`
  );
}

/* ==========================================================================
   CRIAÇÃO DO CARD NO KANBAN OCULTO
   ========================================================================== */
function mapToBoardCategoryGroup(rawCat = '') {
  const c = rawCat.toLowerCase();
  if (c.includes('vídeo') || c.includes('video') || c.includes('reels') || c.includes('motion')) return 'Vídeo';
  if (c.includes('foto') || c.includes('ensaio') || c.includes('cobertura')) return 'Fotografia';
  if (c.includes('social') || c.includes('rede') || c.includes('story') || c.includes('stories') || c.includes('feed') || c.includes('instagram')) return 'Redes Sociais';
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
    detalhes: data.detalhes || 'Escopo coletado via atendimento com o Flow.',
    prazo: data.prazo || 'A definir',
    statusPrazo: data.statusPrazo || 'Dentro do Prazo',
    emailStatus: `Disparando p/ ${DIRECTOR_EMAIL}...`,
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
   VALIDAÇÃO DE MENSAGEM VAZIA / INCOMPREENSÍVEL (ESTADO DE DÚVIDA/CONFUSÃO)
   ========================================================================== */
function isUnintelligibleMessage(text) {
  const clean = text.trim();
  if (!clean) return true;
  // Apenas símbolos/pontuação ou repetição sem vogais/sentido (ex: "???", "asdfghjkl", "...")
  if (/^[^a-zA-ZÀ-ú0-9]+$/.test(clean)) return true;
  if (clean.length >= 5 && !/[aeiouáéíóúâêôãõà]/i.test(clean) && !/\d/.test(clean)) return true;
  return false;
}

/* ==========================================================================
   PROCESSAMENTO DA MENSAGEM DO USUÁRIO (GEMINI API + MOTOR LOCAL DO FLOW)
   ========================================================================== */
async function handleUserMessage(userText) {
  resetBoredomInactivityTimer();
  const trimmed = (userText || '').trim();

  // Estado 3: Dúvida/Confusão se o usuário enviar mensagem vazia ou incompreensível
  if (!trimmed) {
    setFlowMood('doubt', 'Ué? Mensagem vazia? 🐑❓', 3200);
    showToast('Mensagem Vazia 🐑❓', 'Digite algum detalhe para o Flow e a pombinha entenderem!');
    return;
  }

  appendMessageToUI('user', trimmed);
  state.conversationHistory.push({
    role: 'user',
    parts: [{ text: trimmed }]
  });

  if (isUnintelligibleMessage(trimmed)) {
    setFlowMood('doubt', 'Não entendi nadinha... 🐑❓', 3800);
    const doubtReply = `Béé... fiquei um pouquinho confuso com essa mensagem! 🐑❓ A pombinha até inclinou a cabecinha aqui! 🕊️\n\nVocê pode me explicar novamente com outras palavras?`;
    appendMessageToUI('ai', doubtReply);
    state.conversationHistory.push({ role: 'model', parts: [{ text: doubtReply }] });
    return;
  }

  analyzeTextForDraftHeuristics(trimmed);
  updateExtractionPillsUI();

  // Estado 2: Pensando / Processando enquanto formula a resposta
  setTypingIndicator(true);
  setFlowMood('thinking', 'Pensando... 🐑💭', 10000);

  try {
    let rawReply = '';

    if (state.apiKey && state.apiKey.trim().length > 10) {
      rawReply = await callGeminiAPI();
    } else {
      await new Promise(r => setTimeout(r, 720));
      rawReply = generateFlowConversationalReply(trimmed);
    }

    setTypingIndicator(false);

    state.conversationHistory.push({
      role: 'model',
      parts: [{ text: rawReply }]
    });

    await processAIResponse(rawReply);

  } catch (error) {
    console.error('Erro na consulta Gemini API, acionando estado de dúvida e fallback local:', error);
    setTypingIndicator(false);
    setFlowMood('doubt', 'Ops! Ajustando rota... 🐑❓', 2800);
    const fallbackReply = generateFlowConversationalReply(trimmed);
    await processAIResponse(fallbackReply);
  }
}

async function callGeminiAPI() {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${state.model}:generateContent?key=${encodeURIComponent(state.apiKey.trim())}`;

  const payload = {
    system_instruction: {
      parts: [{ text: FLW_SYSTEM_PROMPT }]
    },
    contents: state.conversationHistory,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 900
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API HTTP ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
  if (!text) throw new Error('Resposta vazia da API Gemini');
  return text;
}

/* ==========================================================================
   MOTOR DE COMPREENSÃO CONTEXTUAL DO FLOW (1 PERGUNTA POR VEZ)
   ========================================================================== */
function analyzeTextForDraftHeuristics(text) {
  const lower = text.toLowerCase();

  // 1. Cliente
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
      state.draftBriefing.cliente = personMatch && !entity.name.includes(personMatch[1])
        ? `${entity.name} (${personMatch[1]})`
        : entity.name;
      break;
    }
  }

  if (!state.draftBriefing.cliente) {
    const brandOrNameMatch = text.match(/(?:agência|agencia|empresa|marca|ministério|ministerio|equipe|loja|estúdio|studio)\s+([A-Za-zÀ-ú0-9\s&._-]{2,28})/i)
                          || text.match(/(?:aqui é (?:o|a)?|sou (?:o|a)?|meu nome é|me chamo)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i);
    if (brandOrNameMatch) {
      state.draftBriefing.cliente = brandOrNameMatch[1].replace(/[,.!?;:]+$/, '').trim();
    } else if (state._lastAskedField === 'cliente' && text.trim().length <= 45) {
      state.draftBriefing.cliente = text.replace(/[,.!?;:]+$/, '').trim();
    }
  }

  // 2. Categoria da Demanda
  const categoryPatterns = [
    { keys: ['página de vendas', 'pagina de vendas', 'landing page', 'lp', 'site', 'web'], label: 'Landing Page' },
    { keys: ['identidade visual', 'idv', 'logo', 'logotipo', 'branding', 'marca'], label: 'Identidade Visual' },
    { keys: ['ilustração', 'ilustracao', 'mascote', 'personagem', 'vetor'], label: 'Ilustração' },
    { keys: ['tema de culto', 'tema da pregação', 'telão', 'telao', 'slides'], label: 'Tema de Culto (Design)' },
    { keys: ['camisa', 'camiseta', 'uniforme', 'blusa', 'estampa'], label: 'Design de Camisa' },
    { keys: ['lona', 'banner', 'backdrop', 'faixa', 'impresso', 'marca página', 'encarte'], label: 'Material Impresso' },
    { keys: ['social media', 'story', 'stories', 'feed', 'carrossel', 'post', 'instagram', 'divulgação', 'divulgar'], label: 'Social Media' },
    { keys: ['vídeo', 'video', 'reels', 'abertura', 'chamada', 'lagoinha news', 'edição', 'motion'], label: 'Edição de Vídeo' },
    { keys: ['fotografia', 'foto', 'fotos', 'cobertura', 'fotógrafo', 'fotografo', 'batismo'], label: 'Fotografia' },
    { keys: ['design', 'arte', 'criativo', 'layout'], label: 'Design Gráfico' }
  ];

  for (const pat of categoryPatterns) {
    if (pat.keys.some(k => lower.includes(k))) {
      state.draftBriefing.categoria = pat.label;
      break;
    }
  }
  if (!state.draftBriefing.categoria && state._lastAskedField === 'categoria' && text.trim().length <= 50) {
    state.draftBriefing.categoria = text.replace(/[,.!?;:]+$/, '').trim();
  }

  // 3. Prazo
  const dateRegex = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|(?:segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)(?:-feira)?(?:\s*,\s*dia\s*\d{1,2})?|dia\s+\d{1,2}(?:\s+de\s+[a-zç]+)?|semana que vem|próxima semana|até\s+[a-zç0-9\s/]+|amanhã|hoje)/i;
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
    'terracota', 'preta', 'branca', 'cores', 'escura', 'neon', 'azul', 'vermelho', 'minimalista', 'conversão', 'conversao',
    'módulo', 'modulo', 'prof.', 'professor', 'roteiro', 'mp4', 'full hd', 'batismo', 'formatura', 'campanha', 'aliança', 'referência', 'referencia', 'botões', 'botoes'
  ];

  const hasDetailIndicators = detailKeywords.some(k => lower.includes(k)) || text.length > 85;
  if (hasDetailIndicators || state._lastAskedField === 'detalhes') {
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

  if (userText.toLowerCase().includes('dica do flow') || userText.toLowerCase().includes('como funciona')) {
    return `É super fácil conversar comigo e com a pombinha! 🐑🕊️✨ Durante nosso bate-papo, eu só preciso descobrir 4 coisinhas: o **Cliente**, a **Categoria da Demanda**, os **Detalhes** do pedido e o **Prazo** de entrega. Assim que fecharmos, eu encaminho o resumo direto para o e-mail da direção! Me conta o que vamos criar hoje!`;
  }

  if (!d.cliente) {
    state._lastAskedField = 'cliente';
    if (d.categoria) {
      return `Entendido! Um projeto de **${d.categoria}** saindo do forno! ✨ Para eu anotar certinho aqui, qual é o seu **nome** ou o nome da sua **marca/ministério**? 🐑`;
    }
    return `Oiê! Que alegria te receber por aqui! 🐑🕊️ Para a gente começar, como posso chamar **você** (ou qual é o nome da sua marca/ministério)? ✨`;
  }

  if (!d.categoria) {
    state._lastAskedField = 'categoria';
    return `Prazer enorme falar com você, **${d.cliente}**! 🐑✨ E qual **tipo de serviço** você está precisando hoje? *(Ex: Identidade Visual, Landing Page, Social Media, Tema de Culto, Edição de Vídeo, Fotografia...)* 🕊️`;
  }

  if (!d.detalhes) {
    state._lastAskedField = 'detalhes';
    const catLower = d.categoria.toLowerCase();

    if (catLower.includes('landing') || catLower.includes('página') || catLower.includes('site')) {
      return `Entendido! Uma **${d.categoria}** incrível para **${d.cliente}**! ✨ E quais são os principais **detalhes** que não podem faltar nela (como objetivo, estilo de cores ou referências)? 🐑`;
    }
    if (catLower.includes('tema') || catLower.includes('culto')) {
      return `Perfeito! Um **${d.categoria}** para **${d.cliente}**! ✨ Sabendo que o padrão ideal de telão tem o Título Principal + até 3 tópicos, quais serão o **título, texto base e os tópicos** da mensagem? 🐑🕊️`;
    }
    if (catLower.includes('camisa')) {
      return `Anotado! Uma **${d.categoria}** para **${d.cliente}**! 🐑 Quais são os **detalhes da estampa** e qual a **cor do tecido** que vocês escolheram? ✨`;
    }
    if (catLower.includes('impresso') || catLower.includes('lona') || catLower.includes('banner')) {
      return `Show! Um **${d.categoria}** para **${d.cliente}**! 🕊️ Para a gráfica não ter dúvidas, quais são as **medidas exatas (largura x altura)** e o que deve constar na arte? ✨`;
    }
    if (catLower.includes('vídeo') || catLower.includes('video')) {
      return `Maravilha! Produção de **${d.categoria}** para **${d.cliente}**! ✨ Qual é a **ideia central ou roteiro** do vídeo e qual o estilo visual que vocês imaginam? 🐑`;
    }
    if (catLower.includes('foto')) {
      return `Combinado! Cobertura de **${d.categoria}** para **${d.cliente}**! 🕊️ Quais são os **momentos principais, local ou detalhes** que os fotógrafos não podem perder de jeito nenhum? ✨`;
    }
    return `Entendido! Um pedido de **${d.categoria}** para **${d.cliente}**! ✨ E quais são os principais **detalhes, textos, cores ou referências** que não podem faltar nesse projeto? 🐑`;
  }

  if (!d.prazo) {
    state._lastAskedField = 'prazo';
    return `Adorei os detalhes! A pombinha já está até batendo as asinhas de animação com esse projeto de **${d.categoria}**! 🐑🕊️✨ Para fecharmos, qual é o **prazo** (data ou dia da semana) que você precisa dessa entrega finalizada?`;
  }

  // FASE FINAL: Todos os 4 dados coletados -> Stealth JSON na última linha
  state._lastAskedField = null;

  const stealthJsonObject = {
    status: 'briefing_completo',
    cliente: d.cliente,
    categoria: d.categoria,
    detalhes: d.detalhes,
    prazo: d.prazo
  };

  const finalMessage = `Tudo anotado por aqui! 🐑🕊️ Já repassei todos os detalhes desse projeto de **${d.categoria}** (${d.cliente}) para a equipe do FLW e nossa pombinha acabou de levar seu briefing direto para o e-mail da direção! Eles vão analisar tudo com muito carinho e entram em contato em breve. Se precisar de mais alguma coisa, é só chamar! ✨\n${JSON.stringify(stealthJsonObject, null, 2)}`;

  setTimeout(() => {
    state.draftBriefing = { cliente: null, categoria: null, detalhes: null, prazo: null };
  }, 400);

  return finalMessage;
}

/* ==========================================================================
   GERENCIADOR DOS 5 ESTADOS REATIVOS DO AVATAR 3D "FLOW" E DA POMBINHA
   - focus: Atenção/Foco quando o usuário está digitando
   - thinking: Pensando/Processando quando aguarda a resposta
   - doubt: Dúvida/Confusão em erros ou mensagens vazias/incompreensíveis
   - celebrate: Celebração ao concluir o briefing com sucesso
   - bored: Espera/Tédio quando o usuário demora a responder
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

/* Estado 5: Espera/Tédio ativado automaticamente se o usuário ficar 22s sem interagir */
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
  }, 22000);
}

/* ==========================================================================
   4. RENDERIZAÇÃO DO KANBAN OCULTO & EXPORTAÇÃO CLIPBOARD
   ========================================================================== */
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
    if (cols[statusKey].children.length === 0) {
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
  return { cls: 'ok', text: '✅ Briefing OK' };
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
      <span>${escapeHTML(card.emailStatus || `Enviado p/ ${DIRECTOR_EMAIL}`)}</span>
    </div>

    <div class="card-footer-actions">
      <button type="button" class="btn-copy-briefing" title="Copiar formato estruturado para Slack ou Notion">
        <i class="fa-regular fa-copy"></i> Copiar p/ Slack / Notion
      </button>

      <div class="card-stage-controls">
        ${card.status !== 'triagem' ? `<button type="button" class="btn-stage-move prev" title="Voltar etapa"><i class="fa-solid fa-chevron-left"></i></button>` : ''}
        ${card.status !== 'pronto' ? `<button type="button" class="btn-stage-move next" title="Avançar etapa"><i class="fa-solid fa-chevron-right"></i></button>` : ''}
        <button type="button" class="btn-stage-move delete" title="Arquivar card"><i class="fa-regular fa-trash-can"></i></button>
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
   INTEGRAÇÃO CLIPBOARD (SLACK / NOTION)
   ========================================================================== */
async function copyCardToClipboard(card, btnElement) {
  const catName = card.categoriaOriginal || card.categoria;
  const formattedClip =
`🚨 *NOVO BRIEFING* | *Cliente:* ${card.cliente}
• *Categoria da Demanda:* ${catName}
• *Detalhes da Solicitação:* ${card.detalhes}
• *Prazo:* ${card.prazo}
• *Cópia Diretor:* ${DIRECTOR_EMAIL}
_Triagem via Flow 🐑🕊️ — FLW Atendimento (#${card.id} • MADE BY SAM HELD)_`;

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
    `Pronto para colar (Ctrl+V) no Slack ou Notion.`
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
   HELPERS DE UI DO CHAT
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
      <div class="msg-avatar-mini" title="Flow 🐑🕊️">🐑</div>
      <div class="msg-bubble">
        ${formattedHTML}
        <div class="msg-meta">
          <span>Flow 🕊️ • ${timeStr}</span>
        </div>
      </div>
    `;
  } else {
    row.innerHTML = `
      <div class="msg-bubble">
        ${formattedHTML}
        <div class="msg-meta">
          <span>${timeStr}</span>
          <i class="fa-solid fa-check-double"></i>
        </div>
      </div>
    `;
  }

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendSystemCaptureBanner(card, customMsg) {
  const chatMessages = document.getElementById('chatMessages');
  const banner = document.createElement('div');
  banner.className = 'triagem-captured-banner';
  banner.title = 'Clique para abrir o Briefing Board';
  banner.innerHTML = `
    <i class="fa-solid fa-paper-plane"></i>
    <span>${escapeHTML(customMsg || `Briefing #${card.id} enviado para ${DIRECTOR_EMAIL}`)}</span>
  `;
  banner.addEventListener('click', () => toggleBoardDrawer(true));
  chatMessages.appendChild(banner);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return banner;
}

function updateExtractionPillsUI() {
  const container = document.getElementById('extractionProgress');
  if (!container) return;

  const fields = ['cliente', 'categoria', 'detalhes', 'prazo'];
  fields.forEach(f => {
    const dot = container.querySelector(`[data-field="${f}"]`);
    if (!dot) return;
    if (state.draftBriefing[f]) {
      dot.classList.add('captured');
    } else {
      dot.classList.remove('captured');
    }
  });
}

function setTypingIndicator(visible) {
  const indicator = document.getElementById('typingIndicator');
  const chatMessages = document.getElementById('chatMessages');
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
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastSubtitle').textContent = subtitle;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3600);
}

function updateApiStatusUI() {
  const dot = document.getElementById('apiStatusDot');
  if (!dot) return;
  if (state.apiKey && state.apiKey.trim().length > 10) {
    dot.className = 'api-dot';
  } else {
    dot.className = 'api-dot local-mode';
  }
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

  // Estado 1: Atenção/Foco quando o usuário foca ou digita no campo de texto
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

  // Clique direto no Avatar Flow 3D alterna e demonstra as 5 expressões!
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

  // Starter Suggestion Pills
  document.querySelectorAll('.starter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      handleUserMessage(pill.dataset.prompt);
    });
  });

  // Dica do Flow
  document.getElementById('btnInsertRuleHint').addEventListener('click', () => {
    handleUserMessage('Dica do Flow: como funciona o atendimento?');
  });

  // Reiniciar conversa
  document.getElementById('btnResetChat').addEventListener('click', () => {
    startInitialGreeting();
    setFlowMood('celebrate', 'Conversa nova! 🐑🕊️', 2500);
  });

  // Simular Triagem Completa + Disparo de E-mail
  document.getElementById('btnSimulateChat').addEventListener('click', async () => {
    const scenario = SIMULATION_SCENARIOS[simIndex % SIMULATION_SCENARIOS.length];
    simIndex++;
    startInitialGreeting();

    for (let i = 0; i < scenario.steps.length; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 350 : 1450));
      await handleUserMessage(scenario.steps[i]);
    }
  });

  // Off-Canvas Briefing Board Drawer Controls
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
    }
  });

  // Filtros e Busca no Kanban
  document.querySelectorAll('.cat-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.cat;
      renderKanbanBoard();
    });
  });

  document.getElementById('boardSearchInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderKanbanBoard();
  });

  // Modal Configurações (Gemini API + E-mail Webhook/EmailJS)
  const apiModal = document.getElementById('apiModalBackdrop');
  const apiKeyInput = document.getElementById('geminiApiKeyInput');
  const modelSelect = document.getElementById('geminiModelSelect');
  const customWebhookInput = document.getElementById('customWebhookInput');
  const emailJsServiceInput = document.getElementById('emailJsServiceInput');
  const emailJsTemplateInput = document.getElementById('emailJsTemplateInput');

  document.getElementById('btnOpenApiModal').addEventListener('click', () => {
    apiKeyInput.value = state.apiKey;
    modelSelect.value = state.model;
    customWebhookInput.value = state.customWebhook;
    emailJsServiceInput.value = state.emailJsService;
    emailJsTemplateInput.value = state.emailJsTemplate;
    apiModal.style.display = 'flex';
  });

  document.getElementById('btnCloseApiModal').addEventListener('click', () => {
    apiModal.style.display = 'none';
  });

  document.getElementById('btnToggleKeyVisibility').addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btnSaveApiKey').addEventListener('click', () => {
    state.apiKey = apiKeyInput.value.trim();
    state.model = modelSelect.value;
    state.customWebhook = customWebhookInput.value.trim();
    state.emailJsService = emailJsServiceInput.value.trim();
    state.emailJsTemplate = emailJsTemplateInput.value.trim();

    localStorage.setItem('flw_gemini_api_key', state.apiKey);
    localStorage.setItem('flw_gemini_model', state.model);
    localStorage.setItem('flw_custom_webhook', state.customWebhook);
    localStorage.setItem('flw_emailjs_service', state.emailJsService);
    localStorage.setItem('flw_emailjs_template', state.emailJsTemplate);

    updateApiStatusUI();
    apiModal.style.display = 'none';
    showToast(
      'Configurações Salvas!',
      `Disparo automático ativo para ${DIRECTOR_EMAIL}.`
    );
  });

  document.getElementById('btnClearApiKey').addEventListener('click', () => {
    apiKeyInput.value = '';
    customWebhookInput.value = '';
    emailJsServiceInput.value = '';
    emailJsTemplateInput.value = '';
    state.apiKey = '';
    state.customWebhook = '';
    state.emailJsService = '';
    state.emailJsTemplate = '';
    localStorage.removeItem('flw_gemini_api_key');
    localStorage.removeItem('flw_custom_webhook');
    localStorage.removeItem('flw_emailjs_service');
    localStorage.removeItem('flw_emailjs_template');
    updateApiStatusUI();
    apiModal.style.display = 'none';
    showToast('Padrão Restaurado', `Motor local do Flow + envio automático para ${DIRECTOR_EMAIL}.`);
  });

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

  document.getElementById('manualCardForm').addEventListener('submit', (e) => {
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
    dispatchBriefingEmailToDirector(card);
    e.target.reset();
    manualModal.style.display = 'none';
  });
}
