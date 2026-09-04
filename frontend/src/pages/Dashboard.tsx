import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { Mascot } from '../components/Mascot';
import { BookOpen, Star, HelpCircle, ChevronDown, PlayCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  published?: boolean;
  videoUrl?: string | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: Lesson[];
}

// Ícones temáticos para cada módulo
const MODULE_ICONS: Record<string, string> = {
  'Conversação': '🗣️',
  'Cultura Hispânica': '🌎',
  'Dicas de Aprendizagem': '💡',
  'Expressões e Girias do Cotidiano': '💬',
  'Gramática': '📝',
  'Leitura e Compreensão de texto': '📖',
  'Pronúncia': '🎤',
  'Vocabulário': '📚',
};

export const Dashboard: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isLessonCompleted = (lessonId: string) => {
    if (!userProgress || !userProgress.progress) return false;
    return userProgress.progress.some(
      (p: any) => p.lessonId === lessonId && p.isCompleted
    );
  };

  const { user } = useAuthStore();
  const { themeColor } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesRes, progressRes] = await Promise.all([
          api.get('/modules'),
          api.get('/progress/me'),
        ]);
        setModules(modulesRes.data);
        setUserProgress(progressRes.data);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-height-[60vh] gap-4"
        style={{ height: '70vh' }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{
            borderColor: themeColor,
            borderTopColor: 'transparent',
          }}
        />
        <p className="font-bold" style={{ color: 'var(--text-muted)' }}>
          Carregando seus módulos...
        </p>
      </div>
    );
  }

  // Estatísticas
  const xp = userProgress?.totalXP ?? 0;
  const completedLessonsCount = userProgress?.completedCount ?? 0;
  const totalLessonsCount = modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0,
  );
  const progressPercent =
    totalLessonsCount > 0
      ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
      : 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna Central — Módulos */}
      <div className="lg:col-span-2 flex flex-col gap-8">
        {/* Banner de Boas Vindas & Gamificação */}
        <div className="glass rounded-[24px] p-6 border border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{ background: 'var(--primary-gradient)' }}
          />
          <div className="flex flex-col text-center sm:text-left relative">
            <h2
              className="text-2xl font-extrabold"
              style={{ fontSize: '26px' }}
            >
              Olá, {user?.username}! 👋
            </h2>
            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
              Pronto para praticar espanhol hoje? Escolha um módulo para
              começar!
            </p>
          </div>
          <div className="flex items-center justify-center shrink-0">
            <Mascot size={104} title="Mascote do Espanhol em Rede" />
          </div>
          <div className="flex items-center gap-4 bg-[var(--bg-color)] px-5 py-3 rounded-2xl border border-[var(--border-color)]">
            <div className="text-center">
              <span
                className="block text-xs font-black uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                XP ACUMULADO
              </span>
              <span
                className="text-2xl font-black flex items-center justify-center gap-1"
                style={{ color: 'var(--color-warning)' }}
              >
                <Star fill="var(--color-warning)" size={20} /> {xp}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-[var(--border-color)]" />
            <div className="text-center">
              <span
                className="block text-xs font-black uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                AULAS CONCLUÍDAS
              </span>
              <span
                className="text-2xl font-black"
                style={{ color: themeColor }}
              >
                {completedLessonsCount}/{totalLessonsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Grid de Módulos */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            <BookOpen style={{ color: themeColor }} /> Trilha de Aprendizado
          </h3>

          {modules.length === 0 ? (
            <div className="glass rounded-[24px] p-8 text-center border border-[var(--border-color)]">
              <HelpCircle
                size={48}
                className="mx-auto mb-3"
                style={{ color: 'var(--text-muted)' }}
              />
              <h4 className="font-bold text-lg mb-1">
                Nenhum módulo cadastrado ainda.
              </h4>
              <p style={{ color: 'var(--text-muted)' }}>
                Aguarde os professores cadastrarem novos conteúdos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {modules
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((module) => {
                  const icon = MODULE_ICONS[module.title] || '📁';
                  const isExpanded = !!expandedModules[module.id];
                  const lessonCount = module.lessons.length;
                  const completedLessons = module.lessons.filter((l) =>
                    isLessonCompleted(l.id)
                  ).length;
                  const isAllCompleted = lessonCount > 0 && completedLessons === lessonCount;

                  return (
                    <div
                      key={module.id}
                      className={`glass rounded-[24px] border-2 transition-all duration-200 overflow-hidden ${
                        isExpanded
                          ? 'border-[var(--primary-color)] shadow-md'
                          : 'border-[var(--border-color)] hover:border-[var(--primary-color)]'
                      }`}
                    >
                      {/* Header Minimizado do Módulo - Clicável */}
                      <div
                        onClick={() => toggleModule(module.id)}
                        className="p-5 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-[var(--panel-bg)]"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Ícone */}
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform"
                            style={{
                              background: 'var(--bg-color)',
                              border: '1px solid var(--border-color)',
                              transform: isExpanded ? 'scale(1.05)' : 'scale(1)',
                            }}
                          >
                            {icon}
                          </div>

                          {/* Título & Badges */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4
                                className="text-base sm:text-lg font-extrabold leading-tight truncate"
                                style={{ color: 'var(--text-main)' }}
                              >
                                {module.title}
                              </h4>
                              {isAllCompleted && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 size={11} /> Concluído
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                              <span className="flex items-center gap-1">
                                <PlayCircle size={13} style={{ color: themeColor }} />
                                {lessonCount} {lessonCount === 1 ? 'videoaula' : 'videoaulas'}
                              </span>
                              <span>•</span>
                              <span>
                                {completedLessons}/{lessonCount} concluídas
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Seta / Chevron Interativo */}
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-xs font-bold hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                            {isExpanded ? 'Ocultar aulas' : 'Ver video-aulas'}
                          </span>
                          <button
                            type="button"
                            aria-label={isExpanded ? 'Ocultar video-aulas' : 'Expandir video-aulas'}
                            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--border-color)] transition-all cursor-pointer"
                            style={{
                              backgroundColor: isExpanded ? 'var(--primary-light)' : 'transparent',
                              color: isExpanded ? themeColor : 'var(--text-muted)',
                            }}
                          >
                            <ChevronDown
                              size={20}
                              className="transition-transform duration-300"
                              style={{
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              }}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Conteúdo Expandido com as Video-aulas */}
                      {isExpanded && (
                        <div
                          className="px-5 pb-5 pt-2 border-t border-[var(--border-color)] bg-[var(--bg-color)] flex flex-col gap-4"
                        >
                          {module.description && (
                            <p className="text-sm pt-1" style={{ color: 'var(--text-muted)' }}>
                              {module.description}
                            </p>
                          )}

                          <div className="flex flex-col gap-2">
                            <span
                              className="text-[11px] font-black uppercase tracking-wider block"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Videoaulas deste módulo ({lessonCount})
                            </span>

                            {module.lessons.length === 0 ? (
                              <p className="text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                                Nenhuma videoaula publicada neste módulo ainda.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 gap-2">
                                {module.lessons
                                  .sort((a, b) => a.orderIndex - b.orderIndex)
                                  .map((lesson, idx) => {
                                    const completed = isLessonCompleted(lesson.id);

                                    return (
                                      <div
                                        key={lesson.id}
                                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                                        className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[var(--primary-color)] hover:translate-x-1 group"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          {completed ? (
                                            <div
                                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                              style={{
                                                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                                color: 'var(--color-success)',
                                              }}
                                            >
                                              <CheckCircle2 size={18} />
                                            </div>
                                          ) : (
                                            <div
                                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                                              style={{
                                                backgroundColor: 'var(--primary-light)',
                                                color: themeColor,
                                              }}
                                            >
                                              <PlayCircle size={18} />
                                            </div>
                                          )}

                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span
                                                className="text-[10px] font-black uppercase tracking-wider"
                                                style={{ color: 'var(--text-muted)' }}
                                              >
                                                Aula {lesson.orderIndex || idx + 1}
                                              </span>
                                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--border-color)] text-[var(--text-muted)]">
                                                Videoaula
                                              </span>
                                            </div>
                                            <h5
                                              className="text-sm font-extrabold truncate mt-0.5 group-hover:text-[var(--primary-color)] transition-colors"
                                              style={{ color: 'var(--text-main)' }}
                                            >
                                              {lesson.title}
                                            </h5>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          className="btn-3d text-xs font-bold shrink-0 self-center"
                                          style={
                                            {
                                              padding: '6px 14px',
                                              '--btn-bg': completed
                                                ? 'var(--bg-color)'
                                                : themeColor,
                                              color: completed
                                                ? 'var(--text-main)'
                                                : '#fff',
                                              border: completed
                                                ? '1px solid var(--border-color)'
                                                : 'none',
                                            } as any
                                          }
                                        >
                                          {completed ? 'Rever aula' : 'Assistir aula'}
                                          <ArrowRight size={13} />
                                        </button>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>

                          {/* Ação de rodapé do módulo */}
                          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              Deseja acessar a visão completa deste módulo?
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/modules/${module.id}`);
                              }}
                              className="text-xs font-bold hover:underline cursor-pointer border-none bg-transparent"
                              style={{ color: themeColor }}
                            >
                              Ver Módulo Completo →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Lateral */}
      <div className="flex flex-col gap-6">
        {/* Barra de Progresso Geral */}
        <div className="glass rounded-[24px] p-6 border border-[var(--border-color)]">
          <h4 className="font-extrabold mb-4 flex items-center gap-2">
            <Star style={{ color: 'var(--color-success)' }} /> Progresso Geral
          </h4>
          <div className="progress-bar-container mb-2">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div
            className="flex justify-between text-sm font-bold mt-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>{progressPercent}% concluído</span>
            <span>
              {completedLessonsCount}/{totalLessonsCount} aulas
            </span>
          </div>
        </div>

        {/* Dica do Dia */}
        <div className="glass rounded-[24px] p-6 border border-[var(--border-color)] flex flex-col gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: 'var(--color-info)' }}
          >
            💡
          </div>
          <h4 className="font-extrabold text-base">Dica de Espanhol</h4>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            "Cuidado com os falsos amigos! A palavra{' '}
            <strong>'Exquisito'</strong> em espanhol significa delicioso ou
            saboroso, e não estranho/esquisito."
          </p>
        </div>

        {/* Links rápidos */}
        <div className="glass rounded-[24px] p-6 border border-[var(--border-color)] flex flex-col gap-4">
          <h4 className="font-extrabold text-base">Ações Rápidas</h4>
          <button
            onClick={() => navigate('/leaderboard')}
            className="btn-3d btn-secondary w-full text-sm font-bold py-2"
          >
            Ver Ranking de Alunos
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="btn-3d w-full text-sm font-bold py-2"
            style={
              {
                '--btn-bg': themeColor,
                '--btn-shadow': 'var(--primary-hover)',
              } as any
            }
          >
            Entrar no Chat da Comunidade
          </button>
        </div>
      </div>
    </div>
  );
};
