import { Request, Response, NextFunction } from 'express';
/**
 * Limita o número de requisições por IP em uma janela de tempo.
 * @param maxRequests Máximo de requisições por janela
 * @param windowMs Janela em milissegundos
 */
export declare const rateLimit: (maxRequests: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=rateLimit.middleware.d.ts.map