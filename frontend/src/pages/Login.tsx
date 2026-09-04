import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { AlertCircle, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();
  const { themeColor } = useThemeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !accessCode) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, accessCode });
      const { token, user } = response.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Erro ao realizar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container flex items-center justify-center p-4">
      <div className="auth-card glass border border-[var(--border-color)]">
        <div className="text-center mb-8">
          <div className="h-16 w-16 mx-auto mb-4 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-lg" style={{ backgroundColor: themeColor }}>
            E
          </div>
          <h1 className="text-2xl font-extrabold" style={{ margin: '0 0 8px', fontSize: '28px' }}>
            Olá de novo!
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Faça login para continuar sua jornada no Espanhol.
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'rgba(234, 43, 43, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(234, 43, 43, 0.2)' }}>
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2" size={20} style={{ color: 'var(--text-muted)' }} />
            <input
              type="email"
              placeholder="Seu e-mail"
              className="input-gamified"
              style={{ paddingLeft: '48px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2" size={20} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Código de acesso (6 caracteres)"
              className="input-gamified"
              style={{ paddingLeft: '48px', textTransform: 'uppercase', letterSpacing: '2px' }}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              maxLength={6}
              autoComplete="one-time-code"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-3d w-full font-bold mt-2"
            disabled={loading}
            style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
          >
            {loading ? 'Entrando...' : 'Entrar na Plataforma'}
          </button>
        </form>

        <div className="text-center mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          Não tem uma conta?{' '}
          <Link to="/register" className="font-bold hover:underline" style={{ color: themeColor }}>
            Cadastre-se grátis
          </Link>
        </div>
      </div>
    </div>
  );
};
