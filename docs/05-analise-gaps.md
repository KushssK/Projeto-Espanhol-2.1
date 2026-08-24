# 5. Análise: escopo vs. repositório

## 5.1 Já implementado

| Requisito | Status |
|-----------|--------|
| Stack React/Vite + Node/Express/Prisma/MySQL | OK |
| RBAC STUDENT / TEACHER / ADMIN | OK |
| Whitelist CPF no cadastro | OK (reforçado com `/auth/register/staff`) |
| CMS `AppSettings` (cor + logo URL) | OK (+ upload de logo) |
| Módulos/aulas/anexos com `orderIndex` | OK |
| Progresso gamificado + leaderboard | OK |
| Chat 1:1 e grupo + Socket.IO + 20 MB | OK |
| Busca usuário por username/e-mail | OK |
| Admin: ban, listar, ver progresso (sem editar perfil aluno) | OK |
| Manifest PWA + registro SW | OK (SW melhorado para produção) |

## 5.2 Construído nesta entrega

| Item | Local |
|------|--------|
| Documentação técnica completa | `docs/` |
| Modelos `Category` e `MediaLibrary` | `schema.prisma` + migration |
| APIs whitelist, categorias, media-library | `backend/src/` |
| Seed dos 10 módulos | `prisma/seed.ts` |
| Exemplos deploy | `deploy/` |
| `.env.example` | `backend/`, `frontend/` |
| README raiz | `README.md` |

## 5.3 Pendências implementadas nesta entrega

| Item | Status | Local |
|------|--------|--------|
| Roteamento do frontend (App.tsx era template Vite) | OK | `frontend/src/App.tsx`, `main.tsx` |
| Painel admin React (CMS: módulos, aulas, categorias, anexos, acervo, whitelist, usuários, aparência) | OK | `frontend/src/pages/AdminPanel.tsx` |
| Rota protegida por role (`/admin`) | OK | `frontend/src/components/ProtectedRoute.tsx` |
| Página do Acervo Multimídia (Módulo 6) | OK | `frontend/src/pages/MediaLibrary.tsx` |
| Chat frontend alinhado ao backend (eventos socket + REST) | OK | `frontend/src/pages/CommunityChat.tsx` |
| Correção `useAuthStore` (`/users/profile` → `/users/me`) | OK | `frontend/src/stores/useAuthStore.ts` |
| Helper `assetUrl` (fim de URLs fixas `localhost:3000`) | OK | `frontend/src/services/api.ts` |
| Rate limiting em `/auth` (login/registro) | OK | `backend/src/middlewares/rateLimit.middleware.ts` |
| Validação Zod nos endpoints de autenticação | OK | `backend/src/validators/auth.validators.ts` |
| Broadcast Socket.IO de mensagens enviadas via REST | OK | `backend/src/controllers/chat.controller.ts`, `socket.ts` |
| Ícones PWA reais (192/512) + manifest corrigido | OK | `frontend/public/manifest.json`, `scripts/generate-icons.mjs` |

## 5.4 Pendências recomendadas (produto)

| Item | Prioridade | Notas |
|------|------------|-------|
| Validação Zod nos demais controllers | Média | Auth já validado; estender para whitelist/settings/chat |
| Testes e2e (Playwright) | Média | Fluxos críticos |
| Notificações push (opcional) | Baixa | Fora do escopo inicial |
| Adapter Redis Socket.IO | Baixa | Só se houver 2+ instâncias Node |

## 5.5 Decisões de produto registradas

- **Sem certificados** — não há entidade `Certificate`.
- **100% gratuito** — sem tabela de pagamentos.
- **Vídeos** — streaming via terceiros, não disco compartilhado cPanel.
- **CPF de aluno** — não coletado; apenas staff com hash armazenado (`cpfHash`).
