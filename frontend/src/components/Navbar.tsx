import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { assetUrl } from '../services/api';
import { BookOpen, Trophy, MessageSquare, ShieldAlert, LogOut, Sun, Moon, Menu, X, User as UserIcon, Library } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { logoUrl, themeColor } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || 
      localStorage.getItem('theme') === 'dark';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active-nav' : '';
  };

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[var(--border-color)]">
      {/* Logo & Brand */}
      <Link to="/" className="flex items-center gap-3 text-decoration-none">
        {logoUrl ? (
          <img src={assetUrl(logoUrl)} alt="Logo" className="h-10 w-auto object-contain" />
        ) : (
          <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: themeColor }}>
            E
          </div>
        )}
        <span className="font-extrabold text-xl tracking-tight hidden sm:inline" style={{ color: 'var(--text-main)' }}>
          Espanhol <span style={{ color: themeColor }}>em Rede</span>
        </span>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6">
        <Link to="/" className={`flex items-center gap-2 font-bold transition-colors ${isActive('/')}`} style={{ color: location.pathname === '/' ? themeColor : 'var(--text-muted)' }}>
          <BookOpen size={18} />
          Módulos
        </Link>
        <Link to="/leaderboard" className={`flex items-center gap-2 font-bold transition-colors ${isActive('/leaderboard')}`} style={{ color: location.pathname === '/leaderboard' ? themeColor : 'var(--text-muted)' }}>
          <Trophy size={18} />
          Ranking
        </Link>
        <Link to="/chat" className={`flex items-center gap-2 font-bold transition-colors ${isActive('/chat')}`} style={{ color: location.pathname === '/chat' ? themeColor : 'var(--text-muted)' }}>
          <MessageSquare size={18} />
          Comunidade
        </Link>
        <Link to="/acervo" className={`flex items-center gap-2 font-bold transition-colors ${isActive('/acervo')}`} style={{ color: location.pathname === '/acervo' ? themeColor : 'var(--text-muted)' }}>
          <Library size={18} />
          Acervo
        </Link>
        {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
          <Link to="/admin" className={`flex items-center gap-2 font-bold transition-colors ${isActive('/admin')}`} style={{ color: location.pathname === '/admin' ? themeColor : 'var(--text-muted)' }}>
            <ShieldAlert size={18} />
            Painel
          </Link>
        )}
      </div>

      {/* Right side controls */}
      <div className="hidden md:flex items-center gap-4">
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors cursor-pointer"
          style={{ color: 'var(--text-main)', border: 'none', background: 'none' }}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.avatarUrl ? (
                <img 
                  src={assetUrl(user.avatarUrl)} 
                  alt="Avatar" 
                  className="h-9 w-9 rounded-full object-cover border-2"
                  style={{ borderColor: themeColor }}
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-[var(--border-color)] flex items-center justify-center text-[var(--text-main)]">
                  <UserIcon size={18} />
                </div>
              )}
              <span className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{user.username}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-[var(--color-danger)] hover:text-white transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)', border: 'none', background: 'none' }}
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-3d text-sm font-bold" style={{ padding: '8px 16px' }}>
            Entrar
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="flex items-center gap-4 md:hidden">
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors cursor-pointer"
          style={{ color: 'var(--text-main)', border: 'none', background: 'none' }}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors cursor-pointer"
          style={{ color: 'var(--text-main)', border: 'none', background: 'none' }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="absolute top-[72px] left-0 right-0 glass border-b border-[var(--border-color)] flex flex-col p-4 gap-4 md:hidden z-40">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 font-bold py-2 text-decoration-none" style={{ color: 'var(--text-main)' }}>
            <BookOpen size={18} /> Módulos
          </Link>
          <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 font-bold py-2 text-decoration-none" style={{ color: 'var(--text-main)' }}>
            <Trophy size={18} /> Ranking
          </Link>
          <Link to="/chat" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 font-bold py-2 text-decoration-none" style={{ color: 'var(--text-main)' }}>
            <MessageSquare size={18} /> Comunidade
          </Link>
          <Link to="/acervo" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 font-bold py-2 text-decoration-none" style={{ color: 'var(--text-main)' }}>
            <Library size={18} /> Acervo
          </Link>
          {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 font-bold py-2 text-decoration-none" style={{ color: 'var(--text-main)' }}>
              <ShieldAlert size={18} /> Painel Administrador
            </Link>
          )}
          <hr className="border-[var(--border-color)]" />
          {user ? (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img src={assetUrl(user.avatarUrl)} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[var(--border-color)] flex items-center justify-center">
                    <UserIcon size={16} />
                  </div>
                )}
                <span className="font-bold text-sm">{user.username}</span>
              </div>
              <button 
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-2 font-bold text-[var(--color-danger)] cursor-pointer"
                style={{ border: 'none', background: 'none' }}
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-3d text-center py-2">
              Entrar
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
