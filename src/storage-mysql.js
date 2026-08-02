// MySQL storage — used automatically when a MySQL server is reachable.
// Environment vars: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
const mysql = require('mysql2/promise');

class MySqlStore {
  constructor() {
    this.pool = null;
  }

  config() {
    return {
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'construindo_saberes',
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 3500,
    };
  }

  async init() {
    // 1) connect without database (create it if missing)
    const cfg = this.config();
    const conn = await mysql.createConnection({ ...cfg, database: undefined });
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.end();

    // 2) real pool
    this.pool = mysql.createPool(cfg);
    await this.pool.query('SELECT 1');
    await this._ensureSchema();
    console.log('[mysql] Conectado com sucesso em', cfg.host + ':' + cfg.port + '/' + cfg.database);
  }

  async _ensureSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(40) NOT NULL,
        email VARCHAR(160) NOT NULL UNIQUE,
        dob VARCHAR(20),
        salt VARCHAR(64) NOT NULL,
        hash VARCHAR(160) NOT NULL,
        avatar MEDIUMTEXT,
        token VARCHAR(96),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(40) NOT NULL,
        email VARCHAR(160) NOT NULL UNIQUE,
        cpf VARCHAR(20),
        salt VARCHAR(64) NOT NULL,
        hash VARCHAR(160) NOT NULL,
        avatar MEDIUMTEXT,
        token VARCHAR(96),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS whitelist (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(160) NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        module VARCHAR(60),
        url TEXT,
        duration VARCHAR(20),
        emoji VARCHAR(16),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        module VARCHAR(60),
        difficulty VARCHAR(20),
        questions JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        channel VARCHAR(120),
        sender VARCHAR(80),
        senderRole VARCHAR(20),
        avatar TEXT,
        body TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS theme (
        id INT PRIMARY KEY,
        config JSON,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`);
  }

  // ---------- Users ----------
  async listUsers() { return this._rows('SELECT * FROM users ORDER BY createdAt DESC'); }
  async getUserByEmail(email) { return this._one('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase()]); }
  async getUserById(id) { return this._one('SELECT * FROM users WHERE id = ?', [id]); }
  async getUserByToken(token) { return this._one('SELECT * FROM users WHERE token = ?', [token]); }

  async createUser(data) {
    const row = { id: data.id || require('./passwords').uuid(), username: data.username, email: String(data.email).toLowerCase(), dob: data.dob || null, salt: data.salt, hash: data.hash, avatar: data.avatar || null, token: data.token || null };
    await this.pool.query(
      'INSERT INTO users (id, username, email, dob, salt, hash, avatar, token) VALUES (?,?,?,?,?,?,?,?)',
      [row.id, row.username, row.email, row.dob, row.salt, row.hash, row.avatar, row.token]
    );
    return row;
  }

  async updateUser(id, patch) {
    const allowed = ['username', 'avatar', 'token', 'salt', 'hash'];
    const sets = [], vals = [];
    for (const k of allowed) if (patch[k] !== undefined) { sets.push(`${k} = ?`); vals.push(patch[k]); }
    if (!sets.length) return this.getUserById(id);
    vals.push(id);
    await this.pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
    return this.getUserById(id);
  }

  async deleteUser(id) { await this.pool.query('DELETE FROM users WHERE id = ?', [id]); }

  // ---------- Admins ----------
  async listAdmins() { return this._rows('SELECT * FROM admins ORDER BY createdAt DESC'); }
  async getAdminByEmail(email) { return this._one('SELECT * FROM admins WHERE email = ?', [String(email).toLowerCase()]); }
  async getAdminById(id) { return this._one('SELECT * FROM admins WHERE id = ?', [id]); }
  async getAdminByToken(token) { return this._one('SELECT * FROM admins WHERE token = ?', [token]); }

  async createAdmin(data) {
    const row = { id: data.id || require('./passwords').uuid(), username: data.username, email: String(data.email).toLowerCase(), cpf: data.cpf || null, salt: data.salt, hash: data.hash, avatar: data.avatar || null, token: data.token || null };
    await this.pool.query(
      'INSERT INTO admins (id, username, email, cpf, salt, hash, avatar, token) VALUES (?,?,?,?,?,?,?,?)',
      [row.id, row.username, row.email, row.cpf, row.salt, row.hash, row.avatar, row.token]
    );
    return row;
  }

  async updateAdmin(id, patch) {
    const allowed = ['username', 'avatar', 'token', 'salt', 'hash', 'cpf'];
    const sets = [], vals = [];
    for (const k of allowed) if (patch[k] !== undefined) { sets.push(`${k} = ?`); vals.push(patch[k]); }
    if (!sets.length) return this.getAdminById(id);
    vals.push(id);
    await this.pool.query(`UPDATE admins SET ${sets.join(', ')} WHERE id = ?`, vals);
    return this.getAdminById(id);
  }

  async deleteAdmin(id) { await this.pool.query('DELETE FROM admins WHERE id = ?', [id]); }

  // ---------- Whitelist ----------
  async listWhitelist() { return this._rows('SELECT * FROM whitelist ORDER BY createdAt DESC'); }
  async whitelistHas(email) {
    const r = await this._one('SELECT id FROM whitelist WHERE email = ?', [String(email).toLowerCase()]);
    return !!r;
  }
  async addWhitelist(email) {
    const em = String(email).toLowerCase().trim();
    if (!em || await this.whitelistHas(em)) return null;
    const id = require('./passwords').uuid();
    await this.pool.query('INSERT INTO whitelist (id, email) VALUES (?,?)', [id, em]);
    return { id, email: em };
  }
  async removeWhitelist(id) { await this.pool.query('DELETE FROM whitelist WHERE id = ?', [id]); }

  // ---------- Videos ----------
  async listVideos() { return this._rows('SELECT * FROM videos ORDER BY module, title'); }
  async getVideo(id) { return this._one('SELECT * FROM videos WHERE id = ?', [id]); }

  async createVideo(data) {
    const id = require('./passwords').uuid();
    await this.pool.query(
      'INSERT INTO videos (id, title, description, module, url, duration, emoji) VALUES (?,?,?,?,?,?,?)',
      [id, data.title, data.description || '', data.module || 'Geral', data.url || '', data.duration || '00:00', data.emoji || '🎬']
    );
    return this.getVideo(id);
  }

  async updateVideo(id, patch) {
    const sets = [], vals = [];
    for (const k of ['title', 'description', 'module', 'url', 'duration', 'emoji']) {
      if (patch[k] !== undefined) { sets.push(`${k} = ?`); vals.push(patch[k]); }
    }
    if (sets.length) { vals.push(id); await this.pool.query(`UPDATE videos SET ${sets.join(', ')} WHERE id = ?`, vals); }
    return this.getVideo(id);
  }

  async deleteVideo(id) { await this.pool.query('DELETE FROM videos WHERE id = ?', [id]); }

  // ---------- Exercises ----------
  async listExercises() { return this._rows('SELECT * FROM exercises ORDER BY module, title'); }
  async getExercise(id) { return this._one('SELECT * FROM exercises WHERE id = ?', [id]); }

  async createExercise(data) {
    const id = require('./passwords').uuid();
    await this.pool.query(
      'INSERT INTO exercises (id, title, module, difficulty, questions) VALUES (?,?,?,?,?)',
      [id, data.title, data.module || 'Geral', data.difficulty || 'Médio', JSON.stringify(data.questions || [])]
    );
    return this.getExercise(id);
  }

  async updateExercise(id, patch) {
    const sets = [], vals = [];
    for (const k of ['title', 'module', 'difficulty']) {
      if (patch[k] !== undefined) { sets.push(`${k} = ?`); vals.push(patch[k]); }
    }
    if (patch.questions !== undefined) { sets.push('questions = ?'); vals.push(JSON.stringify(patch.questions)); }
    if (sets.length) { vals.push(id); await this.pool.query(`UPDATE exercises SET ${sets.join(', ')} WHERE id = ?`, vals); }
    return this.getExercise(id);
  }

  async deleteExercise(id) { await this.pool.query('DELETE FROM exercises WHERE id = ?', [id]); }

  // ---------- Messages ----------
  async listMessages() {
    return this._rows('SELECT * FROM messages ORDER BY createdAt ASC LIMIT 3000');
  }
  async createMessage(data) {
    const id = require('./passwords').uuid();
    await this.pool.query(
      'INSERT INTO messages (id, channel, sender, senderRole, avatar, body) VALUES (?,?,?,?,?,?)',
      [id, data.channel || 'Geral', data.sender || 'Anônimo', data.senderRole || 'aluno', data.avatar || null, data.body || '']
    );
    return this.getByIdFrom('messages', id);
  }

  // ---------- Theme ----------
  async getTheme() {
    const r = await this._one('SELECT config FROM theme WHERE id = 1');
    return r ? r.config : null;
  }
  async setTheme(theme) {
    await this.pool.query(
      'INSERT INTO theme (id, config) VALUES (1, ?) ON DUPLICATE KEY UPDATE config = VALUES(config)',
      [JSON.stringify(theme)]
    );
    return theme;
  }

  // ---------- helpers ----------
  async getByIdFrom(table, id) {
    return this._one(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  }

  async _rows(sql, params = []) {
    const [rows] = await this.pool.query(sql, params);
    return rows.map((r) => this._shape(r));
  }

  async _one(sql, params = []) {
    const [rows] = await this.pool.query(sql, params);
    if (!rows.length) return null;
    return this._shape(rows[0]);
  }

  _shape(r) {
    if (!r) return null;
    if (r.questions && typeof r.questions === 'string') r.questions = JSON.parse(r.questions);
    if (r.config && typeof r.config === 'string') r.config = JSON.parse(r.config);
    return r;
  }

  async close() { if (this.pool) await this.pool.end(); }
}

module.exports = MySqlStore;
