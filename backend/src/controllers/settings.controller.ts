import { Request, Response } from 'express';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { isSafeHttpsUrl, isValidThemeColor } from '../lib/input-validation';
import { persistUpload, isSupabaseConfigured } from '../lib/storage';

/** Caminho canônico quando a logo é servida direto do banco. */
const LOGO_SERVE_PATH = '/api/settings/logo';

/** Monta a logoUrl para o cliente, com cache-buster quando servida do banco. */
function logoUrlForClient(s: { logoUrl: string | null; updatedAt: Date }): string | null {
  if (s.logoUrl === LOGO_SERVE_PATH) {
    return `${LOGO_SERVE_PATH}?v=${Math.floor(s.updatedAt.getTime() / 1000)}`;
  }
  return s.logoUrl;
}

/** Remove os bytes da logo do payload JSON (não são úteis no frontend). */
function shapeSettingsForClient<T extends { logoData?: unknown; logoMime?: unknown; logoUrl: string | null; updatedAt: Date }>(
  settings: T,
) {
  return { ...settings, logoUrl: logoUrlForClient(settings), logoData: undefined, logoMime: undefined };
}

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

    return res.status(200).json(shapeSettingsForClient(settings));
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
      settings: shapeSettingsForClient(settings)
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

    // Sem Supabase configurado: guarda os bytes no próprio banco — o disco do
    // Render é efêmero e perderia o arquivo no próximo deploy.
    if (!isSupabaseConfigured()) {
      const logoData = await fs.promises.readFile(file.path);
      fs.promises.unlink(file.path).catch(() => undefined);

      const settings = await prisma.appSettings.upsert({
        where: { id: 1 },
        update: { logoData, logoMime: file.mimetype, logoUrl: LOGO_SERVE_PATH },
        create: { id: 1, themeColor: '#7C3AED', logoData, logoMime: file.mimetype, logoUrl: LOGO_SERVE_PATH },
      });

      return res.status(200).json({
        message: 'Logo atualizada com sucesso',
        settings: shapeSettingsForClient(settings),
      });
    }

    const logoUrl = await persistUpload(file, 'branding');

    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: { logoUrl },
      create: { id: 1, themeColor: '#7C3AED', logoUrl },
    });

    return res.status(200).json({
      message: 'Logo atualizada com sucesso',
      settings: shapeSettingsForClient(settings),
    });
  } catch (error) {
    console.error('Erro ao enviar logo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

/** Serve a logo armazenada no banco (rota pública, com cache). */
export const getSettingsLogo = async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
    if (!settings?.logoData) {
      return res.status(404).json({ error: 'Logo não configurada.' });
    }

    res.setHeader('Content-Type', settings.logoMime || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(settings.logoData);
  } catch (error) {
    console.error('Erro ao buscar logo:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
