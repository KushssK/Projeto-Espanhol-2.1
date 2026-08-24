"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const rateLimit_middleware_1 = require("../middlewares/rateLimit.middleware");
const router = (0, express_1.Router)();
// Rate limiting para prevenir brute force em endpoints públicos sensíveis
const authLimiter = (0, rateLimit_middleware_1.rateLimit)(20, 15 * 60 * 1000); // 20 tentativas / 15 min por IP
router.post('/register', authLimiter, auth_controller_1.register);
router.post('/register/staff', authLimiter, auth_controller_1.registerStaff);
router.post('/login', authLimiter, auth_controller_1.login);
router.post('/bootstrap-admin', authLimiter, auth_controller_1.bootstrapAdmin);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map