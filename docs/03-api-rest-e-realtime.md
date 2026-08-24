# 3. APIs REST e tempo real

Base URL: `{API}/api`  
Autenticação: header `Authorization: Bearer <JWT>` (exceto rotas públicas).

## 3.1 Autenticação

| Método | Rota | Auth | Body | Resposta |
|--------|------|------|------|----------|
| POST | `/auth/register` | — | `{ email, password, dob, username? }` | 201 — aluno |
| POST | `/auth/register/staff` | — | `{ email, password, dob, cpf, username? }` | 201 — teacher/admin via whitelist |
| POST | `/auth/login` | — | `{ email, password }` | 200 — `{ token, user }` |

**Regras:** cadastro com `cpf` no endpoint de aluno é rejeitado (403). Staff exige CPF de 11 dígitos na whitelist.

## 3.2 Settings (CMS visual)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/settings` | — | Tema e logo |
| PUT | `/settings` | Admin | `{ themeColor?, logoUrl? }` |
| POST | `/settings/logo` | Admin | multipart `logo` (5 MB, imagem) |

## 3.3 Whitelist CPF (Admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/whitelist` | Listar CPFs autorizados |
| POST | `/admin/whitelist` | `{ cpf, role: TEACHER \| ADMIN }` |
| DELETE | `/admin/whitelist/:cpf` | Remover |

## 3.4 Módulos, categorias, aulas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/modules` | — | Lista com aulas (resumo) |
| GET | `/modules/:id` | — | Detalhe + aulas + anexos |
| POST/PUT/DELETE | `/modules` | Admin | CRUD |
| PUT | `/modules/reorder` | Admin | `{ order: [{ id, orderIndex }] }` |
| GET | `/categories/module/:moduleId` | — | Categorias ordenadas |
| POST/PUT/DELETE | `/categories` | Admin | CRUD categorias |
| PUT | `/categories/reorder/:moduleId` | Admin | Reordenar |
| GET | `/lessons/module/:moduleId` | — | Aulas do módulo |
| GET | `/lessons/:id` | — | Aula completa |
| POST/PUT | `/lessons` | Staff | CRUD parcial |
| DELETE | `/lessons/:id` | Admin | Remover |
| PUT | `/lessons/reorder/:moduleId` | Admin | Reordenar |

## 3.5 Anexos e biblioteca de mídia

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/attachments/lesson/:lessonId` | — | PDFs/áudios/imagens da aula |
| POST | `/attachments/:lessonId` | Staff | multipart `file` (20 MB) |
| PUT | `/attachments/reorder/:lessonId` | Admin | Reordenar |
| DELETE | `/attachments/:id` | Admin | Remover |
| GET | `/media-library` | — | Acervo (`?moduleId=`) |
| POST | `/media-library` | Staff | Criar item (+ upload opcional) |
| PUT/DELETE | `/media-library/:id` | Staff/Admin | Atualizar / excluir |
| PUT | `/media-library/reorder` | Admin | `{ order: [{ id, orderIndex }] }` |

## 3.6 Progresso e ranking

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/progress/:lessonId` | Marcar conclusão + score |
| GET | `/progress/me` | Progresso do aluno logado |
| GET | `/progress/module/:moduleId` | Progresso por módulo |
| GET | `/progress/leaderboard` | Ranking XP |

## 3.7 Usuários

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/users/me` | User | Perfil |
| PUT | `/users/me` | User | `username`, avatar (multipart) |
| GET | `/users/search?q=` | User | Busca por username/e-mail (≥2 chars) |
| GET | `/users` | Admin | Lista paginada |
| GET | `/users/:userId/progress` | Admin | Progresso (somente leitura) |
| PUT | `/users/:userId/ban` | Admin | Banir |
| PUT | `/users/:userId/unban` | Admin | Desbanir |

**Não existem** rotas admin para editar dados cadastrais de alunos.

## 3.8 Chat (REST)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/chat/rooms/private` | `{ targetUserId }` — idempotente |
| POST | `/chat/rooms/group` | `{ name, memberIds[] }` |
| GET | `/chat/rooms` | Salas do usuário + última mensagem |
| GET | `/chat/rooms/:roomId/messages` | Histórico paginado |
| POST | `/chat/rooms/:roomId/messages` | Texto e/ou `file` (20 MB) |

## 3.9 Health

`GET /api/health` → `{ status, message, timestamp }`

## 3.10 Socket.IO

Conexão: mesmo host/porta da API. Auth: `auth: { token: JWT }`.

| Evento (cliente → servidor) | Payload | Efeito |
|-----------------------------|---------|--------|
| `join_room` | `roomId` | Valida membership; entra na room |
| `leave_room` | `roomId` | Sai da room |
| `send_message` | `{ roomId, content?, mediaUrl?, mediaType? }` | Persiste + `receive_message` |
| `typing` / `stop_typing` | `{ roomId }` | Indicador de digitação |

| Evento (servidor → cliente) | Descrição |
|-----------------------------|-----------|
| `receive_message` | Mensagem completa com `sender` |
| `user_typing` / `user_stop_typing` | Presença |
| `error` | `{ message }` |

### Viabilidade no cPanel

- Uma instância Node com `http.createServer` + Socket.IO é **suportada** se o proxy do cPanel encaminhar **WebSocket** (Upgrade) para a app.
- Se WebSocket estiver bloqueado, fallback: polling longo do Socket.IO (ativado por padrão) — maior latência, mas funcional.
- Escalar horizontalmente (várias instâncias Node) **não** é assumido; para múltiplos workers seria necessário adapter Redis (fora do escopo Targethost básico).

## 3.11 Códigos de erro comuns

| HTTP | Situação |
|------|----------|
| 401 | Token ausente/inválido |
| 403 | Banido, CPF não autorizado, não-membro da sala |
| 413 | Upload > 20 MB |
| 415 | MIME não permitido |
