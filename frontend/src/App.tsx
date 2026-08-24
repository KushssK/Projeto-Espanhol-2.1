import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuthStore } from './stores/useAuthStore'
import { useThemeStore } from './stores/useThemeStore'
import { Dashboard } from './pages/Dashboard'
import { LessonView } from './pages/LessonView'
import { Leaderboard } from './pages/Leaderboard'
import { CommunityChat } from './pages/CommunityChat'
import { MediaLibrary } from './pages/MediaLibrary'
import { AdminPanel } from './pages/AdminPanel'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { VerifyEmail } from './pages/VerifyEmail'

function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const fetchSettings = useThemeStore((s) => s.fetchSettings)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    fetchSettings()
    checkAuth()
  }, [fetchSettings, checkAuth])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: '100vh' }}>
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-t-transparent" style={{ borderColor: 'var(--primary-color)', borderTopColor: 'transparent' }} />
        <p className="mt-4 font-bold" style={{ color: 'var(--text-muted)' }}>
          Preparando seu aprendizado...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Rotas protegidas (qualquer usuário autenticado) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lessons/:id" element={<LessonView />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/chat" element={<CommunityChat />} />
          <Route path="/acervo" element={<MediaLibrary />} />
        </Route>

        {/* Rotas de staff (Admin + Teacher) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']} />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
