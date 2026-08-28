import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { hashCpf, normalizeCpf } from '../lib/cpf';
import { sendVerificationCode } from '../lib/email';
import { createVerificationCode, validateVerificationCode } from '../lib/code';
import { signToken } from '../lib/token';
import { publicUser } from '../lib/user';
import { registerSchema, registerStaffSchema, loginSchema, bootstrapAdminSchema } from '../validators/auth.validators';

async function createUserAccount(params: {
  email: string;
  password: string;
  dob: string;
  username?: string;
  cpfHash?: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: params.email },
        { username: params.username || undefined },
        ...(params.cpfHash ? [{ cpfHash: params.cpfHash }] : []),
      ],
    },
  });

  if (existingUser) {
    return { error: 'Usuário já existe com este e-mail, username ou CPF.', status: 400 };
  }

  const hashedPassword = await bcrypt.hash(params.password, 10);

  const newUser = await prisma.user.create({
    data: {
      email: params.email,
      passwordHash: hashedPassword,
      dob: new Date(params.dob),
      username: params.username,
      role: params.role,
      cpfHash: params.cpfHash,
    },
  });

  return { newUser };
}

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados de cadastro inválidos.' });
    }

    const { email, password, dob, username } = parsed.data;
    const cpf = req.body.cpf;

    if (cpf) {
      return res.status(403).json({
        error: 'Cadastro de staff deve usar POST /api/auth/register/staff com CPF autorizado.',
      });
    }

    const result = await createUserAccount({
      email,
      password,
      dob,
      username,
      role: 'STUDENT',
    });

    if ('error' in result) {
      return res.status(result.status ?? 400).json({ error: result.error });
    }

    const { newUser } = result;

    // Gerar e enviar código de verificação (REGISTER)
    const { code } = await createVerificationCode(newUser.id, 'REGISTER');
    const emailSent = await sendVerificationCode(newUser.email, code, 'REGISTER');

    // Em produção, se o SMTP falhar, informar o usuário (mas manter a conta)
    if (!emailSent.success) {
      return res.status(201).json({
        message: 'Conta criada, mas não foi possível enviar o e-mail de verificação. Tente reenviar o código pela tela de verificação.',
        requiresVerification: true,
        purpose: 'REGISTER',
        email: newUser.email,
        emailFailed: true,
      });
    }

    return res.status(201).json({
      message: 'Conta criada! Verifique seu e-mail para o código de verificação.',
      requiresVerification: true,
      purpose: 'REGISTER',
      email: newUser.email,
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const registerStaff = async (req: Request, res: Response) => {
  try {
    const parsed = registerStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados de cadastro staff inválidos.' });
    }

    const { email, password, dob, cpf, username } = parsed.data;

    const normalizedCpf = normalizeCpf(cpf);
    if (!normalizedCpf) {
      return res.status(400).json({ error: 'CPF inválido. Informe 11 dígitos.' });
    }

    const whitelistEntry = await prisma.whitelist_CPF.findUnique({
      where: { cpf: normalizedCpf },
    });

    if (!whitelistEntry) {
      return res.status(403).json({ error: 'CPF não autorizado para registro de Staff.' });
    }

    const result = await createUserAccount({
      email,
      password,
      dob,
      username,
      cpfHash: hashCpf(normalizedCpf),
      role: whitelistEntry.role,
    });

    if ('error' in result) {
      return res.status(result.status ?? 400).json({ error: result.error });
    }

    const { newUser } = result;

    // Gerar e enviar código de verificação (REGISTER)
    const { code } = await createVerificationCode(newUser.id, 'REGISTER');
    const emailSent = await sendVerificationCode(newUser.email, code, 'REGISTER');

    if (!emailSent.success) {
      return res.status(201).json({
        message: 'Conta staff criada, mas não foi possível enviar o e-mail de verificação. Tente reenviar o código.',
        requiresVerification: true,
        purpose: 'REGISTER',
        email: newUser.email,
        emailFailed: true,
      });
    }

    return res.status(201).json({
      message: 'Conta staff criada! Verifique seu e-mail para o código de verificação.',
      requiresVerification: true,
      purpose: 'REGISTER',
      email: newUser.email,
    });
  } catch (error) {
    console.error('Erro no registro staff:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const bootstrapAdmin = async (req: Request, res: Response) => {
  try {
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
    if (!bootstrapSecret) {
      return res.status(503).json({ error: 'Endpoint desabilitado. Configure BOOTSTRAP_SECRET no servidor.' });
    }

    const parsed = bootstrapAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' });
    }

    const { secret, email, password, dob, username } = parsed.data;

    if (secret !== bootstrapSecret) {
      return res.status(403).json({ error: 'Chave de bootstrap inválida.' });
    }

    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin) {
      return res.status(403).json({
        error: 'Já existe um administrador no sistema. Faça login normalmente em /login.',
      });
    }

    const result = await createUserAccount({
      email,
      password,
      dob,
      username,
      role: 'ADMIN',
    });

    if ('error' in result) {
      return res.status(result.status ?? 400).json({ error: result.error });
    }

    const { newUser } = result;

    // Admin criado via bootstrap já sai verificado
    await prisma.user.update({
      where: { id: newUser.id },
      data: { isVerified: true },
    });

    return res.status(201).json({
      message: 'Admin criado com sucesso!',
      token: signToken(newUser.id, newUser.role),
      user: publicUser(newUser),
    });
  } catch (error) {
    console.error('Erro no bootstrap admin:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// LOGIN — Agora com 2FA (código por e-mail) para todos os usuários
// ============================================================================

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'E-mail e senha são obrigatórios.' });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Conta banida.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Se a conta não está verificada, gerar código de REGISTER primeiro
    if (!user.isVerified) {
      const { code } = await createVerificationCode(user.id, 'REGISTER');
      const emailSent = await sendVerificationCode(user.email, code, 'REGISTER');

      return res.status(403).json({
        error: emailSent.success
          ? 'Conta não verificada. Um código foi enviado para seu e-mail.'
          : 'Conta não verificada. Não foi possível enviar o e-mail. Tente reenviar pela tela de verificação.',
        requiresVerification: true,
        purpose: 'REGISTER',
        email: user.email,
        ...(emailSent.success ? {} : { emailFailed: true }),
      });
    }

    // Se tudo OK, gerar código de LOGIN (2FA)
    const purpose = user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'LOGIN';
    const { code } = await createVerificationCode(user.id, purpose);
    const emailSent = await sendVerificationCode(user.email, code, purpose);

    if (!emailSent.success) {
      return res.status(503).json({
        error: 'Não foi possível enviar o código de verificação. Tente novamente em alguns instantes.',
      });
    }

    return res.status(200).json({
      message: 'Credenciais válidas! Um código foi enviado para seu e-mail.',
      requiresLoginVerification: true,
      purpose,
      email: user.email,
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// Confirmar login com código (2FA)
// ============================================================================

export const confirmLogin = async (req: Request, res: Response) => {
  try {
    const { email, code, purpose } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'E-mail e código são obrigatórios.' });
    }

    // Validar finalidade — não permitir misturar propósitos
    if (purpose && !['LOGIN', 'ADMIN_LOGIN'].includes(purpose)) {
      return res.status(400).json({ error: 'Finalidade inválida.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Conta banida.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Conta não verificada.',
        requiresVerification: true,
        purpose: 'REGISTER',
        email: user.email,
      });
    }

    // Servidor determina a finalidade com base no role — ignora purpose do cliente
    const finalPurpose = user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'LOGIN';

    // Validar o código com proteção contra brute force
    const result = await validateVerificationCode(user.id, code, finalPurpose as any);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    // Código válido — liberar sessão
    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      token: signToken(user.id, user.role),
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Erro na confirmação de login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
