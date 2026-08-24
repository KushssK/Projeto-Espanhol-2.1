"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const upload_config_1 = require("../config/upload.config");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Rotas autenticadas (qualquer role)
router.get('/me', auth_middleware_1.authenticateToken, user_controller_1.getMyProfile);
router.put('/me', auth_middleware_1.authenticateToken, upload_config_1.uploadAvatar.single('avatar'), user_controller_1.updateMyProfile);
router.get('/search', auth_middleware_1.authenticateToken, user_controller_1.searchUsers);
// Rotas Admin
router.get('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, user_controller_1.listUsers);
router.put('/:userId/ban', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, user_controller_1.banUser);
router.put('/:userId/unban', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, user_controller_1.unbanUser);
router.get('/:userId/progress', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, user_controller_1.getUserProgress);
exports.default = router;
//# sourceMappingURL=user.routes.js.map