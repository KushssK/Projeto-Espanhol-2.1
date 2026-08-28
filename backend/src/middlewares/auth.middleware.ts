import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    req.user = decoded as { userId: string; role: string };
    next();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito para administradores.' });
  }
  next();
};

export const requireStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'TEACHER') {
    return res.status(403).json({ error: 'Acesso restrito para staff.' });
  }
  next();
};
