// Envio de e-mails transacionais (código de acesso ao login).
// Configuração via variáveis de ambiente:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE
// Sem SMTP configurado, o código é registrado no console e devolvido na
// resposta (modo "dev"), para permitir testar o fluxo localmente.
const nodemailer = require('nodemailer');

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

const FROM = process.env.SMTP_FROM || '"Construindo Saberes" <no-reply@construindosaberes.com>';

/**
 * Envia o código de acesso para o e-mail cadastrado.
 * Retorna { mode: 'smtp' | 'dev' } — em 'dev' o código também aparece no
 * console do servidor e deve ser exibido pela interface para testes.
 */
async function sendAuthCode(email, code) {
  const mode = isSmtpConfigured() ? 'smtp' : 'dev';
  if (mode === 'smtp') {
    await getTransporter().sendMail({
      from: FROM,
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
  } else {
    console.log('[mailer] Código de acesso para ' + email + ': ' + code + '  (SMTP não configurado — modo dev)');
  }
  return { mode };
}

module.exports = { sendAuthCode, isSmtpConfigured };
