import React, { useEffect, useState } from 'react';
import { api, assetUrl } from '../services/api';
import { useThemeStore } from '../stores/useThemeStore';
import { FileText, Volume2, PlayCircle, Library, Download } from 'lucide-react';

interface MediaItem {
  id: string;
  moduleId: string | null;
  title: string;
  description: string | null;
  type: 'PDF' | 'AUDIO' | 'IMAGE';
  url: string | null;
  videoUrl: string | null;
  orderIndex: number;
  createdAt: string;
}

interface Module {
  id: string;
  title: string;
}

export const MediaLibrary: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PDF' | 'AUDIO' | 'IMAGE' | 'VIDEO'>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const { themeColor } = useThemeStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mediaRes, modulesRes] = await Promise.all([
          api.get('/media-library'),
          api.get('/modules'),
        ]);
        setItems(mediaRes.data);
        setModules(modulesRes.data);
      } catch (error) {
        console.error('Erro ao buscar acervo:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = items.filter((item) => {
    if (moduleFilter && item.moduleId !== moduleFilter) return false;
    if (filter === 'ALL') return true;
    if (filter === 'VIDEO') return !!item.videoUrl;
    return item.type === filter && !item.videoUrl;
  });

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ height: '70vh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: themeColor, borderTopColor: 'transparent' }} />
        <p className="font-bold" style={{ color: 'var(--text-muted)' }}>Carregando o acervo...</p>
      </div>
    );
  }

  const filters: Array<{ key: typeof filter; label: string }> = [
    { key: 'ALL', label: 'Todos' },
    { key: 'PDF', label: '📄 PDFs' },
    { key: 'AUDIO', label: '🎧 Áudios' },
    { key: 'IMAGE', label: '🖼️ Imagens' },
    { key: 'VIDEO', label: '🎬 Vídeos' },
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-[var(--primary-light)] mb-3" style={{ color: themeColor }}>
          <Library size={34} />
        </div>
        <h1 className="text-3xl font-extrabold" style={{ margin: '0 0 6px' }}>
          Acervo Multimídia
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Materiais complementares de estudo: PDFs, áudios de pronúncia, imagens e vídeos.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-2 rounded-xl text-xs font-black border-2 cursor-pointer transition-all"
              style={
                filter === f.key
                  ? { borderColor: themeColor, color: themeColor, backgroundColor: 'var(--primary-light)' }
                  : { borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'transparent' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          className="input-gamified sm:w-64"
          style={{ padding: '10px 14px' }}
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        >
          <option value="">Todos os módulos</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>

      {/* Itens */}
      {filtered.length === 0 ? (
        <div className="glass rounded-[24px] p-12 text-center border border-[var(--border-color)]">
          <Library size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <h4 className="font-bold text-lg mb-1">Nenhum item encontrado.</h4>
          <p style={{ color: 'var(--text-muted)' }}>O acervo deste filtro ainda está vazio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div key={item.id} className="glass rounded-[24px] border border-[var(--border-color)] overflow-hidden flex flex-col">
              {/* Mídia em destaque */}
              <div className="aspect-video bg-[var(--bg-color)] flex items-center justify-center overflow-hidden border-b border-[var(--border-color)]">
                {item.videoUrl ? (
                  <iframe
                    src={getYouTubeEmbedUrl(item.videoUrl)}
                    title={item.title}
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : item.type === 'IMAGE' && item.url ? (
                  <img src={assetUrl(item.url)} alt={item.title} className="w-full h-full object-cover" />
                ) : item.type === 'AUDIO' ? (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)', color: themeColor }}>
                      <Volume2 size={32} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)', color: themeColor }}>
                      <FileText size={32} />
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-2 flex-1">
                <h3 className="font-extrabold text-base" style={{ color: 'var(--text-main)' }}>
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {item.description}
                  </p>
                )}

                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                    {item.videoUrl ? 'VÍDEO' : item.type}
                  </span>

                  {item.url && (
                    <a
                      href={assetUrl(item.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-3d text-xs font-bold"
                      style={{ padding: '8px 14px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
                    >
                      <Download size={14} /> Baixar
                    </a>
                  )}
                  {item.videoUrl && !item.url && (
                    <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <PlayCircle size={16} /> Reprodução online
                    </span>
                  )}
                  {item.type === 'AUDIO' && item.url && (
                    <audio src={assetUrl(item.url)} controls className="w-32 h-8" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
