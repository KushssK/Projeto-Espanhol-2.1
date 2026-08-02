// Landing page — autenticação (login / cadastro / admin)
(function () {
  const authModal = document.getElementById('authModal');
  const titleEl = document.getElementById('authTitle');
  let currentTab = 'login';

  // navbar esconde ao rolar para baixo
  const navbar = document.getElementById('navbar');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > lastY && y > 160) navbar.classList.add('hidden');
    else navbar.classList.remove('hidden');
    lastY = y;
  });

  function renderTitle() {
    const titles = {
      login: ['<h3>Bem-vindo(a) de volta! 👋</h3><p class="modal-sub">Entre para continuar sua jornada no espanhol.</p>'],
      register: ['<h3>Crie sua conta gratuita 🚀</h3><p class="modal-sub">Acesso total a videoaulas, simulados, exercícios e conversa com outros alunos. Sem cartão, sem barreiras.</p>'],
      admin: ['<h3>Painel administrativo 🛡️</h3><p class="modal-sub">Área exclusiva para gestão da plataforma.</p>'],
    };
    titleEl.innerHTML = titles[currentTab][0];
  }

  function switchTab(tab) {
    currentTab = tab === 'admin' ? 'admin' : tab;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    const tabMap = { login: 'tab-login', register: 'tab-register' };
    if (currentTab !== 'admin') document.getElementById(tabMap[currentTab]).classList.add('active');
    document.getElementById('loginForm').style.display = currentTab === 'login' ? '' : 'none';
    document.getElementById('registerForm').style.display = currentTab === 'register' ? '' : 'none';
    document.getElementById('adminForm').style.display = currentTab === 'admin' ? '' : 'none';
    document.getElementById('adminLoginForm').style.display = 'none';
    renderTitle();
  }

  // alterna entre entrar / cadastrar na área admin
  window.switchAdminPane = function (mode) {
    switchTab('admin');
    document.getElementById('adminForm').style.display = mode === 'register' ? '' : 'none';
    document.getElementById('adminLoginForm').style.display = mode === 'login' ? '' : 'none';
    renderTitle();
  };

  window.openAuth = function (tab) {
    switchTab(tab || 'login');
    authModal.classList.add('open');
  };
  window.closeAuth = function () { authModal.classList.remove('open'); };
  window.switchTab = switchTab;

  window.openAdminAuth = function () {
    switchTab('admin');
    authModal.classList.add('open');
  };

  window.openReset = function () {
    closeAuth();
    openModal('resetModal');
  };

  // ─── PWA: instalar o app (acesso offline) ───
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const chip = document.getElementById('installChip');
    if (chip) chip.style.display = '';
  });

  // esconde o botão se o app já estiver instalado (rodando standalone)
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    const chip = document.getElementById('installChip');
    if (chip) chip.style.display = 'none';
  }

  window.installPwa = async function () {
    if (!deferredPrompt) {
      toast('Para instalar, use o menu do navegador: ⋮ → "Instalar aplicativo".', 'info');
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    const chip = document.getElementById('installChip');
    if (chip) chip.style.display = 'none';
    toast('App instalado! Agora é só abrir sem internet. 📱', 'success');
  };

  window.maskCpf = function (el) {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    let out = v;
    if (v.length > 9) out = v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6, 9) + '-' + v.slice(9);
    else if (v.length > 6) out = v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6);
    else if (v.length > 3) out = v.slice(0, 3) + '.' + v.slice(3);
    el.value = out;
  };

  // ─── Login aluno (com fallback automático para admin) ───
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.disabled = true; btn.textContent = 'Entrando…';
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
      const data = await req.post('/api/auth/login', { email, password });
      API.token = data.token;
      API.user = data.user;
      toast('Bem-vindo(a), ' + data.user.username + '! 🎉', 'success');
      setTimeout(() => { window.location.href = '/dashboard.html'; }, 450);
    } catch (err) {
      // se não for aluno, tenta o painel administrativo
      try {
        const admin = await req.post('/api/auth/admin/login', { email, password });
        API.token = admin.token;
        admin.user.role = 'admin';
        API.user = admin.user;
        toast('Bem-vindo ao painel, ' + admin.user.username + '! 🛡️', 'success');
        setTimeout(() => { window.location.href = '/admin.html'; }, 450);
        return;
      } catch (adminErr) {
        toast(err.message, 'error');
        btn.disabled = false; btn.textContent = 'Entrar agora';
      }
    }
  });

  // ─── Login admin (pane próprio) ───
  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('admLoginBtn');
    btn.disabled = true; btn.textContent = 'Entrando no painel…';
    try {
      const data = await req.post('/api/auth/admin/login', {
        email: document.getElementById('admLoginEmail').value.trim(),
        password: document.getElementById('admLoginPassword').value,
      });
      API.token = data.token;
      data.user.role = 'admin';
      API.user = data.user;
      toast('Bem-vindo ao painel, ' + data.user.username + '! 🛡️', 'success');
      setTimeout(() => { window.location.href = '/admin.html'; }, 450);
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Entrar no painel';
    }
  });

  // ─── Cadastro aluno ───
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('regBtn');
    btn.disabled = true; btn.textContent = 'Criando conta…';
    try {
      const data = await req.post('/api/auth/register', {
        username: document.getElementById('regUsername').value.trim(),
        dob: document.getElementById('regDob').value,
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value,
      });
      API.token = data.token;
      API.user = data.user;
      toast('Conta criada! Boa jornada, ' + data.user.username + ' 🎉', 'success');
      setTimeout(() => { window.location.href = '/dashboard.html'; }, 450);
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Criar minha conta grátis';
    }
  });

  // ─── Cadastro admin ───
  document.getElementById('adminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('admBtn');
    btn.disabled = true; btn.textContent = 'Verificando whitelist…';
    try {
      const data = await req.post('/api/auth/admin/register', {
        username: document.getElementById('admUsername').value.trim(),
        email: document.getElementById('admEmail').value.trim(),
        cpf: document.getElementById('admCpf').value.trim(),
        password: document.getElementById('admPassword').value,
      });
      API.token = data.token;
      data.user.role = 'admin';
      API.user = data.user;
      toast('Admin cadastrado! Bem-vindo ao painel 🛡️', 'success');
      setTimeout(() => { window.location.href = '/admin.html'; }, 450);
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Cadastrar como administrador';
    }
  });

  // ─── Recuperar senha ───
  document.getElementById('resetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    closeModal('resetModal');
    toast('Se o e-mail existir, enviamos o link de recuperação. 📩', 'info');
    e.target.reset();
  });

  // clique fora fecha modal
  authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuth(); });

  // redireciona usuários já logados
  if (API.token && API.user) {
    // mantém na landing, mas mostra botão contextual
    const navCta = document.querySelector('.nav-cta');
    if (navCta) {
      const go = API.user.role === 'admin' ? '/admin.html' : '/dashboard.html';
      navCta.innerHTML = '<button class="btn btn-primary btn-sm" onclick="window.location.href=\'' + go + '\'">Ir para minha área →</button>';
    }
  }
})();
