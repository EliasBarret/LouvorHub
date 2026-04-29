# LouvorHub — API Backend

> **[English version below](#english-version)**

---

## 🇧🇷 Versão em Português

Backend completo em **NestJS** para o sistema de gestão de louvor **LouvorHub**, conectado ao Supabase (PostgreSQL) via **Prisma ORM**.

---

## 🚀 Tecnologias

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **NestJS** | 11 | Framework Node.js modular |
| **Prisma** | 7 | ORM com migrations |
| **PostgreSQL** | (Supabase) | Banco de dados |
| **JWT + Passport** | — | Autenticação e autorização |
| **bcrypt** | — | Hash de senhas (10 rounds) |
| **@nestjs/throttler** | — | Rate limiting (100 req/min por IP) |
| **Nodemailer** | — | Envio de e-mails (verificação e redefinição de senha) |
| **class-validator** | — | Validação de DTOs |
| **class-transformer** | — | Transformação de payloads |
| **Swagger** | — | Documentação automática da API |

---

## ⚙️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres?schema=public&sslmode=require"
JWT_SECRET="troque_por_um_segredo_forte"
JWT_EXPIRES_IN="7d"
PORT=3000
CORS_ORIGINS="http://localhost:4200"

# E-mail (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu@email.com"
SMTP_PASS="sua_senha_de_app"
EMAIL_FROM="LouvorHub <seu@email.com>"
FRONTEND_URL="http://localhost:4200"
```

### 3. Gerar o Prisma Client

```bash
npx prisma generate
```

### 4. Rodar as migrations

```bash
# Produção / deploy
npx prisma migrate deploy

# Desenvolvimento (com reset)
npx prisma migrate dev --name init
```

### 5. Iniciar o servidor

```bash
# Desenvolvimento (watch mode)
npm run start:dev

# Produção
npm run build && npm run start:prod
```

---

## 📚 Documentação Swagger

Após iniciar o servidor, acesse:

```
http://localhost:3000/api/docs
```

---

## 🔐 Autenticação

- **Estratégia**: JWT Bearer Token (via Passport.js)
- **Expiração**: Configurável via `JWT_EXPIRES_IN` (padrão: 7 dias)
- **Guard global**: Todas as rotas são protegidas por padrão. Rotas públicas usam o decorator `@Public()`.
- **Verificação de e-mail**: Token com validade de 24h enviado no cadastro.
- **Redefinição de senha**: Senha provisória por e-mail com validade de 2h.

Todas as rotas protegidas exigem o header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 👥 Perfis e Papéis

| Perfil | Descrição |
|--------|-----------|
| `ADM` | Administrador — acesso total |
| `Pastor` | Pode aprovar/reprovar repertórios |
| `Ministro` | Pode criar e editar repertórios |
| `Musico` | Músico instrumentista |
| `Cantor` | Cantor |

---

## 📡 Endpoints

> Todas as rotas usam o prefixo `/api`. Todas exigem autenticação JWT, exceto as marcadas como **Público**.

---

### 🔑 Auth — `/api/auth`

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| POST | `/register` | Cadastrar novo usuário (envia e-mail de verificação) | Público |
| POST | `/login` | Autenticar e obter token JWT | Público |
| POST | `/forgot-password` | Solicitar redefinição de senha por e-mail | Público |
| GET | `/verify-email?token=...` | Confirmar e-mail com token | Público |
| POST | `/resend-verification` | Reenviar e-mail de verificação | Público |
| POST | `/change-password` | Alterar senha do usuário autenticado | JWT |

---

### 👤 Usuários — `/api/usuarios`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/me` | Dados do usuário logado |
| GET | `/me/stats` | Estatísticas do usuário (cultos, músicas confirmadas, repertórios) |
| PUT | `/me` | Atualizar perfil |
| GET | `/` | Listar membros (paginado: `pagina`, `tamanhoPagina`) |
| GET | `/:id` | Buscar membro por ID |

---

### ⛪ Igrejas — `/api/igrejas`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar igrejas |
| GET | `/:id` | Buscar por ID |
| GET | `/:id/membros` | Listar membros da igreja |
| GET | `/usuario/:usuarioId` | Igrejas de um usuário |
| POST | `/` | Criar igreja |
| POST | `/:id/membros` | Adicionar membro à igreja |
| PUT | `/:id` | Atualizar igreja |
| DELETE | `/:id` | Remover igreja |
| DELETE | `/membros/:membroId` | Remover membro da igreja |

---

### 🎵 Músicas — `/api/musicas`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar músicas (paginado) |
| GET | `/buscar?q=...` | Pesquisar por título, artista ou tom |
| GET | `/tags` | Listar tags disponíveis |
| GET | `/tons` | Listar tons disponíveis |
| GET | `/instrumentos` | Listar instrumentos disponíveis |
| GET | `/:id` | Buscar música por ID |
| GET | `/:id/historico` | Histórico de uso (últimas 10 ocorrências) |
| POST | `/` | Criar música |
| PUT | `/:id` | Atualizar música |
| DELETE | `/:id` | Remover música |

**Campos da música**: `titulo`, `artista`, `tom`, `tomFeminino`, `bpm`, `tipos` (array de `TipoMusica`), `linkYoutube`, `linkSpotify`, `observacoes`, `tagIds`

**Enum `TipoMusica`**: `Adoracao`, `Solo`, `Ofertorio`, `Abertura`, `DistribuicaoElementos`, `Apelo`

---

### 📋 Repertórios — `/api/repertorios`

| Método | Rota | Descrição | Perfil Mínimo |
|--------|------|-----------|---------------|
| GET | `/` | Listar repertórios (paginado) | Qualquer |
| GET | `/pendentes` | Repertórios pendentes de aprovação | Qualquer |
| GET | `/tipos-culto` | Tipos de culto disponíveis | Qualquer |
| GET | `/:id` | Buscar por ID | Qualquer |
| POST | `/` | Criar repertório | ADM / Pastor / Ministro |
| PUT | `/:id` | Atualizar repertório | ADM / Pastor / Ministro |
| PATCH | `/:id/publicar` | Enviar para aprovação | Qualquer |
| PATCH | `/:id/aprovar` | Aprovar repertório | Pastor / ADM |
| PATCH | `/:id/reprovar` | Reprovar repertório | Pastor / ADM |
| DELETE | `/:id` | Remover repertório | Qualquer |

**Status do repertório**: `aguardando_aprovacao` · `aprovado` · `reprovado`

**Estrutura interna**: as músicas são organizadas em **blocos** (`BlocoRepertorio`) com nome, ordem e descrição. Cada música pode ter um `tomOverride` específico para aquele culto.

---

### 📅 Escalações — `/api/escalacoes` e `/api/confirmacoes`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/escalacoes/minhas` | Minhas escalações (resumo) |
| GET | `/escalacoes/detalhe/:repertorioId` | Detalhe da escalação por repertório |
| POST | `/escalacoes` | Escalar músico para repertório |
| DELETE | `/escalacoes/:id` | Remover músico do repertório |
| POST | `/confirmacoes` | Confirmar/negar conhecimento de música |
| GET | `/confirmacoes/repertorio/:id` | Visão geral das confirmações do repertório |

**Status de confirmação**: `conhece` · `nao_conhece` · `pendente`

---

### 🔔 Notificações — `/api/notificacoes`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar notificações (paginado) |
| GET | `/nao-lidas/count` | Contagem de não lidas |
| PATCH | `/marcar-todas-lidas` | Marcar todas como lidas |
| PATCH | `/:id/lida` | Marcar notificação como lida |

**Tipos de notificação**: `escalacao`, `confirmacao`, `aviso`, `sistema`, `lembrete_culto`, `lembrete_culto_hora`, `repertorio_alterado`, `repertorio_aprovado`, `repertorio_reprovado`, `repertorio_pendente_aprovacao`, `confirmacao_pendente`, `musico_confirmou`

---

### ⛪ Tipos de Culto — `/api/tipos-culto`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar tipos de culto (filtro opcional: `?igrejaId=`) |
| GET | `/:id` | Buscar por ID |
| POST | `/` | Criar tipo de culto |
| PUT | `/:id` | Atualizar |
| DELETE | `/:id` | Remover |

---

### 📊 Dashboard — `/api/dashboard`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/stats` | Cards de estatísticas do usuário |
| GET | `/escalacoes` | Próximas escalações do usuário |

---

## 📦 Exemplos de Requisições

### Cadastro de usuário
```json
POST /api/auth/register
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "senha123",
  "funcao": "Violonista",
  "ministerio": "Ministério de Louvor"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "joao@email.com",
  "senha": "senha123"
}
```

### Criar música
```json
POST /api/musicas
Authorization: Bearer <token>
{
  "titulo": "Deus de Promessas",
  "artista": "Toque no Altar",
  "tom": "G",
  "tomFeminino": "E",
  "bpm": 72,
  "tipos": ["Adoracao"],
  "tagIds": [1, 3],
  "linkYoutube": "https://youtu.be/exemplo",
  "observacoes": "Capo 2 no violão"
}
```

### Criar repertório
```json
POST /api/repertorios
Authorization: Bearer <token>
{
  "nome": "Culto de Domingo — Manhã",
  "dataCulto": "2026-04-20",
  "horario": "10:00",
  "horarioFim": "12:00",
  "tipoCulto": "Culto de Domingo — Manhã",
  "igrejaId": 1
}
```

### Escalar músico
```json
POST /api/escalacoes
Authorization: Bearer <token>
{
  "repertorioId": 1,
  "usuarioId": 2,
  "musicasEscaladas": [
    { "musicaId": 1, "instrumento": "Violão" },
    { "musicaId": 2, "instrumento": "Violão" }
  ]
}
```

### Confirmar música
```json
POST /api/confirmacoes
Authorization: Bearer <token>
{
  "escalacaoMusicoId": 1,
  "musicaId": 1,
  "status": "conhece"
}
```

---

## 🗄️ Modelos do Banco de Dados

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Usuários do sistema |
| `igrejas` | Igrejas cadastradas |
| `membros_igrejas` | Relação usuário ↔ igreja com perfil |
| `musicas` | Catálogo de músicas |
| `tags` | Tags de categorização |
| `musicas_tags` | Relação música ↔ tag |
| `repertorios` | Repertórios de culto |
| `blocos_repertorio` | Blocos de músicas dentro do repertório |
| `repertorios_musicas` | Relação repertório ↔ música com tom override e ordem |
| `aprovacoes_repertorios` | Histórico de aprovações |
| `escalacoes_musicos` | Músicos escalados por repertório |
| `musicas_escaladas` | Músicas por escalação (com instrumento) |
| `confirmacoes_musicas` | Confirmações de conhecimento |
| `notificacoes` | Notificações dos usuários |
| `tipos_culto` | Tipos de culto por igreja |

---

## 🗂️ Estrutura do Projeto

```
src/
├── auth/           # Autenticação JWT, guards, estratégias
├── usuarios/       # Gestão de usuários e perfis
├── igrejas/        # Gestão de igrejas e membros
├── musicas/        # Catálogo de músicas e tags
├── repertorios/    # Repertórios com blocos e fluxo de aprovação
├── escalacoes/     # Escalações e confirmações de músicos
├── notificacoes/   # Central de notificações com scheduler
├── tipos-culto/    # Tipos de culto por igreja
├── dashboard/      # Estatísticas e próximos eventos
├── email/          # Serviço de envio de e-mails
├── prisma/         # Módulo e serviço do Prisma
└── common/         # Guards, interceptors, pipes, decorators globais
```

---

---

## 🇺🇸 English Version

<a name="english-version"></a>

Full **NestJS** backend for the **LouvorHub** worship management system, connected to Supabase (PostgreSQL) via **Prisma ORM**.

---

## 🚀 Tech Stack

| Technology | Version | Description |
|------------|---------|-------------|
| **NestJS** | 11 | Modular Node.js framework |
| **Prisma** | 7 | ORM with migrations |
| **PostgreSQL** | (Supabase) | Database |
| **JWT + Passport** | — | Authentication & authorization |
| **bcrypt** | — | Password hashing (10 rounds) |
| **@nestjs/throttler** | — | Rate limiting (100 req/min per IP) |
| **Nodemailer** | — | Email sending (verification & password reset) |
| **class-validator** | — | DTO validation |
| **class-transformer** | — | Payload transformation |
| **Swagger** | — | Automatic API documentation |

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?schema=public&sslmode=require"
JWT_SECRET="replace_with_a_strong_secret"
JWT_EXPIRES_IN="7d"
PORT=3000
CORS_ORIGINS="http://localhost:4200"

# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your@email.com"
SMTP_PASS="your_app_password"
EMAIL_FROM="LouvorHub <your@email.com>"
FRONTEND_URL="http://localhost:4200"
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run migrations

```bash
# Production / deploy
npx prisma migrate deploy

# Development (with reset)
npx prisma migrate dev --name init
```

### 5. Start the server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build && npm run start:prod
```

---

## 📚 Swagger Documentation

After starting the server, access:

```
http://localhost:3000/api/docs
```

---

## 🔐 Authentication

- **Strategy**: JWT Bearer Token (via Passport.js)
- **Expiration**: Configurable via `JWT_EXPIRES_IN` (default: 7 days)
- **Global Guard**: All routes are protected by default. Public routes use the `@Public()` decorator.
- **Email verification**: 24-hour token sent on registration.
- **Password reset**: Provisional password via email with 2-hour expiry.

All protected routes require the header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 👥 Roles & Profiles

| Profile | Description |
|---------|-------------|
| `ADM` | Administrator — full access |
| `Pastor` | Can approve/reject repertoires |
| `Ministro` | Can create and edit repertoires |
| `Musico` | Instrumentalist musician |
| `Cantor` | Singer |

---

## 📡 Endpoints

> All routes use the `/api` prefix. All require JWT authentication unless marked as **Public**.

---

### 🔑 Auth — `/api/auth`

| Method | Route | Description | Access |
|--------|-------|-------------|--------|
| POST | `/register` | Register new user (sends verification email) | Public |
| POST | `/login` | Authenticate and get JWT token | Public |
| POST | `/forgot-password` | Request password reset email | Public |
| GET | `/verify-email?token=...` | Confirm email with token | Public |
| POST | `/resend-verification` | Resend verification email | Public |
| POST | `/change-password` | Change authenticated user's password | JWT |

---

### 👤 Users — `/api/usuarios`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/me` | Get authenticated user data |
| GET | `/me/stats` | Get user statistics (services, confirmed songs, repertoires) |
| PUT | `/me` | Update profile |
| GET | `/` | List members (paginated: `pagina`, `tamanhoPagina`) |
| GET | `/:id` | Get member by ID |

---

### ⛪ Churches — `/api/igrejas`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List churches |
| GET | `/:id` | Get by ID |
| GET | `/:id/membros` | List church members |
| GET | `/usuario/:usuarioId` | Get churches for a user |
| POST | `/` | Create church |
| POST | `/:id/membros` | Add member to church |
| PUT | `/:id` | Update church |
| DELETE | `/:id` | Delete church |
| DELETE | `/membros/:membroId` | Remove member from church |

---

### 🎵 Songs — `/api/musicas`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List songs (paginated) |
| GET | `/buscar?q=...` | Search by title, artist or key |
| GET | `/tags` | List available tags |
| GET | `/tons` | List available musical keys |
| GET | `/instrumentos` | List available instruments |
| GET | `/:id` | Get song by ID |
| GET | `/:id/historico` | Usage history (last 10 occurrences) |
| POST | `/` | Create song |
| PUT | `/:id` | Update song |
| DELETE | `/:id` | Delete song |

**Song fields**: `titulo`, `artista`, `tom`, `tomFeminino`, `bpm`, `tipos` (`TipoMusica[]`), `linkYoutube`, `linkSpotify`, `observacoes`, `tagIds`

**`TipoMusica` enum**: `Adoracao`, `Solo`, `Ofertorio`, `Abertura`, `DistribuicaoElementos`, `Apelo`

---

### 📋 Repertoires — `/api/repertorios`

| Method | Route | Description | Min. Role |
|--------|-------|-------------|-----------|
| GET | `/` | List repertoires (paginated) | Any |
| GET | `/pendentes` | Pending approval repertoires | Any |
| GET | `/tipos-culto` | Available worship service types | Any |
| GET | `/:id` | Get by ID | Any |
| POST | `/` | Create repertoire | ADM / Pastor / Ministro |
| PUT | `/:id` | Update repertoire | ADM / Pastor / Ministro |
| PATCH | `/:id/publicar` | Submit for approval | Any |
| PATCH | `/:id/aprovar` | Approve repertoire | Pastor / ADM |
| PATCH | `/:id/reprovar` | Reject repertoire | Pastor / ADM |
| DELETE | `/:id` | Delete repertoire | Any |

**Statuses**: `aguardando_aprovacao` · `aprovado` · `reprovado`

**Internal structure**: Songs are organized into **blocks** (`BlocoRepertorio`) with name, order, and description. Each song can have a `tomOverride` specific to that service.

---

### 📅 Escalations — `/api/escalacoes` and `/api/confirmacoes`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/escalacoes/minhas` | My escalations (summary) |
| GET | `/escalacoes/detalhe/:repertorioId` | Escalation details by repertoire |
| POST | `/escalacoes` | Schedule musician to repertoire |
| DELETE | `/escalacoes/:id` | Remove musician from repertoire |
| POST | `/confirmacoes` | Confirm/deny song knowledge |
| GET | `/confirmacoes/repertorio/:id` | Overview of confirmations for a repertoire |

**Confirmation statuses**: `conhece` · `nao_conhece` · `pendente`

---

### 🔔 Notifications — `/api/notificacoes`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List notifications (paginated) |
| GET | `/nao-lidas/count` | Count unread notifications |
| PATCH | `/marcar-todas-lidas` | Mark all as read |
| PATCH | `/:id/lida` | Mark notification as read |

**Notification types**: `escalacao`, `confirmacao`, `aviso`, `sistema`, `lembrete_culto`, `lembrete_culto_hora`, `repertorio_alterado`, `repertorio_aprovado`, `repertorio_reprovado`, `repertorio_pendente_aprovacao`, `confirmacao_pendente`, `musico_confirmou`

---

### ⛪ Worship Service Types — `/api/tipos-culto`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List worship types (optional filter: `?igrejaId=`) |
| GET | `/:id` | Get by ID |
| POST | `/` | Create worship type |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

---

### 📊 Dashboard — `/api/dashboard`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/stats` | User statistics cards |
| GET | `/escalacoes` | User's upcoming escalations |

---

## 🗄️ Database Models

| Table | Description |
|-------|-------------|
| `usuarios` | System users |
| `igrejas` | Registered churches |
| `membros_igrejas` | User ↔ church relation with role |
| `musicas` | Song catalog |
| `tags` | Categorization tags |
| `musicas_tags` | Song ↔ tag relation |
| `repertorios` | Worship service repertoires |
| `blocos_repertorio` | Song blocks within a repertoire |
| `repertorios_musicas` | Repertoire ↔ song with key override and order |
| `aprovacoes_repertorios` | Approval history |
| `escalacoes_musicos` | Musicians scheduled per repertoire |
| `musicas_escaladas` | Songs per escalation (with instrument) |
| `confirmacoes_musicas` | Song knowledge confirmations |
| `notificacoes` | User notifications |
| `tipos_culto` | Worship service types per church |

---

## 🗂️ Project Structure

```
src/
├── auth/           # JWT auth, guards, strategies
├── usuarios/       # User and profile management
├── igrejas/        # Church and member management
├── musicas/        # Song catalog and tags
├── repertorios/    # Repertoires with blocks and approval flow
├── escalacoes/     # Musician escalations and confirmations
├── notificacoes/   # Notification center with scheduler
├── tipos-culto/    # Worship service types per church
├── dashboard/      # Statistics and upcoming events
├── email/          # Email sending service
├── prisma/         # Prisma module and service
└── common/         # Global guards, interceptors, pipes, decorators
```
