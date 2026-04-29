# LouvorHub — Frontend

> **[English version below](#english-version)**

---

## 🇧🇷 Versão em Português

Frontend do sistema **LouvorHub** de gestão de louvor para igrejas, construído com **Angular 19** (componentes standalone).

---

## 🚀 Tecnologias

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Angular** | 19.2 | Framework SPA com componentes standalone |
| **TypeScript** | ~5.7 | Linguagem principal |
| **RxJS** | ~7.8 | Programação reativa |
| **Angular Router** | — | Roteamento com lazy loading |
| **Reactive Forms** | — | Formulários reativos |
| **HttpClient** | — | Comunicação com a API |
| **SCSS** | — | Estilização |
| **Jasmine / Karma** | — | Testes unitários |

---

## ⚙️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o ambiente

Edite o arquivo `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### 3. Iniciar o servidor de desenvolvimento

```bash
ng serve
```

Acesse em: `http://localhost:4200`

### 4. Build para produção

```bash
ng build
```

Os artefatos são gerados na pasta `dist/`.

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── app.routes.ts         # Definição de rotas
│   ├── app.config.ts         # Configuração global (interceptors, etc.)
│   ├── layout/
│   │   ├── main-layout/      # Layout principal com sidebar e topbar
│   │   ├── sidebar/          # Menu lateral com itens por perfil
│   │   └── topbar/           # Barra superior com badge de notificações
│   ├── pages/
│   │   ├── login/            # Login, cadastro e recuperação de senha
│   │   ├── verificar-email/  # Verificação de e-mail
│   │   ├── home/             # Dashboard com estatísticas
│   │   ├── repertorios/      # Listagem de repertórios
│   │   ├── cadastro-repertorio/  # Criar/editar repertório
│   │   ├── repertorio-detail/    # Visualizar repertório
│   │   ├── status-confirmacoes/  # Status de confirmações por músico
│   │   ├── aprovacoes/       # Fluxo de aprovação (Pastor/ADM)
│   │   ├── musicas/          # Catálogo de músicas (admin)
│   │   ├── cadastro-musica/  # Criar/editar música
│   │   ├── notificacoes/     # Central de notificações
│   │   ├── gestao-igrejas/   # Gestão de igrejas e membros
│   │   ├── gestao-cultos/    # Tipos de culto
│   │   ├── calendario/       # Visão de calendário
│   │   └── meu-perfil/       # Perfil do usuário
│   ├── services/             # Serviços de comunicação com a API
│   ├── guards/               # Guards de rota (auth, perfil)
│   ├── data/                 # Modelos e interfaces TypeScript
│   └── pipes/                # Pipes customizados (TomDisplay)
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

---

## 🗺️ Rotas da Aplicação

| Rota | Componente | Protegida | Perfil Necessário |
|------|------------|-----------|-------------------|
| `/login` | LoginComponent | ❌ | — |
| `/verificar-email` | VerificarEmailComponent | ❌ | — |
| `/inicio` | HomeComponent | ✅ | Qualquer |
| `/repertorios` | RepertoriosComponent | ✅ | Qualquer |
| `/repertorios/novo` | CadastroRepertorioComponent | ✅ | Qualquer |
| `/repertorios/:id/editar` | CadastroRepertorioComponent | ✅ | Qualquer |
| `/repertorios/:id` | RepertorioDetailComponent | ✅ | Qualquer |
| `/repertorios/:id/confirmacoes` | StatusConfirmacoesComponent | ✅ | Qualquer |
| `/musicas` | MusicasComponent | ✅ | ADM / Pastor / Ministro |
| `/musicas/nova` | CadastroMusicaComponent | ✅ | ADM / Pastor / Ministro |
| `/musicas/:id/editar` | CadastroMusicaComponent | ✅ | ADM / Pastor / Ministro |
| `/notificacoes` | NotificacoesComponent | ✅ | Qualquer |
| `/aprovacoes` | AprovacoesComponent | ✅ | Qualquer |
| `/igrejas` | GestaoIgrejasComponent | ✅ | Qualquer |
| `/cultos` | GestaoCultosComponent | ✅ | Qualquer |
| `/calendario` | CalendarioComponent | ✅ | Qualquer |
| `/meu-perfil` | MeuPerfilComponent | ✅ | Qualquer |

---

## 🔐 Autenticação e Segurança

- Token JWT armazenado em `localStorage` (`louvorhub_token`)
- **authInterceptor**: injeta o token em todas as requisições e faz logout automático em respostas `401`
- **authGuard**: redireciona usuários não autenticados para `/login`
- **musicaAdminGuard**: restringe acesso ao catálogo de músicas para `ADM`, `Pastor` e `Ministro`
- **perfilGuard**: factory de guards genérico para controle por perfil

---

## 👥 Perfis e Acesso

| Perfil | Acesso |
|--------|--------|
| `ADM` | Administrador — acesso total |
| `Pastor` | Aprovação de repertórios |
| `Ministro` | Criação e edição de repertórios |
| `Musico` | Escalações e confirmações |
| `Cantor` | Escalações e confirmações |

---

## ✨ Funcionalidades por Página

### 🏠 Início (Dashboard)
- Cards de estatísticas pessoais (cultos, músicas confirmadas, repertórios)
- Lista de próximas escalações

### 📋 Repertórios
- Listagem com abas **Próximos** e **Passados**
- Busca por nome/tipo
- Paginação
- Criação e edição de repertórios com:
  - Blocos predefinidos: Abertura, Adorações, Ofertório, Solo, Apelo, Pós Ceia, Distribuição, EBD, Pré-culto, Encerramento
  - Atribuição de músicas por bloco
  - Tom override por música no culto
  - Escalação de músicos com instrumento
- Fluxo de aprovação: rascunho → envio → aprovação/reprovação
- Visualização detalhada com indicadores de risco de confirmação

### 🎵 Músicas (Admin)
- Catálogo agrupado por letra
- Busca full-text (título, artista, tom)
- Visualização do histórico de uso da música
- Cadastro com: tom masculino e feminino, BPM, tipos, tags, links (YouTube / Spotify), observações

### ✅ Confirmações
- Visão por músico com status: `conhece`, `nao_conhece`, `pendente`
- Indicadores de risco: `ok` / `atencao` / `critico`

### 🔔 Notificações
- Polling a cada 30 segundos
- Badge de não lidas na topbar
- Marcar individualmente ou todas como lidas
- Tipos: escalação, lembrete de culto, alteração/aprovação/reprovação de repertório, confirmação pendente

### ⛪ Gestão de Igrejas
- CRUD completo de igrejas
- Gerenciamento de membros com atribuição de perfil

### 📅 Tipos de Culto
- Cadastro de tipos de culto com horário de início e fim

### 🗓️ Calendário
- Visão mensal dos cultos agendados

### 👤 Meu Perfil
- Edição de nome, função, ministério, avatar
- Seleção de até 11 instrumentos
- Alteração de senha
- Visualização de estatísticas pessoais

---

## 🛠️ Serviços

| Serviço | Responsabilidade |
|---------|-----------------|
| `AuthService` | Login, cadastro, logout, redefinição e alteração de senha |
| `RepertorioService` | CRUD de repertórios e fluxo de aprovação |
| `MusicaService` | CRUD de músicas, busca, tags, tons, instrumentos, histórico |
| `EscalacaoService` | Escalações e confirmações de músicos |
| `NotificacaoService` | Listagem, contagem e marcação de notificações |
| `UsuarioService` | Perfil, estatísticas e listagem de usuários |
| `IgrejaService` | CRUD de igrejas e membros |
| `DashboardService` | Estatísticas e escalações do dashboard |
| `TiposCultoService` | CRUD de tipos de culto |
| `MockApiService` | Facade agregador de serviços para componentes |
| `ThemeService` | Gerenciamento de tema |

---

## 🧪 Testes

```bash
# Testes unitários
ng test

# Testes e2e
ng e2e
```

---

---

## 🇺🇸 English Version

<a name="english-version"></a>

Frontend of the **LouvorHub** church worship management system, built with **Angular 19** (standalone components).

---

## 🚀 Tech Stack

| Technology | Version | Description |
|------------|---------|-------------|
| **Angular** | 19.2 | SPA framework with standalone components |
| **TypeScript** | ~5.7 | Main language |
| **RxJS** | ~7.8 | Reactive programming |
| **Angular Router** | — | Routing with lazy loading |
| **Reactive Forms** | — | Reactive form handling |
| **HttpClient** | — | API communication |
| **SCSS** | — | Styling |
| **Jasmine / Karma** | — | Unit testing |

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Edit `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### 3. Start development server

```bash
ng serve
```

Open: `http://localhost:4200`

### 4. Production build

```bash
ng build
```

Build artifacts are output to the `dist/` folder.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── app.routes.ts         # Route definitions
│   ├── app.config.ts         # Global config (interceptors, etc.)
│   ├── layout/
│   │   ├── main-layout/      # Main layout with sidebar and topbar
│   │   ├── sidebar/          # Side navigation with role-based items
│   │   └── topbar/           # Top bar with notification badge
│   ├── pages/
│   │   ├── login/            # Login, register, and password recovery
│   │   ├── verificar-email/  # Email verification
│   │   ├── home/             # Dashboard with stats
│   │   ├── repertorios/      # Repertoire listing
│   │   ├── cadastro-repertorio/  # Create/edit repertoire
│   │   ├── repertorio-detail/    # View repertoire
│   │   ├── status-confirmacoes/  # Confirmation status per musician
│   │   ├── aprovacoes/       # Approval workflow (Pastor/ADM)
│   │   ├── musicas/          # Song catalog (admin)
│   │   ├── cadastro-musica/  # Create/edit song
│   │   ├── notificacoes/     # Notification center
│   │   ├── gestao-igrejas/   # Church and member management
│   │   ├── gestao-cultos/    # Worship service types
│   │   ├── calendario/       # Calendar view
│   │   └── meu-perfil/       # User profile
│   ├── services/             # API communication services
│   ├── guards/               # Route guards (auth, profile)
│   ├── data/                 # TypeScript models and interfaces
│   └── pipes/                # Custom pipes (TomDisplay)
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

---

## 🗺️ Application Routes

| Route | Component | Protected | Required Role |
|-------|-----------|-----------|---------------|
| `/login` | LoginComponent | ❌ | — |
| `/verificar-email` | VerificarEmailComponent | ❌ | — |
| `/inicio` | HomeComponent | ✅ | Any |
| `/repertorios` | RepertoriosComponent | ✅ | Any |
| `/repertorios/novo` | CadastroRepertorioComponent | ✅ | Any |
| `/repertorios/:id/editar` | CadastroRepertorioComponent | ✅ | Any |
| `/repertorios/:id` | RepertorioDetailComponent | ✅ | Any |
| `/repertorios/:id/confirmacoes` | StatusConfirmacoesComponent | ✅ | Any |
| `/musicas` | MusicasComponent | ✅ | ADM / Pastor / Ministro |
| `/musicas/nova` | CadastroMusicaComponent | ✅ | ADM / Pastor / Ministro |
| `/musicas/:id/editar` | CadastroMusicaComponent | ✅ | ADM / Pastor / Ministro |
| `/notificacoes` | NotificacoesComponent | ✅ | Any |
| `/aprovacoes` | AprovacoesComponent | ✅ | Any |
| `/igrejas` | GestaoIgrejasComponent | ✅ | Any |
| `/cultos` | GestaoCultosComponent | ✅ | Any |
| `/calendario` | CalendarioComponent | ✅ | Any |
| `/meu-perfil` | MeuPerfilComponent | ✅ | Any |

---

## 🔐 Authentication & Security

- JWT token stored in `localStorage` (`louvorhub_token`)
- **authInterceptor**: injects the token in all requests and auto-logs out on `401` responses
- **authGuard**: redirects unauthenticated users to `/login`
- **musicaAdminGuard**: restricts song catalog to `ADM`, `Pastor`, and `Ministro`
- **perfilGuard**: generic factory guard for role-based access control

---

## 👥 Roles & Access

| Profile | Access |
|---------|--------|
| `ADM` | Administrator — full access |
| `Pastor` | Repertoire approval |
| `Ministro` | Repertoire creation and editing |
| `Musico` | Escalations and confirmations |
| `Cantor` | Escalations and confirmations |

---

## ✨ Features by Page

### 🏠 Home (Dashboard)
- Personal statistics cards (services, confirmed songs, repertoires)
- List of upcoming escalations

### 📋 Repertoires
- Listing with **Upcoming** and **Past** tabs
- Search by name/type
- Pagination
- Create and edit repertoires with:
  - Predefined blocks: Abertura, Adorações, Ofertório, Solo, Apelo, Pós Ceia, Distribuição, EBD, Pré-culto, Encerramento
  - Song assignment per block
  - Per-song key override for each service
  - Musician scheduling with instrument assignment
- Approval workflow: draft → submission → approval/rejection
- Detail view with confirmation risk indicators

### 🎵 Songs (Admin)
- Catalog grouped alphabetically
- Full-text search (title, artist, key)
- Song usage history viewer
- Registration with: male/female keys, BPM, types, tags, links (YouTube / Spotify), notes

### ✅ Confirmations
- Per-musician view with statuses: `conhece`, `nao_conhece`, `pendente`
- Risk indicators: `ok` / `atencao` / `critico`

### 🔔 Notifications
- 30-second polling
- Unread badge in the topbar
- Mark individual or all as read
- Types: escalation, service reminder, repertoire change/approval/rejection, pending confirmation

### ⛪ Church Management
- Full church CRUD
- Member management with role assignment

### 📅 Worship Service Types
- Register service types with start and end times

### 🗓️ Calendar
- Monthly view of scheduled services

### 👤 My Profile
- Edit name, function, ministry, avatar
- Select up to 11 instruments
- Change password
- Personal statistics display

---

## 🛠️ Services

| Service | Responsibility |
|---------|----------------|
| `AuthService` | Login, register, logout, password reset and change |
| `RepertorioService` | Repertoire CRUD and approval flow |
| `MusicaService` | Song CRUD, search, tags, keys, instruments, history |
| `EscalacaoService` | Musician escalations and confirmations |
| `NotificacaoService` | List, count, and mark notifications |
| `UsuarioService` | Profile, statistics, and user listing |
| `IgrejaService` | Church and member CRUD |
| `DashboardService` | Dashboard statistics and escalations |
| `TiposCultoService` | Worship service type CRUD |
| `MockApiService` | Service aggregator facade for components |
| `ThemeService` | Theme management |

---

## 🧪 Testing

```bash
# Unit tests
ng test

# End-to-end tests
ng e2e
```
