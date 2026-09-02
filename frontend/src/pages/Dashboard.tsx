import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { BookOpen, Star, HelpCircle, ChevronRight } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((module) => {
                  const icon =
                    MODULE_ICONS[module.title] || '📁';
                  const lessonCount = module.lessons.length;

                  return (
                    <div
                      key={module.id}
                      onClick={() => navigate(`/modules/${module.id}`)}
                      className="glass rounded-[24px] border-2 border-[var(--border-color)] p-6 cursor-pointer transition-all hover:border-[var(--primary-color)] hover:scale-[1.02] group"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Icon + Title */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                              style={{
                                background: 'var(--bg-color)',
                                border: '1px solid var(--border-color)',
                              }}
                            >
                              {icon}
                            </div>
                            <div>
                              <h4
                                className="text-base font-extrabold leading-tight"
                                style={{ color: 'var(--text-main)' }}
                              >
                                {module.title}
                              </h4>
                              <span
                                className="text-xs font-bold"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {lessonCount}{' '}
                                {lessonCount === 1 ? 'aula' : 'aulas'}
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            size={20}
                            className="shrink-0 mt-1 opacity-40 group-hover:opacity-100 transition-opacity"
                            style={{ color: themeColor }}
                          />
                        </div>

                        {/* Description */}
                        {module.description && (
                          <p
                            className="text-sm leading-snug"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {module.description}
                          </p>
                        )}

                        {/* Enter Button */}
                        <button
                          className="btn-3d text-xs font-bold mt-1 self-start"
                          style={
                            {
                              padding: '6px 14px',
                              '--btn-bg': themeColor,
                              '--btn-shadow': 'var(--primary-hover)',
                            } as any
                          }
                        >
                          Entrar no Módulo
                        </button>
                      </div>
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
