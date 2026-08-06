// Códigos de acesso ao login (6 dígitos), mantidos em memória.
// Cada código: expira em 10 minutos, permite 5 tentativas e pode ser
// reenviado após 30 segundos. Após a validação (certa ou esgotada) é removido.
const crypto = require('crypto');

const TTL = 10 * 60 * 1000;        // 10 minutos
const MAX_ATTEMPTS = 5;            // tentativas antes de invalidar
const RESEND_MS = 30 * 1000;       // cooldown entre reenvios
const CODES = new Map();

function keyOf(kind, email) {
  return kind + ':' + String(email).toLowerCase();
}

// Gera (ou reenvia) um código. Retorna { cooldown:false, code } ou { cooldown:true, wait }.
function generate(kind, email) {
  const key = keyOf(kind, email);
  const prev = CODES.get(key);
  if (prev && Date.now() - prev.sentAt < RESEND_MS) {
    return { cooldown: true, wait: Math.ceil((RESEND_MS - (Date.now() - prev.sentAt)) / 1000) };
  }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  CODES.set(key, {
    code, kind, email: String(email).toLowerCase(),
    expiresAt: Date.now() + TTL, attempts: 0, sentAt: Date.now(),
  });
  return { cooldown: false, code };
}

// Valida o código informado. Retorna { ok:true } ou { ok:false, error }.
function verify(kind, email, code) {
  const key = keyOf(kind, email);
  const entry = CODES.get(key);
  if (!entry) return { ok: false, error: 'Código não solicitado ou expirado. Solicite um novo.' };
  if (Date.now() > entry.expiresAt) {
    CODES.delete(key);
    return { ok: false, error: 'Código expirado. Solicite um novo.' };
  }
  entry.attempts += 1;
  if (entry.attempts > MAX_ATTEMPTS) {
    CODES.delete(key);
    return { ok: false, error: 'Muitas tentativas. Solicite um novo código.' };
  }
  if (String(code || '').trim() !== entry.code) {
    return { ok: false, error: 'Código incorreto.' };
  }
  CODES.delete(key);
  return { ok: true, kind: entry.kind };
}

// Valida procurando nas duas tabelas (aluno/admin) — robusto ao tipo de conta.
// Retorna { ok:true, kind } ou { ok:false, error }.
function verifyAny(email, code) {
  const em = String(email).toLowerCase();
  for (const kind of ['aluno', 'admin']) {
    if (CODES.has(keyOf(kind, em))) {
      const r = verify(kind, em, code);
      if (r.ok) r.kind = kind;
      return r;
    }
  }
  return { ok: false, error: 'Código não solicitado ou expirado. Solicite um novo.' };
}

function clearAll() { CODES.clear(); }

module.exports = { generate, verify, verifyAny, clearAll };
