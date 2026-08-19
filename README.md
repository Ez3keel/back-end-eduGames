# EduGames — Backend

API REST em Node.js/Express que dá suporte a cadastro, autenticação e gerenciamento de conta de usuários da plataforma EduGames (TCC — Gamificação no ensino). O back-end é restrito ao gerenciamento de usuários; os jogos em si não persistem dados no servidor.

## Stack

- **Node.js + Express** — API REST
- **MongoDB (Atlas) + Mongoose** — persistência de dados de usuário
- **JWT** (`jsonwebtoken`) — autenticação stateless (access token + refresh token)
- **bcryptjs** — hash de senhas
- **crypto (AES-256-GCM)** — criptografia de dados pessoais (nome e e-mail) em repouso
- **Nodemailer + SMTP (Brevo)** — envio de e-mail de redefinição de senha
- **helmet, cors, express-rate-limit, cookie-parser** — segurança e proteção de rotas

## Arquitetura

```
src/
  index.js              # bootstrap do Express, middlewares globais, rotas
  config/db.js           # conexão com MongoDB
  models/User.js         # schema de usuário (PII criptografada, senha em hash)
  controllers/           # regras de negócio (auth, user)
  routes/                # definição das rotas REST
  middleware/             # authMiddleware (valida JWT em rotas protegidas)
  utils/
    tokens.js             # geração/verificação de JWT, cookie de refresh
    crypto.js              # criptografia AES-256-GCM + hash HMAC para busca
    mailer.js               # envio de e-mail via SMTP
    asyncHandler.js          # wrapper para tratamento de erros async
```

### Segurança dos dados

- Senhas nunca são armazenadas em texto puro: passam por hash com **bcrypt** (irreversível).
- Nome e e-mail são armazenados **criptografados** (AES-256-GCM). Como o ciphertext muda a cada gravação, um hash HMAC determinístico (`emailHash`) é usado só para permitir busca/unicidade sem expor o dado.
- Autenticação via **JWT**: access token de curta duração (15 min) + refresh token em cookie `httpOnly` (7 dias), renovado automaticamente.
- Redefinição de senha usa um token aleatório de uso único, com validade de 1 hora; apenas o hash SHA-256 do token é salvo no banco.

## Rotas

| Método | Rota | Descrição | Autenticado |
|---|---|---|---|
| POST | `/api/auth/register` | Cria conta e já autentica | Não |
| POST | `/api/auth/login` | Login com usuário/e-mail + senha | Não |
| POST | `/api/auth/refresh` | Renova o access token via cookie | Não |
| POST | `/api/auth/logout` | Encerra a sessão | Não |
| POST | `/api/auth/forgot-password` | Envia e-mail de redefinição de senha | Não |
| POST | `/api/auth/reset-password` | Redefine a senha com o token do e-mail | Não |
| GET | `/api/users/me` | Retorna o perfil do usuário logado | Sim |
| PATCH | `/api/users/me` | Atualiza usuário/e-mail | Sim |
| PATCH | `/api/users/me/password` | Troca a senha (exige senha atual) | Sim |
| GET | `/api/health` | Healthcheck | Não |

## Como rodar localmente

```bash
npm install
cp .env.example .env   # preencha com suas credenciais
npm run dev
```

## Variáveis de ambiente

Veja `.env.example` para a lista completa. Resumo:

- `MONGODB_URI` — string de conexão do MongoDB Atlas
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — segredos para assinar os tokens (gere com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
- `ENCRYPTION_KEY` / `HASH_KEY` — chaves de 32 bytes em base64 para criptografia de PII (gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` — credenciais SMTP (Brevo em produção)
- `FRONTEND_URL` — origem permitida no CORS e usada para montar o link de redefinição de senha

**Nunca** commite o arquivo `.env` — ele já está no `.gitignore`.

## Deploy (Render)

1. Crie um novo *Web Service* no [Render](https://render.com) apontando para este diretório do repositório.
2. Build command: `npm install` — Start command: `npm start`.
3. Configure as mesmas variáveis de ambiente do `.env` no painel do Render (Settings → Environment).
4. Atualize `FRONTEND_URL` para a URL de produção do front-end (Vercel) e, no front-end, `NEXT_PUBLIC_API_URL` para a URL do Render.
