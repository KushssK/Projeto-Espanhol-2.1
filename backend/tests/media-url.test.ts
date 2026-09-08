import { describe, expect, it } from 'vitest';
import { isValidMediaVideoUrl, parseMediaVideoUrl } from '../src/lib/media-url';

describe('parseMediaVideoUrl — YouTube', () => {
  it('watch?v= clássico', () => {
    expect(parseMediaVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.embedUrl).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('youtu.be encurtado', () => {
    expect(parseMediaVideoUrl('https://youtu.be/dQw4w9WgXcQ')?.embedUrl).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('shorts', () => {
    expect(parseMediaVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')?.embedUrl).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('embed já existente', () => {
    expect(parseMediaVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')?.embedUrl).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });
});

describe('parseMediaVideoUrl — Vimeo', () => {
  it('vimeo.com/N', () => {
    expect(parseMediaVideoUrl('https://vimeo.com/76979871')?.embedUrl).toBe(
      'https://player.vimeo.com/video/76979871'
    );
  });

  it('player.vimeo.com/video/N', () => {
    expect(parseMediaVideoUrl('https://player.vimeo.com/video/76979871')?.embedUrl).toBe(
      'https://player.vimeo.com/video/76979871'
    );
  });
});

describe('parseMediaVideoUrl — rejeições (segurança)', () => {
  it('domínio arbitrário é rejeitado (sem iframe malicioso)', () => {
    expect(parseMediaVideoUrl('https://evil.example.com/embed/x')).toBeNull();
  });

  it('javascript: é rejeitado', () => {
    expect(parseMediaVideoUrl('javascript:alert(1)')).toBeNull();
  });

  it('data: é rejeitado', () => {
    expect(parseMediaVideoUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('string vazia é rejeitada', () => {
    expect(parseMediaVideoUrl('')).toBeNull();
    expect(isValidMediaVideoUrl('')).toBe(false);
  });

  it('YouTube com id inválido (tamanho errado) é rejeitado', () => {
    expect(parseMediaVideoUrl('https://youtu.be/abc')).toBeNull();
  });
});