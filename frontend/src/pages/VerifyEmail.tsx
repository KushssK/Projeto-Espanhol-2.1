import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { AlertCircle, CheckCircle, Mail, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';

interface LocationState {
  email?: string;
  purpose?: 'REGISTER' | 'LOGIN' | 'ADMIN_LOGIN';
  fromRegister?: boolean;
}

/**
 * Tela profissional de verificação por código.
 * Suporta:
 * - 6 campos separados com avanço automático
 * - Colar código completo
 * - Contador de expiração
 * - Reenvio com cooldown
 * - Tratamento de código expirado, inválido, limite de tentativas
 */
export const VerifyEmail: React.FC = () => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { login } = useAuthStore();
  const { themeColor } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const email = state?.email || '';
  const purpose = state?.purpose || 'REGISTER';

  // Redirecionar se não tem email
  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  // Cooldown para reenvio (60 segundos)
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Contador regressivo de expiração
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = expiresAt.getTime() - now;
      if (diff <= 0) {
        setTimeLeft('Expirado');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Definir expiração inicial (10 minutos a partir de agora)
  useEffect(() => {
    setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
  }, []);

  // Combinar dígitos em código completo
  const code = digits.join('');

  // Avanço automático entre campos
  const handleDigitChange = useCallback((index: number, value: string) => {
    if (value.length > 1) {
      // Colar código completo
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...digits];
      pastedDigits.forEach((d, i) => {
        if (index + i < 6) newDigits[index + i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Avançar para próximo campo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [digits]);

  // Tratar backspace — voltar para campo anterior
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  // Tratar colar
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = pasted.split('');
      while (newDigits.length < 6) newDigits.push('');
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (code.length !== 6) {
      setError('O código deve ter 6 dígitos.');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (purpose === 'LOGIN' || purpose === 'ADMIN_LOGIN') {
        // Login 2FA — usar endpoint de confirmação de login
        response = await api.post('/auth/login/confirm', { email, code, purpose });
      } else {
        // Registro — usar endpoint de verificação
        response = await api.post('/verification/verify-code', { email, code, purpose });
      }
      const { token, user } = response.data;
      login(token, user);
      navigate('/', { replace: true });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erro ao verificar código.';
      setError(errorMsg);

      // Detectar se código expirado ou limite excedido — sugerir reenvio
      if (
        errorMsg.includes('expirado') ||
        errorMsg.includes('Limite de tentativas') ||
        errorMsg.includes('Solicite um novo')
      ) {
        setCooldown(0); // Permitir reenvio imediato
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);
    setResendLoading(true);

    try {
      if (purpose === 'LOGIN' || purpose === 'ADMIN_LOGIN') {
        // Para LOGIN/ADMIN_LOGIN, redirecionar de volta ao login para gerar novo código
        navigate('/login', { replace: true });
        return;
      }

      // Para REGISTER, usar o endpoint público de reenvio
      await api.post('/verification/send-code', { email, purpose });
      setSuccess('Novo código enviado para seu e-mail!');
      setCooldown(60);
      setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erro ao reenviar código.';
      setError(errorMsg);
      if (err.response?.data?.waitSeconds) {
        setCooldown(err.response.data.waitSeconds);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const getTitle = () => {
    switch (purpose) {
      case 'LOGIN': return 'Verificação de Login';
      case 'ADMIN_LOGIN': return 'Acesso Administrativo';
      default: return 'Verifique seu E-mail';
    }
  };

  const getDescription = () => {
    switch (purpose) {
      case 'LOGIN': return 'Um código de verificação foi enviado para confirmar seu login.';
      case 'ADMIN_LOGIN': return 'Um código de acesso administrativo foi enviado para seu e-mail.';
      default: return 'Enviamos um código de 6 dígitos para';
    }
  };

  return (
    <div className="auth-page-container flex items-center justify-center p-4">
      <div className="auth-card glass border border-[var(--border-color)]" style={{ maxWidth: '440px', width: '100%' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="h-16 w-16 mx-auto mb-4 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-lg"
            style={{ backgroundColor: themeColor }}
          >
            {purpose === 'ADMIN_LOGIN' ? <ShieldCheck size={32} /> : <Mail size={32} />}
          </div>
          <h1 className="text-2xl font-extrabold" style={{ margin: '0 0 8px', fontSize: '28px' }}>
            {getTitle()}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {getDescription()}
          </p>
          {purpose === 'REGISTER' && (
            <p className="font-bold mt-1" style={{ color: themeColor }}>
              {email}
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div
            className="p-4 mb-6 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: 'rgba(234, 43, 43, 0.1)',
              color: 'var(--color-danger)',
              border: '1px solid rgba(234, 43, 43, 0.2)',
            }}
          >
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div
            className="p-4 mb-6 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: 'var(--color-success)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}
          >
            <CheckCircle size={20} className="shrink-0" />
            <span className="text-sm font-semibold">{success}</span>
          </div>
        )}

        {/* Code input — 6 campos separados */}
        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <div className="flex justify-center gap-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                autoFocus={index === 0}
                className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none"
                style={{
                  backgroundColor: 'var(--input-bg, #f8f9fa)',
                  borderColor: digit ? themeColor : 'var(--border-color)',
                  color: 'var(--text-main)',
                  caretColor: themeColor,
                }}
                aria-label={`Dígito ${index + 1}`}
              />
            ))}
          </div>

          {/* Timer de expiração */}
          {timeLeft && timeLeft !== 'Expirado' && (
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Clock size={14} />
              <span>Expira em <strong>{timeLeft}</strong></span>
            </div>
          )}
          {timeLeft === 'Expirado' && (
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--color-danger)' }}>
              <AlertCircle size={14} />
              <span>Código expirado. Solicite um novo código.</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-3d w-full font-bold mt-2"
            disabled={loading || code.length !== 6 || timeLeft === 'Expirado'}
            style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Verificando...
              </span>
            ) : (
              'Verificar Código'
            )}
          </button>
        </form>

        {/* Resend section */}
        <div className="text-center mt-6">
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            Não recebeu o código?
          </p>
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

        {/* Back link */}
        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-sm flex items-center justify-center gap-1 font-bold hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} /> Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
};
