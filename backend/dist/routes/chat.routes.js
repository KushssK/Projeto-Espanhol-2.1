"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const upload_config_1 = require("../config/upload.config");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Todas as rotas de chat requerem autenticação
router.use(auth_middleware_1.authenticateToken);
// Salas
router.post('/rooms/private', chat_controller_1.createPrivateRoom);
router.post('/rooms/group', chat_controller_1.createGroupRoom);
router.get('/rooms', chat_controller_1.getMyRooms);
// Mensagens
router.get('/rooms/:roomId/messages', chat_controller_1.getRoomMessages);
router.post('/rooms/:roomId/messages', upload_config_1.uploadChat.single('file'), chat_controller_1.sendMessage);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map