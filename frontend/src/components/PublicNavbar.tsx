import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../stores/useThemeStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Menu, X, Sun, Moon } from 'lucide-react';

/**
 * Navbar pública — exibida na Landing Page.
 * Diferente da Navbar autenticada, esta possui links de âncora (scroll)
 * e botões de Login/Cadastro.
 */
export const PublicNavbar: React.FC = () => {
  const { themeColor } = useThemeStore();
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark';
  });

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navLinks = [
    { label: 'Início', href: '#hero' },
    { label: 'Sobre', href: '#sobre' },
    { label: 'Recursos', href: '#recursos' },
    { label: 'Módulos', href: '#modulos' },
  ];

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[var(--border-color)]">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-black text-xl"
          style={{ backgroundColor: themeColor }}
        >
          E
        </div>
        <span className="font-extrabold text-xl tracking-tight hidden sm:inline" style={{ color: 'var(--text-main)' }}>
          Espanhol <span style={{ color: themeColor }}>em Rede</span>
        </span>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-sm font-bold transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Right side */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={toggleDark}
          className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors cursor-pointer"
          style={{ color: 'var(--text-main)', border: 'none', background: 'none' }}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {user ? (
          <Link
            to="/"
            className="btn-3d text-sm font-bold"
            style={{ padding: '8px 16px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm font-bold px-4 py-2 rounded-xl transition-colors hover:bg-[var(--border-color)]"
              style={{ color: 'var(--text-main)', textDecoration: 'none' }}
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="btn-3d text-sm font-bold"
              style={{ padding: '8px 16px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
            >
              Criar conta
            </Link>
          </>
        )}
      </div>

      {/* Mobile controls */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={toggleDark}
          className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors cursor-pointer"
          style={{ color: 'var(--text-main)', border: 'none', background: 'none' }}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors cursor-pointer"
          style={{ color: 'var(--text-main)', border: 'none', background: 'none' }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-[72px] left-0 right-0 glass border-b border-[var(--border-color)] flex flex-col p-4 gap-4 md:hidden z-40">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-bold py-2"
              style={{ color: 'var(--text-main)', textDecoration: 'none' }}
            >
              {link.label}
            </a>
          ))}
          <hr className="border-[var(--border-color)]" />
          {user ? (
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="btn-3d text-center py-2"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-bold py-2 text-center"
                style={{ color: 'var(--text-main)', textDecoration: 'none' }}
              >
                Entrar
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-3d text-center py-2"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
