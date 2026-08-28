import crypto from 'crypto';
import { prisma } from './prisma';
import type { VerificationPurpose } from '../generated/prisma/enums';

// ============================================================================
// Geração segura de códigos numéricos (crypto.randomInt — CSPRNG)
// ============================================================================

/**
 * Gera um código numérico de 6 dígitos de forma criptograficamente segura.
 * Usa crypto.randomInt (CSPRNG) em vez de Math.random().
 */
export function generateSecureCode(): string {
  const min = 100000;
  const max = 999999;
  return crypto.randomInt(min, max + 1).toString();
}

/**
 * Gera o hash SHA-256 de um código para armazenamento seguro.
 */
export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Compara um código informado com o hash armazenado.
 */
export function compareCode(code: string, hash: string): boolean {
  return hashCode(code) === hash;
}

// ============================================================================
// Criação e validação de códigos de verificação
// ============================================================================

interface CreateCodeResult {
  id: string;
  code: string;
  expiresAt: Date;
}

/**
 * Cria um novo código de verificação para o usuário.
 * Invalida automaticamente qualquer código anterior da mesma finalidade.
 */
export async function createVerificationCode(
  userId: string,
  purpose: VerificationPurpose
): Promise<CreateCodeResult> {
  const code = generateSecureCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

  // Invalidar códigos anteriores da mesma finalidade
  await prisma.verificationCode.updateMany({
    where: {
      userId,
      purpose,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });

  // Criar novo código
  const verificationCode = await prisma.verificationCode.create({
    data: {
      userId,
      codeHash,
      purpose,
      expiresAt,
    },
  });

  return {
    id: verificationCode.id,
    code, // Retornar o código em texto puro APENAS para envio por e-mail
    expiresAt,
  };
}

export interface ValidateCodeResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}

/**
 * Valida um código de verificação com proteção contra brute force.
 * Retorna success: true apenas se o código estiver correto e válido.
 */
export async function validateVerificationCode(
  userId: string,
  code: string,
  purpose: VerificationPurpose
): Promise<ValidateCodeResult> {
  // Buscar o código mais recente da finalidade especificada
  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      userId,
      purpose,
      isUsed: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!verificationCode) {
    return {
      success: false,
      error: 'Nenhum código de verificação encontrado. Solicite um novo código.',
    };
  }

  // Verificar expiração
  if (new Date() > verificationCode.expiresAt) {
    return {
      success: false,
      error: 'Código expirado. Solicite um novo código.',
    };
  }

  // Verificar limite de tentativas
  if (verificationCode.attempts >= verificationCode.maxAttempts) {
    // Invalidar o código
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true },
    });
    return {
      success: false,
      error: 'Limite de tentativas excedido. Solicite um novo código.',
    };
  }

  // Verificar se o código está correto
  const codeValid = compareCode(code, verificationCode.codeHash);

  const newAttempts = verificationCode.attempts + 1;
  const shouldMarkUsed = codeValid || newAttempts >= verificationCode.maxAttempts;

  // Atualização atômica: updateMany com condição isUsed=false garante
  // que apenas UMA requisição "ganha" o uso do código (previne race condition)
  const updateResult = await prisma.verificationCode.updateMany({
    where: {
      id: verificationCode.id,
      isUsed: false, // Só atualiza se ainda não foi usado
    },
    data: {
      attempts: newAttempts,
      isUsed: shouldMarkUsed,
    },
  });

  // Se count === 0, outro request já usou/invalidou o código simultaneamente
  if (updateResult.count === 0) {
    return {
      success: false,
      error: 'Código já foi utilizado ou expirado. Solicite um novo código.',
    };
  }

  if (!codeValid) {
    const attemptsRemaining = verificationCode.maxAttempts - newAttempts;
    return {
      success: false,
      error: attemptsRemaining > 0
        ? `Código inválido. ${attemptsRemaining} tentativa(s) restante(s).`
        : 'Código inválido. Limite de tentativas excedido.',
      attemptsRemaining,
    };
  }

  return { success: true };
}

/**
 * Verifica se um usuário pode solicitar um novo código (cooldown de 60 segundos).
 */
export async function canRequestCode(
  userId: string,
  purpose: VerificationPurpose
): Promise<{ allowed: boolean; waitSeconds?: number }> {
  const lastCode = await prisma.verificationCode.findFirst({
    where: {
      userId,
      purpose,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!lastCode) {
    return { allowed: true };
  }

  const elapsed = Date.now() - lastCode.createdAt.getTime();
  const cooldownMs = 60 * 1000; // 60 segundos

  if (elapsed < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

/**
 * Limpa códigos expirados (chamar periodicamente, ex: a cada hora).
 */
export async function cleanupExpiredCodes(): Promise<number> {
  const now = new Date();
  const result = await prisma.verificationCode.deleteMany({
    where: {
      OR: [
        // Códigos expirados
        { expiresAt: { lt: now } },
        // Códigos já utilizados (manter apenas os últimos 24h para auditoria)
        {
          isUsed: true,
          createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      ],
    },
  });
  return result.count;
}
