import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/token';
import { publicUser } from '../lib/user';
import { generateAccessCode } from '../lib/access-code';
import { AuthRequest } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validators';

// ============================================================================
// Constantes de segurança (anti brute force)
// ============================================================================

const HASH_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5; // limite de tentativas por conta
const LOCKOUT_MS = 15 * 60 * 1000; // bloqueio de 15 minutos após excesso de tentativas

// ============================================================================
// Função auxiliar: normalizar e-mail
// ============================================================================

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ============================================================================
// CADASTRO — senha (hash bcrypt) + código de acesso exibido UMA única vez
// ============================================================================

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados de cadastro inválidos.' });
    }

    const { email, password, dob, username } = parsed.data;
    const normalizedEmail = normalizeEmail(email);

    // Consultar whitelist de e-mails para determinar a role (ADMIN/TEACHER/STUDENT)
    const whitelistEntry = await prisma.whitelistEmail.findUnique({
      where: { email: normalizedEmail },
    });
    const role = whitelistEntry ? whitelistEntry.role : 'STUDENT';

    // Senha: armazenada SOMENTE como hash bcrypt (nunca em texto puro).
    const passwordHash = await bcrypt.hash(password, HASH_ROUNDS);

    // Código de acesso: gerado de forma criptograficamente segura (crypto.randomInt),
    // também armazenado SOMENTE como hash bcrypt — nunca em texto puro.
    const accessCode = generateAccessCode();
    const accessCodeHash = await bcrypt.hash(accessCode, HASH_ROUNDS);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: username || undefined },
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe com este e-mail ou username.' });
    }

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        accessCodeHash,
        dob: new Date(dob),
        username,
        role,
      },
    });

    // O código é devolvido UMA única vez nesta resposta, para o usuário guardar.
    // Nunca é registrado em logs e os hashes nunca são expostos pela API.
    return res.status(201).json({
      message: 'Conta criada com sucesso! Guarde o seu código de acesso.',
      token: signToken(newUser.id, newUser.role),
      user: publicUser(newUser),
      accessCode,
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// LOGIN — e-mail + senha + código de acesso (duas credenciais obrigatórias)
// ============================================================================

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'E-mail, senha e código de acesso são obrigatórios.' });
    }

    const { email, password, accessCode } = parsed.data;
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Mensagem genérica — não revela se o e-mail existe (anti enumeração)
    if (!user) {
      return res.status(401).json({ error: 'E-mail, senha ou código de acesso inválidos.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Conta banida.' });
    }

    // Bloqueio temporário após tentativas em excesso
    if (user.lockoutUntil && user.lockoutUntil.getTime() > Date.now()) {
      const minutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60_000);
      return res.status(429).json({
        error: `Muitas tentativas. Tente novamente em ${minutes} minuto(s).`,
      });
    }

    // Comparações seguras: bcrypt.compare é de tempo aproximadamente constante.
    // Ambas as credenciais são verificadas (senha E código).
    const [passwordMatches, codeMatches] = await Promise.all([
      user.passwordHash ? bcrypt.compare(password, user.passwordHash) : Promise.resolve(false),
      user.accessCodeHash ? bcrypt.compare(accessCode, user.accessCodeHash) : Promise.resolve(false),
    ]);

    if (!passwordMatches || !codeMatches) {
      const failedAttempts = user.failedLoginAttempts + 1;

      if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Acima do limite: zera o contador e bloqueia a conta por 15 minutos
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockoutUntil: new Date(Date.now() + LOCKOUT_MS),
          },
        });
        return res.status(429).json({
          error: 'Muitas tentativas. Tente novamente em 15 minutos.',
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: failedAttempts },
      });
      return res.status(401).json({ error: 'E-mail, senha ou código de acesso inválidos.' });
    }

    // Sucesso: reseta tentativas e libera qualquer bloqueio
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockoutUntil: null },
    });

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

// ============================================================================
// GERAR NOVO CÓDIGO DE ACESSO — invalida o anterior, mantém a senha intacta
// ============================================================================

export const regenerateAccessCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Gera novo código e sobrescreve o hash — o anterior é invalidado imediatamente.
    // A senha (passwordHash) NÃO é alterada por esta operação.
    const accessCode = generateAccessCode();
    const accessCodeHash = await bcrypt.hash(accessCode, HASH_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { accessCodeHash, failedLoginAttempts: 0, lockoutUntil: null },
    });

    // Exibido UMA única vez; apenas o hash fica armazenado.
    return res.status(200).json({
      message: 'Novo código gerado! O código anterior foi invalidado. Guarde este novo código.',
      accessCode,
    });
  } catch (error) {
    console.error('Erro ao gerar novo código de acesso:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};