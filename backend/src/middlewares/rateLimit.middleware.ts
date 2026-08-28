import { Request, Response, NextFunction } from 'express';

// ============================================================================
// Rate Limiter em memória (janela deslizante)
// Ideal para uma única instância Node no cPanel — sem dependências externas.
// ============================================================================

interface Bucket {
  timestamps: number[];
}

const store = new Map<string, Bucket>();

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
export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
