/**
 * Dados públicos do usuário — remove campos sensíveis.
 * Reutilizado entre auth.controller.
 */
export function publicUser(user: {
  id: string;
  email: string;
  role: string;
  username: string | null;
  avatarUrl: string | null;
  isBanned: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
    avatarUrl: user.avatarUrl,
    isBanned: user.isBanned, // estado real — nunca valor fixo
  };
}