/**
 * ============================================================================
 * .FLW ATENDIMENTO — SERVIDOR BACKEND NODE.JS (EXPRESS + PWA + SMTP)
 * Serve o frontend PWA estático com headers seguros e expõe as rotas:
 *   - POST /api/send-briefing  (Disparo SMTP / Resend / EmailJS p/ Manager do FLW)
 *   - POST /api/chat           (Proxy Gemini IA sem expor API Key no frontend)
 * MADE BY SAM HELD
 * ============================================================================
 */

require('dotenv').config();
const path = require('path');
const express = require('express');

const sendBriefingHandler = require('./api/send-briefing');
const chatHandler = require('./api/chat');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

// Headers PWA compatíveis com Vercel (sem cache agressivo no Service Worker)
app.use((req, res, next) => {
  if (req.path === '/sw.js') {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Service-Worker-Allowed', '/');
  } else if (req.path === '/manifest.webmanifest') {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  next();
});

app.use(express.static(path.join(__dirname)));

// Rotas de Backend / Serverless
app.all('/api/send-briefing', (req, res) => sendBriefingHandler(req, res));
app.all('/api/chat', (req, res) => chatHandler(req, res));

app.listen(PORT, () => {
  console.log(`🐑🕊️  .FLW Atendimento PWA rodando em http://localhost:${PORT}`);
  console.log('📧  Rota de disparo de briefing ativa: POST /api/send-briefing -> Manager do FLW');
});
