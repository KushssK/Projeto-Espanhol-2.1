// File-based JSON storage — fully functional fallback when MySQL is not available.
// Mirrors the exact same async API as storage-mysql.js, so db.js can swap transparently.
const fs = require('fs');
const path = require('path');
const { uuid } = require('./passwords');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function emptyDb() {
  return {
    users: [],
    admins: [],
    whitelist: [],
    videos: [],
    exercises: [],
    messages: [],
    theme: null,
  };
}

class JsonStore {
  constructor() {
    this.db = emptyDb();
    this._timer = null;
  }

  async init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        this.db = Object.assign(emptyDb(), raw);
      }
    } catch (e) {
      console.warn('[json-store] Não foi possível ler data/db.json:', e.message);
      this.db = emptyDb();
    }
    this._save();
  }

  _save() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf8');
      } catch (e) {
        console.warn('[json-store] Falha ao salvar:', e.message);
      }
    }, 40);
  }

  now() {
    return new Date().toISOString();
  }

  // ---------- Users (alunos) ----------
  async listUsers() { return this.db.users; }
  async getUserByEmail(email) { return this.db.users.find((u) => u.email === String(email).toLowerCase()) || null; }
  async getUserById(id) { return this.db.users.find((u) => u.id === id) || null; }
  async getUserByToken(token) { return this.db.users.find((u) => u.token === token) || null; }

  async createUser(data) {
    const user = Object.assign({
      id: uuid(), createdAt: this.now(),
      avatar: '', token: null,
    }, data);
    user.email = user.email.toLowerCase();
    this.db.users.push(user);
    this._save();
    return user;
  }

  async updateUser(id, patch) {
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.db.users[idx] = Object.assign({}, this.db.users[idx], patch);
    this._save();
    return this.db.users[idx];
  }

  async deleteUser(id) {
    const before = this.db.users.length;
    this.db.users = this.db.users.filter((u) => u.id !== id);
    if (this.db.users.length !== before) this._save();
  }

  // ---------- Admins ----------
  async listAdmins() { return this.db.admins; }
  async getAdminByEmail(email) { return this.db.admins.find((a) => a.email === String(email).toLowerCase()) || null; }
  async getAdminById(id) { return this.db.admins.find((a) => a.id === id) || null; }
  async getAdminByToken(token) { return this.db.admins.find((a) => a.token === token) || null; }

  async createAdmin(data) {
    const admin = Object.assign({
      id: uuid(), createdAt: this.now(),
      avatar: '', token: null,
    }, data);
    admin.email = admin.email.toLowerCase();
    this.db.admins.push(admin);
    this._save();
    return admin;
  }

  async updateAdmin(id, patch) {
    const idx = this.db.admins.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.db.admins[idx] = Object.assign({}, this.db.admins[idx], patch);
    this._save();
    return this.db.admins[idx];
  }

  async deleteAdmin(id) {
    const before = this.db.admins.length;
    this.db.admins = this.db.admins.filter((a) => a.id !== id);
    if (this.db.admins.length !== before) this._save();
  }

  // ---------- Whitelist ----------
  async listWhitelist() { return this.db.whitelist; }
  async whitelistHas(email) {
    return this.db.whitelist.some((w) => w.email === String(email).toLowerCase());
  }
  async addWhitelist(email) {
    const em = String(email).toLowerCase().trim();
    if (!em || await this.whitelistHas(em)) return null;
    const entry = { id: uuid(), email: em, createdAt: this.now() };
    this.db.whitelist.push(entry);
    this._save();
    return entry;
  }
  async removeWhitelist(id) {
    const before = this.db.whitelist.length;
    this.db.whitelist = this.db.whitelist.filter((w) => w.id !== id);
    if (this.db.whitelist.length !== before) this._save();
  }

  // ---------- Videos ----------
  async listVideos() { return this.db.videos; }
  async getVideo(id) { return this.db.videos.find((v) => v.id === id) || null; }

  async createVideo(data) {
    const video = Object.assign({ id: uuid(), createdAt: this.now() }, data);
    this.db.videos.push(video);
    this._save();
    return video;
  }

  async updateVideo(id, patch) {
    const idx = this.db.videos.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    this.db.videos[idx] = Object.assign({}, this.db.videos[idx], patch);
    this._save();
    return this.db.videos[idx];
  }

  async deleteVideo(id) {
    const before = this.db.videos.length;
    this.db.videos = this.db.videos.filter((v) => v.id !== id);
    if (this.db.videos.length !== before) this._save();
  }

  // ---------- Exercises (simulados) ----------
  async listExercises() { return this.db.exercises; }
  async getExercise(id) { return this.db.exercises.find((e) => e.id === id) || null; }

  async createExercise(data) {
    const exercise = Object.assign({ id: uuid(), createdAt: this.now() }, data);
    this.db.exercises.push(exercise);
    this._save();
    return exercise;
  }

  async updateExercise(id, patch) {
    const idx = this.db.exercises.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.db.exercises[idx] = Object.assign({}, this.db.exercises[idx], patch);
    this._save();
    return this.db.exercises[idx];
  }

  async deleteExercise(id) {
    const before = this.db.exercises.length;
    this.db.exercises = this.db.exercises.filter((e) => e.id !== id);
    if (this.db.exercises.length !== before) this._save();
  }

  // ---------- Messages (chat) ----------
  async listMessages() { return this.db.messages; }

  async createMessage(data) {
    const message = Object.assign({ id: uuid(), createdAt: this.now() }, data);
    this.db.messages.push(message);
    if (this.db.messages.length > 2000) this.db.messages = this.db.messages.slice(-2000);
    this._save();
    return message;
  }

  // ---------- Theme ----------
  async getTheme() { return this.db.theme; }
  async setTheme(theme) {
    this.db.theme = theme;
    this._save();
    return theme;
  }
}

module.exports = JsonStore;
