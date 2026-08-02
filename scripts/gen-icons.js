// Gera os ícones PNG do PWA (gradiente roxo + estrela) usando apenas
// módulos nativos do Node (zlib) — sem dependências externas.
// Uso: node scripts/gen-icons.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// ── PNG writer (formato mínimo válido) ─────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function makePng(size, pixelFn) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filtro "none"
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const o = y * stride + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Desenho ────────────────────────────────────────────────
function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
function gradColor(y, size) {
  // #0b0518 (topo) → #3d1a85 (meio) → #8b5cf6 (base)
  const t = y / size;
  if (t < 0.5) {
    const k = t * 2;
    return [lerp(11, 61, k), lerp(5, 26, k), lerp(24, 133, k)];
  }
  const k = (t - 0.5) * 2;
  return [lerp(61, 139, k), lerp(26, 92, k), lerp(133, 246, k)];
}

function starPoints(cx, cy, R, r, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  return pts;
}

function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function roundedCoverage(x, y, size, rad) {
  const cx = Math.min(Math.max(x, rad), size - 1 - rad);
  const cy = Math.min(Math.max(y, rad), size - 1 - rad);
  const d = Math.hypot(x - cx, y - cy);
  return d <= rad ? 1 : 0;
}

function makePixelFn(size, opts = {}) {
  const rad = opts.round ? size * 0.22 : 0;
  const star = starPoints(size / 2, size / 2, size * 0.34, size * 0.15);
  return (x, y) => {
    // supersample 2x2 para bordas suaves
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = 0; sy < 2; sy++) {
      for (let sx = 0; sx < 2; sx++) {
        const px = x + (sx + 0.5) / 2 - 0.25;
        const py = y + (sy + 0.5) / 2 - 0.25;
        if (roundedCoverage(px, py, size, rad) < 1) continue;
        let col = gradColor(py, size);
        if (inPoly(px, py, star)) col = [245, 243, 255]; // estrela clara
        r += col[0]; g += col[1]; b += col[2]; a += 255; n++;
      }
    }
    if (!n) return [0, 0, 0, 0];
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n), Math.round(a / n)];
  };
}

// ── Geração ────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
const targets = [
  ['icon-192.png', 192, { round: true }],
  ['icon-512.png', 512, { round: true }],
  ['icon-maskable-512.png', 512, { round: false }],
];
for (const [name, size, opts] of targets) {
  const png = makePng(size, makePixelFn(size, opts));
  const out = path.join(OUT_DIR, name);
  fs.writeFileSync(out, png);
  console.log('gerado:', name, '(' + png.length + ' bytes)');
}
console.log('Ícones PWA criados em', OUT_DIR);
