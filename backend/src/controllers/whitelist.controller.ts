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
// POST /api/admin/whitelist — Adicionar ou atualizar e-mail na whitelist
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

    // Upsert na WhitelistEmail (permite atualizar role se já existir)
    const entry = await prisma.whitelistEmail.upsert({
      where: { email: normalizedEmail },
      update: { role },
      create: { email: normalizedEmail, role },
    });

    // Se o usuário já estiver cadastrado no banco, atualiza o cargo imediatamente
    let userPromoted = false;
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.role !== role) {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { role },
      });
      userPromoted = true;
    }

    return res.status(200).json({
      message: userPromoted
        ? `E-mail autorizado como ${role} e usuário existente atualizado.`
        : `E-mail autorizado como ${role} com sucesso.`,
      entry,
    });
  } catch (error: unknown) {
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
    if (!emailParam) {
      return res.status(400).json({ error: 'E-mail é obrigatório.' });
    }
    const normalizedEmail = emailParam.trim().toLowerCase();

    // 1. Proteção contra auto-remoção do próprio admin conectado
    const currentAdminId = req.user?.userId;
    if (currentAdminId) {
      const currentAdmin = await prisma.user.findUnique({
        where: { id: currentAdminId },
        select: { email: true },
      });
      if (currentAdmin && currentAdmin.email.toLowerCase() === normalizedEmail) {
        return res.status(400).json({
          error: 'Operação bloqueada: você não pode remover seu próprio e-mail de administrador da whitelist.',
        });
      }
    }

    // 2. Verificar se a entrada existe na whitelist
    const entry = await prisma.whitelistEmail.findUnique({
      where: { email: normalizedEmail },
    });

    if (!entry) {
      return res.status(404).json({ error: 'E-mail não encontrado na whitelist.' });
    }

    // 3. Proteção contra remoção do último ADMIN na whitelist
    if (entry.role === 'ADMIN') {
      const adminWhitelistCount = await prisma.whitelistEmail.count({
        where: { role: 'ADMIN' },
      });
      if (adminWhitelistCount <= 1) {
        return res.status(400).json({
          error: 'Operação bloqueada: não é possível remover o único administrador da whitelist.',
        });
      }
    }

    // 4. Remover da whitelist
    await prisma.whitelistEmail.delete({ where: { email: normalizedEmail } });

    // 5. Se o usuário existir e for ADMIN, revogar cargo para STUDENT se houver outro admin ativo
    let userDemoted = false;
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.role === 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isBanned: false },
      });
      if (activeAdminCount > 1) {
        await prisma.user.update({
          where: { email: normalizedEmail },
          data: { role: 'STUDENT' },
        });
        userDemoted = true;
      }
    }

    return res.status(200).json({
      message: userDemoted
        ? 'E-mail removido da whitelist e cargo de administrador do usuário revogado.'
        : 'E-mail removido da whitelist com sucesso.',
    });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'E-mail não encontrado na whitelist.' });
    }
    console.error('Erro ao remover whitelist:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

