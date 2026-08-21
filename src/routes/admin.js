const express = require('express');
const db = require('../db');

const router = express.Router();

async function requireAdmin(req, res, next) {
  try {
    const store = db.get();
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Não autenticado.' });
    const admin = await store.getAdminByToken(token);
    if (!admin) return res.status(401).json({ error: 'Acesso restrito a administradores.' });
    req.admin = admin;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro interno.' });
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------- Estatísticas ----------
router.get('/stats', requireAdmin, async (req, res) => {
  const store = db.get();
  const [users, admins, videos, exercises, messages, whitelist] = await Promise.all([
    store.listUsers(), store.listAdmins(), store.listVideos(),
    store.listExercises(), store.listMessages(), store.listWhitelist(),
  ]);
  res.json({
    users: users.length, admins: admins.length, videos: videos.length,
    exercises: exercises.length, messages: messages.length, whitelist: whitelist.length,
    recentUsers: users.slice(0, 5).map((u) => ({
      id: u.id, username: u.username, email: u.email, avatar: u.avatar || '', createdAt: u.createdAt,
    })),
    recentMessages: messages.slice(-5).reverse(),
  });
});

// ---------- Usuários (alunos) ----------
router.get('/users', requireAdmin, async (req, res) => {
  const users = await db.get().listUsers();
  res.json(users.map((u) => ({ id: u.id, username: u.username, email: u.email, dob: u.dob, avatar: u.avatar || '', createdAt: u.createdAt })));
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  await db.get().deleteUser(req.params.id);
  res.json({ ok: true });
});

// ---------- Admins ----------
router.get('/admins', requireAdmin, async (req, res) => {
  const admins = await db.get().listAdmins();
  res.json(admins.map((a) => ({ id: a.id, username: a.username, email: a.email, cpf: a.cpf, avatar: a.avatar || '', createdAt: a.createdAt })));
});

router.delete('/admins/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.admin.id) return res.status(400).json({ error: 'Você não pode remover a si mesmo.' });
  await db.get().deleteAdmin(req.params.id);
  res.json({ ok: true });
});

// ---------- Whitelist ----------
router.get('/whitelist', requireAdmin, async (req, res) => {
  res.json(await db.get().listWhitelist());
});

router.post('/whitelist', requireAdmin, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'E-mail inválido.' });
  const entry = await db.get().addWhitelist(email);
  if (!entry) return res.status(409).json({ error: 'Este e-mail já está na whitelist.' });
  res.status(201).json(entry);
});

router.delete('/whitelist/:id', requireAdmin, async (req, res) => {
  await db.get().removeWhitelist(req.params.id);
  res.json({ ok: true });
});

// ---------- Vídeos (CRUD via YouTube) ----------
router.post('/videos', requireAdmin, async (req, res) => {
  const { title, description, module: mod, url, duration, emoji } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Título obrigatório.' });
  const video = await db.get().createVideo({
    title: String(title).trim(), description: String(description || '').trim(),
    module: String(mod || 'Geral').trim(), url: String(url || '').trim(),
    duration: String(duration || '').trim(), emoji: '',
  });
  res.status(201).json(video);
});

router.put('/videos/:id', requireAdmin, async (req, res) => {
  const store = db.get();
  const { title, description, module: mod, url, duration } = req.body || {};
  const video = await store.updateVideo(req.params.id, {
    title: title !== undefined ? String(title).trim() : undefined,
    description: description !== undefined ? String(description).trim() : undefined,
    module: mod !== undefined ? String(mod).trim() : undefined,
    url: url !== undefined ? String(url).trim() : undefined,
    duration: duration !== undefined ? String(duration).trim() : undefined,
    emoji: emoji !== undefined ? String(emoji).trim() : undefined,
  });
  if (!video) return res.status(404).json({ error: 'Vídeo não encontrado.' });
  res.json(video);
});

router.delete('/videos/:id', requireAdmin, async (req, res) => {
  await db.get().deleteVideo(req.params.id);
  res.json({ ok: true });
});

// ---------- Simulados (CRUD) ----------
router.post('/exercises', requireAdmin, async (req, res) => {
  const { title, module: mod, difficulty, questions } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Título obrigatório.' });
  if (!Array.isArray(questions) || !questions.length) return res.status(400).json({ error: 'Adicione ao menos uma questão.' });
  const exercise = await db.get().createExercise({
    title: String(title).trim(), module: String(mod || 'Geral').trim(),
    difficulty: String(difficulty || 'Médio').trim(), questions,
  });
  res.status(201).json(exercise);
});

router.put('/exercises/:id', requireAdmin, async (req, res) => {
  const { title, module: mod, difficulty, questions } = req.body || {};
  const exercise = await db.get().updateExercise(req.params.id, {
    title: title !== undefined ? String(title).trim() : undefined,
    module: mod !== undefined ? String(mod).trim() : undefined,
    difficulty: difficulty !== undefined ? String(difficulty).trim() : undefined,
    questions: questions !== undefined ? questions : undefined,
  });
  if (!exercise) return res.status(404).json({ error: 'Simulado não encontrado.' });
  res.json(exercise);
});

router.delete('/exercises/:id', requireAdmin, async (req, res) => {
  await db.get().deleteExercise(req.params.id);
  res.json({ ok: true });
});

// ---------- Tema global ----------
router.get('/theme', requireAdmin, async (req, res) => {
  res.json(await db.get().getTheme());
});

router.post('/theme', requireAdmin, async (req, res) => {
  const t = req.body || {};
  const keys = ['bgDeep', 'bgGrad1', 'bgGrad2', 'accent', 'accent2'];
  for (const k of keys) {
    if (t[k] !== undefined && !/^#[0-9a-fA-F]{6}$/.test(t[k])) {
      return res.status(400).json({ error: 'Cor inválida para ' + k + '.' });
    }
  }
  const theme = {
    bgDeep: t.bgDeep || '#0b0518',
    bgGrad1: t.bgGrad1 || '#1c0a42',
    bgGrad2: t.bgGrad2 || '#3d1a85',
    accent: t.accent || '#8b5cf6',
    accent2: t.accent2 || '#e879f9',
    glassOpacity: Math.min(0.2, Math.max(0.02, Number(t.glassOpacity) || 0.07)),
    glassBlur: Math.min(40, Math.max(6, Number(t.glassBlur) || 18)),
  };
  await db.get().setTheme(theme);
  res.json(theme);
});

module.exports = router;
