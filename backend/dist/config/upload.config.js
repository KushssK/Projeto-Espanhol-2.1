"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMediaLibrary = exports.uploadAvatar = exports.uploadLogo = exports.uploadChat = exports.uploadAttachment = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
// ============================================================================
// Tipos MIME permitidos por categoria
// ============================================================================
const ALLOWED_MIME_TYPES = {
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
const createStorage = (subdir) => multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path_1.default.join(process.cwd(), 'uploads', subdir));
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, crypto_1.randomUUID)()}${ext}`);
    },
});
// ============================================================================
// Filtro de tipos
// ============================================================================
const createFileFilter = (category) => {
    return (_req, file, cb) => {
        const allowed = ALLOWED_MIME_TYPES[category];
        if (allowed && allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
        }
    };
};
// ============================================================================
// Instâncias de Upload exportadas
// ============================================================================
/** Upload de attachments de aulas (PDF, áudio, imagens) */
exports.uploadAttachment = (0, multer_1.default)({
    storage: createStorage('attachments'),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: createFileFilter('attachment'),
});
/** Upload de mídias do chat (imagens, áudios, PDFs) */
exports.uploadChat = (0, multer_1.default)({
    storage: createStorage('chat'),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: createFileFilter('chat'),
});
/** Upload de logo da plataforma */
exports.uploadLogo = (0, multer_1.default)({
    storage: createStorage('branding'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Tipo de imagem não permitido: ${file.mimetype}`));
        }
    },
});
/** Upload de avatar do usuário */
exports.uploadAvatar = (0, multer_1.default)({
    storage: createStorage('avatars'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Tipo de imagem não permitido: ${file.mimetype}`));
        }
    },
});
/** Upload do acervo multimídia (PDF, áudio, imagem) */
exports.uploadMediaLibrary = (0, multer_1.default)({
    storage: createStorage('media'),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: createFileFilter('attachment'),
});
//# sourceMappingURL=upload.config.js.map