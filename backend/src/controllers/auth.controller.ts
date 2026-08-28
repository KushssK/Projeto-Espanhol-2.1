import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/token';
import { publicUser } from '../lib/user';
import { registerSchema, loginSchema, bootstrapAdminSchema } from '../validators/auth.validators';

// ============================================================================
// Função auxiliar: normalizar e-mail
// ============================================================================

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ============================================================================
// Função auxiliar: criar conta de usuário
// ============================================================================

async function createUserAccount(params: {
  email: string;
  password: string;
  dob: string;
  username?: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: params.email },
        { username: params.username || undefined },
      ],
    },
  });

  if (existingUser) {
    return { error: 'Usuário já existe com este e-mail ou username.', status: 400 };
  }

  const hashedPassword = await bcrypt.hash(params.password, 10);

  const newUser = await prisma.user.create({
    data: {
      email: params.email,
      passwordHash: hashedPassword,
      dob: new Date(params.dob),
      username: params.username,
      role: params.role,
    },
  });

  return { newUser };
}

// ============================================================================
// CADASTRO — com whitelist de e-mails
// ============================================================================

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados de cadastro inválidos.' });
    }

    const { email, password, dob, username } = parsed.data;
    const normalizedEmail = normalizeEmail(email);

    // Consultar whitelist de e-mails para determinar a role
    const whitelistEntry = await prisma.whitelistEmail.findUnique({
      where: { email: normalizedEmail },
    });

    const role = whitelistEntry ? whitelistEntry.role : 'STUDENT';

    const result = await createUserAccount({
      email: normalizedEmail,
      password,
      dob,
      username,
      role,
    });

    if ('error' in result) {
      return res.status(result.status ?? 400).json({ error: result.error });
    }

    const { newUser } = result;

    // Login automático — token direto, sem verificação por e-mail
    return res.status(201).json({
      message: 'Conta criada com sucesso!',
      token: signToken(newUser.id, newUser.role),
      user: publicUser(newUser),
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// BOOTSTRAP ADMIN — cria primeiro admin com secret
// ============================================================================

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
      email: normalizeEmail(email),
      password,
      dob,
      username,
      role: 'ADMIN',
    });

    if ('error' in result) {
      return res.status(result.status ?? 400).json({ error: result.error });
    }

    const { newUser } = result;

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
// LOGIN — direto com e-mail e senha (sem 2FA)
// ============================================================================

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'E-mail e senha são obrigatórios.' });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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

    // Login direto — sem código de verificação
    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      token: signToken(user.id, user.role),
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
