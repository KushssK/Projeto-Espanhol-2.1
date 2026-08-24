// Landing page — autenticação em 2 etapas: e-mail/senha + código enviado por e-mail
(function () {
  const authModal = document.getElementById('authModal');
  const titleEl = document.getElementById('authTitle');
  let currentTab = 'login'; // 'login' | 'register' | 'admin_login' | 'admin_register' | 'code'

  // estado da etapa do código (retém e-mail/senha apenas em memória, para reenvio)
  let pendingAuth = null; // { email, password, action, payload }

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
      login: ['<h3>Bem-vindo(a) de volta!</h3><p class="modal-sub">Entre para continuar sua jornada no espanhol.</p>'],
      register: ['<h3>Crie sua conta gratuita</h3><p class="modal-sub">Acesso total a videoaulas, simulados, exercícios e conversa com outros alunos. Sem cartão, sem barreiras.</p>'],
      admin_login: ['<h3>Painel administrativo</h3><p class="modal-sub">Acesse o painel com suas credenciais de administrador.</p>'],
      admin_register: ['<h3>Novo administrador</h3><p class="modal-sub">Cadastre-se para gerenciar a plataforma (e-mail liberado na Whitelist).</p>'],
      code: ['<h3>Confirme seu acesso</h3><p class="modal-sub">Digite o código de 6 dígitos enviado para o seu e-mail.</p>'],
    };
    const t = titles[currentTab] || titles.login;
    titleEl.innerHTML = t[0];
  }

  function showOnlyPane(paneId) {
    ['loginForm', 'registerForm', 'adminForm', 'adminLoginForm', 'codePane'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = id === paneId ? '' : 'none';
    });
  }

  function switchTab(tab) {
    currentTab = tab === 'admin' ? 'admin_login' : tab;
    const tabLoginBtn = document.getElementById('tab-login');
    const tabRegBtn = document.getElementById('tab-register');
    const authTabs = document.getElementById('authTabs');

    if (currentTab === 'code') {
      authTabs.style.display = 'none';
      showOnlyPane('codePane');
    } else {
      authTabs.style.display = '';
      const isAdmin = currentTab === 'admin_login' || currentTab === 'admin_register';

      tabLoginBtn.textContent = isAdmin ? 'Entrar (Admin)' : 'Entrar';
      tabRegBtn.textContent = isAdmin ? 'Criar Conta (Admin)' : 'Criar Conta';

      tabLoginBtn.onclick = () => switchTab(isAdmin ? 'admin_login' : 'login');
      tabRegBtn.onclick = () => switchTab(isAdmin ? 'admin_register' : 'register');

      tabLoginBtn.classList.toggle('active', currentTab === 'login' || currentTab === 'admin_login');
      tabRegBtn.classList.toggle('active', currentTab === 'register' || currentTab === 'admin_register');

      if (currentTab === 'login') showOnlyPane('loginForm');
      else if (currentTab === 'register') showOnlyPane('registerForm');
      else if (currentTab === 'admin_login') showOnlyPane('adminLoginForm');
      else if (currentTab === 'admin_register') showOnlyPane('adminForm');
    }

    renderTitle();
  }

  // alterna entre entrar / cadastrar na área admin
  window.switchAdminPane = function (mode) {
    switchTab(mode === 'register' ? 'admin_register' : 'admin_login');
  };

  window.openAuth = function (tab) {
    pendingAuth = null;
    switchTab(tab || 'login');
    authModal.classList.add('open');
  };
  window.closeAuth = function () { authModal.classList.remove('open'); };
  window.switchTab = switchTab;

  window.openAdminAuth = function () {
    switchTab('admin_login');
    authModal.classList.add('open');
  };

  window.openReset = function () {
    closeAuth();
    openModal('resetModal');
  };

  // ─── Etapa do código (2º fator) ───
  function showCodePane(data, email) {
    currentTab = 'code';
    document.getElementById('authTabs').style.display = 'none';
    showOnlyPane('codePane');
    renderTitle();
    document.getElementById('codeEmail').textContent = email;
    document.getElementById('codeInput').value = '';
    // exibe dica de dev caso o SMTP não esteja configurado no servidor
    const hint = document.getElementById('codeDevHint');
    if (data && data.devCode) {
      hint.style.display = '';
      hint.innerHTML = 'Modo de teste: seu código é <b style="font-size:18px;letter-spacing:3px;color:var(--text)">' + data.devCode + '</b>.<br><small style="opacity:0.85">(SMTP não configurado no servidor — digite este código acima para concluir o acesso)</small>';
    } else {
      hint.style.display = 'none';
    }
    document.getElementById('codeInput').focus();
  }

  window.backToLogin = function () {
    const prevAction = pendingAuth ? pendingAuth.action : 'login';
    pendingAuth = null;
    if (prevAction === 'register_admin' || prevAction === 'admin_login') {
      switchTab('admin_login');
    } else {
      switchTab('login');
    }
  };

  window.resendCode = async function () {
    if (!pendingAuth) return;
    const link = document.getElementById('resendLink');
    link.disabled = true;
    try {
      let url = '/api/auth/send-code';
      let body = { email: pendingAuth.email, password: pendingAuth.password };
      if (pendingAuth.action === 'register_aluno') {
        url = '/api/auth/register-send-code';
        body = pendingAuth.payload;
      } else if (pendingAuth.action === 'register_admin') {
        url = '/api/auth/admin/register-send-code';
        body = pendingAuth.payload;
      }

      const data = await req.post(url, body);
      if (data.devCode) {
        const hint = document.getElementById('codeDevHint');
        hint.style.display = '';
        hint.innerHTML = 'Modo de desenvolvimento: seu código é <b>' + data.devCode + '</b>.';
      }
      toast('Novo código enviado para ' + pendingAuth.email + '!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setTimeout(() => { link.disabled = false; }, 2000);
    }
  };

  window.verifyCode = async function () {
    if (!pendingAuth) return;
    const code = document.getElementById('codeInput').value.trim();
    if (!/^\d{6}$/.test(code)) { toast('Digite o código de 6 dígitos.', 'error'); return; }
    const btn = document.getElementById('codeBtn');
    btn.disabled = true; btn.textContent = 'Verificando…';
    try {
      const data = await req.post('/api/auth/verify-code', { email: pendingAuth.email, code });
      API.token = data.token;
      if (data.role === 'admin') { data.user.role = 'admin'; }
      API.user = data.user;
      toast('Bem-vindo(a), ' + data.user.username + '!', 'success');
      pendingAuth = null;
      setTimeout(() => { window.location.href = data.role === 'admin' ? '/admin.html' : '/dashboard.html'; }, 450);
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Verificar código';
    }
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
    toast('App instalado! Agora é só abrir sem internet.', 'success');
  };

  window.maskCpf = function (el) {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    let out = v;
    if (v.length > 9) out = v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6, 9) + '-' + v.slice(9);
    else if (v.length > 6) out = v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6);
    else if (v.length > 3) out = v.slice(0, 3) + '.' + v.slice(3);
    el.value = out;
  };

  // ─── Login (etapa 1: credenciais → envia código por e-mail) ───
  async function startCodeLogin(email, password, btn, btnLabel) {
    btn.disabled = true; btn.textContent = 'Enviando código…';
    try {
      const data = await req.post('/api/auth/send-code', { email, password });
      pendingAuth = { email, password, action: 'login' };
      showCodePane(data, email);
      toast('Código enviado para ' + email + '!', 'success');
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = btnLabel;
    }
  }

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    startCodeLogin(
      document.getElementById('loginEmail').value.trim(),
      document.getElementById('loginPassword').value,
      document.getElementById('loginBtn'),
      'Entrar agora'
    );
  });

  // ─── Login admin (mesmo fluxo em 2 etapas) ───
  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    startCodeLogin(
      document.getElementById('admLoginEmail').value.trim(),
      document.getElementById('admLoginPassword').value,
      document.getElementById('admLoginBtn'),
      'Entrar no painel'
    );
  });

  // ─── Cadastro aluno (envia código por e-mail para confirmar) ───
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('regBtn');
    btn.disabled = true; btn.textContent = 'Enviando código…';
    const payload = {
      username: document.getElementById('regUsername').value.trim(),
      dob: document.getElementById('regDob').value,
      email: document.getElementById('regEmail').value.trim(),
      password: document.getElementById('regPassword').value,
    };
    try {
      const data = await req.post('/api/auth/register-send-code', payload);
      pendingAuth = { email: payload.email, action: 'register_aluno', payload };
      showCodePane(data, payload.email);
      toast('Código enviado para ' + payload.email + '!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Criar minha conta grátis';
    }
  });

  // ─── Cadastro admin (envia código por e-mail para confirmar) ───
  document.getElementById('adminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('admBtn');
    btn.disabled = true; btn.textContent = 'Verificando e enviando código…';
    const payload = {
      username: document.getElementById('admUsername').value.trim(),
      email: document.getElementById('admEmail').value.trim(),
      cpf: document.getElementById('admCpf').value.trim(),
      password: document.getElementById('admPassword').value,
    };
    try {
      const data = await req.post('/api/auth/admin/register-send-code', payload);
      pendingAuth = { email: payload.email, action: 'register_admin', payload };
      showCodePane(data, payload.email);
      toast('Código enviado para ' + payload.email + '!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Cadastrar como administrador';
    }
  });

  // ─── Recuperar senha ───
  document.getElementById('resetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    closeModal('resetModal');
    toast('Se o e-mail existir, enviamos o link de recuperação.', 'info');
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
