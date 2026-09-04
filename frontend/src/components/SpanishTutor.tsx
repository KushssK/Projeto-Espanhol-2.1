import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { getTutorReply, TUTOR_MENU, WELCOME_TEXT } from '../services/tutorEngine';
import type { TutorAction, TutorDataGateway, TutorMood } from '../services/tutorEngine';
import { Mascot } from './Mascot';

// ============================================================================
// Tutor de Espanhol — mascote coruja interativo
//
// Botão flutuante discreto (somente para usuários autenticados) que abre uma
// conversa com o tutor. As respostas são programadas pelo motor em
// services/tutorEngine.ts e os dados consultados são apenas os do próprio
// usuário (progresso/XP, posição no ranking, aulas) via endpoints existentes.
// A conversa fica em memória/local state — sem persistência e sem custo de
// API externa.
// ============================================================================

interface ChatMessage {
  id: number;
  role: 'user' | 'tutor';
  text: string;
  mood?: TutorMood;
  suggestions?: string[];
  action?: TutorAction;
}

export const SpanishTutor: React.FC = () => {
  const { user } = useAuthStore();
  const { themeColor } = useThemeStore();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  // Acesso a dados existentes da plataforma (apenas do usuário autenticado)
  const dataGateway = useMemo<TutorDataGateway | null>(() => {
    if (!user) return null;
    return {
      getProgress: async () => {
        try {
          const res = await api.get('/progress/me');
          return {
            totalXP: res.data?.totalXP ?? 0,
            completedCount: res.data?.completedCount ?? 0,
          };
        } catch {
          return null;
        }
      },
      getMyRank: async () => {
        try {
          const res = await api.get('/progress/leaderboard?limit=100');
          const list: Array<{ userId: string; rank: number; totalXP: number }> = res.data || [];
          const me = list.find((u) => u.userId === user.id);
          return me ? { rank: me.rank, totalXP: me.totalXP } : null;
        } catch {
          return null;
        }
      },
      getLessons: async () => {
        try {
          const res = await api.get('/modules');
          const modules: Array<{ id: string; title: string; lessons: Array<{ id: string; title: string; published?: boolean }> }> =
            res.data || [];
          const lessons = modules.flatMap((m) =>
            (m.lessons || [])
              .filter((l) => l.published !== false)
              .map((l) => ({ id: l.id, title: l.title, moduleId: m.id, moduleTitle: m.title }))
          );
          return lessons.length > 0 ? lessons : null;
        } catch {
          return null;
        }
      },
    };
  }, [user]);

  const openTutor = useCallback(() => {
    setOpen(true);
    setMessages((prev) =>
      prev.length > 0
        ? prev
        : [{ id: nextId(), role: 'tutor', text: WELCOME_TEXT, mood: 'normal', suggestions: TUTOR_MENU }]
    );
  }, []);

  // O mascote do Dashboard também abre o tutor via evento global
  useEffect(() => {
    const handler = () => openTutor();
    window.addEventListener('open-spanish-tutor', handler);
    return () => window.removeEventListener('open-spanish-tutor', handler);
  }, [openTutor]);

  // Focar o campo ao abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Rolar para a última mensagem
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const sendMessage = async (raw?: string) => {
    if (!user || !dataGateway) return;
    const text = (raw ?? input).trim();
    if (!text || thinking) return;
    setInput('');
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text }]);
    setThinking(true);

    try {
      const reply = await getTutorReply(text, {
        userId: user.id,
        username: user.username || 'aluno',
        data: dataGateway,
      });
      // Pequeno atraso para simular o tutor "pensando"
      const delay = 500 + Math.random() * 500;
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: 'tutor', text: reply.text, mood: reply.mood, suggestions: reply.suggestions, action: reply.action },
        ]);
        setThinking(false);
      }, delay);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'tutor',
          text: 'Ops! Algo deu errado por aqui. Tente de novo em instantes. 🙈',
          mood: 'alert',
          suggestions: TUTOR_MENU,
        },
      ]);
      setThinking(false);
    }
  };

  if (!user || !dataGateway) return null;

  return (
    <>
      {/* Botão flutuante discreto */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openTutor())}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full glass border-2 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        style={{ borderColor: 'var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
        title="Falar com o tutor de espanhol"
        aria-label="Abrir tutor de espanhol"
      >
        <Mascot size={44} mood={thinking ? 'thinking' : open ? 'talking' : 'normal'} />
        {!open && (
          <span
            className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white animate-ping"
            style={{ backgroundColor: themeColor }}
          />
        )}
      </button>

      {/* Painel de conversa */}
      {open && (
        <div
          className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-4 sm:w-[380px] z-50 flex flex-col glass border-2 border-[var(--border-color)] rounded-[24px] overflow-hidden"
          style={{ maxHeight: 'min(560px, calc(100vh - 110px))', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-3"
            style={{ background: 'var(--bg-color)' }}
          >
            <Mascot size={40} mood={thinking ? 'thinking' : 'talking'} />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-extrabold truncate" style={{ color: 'var(--text-main)' }}>
                Tutor de Espanhol
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {thinking ? 'Pensando...' : 'Sua coruja-tutor está online 🦉'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer border border-[var(--border-color)] bg-transparent"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Fechar tutor"
            >
              <X size={15} />
            </button>
          </div>

          {/* Mensagens */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[220px]" style={{ background: 'var(--bg-color)/40' }}>
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="self-end max-w-[85%]">
                  <div
                    className="px-3.5 py-2 rounded-[16px] text-sm text-white"
                    style={{ backgroundColor: themeColor, borderRadius: '16px 4px 16px 16px' }}
                  >
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="self-start max-w-[90%] flex items-end gap-2">
                  <div className="h-7 w-7 rounded-full bg-[var(--border-color)] flex items-center justify-center shrink-0 overflow-hidden">
                    <Mascot size={26} mood={msg.mood || 'normal'} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div
                      className="px-3.5 py-2.5 rounded-[16px] text-sm border"
                      style={{
                        backgroundColor: 'var(--panel-bg)',
                        color: 'var(--text-main)',
                        borderColor: 'var(--border-color)',
                        borderRadius: '4px 16px 16px 16px',
                      }}
                    >
                      {msg.text}
                    </div>
                    {msg.action && (
                      <button
                        type="button"
                        onClick={() => navigate(msg.action!.to)}
                        className="btn-3d self-start text-xs font-bold"
                        style={{ padding: '7px 12px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
                      >
                        {msg.action.label} <ArrowRight size={13} />
                      </button>
                    )}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {msg.suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => void sendMessage(s)}
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-colors hover:opacity-80"
                            style={{ borderColor: themeColor, color: themeColor, background: 'transparent' }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Indicador de "pensando" */}
            {thinking && (
              <div className="self-start flex items-end gap-2">
                <div className="h-7 w-7 rounded-full bg-[var(--border-color)] flex items-center justify-center shrink-0 overflow-hidden">
                  <Mascot size={26} mood="thinking" />
                </div>
                <div
                  className="px-4 py-2.5 rounded-[16px] border flex items-center gap-1"
                  style={{
                    backgroundColor: 'var(--panel-bg)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '4px 16px 16px 16px',
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor }} />
                  <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor, animationDelay: '120ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor, animationDelay: '240ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="p-3 border-t border-[var(--border-color)] flex items-center gap-2"
            style={{ background: 'var(--bg-color)' }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Escreva sua dúvida..."
              className="input-gamified flex-1"
              style={{ borderRadius: '12px' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={thinking}
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="btn-3d h-10 w-10 shrink-0 flex items-center justify-center"
              style={{ padding: 0, borderRadius: '12px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
              aria-label="Enviar"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};