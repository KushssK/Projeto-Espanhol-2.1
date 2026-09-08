import { describe, expect, it } from 'vitest';
import { LOGO_ALLOWED_MIME_TYPES } from '../src/config/upload.config';

describe('Upload de logo — whitelist MIME', () => {
  it('SVG é BLOQUEADO (execução de script/HTML)', () => {
    expect(LOGO_ALLOWED_MIME_TYPES).not.toContain('image/svg+xml');
  });

  it('HTML é bloqueado', () => {
    expect(LOGO_ALLOWED_MIME_TYPES).not.toContain('text/html');
  });

  it('somente formatos raster seguros são aceitos', () => {
    expect(LOGO_ALLOWED_MIME_TYPES).toEqual(
      expect.arrayContaining(['image/png', 'image/jpeg', 'image/webp'])
    );
  });

  it('nenhum tipo executável na lista', () => {
    const dangerous = LOGO_ALLOWED_MIME_TYPES.filter((m) =>
      /svg|html|xml|javascript|wasm/.test(m)
    );
    expect(dangerous).toEqual([]);
  });
});