import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getCategoriesByModule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reorderCategories: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=category.controller.d.ts.map