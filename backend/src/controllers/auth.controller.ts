import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { hashCpf, normalizeCpf } from '../lib/cpf';
import { sendVerificationCode } from '../lib/email';
import { registerSchema, registerStaffSchema, loginSchema, bootstrapAdminSchema } from '../validators/auth.validators';

function generateNumericCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}

function publicUser(user: {
  id: string;
  email: string;
  role: string;
  username: string | null;
  avatarUrl: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
    avatarUrl: user.avatarUrl,
    isBanned: false,
  };
}

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

    // Gerar e enviar código de verificação
    const code = generateNumericCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
      where: { id: newUser.id },
      data: { verificationCode: code, verificationExpires: expires },
    });
    await sendVerificationCode(newUser.email, code);

    return res.status(201).json({
      message: 'Conta criada! Verifique seu e-mail para o código de verificação.',
      requiresVerification: true,
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

    // Gerar e enviar código de verificação
    const code = generateNumericCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
      where: { id: newUser.id },
      data: { verificationCode: code, verificationExpires: expires },
    });
    await sendVerificationCode(newUser.email, code);

    return res.status(201).json({
      message: 'Conta staff criada! Verifique seu e-mail para o código de verificação.',
      requiresVerification: true,
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

    if (!user.isVerified) {
      // Enviar novo código de verificação
      const code = generateNumericCode();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.user.update({
        where: { email },
        data: { verificationCode: code, verificationExpires: expires },
      });
      await sendVerificationCode(email, code);

      return res.status(403).json({
        error: 'Conta não verificada. Um novo código foi enviado para seu e-mail.',
        requiresVerification: true,
        email: user.email,
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    return res.status(200).json({
      message: 'Login realizado com sucesso',
      token: signToken(user.id, user.role),
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
