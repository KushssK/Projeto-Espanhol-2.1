import React, { useEffect, useRef } from 'react';
import { LogOut, X } from 'lucide-react';
import { useThemeStore } from '../stores/useThemeStore';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Modal de confirmação de logout — glassmorphism design.
 * Exibe antes de deslogar o usuário, evitando logout acidental.
 */
export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { themeColor } = useThemeStore();
  const modalRef = useRef<HTMLDivElement>(null);

  // Fechar com Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Trap focus no modal
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="glass-strong border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-[var(--border-color)] transition-colors cursor-pointer"
          style={{ color: 'var(--text-muted)', border: 'none', background: 'none' }}
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(234, 43, 43, 0.1)',
              color: 'var(--color-danger)',
            }}
          >
            <LogOut size={28} />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-main)' }}>
            Tem certeza que deseja sair?
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Você precisará fazer login novamente para acessar sua conta.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: 'var(--input-bg, #f3f4f6)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: 'var(--color-danger, #ea2b2b)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(234, 43, 43, 0.3)',
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
