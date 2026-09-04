import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

/**
 * Rota pública — apenas para usuários NÃO autenticados (/login e /register).
 *
 * - Usuário autenticado com sessão válida → redireciona imediatamente para /dashboard.
 * - Enquanto a sessão está sendo restaurada (ex.: refresh da página), retorna null
 *   para nunca renderizar o formulário de login/cadastro (sem flash visual).
 */
export const PublicOnlyRoute: React.FC = () => {
  const { user, isLoading } = useAuthStore()

  // Ainda restaurando a sessão: não renderiza nada (o App já exibe o loading).
  if (isLoading) return null

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
