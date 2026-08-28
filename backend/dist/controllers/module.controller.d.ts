import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getModules: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getModuleById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createModule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateModule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteModule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reorderModules: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=module.controller.d.ts.map