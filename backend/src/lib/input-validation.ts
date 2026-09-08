/** Validações de entrada compartilhadas entre controllers. */

/** Apenas URLs seguras (https) — rejeita javascript:, data:, esquemas arbitrários. */
export function isSafeHttpsUrl(raw: string): boolean {
  if (!raw || typeof raw !== 'string') return false;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Cor válida: #RGB ou #RRGGBB (hex). */
export function isValidThemeColor(raw: string): boolean {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw.trim());
}
