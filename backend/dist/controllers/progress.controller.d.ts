import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const markLessonComplete: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyProgress: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getModuleProgress: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getLeaderboard: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=progress.controller.d.ts.map