"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const module_controller_1 = require("../controllers/module.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Rotas públicas
router.get('/', module_controller_1.getModules);
router.get('/:id', module_controller_1.getModuleById);
// Rotas protegidas (Admin)
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, module_controller_1.createModule);
router.put('/reorder', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, module_controller_1.reorderModules);
router.put('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, module_controller_1.updateModule);
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, module_controller_1.deleteModule);
exports.default = router;
//# sourceMappingURL=module.routes.js.map