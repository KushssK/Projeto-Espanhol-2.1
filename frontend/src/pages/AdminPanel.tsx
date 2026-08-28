import React, { useEffect, useState, useCallback } from 'react';
import { api, assetUrl } from '../services/api';
import { useThemeStore } from '../stores/useThemeStore';
import {
  LayoutDashboard, FolderTree, Library, ShieldCheck, Users, Palette,
  Plus, Trash2, ArrowUp, ArrowDown, X, Check, Save, Upload, Eye, Ban, RefreshCw, FileText
} from 'lucide-react';

// ============================================================================
// Tipos
// ============================================================================
interface ModuleItem {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
}

interface LessonItem {
  id: string;
  title: string;
  orderIndex: number;
}

interface CategoryItem {
  id: string;
  title: string;
  orderIndex: number;
}

interface MediaItem {
  id: string;
  title: string;
  type: 'PDF' | 'AUDIO' | 'IMAGE';
  url: string | null;
  videoUrl: string | null;
  orderIndex: number;
}

interface WhitelistEntry {
  cpf: string;
  role: 'TEACHER' | 'ADMIN';
}

interface AdminUser {
  id: string;
  email: string;
  username: string | null;
  role: string;
  avatarUrl: string | null;
  isBanned: boolean;
  createdAt: string;
}

interface ProgressDetail {
  lesson: { id: string; title: string };
  isCompleted: boolean;
  score: number;
  completedAt: string | null;
}

// ============================================================================
// Helpers de UI
// ============================================================================
const Card: React.FC<{ title?: string; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, children, actions }) => (
  <div className="glass rounded-[20px] border border-[var(--border-color)] overflow-hidden">
    {(title || actions) && (
      <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-color)] flex items-center justify-between">
        {title && <h3 className="font-extrabold text-sm uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</h3>}
        {actions}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="input-gamified" style={{ padding: '10px 14px', ...props.style }} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className="input-gamified" style={{ padding: '10px 14px', ...props.style }} />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className="input-gamified" style={{ padding: '10px 14px', minHeight: '90px', ...props.style }} />
);

const Badge: React.FC<{ color?: string; children: React.ReactNode }> = ({ color, children }) => (
  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border" style={{ borderColor: 'var(--border-color)', color: color || 'var(--text-muted)' }}>
    {children}
  </span>
);

const IconBtn: React.FC<{ onClick?: () => void; title?: string; danger?: boolean; children: React.ReactNode }> = ({ onClick, title, danger, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="h-8 w-8 rounded-lg flex items-center justify-center border cursor-pointer hover:opacity-80 transition-opacity"
    style={{ borderColor: 'var(--border-color)', background: 'transparent', color: danger ? 'var(--color-danger)' : 'var(--text-muted)' }}
  >
    {children}
  </button>
);

// ============================================================================
// App
// ============================================================================
type Tab = 'overview' | 'content' | 'media' | 'whitelist' | 'users' | 'appearance';

export const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');
  const { themeColor } = useThemeStore();

  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: 'overview', label: 'Visão Geral', icon: <LayoutDashboard size={16} /> },
    { key: 'content', label: 'Módulos & Aulas', icon: <FolderTree size={16} /> },
    { key: 'media', label: 'Acervo', icon: <Library size={16} /> },
    { key: 'whitelist', label: 'Whitelist CPF', icon: <ShieldCheck size={16} /> },
    { key: 'users', label: 'Usuários', icon: <Users size={16} /> },
    { key: 'appearance', label: 'Aparência', icon: <Palette size={16} /> },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold" style={{ margin: 0 }}>Painel Administrativo</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Gerencie o conteúdo, os usuários e a identidade visual da plataforma.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide border-2 cursor-pointer transition-all flex items-center gap-2"
            style={
              tab === t.key
                ? { borderColor: themeColor, color: themeColor, backgroundColor: 'var(--primary-light)' }
                : { borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'transparent' }
            }
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab themeColor={themeColor} onGo={setTab} />}
      {tab === 'content' && <ContentTab themeColor={themeColor} />}
      {tab === 'media' && <MediaTab themeColor={themeColor} />}
      {tab === 'whitelist' && <WhitelistTab themeColor={themeColor} />}
      {tab === 'users' && <UsersTab themeColor={themeColor} />}
      {tab === 'appearance' && <AppearanceTab themeColor={themeColor} />}
    </div>
  );
};

// ============================================================================
// Visão Geral
// ============================================================================
const OverviewTab: React.FC<{ themeColor: string; onGo: (t: Tab) => void }> = ({ themeColor, onGo }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, modulesRes, mediaRes] = await Promise.all([
          api.get('/users?limit=1'),
          api.get('/modules'),
          api.get('/media-library'),
        ]);
        setStats({
          users: usersRes.data.pagination?.total ?? 0,
          modules: modulesRes.data.length,
          lessons: modulesRes.data.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0),
          media: mediaRes.data.length,
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Usuários', value: stats?.users ?? '—', icon: '👥' },
    { label: 'Módulos', value: stats?.modules ?? '—', icon: '📚' },
    { label: 'Aulas', value: stats?.lessons ?? '—', icon: '📖' },
    { label: 'Itens no Acervo', value: stats?.media ?? '—', icon: '🎬' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-[20px] border border-[var(--border-color)] p-5 flex flex-col gap-1">
            <span className="text-2xl">{c.icon}</span>
            <span className="text-3xl font-black" style={{ color: themeColor }}>{c.value}</span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{c.label}</span>
          </div>
        ))}
      </div>

      <Card title="Acesso rápido">
        <div className="flex flex-wrap gap-3">
          {[
            { t: 'content' as Tab, label: 'Gerenciar Módulos e Aulas' },
            { t: 'whitelist' as Tab, label: 'Autorizar CPFs (Staff)' },
            { t: 'users' as Tab, label: 'Usuários e Banimentos' },
            { t: 'appearance' as Tab, label: 'Personalizar Tema e Logo' },
          ].map((b) => (
            <button
              key={b.t}
              onClick={() => onGo(b.t)}
              className="btn-3d text-sm font-bold"
              style={{ padding: '10px 18px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
            >
              {b.label}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Lembrete de privacidade">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          🔒 O perfil do aluno pertence estritamente a ele. Como admin, você pode monitorar o progresso e aplicar
          banimentos, mas <strong>não</strong> pode alterar dados cadastrais, senhas, nomes ou fotos dos estudantes.
        </p>
      </Card>
    </div>
  );
};

// ============================================================================
// Módulos & Aulas (CMS com reordenação)
// ============================================================================
const ContentTab: React.FC<{ themeColor: string }> = ({ themeColor }) => {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, LessonItem[]>>({});
  const [categoriesByModule, setCategoriesByModule] = useState<Record<string, CategoryItem[]>>({});
  const [loading, setLoading] = useState(true);

  // Formulários
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });

  const loadModules = useCallback(async () => {
    try {
      const res = await api.get('/modules');
      setModules(res.data);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const loadModuleDetail = async (moduleId: string) => {
    try {
      const [lessonsRes, categoriesRes] = await Promise.all([
        api.get(`/lessons/module/${moduleId}`),
        api.get(`/categories/module/${moduleId}`),
      ]);
      setLessonsByModule((prev) => ({ ...prev, [moduleId]: lessonsRes.data }));
      setCategoriesByModule((prev) => ({ ...prev, [moduleId]: categoriesRes.data }));
    } catch (error) {
      console.error('Erro ao carregar detalhes do módulo:', error);
    }
  };

  const createModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/modules', { ...moduleForm, orderIndex: modules.length });
      setShowCreateModule(false);
      setModuleForm({ title: '', description: '' });
      await loadModules();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar módulo.');
    }
  };

  const deleteModule = async (id: string) => {
    if (!window.confirm('Excluir este módulo? (apenas se estiver vazio)')) return;
    try {
      await api.delete(`/modules/${id}`);
      await loadModules();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir módulo.');
    }
  };

  const reorder = async (ids: string[], endpoint: string) => {
    try {
      await api.put(endpoint, { order: ids.map((id, i) => ({ id, orderIndex: i })) });
    } catch (error) {
      console.error('Erro ao reordenar:', error);
      alert('Erro ao salvar a nova ordem.');
    }
  };

  const moveModule = (index: number, dir: -1 | 1) => {
    const next = [...modules];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setModules(next);
    void reorder(next.map((m) => m.id), '/modules/reorder');
  };

  if (loading) {
    return <p className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Carregando conteúdo...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
          {modules.length} módulos • use as setas para reordenar (orderIndex)
        </p>
        <button
          onClick={() => setShowCreateModule((v) => !v)}
          className="btn-3d text-sm font-bold"
          style={{ padding: '10px 18px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
        >
          <Plus size={16} /> Novo Módulo
        </button>
      </div>

      {showCreateModule && (
        <Card>
          <form onSubmit={createModule} className="flex flex-col gap-3">
            <Input
              placeholder="Título do módulo (ex: 6. Acervo Multimídia)"
              value={moduleForm.title}
              onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <TextArea
              placeholder="Descrição (opcional)"
              value={moduleForm.description}
              onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="flex gap-3">
              <button type="submit" className="btn-3d text-sm font-bold flex-1" style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}>
                <Save size={16} /> Salvar Módulo
              </button>
              <button type="button" onClick={() => setShowCreateModule(false)} className="btn-3d btn-secondary text-sm font-bold flex-1">
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {modules.map((mod, idx) => (
        <ModuleEditor
          key={mod.id}
          themeColor={themeColor}
          module={mod}
          lessons={lessonsByModule[mod.id] || []}
          categories={categoriesByModule[mod.id] || []}
          onExpand={() => loadModuleDetail(mod.id)}
          onDelete={() => deleteModule(mod.id)}
          onMove={(dir) => moveModule(idx, dir)}
          onLessonsChange={(lessons) => setLessonsByModule((prev) => ({ ...prev, [mod.id]: lessons }))}
          onCategoriesChange={(cats) => setCategoriesByModule((prev) => ({ ...prev, [mod.id]: cats }))}
        />
      ))}
    </div>
  );
};

// Editor de um módulo (com aulas, categorias e anexos)
const ModuleEditor: React.FC<{
  themeColor: string;
  module: ModuleItem;
  lessons: LessonItem[];
  categories: CategoryItem[];
  onExpand: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onLessonsChange: (lessons: LessonItem[]) => void;
  onCategoriesChange: (cats: CategoryItem[]) => void;
}> = ({ themeColor, module, lessons, categories, onExpand, onDelete, onMove, onLessonsChange, onCategoriesChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', videoUrl: '' });
  const [categoryForm, setCategoryForm] = useState({ title: '', description: '' });

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) onExpand();
  };

  const createLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/lessons', { moduleId: module.id, ...lessonForm, orderIndex: lessons.length });
      setShowLessonForm(false);
      setLessonForm({ title: '', content: '', videoUrl: '' });
      onExpand();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar aula.');
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!window.confirm('Excluir esta aula e seus anexos?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      onExpand();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir aula.');
    }
  };

  const moveLesson = (list: LessonItem[], idx: number, dir: -1 | 1, onDone: (l: LessonItem[]) => void) => {
    const next = [...list];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    onDone(next);
    void api
      .put(`/lessons/reorder/${module.id}`, { order: next.map((l, i) => ({ id: l.id, orderIndex: i })) })
      .catch(() => alert('Erro ao reordenar aulas.'));
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories', { moduleId: module.id, ...categoryForm, orderIndex: categories.length });
      setShowCategoryForm(false);
      setCategoryForm({ title: '', description: '' });
      onExpand();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar categoria.');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!window.confirm('Excluir esta categoria?')) return;
    try {
      await api.delete(`/categories/${categoryId}`);
      onExpand();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir categoria.');
    }
  };

  const moveCategory = (list: CategoryItem[], idx: number, dir: -1 | 1) => {
    const next = [...list];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    onCategoriesChange(next);
    void api
      .put(`/categories/reorder/${module.id}`, { order: next.map((c, i) => ({ id: c.id, orderIndex: i })) })
      .catch(() => alert('Erro ao reordenar categorias.'));
  };

  return (
    <div className="glass rounded-[20px] border border-[var(--border-color)] overflow-hidden">
      {/* Cabeçalho do módulo */}
      <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-color)] flex items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <IconBtn onClick={() => onMove(-1)} title="Subir (orderIndex -1)">
            <ArrowUp size={14} />
          </IconBtn>
          <IconBtn onClick={() => onMove(1)} title="Descer (orderIndex +1)">
            <ArrowDown size={14} />
          </IconBtn>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-base" style={{ color: 'var(--text-main)' }}>
            {module.title}
          </h3>
          {module.description && (
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{module.description}</p>
          )}
        </div>
        <Badge color={themeColor}>order {module.orderIndex}</Badge>
        <IconBtn onClick={toggleExpand} title="Expandir">
          <Eye size={14} />
        </IconBtn>
        <IconBtn onClick={onDelete} title="Excluir módulo" danger>
          <Trash2 size={14} />
        </IconBtn>
      </div>

      {expanded && (
        <div className="p-5 flex flex-col gap-6">
          {/* Categorias */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Categorias</h4>
              <button
                onClick={() => setShowCategoryForm((v) => !v)}
                className="text-xs font-bold flex items-center gap-1 cursor-pointer border-none bg-transparent"
                style={{ color: themeColor }}
              >
                <Plus size={14} /> Nova categoria
              </button>
            </div>

            {showCategoryForm && (
              <form onSubmit={createCategory} className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)]">
                <Input placeholder="Título da categoria" value={categoryForm.title} onChange={(e) => setCategoryForm((f) => ({ ...f, title: e.target.value }))} required />
                <Input placeholder="Descrição (opcional)" value={categoryForm.description} onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))} />
                <div className="flex gap-2">
                  <button type="submit" className="btn-3d text-xs font-bold" style={{ padding: '8px 14px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}>
                    Salvar
                  </button>
                  <button type="button" onClick={() => setShowCategoryForm(false)} className="btn-3d btn-secondary text-xs font-bold" style={{ padding: '8px 14px' }}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {categories.map((cat, ci) => (
              <div key={cat.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border-color)]">
                <IconBtn onClick={() => moveCategory(categories, ci, -1)}><ArrowUp size={12} /></IconBtn>
                <IconBtn onClick={() => moveCategory(categories, ci, 1)}><ArrowDown size={12} /></IconBtn>
                <span className="flex-1 text-sm font-bold" style={{ color: 'var(--text-main)' }}>{cat.title}</span>
                <IconBtn onClick={() => deleteCategory(cat.id)} danger><Trash2 size={13} /></IconBtn>
              </div>
            ))}
            {categories.length === 0 && !showCategoryForm && (
              <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Nenhuma categoria neste módulo.</p>
            )}
          </div>

          {/* Aulas */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Aulas ({lessons.length})</h4>
              <button
                onClick={() => setShowLessonForm((v) => !v)}
                className="text-xs font-bold flex items-center gap-1 cursor-pointer border-none bg-transparent"
                style={{ color: themeColor }}
              >
                <Plus size={14} /> Nova aula
              </button>
            </div>

            {showLessonForm && (
              <form onSubmit={createLesson} className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)]">
                <Input placeholder="Título da aula" value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} required />
                <TextArea placeholder="Conteúdo teórico / exercícios (texto)" value={lessonForm.content} onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))} required />
                <Input placeholder="URL do vídeo (YouTube/Vimeo) — opcional" value={lessonForm.videoUrl} onChange={(e) => setLessonForm((f) => ({ ...f, videoUrl: e.target.value }))} />
                <div className="flex gap-2">
                  <button type="submit" className="btn-3d text-xs font-bold" style={{ padding: '8px 14px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}>
                    Salvar Aula
                  </button>
                  <button type="button" onClick={() => setShowLessonForm(false)} className="btn-3d btn-secondary text-xs font-bold" style={{ padding: '8px 14px' }}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {lessons.map((lesson, li) => (
              <div key={lesson.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border-color)]">
                <IconBtn onClick={() => moveLesson(lessons, li, -1, onLessonsChange)}><ArrowUp size={12} /></IconBtn>
                <IconBtn onClick={() => moveLesson(lessons, li, 1, onLessonsChange)}><ArrowDown size={12} /></IconBtn>
                <FileText size={14} style={{ color: themeColor }} />
                <span className="flex-1 text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>{lesson.title}</span>
                <LessonAttachments lessonId={lesson.id} themeColor={themeColor} />
                <IconBtn onClick={() => deleteLesson(lesson.id)} danger><Trash2 size={13} /></IconBtn>
              </div>
            ))}
            {lessons.length === 0 && !showLessonForm && (
              <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Nenhuma aula neste módulo.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Anexos de uma aula (upload + listagem + exclusão)
const LessonAttachments: React.FC<{ lessonId: string; themeColor: string }> = ({ lessonId, themeColor }) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await api.get(`/attachments/lesson/${lessonId}`);
      setAttachments(res.data);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/attachments/${lessonId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao enviar anexo (máx 20MB).');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este anexo?')) return;
    try {
      await api.delete(`/attachments/${id}`);
      await load();
    } catch (error) {
      alert('Erro ao excluir anexo.');
    }
  };

  return (
    <>
      <IconBtn onClick={() => { setOpen((v) => !v); if (!open) void load(); }} title="Anexos (PDF/áudio/imagem)">
        <FileText size={13} />
      </IconBtn>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="glass p-6 rounded-[24px] border border-[var(--border-color)] max-w-md w-full flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base">Anexos da Aula</h4>
              <IconBtn onClick={() => setOpen(false)}><X size={15} /></IconBtn>
            </div>
            <input ref={fileRef} type="file" accept="application/pdf,audio/*,image/*" onChange={handleUpload} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="btn-3d text-sm font-bold" style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}>
              <Upload size={16} /> Enviar Anexo (máx 20MB)
            </button>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border-color)]">
                  <FileText size={16} style={{ color: themeColor }} />
                  <Badge>{a.type}</Badge>
                  <a href={assetUrl(a.url)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold flex-1 truncate" style={{ color: themeColor }}>
                    {a.url.split('/').pop()}
                  </a>
                  <IconBtn onClick={() => handleDelete(a.id)} danger><Trash2 size={13} /></IconBtn>
                </div>
              ))}
              {attachments.length === 0 && (
                <p className="text-xs italic text-center" style={{ color: 'var(--text-muted)' }}>Nenhum anexo ainda.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================================
// Acervo Multimídia
// ============================================================================
const MediaTab: React.FC<{ themeColor: string }> = ({ themeColor }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'PDF', videoUrl: '' });
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/media-library');
      setItems(res.data);
    } catch (error) {
      console.error('Erro ao carregar acervo:', error);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description || '');
      formData.append('type', form.type);
      if (form.videoUrl) formData.append('videoUrl', form.videoUrl);
      if (selectedFile) formData.append('file', selectedFile);

      await api.post('/media-library', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowForm(false);
      setForm({ title: '', description: '', type: 'PDF', videoUrl: '' });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar item do acervo.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este item do acervo?')) return;
    try {
      await api.delete(`/media-library/${id}`);
      await load();
    } catch (error) {
      alert('Erro ao excluir item.');
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setItems(next);
    void api
      .put('/media-library/reorder', { order: next.map((m, i) => ({ id: m.id, orderIndex: i })) })
      .catch(() => alert('Erro ao reordenar acervo.'));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{items.length} itens no acervo</p>
        <button onClick={() => setShowForm((v) => !v)} className="btn-3d text-sm font-bold" style={{ padding: '10px 18px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}>
          <Plus size={16} /> Novo Item
        </button>
      </div>

      {showForm && (
        <Card title="Novo item no Acervo">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input placeholder="Título" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            <Input placeholder="Descrição (opcional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="PDF">PDF</option>
              <option value="AUDIO">Áudio</option>
              <option value="IMAGE">Imagem</option>
            </Select>
            <Input placeholder="URL de vídeo externo (YouTube/Vimeo) — opcional" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} />
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,audio/*,image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm"
                style={{ color: 'var(--text-muted)' }}
              />
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Envie um arquivo (até 20MB) ou informe uma URL de vídeo externa.
              </p>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-3d text-sm font-bold flex-1" style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}>
                <Save size={16} /> Salvar Item
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-3d btn-secondary text-sm font-bold flex-1">
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border-color)]">
            <IconBtn onClick={() => move(idx, -1)}><ArrowUp size={12} /></IconBtn>
            <IconBtn onClick={() => move(idx, 1)}><ArrowDown size={12} /></IconBtn>
            <Badge color={themeColor}>{item.videoUrl ? 'VÍDEO' : item.type}</Badge>
            <span className="flex-1 text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>{item.title}</span>
            {item.url && (
              <a href={assetUrl(item.url)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold" style={{ color: themeColor }}>
                Abrir
              </a>
            )}
            <IconBtn onClick={() => handleDelete(item.id)} danger><Trash2 size={14} /></IconBtn>
          </div>
        ))}
        {items.length === 0 && !showForm && (
          <p className="text-center py-8 italic" style={{ color: 'var(--text-muted)' }}>O acervo está vazio.</p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Whitelist CPF
// ============================================================================
const WhitelistTab: React.FC<{ themeColor: string }> = ({ themeColor }) => {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [form, setForm] = useState({ cpf: '', role: 'TEACHER' as 'TEACHER' | 'ADMIN' });

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/whitelist');
      setEntries(res.data);
    } catch (error) {
      console.error('Erro ao carregar whitelist:', error);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/whitelist', { cpf: form.cpf.replace(/\D/g, ''), role: form.role });
      setForm({ cpf: '', role: 'TEACHER' });
      await load();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao autorizar CPF.');
    }
  };

  const handleRemove = async (cpf: string) => {
    if (!window.confirm(`Remover o CPF ${cpf} da whitelist?`)) return;
    try {
      await api.delete(`/admin/whitelist/${cpf}`);
      await load();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao remover CPF.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card title="Autorizar CPF para Staff">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
            required
            className="flex-1"
          />
          <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))} className="sm:w-48">
            <option value="TEACHER">Professor</option>
            <option value="ADMIN">Administrador</option>
          </Select>
          <button type="submit" className="btn-3d text-sm font-bold" style={{ padding: '10px 18px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}>
            <Plus size={16} /> Autorizar
          </button>
        </form>
        <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
          O staff se cadastra com CPF e a role é atribuída automaticamente se constar aqui.
        </p>
      </Card>

      <Card title={`CPFs autorizados (${entries.length})`}>
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <div key={e.cpf} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)]">
              <span className="font-mono font-bold text-sm flex-1" style={{ color: 'var(--text-main)' }}>{e.cpf}</span>
              <Badge color={e.role === 'ADMIN' ? themeColor : 'var(--color-info)'}>{e.role}</Badge>
              <IconBtn onClick={() => handleRemove(e.cpf)} danger title="Remover"><Trash2 size={14} /></IconBtn>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-center py-6 italic" style={{ color: 'var(--text-muted)' }}>Nenhum CPF autorizado ainda.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// Usuários (listar, banir, ver progresso)
// ============================================================================
const UsersTab: React.FC<{ themeColor: string }> = ({ themeColor }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewing, setViewing] = useState<{ user: AdminUser; progress: ProgressDetail[]; totalXP: number } | null>(null);

  const load = useCallback(
    async (p: number) => {
      try {
        const res = await api.get(`/users?page=${p}&limit=15`);
        setUsers(res.data.users);
        setTotalPages(res.data.pagination.totalPages);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    },
    []
  );

  useEffect(() => {
    load(page);
  }, [load, page]);

  const toggleBan = async (u: AdminUser) => {
    try {
      await api.put(`/users/${u.id}/${u.isBanned ? 'unban' : 'ban'}`);
      await load(page);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao alterar banimento.');
    }
  };

  const viewProgress = async (u: AdminUser) => {
    try {
      const res = await api.get(`/users/${u.id}/progress`);
      setViewing({ user: u, progress: res.data.progress, totalXP: res.data.totalXP });
    } catch (error) {
      alert('Erro ao carregar progresso.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card title={`Usuários (página ${page}/${totalPages})`}>
        <div className="flex flex-col">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-3 border-b border-[var(--border-color)] last:border-b-0">
              {u.avatarUrl ? (
                <img src={assetUrl(u.avatarUrl)} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-[var(--border-color)] flex items-center justify-center">
                  <Users size={14} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold truncate" style={{ color: 'var(--text-main)' }}>
                  {u.username || 'Sem username'}
                  {u.isBanned && <span className="ml-2 text-[10px] bg-[var(--color-danger)] text-white px-1.5 py-0.5 rounded-full">BANIDO</span>}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
              </div>
              <Badge color={u.role === 'ADMIN' ? themeColor : u.role === 'TEACHER' ? 'var(--color-info)' : 'var(--color-success)'}>
                {u.role}
              </Badge>
              <IconBtn onClick={() => viewProgress(u)} title="Ver progresso"><Eye size={14} /></IconBtn>
              {u.role !== 'ADMIN' && (
                <IconBtn onClick={() => toggleBan(u)} title={u.isBanned ? 'Desbanir' : 'Banir'} danger>
                  {u.isBanned ? <RefreshCw size={14} /> : <Ban size={14} />}
                </IconBtn>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-3d btn-secondary text-xs font-bold" style={{ padding: '8px 14px' }}>
            Anterior
          </button>
          <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-3d text-xs font-bold" style={{ padding: '8px 14px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}>
            Próxima
          </button>
        </div>
      </Card>

      {/* Modal de progresso */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="glass p-6 rounded-[24px] border border-[var(--border-color)] max-w-lg w-full flex flex-col gap-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-lg" style={{ color: 'var(--text-main)' }}>{viewing.user.username || viewing.user.email}</h4>
                <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  {viewing.totalXP} XP total • {viewing.progress.length} registros de progresso
                </p>
              </div>
              <IconBtn onClick={() => setViewing(null)}><X size={15} /></IconBtn>
            </div>
            <div className="flex flex-col gap-2">
              {viewing.progress.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-color)]">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>{p.lesson.title}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {p.completedAt ? new Date(p.completedAt).toLocaleDateString('pt-BR') : 'Não concluída'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color={p.isCompleted ? 'var(--color-success)' : 'var(--text-muted)'}>
                      {p.isCompleted ? 'Concluída' : 'Incompleta'}
                    </Badge>
                    <span className="text-sm font-black" style={{ color: themeColor }}>{p.score} XP</span>
                  </div>
                </div>
              ))}
              {viewing.progress.length === 0 && (
                <p className="text-center py-6 italic" style={{ color: 'var(--text-muted)' }}>Este usuário ainda não tem progresso.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Aparência (identidade visual dinâmica)
// ============================================================================
const AppearanceTab: React.FC<{ themeColor: string }> = ({ themeColor }) => {
  const { fetchSettings, updateSettingsOnState } = useThemeStore();
  const [color, setColor] = useState(themeColor);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const logoRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/settings');
        setColor(res.data.themeColor || '#7C3AED');
        setLogoUrl(res.data.logoUrl || null);
      } catch (error) {
        console.error('Erro ao carregar settings:', error);
      }
    };
    load();
  }, []);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/settings', { themeColor: color, logoUrl });
      updateSettingsOnState(color, logoUrl);
      await fetchSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      alert('Erro ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLogoUrl(res.data.settings.logoUrl);
      await fetchSettings();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao enviar logo (máx 5MB, imagem).');
    } finally {
      if (logoRef.current) logoRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Card title="Cor principal da plataforma">
        <form onSubmit={saveSettings} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-14 w-14 rounded-xl border border-[var(--border-color)] cursor-pointer"
              style={{ background: 'transparent' }}
            />
            <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 font-mono" />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            O front-end consome esta cor dinamicamente via <code>GET /api/settings</code> (CSS variables).
          </p>

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Logomarca</h4>
            {logoUrl && <img src={assetUrl(logoUrl)} alt="Logo atual" className="h-12 w-auto object-contain" />}
            <input ref={logoRef} type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
            <button type="button" onClick={() => logoRef.current?.click()} className="btn-3d btn-secondary text-sm font-bold" style={{ padding: '10px 18px' }}>
              <Upload size={16} /> Enviar Nova Logo
            </button>
          </div>

          <button type="submit" disabled={saving} className="btn-3d font-bold" style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}>
            {saving ? 'Salvando...' : <><Save size={18} /> Salvar Identidade Visual</>}
          </button>
          {saved && (
            <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-success)' }}>
              <Check size={16} /> Alterações aplicadas em tempo real!
            </p>
          )}
        </form>
      </Card>
    </div>
  );
};
