import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const listMediaLibrary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createMediaItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMediaItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteMediaItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reorderMediaLibrary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=mediaLibrary.controller.d.ts.map