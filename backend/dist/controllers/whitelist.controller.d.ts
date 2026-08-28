import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const listWhitelist: (_req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addWhitelist: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeWhitelist: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=whitelist.controller.d.ts.map