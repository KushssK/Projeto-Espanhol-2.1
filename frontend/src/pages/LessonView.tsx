import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, assetUrl } from '../services/api';
import { useThemeStore } from '../stores/useThemeStore';
import { ChevronLeft, FileText, CheckCircle2, ArrowRight, Download, Volume2 } from 'lucide-react';

interface Attachment {
  id: string;
  type: 'PDF' | 'AUDIO' | 'IMAGE';
  url: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl: string | null;
  moduleId: string;
  attachments: Attachment[];
}

export const LessonView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  
  const { themeColor } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        const [lessonRes, progressRes] = await Promise.all([
          api.get(`/lessons/${id}`),
          api.get('/progress/me')
        ]);
        setLesson(lessonRes.data);

        // Verificar se já está concluída
        const isDone = progressRes.data.progress?.some(
          (p: any) => p.lessonId === id && p.isCompleted
        );
        setCompleted(!!isDone);
      } catch (error) {
        console.error('Erro ao buscar dados da aula:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLessonData();
  }, [id]);

  const handleComplete = async () => {
    if (completed || marking) return;
    setMarking(true);
    try {
      await api.post(`/progress/${id}`, { score: 15 }); // 15 XP por aula concluída
      setCompleted(true);
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    } finally {
      setMarking(false);
    }
  };

  // Helper para obter ID do YouTube
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
      return url; // Retorna original se for Vimeo ou já estiver em formato embed
    } catch (e) {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-height-[60vh] gap-4" style={{ height: '70vh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: themeColor, borderTopColor: 'transparent' }} />
        <p className="font-bold" style={{ color: 'var(--text-muted)' }}>Carregando aula...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-extrabold mb-2">Aula não encontrada.</h2>
        <Link to="/" style={{ color: themeColor }} className="font-bold hover:underline">
          Voltar para Módulos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Botão Voltar */}
      <div>
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 font-bold hover:opacity-80 cursor-pointer"
          style={{ color: 'var(--text-muted)', border: 'none', background: 'none' }}
        >
          <ChevronLeft size={20} /> Voltar para os Módulos
        </button>
      </div>

      {/* Título da Aula */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-black uppercase tracking-wider" style={{ color: themeColor }}>Aula Interativa</span>
        <h1 className="text-3xl font-extrabold" style={{ margin: 0, fontSize: '32px', textAlign: 'left' }}>
          {lesson.title}
        </h1>
      </div>

      {/* Player de Vídeo Responsivo (YouTube/Vimeo) */}
      {lesson.videoUrl && (
        <div className="w-full aspect-video rounded-[24px] overflow-hidden border-2 border-[var(--border-color)] shadow-md bg-black">
          <iframe
            src={getYouTubeEmbedUrl(lesson.videoUrl)}
            title={lesson.title}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Conteúdo Textual da Aula */}
      <div className="glass rounded-[24px] p-6 sm:p-8 border border-[var(--border-color)] flex flex-col gap-6">
        <h3 className="text-lg font-black border-b border-[var(--border-color)] pb-3" style={{ color: 'var(--text-main)' }}>
          Conteúdo Teórico & Exercícios
        </h3>
        <div 
          className="prose dark:prose-invert max-w-none text-left"
          style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}
        >
          {lesson.content}
        </div>
      </div>

      {/* Anexos de Mídia (Downloads e Áudios de Pronúncia) */}
      {lesson.attachments && lesson.attachments.length > 0 && (
        <div className="glass rounded-[24px] p-6 border border-[var(--border-color)] flex flex-col gap-4">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            📂 Material Complementar e Áudios
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.attachments.map((attach, idx) => (
              <div 
                key={attach.id} 
                className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)]"
              >
                {attach.type === 'AUDIO' ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Volume2 size={16} className="text-sky-500" /> ÁUDIO DE PRONÚNCIA {idx + 1}
                    </span>
                    <audio 
                      src={assetUrl(attach.url)} 
                      controls 
                      className="w-full h-10 mt-1" 
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText size={28} className="text-rose-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                          DOCUMENTO COMPLEMENTAR
                        </span>
                        <span className="text-sm font-extrabold truncate max-w-[200px]" style={{ color: 'var(--text-main)' }}>
                          PDF Aula {idx + 1}
                        </span>
                      </div>
                    </div>
                    <a 
                      href={assetUrl(attach.url)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-3d text-xs font-bold"
                      style={{ padding: '8px 12px', '--btn-bg': 'var(--color-info)', '--btn-shadow': '#168cb3' } as any}
                    >
                      <Download size={14} /> Baixar
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer da Aula: Conclusão Gamificada */}
      <div className="glass rounded-[24px] p-6 border-2 border-[var(--border-color)] bg-[var(--bg-color)] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          {completed ? (
            <div className="flex items-center gap-2 text-[var(--color-success)] font-extrabold">
              <CheckCircle2 size={24} /> Aula Concluída! (+15 XP)
            </div>
          ) : (
            <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
              Estude o conteúdo e clique ao lado para registrar seu progresso!
            </p>
          )}
        </div>

        <div className="flex gap-4">
          {!completed ? (
            <button
              onClick={handleComplete}
              disabled={marking}
              className="btn-3d font-bold btn-success flex items-center gap-2"
            >
              <CheckCircle2 size={20} />
              {marking ? 'Salvando...' : 'Marcar como Concluída'}
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="btn-3d font-bold flex items-center gap-2"
              style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
            >
              Avançar Trilha <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
