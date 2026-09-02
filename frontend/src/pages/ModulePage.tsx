import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { ChevronLeft, PlayCircle, CheckCircle2, BookOpen } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl: string | null;
  orderIndex: number;
  published: boolean;
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: Lesson[];
}

export const ModulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [mod, setMod] = useState<ModuleData | null>(null);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const { user } = useAuthStore();
  const { themeColor } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moduleRes, progressRes] = await Promise.all([
          api.get(`/modules/${id}`),
          api.get('/progress/me'),
        ]);
        setMod(moduleRes.data);
        setUserProgress(progressRes.data);

        // Auto-select the first lesson
        const lessons = moduleRes.data.lessons || [];
        if (lessons.length > 0) {
          setSelectedLesson(lessons[0]);
        }
      } catch (error) {
        console.error('Erro ao buscar módulo:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const isLessonCompleted = (lessonId: string) => {
    if (!userProgress || !userProgress.progress) return false;
    return userProgress.progress.some(
      (p: any) => p.lessonId === lessonId && p.isCompleted,
    );
  };

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
          Carregando módulo...
        </p>
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-extrabold mb-2">Módulo não encontrado.</h2>
        <Link
          to="/dashboard"
          style={{ color: themeColor }}
          className="font-bold hover:underline"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    );
  }

  // Only show published lessons to non-staff users
  const isStaff = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const visibleLessons = mod.lessons.filter(
    (l) => isStaff || l.published,
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Column — Video Player + Lesson Info */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 font-bold hover:opacity-80 cursor-pointer"
            style={{
              color: 'var(--text-muted)',
              border: 'none',
              background: 'none',
            }}
          >
            <ChevronLeft size={20} /> Voltar ao Dashboard
          </button>
        </div>

        {/* Module Header */}
        <div className="glass rounded-[24px] p-6 border border-[var(--border-color)] relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: 'var(--primary-gradient)' }}
          />
          <div className="relative flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={20} style={{ color: themeColor }} />
              <span
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: themeColor }}
              >
                Módulo
              </span>
            </div>
            <h1
              className="text-2xl font-extrabold"
              style={{ color: 'var(--text-main)' }}
            >
              {mod.title}
            </h1>
            {mod.description && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {mod.description}
              </p>
            )}
          </div>
        </div>

        {/* Video Player — shows selected lesson */}
        {selectedLesson && selectedLesson.videoUrl && (
          <div className="flex flex-col gap-3">
            <YouTubePlayer
              url={selectedLesson.videoUrl}
              title={selectedLesson.title}
              className="rounded-[24px] border-2"
            />
            <div className="glass rounded-[16px] p-4 border border-[var(--border-color)]">
              <span
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: themeColor }}
              >
                Aula {selectedLesson.orderIndex} de {visibleLessons.length}
              </span>
              <h3
                className="text-lg font-extrabold mt-1"
                style={{ color: 'var(--text-main)' }}
              >
                {selectedLesson.title}
              </h3>
              {selectedLesson.content && (
                <p
                  className="text-sm mt-2"
                  style={{
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedLesson.content}
                </p>
              )}
              <button
                onClick={() => navigate(`/lessons/${selectedLesson.id}`)}
                className="btn-3d text-sm font-bold mt-3"
                style={
                  {
                    padding: '8px 16px',
                    '--btn-bg': themeColor,
                    '--btn-shadow': 'var(--primary-hover)',
                  } as any
                }
              >
                Ver Aula Completa
              </button>
            </div>
          </div>
        )}

        {selectedLesson && !selectedLesson.videoUrl && (
          <div className="glass rounded-[24px] p-6 border border-[var(--border-color)]">
            <h3
              className="text-lg font-extrabold"
              style={{ color: 'var(--text-main)' }}
            >
              {selectedLesson.title}
            </h3>
            <p
              className="text-sm mt-2"
              style={{
                color: 'var(--text-muted)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {selectedLesson.content}
            </p>
            <button
              onClick={() => navigate(`/lessons/${selectedLesson.id}`)}
              className="btn-3d text-sm font-bold mt-3"
              style={
                {
                  padding: '8px 16px',
                  '--btn-bg': themeColor,
                  '--btn-shadow': 'var(--primary-hover)',
                } as any
              }
            >
              Ver Aula Completa
            </button>
          </div>
        )}

        {!selectedLesson && visibleLessons.length === 0 && (
          <div className="glass rounded-[24px] p-8 text-center border border-[var(--border-color)]">
            <p style={{ color: 'var(--text-muted)' }}>
              Nenhuma aula publicada neste módulo.
            </p>
          </div>
        )}
      </div>

      {/* Sidebar — Lesson List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-extrabold flex items-center gap-2">
          <PlayCircle style={{ color: themeColor }} /> Aulas do Módulo
        </h3>

        {visibleLessons.length === 0 ? (
          <div className="glass rounded-[24px] p-6 text-center border border-[var(--border-color)]">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhuma aula disponível.
            </p>
          </div>
        ) : (
          visibleLessons
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((lesson, idx) => {
              const completed = isLessonCompleted(lesson.id);
              const isSelected = selectedLesson?.id === lesson.id;

              return (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`glass rounded-[16px] p-4 border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[var(--primary-color)]'
                      : 'border-[var(--border-color)] hover:border-[var(--primary-color)]'
                  }`}
                  style={
                    isSelected
                      ? { background: 'var(--bg-color)', borderColor: themeColor }
                      : {}
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {completed ? (
                        <CheckCircle2
                          size={22}
                          style={{ color: 'var(--color-success)' }}
                        />
                      ) : (
                        <div
                          className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-xs font-bold"
                          style={{
                            borderColor: isSelected ? themeColor : 'var(--border-color)',
                            color: isSelected ? themeColor : 'var(--text-muted)',
                          }}
                        >
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span
                        className="text-[10px] font-black uppercase tracking-wider block"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Aula {lesson.orderIndex}
                      </span>
                      <h5
                        className="text-sm font-extrabold truncate"
                        style={{ color: 'var(--text-main)' }}
                      >
                        {lesson.title}
                      </h5>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default ModulePage;
