// Envio de e-mails transacionais (código de acesso ao login e cadastro).
// Configuração via variáveis de ambiente:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE
// Sem SMTP configurado, o código é registrado no console e devolvido na
// resposta (modo "dev"), para permitir testar o fluxo localmente.
const nodemailer = require('nodemailer');

function getEnv(key1, key2) {
  const v = process.env[key1] || (key2 ? process.env[key2] : '');
  return String(v || '').trim().replace(/^["']|["']$/g, '');
}

function isSmtpConfigured() {
  const host = getEnv('SMTP_HOST');
  const user = getEnv('SMTP_USER', 'SMTP_USERNAME');
  const pass = getEnv('SMTP_PASS', 'SMTP_PASSWORD');
  return !!(host && user && pass);
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const host = getEnv('SMTP_HOST');
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE).trim() === 'true' || port === 465;
  const user = getEnv('SMTP_USER', 'SMTP_USERNAME');
  const pass = getEnv('SMTP_PASS', 'SMTP_PASSWORD');

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 8000, // Máximo 8 segundos para conectar
    greetingTimeout: 5000,   // Máximo 5 segundos para saudações SMTP
    socketTimeout: 10000,    // Máximo 10 segundos para envio de dados
    tls: {
      rejectUnauthorized: false,
    },
  });
  return transporter;
}

function getFrom() {
  const fromEnv = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!fromEnv) return '"Construindo Saberes" <no-reply@construindosaberes.com>';
  return fromEnv.trim().replace(/^["']|["']$/g, '');
}

/**
 * Envia o código de acesso para o e-mail.
 * Retorna { mode: 'smtp' | 'dev' }
 */
async function sendAuthCode(email, code) {
  const mode = isSmtpConfigured() ? 'smtp' : 'dev';
  if (mode === 'smtp') {
    try {
      await getTransporter().sendMail({
        from: getFrom(),
        to: email,
        subject: 'Seu código de acesso — Construindo Saberes',
        text: `Seu código de acesso é ${code}. Ele expira em 10 minutos.\n\nSe não foi você quem pediu, pode ignorar este e-mail.`,
        html:
          '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0b0518;border-radius:18px;color:#f5f1ff">' +
          '<div style="font-size:15px;font-weight:800;margin-bottom:18px">Construindo Saberes — Espanhol</div>' +
          '<p style="font-size:14px;line-height:1.6;color:#b3a6d9">Use o código abaixo para concluir o seu acesso. Ele expira em <b style="color:#f5f1ff">10 minutos</b>.</p>' +
          '<div style="display:inline-block;padding:14px 26px;margin:14px 0;border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#e879f9);font-size:26px;font-weight:800;letter-spacing:6px;color:#fff">' + code + '</div>' +
          '<p style="font-size:12.5px;color:#8779ad">Se não foi você quem pediu, ignore este e-mail.</p>' +
          '</div>',
      });
    } catch (err) {
      console.error('[mailer] Erro no envio SMTP:', err.message || err);
      transporter = null; // Reseta conexão para a próxima tentativa
      throw new Error('Falha no envio de e-mail (' + (err.message || 'Timeout') + '). Verifique suas variáveis SMTP.');
    }
  } else {
    console.log('[mailer] Código de acesso para ' + email + ': ' + code + '  (SMTP não configurado — modo dev)');
  }
  return { mode };
}

module.exports = { sendAuthCode, isSmtpConfigured };

