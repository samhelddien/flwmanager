/**
 * ============================================================================
 * .FLW ATENDIMENTO — CHAT PROXY SERVERLESS (`/api/chat`)
 * Mantém a chave `GEMINI_API_KEY` 100% protegida no backend (variável de
 * ambiente), evitando expor credenciais no navegador do usuário final.
 * MADE BY SAM HELD
 * ============================================================================
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(501).json({
      ok: false,
      fallbackToLocal: true,
      error: 'GEMINI_API_KEY não configurada no servidor; utilizar motor local.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const model = body.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const systemInstruction = body.systemInstruction || '';
    const contents = Array.isArray(body.contents) ? body.contents : [];

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 900
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        ok: false,
        fallbackToLocal: true,
        error: errText
      });
    }

    const data = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';

    return res.status(200).json({
      ok: true,
      text: replyText
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      fallbackToLocal: true,
      error: err.message
    });
  }
};
