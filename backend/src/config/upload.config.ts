import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';

// ============================================================================
// Tipos MIME permitidos por categoria
// ============================================================================
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  attachment: [
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  chat: [
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'text/plain',
  ],
};

// ============================================================================
// Storage em disco com subdiretórios
// ============================================================================
const createStorage = (subdir: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(process.cwd(), 'uploads', subdir));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${randomUUID()}${ext}`);
    },
  });

// ============================================================================
// Filtro de tipos
// ============================================================================
const createFileFilter = (category: string): multer.Options['fileFilter'] => {
  return (_req, file, cb) => {
    const allowed = ALLOWED_MIME_TYPES[category];
    if (allowed && allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    }
  };
};

// ============================================================================
// Instâncias de Upload exportadas
// ============================================================================

/** Upload de attachments de aulas (PDF, áudio, imagens) */
export const uploadAttachment = multer({
  storage: createStorage('attachments'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: createFileFilter('attachment'),
});

/** Upload de mídias do chat (imagens, áudios, PDFs) */
export const uploadChat = multer({
  storage: createStorage('chat'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: createFileFilter('chat'),
});

/** Upload de logo da plataforma */
export const uploadLogo = multer({
  storage: createStorage('branding'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de imagem não permitido: ${file.mimetype}`));
    }
  },
});

/** Upload de avatar do usuário */
export const uploadAvatar = multer({
  storage: createStorage('avatars'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de imagem não permitido: ${file.mimetype}`));
    }
  },
});

/** Upload do acervo multimídia (PDF, áudio, imagem) */
export const uploadMediaLibrary = multer({
  storage: createStorage('media'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: createFileFilter('attachment'),
});
