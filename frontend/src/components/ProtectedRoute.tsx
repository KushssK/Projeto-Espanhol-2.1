import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

interface ProtectedRouteProps {
  /** Roles permitidos; se omitido, qualquer usuário autenticado passa. */
  allowedRoles?: Array<'STUDENT' | 'TEACHER' | 'ADMIN'>
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return null

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
