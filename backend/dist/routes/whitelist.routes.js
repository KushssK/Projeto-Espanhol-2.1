"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whitelist_controller_1 = require("../controllers/whitelist.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin);
router.get('/', whitelist_controller_1.listWhitelist);
router.post('/', whitelist_controller_1.addWhitelist);
router.delete('/:cpf', whitelist_controller_1.removeWhitelist);
exports.default = router;
//# sourceMappingURL=whitelist.routes.js.map