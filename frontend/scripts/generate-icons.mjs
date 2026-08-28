// Gera ícones PNG para o PWA (192x192 e 512x512) sem dependências externas.
// Desenha um quadrado arredondado com gradiente na cor primária + letra "E".
// Uso: node scripts/generate-icons.mjs

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public');

// ---------------------------------------------------------------------------
// Utilitários PNG
// ---------------------------------------------------------------------------
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Scanlines com filtro 0
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------------------------------------------------------------------------
// Rasterização
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function roundRectContains(x, y, size, radius) {
  const r = radius;
  const min = r;
  const max = size - r;
  if (x >= min && x <= max) return true;
  if (y >= min && y <= max) return true;
  const cx = x < min ? min : max;
  const cy = y < min ? min : max;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const [r1, g1, b1] = hexToRgb('#FF5733');
  const [r2, g2, b2] = hexToRgb('#FF9A5A');
  const radius = size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (!roundRectContains(x + 0.5, y + 0.5, size, radius)) {
        buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = 0;
        continue;
      }
      // Gradiente diagonal
      const t = (x + y) / (2 * size);
      buf[i] = Math.round(r1 + (r2 - r1) * t);
      buf[i + 1] = Math.round(g1 + (g2 - g1) * t);
      buf[i + 2] = Math.round(b1 + (b2 - b1) * t);
      buf[i + 3] = 255;

      // Letra "E" branca
      const u = x / size;
      const v = y / size;
      const barW = 0.16; // espessura das barras
      const inVerticalBar = u > 0.22 && u < 0.22 + barW;
      const inTopBar = v > 0.24 && v < 0.24 + barW && u > 0.22 && u < 0.78;
      const inMidBar = v > 0.5 - barW / 2 && v < 0.5 + barW / 2 && u > 0.22 && u < 0.62;
      const inBotBar = v > 0.78 - barW && v < 0.78 && u > 0.22 && u < 0.78;
      if (inVerticalBar || inTopBar || inMidBar || inBotBar) {
        buf[i] = 255; buf[i + 1] = 255; buf[i + 2] = 255; buf[i + 3] = 255;
      }
    }
  }
  return encodePng(size, size, buf);
}

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'icon-192.png'), drawIcon(192));
writeFileSync(join(OUT_DIR, 'icon-512.png'), drawIcon(512));
console.log('✓ Ícones gerados em frontend/public/: icon-192.png e icon-512.png');
