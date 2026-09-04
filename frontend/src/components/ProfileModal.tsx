import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { api, assetUrl } from '../services/api';
import {
  X,
  User as UserIcon,
  Mail,
  Camera,
  Check,
  Copy,
  Shield,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogoutClick?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onLogoutClick,
}) => {
  const { user, updateUser } = useAuthStore();
  const { themeColor } = useThemeStore();

  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data state
  const [profileData, setProfileData] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Fetch complete profile on open
  useEffect(() => {
    if (isOpen) {
      setPasswordMsg(null);
      setAvatarError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditingUsername(false);

      api
        .get('/users/me')
        .then((res) => {
          setProfileData(res.data);
          setUsername(res.data.username || '');
        })
        .catch((err) => {
          console.error('Erro ao buscar dados do perfil:', err);
          if (user) {
            setUsername(user.username || '');
          }
        });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    const emailToCopy = profileData?.email || user?.email || '';
    if (!emailToCopy) return;
    navigator.clipboard.writeText(emailToCopy);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSaveUsername = async () => {
    if (!username.trim() || username.trim() === user?.username) {
      setIsEditingUsername(false);
      return;
    }
    setSavingUsername(true);
    try {
      const res = await api.put('/users/me', { username: username.trim() });
      if (res.data?.user) {
        updateUser(res.data.user);
        setProfileData((prev: any) => ({ ...prev, username: res.data.user.username }));
      }
      setIsEditingUsername(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao atualizar nome de usuário.');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Selecione uma imagem válida (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingAvatar(true);
    setAvatarError('');
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.user) {
        updateUser(res.data.user);
        setProfileData((prev: any) => ({ ...prev, avatarUrl: res.data.user.avatarUrl }));
      }
    } catch (err: any) {
      setAvatarError(err.response?.data?.error || 'Erro ao enviar foto.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Informe a senha atual.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'A nova senha e a confirmação não conferem.' });
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/users/me/password', {
        currentPassword,
        newPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordSection(false), 2000);
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.error || 'Erro ao alterar senha. Verifique a senha atual.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const roleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'TEACHER':
        return 'Professor';
      default:
        return 'Estudante';
    }
  };

  const roleColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'var(--color-danger)';
      case 'TEACHER':
        return 'var(--color-warning)';
      default:
        return themeColor;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const avatar = profileData?.avatarUrl || user?.avatarUrl;
  const email = profileData?.email || user?.email || '';
  const currentRole = profileData?.role || user?.role;
  const createdAt = profileData?.createdAt;
  const dob = profileData?.dob;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="glass-strong border border-[var(--border-color)] rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden my-auto relative"
        style={{
          backgroundColor: 'var(--bg-color)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com Banner e Botão Fechar */}
        <div
          className="relative px-6 pt-6 pb-4 border-b border-[var(--border-color)] overflow-hidden"
          style={{ background: 'var(--primary-gradient)', opacity: 0.95 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer border-none"
            title="Fechar"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4 text-white">
            {/* Avatar com upload */}
            <div className="relative group shrink-0">
              {avatar ? (
                <img
                  src={assetUrl(avatar)}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-3 border-white/50 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-3 border-white/50 flex items-center justify-center text-white text-3xl font-extrabold shadow-md">
                  {username ? username.charAt(0).toUpperCase() : <UserIcon size={32} />}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white text-gray-800 shadow hover:scale-105 transition-transform cursor-pointer border-none flex items-center justify-center"
                title="Alterar foto de perfil"
              >
                <Camera size={14} style={{ color: themeColor }} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-black/30 backdrop-blur text-white border"
                  style={{ borderColor: roleColor(currentRole) }}
                >
                  <Shield size={12} />
                  {roleLabel(currentRole)}
                </span>
              </div>
              <h2 className="text-2xl font-black truncate mt-1 text-white">
                {username || 'Usuário'}
              </h2>
              <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                <Sparkles size={12} /> Dados e credenciais da sua conta
              </p>
            </div>
          </div>

          {uploadingAvatar && (
            <div className="mt-3 text-xs text-white/90 font-bold flex items-center gap-2">
              <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              Enviando foto de perfil...
            </div>
          )}
          {avatarError && (
            <p className="mt-2 text-xs text-red-200 font-bold">{avatarError}</p>
          )}
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="overflow-y-auto p-6 flex flex-col gap-6 flex-1">
          {/* Seção: Informações de Login */}
          <div className="flex flex-col gap-3">
            <h3
              className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <Mail size={14} style={{ color: themeColor }} />
              Informações de Login & Acesso
            </h3>

            {/* Card E-mail */}
            <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--primary-light)', color: themeColor }}
                >
                  <Mail size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold block" style={{ color: 'var(--text-muted)' }}>
                    E-MAIL DE ACESSO
                  </span>
                  <span className="text-sm font-extrabold truncate block" style={{ color: 'var(--text-main)' }}>
                    {email || 'Carregando...'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="btn-3d text-xs font-bold shrink-0 self-end sm:self-center"
                style={{
                  padding: '6px 12px',
                  '--btn-bg': copiedEmail ? 'var(--color-success)' : 'var(--bg-color)',
                  color: copiedEmail ? '#fff' : 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                } as any}
              >
                {copiedEmail ? (
                  <>
                    <Check size={14} /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copiar E-mail
                  </>
                )}
              </button>
            </div>

            {/* Card Nome de Usuário */}
            <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--primary-light)', color: themeColor }}
                >
                  <UserIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold block" style={{ color: 'var(--text-muted)' }}>
                    NOME DE USUÁRIO (USERNAME)
                  </span>
                  {isEditingUsername ? (
                    <input
                      type="text"
                      className="input-gamified text-sm py-1 px-2 mt-1 w-full"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Seu username"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-extrabold truncate block" style={{ color: 'var(--text-main)' }}>
                      {username || 'Não definido'}
                    </span>
                  )}
                </div>
              </div>

              {isEditingUsername ? (
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername(profileData?.username || user?.username || '');
                      setIsEditingUsername(false);
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-color)] cursor-pointer"
                    style={{ background: 'transparent', color: 'var(--text-muted)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUsername}
                    disabled={savingUsername}
                    className="btn-3d text-xs font-bold"
                    style={{
                      padding: '6px 12px',
                      '--btn-bg': themeColor,
                      '--btn-shadow': 'var(--primary-hover)',
                    } as any}
                  >
                    {savingUsername ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(true)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-color)] transition-colors cursor-pointer self-end sm:self-center"
                  style={{ background: 'transparent', color: themeColor }}
                >
                  Editar
                </button>
              )}
            </div>

            {/* Detalhes complementares (Nascimento e Criação) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] flex items-center gap-3">
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    MEMBRO DESDE
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                    {formatDate(createdAt)}
                  </span>
                </div>
              </div>

              {dob && (
                <div className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] flex items-center gap-3">
                  <UserIcon size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                      DATA DE NASCIMENTO
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                      {formatDate(dob)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção: Segurança e Alteração de Senha */}
          <div className="border-t border-[var(--border-color)] pt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3
                className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                <Lock size={14} style={{ color: themeColor }} />
                Segurança da Conta
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(!showPasswordSection);
                  setPasswordMsg(null);
                }}
                className="text-xs font-bold cursor-pointer border-none bg-transparent hover:underline"
                style={{ color: themeColor }}
              >
                {showPasswordSection ? 'Ocultar' : 'Alterar Senha'}
              </button>
            </div>

            {showPasswordSection && (
              <form
                onSubmit={handleChangePassword}
                className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] flex flex-col gap-3 transition-all"
              >
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Altere a senha usada para acessar sua conta nesta plataforma.
                </p>

                {passwordMsg && (
                  <div
                    className="p-3 rounded-xl text-xs font-bold border"
                    style={{
                      backgroundColor:
                        passwordMsg.type === 'success'
                          ? 'rgba(34, 197, 94, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                      borderColor:
                        passwordMsg.type === 'success'
                          ? 'var(--color-success)'
                          : 'var(--color-danger)',
                      color:
                        passwordMsg.type === 'success'
                          ? 'var(--color-success)'
                          : 'var(--color-danger)',
                    }}
                  >
                    {passwordMsg.text}
                  </div>
                )}

                {/* Senha Atual */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    SENHA ATUAL
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      className="input-gamified w-full text-sm pr-10"
                      placeholder="Digite sua senha atual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 border-none bg-transparent cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Nova Senha */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    NOVA SENHA (MÍNIMO 6 CARACTERES)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      className="input-gamified w-full text-sm pr-10"
                      placeholder="Digite a nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 border-none bg-transparent cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nova Senha */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    CONFIRMAR NOVA SENHA
                  </label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    className="input-gamified w-full text-sm"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordMsg(null);
                    }}
                    className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border-color)] cursor-pointer"
                    style={{ background: 'transparent', color: 'var(--text-muted)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="btn-3d text-xs font-bold"
                    style={{
                      padding: '8px 16px',
                      '--btn-bg': themeColor,
                      '--btn-shadow': 'var(--primary-hover)',
                    } as any}
                  >
                    {savingPassword ? 'Salvando...' : 'Atualizar Senha'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--panel-bg)] flex items-center justify-between">
          {onLogoutClick ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogoutClick();
              }}
              className="text-xs font-bold cursor-pointer border-none bg-transparent hover:underline"
              style={{ color: 'var(--color-danger)' }}
            >
              Sair desta conta
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn-3d text-sm font-bold"
            style={{
              padding: '8px 24px',
              '--btn-bg': 'var(--bg-color)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
            } as any}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
