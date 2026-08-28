import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Role } from '../generated/prisma/enums';

// ============================================================================
// GET /api/admin/whitelist — Listar e-mails na whitelist
// ============================================================================

export const listWhitelist = async (_req: AuthRequest, res: Response) => {
  try {
    const entries = await prisma.whitelistEmail.findMany({
      orderBy: { email: 'asc' },
    });
    return res.status(200).json(entries);
  } catch (error) {
    console.error('Erro ao listar whitelist:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// POST /api/admin/whitelist — Adicionar e-mail à whitelist
// ============================================================================

export const addWhitelist = async (req: AuthRequest, res: Response) => {
  try {
    const { email, role } = req.body as { email?: string; role?: Role };

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'E-mail é obrigatório.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    if (!role || (role !== 'TEACHER' && role !== 'ADMIN')) {
      return res.status(400).json({ error: 'Role deve ser TEACHER ou ADMIN.' });
    }

    const entry = await prisma.whitelistEmail.create({
      data: { email: normalizedEmail, role },
    });

    return res.status(201).json({ message: 'E-mail autorizado com sucesso', entry });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'E-mail já consta na whitelist.' });
    }
    console.error('Erro ao adicionar whitelist:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ============================================================================
// DELETE /api/admin/whitelist/:email — Remover e-mail da whitelist
// ============================================================================

export const removeWhitelist = async (req: AuthRequest, res: Response) => {
  try {
    const emailParam = req.params.email as string;
    const normalizedEmail = emailParam.trim().toLowerCase();

    await prisma.whitelistEmail.delete({ where: { email: normalizedEmail } });
    return res.status(200).json({ message: 'E-mail removido da whitelist.' });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'E-mail não encontrado na whitelist.' });
    }
    console.error('Erro ao remover whitelist:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
