import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { PublicNavbar } from './components/PublicNavbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuthStore } from './stores/useAuthStore'
import { useThemeStore } from './stores/useThemeStore'
import { LandingPage } from './pages/LandingPage'
import { Dashboard } from './pages/Dashboard'
import { ModulePage } from './pages/ModulePage'
import { LessonView } from './pages/LessonView'
import { Leaderboard } from './pages/Leaderboard'
import { CommunityChat } from './pages/CommunityChat'
import { MediaLibrary } from './pages/MediaLibrary'
import { AdminPanel } from './pages/AdminPanel'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const fetchSettings = useThemeStore((s) => s.fetchSettings)
  const isLoading = useAuthStore((s) => s.isLoading)
  const user = useAuthStore((s) => s.user)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    fetchSettings()
    checkAuth()
  }, [fetchSettings, checkAuth])

  // Detect dark mode from system preference or document class
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark') || mq.matches)
    checkDark()
    mq.addEventListener('change', checkDark)
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      mq.removeEventListener('change', checkDark)
      observer.disconnect()
    }
  }, [])

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

  // Public routes that should show the PublicNavbar
  const publicPaths = ['/', '/login', '/register']
  const isPublicPage = publicPaths.includes(window.location.pathname)

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      {/* Glassmorphism animated background */}
      <div className="bg-scene" />
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="light-beam" />

      {/* Show PublicNavbar on landing page, Navbar everywhere else */}
      {isPublicPage && !user ? <PublicNavbar /> : <Navbar />}

      <Routes>
        {/* Landing Page — pública */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas protegidas (qualquer usuário autenticado) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/modules/:id" element={<ModulePage />} />
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
