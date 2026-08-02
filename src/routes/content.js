const express = require('express');
const db = require('../db');

const router = express.Router();

async function senderFrom(req) {
  const store = db.get();
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) {
    const user = await store.getUserByToken(token);
    if (user) return { role: 'aluno', name: user.username, avatar: user.avatar || '' };
    const admin = await store.getAdminByToken(token);
    if (admin) return { role: 'admin', name: admin.username, avatar: admin.avatar || '' };
  }
  return null;
}

// ---------- Videos & Exercícios (leitura) ----------
router.get('/videos', async (req, res) => {
  const videos = await db.get().listVideos();
  res.json(videos);
});

router.get('/exercises', async (req, res) => {
  const exercises = await db.get().listExercises();
  res.json(exercises);
});

router.get('/modules', async (req, res) => {
  const videos = await db.get().listVideos();
  const modules = {};
  for (const v of videos) {
    if (!modules[v.module]) modules[v.module] = { name: v.module, count: 0 };
    modules[v.module].count++;
  }
  res.json(Object.values(modules));
});

// ---------- Chat ----------
router.get('/messages', async (req, res) => {
  // Somente as conversas do próprio aluno: o canal é uma chave determinística
  // de dupla ([userA, userB].sort().join('__')), então basta verificar se o
  // username do logado é um dos participantes. Isso preserva a privacidade e
  // evita que a lista de conversas mostre canais de outros alunos.
  const sender = await senderFrom(req);
  if (!sender) return res.status(401).json({ error: 'Faça login para ver as conversas.' });
  const messages = await db.get().listMessages();
  const mine = messages.filter((m) => {
    const parts = String(m.channel || '').split('__');
    return parts.includes(sender.name) || m.sender === sender.name;
  });
  res.json(mine);
});

router.post('/messages', async (req, res) => {
  try {
    const sender = await senderFrom(req);
    if (!sender) return res.status(401).json({ error: 'Faça login para conversar.' });
    const body = String(req.body?.body || '').trim().slice(0, 600);
    if (!body) return res.status(400).json({ error: 'Mensagem vazia.' });
    const channel = String(req.body?.channel || 'Geral').slice(0, 120);
    const store = db.get();

    const saved = await store.createMessage({
      channel, sender: sender.name, senderRole: sender.role, avatar: sender.avatar, body,
    });
    res.status(201).json({ ok: true, message: saved });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }
});

// alunos cadastrados (para o chat iniciar conversa entre alunos)
router.get('/students', async (req, res) => {
  const sender = await senderFrom(req);
  if (!sender) return res.status(401).json({ error: 'Faça login para ver os alunos.' });
  const users = await db.get().listUsers();
  res.json(users
    .filter((u) => u.username !== sender.name)
    .map((u) => ({ id: u.id, username: u.username, avatar: u.avatar || '' })));
});

// ---------- Tema global ----------
router.get('/theme', async (req, res) => {
  const theme = await db.get().getTheme();
  res.json(theme || {});
});

module.exports = router;
