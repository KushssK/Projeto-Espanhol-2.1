"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStaff = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso restrito para administradores.' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireStaff = (req, res, next) => {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'TEACHER') {
        return res.status(403).json({ error: 'Acesso restrito para staff.' });
    }
    next();
};
exports.requireStaff = requireStaff;
//# sourceMappingURL=auth.middleware.js.map