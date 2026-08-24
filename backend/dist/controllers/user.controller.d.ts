import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getMyProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMyProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const searchUsers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const banUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const unbanUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listUsers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserProgress: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=user.controller.d.ts.map