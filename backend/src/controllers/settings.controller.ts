import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { isSafeHttpsUrl, isValidThemeColor } from '../lib/input-validation';

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

    // Validação estrita de entrada — nada de strings arbitrárias
    if (themeColor !== undefined) {
      if (typeof themeColor !== 'string' || !isValidThemeColor(themeColor)) {
        return res.status(400).json({ error: 'Cor inválida. Use formato hex (#RGB ou #RRGGBB).' });
      }
    }

    let normalizedLogoUrl: string | null = null;
    if (logoUrl !== undefined && logoUrl !== null && logoUrl !== '') {
      if (typeof logoUrl !== 'string' || !isSafeHttpsUrl(logoUrl)) {
        return res.status(400).json({ error: 'URL de logo inválida. Use apenas URLs https seguras.' });
      }
      normalizedLogoUrl = logoUrl.trim();
    }

    const data: { themeColor?: string; logoUrl?: string | null } = {};
    if (themeColor !== undefined) data.themeColor = themeColor.trim();
    if (logoUrl !== undefined) data.logoUrl = normalizedLogoUrl;

    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, themeColor: themeColor?.trim() || '#7C3AED', logoUrl: normalizedLogoUrl }
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
