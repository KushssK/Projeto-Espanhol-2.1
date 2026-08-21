// ═══════════ Painel Administrativo ═══════════
(function () {
  if (!API.token || !API.user) {
    window.location.href = '/index.html';
    return;
  }
  const me = API.user;
  const MODULES = ['Conversação', 'Cultura Hispânica', 'Dicas de Aprendizagem', 'Expressões e Girias do Cotidiano', 'Gramática', 'Leitura e Compreensão de Texto', 'Pronúncia', 'Vocabulário', 'Geral'];

  const state = {
    users: [], videos: [], exercises: [], whitelist: [], stats: null,
    videoQuery: '', userQuery: '',
    confirmAction: null,
  };

  const titles = {
    visao: ['Visão Geral', 'Painel administrativo · resumo da plataforma'],
    usuarios: ['Gestão de Usuários', 'Controle total das contas de alunos'],
    whitelist: ['Whitelist de Admins', 'Controle de liberação de novos administradores'],
    videos: ['Gestão de Videoaulas', 'Adicione, edite ou remova conteúdo'],
    simulados: ['Gestão de Simulados', 'Crie provas com correção automática'],
    tema: ['Configuração de Cores', 'Personalize a identidade visual em tempo real'],
    perfilAdmin: ['Meu Perfil', 'Dados do administrador'],
  };

  window.go = function (view) {
    document.querySelectorAll('.nav-item[data-view]').forEach((n) => n.classList.toggle('active', n.dataset.view === view));
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    const el = document.getElementById('view-' + view);
    if (el) el.classList.add('active');
    document.getElementById('pageTitle').textContent = titles[view][0];
    document.getElementById('pageBreadcrumb').textContent = titles[view][1];
    document.getElementById('sidebar').classList.remove('open');
    window.scrollTo({ top: 0 });
  };

  function renderHeader() {
    document.getElementById('sidebarAvatar').innerHTML = avatarHtml(me, '');
    document.getElementById('topAvatar').innerHTML = avatarHtml(me);
    document.getElementById('welcomeAvatar').innerHTML = avatarHtml(me, '');
    document.getElementById('welcomeName').textContent = me.username;
    document.getElementById('sidebarName').textContent = me.username;
    document.getElementById('profileAvatar').innerHTML = avatarHtml(me, 'lg');
    document.getElementById('profileName').textContent = me.username;
    document.getElementById('profileEmail').textContent = me.email;
    document.getElementById('profileEmail').value = me.email;
    document.getElementById('apUsername').value = me.username;
    document.getElementById('apEmail').value = me.email;
    document.getElementById('apCpf').value = me.cpf || '—';
  }

  // ── Visão geral ──
  function handleApiError(e) {
    if (e.status === 401) {
      API.logout();
      window.location.href = '/index.html';
      return true;
    }
    toast(e.message, 'error');
    return false;
  }

  async function loadStats() {
    try {
      const s = await req.get('/api/admin/stats');
      state.stats = s;
      document.getElementById('stUsers').textContent = s.users;
      document.getElementById('stVideos').textContent = s.videos;
      document.getElementById('stExercises').textContent = s.exercises;
      document.getElementById('stMessages').textContent = s.messages;
      document.getElementById('navUsers').textContent = s.users;
      document.getElementById('navWhite').textContent = s.whitelist;
      document.getElementById('navVideos').textContent = s.videos;
      document.getElementById('navEx').textContent = s.exercises;
      document.getElementById('recentUsersTable').innerHTML =
        '<thead><tr><th>Aluno</th><th>E-mail</th><th>Cadastro</th></tr></thead><tbody>' +
        (s.recentUsers.map((u) =>
          '<tr><td><div class="tbl-user">' + avatarHtml(u) + '<div><b>' + escapeHtml(u.username) + '</b></div></div></td>' +
          '<td>' + escapeHtml(u.email) + '</td><td>' + formatDate(u.createdAt) + '</td></tr>'
        ).join('') || '<tr><td colspan="3"><div class="empty-state" style="padding:24px"><b>Sem alunos ainda</b></div></td></tr>') +
        '</tbody>';
    } catch (e) {
      handleApiError(e);
    }
  }

  // ── Usuários ──
  async function loadUsers() {
    try {
      state.users = await req.get('/api/admin/users');
      renderUsers();
    } catch (e) { handleApiError(e); }
  }

  window.userSearch = function (q) {
    state.userQuery = q;
    renderUsers();
  };

  function formatDob(dob) {
    if (!dob) return '—';
    const [y, m, d] = String(dob).slice(0, 10).split('-');
    return y && m && d ? d + '/' + m + '/' + y : dob;
  }

  function renderUsers() {
    const q = (state.userQuery || '').toLowerCase();
    const list = state.users.filter((u) => (u.username + ' ' + u.email).toLowerCase().includes(q));
    document.getElementById('usersTable').innerHTML =
      '<thead><tr><th>Aluno</th><th>E-mail</th><th>Nascimento</th><th>Cadastro</th><th>Ações</th></tr></thead><tbody>' +
      (list.map((u) =>
        '<tr><td><div class="tbl-user">' + avatarHtml(u) + '<div><b>' + escapeHtml(u.username) + '</b><span>Aluno</span></div></div></td>' +
        '<td>' + escapeHtml(u.email) + '</td>' +
        '<td>' + formatDob(u.dob) + '</td>' +
        '<td>' + formatDate(u.createdAt) + '</td>' +
        '<td><button class="btn btn-danger btn-sm" onclick="askDeleteUser(\'' + u.id + '\',\'' + u.username + '\')">Excluir</button></td></tr>'
      ).join('') || '<tr><td colspan="5"><div class="empty-state" style="padding:24px"><b>Nenhum aluno encontrado</b></div></td></tr>') +
      '</tbody>';
  }

  window.askDeleteUser = function (id, name) {
    openConfirm('Excluir aluno', 'Remover a conta de <b>' + escapeHtml(name) + '</b>? Esta ação não pode ser desfeita.', async () => {
      await req.del('/api/admin/users/' + id);
      toast('Aluno removido.', 'success');
      loadUsers(); loadStats();
    });
  };

  // ── Whitelist ──
  async function loadWhitelist() {
    try {
      state.whitelist = await req.get('/api/admin/whitelist');
      document.getElementById('whiteCount').textContent = state.whitelist.length;
      document.getElementById('navWhite').textContent = state.whitelist.length;
      document.getElementById('whiteList').innerHTML =
        state.whitelist.map((w) =>
          '<div class="lesson-item" style="padding:11px 14px;cursor:default">' +
          '<div class="l-thumb" style="width:40px;height:40px;border-radius:12px;font-size:18px;background:var(--accent-soft)">' + icon('key', 18) + '</div>' +
          '<div style="min-width:0;flex:1"><b>' + escapeHtml(w.email) + '</b><span>Liberado em ' + formatDate(w.createdAt) + '</span></div>' +
          '<button class="btn btn-danger btn-sm" onclick="askRemoveWhite(\'' + w.id + '\',\'' + w.email + '\')">Remover</button></div>'
        ).join('') || '<div class="empty-state"><div class="es-icon">' + icon('lock', 26) + '</div><b>Nenhum e-mail liberado ainda</b></div>';
    } catch (e) { handleApiError(e); }
  }

  document.getElementById('whiteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById('whiteEmail').value.trim();
      await req.post('/api/admin/whitelist', { email });
      document.getElementById('whiteEmail').value = '';
      toast('E-mail liberado! Agora o admin já pode se cadastrar.', 'success');
      loadWhitelist(); loadStats();
    } catch (err) { toast(err.message, 'error'); }
  });

  window.askRemoveWhite = function (id, email) {
    openConfirm('Remover da whitelist', 'Revogar o acesso de <b>' + escapeHtml(email) + '</b>?', async () => {
      await req.del('/api/admin/whitelist/' + id);
      toast('E-mail removido da whitelist.', 'info');
      loadWhitelist(); loadStats();
    });
  };

  // ── Vídeos ──
  async function loadVideos() {
    try {
      state.videos = await req.get('/api/videos');
      document.getElementById('navVideos').textContent = state.videos.length;
      renderVideos();
    } catch (e) { handleApiError(e); }
  }

  window.adminVideoSearch = function (q) {
    state.videoQuery = q;
    renderVideos();
  };

  function renderVideos() {
    const q = (state.videoQuery || '').toLowerCase();
    const list = state.videos.filter((v) => (v.title + ' ' + v.module).toLowerCase().includes(q));
    const el = document.getElementById('adminVideoList');
    if (!list.length) {
      el.innerHTML = '<div class="empty-state"><div class="es-icon">' + icon('play', 26) + '</div><b>Nenhuma videoaula</b><span>Clique em "Nova videoaula" para começar.</span></div>';
      return;
    }
    el.innerHTML = list.map((v, i) =>
      '<div class="lesson-item" style="cursor:default">' +
      '<div class="l-thumb" style="' + thumbCss(i) + '">' + icon('play', 22) + '</div>' +
      '<div style="min-width:0;flex:1"><b>' + escapeHtml(v.title) + '</b><span>' + escapeHtml(v.module) + ' · ' + escapeHtml(v.duration) + ' · ' + escapeHtml((v.url || '').slice(0, 46)) + '…</span></div>' +
      '<button class="btn btn-ghost btn-sm" onclick="openVideoForm(\'' + v.id + '\')">' + icon('edit', 14) + ' Editar</button>' +
      '<button class="btn btn-danger btn-sm" onclick="askDeleteVideo(\'' + v.id + '\')">' + icon('trash', 14) + '</button></div>'
    ).join('');
  }

  function thumbCss(i) {
    return 'background:' + gradThumb(i).background.replace(/\n/g, ' ');
  }

  // ── Helper YouTube ──
  function ytThumb(url) {
    const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
    return m ? 'https://img.youtube.com/vi/' + m[1] + '/mqdefault.jpg' : '';
  }

  window.openVideoForm = function (id) {
    const v = id ? state.videos.find((x) => x.id === id) : null;
    document.getElementById('videoFormTitle').textContent = v ? 'Editar aula' : 'Nova aula';
    document.getElementById('vfId').value = v ? v.id : '';
    document.getElementById('vfTitle').value = v ? v.title : '';
    document.getElementById('vfModule').value = v ? v.module : 'Conversação';
    document.getElementById('vfDuration').value = v ? (v.duration || '') : '';
    document.getElementById('vfDesc').value = v ? (v.description || '') : '';
    document.getElementById('vfUrl').value = v ? (v.url || '') : '';
    openModal('videoFormModal');
  };

  document.getElementById('videoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('vfUrl').value.trim();
    if (!url) {
      toast('Cole o link do YouTube do vídeo.', 'error');
      return;
    }
    const payload = {
      title: document.getElementById('vfTitle').value.trim(),
      module: document.getElementById('vfModule').value,
      url: url,
      duration: document.getElementById('vfDuration').value.trim() || '00:00',
      description: document.getElementById('vfDesc').value.trim(),
    };
    const id = document.getElementById('vfId').value;
    try {
      if (id) await req.put('/api/admin/videos/' + id, payload);
      else await req.post('/api/admin/videos', payload);
      toast(id ? 'Aula atualizada!' : 'Aula publicada!', 'success');
      closeModal('videoFormModal');
      e.target.reset();
      loadVideos(); loadStats();
    } catch (err) { toast(err.message, 'error'); }
  });

  window.askDeleteVideo = function (id) {
    const v = state.videos.find((x) => x.id === id);
    const title = v ? v.title : 'esta videoaula';
    openConfirm('Excluir videoaula', 'Remover <b>' + escapeHtml(title) + '</b> da biblioteca?', async () => {
      await req.del('/api/admin/videos/' + id);
      toast('Videoaula removida.', 'info');
      loadVideos(); loadStats();
    });
  };

  // ── Simulados ──
  async function loadExercises() {
    try {
      state.exercises = await req.get('/api/exercises');
      document.getElementById('navEx').textContent = state.exercises.length;
      renderExercises();
    } catch (e) { handleApiError(e); }
  }

  function renderExercises() {
    const el = document.getElementById('adminExerciseList');
    if (!state.exercises.length) {
      el.innerHTML = '<div class="empty-state"><div class="es-icon">' + icon('quiz', 26) + '</div><b>Nenhum simulado</b><span>Clique em "Novo simulado" para criar o primeiro.</span></div>';
      return;
    }
    el.innerHTML = state.exercises.map((x) =>
      '<div class="lesson-item" style="cursor:default">' +
      '<div class="l-thumb" style="width:52px;height:52px;border-radius:14px;font-size:24px;background:var(--accent-soft)">' + icon('quiz', 22) + '</div>' +
      '<div style="min-width:0;flex:1"><b>' + escapeHtml(x.title) + '</b><span>' + escapeHtml(x.module) + ' · ' + escapeHtml(x.difficulty) + ' · ' + (x.questions || []).length + ' questões</span></div>' +
      '<button class="btn btn-ghost btn-sm" onclick="openExerciseForm(\'' + x.id + '\')">' + icon('edit', 14) + ' Editar</button>' +
      '<button class="btn btn-danger btn-sm" onclick="askDeleteExercise(\'' + x.id + '\')">' + icon('trash', 14) + '</button></div>'
    ).join('');
  }

  function questionRow(q = {}) {
    const opts = q.options || ['', '', '', ''];
    const correct = q.correct == null ? 0 : q.correct;
    const letters = ['A', 'B', 'C', 'D'];
    return '<div class="glass" style="padding:14px;margin-bottom:12px;border-radius:14px">' +
      '<div class="field"><label>Pergunta</label><input class="q-text" value="' + escapeHtml(q.q || '') + '" placeholder="Ex.: Completa: Yo ___ brasileño."></div>' +
      opts.map((o, i) =>
        '<div class="field" style="margin-bottom:10px"><label>Opção ' + letters[i] +
        ' <label class="checkline" style="margin:0;display:inline-flex;margin-left:10px"><input type="radio" name="correct-' + (q._key || Math.random()) + '" class="q-correct" value="' + i + '"' + (i === correct ? ' checked' : '') + '> correta</label></label>' +
        '<input class="q-opt" value="' + escapeHtml(o) + '"></div>'
      ).join('') +
      '<div class="field"><label>Explicação (aparece após responder)</label><input class="q-explain" value="' + escapeHtml(q.explain || '') + '" placeholder="Ex.: Ser expressa identidade..."></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" style="margin-top:4px" onclick="this.closest(\'.glass\').remove()">' + icon('trash', 14) + ' Remover questão</button></div>';
  }

  window.addQuestionRow = function () {
    document.getElementById('questionRows').insertAdjacentHTML('beforeend', questionRow());
  };

  window.openExerciseForm = function (id) {
    const x = id ? state.exercises.find((e) => e.id === id) : null;
    document.getElementById('exerciseFormTitle').textContent = x ? 'Editar simulado' : 'Novo simulado';
    document.getElementById('efId').value = x ? x.id : '';
    document.getElementById('efTitle').value = x ? x.title : '';
    document.getElementById('efModule').value = x ? x.module : 'Geral';
    document.getElementById('efDifficulty').value = x ? x.difficulty : 'Médio';
    const rows = document.getElementById('questionRows');
    rows.innerHTML = '';
    if (x && x.questions && x.questions.length) {
      x.questions.forEach((q) => rows.insertAdjacentHTML('beforeend', questionRow(q)));
    } else {
      rows.innerHTML = questionRow() + questionRow() + questionRow();
    }
    openModal('exerciseFormModal');
  };

  document.getElementById('exerciseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const rows = document.querySelectorAll('#questionRows .glass');
    const questions = Array.from(rows).map((row) => {
      const opts = Array.from(row.querySelectorAll('.q-opt')).map((o) => o.value.trim());
      const correct = Array.from(row.querySelectorAll('.q-correct')).findIndex((r) => r.checked);
      return {
        q: row.querySelector('.q-text').value.trim(),
        options: opts,
        correct: correct >= 0 ? correct : 0,
        explain: row.querySelector('.q-explain').value.trim(),
      };
    }).filter((q) => q.q);
    const payload = {
      title: document.getElementById('efTitle').value.trim(),
      module: document.getElementById('efModule').value,
      difficulty: document.getElementById('efDifficulty').value,
      questions,
    };
    const id = document.getElementById('efId').value;
    if (!questions.length) { toast('Adicione ao menos uma questão completa.', 'error'); return; }
    try {
      if (id) await req.put('/api/admin/exercises/' + id, payload);
      else await req.post('/api/admin/exercises', payload);
      toast(id ? 'Simulado atualizado!' : 'Simulado criado!', 'success');
      closeModal('exerciseFormModal');
      e.target.reset();
      loadExercises(); loadStats();
    } catch (err) { toast(err.message, 'error'); }
  });

  window.askDeleteExercise = function (id) {
    const x = state.exercises.find((e) => e.id === id);
    const title = x ? x.title : 'este simulado';
    openConfirm('Excluir simulado', 'Remover <b>' + escapeHtml(title) + '</b>?', async () => {
      await req.del('/api/admin/exercises/' + id);
      toast('Simulado removido.', 'info');
      loadExercises(); loadStats();
    });
  };

  // ── Confirm dialog ──
  function openConfirm(title, text, fn) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmText').innerHTML = text;
    state.confirmAction = fn;
    openModal('confirmModal');
  }
  window.openConfirm = openConfirm;
  window.confirmAction = async function () {
    try {
      await state.confirmAction();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      state.confirmAction = null;
      closeModal('confirmModal');
    }
  };

  // ── Tema ──
  function currentTheme() {
    return {
      bgDeep: document.getElementById('tBgDeep').value,
      bgGrad1: document.getElementById('tBgGrad1').value,
      bgGrad2: document.getElementById('tBgGrad2').value,
      accent: document.getElementById('tAccent').value,
      accent2: document.getElementById('tAccent2').value,
      glassOpacity: Number(document.getElementById('tOpacity').value) / 100,
      glassBlur: Number(document.getElementById('tBlur').value),
    };
  }

  window.liveTheme = function () {
    const t = currentTheme();
    document.getElementById('tBgDeepHex').textContent = t.bgDeep;
    document.getElementById('tBgGrad1Hex').textContent = t.bgGrad1;
    document.getElementById('tBgGrad2Hex').textContent = t.bgGrad2;
    document.getElementById('tAccentHex').textContent = t.accent;
    document.getElementById('tAccent2Hex').textContent = t.accent2;
    applyTheme(t);
  };

  function setControls(t) {
    document.getElementById('tBgDeep').value = t.bgDeep;
    document.getElementById('tBgGrad1').value = t.bgGrad1;
    document.getElementById('tBgGrad2').value = t.bgGrad2;
    document.getElementById('tAccent').value = t.accent;
    document.getElementById('tAccent2').value = t.accent2;
    document.getElementById('tOpacity').value = Math.round((t.glassOpacity || 0.07) * 100);
    document.getElementById('tBlur').value = t.glassBlur || 18;
    liveTheme();
  }

  window.saveTheme = async function () {
    try {
      await req.post('/api/admin/theme', currentTheme());
      toast('Tema salvo! A nova paleta já está valendo para todos os alunos.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  window.resetTheme = function () {
    setControls(DEFAULT_THEME);
    toast('Tema restaurado ao padrão. Clique em "Salvar" para aplicar a todos.', 'info');
  };

  // ── Perfil admin ──
  document.getElementById('adminProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await req.patch('/api/auth/admin/profile', { username: document.getElementById('apUsername').value.trim() });
      API.user = data.user;
      me.username = data.user.username;
      toast('Perfil atualizado!', 'success');
      renderHeader();
    } catch (err) { toast(err.message, 'error'); }
  });

  window.uploadAdminAvatar = function (input) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Envie um arquivo de imagem.', 'error'); return; }
    if (file.size > 700 * 1024) { toast('Imagem muito grande (máx. 700KB).', 'error'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = await req.patch('/api/auth/admin/profile', { avatar: reader.result });
        API.user = data.user;
        me.avatar = data.user.avatar;
        toast('Foto atualizada!', 'success');
        renderHeader();
      } catch (err) { toast(err.message, 'error'); }
    };
    reader.readAsDataURL(file);
  };

  window.doLogout = function () {
    API.logout();
    // volta para a seção de boas-vindas (hero da landing)
    window.location.href = '/index.html#inicio';
  };

  // ── Init ──
  async function init() {
    renderHeader();
    try {
      const theme = await req.get('/api/admin/theme');
      if (theme && Object.keys(theme).length) setControls(theme);
      else setControls(DEFAULT_THEME);
    } catch (e) {
      setControls(DEFAULT_THEME);
    }
    // cada load trata seus próprios erros (401 → logout/redirect via handleApiError)
    await Promise.all([loadStats(), loadUsers(), loadVideos(), loadExercises(), loadWhitelist()]);
  }

  init();
})();
