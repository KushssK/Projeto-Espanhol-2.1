"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const http_1 = require("http");
const socket_1 = require("./socket");
// Rotas
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const module_routes_1 = __importDefault(require("./routes/module.routes"));
const lesson_routes_1 = __importDefault(require("./routes/lesson.routes"));
const attachment_routes_1 = __importDefault(require("./routes/attachment.routes"));
const progress_routes_1 = __importDefault(require("./routes/progress.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const whitelist_routes_1 = __importDefault(require("./routes/whitelist.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const mediaLibrary_routes_1 = __importDefault(require("./routes/mediaLibrary.routes"));
// ============================================================================
// App Setup
// ============================================================================
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Fail-fast em produção: JWT_SECRET é obrigatório
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secret')) {
    console.error('❌ JWT_SECRET obrigatório em produção. Configure uma string forte no .env.');
    process.exit(1);
}
// Confiar no 1º proxy (Apache/cPanel) para req.ip real — essencial para o rate limit
app.set('trust proxy', 1);
// Middleware global
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ============================================================================
// Criar diretórios de upload se não existem
// ============================================================================
const uploadDirs = ['uploads/attachments', 'uploads/chat', 'uploads/branding', 'uploads/avatars', 'uploads/media'];
for (const dir of uploadDirs) {
    const fullPath = path_1.default.join(process.cwd(), dir);
    if (!fs_1.default.existsSync(fullPath)) {
        fs_1.default.mkdirSync(fullPath, { recursive: true });
    }
}
// Servir arquivos estáticos de upload
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// ============================================================================
// Rotas da API
// ============================================================================
app.use('/api/auth', auth_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/modules', module_routes_1.default);
app.use('/api/lessons', lesson_routes_1.default);
app.use('/api/attachments', attachment_routes_1.default);
app.use('/api/progress', progress_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/admin/whitelist', whitelist_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/media-library', mediaLibrary_routes_1.default);
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
app.use((err, _req, res, _next) => {
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
const server = (0, http_1.createServer)(app);
(0, socket_1.setupSocket)(server);
server.listen(port, () => {
    console.log(`🚀 Espanhol em Rede API rodando na porta ${port}`);
    console.log(`📡 Socket.IO ativo`);
    console.log(`📁 Uploads servidos em /uploads`);
});
//# sourceMappingURL=index.js.map