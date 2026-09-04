import { randomInt } from 'crypto';

/**
 * Alfabeto sem caracteres ambíguos (0/O, 1/I/L) — combina letras e números.
 * O código tem exatamente 6 caracteres e sempre contém ao menos 1 letra e 1 número.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/**
 * Gera um código de acesso de exatamente 6 caracteres alfanuméricos.
 *
 * - Criptograficamente seguro: usa crypto.randomInt (rejection sampling),
 *   NUNCA Math.random().
 * - Garante pelo menos 1 letra e 1 número por código.
 */
export function generateAccessCode(): string {
  for (;;) {
    let code = '';
    let hasLetter = false;
    let hasDigit = false;
    for (let i = 0; i < CODE_LENGTH; i++) {
      const ch = ALPHABET.charAt(randomInt(ALPHABET.length));
      code += ch;
      if (ch >= 'A' && ch <= 'Z') {
        hasLetter = true;
      } else {
        hasDigit = true;
      }
    }
    if (hasLetter && hasDigit) {
      return code;
    }
  }
}
