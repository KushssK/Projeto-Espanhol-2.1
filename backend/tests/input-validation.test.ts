import { describe, expect, it } from 'vitest';
import { isSafeHttpsUrl, isValidThemeColor } from '../src/lib/input-validation';

describe('isValidThemeColor (hex apenas)', () => {
  it('aceita #RGB', () => {
    expect(isValidThemeColor('#7C3')).toBe(true);
  });

  it('aceita #RRGGBB', () => {
    expect(isValidThemeColor('#7C3AED')).toBe(true);
  });

  it('rejeita valor não-hex (#GGG)', () => {
    expect(isValidThemeColor('#GGGGGG')).toBe(false);
  });

  it('rejeita comprimento inválido', () => {
    expect(isValidThemeColor('#7C3AE')).toBe(false);
    expect(isValidThemeColor('#7C3AEDFF')).toBe(false);
  });

  it('rejeita string arbitrária', () => {
    expect(isValidThemeColor('red')).toBe(false);
    expect(isValidThemeColor('')).toBe(false);
    expect(isValidThemeColor('url(https://evil)')).toBe(false);
  });
});

describe('isSafeHttpsUrl', () => {
  it('aceita https', () => {
    expect(isSafeHttpsUrl('https://cdn.example.com/logo.png')).toBe(true);
  });

  it('rejeita javascript:', () => {
    expect(isSafeHttpsUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejeita data:', () => {
    expect(isSafeHttpsUrl('data:image/svg+xml,<svg/>')).toBe(false);
  });

  it('rejeita http (não cifrado)', () => {
    expect(isSafeHttpsUrl('http://example.com/logo.png')).toBe(false);
  });

  it('rejeita vazio/não-URL', () => {
    expect(isSafeHttpsUrl('')).toBe(false);
    expect(isSafeHttpsUrl('not a url')).toBe(false);
  });
});