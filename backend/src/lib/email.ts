import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@espanhol.com',
      to: email,
      subject: 'Seu código de verificação - Espanhol em Rede',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #7C3AED; margin: 0;">🇪🇸 Espanhol em Rede</h1>
          </div>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #333; font-size: 16px; margin-bottom: 8px;">Seu código de verificação é:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #7C3AED; margin: 16px 0;">
              ${code}
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 16px;">
              Este código expira em <strong>10 minutos</strong>.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              Se você não solicitou este código, ignore este e-mail.
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail de verificação:', error);
    return false;
  }
}
