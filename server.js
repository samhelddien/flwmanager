/**
 * ============================================================================
 * .FLW ATENDIMENTO — SERVIDOR BACKEND NODE.JS (EXPRESS + SMTP NODEMAILER)
 * Serve o frontend estático e expõe as rotas seguras:
 *   - POST /api/send-briefing  (Disparo SMTP / Resend / EmailJS p/ ismaelmcorra@gmail.com)
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
app.use(express.static(path.join(__dirname)));

// Rotas de Backend / Serverless
app.all('/api/send-briefing', (req, res) => sendBriefingHandler(req, res));
app.all('/api/chat', (req, res) => chatHandler(req, res));

app.listen(PORT, () => {
  console.log(`🐑🕊️  .FLW Atendimento rodando em http://localhost:${PORT}`);
  console.log(`📧  Rota de disparo de briefing ativa: POST /api/send-briefing -> ${process.env.DIRECTOR_EMAIL || 'ismaelmcorra@gmail.com'}`);
});
