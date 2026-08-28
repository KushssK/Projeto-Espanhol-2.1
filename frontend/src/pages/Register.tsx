import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { AlertCircle, User, Mail, Lock, Calendar } from 'lucide-react';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const { themeColor } = useThemeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!username || !email || !password || !dob) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', { username, email, password, dob });
      const { token, user } = response.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Erro ao criar conta. Verifique os dados fornecidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container flex items-center justify-center p-4">
      <div className="auth-card glass border border-[var(--border-color)]">
        <div className="text-center mb-6">
          <div className="h-16 w-16 mx-auto mb-4 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-lg" style={{ backgroundColor: themeColor }}>
            E
          </div>
          <h1 className="text-2xl font-extrabold" style={{ margin: '0 0 8px', fontSize: '28px' }}>
            Crie sua Conta
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Aprenda espanhol de forma divertida, gamificada e 100% gratuita.
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'rgba(234, 43, 43, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(234, 43, 43, 0.2)' }}>
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2" size={20} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Nome de usuário (ex: joao123)"
              className="input-gamified"
              style={{ paddingLeft: '48px' }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2" size={20} style={{ color: 'var(--text-muted)' }} />
            <input
              type="email"
              placeholder="Seu melhor e-mail"
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
              type="password"
              placeholder="Sua senha"
              className="input-gamified"
              style={{ paddingLeft: '48px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="relative flex flex-col gap-1">
            <label className="text-xs font-bold px-1" style={{ color: 'var(--text-muted)' }}>DATA DE NASCIMENTO</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2" size={20} style={{ color: 'var(--text-muted)' }} />
              <input
                type="date"
                className="input-gamified"
                style={{ paddingLeft: '48px' }}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-3d w-full font-bold mt-2"
            disabled={loading}
            style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
          >
            {loading ? 'Cadastrando...' : 'Criar minha Conta'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Já tem uma conta?{' '}
          <Link to="/login" className="font-bold hover:underline" style={{ color: themeColor }}>
            Fazer Login
          </Link>
        </div>
      </div>
    </div>
  );
};
