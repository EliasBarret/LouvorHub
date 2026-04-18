# LouvorHub — API Backend

Backend completo em **NestJS** para o sistema de gestão de louvor **LouvorHub**, conectado ao Supabase (PostgreSQL) via **Prisma ORM**.

---

## 🚀 Tecnologias

- **NestJS 11** — Framework Node.js modular
- **Prisma 7** — ORM com migrations
- **PostgreSQL** (Supabase) — Banco de dados
- **JWT + Passport** — Autenticação e autorização
- **Swagger** — Documentação automática da API
- **class-validator** — Validação de DTOs

---

## ⚙️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e preencha as variáveis:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.vxccbvnlotbgiawgesdb.supabase.co:5432/postgres?schema=public&sslmode=require"
JWT_SECRET="troque_por_um_segredo_forte"
JWT_EXPIRES_IN="7d"
PORT=3000
CORS_ORIGINS="http://localhost:4200"
```

### 3. Gerar o Prisma Client

```bash
npx prisma generate
```

### 4. Rodar as migrations (cria todas as tabelas no Supabase)

```bash
npx prisma migrate deploy
```

> Para desenvolvimento (com reset):
> ```bash
> npx prisma migrate dev --name init
> ```

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

## 📡 Endpoints Principais

### Auth
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Cadastrar novo usuário |
| POST | `/api/auth/login` | Login e obter JWT |

### Usuários
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/usuarios/me` | Dados do usuário logado |
| PUT | `/api/usuarios/me` | Atualizar perfil |
| GET | `/api/usuarios` | Listar membros |
| GET | `/api/usuarios/:id` | Buscar por ID |

### Igrejas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/igrejas` | Listar igrejas |
| POST | `/api/igrejas` | Criar igreja |
| PUT | `/api/igrejas/:id` | Atualizar igreja |
| DELETE | `/api/igrejas/:id` | Remover igreja |
| GET | `/api/igrejas/:id/membros` | Membros da igreja |
| POST | `/api/igrejas/:id/membros` | Adicionar membro |
| DELETE | `/api/igrejas/membros/:membroId` | Remover membro |

### Músicas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/musicas` | Listar músicas |
| GET | `/api/musicas/:id` | Buscar por ID |
| POST | `/api/musicas` | Criar música |
| PUT | `/api/musicas/:id` | Atualizar música |
| DELETE | `/api/musicas/:id` | Remover música |
| GET | `/api/musicas/tags` | Listar tags |
| GET | `/api/musicas/tons` | Listar tons |
| GET | `/api/musicas/instrumentos` | Listar instrumentos |

### Repertórios
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/repertorios` | Listar repertórios |
| GET | `/api/repertorios/:id` | Buscar por ID |
| POST | `/api/repertorios` | Criar repertório |
| PUT | `/api/repertorios/:id` | Atualizar repertório |
| DELETE | `/api/repertorios/:id` | Remover repertório |
| PATCH | `/api/repertorios/:id/publicar` | Enviar para aprovação |
| PATCH | `/api/repertorios/:id/aprovar` | Aprovar (pastor) |
| PATCH | `/api/repertorios/:id/reprovar` | Reprovar (pastor) |
| GET | `/api/repertorios/pendentes` | Pendentes de aprovação |
| GET | `/api/repertorios/tipos-culto` | Tipos de culto |

### Escalações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/escalacoes/minhas` | Minhas escalações |
| GET | `/api/escalacoes/detalhe/:repertorioId` | Detalhe da escalação |
| POST | `/api/escalacoes` | Escalar músico |
| DELETE | `/api/escalacoes/:id` | Remover músico |

### Confirmações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/confirmacoes` | Confirmar/negar música |
| GET | `/api/confirmacoes/repertorio/:id` | Status de confirmações |

### Notificações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/notificacoes` | Listar notificações |
| PATCH | `/api/notificacoes/:id/lida` | Marcar como lida |
| PATCH | `/api/notificacoes/marcar-todas-lidas` | Marcar todas lidas |
| GET | `/api/notificacoes/nao-lidas/count` | Contagem não lidas |

### Dashboard
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/dashboard/stats` | Cards de estatísticas |
| GET | `/api/dashboard/escalacoes` | Próximas escalações |

---

## 🔐 Autenticação

Todas as rotas (exceto `/api/auth/login` e `/api/auth/register`) exigem o header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📋 Exemplos de Requisições

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
  "bpm": 72,
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
  "tipoCulto": "Culto de Domingo — Manhã",
  "igrejaId": 1,
  "musicasIds": [1, 2, 3, 4, 5]
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

## 🗄️ Estrutura do Banco de Dados

```
usuarios          — Usuários do sistema
igrejas           — Igrejas cadastradas
membros_igrejas   — Relação usuário ↔ igreja com perfil
musicas           — Catálogo de músicas
tags              — Tags de categorização
musicas_tags      — Relação musica ↔ tag
repertorios       — Repertórios de culto
repertorios_musicas — Relação repertório ↔ música
aprovacoes_repertorios — Histórico de aprovações
escalacoes_musicos — Músicos escalados por repertório
musicas_escaladas — Músicas por escalação (com instrumento)
confirmacoes_musicas — Confirmações de conhecimento
notificacoes      — Notificações dos usuários
```
