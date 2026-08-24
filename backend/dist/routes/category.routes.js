"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/module/:moduleId', category_controller_1.getCategoriesByModule);
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, category_controller_1.createCategory);
router.put('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, category_controller_1.updateCategory);
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, category_controller_1.deleteCategory);
router.put('/reorder/:moduleId', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, category_controller_1.reorderCategories);
exports.default = router;
//# sourceMappingURL=category.routes.js.map