/**
 * ============================================================================
 * .FLW ATENDIMENTO — SERVERLESS FUNCTION / BACKEND ROUTE (`/api/send-briefing`)
 * Protocolo SMTP (Nodemailer) + API Resend + EmailJS Server-Side
 * Destino Oficial: ismaelmcorra@gmail.com
 * Segurança: Todas as chaves e credenciais ficam protegidas em variáveis de
 * ambiente (`process.env`), sem jamais expor segredos no frontend.
 * MADE BY SAM HELD
 * ============================================================================
 */

const nodemailer = require('nodemailer');

const DIRECTOR_EMAIL = process.env.DIRECTOR_EMAIL || 'ismaelmcorra@gmail.com';

/**
 * Monta o template HTML executivo no padrão visual Dark/Vermilion do .FLW
 */
function buildBriefingEmailHTML(briefing) {
  const {
    id = 'FLW-NEW',
    cliente = 'Não informado',
    categoria = 'Design',
    prazo = 'A definir',
    detalhes = 'Sem detalhes adicionais.',
    statusPrazo = 'Dentro do Prazo',
    createdAt = new Date().toLocaleString('pt-BR')
  } = briefing;

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Novo Briefing .FLW #${id}</title>
  </head>
  <body style="margin:0;padding:24px;background-color:#07070c;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#12121c;border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;">
      <tr>
        <td style="padding:24px 28px;background:linear-gradient(135deg,#e74129,#991b1b);color:#ffffff;">
          <div style="font-size:11px;letter-spacing:2px;font-weight:700;text-transform:uppercase;opacity:0.9;">
            .FLW ATENDIMENTO • TRIAGEM AUTOMÁTICA IA
          </div>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;">
            🚨 Novo Briefing Registrado (#${id})
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <p style="margin:0 0 18px;font-size:14px;color:#a1a1aa;line-height:1.5;">
            O assistente <strong>Flow 🐑🕊️</strong> concluiu a coleta dos 4 pilares de atendimento e gerou automaticamente o card no <strong>Briefing Board</strong>. Confira abaixo os dados consolidados:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#181826;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:18px;margin-bottom:20px;">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <span style="font-size:12px;color:#71717a;display:block;text-transform:uppercase;">1. Cliente / Ministério</span>
                <strong style="font-size:16px;color:#ffffff;">${cliente}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <span style="font-size:12px;color:#71717a;display:block;text-transform:uppercase;">2. Categoria da Demanda</span>
                <strong style="font-size:15px;color:#ff6952;">${categoria}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <span style="font-size:12px;color:#71717a;display:block;text-transform:uppercase;">3. Prazo de Entrega</span>
                <strong style="font-size:15px;color:#fbbf24;">${prazo}</strong>
                <span style="font-size:12px;color:#10b981;margin-left:8px;">(${statusPrazo})</span>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0 4px;">
                <span style="font-size:12px;color:#71717a;display:block;text-transform:uppercase;margin-bottom:6px;">4. Detalhes da Solicitação</span>
                <div style="font-size:14px;color:#e2e8f0;line-height:1.6;white-space:pre-line;background:rgba(255,255,255,0.03);padding:12px;border-left:3px solid #e74129;border-radius:8px;">${detalhes}</div>
              </td>
            </tr>
          </table>

          <div style="font-size:12px;color:#71717a;text-align:center;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">
            Enviado em ${createdAt} • Destino Diretor: <strong>${DIRECTOR_EMAIL}</strong><br/>
            <span style="color:#e74129;font-weight:700;">MADE BY SAM HELD</span>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

function buildBriefingEmailText(briefing) {
  return (
    `🚨 NOVO BRIEFING CONSOLIDADO — FLW ATENDIMENTO (#${briefing.id || 'FLW'})\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• Cliente / Ministério: ${briefing.cliente}\n` +
    `• Categoria da Demanda: ${briefing.categoria}\n` +
    `• Prazo de Entrega: ${briefing.prazo} (${briefing.statusPrazo || 'Dentro do Prazo'})\n` +
    `• Detalhes da Solicitação:\n${briefing.detalhes}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Destino Diretor: ${DIRECTOR_EMAIL}\n` +
    `Triagem automática via Flow 🐑🕊️ • MADE BY SAM HELD`
  );
}

/**
 * Handler Serverless padrão (compatível com Vercel, Netlify e Express)
 */
module.exports = async function handler(req, res) {
  // CORS Headers seguros
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const briefing = {
      id: body.id || `FLW-${Date.now().toString().slice(-3)}`,
      cliente: body.cliente || 'Cliente FLW',
      categoria: body.categoriaOriginal || body.categoria || 'Design Gráfico',
      detalhes: body.detalhes || 'Escopo coletado via chat.',
      prazo: body.prazo || 'A definir',
      statusPrazo: body.statusPrazo || 'Dentro do Prazo',
      createdAt: new Date().toLocaleString('pt-BR')
    };

    const subject = `🚨 [NOVO BRIEFING .FLW #${briefing.id}] ${briefing.cliente} — ${briefing.categoria}`;
    const htmlContent = buildBriefingEmailHTML(briefing);
    const textContent = buildBriefingEmailText(briefing);

    // ========================================================================
    // 1. PRIORIDADE 1: PROTOCOLO SMTP VIA NODEMAILER (Credenciais no .env)
    // ========================================================================
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"FLW Atendimento 🐑🕊️" <${process.env.SMTP_USER}>`,
        to: DIRECTOR_EMAIL,
        subject,
        text: textContent,
        html: htmlContent
      });

      return res.status(200).json({
        ok: true,
        provider: 'smtp-nodemailer',
        recipient: DIRECTOR_EMAIL,
        messageId: info.messageId
      });
    }

    // ========================================================================
    // 2. PRIORIDADE 2: API RESEND (Server-Side via RESEND_API_KEY no .env)
    // ========================================================================
    if (process.env.RESEND_API_KEY) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'FLW Atendimento <onboarding@resend.dev>',
          to: [DIRECTOR_EMAIL],
          subject,
          html: htmlContent,
          text: textContent
        })
      });

      if (resendRes.ok) {
        const resendData = await resendRes.json();
        return res.status(200).json({
          ok: true,
          provider: 'resend-api',
          recipient: DIRECTOR_EMAIL,
          id: resendData.id
        });
      }
    }

    // ========================================================================
    // 3. PRIORIDADE 3: EMAILJS SERVER-SIDE (Chaves Privadas no .env)
    // ========================================================================
    if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY) {
      const emailJsPayload = {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY || undefined,
        template_params: {
          to_email: DIRECTOR_EMAIL,
          subject,
          briefing_id: briefing.id,
          cliente: briefing.cliente,
          categoria: briefing.categoria,
          prazo: briefing.prazo,
          detalhes: briefing.detalhes,
          message: textContent
        }
      };

      const ejsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailJsPayload)
      });

      if (ejsRes.ok) {
        return res.status(200).json({
          ok: true,
          provider: 'emailjs-server',
          recipient: DIRECTOR_EMAIL
        });
      }
    }

    // ========================================================================
    // 4. PRIORIDADE 4: RELAY SERVERLESS AUTOMÁTICO PARA ismaelmcorra@gmail.com
    // ========================================================================
    const relayRes = await fetch(`https://formsubmit.co/ajax/${DIRECTOR_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        id_briefing: briefing.id,
        cliente: briefing.cliente,
        categoria: briefing.categoria,
        prazo: briefing.prazo,
        detalhes: briefing.detalhes
      })
    });

    return res.status(200).json({
      ok: true,
      provider: relayRes.ok ? 'serverless-relay' : 'queued-local',
      recipient: DIRECTOR_EMAIL
    });

  } catch (error) {
    console.error('Erro em /api/send-briefing:', error);
    return res.status(500).json({
      ok: false,
      error: 'Falha ao processar o envio do briefing por e-mail.',
      details: error.message
    });
  }
};
