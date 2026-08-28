"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = void 0;
const store = new Map();
// Limpeza periódica para evitar vazamento de memória
setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store) {
        bucket.timestamps = bucket.timestamps.filter((t) => now - t < 60_000);
        if (bucket.timestamps.length === 0) {
            store.delete(key);
        }
    }
}, 30_000).unref();
/**
 * Limita o número de requisições por IP em uma janela de tempo.
 * @param maxRequests Máximo de requisições por janela
 * @param windowMs Janela em milissegundos
 */
const rateLimit = (maxRequests, windowMs) => {
    return (req, res, next) => {
        const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:${req.path}`;
        const now = Date.now();
        let bucket = store.get(key);
        if (!bucket) {
            bucket = { timestamps: [] };
            store.set(key, bucket);
        }
        // Remover timestamps fora da janela
        bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
        if (bucket.timestamps.length >= maxRequests) {
            return res.status(429).json({
                error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
            });
        }
        bucket.timestamps.push(now);
        next();
    };
};
exports.rateLimit = rateLimit;
//# sourceMappingURL=rateLimit.middleware.js.map