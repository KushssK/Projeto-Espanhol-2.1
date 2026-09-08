/**
 * Resolução de origens permitidas para CORS (HTTP + Socket.IO).
 *
 * Uma origem é aceita quando:
 *   1. Não há header Origin (requisições de servidor, curl, mesma origem);
 *   2. Bate com CORS_ORIGIN do ambiente (Render) — agora aceita uma LISTA
 *      separada por vírgulas; a comparação ignora caixa e barra final;
 *   3. Bate com os domínios automáticos de deploy do frontend no Vercel:
 *      https://projeto-espanhol-<hash>-kushssks-projects.vercel.app
 *      O padrão cobre QUALQUER hash gerado pelo Vercel para este projeto —
 *      inclusive a URL atual (3se7rd1e0) e a anterior (npai5qyfu) — evitando
 *      nova quebra de CORS caso o domínio automático seja regenerado;
 *   4. Está na lista padrão — domínio fixo de produção
 *      (construindosaberes.vercel.app ou alternativa) e localhost.
 */

const normalizeOrigin = (origin: string): string =>
  origin.trim().replace(/\/+$/, '').toLowerCase();

const listFromEnv = (): string[] =>
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

// Padrão dos domínios automáticos do Vercel deste projeto (owner kushssks-projects).
const VERCEL_PROJECT_DOMAIN =
  /^https:\/\/projeto-espanhol-[a-z0-9]+-kushssks-projects\.vercel\.app$/;

// Origens padrão aceitas mesmo sem CORS_ORIGIN configurado.
// Domínio fixo de produção do frontend (definir em Vercel → Settings → Domains):
//   - `construindosaberes.vercel.app` — opção principal;
//   - `construindo-saberes-app.vercel.app` — alternativa, caso a principal
//     já esteja atribuída a outra conta no Vercel.
// Os demais cobrem deploys automáticos e desenvolvimento local.
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://construindosaberes.vercel.app',
  'https://construindo-saberes-app.vercel.app',
  'https://projeto-espanhol-3se7rd1e0-kushssks-projects.vercel.app',
].map(normalizeOrigin);

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);
  if (VERCEL_PROJECT_DOMAIN.test(normalized)) return true;

  return [...listFromEnv(), ...DEFAULT_ALLOWED_ORIGINS].includes(normalized);
}

/**
 * Callback no formato esperado pelos middlewares de CORS
 * (express `cors` e `socket.io`/`engine.io`).
 */
export const corsOriginCallback = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void => {
  callback(null, isOriginAllowed(origin));
};
