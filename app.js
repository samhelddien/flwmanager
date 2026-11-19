/* ==========================================================================
   .FLW ATENDIMENTO — CONVERSATIONAL UI & HAX ENGINE
   Streaming token-a-token · Smart Auto-Scroll · Markdown Completo
   Autocomplete dos 18 Ministérios · Split-View GenUI Canvas · Privacidade Total
   MADE BY SAM HELD
   ========================================================================== */

const SEND_BRIEFING_ENDPOINT = '/api/send-briefing';
const CHAT_PROXY_ENDPOINT = '/api/chat';
const MANAGER_SENT_LABEL = 'Enviado para o Manager do FLW!';
const STORAGE_KEY_CARDS = 'flw_demandas_v6';

/* ==========================================================================
   LISTA OFICIAL DOS 18 MINISTÉRIOS / DEPARTAMENTOS (.FLW)
   ========================================================================== */
const FLW_MINISTRIES = [
  { name: 'Art Factory', aliases: ['art factory', 'arte', 'teatro', 'danca', 'fernanda bonfim', 'william oliveira'] },
  { name: 'Carisma', aliases: ['carisma', 'seminario', 'grenda', 'hermeneutica'] },
  { name: 'Champions', aliases: ['champions', 'esporte', 'gledson', 'andressa'] },
  { name: 'Consolidação', aliases: ['consolidacao', 'andrea'] },
  { name: 'Diaconato', aliases: ['diaconato', 'diaconos', 'rafael cerdeira'] },
  { name: 'Eventos', aliases: ['eventos', 'evento', 'diego melgueiro'] },
  { name: 'Future', aliases: ['future', 'adolescentes', 'jean victor'] },
  { name: 'Hero', aliases: ['hero', 'homens', 'mario wu'] },
  { name: 'Intercessão', aliases: ['intercessao', 'oracao', 'ore pela cidade'] },
  { name: 'Kids', aliases: ['kids', 'start kids', 'fest kids', 'criancas'] },
  { name: 'Lagoinha', aliases: ['lagoinha', 'sede', 'pastoral', 'igreja', 'pr. william'] },
  { name: 'Legacy', aliases: ['legacy', 'lgcy', 'jovens', 'sergio', 'thalia', 'aninha'] },
  { name: 'Melhor Idade', aliases: ['melhor idade', 'idosos', 'zacarias', 'evelyn'] },
  { name: 'Pacificadores', aliases: ['pacificadores', 'thiago silveira'] },
  { name: 'Rocket', aliases: ['rocket', 'paulo torres'] },
  { name: 'WeCare', aliases: ['wecare', 'we care', 'social', 'williams', 'natal da alianca'] },
  { name: 'GCs', aliases: ['gcs', 'gc', 'grupo de crescimento', 'grupos de crescimento', 'celula'] },
  { name: 'Lucas', aliases: ['lucas', 'ministerio lucas'] }
];

const FLW_SYSTEM_PROMPT = `Você é Flow, assistente de briefings do .FLW Atendimento (Lagoinha Manaus).
Seja conciso, caloroso, organizado e use Markdown limpo para estruturar respostas escaneáveis.

Regras oficiais do .FLW:
- Equipe 100% voluntária (3 designers + 3 aprendizes atendendo os departamentos da igreja).
- Prazo mínimo obrigatório: 2 a 3 dias úteis de antecedência para toda demanda.
- Temas de Culto (telão): 1 Tema Principal + no máximo 2 Tópicos.
- Chamadas de divulgação podem ser Estáticas (Feed 4:5 + Story 9:16), em Vídeo (Reels/Telão) ou Completas (ambos).
- Ministérios oficiais: ${FLW_MINISTRIES.map(m => m.name).join(', ')}.

Objetivo: conduzir uma triagem clara (uma pergunta por vez) coletando:
1. Ministério / Responsável
2. Categoria e Formato
3. Detalhes / Escopo revisado
4. Prazo / Evento

Quando tiver os 4 dados completos, convide o usuário a revisar e confirmar o briefing, anexando na última linha este JSON:
{
  "status": "briefing_completo",
  "ministerio": "[Ministério]",
  "responsavel": "[Nome ou vazio]",
  "cliente": "[Ministério — Nome]",
  "categoria": "[Categoria e Formato]",
  "detalhes": "[Resumo objetivo]",
  "prazo": "[Data e horário/culto]"
}`;

/* ==========================================================================
   CARDS INICIAIS DO PAINEL DE DEMANDAS (SEM EXPOSIÇÃO DE E-MAIL)
   ========================================================================== */
const INITIAL_DEMANDS = [
  {
    id: 'FLW-101',
    ministerio: 'Carisma',
    cliente: 'Carisma — Grenda Lopes',
    categoria: 'Redes Sociais',
    categoriaOriginal: 'Chamada Estática (Feed + Story)',
    detalhes: 'Card Feed (4:5) e Story (9:16) do módulo "Hermenêutica" com Prof. William Chaves. Aulas de 20 a 23.',
    prazo: 'Terça-feira, dia 20 (3 dias úteis)',
    statusPrazo: 'Dentro do Prazo',
    deliveryLabel: MANAGER_SENT_LABEL,
    status: 'pronto',
    createdAt: 'Hoje, 09:40'
  },
  {
    id: 'FLW-102',
    ministerio: 'Legacy',
    cliente: 'Legacy — Sergio & Thalia',
    categoria: 'Design',
    categoriaOriginal: 'Tema de Culto (1 Tema + 2 Tópicos)',
    detalhes: 'Tema de Culto para telão LED (1 Tema Principal + 2 Tópicos) e desdobramento de Backdrop Vertical 175x255cm.',
    prazo: 'Sábado, dia 21 às 19h30',
    statusPrazo: 'Dentro do Prazo',
    deliveryLabel: MANAGER_SENT_LABEL,
    status: 'producao',
    createdAt: 'Há 1h'
  },
  {
    id: 'FLW-103',
    ministerio: 'WeCare',
    cliente: 'WeCare — Williams Serrão',
    categoria: 'Vídeo',
    categoriaOriginal: 'Chamada em Vídeo (Reels / Telão)',
    detalhes: 'Chamada em vídeo "Natal da Aliança": versão vertical 9:16 (Reels/Stories) + 16:9 para telão da Nave Principal.',
    prazo: 'Domingo · 3 Cultos',
    statusPrazo: 'Dentro do Prazo',
    deliveryLabel: MANAGER_SENT_LABEL,
    status: 'triagem',
    createdAt: 'Há 18 min'
  }
];

const SIMULATION_SCENARIOS = [
  [
    'Oi Flow! Precisamos de uma chamada de divulgação para o nosso ministério.',
    'Sou a Grenda do ministério Carisma.',
    'Queremos Chamada Estática (Feed + Story).',
    'Módulo "Hermenêutica Bíblica" com Prof. William Chaves às 19h30 no Auditório Carisma. Paleta escura com acento em vermelho.',
    'Para sábado, às 19h30 (3 dias de antecedência).'
  ],
  [
    'Olá! Sou do ministério GCs e precisamos de um Tema de Culto para o telão.',
    'Tema Principal: "Crescendo em Comunhão" (Atos 2:42) | Tópico 1: A mesa como lugar de cuidado | Tópico 2: Multiplicando discípulos na cidade.',
    'Para quinta-feira, às 19h30 (dentro do prazo de 3 dias).'
  ],
  [
    'Oi Flow! Aqui é do ministério Lucas, queremos uma chamada em vídeo para nossa próxima ação.',
    'Vídeo vertical 9:16 dinâmico convidando a igreja para o mutirão solidário, com trilha leve e informações de data e local na tela.',
    'Para domingo, no culto das 18h (4 dias de antecedência).'
  ]
];

/* ==========================================================================
   ESTADO GLOBAL
   ========================================================================== */
const state = {
  messages: [],
  cards: [],
  draft: createEmptyDraft(),
  lastAskedField: null,
  awaitingFormatClarification: false,
  sentCardId: null,

  // Streaming & Controle
  isGenerating: false,
  abortController: null,
  simulationRunId: 0,
  simIndex: 0,

  // Smart Auto-Scroll
  autoScrollPinned: true,

  // Split-View Canvas
  canvasOpen: false,
  canvasTab: 'briefing',
  boardStatusFilter: 'all',
  boardSearch: '',

  // Composer inline autocomplete
  acMatches: [],
  acActiveIndex: 0,
  acTriggerMode: null // '@' | 'contextual'
};

const appConfig = {
  backendEndpoint: localStorage.getItem('flw_backend_endpoint') || SEND_BRIEFING_ENDPOINT,
  geminiKey: localStorage.getItem('flw_gemini_api_key') || ''
};

function createEmptyDraft() {
  return {
    ministerio: '',
    responsavel: '',
    cliente: '',
    categoria: '',
    detalhes: '',
    prazo: ''
  };
}

/* ==========================================================================
   UTILITÁRIOS DE TEXTO, NORMALIZAÇÃO E BUSCA DOS 18 MINISTÉRIOS
   ========================================================================== */
function normalizeStr(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function escapeHTML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function filterMinistries(query = '') {
  const q = normalizeStr(query);
  if (!q) return FLW_MINISTRIES;
  return FLW_MINISTRIES.filter(m => {
    const normName = normalizeStr(m.name);
    if (normName.includes(q)) return true;
    return m.aliases.some(a => normalizeStr(a).includes(q));
  });
}

function highlightMatch(label, query) {
  const safeLabel = escapeHTML(label);
  const cleanQ = (query || '').trim();
  if (!cleanQ) return safeLabel;
  const normLabel = normalizeStr(label);
  const normQ = normalizeStr(cleanQ);
  const idx = normLabel.indexOf(normQ);
  if (idx === -1) return safeLabel;
  const before = escapeHTML(label.slice(0, idx));
  const match = escapeHTML(label.slice(idx, idx + cleanQ.length));
  const after = escapeHTML(label.slice(idx + cleanQ.length));
  return `${before}<mark>${match}</mark>${after}`;
}

function formatClientDisplay(ministerio, responsavel) {
  const m = (ministerio || '').trim();
  const r = (responsavel || '').trim();
  if (m && r) return `${m} — ${r}`;
  return m || r || '';
}

function nowTimeStr() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ==========================================================================
   RENDERIZADOR MARKDOWN COMPLETO (SEGURO, TABELAS, CÓDIGO COM COPIAR)
   ========================================================================== */
function renderInlineMarkdown(escapedLine) {
  let out = escapedLine;
  // Código inline
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links seguros http/https
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Negrito e itálico
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  return out;
}

function renderMarkdown(raw = '') {
  if (!raw) return '';
  const text = String(raw).replace(/\r\n/g, '\n');

  // Extrai blocos de código primeiro para preservar conteúdo bruto
  const codeBlocks = [];
  const withTokens = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const cleanCode = code.replace(/\n$/, '');
    codeBlocks.push({ lang: lang || 'texto', code: cleanCode });
    return `\n@@CODEBLOCK_${idx}@@\n`;
  });

  const lines = withTokens.split('\n');
  const html = [];
  let i = 0;

  const isTableSeparator = (line) => /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/.test(line);
  const splitTableRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Placeholder de bloco de código
    const codeToken = trimmed.match(/^@@CODEBLOCK_(\d+)@@$/);
    if (codeToken) {
      const blk = codeBlocks[Number(codeToken[1])];
      html.push(
        `<div class="md-code-block">` +
          `<div class="md-code-head">` +
            `<span>${escapeHTML(blk.lang)}</span>` +
            `<button type="button" class="btn-copy-code" data-code="${escapeHTML(blk.code)}" aria-label="Copiar código">` +
              `<i class="fa-regular fa-copy" aria-hidden="true"></i> Copiar` +
            `</button>` +
          `</div>` +
          `<pre><code>${escapeHTML(blk.code)}</code></pre>` +
        `</div>`
      );
      i++;
      continue;
    }

    // Títulos
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
      html.push(`<${tag}>${renderInlineMarkdown(escapeHTML(headingMatch[2]))}</${tag}>`);
      i++;
      continue;
    }

    // Tabela Markdown
    if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = splitTableRow(trimmed);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().includes('|') && !lines[i].trim().startsWith('@@CODEBLOCK_')) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${headers.map(h => `<th>${renderInlineMarkdown(escapeHTML(h))}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${rows.map(r => `<tr>${headers.map((_, ci) => `<td>${renderInlineMarkdown(escapeHTML(r[ci] || ''))}</td>`).join('')}</tr>`).join('')}</tbody>`;
      html.push(`<div class="md-table-wrap"><table class="md-table">${thead}${tbody}</table></div>`);
      continue;
    }

    // Citação (Blockquote)
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(renderInlineMarkdown(escapeHTML(lines[i].trim().replace(/^>\s?/, ''))));
        i++;
      }
      html.push(`<blockquote class="md-quote">${quoteLines.join('<br>')}</blockquote>`);
      continue;
    }

    // Lista não-ordenada
    if (/^[-*•]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(`<li>${renderInlineMarkdown(escapeHTML(lines[i].trim().replace(/^[-*•]\s+/, '')))}</li>`);
        i++;
      }
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Lista ordenada
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${renderInlineMarkdown(escapeHTML(lines[i].trim().replace(/^\d+\.\s+/, '')))}</li>`);
        i++;
      }
      html.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Parágrafo comum
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('@@CODEBLOCK_') &&
      !/^\s*[-*•]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !(lines[i].trim().includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paraLines.push(renderInlineMarkdown(escapeHTML(lines[i])));
      i++;
    }
    html.push(`<p>${paraLines.join('<br>')}</p>`);
  }

  return html.join('');
}

/* ==========================================================================
   PERSISTÊNCIA & SANITIZAÇÃO DE DEMANDAS (ZERO VAZAMENTO DE E-MAIL)
   ========================================================================== */
function loadCardsFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY_CARDS) || localStorage.getItem('flw_kanban_cards_v5');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        state.cards = parsed.map(c => ({
          ...c,
          deliveryLabel: MANAGER_SENT_LABEL
        }));
        saveCardsToStorage();
        return;
      }
    } catch { /* fallback */ }
  }
  state.cards = INITIAL_DEMANDS.map(c => ({ ...c }));
  saveCardsToStorage();
}

function saveCardsToStorage() {
  localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(state.cards));
}

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadCardsFromStorage();
  renderBoardView();
  syncCanvasBriefingForm();
  updateProgressUI();
  refreshSettingsStatus();

  // Inicializa Comboboxes com Autocomplete dos 18 Ministérios (Canvas + Modal Manual)
  initMinistryCombobox({
    wrapperId: 'canvasMinistryCombobox',
    inputId: 'canvasMinistryInput',
    listId: 'canvasMinistryList',
    onSelect: (ministryName) => {
      state.draft.ministerio = ministryName;
      state.draft.cliente = formatClientDisplay(state.draft.ministerio, state.draft.responsavel);
      state.sentCardId = null;
      updateProgressUI();
      syncCanvasBriefingForm({ skipFocusIds: ['canvasMinistryInput'] });
      refreshOpenBriefingArtifactInChat();
    }
  });

  initMinistryCombobox({
    wrapperId: 'manualMinistryCombobox',
    inputId: 'manualMinistryInput',
    listId: 'manualMinistryList'
  });

  bindEvents();
  initMobileViewportSync();
  initPWA();
  handleLaunchParams();

  if (window.matchMedia('(pointer: fine)').matches) {
    document.getElementById('chatInput')?.focus();
  }
});

/* ==========================================================================
   COMPONENTE ACESSÍVEL: COMBOBOX AUTOCOMPLETE DOS 18 MINISTÉRIOS
   ========================================================================== */
function initMinistryCombobox({ wrapperId, inputId, listId, onSelect }) {
  const wrapper = document.getElementById(wrapperId);
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  const toggleBtn = wrapper?.querySelector('.ac-toggle-btn');
  if (!wrapper || !input || !list) return;

  let activeIdx = 0;
  let currentMatches = [];

  const closeList = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  };

  const renderList = (query = '') => {
    currentMatches = filterMinistries(query);
    activeIdx = 0;
    if (!currentMatches.length) {
      list.innerHTML = `<li class="ac-empty">Nenhum ministério encontrado para "${escapeHTML(query)}"</li>`;
    } else {
      list.innerHTML = currentMatches.map((m, idx) => `
        <li class="ac-option ${idx === 0 ? 'active' : ''}" role="option" data-name="${escapeHTML(m.name)}" aria-selected="${idx === 0}">
          <span>${highlightMatch(m.name, query)}</span>
        </li>
      `).join('');
    }
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  const selectValue = (name) => {
    input.value = name;
    closeList();
    if (onSelect) onSelect(name);
  };

  const updateHighlight = () => {
    const items = list.querySelectorAll('.ac-option');
    items.forEach((el, idx) => {
      const isAct = idx === activeIdx;
      el.classList.toggle('active', isAct);
      el.setAttribute('aria-selected', String(isAct));
      if (isAct) el.scrollIntoView({ block: 'nearest' });
    });
  };

  input.addEventListener('focus', () => renderList(input.value));
  input.addEventListener('input', () => {
    renderList(input.value);
    if (onSelect) onSelect(input.value.trim());
  });

  input.addEventListener('keydown', (e) => {
    if (list.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      renderList(input.value);
      return;
    }
    if (list.hidden) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentMatches.length) {
        activeIdx = (activeIdx + 1) % currentMatches.length;
        updateHighlight();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentMatches.length) {
        activeIdx = (activeIdx - 1 + currentMatches.length) % currentMatches.length;
        updateHighlight();
      }
    } else if (e.key === 'Enter' && currentMatches.length) {
      e.preventDefault();
      selectValue(currentMatches[activeIdx].name);
    } else if (e.key === 'Escape') {
      closeList();
    }
  });

  list.addEventListener('mousedown', (e) => {
    const opt = e.target.closest('.ac-option');
    if (!opt) return;
    e.preventDefault();
    selectValue(opt.dataset.name);
  });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (list.hidden) {
        input.focus();
        renderList('');
      } else {
        closeList();
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) closeList();
  });
}

/* ==========================================================================
   AUTOCOMPLETE INLINE NO COMPOSER (@ministério ou etapa de ministério)
   ========================================================================== */
function updateComposerAutocomplete() {
  const input = document.getElementById('chatInput');
  const box = document.getElementById('composerAutocomplete');
  if (!input || !box) return;

  const val = input.value;
  const atMatch = val.match(/(?:^|\s)@([^\s@]*)$/);

  let query = null;
  let mode = null;

  if (atMatch) {
    query = atMatch[1];
    mode = '@';
  } else if (state.lastAskedField === 'cliente' && val.trim().length >= 1 && val.trim().length <= 24) {
    const matches = filterMinistries(val.trim());
    if (matches.length > 0 && matches.length <= 18) {
      query = val.trim();
      mode = 'contextual';
    }
  }

  if (query === null) {
    closeComposerAutocomplete();
    return;
  }

  const matches = filterMinistries(query);
  if (!matches.length) {
    closeComposerAutocomplete();
    return;
  }

  state.acMatches = matches;
  state.acActiveIndex = 0;
  state.acTriggerMode = mode;

  box.innerHTML = `
    <div class="composer-ac-header">
      <span>Ministérios .FLW (${matches.length})</span>
      <span>↑↓ navegar · Enter selecionar</span>
    </div>
    ${matches.map((m, idx) => `
      <button type="button" class="composer-ac-item ${idx === 0 ? 'active' : ''}" role="option"
        data-name="${escapeHTML(m.name)}" aria-selected="${idx === 0}">
        <span>${highlightMatch(m.name, query)}</span>
      </button>
    `).join('')}
  `;
  box.hidden = false;
}

function closeComposerAutocomplete() {
  const box = document.getElementById('composerAutocomplete');
  if (box) box.hidden = true;
  state.acMatches = [];
  state.acActiveIndex = 0;
  state.acTriggerMode = null;
}

function applyComposerAutocomplete(ministryName) {
  const input = document.getElementById('chatInput');
  if (!input) return;

  if (state.acTriggerMode === '@') {
    input.value = input.value.replace(/(?:^|\s)@([^\s@]*)$/, (m) => {
      const leadSpace = m.startsWith(' ') ? ' ' : '';
      return `${leadSpace}${ministryName} `;
    });
  } else {
    input.value = `Sou do ministério ${ministryName}`;
  }

  closeComposerAutocomplete();
  autoResizeTextarea(input);
  input.focus();
}

/* ==========================================================================
   SMART AUTO-SCROLL (PAUSA SE USUÁRIO ROLAR PARA CIMA)
   ========================================================================== */
function isNearBottom(el) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 72;
}

function scrollToBottomIfPinned(force = false) {
  const area = document.getElementById('chatScrollArea');
  if (!area) return;
  if (force) {
    state.autoScrollPinned = true;
    updateScrollBottomButton();
  }
  if (state.autoScrollPinned) {
    area.scrollTop = area.scrollHeight;
  }
}

function updateScrollBottomButton() {
  const btn = document.getElementById('btnScrollBottom');
  if (!btn) return;
  btn.hidden = state.autoScrollPinned || state.messages.length === 0;
}

/* ==========================================================================
   MOTOR DE CONVERSA, HEURÍSTICAS & STREAMING TOKEN-A-TOKEN
   ========================================================================== */
function analyzeTextForDraftHeuristics(text, draftTarget = state.draft, contextFlags = state) {
  const lower = normalizeStr(text);

  // 1. Detectar qualquer um dos 18 Ministérios oficiais
  for (const m of FLW_MINISTRIES) {
    const normName = normalizeStr(m.name);
    const regexName = new RegExp(`(^|[^a-z0-9])${normName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
    const matched = regexName.test(lower) || m.aliases.some(a => {
      const na = normalizeStr(a);
      if (na.length <= 2) {
        return new RegExp(`(^|[^a-z0-9])${na}([^a-z0-9]|$)`, 'i').test(lower);
      }
      return lower.includes(na);
    });

    if (matched) {
      draftTarget.ministerio = m.name;
      break;
    }
  }

  // Extrair nome do solicitante (se informado)
  const personMatch = text.match(/(?:aqui é (?:o|a)?|sou (?:o|a)?|meu nome é|me chamo)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i);
  if (personMatch) {
    const candidate = personMatch[1].replace(/\b(do|da|de|ministério|ministerio|seminário|seminario)\b.*$/i, '').trim();
    if (candidate && normalizeStr(candidate) !== normalizeStr(draftTarget.ministerio)) {
      draftTarget.responsavel = candidate;
    }
  } else if (!draftTarget.ministerio && contextFlags.lastAskedField === 'cliente' && text.trim().length <= 42) {
    draftTarget.ministerio = text.replace(/[,.!?;:]+$/, '').trim();
  }

  draftTarget.cliente = formatClientDisplay(draftTarget.ministerio, draftTarget.responsavel);

  // 2. Categoria & Formato (Chamadas: Estática vs Vídeo vs Completo)
  const mentionsVideo = /\b(video|reels|gravar|gravacao|edicao|motion|dinamic[oa])\b/i.test(lower);
  const mentionsStatic = /\b(estatica|estatico|feed|story|stories|card|post|carrossel)\b/i.test(lower);
  const mentionsChamada = /\b(chamada|divulgacao|convite|anuncio|lancamento)\b/i.test(lower);

  if (mentionsChamada || contextFlags.awaitingFormatClarification) {
    if (mentionsVideo && mentionsStatic) {
      draftTarget.categoria = 'Chamada Completa (Vídeo + Feed & Story)';
      contextFlags.awaitingFormatClarification = false;
    } else if (mentionsStatic) {
      draftTarget.categoria = 'Chamada Estática (Feed + Story)';
      contextFlags.awaitingFormatClarification = false;
    } else if (mentionsVideo) {
      draftTarget.categoria = 'Chamada em Vídeo (Reels / Telão)';
      contextFlags.awaitingFormatClarification = false;
    } else if (!draftTarget.categoria) {
      contextFlags.awaitingFormatClarification = true;
    }
  }

  if (!draftTarget.categoria && !contextFlags.awaitingFormatClarification) {
    const patterns = [
      { keys: ['tema de culto', 'tema da pregacao', 'telao', '1 tema', '2 topicos'], label: 'Tema de Culto (1 Tema + 2 Tópicos)' },
      { keys: ['chamada estatica', 'feed e story', 'feed + story', 'feed 4:5'], label: 'Chamada Estática (Feed + Story)' },
      { keys: ['chamada em video'], label: 'Chamada em Vídeo (Reels / Telão)' },
      { keys: ['camisa', 'camiseta', 'uniforme', 'estampa'], label: 'Design de Camisa' },
      { keys: ['lona', 'banner', 'backdrop', 'faixa', 'impresso'], label: 'Material Impresso (Lona / Backdrop)' },
      { keys: ['fotografia', 'foto', 'fotos', 'cobertura fotografica', 'batismo'], label: 'Cobertura Fotográfica' },
      { keys: ['video', 'reels', 'abertura', 'lagoinha news', 'audiovisual'], label: 'Produção / Edição de Vídeo' },
      { keys: ['social media', 'story', 'stories', 'feed', 'carrossel', 'instagram'], label: 'Chamada Estática (Feed + Story)' },
      { keys: ['design', 'arte', 'criativo', 'layout'], label: 'Design Gráfico' }
    ];
    for (const pat of patterns) {
      if (pat.keys.some(k => lower.includes(k))) {
        draftTarget.categoria = pat.label;
        break;
      }
    }
  }

  // 3. Prazo
  const dateRegex = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|(?:segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)(?:-feira)?(?:\s*,?\s*dia\s*\d{1,2})?(?:\s+(?:de\s+manhã|à\s+noite|noite|manhã))?|dia\s+\d{1,2}(?:\s+de\s+[a-zç]+)?|próxima semana|semana que vem)/i;
  const timeRegex = /(\d{1,2}h(?:\d{2})?|\d{1,2}:\d{2})/;
  const dateMatch = text.match(dateRegex);
  const timeMatch = text.match(timeRegex);

  if (dateMatch) {
    let pStr = dateMatch[1].trim();
    if (timeMatch && !pStr.includes(timeMatch[1])) pStr += ` às ${timeMatch[1]}`;
    draftTarget.prazo = pStr;
  } else if (contextFlags.lastAskedField === 'prazo' && text.trim().length > 2) {
    draftTarget.prazo = text.replace(/^(?:para|até|ate|no dia|na)\s+/i, '').replace(/[.!]+$/, '').trim();
  }

  // 4. Detalhes
  const detailKeywords = [
    'topico', 'titulo', 'versiculo', 'samuel', 'atos', 'salmos', 'joao',
    'largura', 'altura', 'metro', 'cm', 'qr code', 'cores', 'paleta', 'escura',
    'modulo', 'professor', 'prof.', 'roteiro', 'auditorio', 'nave', 'local', 'mutirao', 'trilha', 'tema principal'
  ];
  const isShortOptionPick = /^(sou |preferimos |queremos |precisamos de |gostaria de solicitar )/i.test(text.trim()) && text.trim().length < 88;
  const hasDetailIndicators = detailKeywords.some(k => lower.includes(k)) || text.length > 82;

  if ((hasDetailIndicators || contextFlags.lastAskedField === 'detalhes') && !isShortOptionPick) {
    const clean = text.trim();
    if (clean.length > 10) {
      if (!draftTarget.detalhes) {
        draftTarget.detalhes = clean;
      } else if (!draftTarget.detalhes.includes(clean)) {
        draftTarget.detalhes += ` · ${clean}`;
      }
    }
  }
}

function recomputeDraftFromHistory() {
  const fresh = createEmptyDraft();
  const flags = { lastAskedField: null, awaitingFormatClarification: false };
  for (const msg of state.messages) {
    if (msg.role === 'user') {
      analyzeTextForDraftHeuristics(msg.content, fresh, flags);
    } else if (msg.askedField) {
      flags.lastAskedField = msg.askedField;
    }
  }
  state.draft = fresh;
  state.lastAskedField = flags.lastAskedField;
  state.awaitingFormatClarification = flags.awaitingFormatClarification;
  state.sentCardId = null;
}

function buildLocalFlowPlan(userText) {
  const lower = normalizeStr(userText);
  const d = state.draft;

  // Pedido de regras & prazos (retorna Markdown rico com tabela responsiva!)
  if (lower.includes('regra') || lower.includes('prazo') && lower.includes('como funciona') || lower.includes('prazos e regras')) {
    return {
      text:
`### Diretrizes de Atendimento .FLW

Nossa equipe é **100% voluntária**. Organizar cada pedido com antecedência garante qualidade e cuidado com quem serve.

| Tipo de Demanda | Padrão / Especificação | Antecedência Mínima |
| :--- | :--- | :--- |
| Chamada Estática | Feed \`4:5\` + Story \`9:16\` | 2 a 3 dias úteis |
| Chamada em Vídeo | Vertical \`9:16\` e/ou Telão \`16:9\` | 3 dias úteis |
| Tema de Culto | **1 Tema Principal + até 2 Tópicos** | 2 a 3 dias úteis |
| Impresso / Camisa | Medidas exatas e texto revisado | 3+ dias úteis |

> Sempre que quiser iniciar um pedido, basta dizer seu ministério ou digitar \`@\` no campo abaixo.`,
      verificationNote: {
        type: 'policy',
        text: 'Política oficial .FLW · Equipe voluntária · Revise textos e datas antes do envio.'
      },
      followUps: [
        { label: 'Solicitar chamada', prompt: 'Precisamos de uma chamada de divulgação para nosso ministério.' },
        { label: 'Solicitar tema de culto', prompt: 'Precisamos de um Tema de Culto para o telão.' },
        { label: 'Escolher meu ministério', action: 'open_ministry_picker' }
      ],
      widget: null,
      askedField: state.lastAskedField
    };
  }

  // Esclarecimento de formato para Chamada
  if (state.awaitingFormatClarification) {
    const greet = d.cliente ? `, **${d.cliente}**` : '';
    return {
      text: `Combinado${greet}. Como você prefere produzir essa **chamada de divulgação**?\n\nEscolha o formato abaixo ou descreva como imaginou:`,
      verificationNote: null,
      followUps: [],
      widget: { type: 'format_picker' },
      askedField: 'formato_chamada'
    };
  }

  // Etapa 1: Ministério / Responsável (com Autocomplete de todos os 18 ministérios!)
  if (!d.ministerio) {
    const catNote = d.categoria ? `Anotado: **${d.categoria}**.\n\n` : '';
    return {
      text: `${catNote}Qual é o **ministério ou departamento** solicitante? Use a busca abaixo para encontrar entre os **18 ministérios** (ou digite \`@\` na caixa de mensagem):`,
      verificationNote: null,
      followUps: [],
      widget: { type: 'ministry_picker' },
      askedField: 'cliente'
    };
  }

  // Etapa 2: Categoria / Formato
  if (!d.categoria) {
    return {
      text: `Perfeito, **${d.cliente}**. Qual **formato de entrega** vocês precisam hoje?`,
      verificationNote: null,
      followUps: [
        { label: 'Tema de Culto', prompt: 'Precisamos de um Tema de Culto (1 Tema + 2 Tópicos).' },
        { label: 'Cobertura Fotográfica', prompt: 'Precisamos de Cobertura Fotográfica.' },
        { label: 'Impresso / Camisa', prompt: 'Precisamos de Material Impresso ou Design de Camisa.' }
      ],
      widget: { type: 'format_picker' },
      askedField: 'categoria'
    };
  }

  // Etapa 3: Detalhes / Escopo
  if (!d.detalhes) {
    const catL = normalizeStr(d.categoria);
    let promptText = `Anotado: **${d.categoria}** para **${d.cliente}**.\n\nQuais são os **detalhes já revisados** do pedido (título, local, horário e referências)?`;
    let verificationNote = null;
    let followUps = [];

    if (catL.includes('culto')) {
      promptText = `Anotado: **${d.categoria}** para **${d.cliente}**.\n\nSeguindo o padrão do telão, envie o **Tema Principal**, **versículo base** e até **2 tópicos objetivos**:`;
      verificationNote = {
        type: 'policy',
        text: 'Padrão de Culto .FLW: 1 Tema Principal + no máximo 2 Tópicos (total de até 3 telas).'
      };
      followUps = [
        { label: 'Inserir modelo (1 Tema + 2 Tópicos)', fillInput: 'Tema Principal: [Título] (Versículo) | Tópico 1: [Texto] | Tópico 2: [Texto]' }
      ];
    } else if (catL.includes('video')) {
      promptText = `Anotado: **${d.categoria}** para **${d.cliente}**.\n\nQual é a **ideia central ou roteiro**, quem participa da gravação (ou se já há material bruto) e quais textos precisam aparecer na tela?`;
    } else if (catL.includes('estatica') || catL.includes('feed')) {
      promptText = `Anotado: **${d.categoria}** para **${d.cliente}**.\n\nQuais informações revisadas entram nas peças de **Feed (4:5)** e **Story (9:16)** (título, data, horário, local e estilo visual)?`;
    } else if (catL.includes('impresso') || catL.includes('camisa')) {
      promptText = `Anotado: **${d.categoria}** para **${d.cliente}**.\n\nInforme as **medidas exatas** (ou cor do tecido), o texto revisado e referências visuais.`;
    }

    return {
      text: promptText,
      verificationNote,
      followUps,
      widget: null,
      askedField: 'detalhes'
    };
  }

  // Etapa 4: Prazo
  if (!d.prazo) {
    return {
      text: `Escopo registrado com sucesso.\n\nPara **qual data, culto ou horário** vocês precisam dessa entrega de **${d.categoria}**?`,
      verificationNote: {
        type: 'policy',
        text: 'Política de prazo .FLW: mínimo de 2 a 3 dias úteis de antecedência para evitar sobrecarga dos voluntários.'
      },
      followUps: [
        { label: 'Quinta · 19h30', prompt: 'Para quinta-feira, culto das 19h30 (3 dias de antecedência).' },
        { label: 'Sábado · 19h30', prompt: 'Para sábado, às 19h30 (3 dias de antecedência).' },
        { label: 'Domingo · 10h / 18h', prompt: 'Para domingo, nos cultos das 10h e 18h.' },
        { label: 'Próxima semana', prompt: 'Para a próxima semana (5 dias de antecedência).' }
      ],
      widget: null,
      askedField: 'prazo'
    };
  }

  // Briefing completo -> Artifact GenUI no Chat + Split-View Canvas!
  return {
    text: `Briefing estruturado para **${d.cliente}**. Confira os detalhes abaixo ou abra no **Canvas lateral** para editar qualquer campo antes de enviar.`,
    verificationNote: {
      type: 'verify',
      text: 'Resumo gerado por IA — verifique datas, textos e ministério antes de confirmar o envio.'
    },
    followUps: [
      { label: 'Editar no Canvas', action: 'open_briefing_canvas' }
    ],
    widget: {
      type: 'briefing_artifact',
      snapshot: { ...d },
      sent: false,
      cardId: null
    },
    askedField: null
  };
}

function getIntermediateStatusSteps(userText) {
  const lower = normalizeStr(userText);
  if (lower.includes('regra') || lower.includes('prazos e regras')) {
    return ['Consultando diretrizes oficiais do .FLW...'];
  }
  if (!state.draft.ministerio) {
    return ['Analisando sua solicitação...', 'Carregando lista de 18 ministérios .FLW...'];
  }
  if (state.awaitingFormatClarification || !state.draft.categoria) {
    return ['Identificando categoria da demanda...', 'Preparando formatos de entrega...'];
  }
  if (state.draft.ministerio && state.draft.categoria && state.draft.detalhes && state.draft.prazo) {
    return ['Validando prazo e completude...', 'Estruturando briefing no Canvas...'];
  }
  return ['Analisando contexto da conversa...', 'Organizando próxima etapa...'];
}

/* ==========================================================================
   DISPARO DE RESPOSTA COM STATUS EXPLÍCITO + STREAMING + PARAR GERAÇÃO
   ========================================================================== */
async function sendUserPrompt(rawText) {
  const trimmed = (rawText || '').trim();
  if (!trimmed || state.isGenerating) return;

  closeComposerAutocomplete();
  closeAllDropdowns();

  // Atalho se usuário digitar "confirmar" com briefing pronto
  if (isDraftComplete() && !state.sentCardId && /^(confirmar|confirmo|pode enviar|sim|enviar)$/i.test(trimmed)) {
    appendMessageObject({ role: 'user', content: trimmed });
    await confirmAndDispatchBriefing();
    return;
  }

  appendMessageObject({ role: 'user', content: trimmed });
  analyzeTextForDraftHeuristics(trimmed);
  updateProgressUI();
  syncCanvasBriefingForm();

  await generateAssistantReply(trimmed);
}

async function generateAssistantReply(triggerUserText) {
  if (state.isGenerating) stopGeneration();

  state.isGenerating = true;
  state.abortController = new AbortController();
  const signal = state.abortController.signal;
  setComposerGeneratingMode(true);

  const aiMsg = appendMessageObject({
    role: 'ai',
    content: '',
    status: 'thinking',
    statusText: getIntermediateStatusSteps(triggerUserText)[0],
    verificationNote: null,
    followUps: [],
    widget: null,
    feedback: null
  });

  scrollToBottomIfPinned(true);

  const statusSteps = getIntermediateStatusSteps(triggerUserText);
  const statusTimer = setTimeout(() => {
    if (!signal.aborted && aiMsg.status === 'thinking' && statusSteps[1]) {
      aiMsg.statusText = statusSteps[1];
      updateMessageDOM(aiMsg);
    }
  }, 340);

  try {
    // Tenta backend IA / Gemini se configurado e não aguardando clarificação de widget
    let plan = null;
    const remoteText = (!state.awaitingFormatClarification && state.draft.ministerio)
      ? await tryRemoteAI(signal)
      : null;

    if (signal.aborted) {
      aiMsg.status = 'stopped';
      updateMessageDOM(aiMsg);
      return;
    }

    if (remoteText) {
      plan = parseRemoteAIReply(remoteText);
    } else {
      await delayWithAbort(540, signal);
      if (signal.aborted) {
        aiMsg.status = 'stopped';
        updateMessageDOM(aiMsg);
        return;
      }
      plan = buildLocalFlowPlan(triggerUserText);
    }

    clearTimeout(statusTimer);

    aiMsg.status = 'streaming';
    aiMsg.askedField = plan.askedField || null;
    state.lastAskedField = plan.askedField || null;

    // Stream token-a-token
    await streamTokensIntoMessage(aiMsg, plan.text, signal);

    if (signal.aborted) {
      aiMsg.status = 'stopped';
      updateMessageDOM(aiMsg);
      return;
    }

    aiMsg.status = 'complete';
    aiMsg.verificationNote = plan.verificationNote || null;
    aiMsg.followUps = plan.followUps || [];
    aiMsg.widget = plan.widget || null;
    updateMessageDOM(aiMsg);

    updateProgressUI();
    syncCanvasBriefingForm();

    // Em desktop largo, abre o Canvas suavemente ao concluir um briefing
    if (plan.widget?.type === 'briefing_artifact' && window.innerWidth >= 1160 && !state.canvasOpen) {
      toggleCanvas(true, 'briefing');
    }

    scrollToBottomIfPinned();
  } catch (err) {
    clearTimeout(statusTimer);
    if (signal.aborted) {
      aiMsg.status = 'stopped';
      updateMessageDOM(aiMsg);
      return;
    }
    console.warn('Fallback para motor guiado local:', err);
    const fallback = buildLocalFlowPlan(triggerUserText);
    aiMsg.status = 'complete';
    aiMsg.content = fallback.text;
    aiMsg.verificationNote = fallback.verificationNote;
    aiMsg.followUps = fallback.followUps;
    aiMsg.widget = fallback.widget;
    updateMessageDOM(aiMsg);
  } finally {
    clearTimeout(statusTimer);
    state.isGenerating = false;
    state.abortController = null;
    setComposerGeneratingMode(false);
    document.getElementById('chatInput')?.focus();
  }
}

function stopGeneration() {
  if (!state.isGenerating) return;
  state.simulationRunId++;
  if (state.abortController) {
    state.abortController.abort();
  }
  state.isGenerating = false;
  setComposerGeneratingMode(false);
}

async function streamTokensIntoMessage(msgObj, fullText, signal) {
  const tokens = fullText.match(/\S+\s*|\n+/g) || [fullText];
  let acc = '';
  for (let i = 0; i < tokens.length; i++) {
    if (signal.aborted) return;
    acc += tokens[i];
    msgObj.content = acc;
    updateMessageDOM(msgObj, true);
    scrollToBottomIfPinned();
    const waitMs = tokens[i].includes('\n') ? 26 : 16;
    await delayWithAbort(waitMs, signal);
  }
}

function delayWithAbort(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
  });
}

async function tryRemoteAI(signal) {
  const contents = state.messages
    .filter(m => m.content && m.status !== 'thinking')
    .map(m => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  if (appConfig.geminiKey && appConfig.geminiKey.length > 10) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(appConfig.geminiKey)}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: FLW_SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.45, maxOutputTokens: 900 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const txt = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n');
        if (txt) return txt;
      }
    } catch { /* fallback */ }
  }

  try {
    const res = await fetch(CHAT_PROXY_ENDPOINT, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemInstruction: FLW_SYSTEM_PROMPT, contents })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ok && data.text ? data.text : null;
  } catch {
    return null;
  }
}

function parseRemoteAIReply(rawText) {
  let cleanText = rawText;
  let extracted = null;
  const jsonMatch = rawText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i)
    || rawText.match(/(\{\s*"status"\s*:\s*"briefing_completo"[\s\S]*?\})\s*$/i);

  if (jsonMatch?.[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (parsed && (parsed.status === 'briefing_completo' || parsed.categoria)) {
        extracted = parsed;
        cleanText = rawText.replace(jsonMatch[0], '').trim();
      }
    } catch { /* ignore */ }
  }

  if (extracted) {
    state.draft.ministerio = extracted.ministerio || state.draft.ministerio || extracted.cliente || '';
    state.draft.responsavel = extracted.responsavel || state.draft.responsavel || '';
    state.draft.cliente = extracted.cliente || formatClientDisplay(state.draft.ministerio, state.draft.responsavel);
    state.draft.categoria = extracted.categoria || state.draft.categoria || 'Design Gráfico';
    state.draft.detalhes = extracted.detalhes || state.draft.detalhes || '';
    state.draft.prazo = extracted.prazo || state.draft.prazo || '';

    return {
      text: cleanText || `Briefing pronto para revisão de **${state.draft.cliente}**.`,
      verificationNote: {
        type: 'verify',
        text: 'Resumo gerado por IA — revise os dados antes de confirmar o envio.'
      },
      followUps: [{ label: 'Editar no Canvas', action: 'open_briefing_canvas' }],
      widget: { type: 'briefing_artifact', snapshot: { ...state.draft }, sent: false, cardId: null },
      askedField: null
    };
  }

  return {
    text: cleanText,
    verificationNote: null,
    followUps: [],
    widget: !state.draft.ministerio ? { type: 'ministry_picker' } : null,
    askedField: !state.draft.ministerio ? 'cliente' : null
  };
}

/* ==========================================================================
   RENDERIZAÇÃO DE MENSAGENS, AÇÕES CONTEXTUAIS & GENUI WIDGETS
   ========================================================================== */
function appendMessageObject(partial) {
  const msg = {
    id: uid('msg'),
    timestamp: nowTimeStr(),
    status: 'complete',
    feedback: null,
    ...partial
  };
  state.messages.push(msg);
  syncEmptyVsStreamVisibility();
  renderAllMessages();
  return msg;
}

function syncEmptyVsStreamVisibility() {
  const hasMsgs = state.messages.length > 0;
  document.getElementById('emptyState').hidden = hasMsgs;
  document.getElementById('chatMessages').hidden = !hasMsgs;
  document.getElementById('briefingProgressBar').hidden = !hasMsgs;
}

function renderAllMessages() {
  const stream = document.getElementById('chatMessages');
  if (!stream) return;
  stream.innerHTML = '';
  state.messages.forEach((msg, idx) => {
    const isLatest = idx === state.messages.length - 1;
    stream.appendChild(createMessageElement(msg, isLatest));
  });
}

function updateMessageDOM(msg, streamingOnly = false) {
  const existing = document.getElementById(msg.id);
  if (!existing) {
    renderAllMessages();
    return;
  }

  if (streamingOnly && msg.role === 'ai') {
    const bodyEl = existing.querySelector('.ai-content-slot');
    if (bodyEl) {
      bodyEl.innerHTML = `<div class="md-prose">${renderMarkdown(msg.content)}<span class="streaming-cursor" aria-hidden="true"></span></div>`;
      return;
    }
  }

  const isLatest = state.messages[state.messages.length - 1]?.id === msg.id;
  const fresh = createMessageElement(msg, isLatest);
  existing.replaceWith(fresh);
}

function createMessageElement(msg, isLatest) {
  const article = document.createElement('article');
  article.id = msg.id;
  article.className = `turn turn-${msg.role} ${isLatest ? 'is-latest' : ''}`;

  if (msg.role === 'user') {
    article.innerHTML = `
      <div class="user-bubble-wrap">
        <div class="user-bubble">${escapeHTML(msg.content)}</div>
        <div class="msg-actions" role="toolbar" aria-label="Ações da sua mensagem">
          <button type="button" class="msg-action-btn" data-action="edit-prompt" data-id="${msg.id}" aria-label="Editar mensagem">
            <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i> Editar
          </button>
          <button type="button" class="msg-action-btn" data-action="copy-msg" data-id="${msg.id}" aria-label="Copiar mensagem">
            <i class="fa-regular fa-copy" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;
    return article;
  }

  // Turno da IA (Flow)
  let mainContentHTML = '';
  if (msg.status === 'thinking') {
    mainContentHTML = `
      <div class="ai-thinking-status" role="status" aria-live="polite">
        <span class="status-pulse-dot" aria-hidden="true"></span>
        <span class="status-shimmer-text">${escapeHTML(msg.statusText || 'Analisando...')}</span>
      </div>
    `;
  } else {
    const cursor = msg.status === 'streaming' ? '<span class="streaming-cursor" aria-hidden="true"></span>' : '';
    const stoppedNote = msg.status === 'stopped' ? '<p class="stopped-caption">Geração interrompida.</p>' : '';
    mainContentHTML = `
      <div class="md-prose">${renderMarkdown(msg.content)}${cursor}</div>
      ${stoppedNote}
    `;
  }

  const verificationHTML = msg.verificationNote ? `
    <div class="verification-note ${msg.verificationNote.type === 'sent' ? 'note-sent' : ''}">
      <i class="${msg.verificationNote.type === 'sent' ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle-dot'}" aria-hidden="true"></i>
      <span>${escapeHTML(msg.verificationNote.text)}</span>
    </div>
  ` : '';

  const showActions = msg.status === 'complete' || msg.status === 'stopped';
  const actionsHTML = showActions ? `
    <div class="msg-actions" role="toolbar" aria-label="Ações da resposta">
      <button type="button" class="msg-action-btn" data-action="copy-msg" data-id="${msg.id}" aria-label="Copiar resposta">
        <i class="fa-regular fa-copy" aria-hidden="true"></i> Copiar
      </button>
      <button type="button" class="msg-action-btn" data-action="regenerate" data-id="${msg.id}" aria-label="Regenerar resposta">
        <i class="fa-solid fa-rotate-right" aria-hidden="true"></i> Regenerar
      </button>
      <button type="button" class="msg-action-btn feedback-up" data-action="feedback" data-val="up" data-id="${msg.id}"
        aria-label="Resposta útil" aria-pressed="${msg.feedback === 'up'}">
        <i class="fa-regular fa-thumbs-up" aria-hidden="true"></i>
      </button>
      <button type="button" class="msg-action-btn feedback-down" data-action="feedback" data-val="down" data-id="${msg.id}"
        aria-label="Resposta pode melhorar" aria-pressed="${msg.feedback === 'down'}">
        <i class="fa-regular fa-thumbs-down" aria-hidden="true"></i>
      </button>
    </div>
  ` : '';

  const followUpsHTML = (isLatest && showActions && msg.followUps?.length) ? `
    <div class="followup-row" role="group" aria-label="Próximos passos sugeridos">
      ${msg.followUps.map((fu, idx) => `
        <button type="button" class="followup-chip" data-followup-msg="${msg.id}" data-followup-idx="${idx}">
          ${escapeHTML(fu.label)}
        </button>
      `).join('')}
    </div>
  ` : '';

  article.innerHTML = `
    <div class="ai-turn-grid">
      <div class="ai-avatar" aria-hidden="true">🐑</div>
      <div class="ai-body-col">
        <div class="ai-sender-row">
          <span class="ai-sender-name">Flow</span>
          <span>· ${escapeHTML(msg.timestamp)}</span>
        </div>
        <div class="ai-content-slot">${mainContentHTML}</div>
        <div class="ai-widget-slot"></div>
        ${verificationHTML}
        ${actionsHTML}
        ${followUpsHTML}
      </div>
    </div>
  `;

  if (msg.widget && showActions) {
    const slot = article.querySelector('.ai-widget-slot');
    const widgetEl = buildInlineWidgetElement(msg.widget, msg);
    if (widgetEl) slot.appendChild(widgetEl);
  }

  return article;
}

/* ==========================================================================
   GENUI WIDGETS EMBUTIDOS NO CHAT (18 MINISTÉRIOS AUTOCOMPLETE / BRIEFING)
   ========================================================================== */
function buildInlineWidgetElement(widget, msgObj) {
  if (widget.type === 'ministry_picker') {
    const card = document.createElement('div');
    card.className = 'inline-card';
    card.innerHTML = `
      <div class="inline-card-head">
        <span class="inline-card-title">Ministérios e Departamentos</span>
        <span class="inline-card-meta">${FLW_MINISTRIES.length} disponíveis</span>
      </div>
      <div class="ministry-picker-inputs">
        <div class="ministry-search-wrap">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input type="text" class="ministry-search-input" role="combobox" aria-autocomplete="list"
            placeholder="Buscar ministério (ex: Carisma, GCs, Lucas...)" aria-label="Filtrar ministérios">
        </div>
        <input type="text" class="ministry-person-input" placeholder="Seu nome (opcional)" aria-label="Seu nome">
      </div>
      <div class="ministry-chips-grid" role="listbox" aria-label="Lista dos 18 ministérios"></div>
    `;

    const searchInput = card.querySelector('.ministry-search-input');
    const personInput = card.querySelector('.ministry-person-input');
    const grid = card.querySelector('.ministry-chips-grid');
    let highlightedIdx = 0;
    let visibleList = FLW_MINISTRIES;

    const commitMinistry = (ministryName) => {
      const person = personInput.value.trim();
      const prompt = person
        ? `Sou ${person}, do ministério ${ministryName}.`
        : `Sou do ministério ${ministryName}.`;
      sendUserPrompt(prompt);
    };

    const renderChips = (query = '') => {
      visibleList = filterMinistries(query);
      highlightedIdx = 0;
      if (!visibleList.length) {
        grid.innerHTML = `<p class="ministry-empty-match">Nenhum ministério encontrado para "${escapeHTML(query)}". Você pode digitar livremente abaixo.</p>`;
        return;
      }
      grid.innerHTML = visibleList.map((m, idx) => `
        <button type="button" class="ministry-chip-btn ${idx === 0 && query ? 'is-highlighted' : ''}"
          role="option" data-ministry="${escapeHTML(m.name)}">
          ${highlightMatch(m.name, query)}
        </button>
      `).join('');
    };

    searchInput.addEventListener('input', () => renderChips(searchInput.value));
    searchInput.addEventListener('keydown', (e) => {
      if (!visibleList.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        highlightedIdx = (highlightedIdx + 1) % visibleList.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        highlightedIdx = (highlightedIdx - 1 + visibleList.length) % visibleList.length;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        commitMinistry(visibleList[highlightedIdx].name);
        return;
      } else {
        return;
      }
      grid.querySelectorAll('.ministry-chip-btn').forEach((btn, idx) => {
        btn.classList.toggle('is-highlighted', idx === highlightedIdx);
      });
    });

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.ministry-chip-btn');
      if (btn) commitMinistry(btn.dataset.ministry);
    });

    renderChips('');
    return card;
  }

  if (widget.type === 'format_picker') {
    const card = document.createElement('div');
    card.className = 'inline-card';
    card.innerHTML = `
      <div class="inline-card-head">
        <span class="inline-card-title">Escolha o formato</span>
        <span class="inline-card-meta">Chamadas e produção</span>
      </div>
      <div class="format-options-grid">
        <button type="button" class="format-option-btn" data-pick="Chamada Estática (Feed + Story)">
          <strong>Chamada Estática</strong>
          <span>Feed 4:5 + Story 9:16 para redes</span>
        </button>
        <button type="button" class="format-option-btn" data-pick="Chamada em Vídeo (Reels / Telão)">
          <strong>Chamada em Vídeo</strong>
          <span>Vertical 9:16 e/ou telão 16:9</span>
        </button>
        <button type="button" class="format-option-btn" data-pick="Chamada Completa (Vídeo + Feed & Story)">
          <strong>Vídeo + Feed &amp; Story</strong>
          <span>Pacote completo de divulgação</span>
        </button>
      </div>
    `;
    card.addEventListener('click', (e) => {
      const btn = e.target.closest('.format-option-btn');
      if (btn) sendUserPrompt(`Queremos ${btn.dataset.pick}.`);
    });
    return card;
  }

  if (widget.type === 'briefing_artifact') {
    const snap = widget.sent ? widget.snapshot : {
      cliente: state.draft.cliente || widget.snapshot?.cliente || 'Ministério .FLW',
      categoria: state.draft.categoria || widget.snapshot?.categoria || 'Design Gráfico',
      prazo: state.draft.prazo || widget.snapshot?.prazo || 'A definir',
      detalhes: state.draft.detalhes || widget.snapshot?.detalhes || ''
    };

    const card = document.createElement('div');
    card.className = `artifact-card ${widget.sent ? 'is-sent' : ''}`;
    card.innerHTML = `
      <div class="artifact-header">
        <span class="artifact-title">
          <i class="${widget.sent ? 'fa-solid fa-circle-check' : 'fa-regular fa-file-lines'}" aria-hidden="true"></i>
          ${widget.sent ? `Briefing #${escapeHTML(widget.cardId)}` : 'Resumo do Briefing'}
        </span>
        <span class="artifact-badge">${widget.sent ? MANAGER_SENT_LABEL : 'Pronto para confirmar'}</span>
      </div>
      <div class="artifact-rows">
        <div class="artifact-row">
          <span class="artifact-label">Ministério</span>
          <span class="artifact-value">${escapeHTML(snap.cliente)}</span>
        </div>
        <div class="artifact-row">
          <span class="artifact-label">Formato</span>
          <span class="artifact-value">${escapeHTML(snap.categoria)}</span>
        </div>
        <div class="artifact-row">
          <span class="artifact-label">Prazo</span>
          <span class="artifact-value">${escapeHTML(snap.prazo)}</span>
        </div>
        <div class="artifact-row">
          <span class="artifact-label">Detalhes</span>
          <span class="artifact-value">${escapeHTML(snap.detalhes)}</span>
        </div>
      </div>
      <div class="artifact-footer">
        ${widget.sent ? `
          <button type="button" class="btn-ghost btn-sm" data-artifact-action="open-board">Ver nas demandas</button>
          <button type="button" class="btn-ghost btn-sm" data-artifact-action="new-chat">Novo pedido</button>
        ` : `
          <button type="button" class="btn-ghost btn-sm" data-artifact-action="open-canvas">Editar no Canvas</button>
          <button type="button" class="btn-primary btn-sm" data-artifact-action="confirm-send">Confirmar e enviar</button>
        `}
      </div>
    `;

    card.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-artifact-action]');
      if (!btn) return;
      const act = btn.dataset.artifactAction;
      if (act === 'open-canvas') toggleCanvas(true, 'briefing');
      if (act === 'open-board') toggleCanvas(true, 'board');
      if (act === 'new-chat') resetConversation();
      if (act === 'confirm-send') {
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        await confirmAndDispatchBriefing(msgObj);
      }
    });

    return card;
  }

  return null;
}

/* ==========================================================================
   EDITAR PROMPT ANTERIOR & REGENERAR RESPOSTA (CONTROLE DO USUÁRIO)
   ========================================================================== */
function openInlinePromptEditor(msgId) {
  const msg = state.messages.find(m => m.id === msgId && m.role === 'user');
  const article = document.getElementById(msgId);
  if (!msg || !article || state.isGenerating) return;

  const wrap = article.querySelector('.user-bubble-wrap');
  wrap.innerHTML = `
    <div class="user-edit-box">
      <textarea class="user-edit-textarea" aria-label="Editar sua mensagem">${escapeHTML(msg.content)}</textarea>
      <div class="user-edit-actions">
        <button type="button" class="btn-ghost btn-xs" data-edit-cancel>Cancelar</button>
        <button type="button" class="btn-primary btn-xs" data-edit-save>Salvar e reenviar</button>
      </div>
    </div>
  `;

  const ta = wrap.querySelector('.user-edit-textarea');
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);

  wrap.querySelector('[data-edit-cancel]').addEventListener('click', () => renderAllMessages());
  wrap.querySelector('[data-edit-save]').addEventListener('click', async () => {
    const newText = ta.value.trim();
    if (!newText) return;
    const idx = state.messages.findIndex(m => m.id === msgId);
    if (idx === -1) return;
    state.messages[idx].content = newText;
    state.messages = state.messages.slice(0, idx + 1);
    recomputeDraftFromHistory();
    updateProgressUI();
    syncCanvasBriefingForm();
    renderAllMessages();
    await generateAssistantReply(newText);
  });
}

async function regenerateResponse(aiMsgId) {
  if (state.isGenerating) return;
  const idx = state.messages.findIndex(m => m.id === aiMsgId && m.role === 'ai');
  if (idx === -1) return;

  // Encontra o prompt do usuário imediatamente anterior
  let prevUserText = '';
  for (let i = idx - 1; i >= 0; i--) {
    if (state.messages[i].role === 'user') {
      prevUserText = state.messages[i].content;
      break;
    }
  }
  if (!prevUserText) return;

  state.messages = state.messages.slice(0, idx);
  recomputeDraftFromHistory();
  updateProgressUI();
  syncCanvasBriefingForm();
  renderAllMessages();
  await generateAssistantReply(prevUserText);
}

/* ==========================================================================
   CONFIRMAÇÃO & ENVIO AO MANAGER DO FLW (SERVERLESS /api/send-briefing)
   ========================================================================== */
function isDraftComplete() {
  return !!(state.draft.ministerio && state.draft.categoria && state.draft.detalhes && state.draft.prazo);
}

function mapCategoryGroup(rawCat = '') {
  const c = normalizeStr(rawCat);
  if (c.includes('estatica') || c.includes('social') || c.includes('story') || c.includes('feed')) return 'Redes Sociais';
  if (c.includes('video') || c.includes('reels')) return 'Vídeo';
  if (c.includes('foto')) return 'Fotografia';
  return 'Design';
}

function createDemandCard(data) {
  const nextNum = 101 + state.cards.length;
  const rawCategory = data.categoria || 'Design Gráfico';
  const card = {
    id: `FLW-${nextNum}`,
    ministerio: data.ministerio || '',
    cliente: data.cliente || formatClientDisplay(data.ministerio, data.responsavel) || 'Ministério .FLW',
    categoria: mapCategoryGroup(rawCategory),
    categoriaOriginal: rawCategory,
    detalhes: data.detalhes || 'Detalhes confirmados no atendimento.',
    prazo: data.prazo || 'Dentro do prazo (2–3 dias)',
    statusPrazo: data.statusPrazo || 'Dentro do Prazo',
    deliveryLabel: MANAGER_SENT_LABEL,
    status: 'triagem',
    createdAt: 'Agora mesmo',
    isNew: true
  };
  state.cards.unshift(card);
  saveCardsToStorage();
  renderBoardView();
  return card;
}

async function sendBriefingToBackend(card) {
  try {
    const res = await fetch(appConfig.backendEndpoint || SEND_BRIEFING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        id: card.id,
        cliente: card.cliente,
        categoria: card.categoria,
        categoriaOriginal: card.categoriaOriginal,
        detalhes: card.detalhes,
        prazo: card.prazo,
        statusPrazo: card.statusPrazo
      })
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
  }
}

async function confirmAndDispatchBriefing(artifactMsgObj = null) {
  // Lê valores mais recentes do Canvas caso o usuário tenha editado lá
  readCanvasIntoDraft();

  if (!state.draft.ministerio || !state.draft.categoria || !state.draft.detalhes || !state.draft.prazo) {
    showToast('Campos pendentes', 'Preencha Ministério, Formato, Prazo e Detalhes para enviar.');
    toggleCanvas(true, 'briefing');
    return;
  }

  const canvasBtn = document.getElementById('btnCanvasConfirmSend');
  if (canvasBtn) {
    canvasBtn.disabled = true;
    canvasBtn.textContent = 'Enviando...';
  }

  const card = createDemandCard(state.draft);
  state.sentCardId = card.id;

  await sendBriefingToBackend(card);

  // Atualiza qualquer artifact card aberto na conversa
  const targetMsg = artifactMsgObj || [...state.messages].reverse().find(m => m.widget?.type === 'briefing_artifact');
  if (targetMsg && targetMsg.widget) {
    targetMsg.widget.sent = true;
    targetMsg.widget.cardId = card.id;
    targetMsg.widget.snapshot = { ...state.draft };
    targetMsg.verificationNote = {
      type: 'sent',
      text: `${MANAGER_SENT_LABEL} Demanda #${card.id} registrada no painel.`
    };
    updateMessageDOM(targetMsg);
  } else {
    appendMessageObject({
      role: 'ai',
      content: `Briefing **#${card.id}** confirmado para **${card.cliente}**.`,
      verificationNote: {
        type: 'sent',
        text: MANAGER_SENT_LABEL
      },
      followUps: [
        { label: 'Ver nas demandas', action: 'open_board' },
        { label: 'Iniciar novo pedido', action: 'new_chat' }
      ]
    });
  }

  if (canvasBtn) {
    canvasBtn.disabled = false;
    canvasBtn.textContent = 'Confirmar e enviar';
  }

  syncCanvasBriefingForm();
  updateProgressUI();

  const toggleBtn = document.getElementById('btnToggleCanvas');
  toggleBtn?.classList.add('pulse-alert');
  setTimeout(() => toggleBtn?.classList.remove('pulse-alert'), 2600);

  showToast(MANAGER_SENT_LABEL, `Demanda #${card.id} registrada com sucesso.`);
}

/* ==========================================================================
   SPLIT-VIEW CANVAS (BRIEFING VIVO + PAINEL DE DEMANDAS)
   ========================================================================== */
function toggleCanvas(open, tab = null) {
  const workspace = document.getElementById('workspaceBody');
  const pane = document.getElementById('canvasPane');
  const btn = document.getElementById('btnToggleCanvas');
  if (!workspace || !pane) return;

  state.canvasOpen = typeof open === 'boolean' ? open : !state.canvasOpen;
  if (tab) setCanvasTab(tab);

  workspace.classList.toggle('canvas-open', state.canvasOpen);
  pane.setAttribute('aria-hidden', String(!state.canvasOpen));
  btn?.setAttribute('aria-expanded', String(state.canvasOpen));
}

function setCanvasTab(tab) {
  state.canvasTab = tab === 'board' ? 'board' : 'briefing';
  const workspace = document.getElementById('workspaceBody');
  const tabBriefing = document.getElementById('tabBriefing');
  const tabBoard = document.getElementById('tabBoard');
  const viewBriefing = document.getElementById('canvasBriefingView');
  const viewBoard = document.getElementById('canvasBoardView');

  const isBoard = state.canvasTab === 'board';
  tabBriefing.classList.toggle('active', !isBoard);
  tabBriefing.setAttribute('aria-selected', String(!isBoard));
  tabBoard.classList.toggle('active', isBoard);
  tabBoard.setAttribute('aria-selected', String(isBoard));

  viewBriefing.hidden = isBoard;
  viewBoard.hidden = !isBoard;
  workspace?.classList.toggle('canvas-wide', isBoard);

  if (isBoard) renderBoardView();
}

function readCanvasIntoDraft() {
  const m = document.getElementById('canvasMinistryInput')?.value.trim() ?? '';
  const r = document.getElementById('canvasPersonInput')?.value.trim() ?? '';
  const c = document.getElementById('canvasCategorySelect')?.value ?? '';
  const p = document.getElementById('canvasDeadlineInput')?.value.trim() ?? '';
  const d = document.getElementById('canvasDetailsInput')?.value.trim() ?? '';

  state.draft.ministerio = m;
  state.draft.responsavel = r;
  state.draft.cliente = formatClientDisplay(m, r);
  state.draft.categoria = c;
  state.draft.prazo = p;
  state.draft.detalhes = d;
}

function refreshOpenBriefingArtifactInChat() {
  const activeArtifact = [...state.messages].reverse().find(m => m.widget?.type === 'briefing_artifact' && !m.widget.sent);
  if (activeArtifact) {
    activeArtifact.widget.snapshot = { ...state.draft };
    updateMessageDOM(activeArtifact);
  }
}

function syncCanvasBriefingForm({ skipFocusIds = [] } = {}) {
  const activeId = document.activeElement?.id;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (!el || id === activeId || skipFocusIds.includes(id)) return;
    if (el.tagName === 'SELECT' && val && ![...el.options].some(o => o.value === val)) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      el.appendChild(opt);
    }
    el.value = val || '';
  };

  setVal('canvasMinistryInput', state.draft.ministerio);
  setVal('canvasPersonInput', state.draft.responsavel);
  setVal('canvasCategorySelect', state.draft.categoria);
  setVal('canvasDeadlineInput', state.draft.prazo);
  setVal('canvasDetailsInput', state.draft.detalhes);

  const filled = [
    state.draft.ministerio,
    state.draft.categoria,
    state.draft.detalhes,
    state.draft.prazo
  ].filter(Boolean).length;

  const badge = document.getElementById('canvasDraftStatus');
  const countEl = document.getElementById('canvasProgressCount');
  const fillEl = document.getElementById('canvasProgressFill');
  const notice = document.getElementById('canvasVerificationNotice');

  if (countEl) countEl.textContent = `${filled} de 4 campos`;
  if (fillEl) {
    fillEl.style.width = `${filled * 25}%`;
    fillEl.classList.toggle('done', !!state.sentCardId || filled === 4);
  }

  if (badge) {
    if (state.sentCardId) {
      badge.className = 'canvas-badge sent';
      badge.textContent = MANAGER_SENT_LABEL;
    } else if (filled === 4) {
      badge.className = 'canvas-badge ready';
      badge.textContent = 'Pronto para envio';
    } else {
      badge.className = 'canvas-badge';
      badge.textContent = 'Rascunho em andamento';
    }
  }

  if (notice) {
    if (state.sentCardId) {
      notice.className = 'canvas-verification-box sent';
      notice.innerHTML = `<i class="fa-solid fa-circle-check" aria-hidden="true"></i><span><strong>${MANAGER_SENT_LABEL}</strong> Demanda #${escapeHTML(state.sentCardId)} registrada.</span>`;
    } else {
      notice.className = 'canvas-verification-box';
      notice.innerHTML = `<i class="fa-regular fa-circle-check" aria-hidden="true"></i><span>Ao confirmar, o pedido é registrado no painel e enviado para o <strong>Manager do FLW</strong>.</span>`;
    }
  }
}

function updateProgressUI() {
  const bar = document.getElementById('briefingProgressBar');
  if (!bar) return;
  const checks = {
    cliente: !!state.draft.ministerio,
    categoria: !!state.draft.categoria,
    detalhes: !!state.draft.detalhes,
    prazo: !!state.draft.prazo
  };
  Object.entries(checks).forEach(([field, done]) => {
    bar.querySelector(`[data-field="${field}"]`)?.classList.toggle('captured', done);
  });
}

function renderBoardView() {
  const listEl = document.getElementById('boardCardsList');
  if (!listEl) return;

  const total = state.cards.length;
  const triagemCount = state.cards.filter(c => c.status === 'triagem').length;
  const producaoCount = state.cards.filter(c => c.status === 'producao').length;
  const prontoCount = state.cards.filter(c => c.status === 'pronto').length;

  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('metricTotal', total);
  setText('metricTriagem', triagemCount);
  setText('metricProducao', producaoCount);
  setText('metricPronto', prontoCount);
  setText('headerBoardCount', total);
  setText('canvasBoardCount', total);

  const q = normalizeStr(state.boardSearch);
  const filtered = state.cards.filter(card => {
    const matchStatus = state.boardStatusFilter === 'all' || card.status === state.boardStatusFilter;
    const matchQ = !q ||
      normalizeStr(card.cliente).includes(q) ||
      normalizeStr(card.categoriaOriginal || card.categoria).includes(q) ||
      normalizeStr(card.detalhes).includes(q) ||
      normalizeStr(card.id).includes(q);
    return matchStatus && matchQ;
  });

  if (!filtered.length) {
    listEl.innerHTML = `<div class="board-empty">Nenhuma demanda encontrada neste filtro.</div>`;
    return;
  }

  const stageLabel = { triagem: 'Triagem', producao: 'Em Produção', pronto: 'Entregue' };

  listEl.innerHTML = filtered.map(card => `
    <article class="demand-card ${card.isNew ? 'is-new' : ''}" data-card-id="${escapeHTML(card.id)}">
      <div class="demand-top">
        <span class="demand-id">#${escapeHTML(card.id)} · ${escapeHTML(card.createdAt || 'Hoje')}</span>
        <span class="demand-stage-pill stage-${card.status}">${stageLabel[card.status] || 'Triagem'}</span>
      </div>
      <div class="demand-client">${escapeHTML(card.cliente)}</div>
      <div class="demand-meta-row">
        <span><i class="fa-solid fa-layer-group" aria-hidden="true"></i> ${escapeHTML(card.categoriaOriginal || card.categoria)}</span>
        <span><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${escapeHTML(card.prazo)}</span>
      </div>
      <div class="demand-details">${escapeHTML(card.detalhes)}</div>
      <div class="demand-delivery">
        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
        <span>${escapeHTML(card.deliveryLabel || MANAGER_SENT_LABEL)}</span>
      </div>
      <div class="demand-actions">
        <button type="button" class="btn-ghost btn-xs" data-card-act="copy" data-card-id="${escapeHTML(card.id)}">
          <i class="fa-regular fa-copy" aria-hidden="true"></i> Copiar
        </button>
        <div class="demand-stage-btns">
          ${card.status !== 'triagem' ? `<button type="button" class="btn-ghost btn-xs" data-card-act="prev" data-card-id="${escapeHTML(card.id)}" aria-label="Voltar etapa"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>` : ''}
          ${card.status !== 'pronto' ? `<button type="button" class="btn-ghost btn-xs" data-card-act="next" data-card-id="${escapeHTML(card.id)}" aria-label="Avançar etapa"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>` : ''}
          <button type="button" class="btn-ghost btn-xs" data-card-act="delete" data-card-id="${escapeHTML(card.id)}" aria-label="Remover demanda"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>
        </div>
      </div>
    </article>
  `).join('');
}

function buildBriefingMarkdown(data, cardId = null) {
  const header = cardId ? `### Briefing .FLW (#${cardId})` : '### Resumo de Briefing .FLW';
  return [
    header,
    `- **Ministério / Responsável:** ${data.cliente || formatClientDisplay(data.ministerio, data.responsavel) || 'Não informado'}`,
    `- **Categoria / Formato:** ${data.categoriaOriginal || data.categoria || 'Não informado'}`,
    `- **Prazo:** ${data.prazo || 'Não informado'}`,
    `- **Detalhes:** ${data.detalhes || 'Não informado'}`,
    `- **Status:** ${MANAGER_SENT_LABEL}`,
    `_MADE BY SAM HELD_`
  ].join('\n');
}

async function copyText(str) {
  try {
    await navigator.clipboard.writeText(str);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = str;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

/* ==========================================================================
   HELPERS DE UI (COMPOSITOR, MENUS, RESET, TOAST)
   ========================================================================== */
function setComposerGeneratingMode(generating) {
  const btn = document.getElementById('btnComposerSubmit');
  if (!btn) return;
  if (generating) {
    btn.dataset.mode = 'stop';
    btn.setAttribute('aria-label', 'Parar geração');
    btn.innerHTML = '<i class="fa-solid fa-stop" aria-hidden="true"></i>';
    btn.disabled = false;
  } else {
    btn.dataset.mode = 'send';
    btn.setAttribute('aria-label', 'Enviar mensagem');
    btn.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
  }
}

function autoResizeTextarea(ta) {
  if (!ta) return;
  ta.style.height = 'auto';
  ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
}

function closeAllDropdowns() {
  [
    ['btnHeaderMenu', 'headerMenuPopover'],
    ['btnComposerTools', 'composerToolsPopover']
  ].forEach(([btnId, menuId]) => {
    const b = document.getElementById(btnId);
    const m = document.getElementById(menuId);
    if (m) m.hidden = true;
    if (b) b.setAttribute('aria-expanded', 'false');
  });
}

function toggleDropdown(btnId, menuId) {
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  if (!btn || !menu) return;
  const willOpen = menu.hidden;
  closeAllDropdowns();
  menu.hidden = !willOpen;
  btn.setAttribute('aria-expanded', String(willOpen));
}

function resetConversation() {
  stopGeneration();
  state.simulationRunId++;
  state.messages = [];
  state.draft = createEmptyDraft();
  state.lastAskedField = null;
  state.awaitingFormatClarification = false;
  state.sentCardId = null;
  state.autoScrollPinned = true;

  syncEmptyVsStreamVisibility();
  renderAllMessages();
  updateProgressUI();
  syncCanvasBriefingForm();
  updateScrollBottomButton();
  document.getElementById('chatInput')?.focus();
}

function refreshSettingsStatus() {
  const el = document.getElementById('emailConfigStatus');
  const dot = document.getElementById('apiStatusDot');
  if (!el) return;
  el.className = 'config-status ok';
  el.textContent = 'Pronto para envio via rota segura do servidor para o Manager do FLW.';
  if (dot) dot.className = appConfig.geminiKey ? 'status-dot-mini' : 'status-dot-mini local';
}

function showToast(title, subtitle = '') {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastSubtitle').textContent = subtitle;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3600);
}

/* ==========================================================================
   EVENT LISTENERS
   ========================================================================== */
function bindEvents() {
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const scrollArea = document.getElementById('chatScrollArea');
  const chatStream = document.getElementById('chatMessages');

  // Envio ou Parar Geração
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btnComposerSubmit');
    if (submitBtn.dataset.mode === 'stop' || state.isGenerating) {
      stopGeneration();
      return;
    }
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    autoResizeTextarea(chatInput);
    sendUserPrompt(text);
  });

  // Teclado no Composer (Autocomplete + Enter para enviar)
  chatInput.addEventListener('keydown', (e) => {
    const acBox = document.getElementById('composerAutocomplete');
    const acOpen = acBox && !acBox.hidden && state.acMatches.length > 0;

    if (acOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.acActiveIndex = (state.acActiveIndex + 1) % state.acMatches.length;
        acBox.querySelectorAll('.composer-ac-item').forEach((el, idx) => {
          el.classList.toggle('active', idx === state.acActiveIndex);
          el.setAttribute('aria-selected', String(idx === state.acActiveIndex));
          if (idx === state.acActiveIndex) el.scrollIntoView({ block: 'nearest' });
        });
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        state.acActiveIndex = (state.acActiveIndex - 1 + state.acMatches.length) % state.acMatches.length;
        acBox.querySelectorAll('.composer-ac-item').forEach((el, idx) => {
          el.classList.toggle('active', idx === state.acActiveIndex);
          el.setAttribute('aria-selected', String(idx === state.acActiveIndex));
          if (idx === state.acActiveIndex) el.scrollIntoView({ block: 'nearest' });
        });
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyComposerAutocomplete(state.acMatches[state.acActiveIndex].name);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeComposerAutocomplete();
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });

  chatInput.addEventListener('input', () => {
    autoResizeTextarea(chatInput);
    updateComposerAutocomplete();
  });

  // Clique em item do Autocomplete do Composer
  document.getElementById('composerAutocomplete').addEventListener('mousedown', (e) => {
    const item = e.target.closest('.composer-ac-item');
    if (!item) return;
    e.preventDefault();
    applyComposerAutocomplete(item.dataset.name);
  });

  // Smart Auto-Scroll
  scrollArea.addEventListener('scroll', () => {
    state.autoScrollPinned = isNearBottom(scrollArea);
    updateScrollBottomButton();
  }, { passive: true });

  document.getElementById('btnScrollBottom').addEventListener('click', () => {
    scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });
    state.autoScrollPinned = true;
    updateScrollBottomButton();
  });

  // Starter Chips (Empty State)
  document.querySelectorAll('.starter-chip').forEach(chip => {
    chip.addEventListener('click', () => sendUserPrompt(chip.dataset.prompt));
  });

  // Interação discreta com o Mascote no Empty State
  const flowEmblem = document.getElementById('flowPerchContainer');
  const flowBubble = document.getElementById('flowReactionBubble');
  const greetings = ['Paz! 🐑🕊️', 'Pronto para servir ✨', '18 ministérios conectados'];
  let greetIdx = 0;
  const reactFlow = () => {
    if (!flowEmblem || !flowBubble) return;
    flowEmblem.dataset.mood = 'celebrate';
    flowBubble.textContent = greetings[greetIdx++ % greetings.length];
    flowBubble.classList.add('show');
    clearTimeout(flowEmblem._t);
    flowEmblem._t = setTimeout(() => {
      flowEmblem.dataset.mood = 'idle';
      flowBubble.classList.remove('show');
    }, 2200);
    chatInput.focus();
  };
  flowEmblem?.addEventListener('click', reactFlow);
  flowEmblem?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reactFlow(); }
  });

  // Delegação no Stream de Mensagens (Copiar, Regenerar, Editar, Feedback, Copiar Código, Follow-ups)
  chatStream.addEventListener('click', async (e) => {
    const codeBtn = e.target.closest('.btn-copy-code');
    if (codeBtn) {
      await copyText(codeBtn.dataset.code || '');
      codeBtn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copiado';
      setTimeout(() => {
        codeBtn.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i> Copiar';
      }, 1800);
      return;
    }

    const fuBtn = e.target.closest('.followup-chip');
    if (fuBtn) {
      const msg = state.messages.find(m => m.id === fuBtn.dataset.followupMsg);
      const fu = msg?.followUps?.[Number(fuBtn.dataset.followupIdx)];
      if (!fu) return;
      if (fu.action === 'open_briefing_canvas') { toggleCanvas(true, 'briefing'); return; }
      if (fu.action === 'open_board') { toggleCanvas(true, 'board'); return; }
      if (fu.action === 'new_chat') { resetConversation(); return; }
      if (fu.action === 'open_ministry_picker') {
        appendMessageObject({
          role: 'ai',
          content: 'Selecione seu ministério na busca abaixo:',
          widget: { type: 'ministry_picker' },
          askedField: 'cliente'
        });
        scrollToBottomIfPinned(true);
        return;
      }
      if (fu.fillInput) {
        chatInput.value = fu.fillInput;
        autoResizeTextarea(chatInput);
        chatInput.focus();
        return;
      }
      if (fu.prompt) sendUserPrompt(fu.prompt);
      return;
    }

    const actBtn = e.target.closest('.msg-action-btn');
    if (!actBtn) return;
    const action = actBtn.dataset.action;
    const msgId = actBtn.dataset.id;
    const msg = state.messages.find(m => m.id === msgId);
    if (!msg) return;

    if (action === 'copy-msg') {
      await copyText(msg.content);
      showToast('Copiado', 'Texto copiado para a área de transferência.');
    } else if (action === 'edit-prompt') {
      openInlinePromptEditor(msgId);
    } else if (action === 'regenerate') {
      await regenerateResponse(msgId);
    } else if (action === 'feedback') {
      const val = actBtn.dataset.val;
      msg.feedback = msg.feedback === val ? null : val;
      updateMessageDOM(msg);
      if (msg.feedback) {
        showToast('Feedback registrado', msg.feedback === 'up' ? 'Obrigado por avaliar!' : 'Vamos melhorar essa resposta.');
      }
    }
  });

  // Cabeçalho & Progressive Disclosure Menus
  document.getElementById('btnBrandReset').addEventListener('click', resetConversation);
  document.getElementById('briefingProgressBar').addEventListener('click', () => toggleCanvas(true, 'briefing'));
  document.getElementById('btnToggleCanvas').addEventListener('click', () => toggleCanvas());
  document.getElementById('btnCloseCanvas').addEventListener('click', () => toggleCanvas(false));
  document.getElementById('canvasBackdrop').addEventListener('click', () => toggleCanvas(false));

  document.getElementById('btnHeaderMenu').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown('btnHeaderMenu', 'headerMenuPopover');
  });

  document.getElementById('btnComposerTools').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown('btnComposerTools', 'composerToolsPopover');
  });

  // Ações do Menu Header
  document.getElementById('menuNewChat').addEventListener('click', () => { closeAllDropdowns(); resetConversation(); });
  document.getElementById('menuOpenBoard').addEventListener('click', () => { closeAllDropdowns(); toggleCanvas(true, 'board'); });
  document.getElementById('menuVideoGuide').addEventListener('click', () => { closeAllDropdowns(); openVideoGuide(); });
  document.getElementById('menuOpenSettings').addEventListener('click', () => { closeAllDropdowns(); openSettingsModal(); });
  document.getElementById('menuSimulate').addEventListener('click', () => { closeAllDropdowns(); runSimulationFlow(); });

  // Ações do Menu + do Composer
  document.getElementById('toolPickMinistry').addEventListener('click', () => {
    closeAllDropdowns();
    state.lastAskedField = 'cliente';
    const msg = appendMessageObject({
      role: 'ai',
      content: 'Escolha ou pesquise entre os **18 ministérios** do .FLW:',
      widget: { type: 'ministry_picker' },
      askedField: 'cliente'
    });
    scrollToBottomIfPinned(true);
    requestAnimationFrame(() => {
      document.getElementById(msg.id)?.querySelector('.ministry-search-input')?.focus();
    });
  });

  document.getElementById('toolShowRules').addEventListener('click', () => {
    closeAllDropdowns();
    sendUserPrompt('Quais são os prazos e regras do .FLW?');
  });

  document.getElementById('toolOpenBriefingCanvas').addEventListener('click', () => {
    closeAllDropdowns();
    toggleCanvas(true, 'briefing');
  });

  document.getElementById('toolWatchGuide').addEventListener('click', () => {
    closeAllDropdowns();
    openVideoGuide();
  });

  // Abas do Canvas
  document.getElementById('tabBriefing').addEventListener('click', () => setCanvasTab('briefing'));
  document.getElementById('tabBoard').addEventListener('click', () => setCanvasTab('board'));

  // Sincronia bidirecional no Formulário do Canvas
  ['canvasPersonInput', 'canvasCategorySelect', 'canvasDeadlineInput', 'canvasDetailsInput'].forEach(id => {
    const el = document.getElementById(id);
    const ev = el?.tagName === 'SELECT' ? 'change' : 'input';
    el?.addEventListener(ev, () => {
      state.sentCardId = null;
      readCanvasIntoDraft();
      updateProgressUI();
      syncCanvasBriefingForm({ skipFocusIds: [id] });
      refreshOpenBriefingArtifactInChat();
    });
  });

  document.getElementById('canvasBriefingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await confirmAndDispatchBriefing();
  });

  document.getElementById('btnCopyDraftMarkdown').addEventListener('click', async () => {
    readCanvasIntoDraft();
    await copyText(buildBriefingMarkdown(state.draft, state.sentCardId));
    showToast('Resumo copiado', 'Briefing formatado pronto para colar.');
  });

  // Painel de Demandas (Busca, Filtros, Ações nos Cards)
  document.getElementById('boardSearchInput').addEventListener('input', (e) => {
    state.boardSearch = e.target.value;
    renderBoardView();
  });

  document.getElementById('boardStatusFilters').addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('#boardStatusFilters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.boardStatusFilter = chip.dataset.status;
    renderBoardView();
  });

  document.getElementById('boardCardsList').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-card-act]');
    if (!btn) return;
    const id = btn.dataset.cardId;
    const act = btn.dataset.cardAct;
    const card = state.cards.find(c => c.id === id);
    if (!card) return;

    const stages = ['triagem', 'producao', 'pronto'];
    if (act === 'copy') {
      await copyText(buildBriefingMarkdown(card, card.id));
      showToast(`Briefing #${card.id} copiado`, 'Pronto para compartilhar.');
    } else if (act === 'prev' || act === 'next') {
      const cur = stages.indexOf(card.status);
      const next = Math.max(0, Math.min(stages.length - 1, cur + (act === 'next' ? 1 : -1)));
      card.status = stages[next];
      saveCardsToStorage();
      renderBoardView();
    } else if (act === 'delete') {
      state.cards = state.cards.filter(c => c.id !== id);
      saveCardsToStorage();
      renderBoardView();
      showToast('Demanda arquivada', `Card #${id} removido do painel.`);
    }
  });

  // Modal: Novo Briefing Manual
  const manualModal = document.getElementById('manualModalBackdrop');
  document.getElementById('btnNewManualCard').addEventListener('click', () => openModal(manualModal));
  document.getElementById('btnCloseManualModal').addEventListener('click', () => closeModal(manualModal));
  document.getElementById('btnCancelManualCard').addEventListener('click', () => closeModal(manualModal));

  document.getElementById('manualCardForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ministerio = document.getElementById('manualMinistryInput').value.trim();
    const responsavel = document.getElementById('manualPerson').value.trim();
    const card = createDemandCard({
      ministerio,
      responsavel,
      cliente: formatClientDisplay(ministerio, responsavel),
      categoria: document.getElementById('manualCategory').value,
      prazo: document.getElementById('manualDeadline').value.trim(),
      detalhes: document.getElementById('manualDetails').value.trim()
    });
    e.target.reset();
    closeModal(manualModal);
    await sendBriefingToBackend(card);
    showToast(MANAGER_SENT_LABEL, `Demanda #${card.id} adicionada.`);
  });

  // Modal: Configurações
  const apiModal = document.getElementById('apiModalBackdrop');
  const openSettingsModal = () => {
    document.getElementById('backendEndpointInput').value = appConfig.backendEndpoint === SEND_BRIEFING_ENDPOINT ? '' : appConfig.backendEndpoint;
    document.getElementById('geminiApiKeyInput').value = appConfig.geminiKey;
    refreshSettingsStatus();
    openModal(apiModal);
  };

  document.getElementById('btnCloseApiModal').addEventListener('click', () => closeModal(apiModal));
  document.getElementById('btnToggleKeyVisibility').addEventListener('click', () => {
    const inp = document.getElementById('geminiApiKeyInput');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btnSaveApiKey').addEventListener('click', () => {
    appConfig.backendEndpoint = document.getElementById('backendEndpointInput').value.trim() || SEND_BRIEFING_ENDPOINT;
    appConfig.geminiKey = document.getElementById('geminiApiKeyInput').value.trim();
    localStorage.setItem('flw_backend_endpoint', appConfig.backendEndpoint);
    localStorage.setItem('flw_gemini_api_key', appConfig.geminiKey);
    refreshSettingsStatus();
    closeModal(apiModal);
    showToast('Configurações salvas', 'Preferências atualizadas neste navegador.');
  });

  document.getElementById('btnTestEmail').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const statusEl = document.getElementById('emailConfigStatus');
    btn.disabled = true;
    btn.textContent = 'Testando...';
    const ok = await sendBriefingToBackend({
      id: 'TESTE',
      cliente: 'Teste de conexão .FLW',
      categoria: 'Design',
      categoriaOriginal: 'Teste de envio',
      detalhes: 'Validação automática da rota de envio do FLW Atendimento.',
      prazo: 'Hoje',
      statusPrazo: 'Dentro do Prazo'
    });
    btn.disabled = false;
    btn.textContent = 'Testar envio';
    if (ok) {
      statusEl.className = 'config-status ok';
      statusEl.textContent = MANAGER_SENT_LABEL;
      showToast(MANAGER_SENT_LABEL, 'Rota de envio validada.');
    } else {
      statusEl.className = 'config-status warn';
      statusEl.textContent = 'Servidor de envio indisponível neste ambiente local. Em produção (Vercel), o disparo ocorre automaticamente.';
    }
  });

  // Modal: Vídeo Guia
  const videoModal = document.getElementById('videoGuideModalBackdrop');
  const videoPlayer = document.getElementById('flwGuideVideoPlayer');
  const openVideoGuide = () => {
    openModal(videoModal);
    if (videoPlayer) {
      videoPlayer.currentTime = 0;
      videoPlayer.play().catch(() => {});
    }
  };
  const closeVideoGuide = () => {
    closeModal(videoModal);
    videoPlayer?.pause();
  };
  document.getElementById('btnCloseVideoGuideModal').addEventListener('click', closeVideoGuide);

  // Fechar modais ao clicar no backdrop
  [apiModal, manualModal, videoModal].forEach(modal => {
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal === videoModal) closeVideoGuide();
        else closeModal(modal);
      }
    });
  });

  // Clique fora fecha dropdowns e autocomplete
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.popover-anchor')) closeAllDropdowns();
    if (!e.target.closest('.composer-region')) closeComposerAutocomplete();
  });

  // Atalho Escape global
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (state.isGenerating) {
      stopGeneration();
      return;
    }
    closeAllDropdowns();
    closeComposerAutocomplete();
    if (!videoModal.hidden) closeVideoGuide();
    else if (!apiModal.hidden) closeModal(apiModal);
    else if (!manualModal.hidden) closeModal(manualModal);
    else if (state.canvasOpen) toggleCanvas(false);
  });
}

function openModal(backdrop) {
  if (!backdrop) return;
  backdrop.hidden = false;
  backdrop.setAttribute('aria-hidden', 'false');
}

function closeModal(backdrop) {
  if (!backdrop) return;
  backdrop.hidden = true;
  backdrop.setAttribute('aria-hidden', 'true');
}

/* ==========================================================================
   SIMULAÇÃO INTERATIVA (TESTA STREAMING, 18 MINISTÉRIOS E CANVAS)
   ========================================================================== */
async function runSimulationFlow() {
  resetConversation();
  const runId = ++state.simulationRunId;
  const steps = SIMULATION_SCENARIOS[state.simIndex++ % SIMULATION_SCENARIOS.length];

  for (let i = 0; i < steps.length; i++) {
    if (state.simulationRunId !== runId) return;
    await new Promise(r => setTimeout(r, i === 0 ? 220 : 650));
    if (state.simulationRunId !== runId) return;
    await sendUserPrompt(steps[i]);
  }
}

/* ==========================================================================
   PWA: SERVICE WORKER, INSTALAÇÃO NATIVA & TECLADO VIRTUAL (iOS / ANDROID)
   ========================================================================== */
function initMobileViewportSync() {
  const root = document.documentElement;
  const applyHeight = () => {
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    root.style.setProperty('--app-height', `${Math.round(h)}px`);
    if (window.scrollY !== 0) window.scrollTo(0, 0);
    if (state.messages.length > 0) scrollToBottomIfPinned();
  };

  applyHeight();
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', applyHeight);
    window.visualViewport.addEventListener('scroll', applyHeight);
  }
  window.addEventListener('orientationchange', () => setTimeout(applyHeight, 120));
}

function handleLaunchParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'board') {
    toggleCanvas(true, 'board');
  } else if (params.get('action') === 'new') {
    resetConversation();
  }
}

function initPWA() {
  const installBtn = document.getElementById('menuInstallPwa');
  let deferredInstallPrompt = null;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (installBtn && isIOS && !isStandalone) {
    installBtn.hidden = false;
    const label = installBtn.querySelector('span');
    if (label) label.textContent = 'Adicionar à Tela de Início';
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn && !isStandalone) {
      installBtn.hidden = false;
      const label = installBtn.querySelector('span');
      if (label) label.textContent = 'Instalar aplicativo';
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (installBtn) installBtn.hidden = true;
    showToast('App instalado', 'O .FLW Atendimento já está na sua tela inicial.');
  });

  installBtn?.addEventListener('click', async () => {
    closeAllDropdowns();
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (outcome === 'accepted') installBtn.hidden = true;
    } else if (isIOS) {
      showToast('Instalar no iPhone / iPad', 'Toque em Compartilhar (↑) e escolha "Adicionar à Tela de Início".');
    }
  });

  // Registro do Service Worker (somente em contextos seguros HTTPS / localhost)
  const canRegisterSW = 'serviceWorker' in navigator
    && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (!canRegisterSW) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      // Verifica silenciosamente se há nova versão disponível
      reg.update().catch(() => {});

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    } catch (err) {
      console.warn('Service Worker não registrado:', err);
    }
  });
}
