import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getLessonsByModule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getLessonById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createLesson: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateLesson: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteLesson: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reorderLessons: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=lesson.controller.d.ts.map