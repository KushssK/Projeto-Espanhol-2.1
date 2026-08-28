"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lesson_controller_1 = require("../controllers/lesson.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Rotas públicas
router.get('/module/:moduleId', lesson_controller_1.getLessonsByModule);
router.get('/:id', lesson_controller_1.getLessonById);
// Rotas protegidas (Staff: Admin + Teacher)
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireStaff, lesson_controller_1.createLesson);
router.put('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireStaff, lesson_controller_1.updateLesson);
// Rotas protegidas (Admin only)
router.put('/reorder/:moduleId', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, lesson_controller_1.reorderLessons);
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, lesson_controller_1.deleteLesson);
exports.default = router;
//# sourceMappingURL=lesson.routes.js.map