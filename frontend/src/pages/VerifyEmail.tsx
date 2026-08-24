import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { AlertCircle, CheckCircle, Mail, KeyRound, ArrowLeft } from 'lucide-react';

interface LocationState {
  email?: string;
  fromRegister?: boolean;
}

export const VerifyEmail: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { login } = useAuthStore();
  const { themeColor } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const email = state?.email || '';

  // Redirecionar se não tem email
  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  // Cooldown para reenvio
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!code || code.length !== 6) {
      setError('O código deve ter 6 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/verification/verify-code', { email, code });
      const { token, user } = response.data;
      login(token, user);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao verificar código.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);
    setResendLoading(true);

    try {
      await api.post('/verification/send-code', { email });
      setSuccess('Novo código enviado para seu e-mail!');
      setCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao reenviar código.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page-container flex items-center justify-center p-4">
      <div className="auth-card glass border border-[var(--border-color)]">
        <div className="text-center mb-8">
          <div className="h-16 w-16 mx-auto mb-4 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-lg" style={{ backgroundColor: themeColor }}>
            <Mail size={32} />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ margin: '0 0 8px', fontSize: '28px' }}>
            Verifique seu E-mail
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Enviamos um código de 6 dígitos para
          </p>
          <p className="font-bold mt-1" style={{ color: themeColor }}>
            {email}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'rgba(234, 43, 43, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(234, 43, 43, 0.2)' }}>
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 mb-6 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <CheckCircle size={20} className="shrink-0" />
            <span className="text-sm font-semibold">{success}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2" size={20} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Digite o código de 6 dígitos"
              className="input-gamified text-center text-2xl tracking-[0.5em] font-bold"
              style={{ paddingLeft: '48px', letterSpacing: '0.5em' }}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn-3d w-full font-bold mt-2"
            disabled={loading || code.length !== 6}
            style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
          >
            {loading ? 'Verificando...' : 'Verificar Código'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resendLoading}
            className="text-sm font-bold hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: themeColor, background: 'none', border: 'none' }}
          >
            {resendLoading
              ? 'Reenviando...'
              : cooldown > 0
                ? `Reenviar em ${cooldown}s`
                : 'Reenviar código'}
          </button>
        </div>

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm flex items-center justify-center gap-1 font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
};
