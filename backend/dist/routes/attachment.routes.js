"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attachment_controller_1 = require("../controllers/attachment.controller");
const upload_config_1 = require("../config/upload.config");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Rota pública para listar attachments
router.get('/lesson/:lessonId', attachment_controller_1.getAttachmentsByLesson);
// Rotas protegidas (Staff)
router.post('/:lessonId', auth_middleware_1.authenticateToken, auth_middleware_1.requireStaff, upload_config_1.uploadAttachment.single('file'), attachment_controller_1.uploadAttachment);
// Rotas protegidas (Admin)
router.put('/reorder/:lessonId', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, attachment_controller_1.reorderAttachments);
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, attachment_controller_1.deleteAttachment);
exports.default = router;
//# sourceMappingURL=attachment.routes.js.map