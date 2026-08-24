"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const progress_controller_1 = require("../controllers/progress.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Todas as rotas de progresso requerem autenticação
router.use(auth_middleware_1.authenticateToken);
router.post('/:lessonId', progress_controller_1.markLessonComplete);
router.get('/me', progress_controller_1.getMyProgress);
router.get('/module/:moduleId', progress_controller_1.getModuleProgress);
router.get('/leaderboard', progress_controller_1.getLeaderboard);
exports.default = router;
//# sourceMappingURL=progress.routes.js.map