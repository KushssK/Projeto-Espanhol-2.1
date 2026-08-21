// ═══════════ Área do Aluno ═══════════
(function () {
  // ── Guarda de rota ──
  if (!API.token || !API.user) {
    window.location.href = '/index.html';
    return;
  }
  const me = API.user;

  const MODULES = [
    { name: 'Conversação', icon: 'chat', desc: 'Pratique conversas do dia a dia em espanhol.' },
    { name: 'Cultura Hispânica', icon: 'globe', desc: 'Tradições, costumes e curiosidades dos países hispânicos.' },
    { name: 'Dicas de Aprendizagem', icon: 'zap', desc: 'Estratégias para acelerar seu aprendizado.' },
    { name: 'Expressões e Girias do Cotidiano', icon: 'smile', desc: 'Frases populares e gírias usadas no dia a dia.' },
    { name: 'Gramática', icon: 'book', desc: 'Regras e estrutura da língua espanhola.' },
    { name: 'Leitura e Compreensão de Texto', icon: 'eye', desc: 'Desenvolva sua capacidade de leitura e interpretação.' },
    { name: 'Pronúncia', icon: 'mic', desc: 'Sons, sotaques e entonação correta.' },
    { name: 'Vocabulário', icon: 'list', desc: 'Palavras e expressões por tema.' },
  ];

  // ── Conversas pendentes (sobrevivem a recarregar a página) ──
  // declarado ANTES do state, que o referencia na inicialização (evita TDZ)
  const PENDING_KEY = 'cs_pending_channels';

  const state = {
    videos: [], exercises: [], messages: [], channels: [],
    activeChannel: null,
    // conversas que o usuário iniciou mas que ainda não têm mensagem no servidor
    pendingChannels: (() => { try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || []; } catch (e) { return []; } })(),
    videoFilter: 'Todos', videoQuery: '',
    quiz: null, quizIdx: 0, quizScore: 0, quizAnswered: false,
  };

  // ── Progresso local (aulas assistidas) ──
  const PROG_KEY = 'cs_progress';
  function getProgress() { try { return JSON.parse(localStorage.getItem(PROG_KEY)) || {}; } catch (e) { return {}; } }
  function setProgress(p) { localStorage.setItem(PROG_KEY, JSON.stringify(p)); }

  function savePendingChannels() {
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(state.pendingChannels)); } catch (e) { /* ignore */ }
  }

  // ── Meta helpers ──
  const titles = {
    inicio: ['Início', 'Área do aluno · visão geral'],
    modulos: ['Módulos de Aula', 'Trilha completa do curso'],
    videos: ['Aulas em Vídeo', 'Assista às aulas por tópico'],
    exercicios: ['Exercícios & Simulados', 'Teste seus conhecimentos'],
    chat: ['Área de Conversação', 'Chat em tempo real entre alunos'],
    perfil: ['Meu Perfil', 'Personalize sua conta'],
  };

  window.go = function (view) {
    document.querySelectorAll('.nav-item[data-view]').forEach((n) => n.classList.toggle('active', n.dataset.view === view));
    document.querySelectorAll('.subnav-item').forEach((n) => n.classList.remove('active'));
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    const el = document.getElementById('view-' + view);
    if (el) el.classList.add('active');
    document.getElementById('pageTitle').textContent = titles[view][0];
    document.getElementById('pageBreadcrumb').textContent = titles[view][1];
    const isVideos = view === 'videos';
    document.getElementById('globalSearch').style.display = isVideos ? '' : 'none';
    if (isVideos) {
      state.videoQuery = '';
      renderVideos();
      const inp = document.querySelector('#globalSearch input');
      if (inp) { inp.value = ''; inp.placeholder = 'Buscar videoaulas…'; }
    }
    if (view === 'chat' && !window._chatPolling) startChatPolling();
    if (view === 'modulos') renderModule(window._currentModule);
    document.getElementById('sidebar').classList.remove('open');
    window.scrollTo({ top: 0 });
  };

  window.goHome = function () { go('inicio'); };

  // ── Header ──
  function formatDob(dob) {
    if (!dob) return '—';
    const [y, m, d] = String(dob).slice(0, 10).split('-');
    return y && m && d ? d + '/' + m + '/' + y : dob;
  }

  function renderHeader() {
    document.getElementById('sidebarAvatar').innerHTML = avatarHtml(me, '');
    document.getElementById('topAvatar').innerHTML = avatarHtml(me);
    document.getElementById('welcomeAvatar').innerHTML = avatarHtml(me, '');
    document.getElementById('welcomeName').textContent = me.username;
    const now = new Date();
    const hours = now.getHours();
    const greet = hours < 12 ? 'Buenos días' : hours < 18 ? 'Buenas tardes' : 'Buenas noches';
    document.getElementById('welcomeDate').textContent = greet + '! Hoje é ' + now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) + '. Que tal uma videoaula?';
    document.getElementById('sidebarName').textContent = me.username;
    document.getElementById('profileAvatar').innerHTML = avatarHtml(me, 'lg');
    document.getElementById('profileName').textContent = me.username;
    document.getElementById('profileEmail').textContent = me.email;
    document.getElementById('profEmail').value = me.email;
    document.getElementById('profUsername').value = me.username;
    document.getElementById('profDob').value = formatDob(me.dob);
  }

  // ── Módulos ──
  function buildModuleSubnav() {
    const sub = document.getElementById('moduleSubnav');
    sub.innerHTML = MODULES.map((m) =>
      '<button class="subnav-item" data-module="' + m.name + '" onclick="goModule(\'' + m.name + '\')">' + icon(m.icon, 15) + ' ' + m.name + '</button>'
    ).join('');
  }

  window.goModule = function (name) {
    window._currentModule = name;
    renderModule(name);
    go('modulos');
    document.querySelectorAll('.subnav-item').forEach((n) => n.classList.toggle('active', n.dataset.module === name));
  };

  // volta para a visão geral dos módulos (limpa o módulo atual)
  window.showModulesOverview = function () {
    window._currentModule = null;
    go('modulos');
  };

  function renderModule(name) {
    const mod = MODULES.find((m) => m.name === name);
    const lessons = state.videos.filter((v) => v.module === name);
    const exs = state.exercises.filter((e) => e.module === name);
    const prog = getProgress();
    const done = lessons.filter((l) => prog[l.id]).length;
    const root = document.getElementById('modulosRoot');

    const backBtn = '<button class="btn btn-ghost btn-sm" style="margin-bottom:18px" onclick="showModulesOverview()">← Todos os módulos</button>';

    if (!mod) {
      // visão geral dos módulos
      document.getElementById('pageTitle').textContent = 'Módulos de Aula';
      document.getElementById('pageBreadcrumb').textContent = 'Escolha um módulo para começar';
      const cards = MODULES.map((m) => {
        const ls = state.videos.filter((v) => v.module === m.name);
        const d = ls.filter((l) => prog[l.id]).length;
        const pct = ls.length ? Math.round((d / ls.length) * 100) : 0;
        return '<div class="glass module-card" onclick="goModule(\'' + m.name + '\')">' +
          '<span class="mc-arrow">→</span>' +
          '<span class="mc-emoji">' + icon(m.icon, 30) + '</span>' +
          '<h4>' + m.name + '</h4><p>' + m.desc + '</p>' +
          '<div class="mc-progress"><div class="progress" style="flex:1"><i style="width:' + pct + '%"></i></div><span>' + d + '/' + ls.length + '</span></div>' +
          '</div>';
      }).join('');
      root.innerHTML = '<div class="module-grid">' + cards + '</div>';
      return;
    }

    document.getElementById('pageTitle').textContent = mod.name;
    document.getElementById('pageBreadcrumb').textContent = mod.desc;

    const lessonItems = lessons.map((v, i) => {
      const watched = !!prog[v.id];
      return '<div class="glass lesson-item" onclick="openVideo(\'' + v.id + '\')">' +
        '<div class="l-thumb" style="' + thumbCss(i) + '">' + icon('play', 22) + '</div>' +
        '<div style="min-width:0"><b>' + escapeHtml(v.title) + '</b><span>' + (watched ? '✓ Concluída' : 'Aula ' + (i + 1) + ' · ' + escapeHtml(v.duration)) + '</span></div>' +
        (watched ? '<div class="lesson-check">✓</div>' : '<div class="l-play">' + icon('play', 17) + '</div>') +
        '</div>';
    }).join('') || '<div class="empty-state"><div class="es-icon">' + icon('play', 28) + '</div><b>Sem aulas neste módulo ainda</b></div>';

    const exItems = exs.map((e) => {
      const qs = e.questions || [];
      return '<div class="glass exercise-card" style="min-width:0">' +
        '<div class="ec-head"><span class="ec-emoji">' + icon('quiz', 26) + '</span><span class="difficulty">' + diffDots(e.difficulty) + '</span></div>' +
        '<h4>' + escapeHtml(e.title) + '</h4>' +
        '<div class="meta"><span>' + qs.length + ' questões</span><span>' + escapeHtml(e.difficulty) + '</span></div>' +
        '<button class="btn btn-ghost btn-sm" onclick="startQuiz(\'' + e.id + '\')">Iniciar simulado</button></div>';
    }).join('');

    root.innerHTML = backBtn +
      '<div class="glass card" style="margin-bottom:18px">' +
      '<div class="card-title">' + mod.name + ' — ' + lessons.length + ' aulas</div>' +
      '<div class="card-sub">' + (done === lessons.length && lessons.length ? 'Módulo concluído! Parabéns!' : 'Assista às aulas e complete o módulo para ganhar pontos.') + '</div>' +
      '<div class="progress" style="margin-bottom:20px"><i style="width:' + (lessons.length ? Math.round(done / lessons.length * 100) : 0) + '%"></i></div>' +
      '<div class="lesson-list">' + lessonItems + '</div></div>' +
      (exItems ? '<div class="glass card"><div class="card-title">Simulados do módulo</div><div class="exercise-grid" style="margin-top:14px">' + exItems + '</div></div>' : '');
  }

  // ── Helper: extrai ID do YouTube ──
  function ytId(url) {
    if (!url) return '';
    const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : '';
  }
  function ytEmbed(url) {
    const id = ytId(url);
    return id ? 'https://www.youtube.com/embed/' + id : url;
  }
  function ytThumb(url) {
    const id = ytId(url);
    return id ? 'https://img.youtube.com/vi/' + id + '/mqdefault.jpg' : '';
  }

  // ── Vídeos ──
  function thumbCss(i) {
    return 'background:' + gradThumb(i).background.replace(/\n/g, ' ');
  }

  function renderVideoFilters() {
    const mods = ['Todos'].concat(MODULES.map((m) => m.name));
    document.getElementById('videoFilters').innerHTML = mods.map((m) =>
      '<button class="filter-chip' + (state.videoFilter === m ? ' active' : '') + '" onclick="setVideoFilter(\'' + m + '\')">' + m + '</button>'
    ).join('');
  }

  window.setVideoFilter = function (m) {
    state.videoFilter = m;
    renderVideoFilters();
    renderVideos();
  };

  window.videoSearch = function (q) {
    state.videoQuery = q;
    renderVideos();
  };

  function renderVideos() {
    const q = (state.videoQuery || '').toLowerCase();
    let list = state.videos;
    if (state.videoFilter !== 'Todos') list = list.filter((v) => v.module === state.videoFilter);
    if (q) list = list.filter((v) => (v.title + ' ' + v.description + ' ' + v.module).toLowerCase().includes(q));
    const grid = document.getElementById('videoGrid');
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="es-icon">' + icon('search', 28) + '</div><b>Nenhuma videoaula encontrada</b><span>Tente outra busca ou filtro.</span></div>';
      return;
    }
    grid.innerHTML = list.map((v, i) => {
      const thumb = ytThumb(v.url);
      const thumbStyle = thumb ? 'background-image:url(' + thumb + ');background-size:cover;background-position:center' : thumbCss(i);
      return '<div class="glass vcard">' +
      '<div class="vthumb" style="' + thumbStyle + '" onclick="openVideo(\'' + v.id + '\')">' + icon('play', 40) +
      '<span class="vdur">' + escapeHtml(v.duration) + '</span></div>' +
      '<div class="vbody">' +
      '<span class="chip">' + escapeHtml(v.module) + '</span>' +
      '<h4 onclick="openVideo(\'' + v.id + '\')">' + escapeHtml(v.title) + '</h4>' +
      '<p>' + escapeHtml(v.description) + '</p>' +
      '<div class="vmeta"><span>' + escapeHtml(v.duration) + '</span></div>' +
      '<div class="vactions">' +
      '<button class="btn btn-primary btn-sm" onclick="openVideo(\'' + v.id + '\')">' + icon('play', 14) + ' Assistir</button>' +
      '<a class="btn btn-ghost btn-sm" href="' + escapeHtml(v.url) + '" target="_blank" rel="noopener">' + icon('play', 14) + ' YouTube</a>' +
      '</div></div></div>';
    }).join('');
  }

  // ── Player ──
  window.openVideo = function (id) {
    const v = state.videos.find((x) => x.id === id);
    if (!v) return;
    const prog = getProgress();
    prog[v.id] = { watched: true, at: Date.now() };
    setProgress(prog);
    const related = state.videos.filter((x) => x.id !== id && x.module === v.module).slice(0, 6);
    const url = escapeHtml(v.url);
    document.getElementById('playerContent').innerHTML =
      '<h3>' + escapeHtml(v.title) + '</h3>' +
      '<p class="modal-sub" style="margin-bottom:16px">' + escapeHtml(v.description) + '</p>' +
      '<div class="player-wrap">' +
      '<div class="player-stage"><iframe src="' + ytEmbed(url) + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:16px;background:#000"></iframe>' +
      '<div style="display:flex;gap:10px;margin-top:14px">' +
      '<a class="btn btn-primary btn-sm" href="' + url + '" target="_blank" rel="noopener">' + icon('play', 14) + ' Abrir no YouTube</a>' +
      '<button class="btn btn-ghost btn-sm" onclick="markWatched(\'' + v.id + '\')">✓ Marcar como concluída</button>' +
      '</div></div>' +
      '<div><div class="card-title" style="margin-bottom:10px">Aulas relacionadas</div><div class="related-list">' +
      related.map((r, i) => '<div class="related-item" onclick="openVideo(\'' + r.id + '\')">' +
        '<div class="r-thumb" style="' + thumbCss(i) + '">' + icon('play', 20) + '</div>' +
        '<div style="min-width:0"><b>' + escapeHtml(r.title) + '</b><span>' + escapeHtml(r.module) + ' · ' + escapeHtml(r.duration) + '</span></div></div>'
      ).join('') + '</div></div></div>';
    openModal('videoModal');
    refreshStats();
    renderInicio();
    renderModuleGrid();
    renderModule(window._currentModule);
  };

  window.markWatched = function (id) {
    const prog = getProgress();
    prog[id] = { watched: true, at: Date.now() };
    setProgress(prog);
    toast('Aula marcada como concluída!', 'success');
    refreshStats();
    renderInicio();
    renderModuleGrid();
  };

  // ── Início ──
  function refreshStats() {
    const prog = getProgress();
    const watched = Object.keys(prog).filter((k) => prog[k].watched).length;
    const started = MODULES.filter((m) => state.videos.some((v) => v.module === m.name && prog[v.id])).length;
    document.getElementById('stWatched').textContent = watched;
    document.getElementById('stModules').textContent = started + '/' + MODULES.length;
    document.getElementById('stPoints').textContent = watched * 10 + started * 25;
    const streakKey = 'cs_streak';
    let streak = parseInt(localStorage.getItem(streakKey) || '0');
    const last = localStorage.getItem('cs_lastvisit');
    const today = new Date().toDateString();
    if (last !== today) {
      const yest = new Date(Date.now() - 864e5).toDateString();
      streak = last === yest ? streak + 1 : 1;
      localStorage.setItem(streakKey, String(streak));
      localStorage.setItem('cs_lastvisit', today);
    }
    document.getElementById('stStreak').textContent = streak;
  }

  function renderInicio() {
    const prog = getProgress();
    const watched = state.videos.filter((v) => prog[v.id]).slice(-5).reverse();
    const list = document.getElementById('continueList');
    if (!watched.length) {
      list.innerHTML = '<div class="empty-state" style="padding:30px 16px"><div class="es-icon">' + icon('play', 28) + '</div><b>Você ainda não assistiu nenhuma aula</b><span>Comece pela trilha de módulos!</span></div>' +
        '<button class="btn btn-primary btn-sm btn-block" onclick="go(\'modulos\')">Explorar módulos</button>';
      return;
    }
    list.innerHTML = watched.map((v, i) =>
      '<div class="lesson-item" style="cursor:pointer" onclick="openVideo(\'' + v.id + '\')">' +
      '<div class="l-thumb" style="width:60px;height:52px;border-radius:10px;font-size:24px;' + thumbCss(i) + '">' + icon('play', 22) + '</div>' +
      '<div style="min-width:0"><b>' + escapeHtml(v.title) + '</b><span>' + escapeHtml(v.module) + ' · ' + escapeHtml(v.duration) + '</span></div>' +
      '<div class="l-play" style="width:34px;height:34px;font-size:12px">' + icon('play', 14) + '</div></div>'
    ).join('');
  }

  function renderModuleGrid() {
    const prog = getProgress();
    document.getElementById('moduleProgressGrid').innerHTML = MODULES.map((m) => {
      const ls = state.videos.filter((v) => v.module === m.name);
      const d = ls.filter((l) => prog[l.id]).length;
      const pct = ls.length ? Math.round((d / ls.length) * 100) : 0;
      return '<div class="glass module-card" style="cursor:pointer" onclick="goModule(\'' + m.name + '\')">' +
        '<span class="mc-emoji">' + icon(m.icon, 28) + '</span><h4>' + m.name + '</h4>' +
        '<div class="mc-progress"><div class="progress" style="flex:1"><i style="width:' + pct + '%"></i></div><span>' + pct + '%</span></div>' +
        '</div>';
    }).join('');
  }

  // ── Exercícios / Quiz ──
  function diffDots(d) {
    const map = { Fácil: 1, Médio: 2, Difícil: 3 };
    const n = map[d] || 2;
    return '<i class="' + (n >= 1 ? 'on' : '') + '"></i><i class="' + (n >= 2 ? 'on' : '') + '"></i><i class="' + (n >= 3 ? 'on' : '') + '"></i>';
  }

  function renderExercises() {
    const grid = document.getElementById('exerciseGrid');
    if (!state.exercises.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="es-icon">' + icon('quiz', 28) + '</div><b>Nenhum simulado disponível ainda</b></div>';
      return;
    }
    grid.innerHTML = state.exercises.map((e) => {
      const qs = e.questions || [];
      return '<div class="glass exercise-card">' +
        '<div class="ec-head"><span class="ec-emoji">' + icon('quiz', 26) + '</span><span class="difficulty">' + diffDots(e.difficulty) + '</span></div>' +
        '<span class="chip" style="align-self:flex-start;font-size:11px;font-weight:800;padding:4px 10px;border-radius:99px;background:var(--accent-soft);color:var(--accent-2)">' + escapeHtml(e.module) + '</span>' +
        '<h4>' + escapeHtml(e.title) + '</h4>' +
        '<div class="meta"><span>' + qs.length + ' questões</span><span>' + escapeHtml(e.difficulty) + '</span></div>' +
        '<p style="font-size:13px;color:var(--text-dim);flex:1">Correção instantânea com explicação de cada resposta.</p>' +
        '<button class="btn btn-primary btn-sm" onclick="startQuiz(\'' + e.id + '\')">Iniciar simulado →</button></div>';
    }).join('');
  }

  window.startQuiz = function (id) {
    const e = state.exercises.find((x) => x.id === id);
    if (!e) return;
    state.quiz = e;
    state.quizIdx = 0;
    state.quizScore = 0;
    state.quizAnswered = false;
    renderQuizQuestion();
    openModal('quizModal');
  };

  function renderQuizQuestion() {
    const q = state.quiz.questions[state.quizIdx];
    const total = state.quiz.questions.length;
    const pct = (state.quizIdx / total) * 100;
    const letters = ['A', 'B', 'C', 'D'];
    document.getElementById('quizContent').innerHTML =
      '<div class="quiz-progress progress"><i style="width:' + pct + '%"></i></div>' +
      '<div class="quiz-count">Questão ' + (state.quizIdx + 1) + ' de ' + total + ' · ' + escapeHtml(state.quiz.title) + '</div>' +
      '<div class="quiz-q">' + escapeHtml(q.q) + '</div>' +
      '<div class="quiz-options">' +
      q.options.map((o, i) =>
        '<button class="quiz-option" onclick="answerQuiz(' + i + ')"><span class="q-letter">' + letters[i] + '</span>' + escapeHtml(o) + '</button>'
      ).join('') +
      '</div><div id="quizFeedback"></div>' +
      (state.quizIdx > 0 && !state.quizAnswered ? '<button class="btn btn-ghost" onclick="prevQuiz()" style="margin-right:10px">← Anterior</button>' : '') +
      '<button class="btn btn-ghost" onclick="closeModal(\'quizModal\')">Sair</button>';
  }

  window.answerQuiz = function (i) {
    if (state.quizAnswered) return;
    state.quizAnswered = true;
    const q = state.quiz.questions[state.quizIdx];
    const correct = i === q.correct;
    if (correct) state.quizScore++;
    const btns = document.querySelectorAll('.quiz-option');
    btns.forEach((b, idx) => {
      b.classList.add('disabled');
      if (idx === q.correct) b.classList.add('correct');
      else if (idx === i && !correct) b.classList.add('wrong');
    });
    document.getElementById('quizFeedback').innerHTML =
      '<div class="quiz-explain ' + (correct ? 'correct' : 'wrong') + '">' +
      '<b>' + (correct ? '¡Correcto!' : 'Não foi dessa vez.') + '</b> ' +
      escapeHtml(q.explain || '') + '</div>' +
      '<button class="btn btn-primary" onclick="nextQuiz()">' +
      (state.quizIdx + 1 >= state.quiz.questions.length ? 'Ver resultado' : 'Próxima questão →') + '</button>';
  };

  window.prevQuiz = function () {
    // evita re-responder a mesma questão e inflar a pontuação
    if (state.quizAnswered) return;
    if (state.quizIdx > 0) {
      state.quizIdx--;
      renderQuizQuestion();
    }
  };

  window.nextQuiz = function () {
    if (state.quizIdx + 1 >= state.quiz.questions.length) return showQuizResult();
    state.quizIdx++;
    state.quizAnswered = false;
    renderQuizQuestion();
  };

  function showQuizResult() {
    const total = state.quiz.questions.length;
    const pct = Math.round((state.quizScore / total) * 100);
    const C = 2 * Math.PI * 62;
    const msg = pct >= 80 ? ['¡Fenomenal!', 'Você domina este módulo. Siga assim!'] :
                pct >= 50 ? ['¡Muy bien!', 'Bom resultado! Revise os pontos que errou.'] :
                ['¡Ánimo!', 'Continue praticando — cada erro é um aprendizado.'];
    document.getElementById('quizContent').innerHTML =
      '<div style="text-align:center">' +
      '<div class="result-ring"><svg viewBox="0 0 150 150">' +
      '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--accent-2)"/></linearGradient></defs>' +
      '<circle class="ring-bg" cx="75" cy="75" r="62"/>' +
      '<circle class="ring-fg" cx="75" cy="75" r="62" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '" id="ringFg"/>' +
      '</svg><div class="ring-num">' + pct + '%</div></div>' +
      '<div class="result-msg"><b>' + msg[0] + '</b><span>' + msg[1] + '<br>' + state.quizScore + ' de ' + total + ' acertos</span></div>' +
      '<button class="btn btn-primary" onclick="closeModal(\'quizModal\')">Fechar</button>' +
      '<button class="btn btn-ghost" style="margin-left:10px" onclick="startQuiz(\'' + state.quiz.id + '\')">Tentar novamente</button>' +
      '</div>';
    requestAnimationFrame(() => {
      const fg = document.getElementById('ringFg');
      if (fg) setTimeout(() => { fg.style.strokeDashoffset = C * (1 - pct / 100); }, 60);
    });
    // pontos
    const pKey = 'cs_quiz_scores';
    try {
      const scores = JSON.parse(localStorage.getItem(pKey)) || {};
      scores[state.quiz.id] = Math.max(scores[state.quiz.id] || 0, pct);
      localStorage.setItem(pKey, JSON.stringify(scores));
    } catch (e) { /* ignore */ }
  }

  // ── Chat (entre alunos) ──
  // Cada conversa usa uma chave determinística de dupla: os dois usernames
  // em ordem alfabética unidos por "__" (ex.: ana__carlos). Assim, os dois
  // alunos veem SEMPRE o mesmo canal e a conversa nunca se divide.
  function channelKey(other) {
    return [me.username, other].sort().join('__');
  }

  function chatDisplayName(ch) {
    const parts = String(ch).split('__');
    if (parts.length === 2) return parts[0] === me.username ? parts[1] : parts[0];
    return ch; // canais antigos/legados sem chave de dupla
  }

  function buildChannels() {
    const names = new Set();
    state.messages.forEach((m) => names.add(m.channel));
    // mantém as conversas iniciadas localmente que ainda não têm mensagens,
    // para o colega não "sumir" antes do primeiro envio (polling 3s)
    state.pendingChannels.forEach((ch) => names.add(ch));
    state.channels = Array.from(names).sort();
    if (!state.channels.includes(state.activeChannel)) {
      state.activeChannel = state.channels.length ? state.channels[0] : null;
    }
  }

  function renderChannels() {
    const lastMsg = {};
    state.messages.forEach((m) => { lastMsg[m.channel] = m; });
    const el = document.getElementById('channelList');
    el.innerHTML = state.channels.map((ch) => {
      const disp = chatDisplayName(ch);
      const last = lastMsg[ch];
      const initials = disp.split(/[\s_.]/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      return '<button class="channel-item' + (state.activeChannel === ch ? ' active' : '') + '" data-channel="' + escapeHtml(ch) + '" onclick="selectChannel(this.dataset.channel)">' +
        '<div class="c-avatar" style="background:linear-gradient(135deg,#38bdf8,#8b5cf6)">' + escapeHtml(initials) + '</div>' +
        '<div class="c-body"><div class="c-name">' + escapeHtml(disp) + '</div>' +
        '<div class="c-last">' + (last ? escapeHtml(last.body.slice(0, 40)) : 'Nenhuma mensagem') + '</div></div>' +
        '<div class="c-time">' + (last ? timeAgo(last.createdAt) : '') + '</div></button>';
    }).join('') || '<div class="empty-state" style="padding:30px 12px"><b>Sem conversas ainda</b><span>Clique em "Nova conversa" e chame um colega!</span></div>';
  }

  function renderChatBody() {
    const body = document.getElementById('chatBody');
    const avatar = document.getElementById('chatAvatar');
    const title = document.getElementById('chatTitle');
    if (!state.activeChannel) {
      avatar.innerHTML = icon('chat', 18);
      avatar.style.background = '';
      title.textContent = 'Conversas';
      body.innerHTML = '<div class="empty-state"><div class="es-icon">' + icon('chat', 28) + '</div><b>Nenhuma conversa selecionada</b><span>Escolha uma conversa ou clique em "Nova conversa" para falar com um colega.</span></div>';
      return;
    }
    const disp = chatDisplayName(state.activeChannel);
    const msgs = state.messages.filter((m) => m.channel === state.activeChannel);
    avatar.textContent = disp.split(/[\s_.]/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    avatar.style.background = 'linear-gradient(135deg,#38bdf8,#8b5cf6)';
    title.textContent = disp;

    let lastDay = '';
    body.innerHTML = msgs.map((m) => {
      const day = new Date(m.createdAt).toDateString();
      const dayLabel = new Date(m.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
      let html = '';
      if (day !== lastDay) html += '<div class="chat-day">' + dayLabel + '</div>';
      lastDay = day;
      const mine = m.sender === me.username;
      const time = new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const cls = mine ? 'bubble me' : 'bubble them';
      const name = mine ? '' : '<div class="b-name">' + escapeHtml(m.sender) + '</div>';
      return html + '<div class="' + cls + '">' + name + escapeHtml(m.body) + '<div class="b-meta">' + time + (mine ? ' ✓✓' : '') + '</div></div>';
    }).join('') || '<div class="empty-state"><div class="es-icon">' + icon('chat', 28) + '</div><b>Inicie a conversa!</b><span>Mande a primeira mensagem.</span></div>';
    body.scrollTop = body.scrollHeight;
  }

  window.selectChannel = function (ch) {
    state.activeChannel = ch;
    renderChannels();
    renderChatBody();
    if (window.innerWidth <= 1080) document.getElementById('chatList').classList.remove('mobile-open');
  };

  window.chatSearch = function (q) {
    const t = (q || '').toLowerCase();
    document.querySelectorAll('.channel-item').forEach((it) => {
      it.style.display = it.textContent.toLowerCase().includes(t) ? '' : 'none';
    });
  };

  // abre uma conversa nova com outro aluno
  window.openNewChat = async function () {
    try {
      const students = await req.get('/api/students');
      const el = document.getElementById('studentList');
      el.innerHTML = students.map((s) =>
        '<div class="lesson-item" style="cursor:pointer" onclick="startChatWith(\'' + escapeHtml(s.username) + '\')">' +
        avatarHtml(s) +
        '<div style="min-width:0"><b>' + escapeHtml(s.username) + '</b><span>Aluno</span></div>' +
        '<div class="l-play" style="width:34px;height:34px;font-size:12px">' + icon('chat', 14) + '</div></div>'
      ).join('') || '<div class="empty-state"><div class="es-icon">' + icon('users', 28) + '</div><b>Nenhum outro aluno cadastrado ainda</b><span>Quando houver mais alunos, você poderá conversar com eles aqui.</span></div>';
      openModal('newChatModal');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  window.startChatWith = function (username) {
    const key = channelKey(username);
    // canal novo (sem mensagens no servidor) vira uma conversa pendente local
    if (!state.messages.some((m) => m.channel === key) && !state.pendingChannels.includes(key)) {
      state.pendingChannels.push(key);
      savePendingChannels();
    }
    state.activeChannel = key;
    closeModal('newChatModal');
    renderChannels();
    renderChatBody();
  };

  async function sendMessage() {
    const input = document.getElementById('chatInput');
    const body = input.value.trim();
    if (!body) return;
    if (!state.activeChannel) { toast('Escolha ou crie uma conversa primeiro.', 'info'); return; }
    input.value = '';
    const btn = document.getElementById('chatSendBtn');
    btn.disabled = true;
    const channel = state.activeChannel;
    // otimista
    state.messages.push({ channel, sender: me.username, senderRole: 'aluno', body, createdAt: new Date().toISOString() });
    renderChatBody();
    try {
      await req.post('/api/messages', { channel, body });
      await refreshMessages();
    } catch (err) {
      toast(err.message, 'error');
      refreshMessages();
    } finally {
      btn.disabled = false;
    }
  }
  window.sendMessage = sendMessage;

  async function refreshMessages() {
    try {
      const msgs = await req.get('/api/messages');
      state.messages = msgs;
      // conversa pendente que já tem mensagem no servidor vira canal real
      const before = state.pendingChannels.length;
      state.pendingChannels = state.pendingChannels.filter((ch) => !msgs.some((m) => m.channel === ch));
      if (state.pendingChannels.length !== before) savePendingChannels();
      buildChannels();
      renderChannels();
      renderChatBody();
    } catch (e) { /* ignore */ }
  }

  function startChatPolling() {
    window._chatPolling = true;
    setInterval(refreshMessages, 3000);
  }

  // ── Perfil ──
  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await req.patch('/api/auth/profile', { username: document.getElementById('profUsername').value.trim() });
      API.user = data.user;
      me.username = data.user.username;
      toast('Perfil atualizado com sucesso!', 'success');
      renderHeader();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  window.uploadAvatar = function (input) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Envie um arquivo de imagem.', 'error'); return; }
    if (file.size > 700 * 1024) { toast('Imagem muito grande (máx. 700KB).', 'error'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = await req.patch('/api/auth/profile', { avatar: reader.result });
        API.user = data.user;
        me.avatar = data.user.avatar;
        toast('Foto de perfil atualizada!', 'success');
        renderHeader();
      } catch (err) {
        toast(err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  window.doLogout = function () {
    API.logout();
    try { localStorage.removeItem(PENDING_KEY); } catch (e) { /* ignore */ }
    // volta para a seção de boas-vindas (hero da landing)
    window.location.href = '/index.html#inicio';
  };

  // ── Init ──
  async function init() {
    renderHeader();
    buildModuleSubnav();
    try {
      const [videos, exercises, messages] = await Promise.all([
        req.get('/api/videos'), req.get('/api/exercises'), req.get('/api/messages'),
      ]);
      state.videos = videos;
      state.exercises = exercises;
      state.messages = messages;
      document.getElementById('videoCount').textContent = videos.length;
      document.getElementById('exCount').textContent = exercises.length;
      renderVideoFilters();
      renderVideos();
      renderExercises();
      renderModuleGrid();
      renderInicio();
      buildChannels();
      renderChannels();
      renderChatBody();
      if (document.getElementById('view-chat').classList.contains('active')) startChatPolling();
      // módulos: se veio de um link com módulo, abre direto; senão fica na Início
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('modulo');
      if (mod && MODULES.some((m) => m.name === mod)) {
        goModule(mod);
      } else {
        go('inicio'); // garante título/estado corretos na visão inicial
      }
    } catch (err) {
      if (err.status === 401) {
        API.logout();
        window.location.href = '/index.html';
        return;
      }
      toast('Erro ao carregar dados: ' + err.message, 'error');
    }
    refreshStats();
  }

  init();
})();
