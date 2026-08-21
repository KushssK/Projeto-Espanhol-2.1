require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./src/db');
const authRoutes = require('./src/routes/auth');
const contentRoutes = require('./src/routes/content');
const adminRoutes = require('./src/routes/admin');

const PORT = Number(process.env.PORT || 3100);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// API
app.use('/api/auth', authRoutes);
app.use('/api', contentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, name: 'Construindo Saberes' }));

// SPA fallback (non-file paths → landing)
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

(async () => {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log('');
      console.log('──────────────────────────────────────────────');
      console.log('  Construindo Saberes — Plataforma ativa!');
      console.log('  ➜  http://localhost:' + PORT);
      console.log('  ➜  Admin:  kaikyzen@gmail.com (senha no seed)');
      console.log('  ➜  Conteúdo vazio — adicione videoaulas e simulados pelo painel');
      console.log('──────────────────────────────────────────────');
    });
  } catch (e) {
    console.error('Falha ao iniciar o servidor:', e);
    process.exit(1);
  }
})();
