// Password hashing utilities (Node built-in crypto — zero extra deps)
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  try {
    const candidate = crypto.scryptSync(String(password), salt, 64).toString('hex');
    const a = Buffer.from(candidate, 'hex');
    const b = Buffer.from(hash, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

function newToken() {
  return crypto.randomBytes(24).toString('hex');
}

function uuid() {
  return crypto.randomUUID();
}

module.exports = { hashPassword, verifyPassword, newToken, uuid };
