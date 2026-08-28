import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const uploadAttachment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAttachmentsByLesson: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteAttachment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reorderAttachments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=attachment.controller.d.ts.map