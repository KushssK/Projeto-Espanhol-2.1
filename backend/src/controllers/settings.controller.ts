import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.appSettings.findFirst();

    // Cria as configurações padrão se não existir (ID 1)
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: 1,
          themeColor: '#7C3AED',
          logoUrl: null
        }
      });
    }

    return res.status(200).json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { themeColor, logoUrl } = req.body;

    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: { themeColor, logoUrl },
      create: { id: 1, themeColor: themeColor || '#7C3AED', logoUrl }
    });

    return res.status(200).json({
      message: 'Identidade visual atualizada com sucesso',
      settings
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

export const uploadSettingsLogo = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Envie o arquivo no campo logo.' });
    }

    const logoUrl = `/uploads/branding/${file.filename}`;

    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: { logoUrl },
      create: { id: 1, themeColor: '#7C3AED', logoUrl },
    });

    return res.status(200).json({
      message: 'Logo atualizada com sucesso',
      settings,
    });
  } catch (error) {
    console.error('Erro ao enviar logo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
