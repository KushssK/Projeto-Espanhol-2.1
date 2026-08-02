// Storage factory: uses MySQL when reachable, otherwise transparently falls back
// to the JSON file store so the platform runs anywhere.
const path = require('path');
const JsonStore = require('./storage-json');
const { hashPassword } = require('./passwords');

let store = null;

function makeJson() {
  return new JsonStore();
}

async function init() {
  const forced = process.env.STORAGE === 'json';
  if (!forced) {
    try {
      const MySqlStore = require('./storage-mysql');
      const s = new MySqlStore();
      await s.init();
      store = s;
      console.log('[db] Armazenamento: MySQL');
    } catch (e) {
      console.warn('[db] MySQL indisponível — usando armazenamento JSON em data/db.json. (' + e.message + ')');
      store = makeJson();
      await store.init();
    }
  } else {
    store = makeJson();
    await store.init();
  }
  await seedIfEmpty(store);
  return store;
}

function get() {
  if (!store) throw new Error('Banco de dados não inicializado.');
  return store;
}

// ---------- Seed ----------
// A plataforma nasce limpa: nenhum aluno, videoaula, simulado ou mensagem.
// Todo o conteúdo é adicionado pelos administradores pelo painel.
// Apenas o administrador inicial (bootstrap) e o tema padrão são criados.

const DEFAULT_THEME = {
  bgDeep: '#0b0518',
  bgGrad1: '#1c0a42',
  bgGrad2: '#3d1a85',
  accent: '#8b5cf6',
  accent2: '#e879f9',
  glassOpacity: 0.07,
  glassBlur: 18,
};

async function seedIfEmpty(st) {
  const admins = await st.listAdmins();
  if (admins.length === 0) {
    const a = hashPassword('kaikyzen123');
    await st.createAdmin({
      username: 'kaikyzen', email: 'kaikyzen@gmail.com', cpf: '000.000.000-00',
      salt: a.salt, hash: a.hash, avatar: '',
    });
    console.log('[db] Seed: administrador criado (kaikyzen@gmail.com)');
  }

  if (!(await st.whitelistHas('kaikyzen@gmail.com'))) {
    await st.addWhitelist('kaikyzen@gmail.com');
  }

  const theme = await st.getTheme();
  if (!theme) {
    await st.setTheme(DEFAULT_THEME);
  }
}

module.exports = { init, get };
