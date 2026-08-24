import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const createPrivateRoom: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createGroupRoom: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyRooms: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRoomMessages: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const sendMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=chat.controller.d.ts.map