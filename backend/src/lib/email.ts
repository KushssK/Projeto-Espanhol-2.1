import { Resend } from 'resend';

// ============================================================================
// Resend Client — configuração via Environment Variables
// ============================================================================

if (!process.env.RESEND_API_KEY) {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '❌ [EMAIL] RESEND_API_KEY não configurada. ' +
      'Configure RESEND_API_KEY no Render.'
    );
  }
}

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================================
// Assunto do e-mail baseado na finalidade
// ============================================================================

function getSubject(purpose: string): string {
  switch (purpose) {
    case 'REGISTER':
      return 'Seu código de cadastro — Construindo Saberes';
    case 'LOGIN':
      return 'Seu código de login — Construindo Saberes';
    case 'ADMIN_LOGIN':
      return 'Código de acesso administrativo — Construindo Saberes';
    default:
      return 'Seu código de verificação — Construindo Saberes';
  }
}

function getPurposeLabel(purpose: string): string {
  switch (purpose) {
    case 'REGISTER':
      return 'cadastro';
    case 'LOGIN':
      return 'login';
    case 'ADMIN_LOGIN':
      return 'acesso administrativo';
    default:
      return 'verificação';
  }
}

// ============================================================================
// Templates de e-mail (HTML + Texto puro)
// ============================================================================

function buildHtmlEmail(code: string, purpose: string): string {
  const purposeLabel = getPurposeLabel(purpose);
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificação</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7C3AED 0%,#A855F7 100%);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                🇪🇸 Construindo Saberes
              </h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
                Código de ${purposeLabel}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:16px;margin:0 0 8px;">
                Olá!
              </p>
              <p style="color:#374151;font-size:16px;margin:0 0 24px;">
                Use o código abaixo para concluir seu <strong>${purposeLabel}</strong>:
              </p>

              <!-- Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0;">
                    <div style="background-color:#f5f3ff;border:2px dashed #7C3AED;border-radius:12px;padding:20px 0;display:inline-block;">
                      <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#7C3AED;font-family:'Courier New',monospace;padding:0 24px;">
                        ${code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="background-color:#fef3c7;border-radius:8px;padding:12px 16px;">
                    <p style="color:#92400e;font-size:13px;margin:0;">
                      ⏱️ <strong>Este código expira em 10 minutos.</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td style="background-color:#f3f4f6;border-radius:8px;padding:12px 16px;">
                    <p style="color:#6b7280;font-size:12px;margin:0;">
                      🔒 Se você não solicitou este código, ignore este e-mail. Nenhuma ação será tomada em sua conta.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
                Construindo Saberes — Aprenda espanhol de forma gamificada
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildTextEmail(code: string, purpose: string): string {
  const purposeLabel = getPurposeLabel(purpose);
  return `
======================================
  CONSTRUINDO SABERES
  Código de ${purposeLabel}
======================================

Olá!

Use o código abaixo para concluir seu ${purposeLabel}:

  ${code}

Este código expira em 10 minutos.

--------------------------------------
Se você não solicitou este código,
ignore este e-mail. Nenhuma ação será
tomada em sua conta.
--------------------------------------

Construindo Saberes
Aprenda espanhol de forma gamificada
`.trim();
}

// ============================================================================
// Função principal de envio
// ============================================================================

interface SendCodeResult {
  success: boolean;
  error?: string;
}

/**
 * Envia código de verificação por e-mail via Resend API.
 *
 * Comportamento:
 * - Produção: RESEND_API_KEY obrigatória; se falhar, retorna erro genérico (NUNCA expõe o código).
 * - Desenvolvimento: permite log do código no servidor para facilitar testes.
 */
export async function sendVerificationCode(
  email: string,
  code: string,
  purpose: string = 'REGISTER'
): Promise<SendCodeResult> {
  const isProduction = process.env.NODE_ENV === 'production';

  // Verificar se Resend está configurado
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    if (isProduction) {
      // PRODUÇÃO: Resend obrigatório — registrar erro técnico e retornar erro genérico
      console.error(
        '❌ [EMAIL] Variáveis de ambiente não configuradas. ' +
        'Configure RESEND_API_KEY e RESEND_FROM no Render.'
      );
      return {
        success: false,
        error: 'Serviço de e-mail temporariamente indisponível. Tente novamente em alguns instantes.',
      };
    }

    // DESENVOLVIMENTO: permitir log do código para facilitar testes
    console.log('─'.repeat(50));
    console.log(`📧 [DEV MODE] E-mail não configurado. Código para ${email}:`);
    console.log(`   Código: ${code}`);
    console.log(`   Finalidade: ${purpose}`);
    console.log('─'.repeat(50));
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: [email],
      subject: getSubject(purpose),
      html: buildHtmlEmail(code, purpose),
      text: buildTextEmail(code, purpose),
    });

    if (error) {
      console.error(`❌ [EMAIL] Falha ao enviar e-mail para ${email}:`, error.message);
      return {
        success: false,
        error: 'Não foi possível enviar o e-mail de verificação. Tente novamente em alguns instantes.',
      };
    }

    return { success: true };
  } catch (error: unknown) {
    // PRODUÇÃO: NUNCA expor código ou detalhes técnicos ao cliente
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`❌ [EMAIL] Falha ao enviar e-mail para ${email}:`, message);

    return {
      success: false,
      error: 'Não foi possível enviar o e-mail de verificação. Tente novamente em alguns instantes.',
    };
  }
}

/**
 * Verifica se a configuração do Resend está disponível.
 * Não envia e-mail — apenas valida se as variáveis de ambiente estão definidas.
 */
export function verifyEmailConfig(): boolean {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ [EMAIL] RESEND_API_KEY não configurada.');
    return false;
  }
  if (!process.env.RESEND_FROM) {
    console.error('❌ [EMAIL] RESEND_FROM não configurado.');
    return false;
  }
  return true;
}
