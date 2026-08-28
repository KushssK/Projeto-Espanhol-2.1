import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { normalizeCpf } from '../lib/cpf';
import { Role } from '../generated/prisma/enums';

export const listWhitelist = async (_req: AuthRequest, res: Response) => {
  try {
    const entries = await prisma.whitelist_CPF.findMany({
      orderBy: { cpf: 'asc' },
    });
    return res.status(200).json(entries);
  } catch (error) {
    console.error('Erro ao listar whitelist:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const addWhitelist = async (req: AuthRequest, res: Response) => {
  try {
    const { cpf, role } = req.body as { cpf?: string; role?: Role };

    const normalized = cpf ? normalizeCpf(cpf) : null;
    if (!normalized) {
      return res.status(400).json({ error: 'CPF inválido. Informe 11 dígitos.' });
    }

    if (!role || (role !== 'TEACHER' && role !== 'ADMIN')) {
      return res.status(400).json({ error: 'Role deve ser TEACHER ou ADMIN.' });
    }

    const entry = await prisma.whitelist_CPF.create({
      data: { cpf: normalized, role },
    });

    return res.status(201).json({ message: 'CPF autorizado com sucesso', entry });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'CPF já consta na whitelist.' });
    }
    console.error('Erro ao adicionar whitelist:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const removeWhitelist = async (req: AuthRequest, res: Response) => {
  try {
    const cpfParam = req.params.cpf as string;
    const normalized = normalizeCpf(cpfParam);
    if (!normalized) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }

    await prisma.whitelist_CPF.delete({ where: { cpf: normalized } });
    return res.status(200).json({ message: 'CPF removido da whitelist.' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'CPF não encontrado na whitelist.' });
    }
    console.error('Erro ao remover whitelist:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
