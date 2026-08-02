# 🌟 Construindo Saberes — Plataforma de Ensino de Espanhol

Plataforma web de aprendizado de espanhol com interface **glassmorphism** em gradientes roxos,
foco na **autonomia do aluno** e **gestão eficiente por administradores**.

O site **nasce vazio**: nenhuma videoaula, simulado, exercício ou mensagem pré-cadastrada.
Todo o conteúdo é publicado pelos administradores pelo painel administrativo.

## Stack

| Camada    | Tecnologia                          |
|-----------|-------------------------------------|
| Back-end  | Node.js + Express                   |
| Front-end | HTML + CSS + JavaScript (vanilla)   |
| Banco     | MySQL (com fallback automático JSON)|
| PWA       | Manifest + Service Worker (offline) |

## 🚀 Como rodar

```bash
npm install
npm start
```

O servidor sobe em **http://localhost:3100** (ou na porta da variável `PORT`, se definida).

## 🔐 Conta de administrador (bootstrap)

Na primeira execução é criado automaticamente o administrador inicial:

| Perfil | E-mail              | Senha         |
|--------|---------------------|---------------|
| Admin  | `kaikyzen@gmail.com`| `kaikyzen123` |

> ⚠️ **Altere esta senha no banco antes de publicar em produção.** Use a área
> "Meu perfil" do painel para atualizar o username e a foto. Para novos
> administradores, libere o e-mail na **Whitelist** do painel.

Alunos se cadastram pela landing page (username, data de nascimento, e-mail e senha) —
a plataforma é 100% gratuita, sem barreiras.

## 🎬 Publicando videoaulas (upload do dispositivo)

No painel admin → **Videoaulas** → **＋ Nova videoaula**, o administrador pode:

- **Enviar o vídeo direto do celular ou computador** (arrastar e soltar ou clicar no
  dropzone) — o arquivo é armazenado em `public/uploads/videos/` e fica disponível
  para reprodução e download pelos alunos.
- Ou colar uma **URL externa** de vídeo (MP4) como alternativa.

Formatos aceitos: MP4, WebM, MOV, MKV, AVI (até **2GB**). O nome do arquivo é
regenerado pelo servidor, a validação rejeita não-vídeos, e ao excluir/substituir
uma aula o arquivo antigo é removido do disco automaticamente. O Service Worker
**nunca** cacheia os vídeos enviados (para não estourar a cota do PWA).

## 📱 PWA — acesso offline

- Instale o app pelo navegador (botão "Instalar o app" na landing ou o menu ⋮ →
  "Instalar aplicativo").
- O **app shell** (páginas, estilos, scripts e ícones) fica disponível offline:
  abra o site sem internet e ele continua funcionando.
- Videoaulas podem ser baixadas individualmente pelo botão **"Baixar"** em cada
  aula (para assistir offline no dispositivo).
- As chamadas de API **nunca** são cacheadas, então chat e painel refletem sempre
  o estado real do servidor.

## 🧭 Áreas da plataforma

- **Landing page** — hero imersivo com as ações Entrar / Criar Conta e o fluxo
  separado para administradores (login e cadastro com CPF + whitelist).
- **Área do aluno** — navegação lateral, módulos (Alfabeto, Saudações, Verbos,
  Gramática, Interpretação, Vocabulário, Escrita), biblioteca de vídeos com busca
  e download, simulados com correção instantânea, chat em tempo real **entre
  alunos** (com botão "Nova conversa"), e perfil customizável (foto e username;
  e-mail e nascimento fixos).
- **Painel administrativo** — visão geral com estatísticas, gestão de usuários,
  **whitelist** para liberar novos administradores por e-mail, CRUD de videoaulas
  e simulados, e **configuração de cores em tempo real** (fundo, destaques e
  transparência) que vale para todo o site instantaneamente.

## 🗄️ Banco de dados

- **Com MySQL:** configure as variáveis `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`,
  `MYSQL_PASSWORD` e `MYSQL_DATABASE` (padrão `construindo_saberes`). O banco e as
  tabelas são criados automaticamente na primeira execução.
- **Sem MySQL:** o servidor detecta a indisponibilidade e usa automaticamente um
  armazenamento JSON em `data/db.json` — a plataforma funciona do mesmo jeito.

## 🔒 Segurança

- Senhas com hash `scrypt` (Node crypto) — sem dependências extras.
- Queries com *prepared statements* no MySQL.
- Whitelist obrigatória para cadastro de novos administradores (primeiro admin é bootstrap).
- Validação de avatar (apenas `data:image/...;base64`) e escape de XSS em todas as
  saídas renderizadas (títulos, URLs, canais de chat, etc.).

## 🖼️ Ícones do PWA

Os ícones em `public/icons/` são gerados por script (sem dependências):

```bash
node scripts/gen-icons.js
```
