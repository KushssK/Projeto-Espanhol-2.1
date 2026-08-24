import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { setupSocket } from './socket';

// Rotas
import authRoutes from './routes/auth.routes';
import settingsRoutes from './routes/settings.routes';
import moduleRoutes from './routes/module.routes';
import lessonRoutes from './routes/lesson.routes';
import attachmentRoutes from './routes/attachment.routes';
import progressRoutes from './routes/progress.routes';
import userRoutes from './routes/user.routes';
import chatRoutes from './routes/chat.routes';
import whitelistRoutes from './routes/whitelist.routes';
import categoryRoutes from './routes/category.routes';
import mediaLibraryRoutes from './routes/mediaLibrary.routes';
import verificationRoutes from './routes/verification.routes';

// ============================================================================
// App Setup
// ============================================================================
const app = express();
const port = process.env.PORT || 3000;

// Fail-fast em produção: JWT_SECRET é obrigatório
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secret')) {
  console.error('❌ JWT_SECRET obrigatório em produção. Configure uma string forte no .env.');
  process.exit(1);
}

// Confiar no 1º proxy (Apache/cPanel) para req.ip real — essencial para o rate limit
app.set('trust proxy', 1);

// Middleware global
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// Criar diretórios de upload se não existem
// ============================================================================
const uploadDirs = ['uploads/attachments', 'uploads/chat', 'uploads/branding', 'uploads/avatars', 'uploads/media'];
for (const dir of uploadDirs) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

// Servir arquivos estáticos de upload
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ============================================================================
// Rotas da API
// ============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin/whitelist', whitelistRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/media-library', mediaLibraryRoutes);
app.use('/api/verification', verificationRoutes);

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Espanhol em Rede API está rodando!',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Tratamento global de erros do Multer
// ============================================================================
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Arquivo excede o limite de 20MB.' });
  }
  if (err.message?.includes('Tipo de arquivo não permitido') || err.message?.includes('Tipo de imagem não permitido')) {
    return res.status(415).json({ error: err.message });
  }
  console.error('Erro não tratado:', err);
  return res.status(500).json({ error: 'Erro interno no servidor.' });
});

// ============================================================================
// HTTP Server + Socket.IO
// ============================================================================
const server = createServer(app);
setupSocket(server);

server.listen(port, () => {
  console.log(`🚀 Espanhol em Rede API rodando na porta ${port}`);
  console.log(`📡 Socket.IO ativo`);
  console.log(`📁 Uploads servidos em /uploads`);
});
