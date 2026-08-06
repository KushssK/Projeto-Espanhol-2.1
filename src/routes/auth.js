const express = require('express');
const { hashPassword, verifyPassword, newToken, uuid } = require('../passwords');
const db = require('../db');
const authCodes = require('../auth-codes');
const { sendAuthCode } = require('../mailer');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function publicUser(u) {
  return { id: u.id, username: u.username, email: u.email, dob: u.dob || null, avatar: u.avatar || '' };
}
function publicAdmin(a) {
  return { id: a.id, username: a.username, email: a.email, cpf: a.cpf || null, avatar: a.avatar || '' };
}

function validatePassword(pw) {
  if (!pw || String(pw).length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
  return null;
}

// ---------- Alunos ----------
router.post('/register', async (req, res) => {
  try {
    const { username, dob, email, password } = req.body || {};
    const store = db.get();

    const em = String(email || '').trim().toLowerCase();
    const name = String(username || '').trim();
    const errs = [];
    if (!/^[A-Za-z0-9_.]{3,20}$/.test(name)) errs.push('Username deve ter de 3 a 20 caracteres (letras, números, _ ou .).');
    if (!EMAIL_RE.test(em)) errs.push('E-mail inválido.');
    if (!dob) errs.push('Informe a data de nascimento.');
    const pwErr = validatePassword(password);
    if (pwErr) errs.push(pwErr);
    if (errs.length) return res.status(400).json({ error: errs.join(' ') });

    if (await store.getUserByEmail(em)) return res.status(409).json({ error: 'Este e-mail já está cadastrado. Faça login.' });
    if (await store.getAdminByEmail(em)) return res.status(409).json({ error: 'Este e-mail pertence a um administrador.' });

    const { salt, hash } = hashPassword(password);
    const token = newToken();
    const user = await store.createUser({ username: name, email: em, dob, salt, hash, token });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro interno ao criar conta.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const store = db.get();
    const em = String(email || '').trim().toLowerCase();
    const user = await store.getUserByEmail(em);
    if (!user || !verifyPassword(password, user.salt, user.hash)) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }
    const token = newToken();
    const updated = await store.updateUser(user.id, { token });
    res.json({ token, user: publicUser(updated) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro interno ao entrar.' });
  }
});

// ---------- Acesso em 2 etapas: credenciais + código enviado por e-mail ----------
// Etapa 1: valida e-mail/senha e envia um código de 6 dígitos para o e-mail cadastrado.
// Detecta automaticamente se o e-mail é de aluno ou admin (mesma lógica do login).
router.post('/send-code', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const em = String(email || '').trim().toLowerCase();
    const store = db.get();
    const user = await store.getUserByEmail(em);
    const admin = user ? null : await store.getAdminByEmail(em);
    const who = user || admin;
    if (!who || !verifyPassword(password, who.salt, who.hash)) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }
    const kind = user ? 'aluno' : 'admin';
    const sent = authCodes.generate(kind, em);
    if (sent.cooldown) {
      return res.status(429).json({ error: 'Aguarde ' + sent.wait + 's para reenviar o código.', retryAfter: sent.wait });
    }
    const result = await sendAuthCode(em, sent.code);
    // o código de dev só é devolvido fora de produção (para testes locais sem SMTP)
    const isProd = process.env.NODE_ENV === 'production';
    res.json({ sent: true, kind, mode: result.mode, devCode: result.mode === 'dev' && !isProd ? sent.code : undefined, expiresIn: 600 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao enviar o código de acesso.' });
  }
});

// Etapa 2: confirma o código e emite o token (login concluído).
// A verificação descobre sozinha se o e-mail é de aluno ou admin (verifyAny).
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const em = String(email || '').trim().toLowerCase();
    const store = db.get();
    const check = authCodes.verifyAny(em, code);
    if (!check.ok) return res.status(401).json({ error: check.error });
    if (check.kind === 'admin') {
      const admin = await store.getAdminByEmail(em);
      const token = newToken();
      const updated = await store.updateAdmin(admin.id, { token });
      return res.json({ token, user: publicAdmin(updated), role: 'admin' });
    }
    const user = await store.getUserByEmail(em);
    const token = newToken();
    const updated = await store.updateUser(user.id, { token });
    res.json({ token, user: publicUser(updated) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao validar o código.' });
  }
});

router.get('/me', async (req, res) => {
  const store = db.get();
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });
  const user = await store.getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Sessão expirada.' });
  res.json({ user: publicUser(user) });
});

router.patch('/profile', async (req, res) => {
  try {
    const store = db.get();
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = await store.getUserByToken(token);
    if (!user) return res.status(401).json({ error: 'Sessão expirada.' });

    const patch = {};
    const { username, avatar } = req.body || {};
    if (username !== undefined) {
      const name = String(username).trim();
      if (!/^[A-Za-z0-9_.]{3,20}$/.test(name)) return res.status(400).json({ error: 'Username inválido (3 a 20 caracteres).' });
      const clash = (await store.listUsers()).find((u) => u.username.toLowerCase() === name.toLowerCase() && u.id !== user.id);
      if (clash) return res.status(409).json({ error: 'Este username já está em uso.' });
      patch.username = name;
    }
    if (avatar !== undefined) {
      // base64 ~1.33x o tamanho binário: 700KB binário vira ~935KB de string
      if (typeof avatar !== 'string' || avatar.length > 1_500_000) return res.status(400).json({ error: 'Imagem muito grande.' });
      if (!/^data:image\/(png|jpe?g|gif|webp|avif);base64,[A-Za-z0-9+/=]+$/.test(avatar)) return res.status(400).json({ error: 'Avatar inválido.' });
      patch.avatar = avatar;
    }
    const updated = await store.updateUser(user.id, patch);
    res.json({ user: publicUser(updated) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

// ---------- Admins ----------
router.post('/admin/register', async (req, res) => {
  try {
    const { username, email, cpf, password } = req.body || {};
    const store = db.get();
    const em = String(email || '').trim().toLowerCase();
    const name = String(username || '').trim();

    const errs = [];
    if (!/^[A-Za-z0-9_.]{3,20}$/.test(name)) errs.push('Username inválido (3 a 20 caracteres).');
    if (!EMAIL_RE.test(em)) errs.push('E-mail inválido.');
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(String(cpf || '').trim())) errs.push('CPF inválido. Use o formato 000.000.000-00.');
    const pwErr = validatePassword(password);
    if (pwErr) errs.push(pwErr);
    if (errs.length) return res.status(400).json({ error: errs.join(' ') });

    if (await store.getAdminByEmail(em)) return res.status(409).json({ error: 'Já existe um administrador com este e-mail.' });
    if (await store.getUserByEmail(em)) return res.status(409).json({ error: 'Este e-mail já pertence a uma conta de aluno.' });

    const allowed = await store.whitelistHas(em);
    const bootstrap = (await store.listAdmins()).length === 0;
    if (!allowed && !bootstrap) {
      return res.status(403).json({
        error: 'E-mail ainda não liberado. Um administrador precisa adicionar seu e-mail na Whitelist do painel para você poder se cadastrar.',
        whitelistRequired: true,
      });
    }

    const { salt, hash } = hashPassword(password);
    const token = newToken();
    const admin = await store.createAdmin({
      username: name, email: em, cpf: String(cpf).trim(), salt, hash, token,
    });
    res.status(201).json({ token, user: publicAdmin(admin), role: 'admin' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro interno ao cadastrar administrador.' });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const store = db.get();
    const admin = await store.getAdminByEmail(String(email || '').trim().toLowerCase());
    if (!admin || !verifyPassword(password, admin.salt, admin.hash)) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }
    const token = newToken();
    const updated = await store.updateAdmin(admin.id, { token });
    res.json({ token, user: publicAdmin(updated), role: 'admin' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro interno ao entrar.' });
  }
});

router.get('/admin/me', async (req, res) => {
  const store = db.get();
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });
  const admin = await store.getAdminByToken(token);
  if (!admin) return res.status(401).json({ error: 'Sessão expirada.' });
  res.json({ user: publicAdmin(admin), role: 'admin' });
});

router.patch('/admin/profile', async (req, res) => {
  try {
    const store = db.get();
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const admin = await store.getAdminByToken(token);
    if (!admin) return res.status(401).json({ error: 'Sessão expirada.' });
    const patch = {};
    const { username, avatar } = req.body || {};
    if (username !== undefined) {
      const name = String(username).trim();
      if (!/^[A-Za-z0-9_.]{3,20}$/.test(name)) return res.status(400).json({ error: 'Username inválido.' });
      patch.username = name;
    }
    if (avatar !== undefined) {
      // base64 ~1.33x o tamanho binário: 700KB binário vira ~935KB de string
      if (typeof avatar !== 'string' || avatar.length > 1_500_000) return res.status(400).json({ error: 'Imagem muito grande.' });
      if (!/^data:image\/(png|jpe?g|gif|webp|avif);base64,[A-Za-z0-9+/=]+$/.test(avatar)) return res.status(400).json({ error: 'Avatar inválido.' });
      patch.avatar = avatar;
    }
    const updated = await store.updateAdmin(admin.id, patch);
    res.json({ user: publicAdmin(updated), role: 'admin' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

module.exports = router;
