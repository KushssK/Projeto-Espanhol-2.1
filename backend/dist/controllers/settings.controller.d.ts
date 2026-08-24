import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getSettings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSettings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadSettingsLogo: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=settings.controller.d.ts.map