"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCpf = normalizeCpf;
exports.hashCpf = hashCpf;
const crypto_1 = require("crypto");
/** Remove pontuação e mantém 11 dígitos. */
function normalizeCpf(raw) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 11)
        return null;
    return digits;
}
function hashCpf(cpf) {
    return (0, crypto_1.createHash)('sha256').update(cpf).digest('hex');
}
//# sourceMappingURL=cpf.js.map