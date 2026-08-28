# 1. Stack tecnológica (Targethost)

## 1.1 Princípio de separação

A Targethost (CloudLinux + cPanel) exige tratar **front-end** e **back-end** de forma distinta:

| Camada | Tecnologia | Onde roda no cPanel |
|--------|------------|---------------------|
| UI | **React 19** + **TypeScript** + **Vite 8** | `public_html/` (artefatos de `npm run build`) |
| Estado / rotas | **Zustand**, **React Router 7** | Bundled no JS estático |
| HTTP | **Axios** | Chamadas a `/api` ou subdomínio `api.dominio.com` |
| Tempo real | **socket.io-client** | WebSocket via proxy reverso para a app Node |
| API | **Node.js 20+**, **Express 5**, **TypeScript** | **Setup Node.js App** do cPanel |
| ORM | **Prisma 7** (`provider = mysql`) | Migrações contra MySQL da hospedagem |
| Auth | **JWT** (7 dias) + **bcrypt** (10 rounds) | Variável `JWT_SECRET` no ambiente |
| Validação | **Zod** (recomendado expandir nos controllers) | — |
| Uploads | **Multer** (20 MB, whitelist MIME) | Disco: `backend/uploads/` |
| Chat | **Socket.IO 4** no mesmo processo HTTP | Compartilha porta com Express |

## 1.2 Por que esta stack

- **Vite**: build rápido, chunks otimizados, ideal para deploy estático no cPanel.
- **Express + um único processo Node**: compatível com limites de apps Node gerenciadas (sem exigir Kubernetes).
- **Prisma**: schema versionado, migrations e tipagem alinhadas ao MySQL nativo da Targethost.
- **Socket.IO**: chat 1:1 e grupo com persistência em `Message`; alternativa pura WebSocket exigiria mais código sem ganho claro no cPanel.

## 1.3 Variáveis de ambiente

### Backend (`backend/.env`)

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco"
JWT_SECRET="string-longa-aleatoria"
PORT=3000
CORS_ORIGIN="https://seudominio.com.br"
PUBLIC_API_URL="https://api.seudominio.com.br"
```

### Frontend (`frontend/.env.production`)

```env
VITE_API_URL="https://api.seudominio.com.br"
VITE_SOCKET_URL="https://api.seudominio.com.br"
```

## 1.4 Scripts de desenvolvimento

```bash
# Backend
cd backend && npm install && npx prisma migrate deploy && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## 1.5 RBAC (papéis)

| Role | Cadastro | Permissões principais |
|------|----------|------------------------|
| `STUDENT` | e-mail, senha, data de nascimento | Estudar, chat, progresso, perfil próprio |
| `TEACHER` | + CPF na whitelist | CRUD de aulas/anexos (não deleta módulos) |
| `ADMIN` | + CPF na whitelist | CMS, whitelist CPF, banimentos, reordenação, settings |

**Privacidade:** não há rotas para admin alterar e-mail, senha, nome ou avatar de alunos — apenas `ban`/`unban` e leitura de progresso agregado.

## 1.6 Identidade visual dinâmica

- Tabela `AppSettings` (singleton `id = 1`).
- `GET /api/settings` público → front aplica `themeColor` (CSS variables) e `logoUrl`.
- Admin: `PUT /api/settings` e upload de logo via `POST /api/settings/logo`.
