# Espanhol em Rede: Conectando Saberes

Plataforma gratuita de ensino de espanhol (React + Node.js + MySQL), preparada para deploy na **Targethost**.

## Documentação

Consulte **[docs/README.md](./docs/README.md)** para stack, modelo de dados, APIs, deploy e PWA.

## Início rápido

```bash
# Backend
cd backend
cp .env.example .env   # configure DATABASE_URL e JWT_SECRET
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev

# Frontend (outro terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Status de implementação

O projeto está **funcional de ponta a ponta**:

- ✅ Backend completo (auth + whitelist CPF, CMS visual, módulos/aulas/categorias/anexos, acervo multimídia, progresso/XP, chat REST + Socket.IO, uploads 20 MB)
- ✅ Frontend roteado (`/`, `/lessons/:id`, `/leaderboard`, `/chat`, `/acervo`, `/login`, `/register`)
- ✅ Painel Admin (`/admin`) — CMS com reordenação, whitelist CPF, usuários e aparência
- ✅ PWA instalável (ícones 192/512 gerados, manifest válido, Service Worker offline)
- ✅ Segurança básica: rate limiting em `/auth` + validação Zod

Pendências futuras: validação Zod nos demais controllers, testes e2e (Playwright), notificações push e adapter Redis (2+ instâncias Node).

## Estrutura

- `frontend/` — PWA React/Vite
- `backend/` — API Express, Prisma, Socket.IO
- `docs/` — Especificação técnica
- `deploy/` — Exemplos Apache/cPanel

## Licença

ISC (ajuste conforme política institucional do projeto).
