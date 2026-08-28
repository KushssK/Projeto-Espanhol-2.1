import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendVerificationCode } from '../lib/email';
import { createVerificationCode, canRequestCode, validateVerificationCode } from '../lib/code';
import { signToken } from '../lib/token';
import { publicUser } from '../lib/user';
import type { VerificationPurpose } from '../generated/prisma/enums';

export const sendCode = async (req: Request, res: Response) => {
  try {
    const { email, purpose } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'E-mail é obrigatório.' });
    }

    // Endpoint público — aceita apenas REGISTER. Login usa /auth/login (gera código server-side)
    const validPurpose: VerificationPurpose = 'REGISTER';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Por segurança, não revelar se o e-mail existe
      return res.status(200).json({ message: 'Se o e-mail estiver cadastrado, você receberá um código de verificação.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Conta banida.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Esta conta já está verificada. Faça login normalmente.' });
    }

    // Verificar se o usuário pode solicitar um novo código (cooldown de 60s)
    const cooldown = await canRequestCode(user.id, validPurpose);
    if (!cooldown.allowed) {
      return res.status(429).json({
        error: `Aguarde ${cooldown.waitSeconds} segundo(s) para solicitar um novo código.`,
        waitSeconds: cooldown.waitSeconds,
      });
    }

    // Criar novo código (invalida automaticamente o anterior)
    const { code, expiresAt } = await createVerificationCode(user.id, validPurpose);
    const sent = await sendVerificationCode(user.email, code, validPurpose);

    if (!sent.success) {
      return res.status(500).json({
        error: sent.error || 'Erro ao enviar e-mail. Tente novamente.',
      });
    }

    return res.status(200).json({
      message: 'Código de verificação enviado para seu e-mail.',
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Erro ao enviar código:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'E-mail e código são obrigatórios.' });
    }

    // Endpoint exclusivo para cadastro — login usa /auth/login/confirm
    const validPurpose: VerificationPurpose = 'REGISTER';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'E-mail não encontrado.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Conta banida.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Esta conta já está verificada.' });
    }

    // Validar o código com proteção contra brute force
    const result = await validateVerificationCode(user.id, code, validPurpose);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    // Código válido — marcar e-mail como verificado
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    const token = signToken(user.id, user.role);

    return res.status(200).json({
      message: 'E-mail verificado com sucesso!',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};
