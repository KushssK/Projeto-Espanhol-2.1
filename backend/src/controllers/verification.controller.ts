import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { sendVerificationCode } from '../lib/email';

function generateNumericCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'E-mail é obrigatório.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Por segurança, não revelar se o e-mail existe
      return res.status(200).json({ message: 'Se o e-mail estiver cadastrado, você receberá um código de verificação.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Esta conta já está verificada. Faça login normalmente.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Conta banida.' });
    }

    const code = generateNumericCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await prisma.user.update({
      where: { email },
      data: {
        verificationCode: code,
        verificationExpires: expires,
      },
    });

    const sent = await sendVerificationCode(email, code);
    if (!sent) {
      return res.status(500).json({ error: 'Erro ao enviar e-mail. Tente novamente.' });
    }

    return res.status(200).json({ message: 'Código de verificação enviado para seu e-mail.' });
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'E-mail não encontrado.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Esta conta já está verificada.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Conta banida.' });
    }

    if (!user.verificationCode || !user.verificationExpires) {
      return res.status(400).json({ error: 'Nenhum código de verificação solicitado. Solicite um novo código.' });
    }

    if (new Date() > user.verificationExpires) {
      return res.status(400).json({ error: 'Código expirado. Solicite um novo código.' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Código inválido.' });
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationExpires: null,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'E-mail verificado com sucesso!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        avatarUrl: user.avatarUrl,
        isBanned: false,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};
