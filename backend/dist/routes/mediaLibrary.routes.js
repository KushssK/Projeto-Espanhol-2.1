"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mediaLibrary_controller_1 = require("../controllers/mediaLibrary.controller");
const upload_config_1 = require("../config/upload.config");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', mediaLibrary_controller_1.listMediaLibrary);
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireStaff, upload_config_1.uploadMediaLibrary.single('file'), mediaLibrary_controller_1.createMediaItem);
router.put('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireStaff, upload_config_1.uploadMediaLibrary.single('file'), mediaLibrary_controller_1.updateMediaItem);
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, mediaLibrary_controller_1.deleteMediaItem);
router.put('/reorder', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, mediaLibrary_controller_1.reorderMediaLibrary);
exports.default = router;
//# sourceMappingURL=mediaLibrary.routes.js.map