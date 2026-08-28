import jwt from 'jsonwebtoken';

/**
 * Gera um token JWT para autenticação.
 * Centraliza a lógica de assinatura para evitar duplicação entre controllers.
 */
export function signToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}
