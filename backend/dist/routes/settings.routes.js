"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const upload_config_1 = require("../config/upload.config");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', settings_controller_1.getSettings);
router.put('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, settings_controller_1.updateSettings);
router.post('/logo', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, upload_config_1.uploadLogo.single('logo'), settings_controller_1.uploadSettingsLogo);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map