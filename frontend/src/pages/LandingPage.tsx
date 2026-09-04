import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../stores/useThemeStore';
import { useAuthStore } from '../stores/useAuthStore';
import {
  BookOpen,
  PlayCircle,
  FileText,
  BarChart3,
  User,
  MessageSquare,
  Library,
  Shield,
  Settings,
  Trophy,
  Headphones,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Globe,
  GraduationCap,
  Users,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   HERO
   ────────────────────────────────────────────────────────── */
const Hero: React.FC = () => {
  const { themeColor } = useThemeStore();
  const { user } = useAuthStore();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Decorative gradient orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: themeColor }}
      />
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: '#A855F7' }}
      />

      <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative z-10">
        {/* Texto */}
        <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
          <div
            className="inline-flex items-center gap-2 self-center lg:self-start px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border"
            style={{
              borderColor: themeColor,
              color: themeColor,
              backgroundColor: 'var(--primary-light)',
            }}
          >
            <Sparkles size={14} />
            Plataforma Gratuita de Espanhol
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight"
            style={{ fontFamily: 'var(--font-title)' }}
          >
            Aprenda Espanhol de uma forma{' '}
            <span className="grad-text">simples, prática e conectada.</span>
          </h1>

          <p className="text-lg max-w-xl mx-auto lg:mx-0" style={{ color: 'var(--text-muted)' }}>
            O <strong>Espanhol em Rede</strong> é uma plataforma educacional criada para ajudar
            estudantes a aprender espanhol através de módulos organizados, aulas em vídeo,
            conteúdos interativos e acompanhamento de progresso em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            {user ? (
              <Link
                to="/dashboard"
                className="btn-3d text-base px-8 py-4"
                style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
              >
                Continuar estudando
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link
                to="/register"
                className="btn-3d text-base px-8 py-4"
                style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
              >
                Começar agora
                <ArrowRight size={18} />
              </Link>
            )}
            <a
              href="#sobre"
              className="btn-3d btn-secondary text-base px-8 py-4"
            >
              Conhecer a plataforma
            </a>
          </div>

          {/* Micro stats */}
          <div className="flex items-center gap-6 justify-center lg:justify-start mt-2">
            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
              <GraduationCap size={18} style={{ color: themeColor }} />
              Módulos organizados
            </div>
            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
              <Trophy size={18} style={{ color: 'var(--color-warning)' }} />
              Sistema de XP
            </div>
            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
              <Users size={18} style={{ color: 'var(--color-info)' }} />
              Comunidade ativa
            </div>
          </div>
        </div>

        {/* Visual / Card ilustrativo */}
        <div className="flex-1 max-w-lg w-full">
          <div className="glass rounded-[28px] p-8 border border-[var(--border-color)] relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ background: 'var(--primary-gradient)' }}
            />

            {/* Mini dashboard preview */}
            <div className="relative z-10 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-lg"
                  style={{ backgroundColor: themeColor }}
                >
                  E
                </div>
                <div>
                  <p className="text-sm font-extrabold">Espanhol em Rede</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Sua jornada de aprendizado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl p-3 text-center border border-[var(--border-color)]" style={{ backgroundColor: 'var(--bg-color)' }}>
                  <span className="block text-xl font-black" style={{ color: themeColor }}>📚</span>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Módulos</span>
                </div>
                <div className="rounded-xl p-3 text-center border border-[var(--border-color)]" style={{ backgroundColor: 'var(--bg-color)' }}>
                  <span className="block text-xl font-black" style={{ color: 'var(--color-success)' }}>✅</span>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Progresso</span>
                </div>
                <div className="rounded-xl p-3 text-center border border-[var(--border-color)]" style={{ backgroundColor: 'var(--bg-color)' }}>
                  <span className="block text-xl font-black" style={{ color: 'var(--color-warning)' }}>⭐</span>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Ranking</span>
                </div>
              </div>

              <div className="rounded-xl p-4 border border-[var(--border-color)]" style={{ backgroundColor: 'var(--bg-color)' }}>
                <div className="flex justify-between text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>
                  <span>Módulo 1 — Saudações</span>
                  <span style={{ color: 'var(--color-success)' }}>100%</span>
                </div>
                <div className="progress-bar-container" style={{ height: '8px' }}>
                  <div className="progress-bar-fill" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="rounded-xl p-4 border border-[var(--border-color)]" style={{ backgroundColor: 'var(--bg-color)' }}>
                <div className="flex justify-between text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>
                  <span>Módulo 2 — Verbos</span>
                  <span style={{ color: themeColor }}>45%</span>
                </div>
                <div className="progress-bar-container" style={{ height: '8px' }}>
                  <div className="progress-bar-fill" style={{ width: '45%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────
   SOBRE
   ────────────────────────────────────────────────────────── */
const Sobre: React.FC = () => {
  const { themeColor } = useThemeStore();

  return (
    <section id="sobre" className="py-20 px-4">
      <div className="max-w-[900px] mx-auto text-center flex flex-col gap-6">
        <span
          className="inline-flex items-center gap-2 self-center px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          <Globe size={14} />
          Sobre a plataforma
        </span>

        <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'var(--font-title)' }}>
          O que é o <span className="grad-text">Espanhol em Rede?</span>
        </h2>

        <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          O Espanhol em Rede é uma plataforma educacional gratuita criada para reunir conteúdos de
          espanhol em uma experiência organizada e gamificada. Os alunos avançam por módulos
          estruturados, assistem videoaulas, praticam com exercícios e acompanham sua evolução
          em tempo real — tudo em um só lugar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          {[
            {
              icon: <BookOpen size={28} />,
              title: 'Conteúdo Estruturado',
              desc: 'Módulos organizados para facilitar a progressão do aluno, do básico ao avançado.',
            },
            {
              icon: <BarChart3 size={28} />,
              title: 'Acompanhamento',
              desc: 'Progresso visual, XP acumulado e ranking de alunos para manter a motivação.',
            },
            {
              icon: <MessageSquare size={28} />,
              title: 'Comunidade',
              desc: 'Chat em tempo real para trocar experiências e praticar espanhol com outros alunos.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="glass rounded-[24px] p-6 border border-[var(--border-color)] flex flex-col items-center gap-3 text-center hover:border-[var(--primary-color)] transition-all"
            >
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary-light)', color: themeColor }}
              >
                {item.icon}
              </div>
              <h3 className="font-extrabold text-base">{item.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────
   RECURSOS
   ────────────────────────────────────────────────────────── */
const Recursos: React.FC = () => {
  const { themeColor } = useThemeStore();

  const recursos = [
    { icon: <BookOpen size={22} />, label: 'Módulos de aprendizagem', color: themeColor },
    { icon: <PlayCircle size={22} />, label: 'Videoaulas com YouTube', color: 'var(--color-info)' },
    { icon: <FileText size={22} />, label: 'Lições e conteúdos textuais', color: 'var(--color-success)' },
    { icon: <BarChart3 size={22} />, label: 'Acompanhamento de progresso', color: 'var(--color-warning)' },
    { icon: <User size={22} />, label: 'Perfil personalizado do estudante', color: '#F472B6' },
    { icon: <Trophy size={22} />, label: 'Ranking e sistema de XP', color: '#FFD700' },
    { icon: <MessageSquare size={22} />, label: 'Chat comunitário em tempo real', color: '#818CF8' },
    { icon: <Library size={22} />, label: 'Acervo de materiais e anexos', color: '#FB923C' },
    { icon: <Headphones size={22} />, label: 'Áudios de pronúncia', color: '#2DD4BF' },
    { icon: <Shield size={22} />, label: 'Sistema de autenticação seguro', color: '#A78BFA' },
    { icon: <Settings size={22} />, label: 'Configurações personalizáveis', color: '#94A3B8' },
    { icon: <Globe size={22} />, label: 'Tema claro e escuro', color: '#6366F1' },
  ];

  return (
    <section id="recursos" className="py-20 px-4" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-[1100px] mx-auto flex flex-col gap-10">
        <div className="text-center flex flex-col gap-4">
          <span
            className="inline-flex items-center gap-2 self-center px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          >
            <Sparkles size={14} />
            Funcionalidades
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'var(--font-title)' }}>
            Tudo que você precisa para <span className="grad-text">aprender espanhol</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Ferramentas reais que já estão disponíveis na plataforma para facilitar seu aprendizado.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recursos.map((r, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-5 border border-[var(--border-color)] flex flex-col items-center gap-3 text-center hover:border-[var(--primary-color)] transition-all hover:-translate-y-1"
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary-light)', color: r.color }}
              >
                {r.icon}
              </div>
              <span className="text-sm font-bold leading-tight">{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────
   MÓDULOS
   ────────────────────────────────────────────────────────── */
const Modulos: React.FC = () => {
  const { themeColor } = useThemeStore();
  const { user } = useAuthStore();

  return (
    <section id="modulos" className="py-20 px-4">
      <div className="max-w-[900px] mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* Illustration */}
        <div className="flex-1 w-full max-w-sm">
          <div className="glass rounded-[28px] p-6 border border-[var(--border-color)] flex flex-col gap-4">
            {['Saudações e Apresentações', 'Verbos Básicos', 'Vida Cotidiana', 'Viagens e Cultura'].map(
              (title, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-color)]"
                  style={{ backgroundColor: 'var(--bg-color)' }}
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ backgroundColor: i === 0 ? 'var(--color-success)' : themeColor, opacity: i === 0 ? 1 : 0.6 }}
                  >
                    {i === 0 ? <CheckCircle size={20} /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold truncate">{title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {i === 0 ? 'Concluído' : `${(i + 1) * 3} aulas`}
                    </p>
                  </div>
                  {i === 0 && (
                    <span className="text-[10px] font-black px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--color-success)' }}>
                      ✓
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 flex flex-col gap-5">
          <span
            className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          >
            <BookOpen size={14} />
            Trilha de aprendizado
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'var(--font-title)' }}>
            Aprenda por <span className="grad-text">módulos</span>
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            O conteúdo é organizado em módulos para facilitar a progressão do aluno. Cada módulo
            contém aulas estruturadas com videoaulas, conteúdos textuais e materiais complementares
            para um aprendizado completo.
          </p>
          <p className="text-base" style={{ color: 'var(--text-muted)' }}>
            Para acessar os módulos, crie sua conta gratuita e comece sua jornada de aprendizado.
          </p>
          {user ? (
            <Link
              to="/dashboard"
              className="btn-3d self-start text-sm px-6 py-3"
              style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
            >
              Ir para os Módulos
              <ChevronRight size={16} />
            </Link>
          ) : (
            <Link
              to="/register"
              className="btn-3d self-start text-sm px-6 py-3"
              style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
            >
              Criar conta gratuita
              <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────
   VIDEOAULAS
   ────────────────────────────────────────────────────────── */
const Videoaulas: React.FC = () => {
  const { themeColor } = useThemeStore();

  return (
    <section id="videoaulas" className="py-20 px-4" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-[900px] mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* Text */}
        <div className="flex-1 flex flex-col gap-5">
          <span
            className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          >
            <PlayCircle size={14} />
            Aprenda assistindo
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'var(--font-title)' }}>
            Aprenda também através de <span className="grad-text">videoaulas</span>
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Cada aula pode conter vídeo integrado do YouTube para complementar o aprendizado.
            Assista, pratique e avance no seu ritmo — com conteúdo visual e interativo.
          </p>
          <div className="flex flex-col gap-3 mt-2">
            {['Videoaulas integradas ao YouTube', 'Áudios de pronúncia em cada aula', 'Materiais para download (PDFs)'].map(
              (item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{item}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Video preview card */}
        <div className="flex-1 w-full max-w-md">
          <div className="glass rounded-[24px] overflow-hidden border border-[var(--border-color)]">
            <div
              className="aspect-video flex items-center justify-center relative"
              style={{ backgroundColor: '#000' }}
            >
              <div className="flex flex-col items-center gap-3 text-white">
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColor, opacity: 0.9 }}
                >
                  <PlayCircle size={32} />
                </div>
                <span className="text-sm font-bold opacity-80">Videoaula de Espanhol</span>
              </div>
            </div>
            <div className="p-5 flex flex-col gap-2">
              <h4 className="font-extrabold text-sm">Aula 1 — Saudações em Espanhol</h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Aprenda as principais formas de cumprimentar em espanhol com exemplos práticos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────
   COMO FUNCIONA
   ────────────────────────────────────────────────────────── */
const ComoFunciona: React.FC = () => {
  const { themeColor } = useThemeStore();

  const passos = [
    {
      num: '1',
      title: 'Crie sua conta',
      desc: 'Cadastre-se gratuitamente com seu e-mail. O login é protegido com verificação por código.',
      icon: <User size={22} />,
    },
    {
      num: '2',
      title: 'Escolha seus conteúdos',
      desc: 'Explore os módulos disponíveis e comece pela trilha de aprendizado mais adequada.',
      icon: <BookOpen size={22} />,
    },
    {
      num: '3',
      title: 'Assista e estude',
      desc: 'Assista videoaulas, leia conteúdos, ouça áudios de pronúncia e baixe materiais complementares.',
      icon: <PlayCircle size={22} />,
    },
    {
      num: '4',
      title: 'Acompanhe seu progresso',
      desc: 'Ganhe XP a cada aula concluída, suba no ranking e veja sua evolução no dashboard.',
      icon: <BarChart3 size={22} />,
    },
  ];

  return (
    <section id="como-funciona" className="py-20 px-4">
      <div className="max-w-[1000px] mx-auto flex flex-col gap-10">
        <div className="text-center flex flex-col gap-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'var(--font-title)' }}>
            Como <span className="grad-text">funciona?</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Em quatro passos simples, você começa sua jornada de aprendizado de espanhol.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {passos.map((p, i) => (
            <div key={i} className="relative flex flex-col items-center text-center gap-4">
              {/* Connector line */}
              {i < passos.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-[2px]" style={{ backgroundColor: 'var(--border-color)' }} />
              )}

              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-xl relative z-10"
                style={{ backgroundColor: themeColor }}
              >
                {p.icon}
              </div>
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: themeColor }}>
                Passo {p.num}
              </span>
              <h3 className="font-extrabold text-base">{p.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────
   CTA FINAL
   ────────────────────────────────────────────────────────── */
const CtaFinal: React.FC = () => {
  const { themeColor } = useThemeStore();
  const { user } = useAuthStore();

  return (
    <section className="py-20 px-4">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="glass rounded-[32px] p-10 sm:p-14 border border-[var(--border-color)] relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: 'var(--primary-gradient)' }}
          />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: themeColor }}
            >
              <GraduationCap size={32} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'var(--font-title)' }}>
              Pronto para começar a aprender <span className="grad-text">espanhol?</span>
            </h2>
            <p className="text-base max-w-md" style={{ color: 'var(--text-muted)' }}>
              {user
                ? 'Continue sua jornada de aprendizado no seu próprio ritmo agora mesmo.'
                : 'Crie sua conta gratuita agora e comece sua jornada de aprendizado com o Espanhol em Rede.'}
            </p>
            {user ? (
              <Link
                to="/dashboard"
                className="btn-3d text-base px-10 py-4"
                style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
              >
                Continuar estudando
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link
                to="/register"
                className="btn-3d text-base px-10 py-4"
                style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as React.CSSProperties}
              >
                Começar agora
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────
   FOOTER
   ────────────────────────────────────────────────────────── */
const Footer: React.FC = () => {
  const { themeColor } = useThemeStore();
  const { user } = useAuthStore();

  return (
    <footer className="border-t border-[var(--border-color)] py-12 px-4" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-2 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
              style={{ backgroundColor: themeColor }}
            >
              E
            </div>
            <span className="font-extrabold text-base">Espanhol em Rede</span>
          </div>
          <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Plataforma gratuita de ensino de espanhol com progressão gamificada e comunidade ativa.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-6 justify-center">
          <Link to="/" className="text-sm font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>
            Início
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>
                Módulos
              </Link>
              <Link to="/leaderboard" className="text-sm font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>
                Ranking
              </Link>
              <Link to="/chat" className="text-sm font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>
                Comunidade
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>
                Login
              </Link>
              <Link to="/register" className="text-sm font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>
                Cadastro
              </Link>
            </>
          )}
          <a href="#sobre" className="text-sm font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>
            Sobre
          </a>
          <a href="#recursos" className="text-sm font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>
            Recursos
          </a>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto mt-8 pt-6 border-t border-[var(--border-color)] text-center">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Espanhol em Rede. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

/* ──────────────────────────────────────────────────────────
   LANDING PAGE — MAIN
   ────────────────────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col">
      <Hero />
      <Sobre />
      <Recursos />
      <Modulos />
      <Videoaulas />
      <ComoFunciona />
      <CtaFinal />
      <Footer />
    </div>
  );
};
