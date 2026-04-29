# LouvorHub — Documentação Técnica: Migração para App Nativo com Capacitor

> **Status:** Planejamento  
> **Tecnologia-alvo:** Capacitor 6 + Angular 19  
> **Plataformas:** iOS 16+ / Android 10+ (API 29+)  
> **Data de elaboração:** Abril de 2026

---

## Índice

1. [Visão Geral do Projeto Atual](#1-visão-geral-do-projeto-atual)
2. [Por que Capacitor?](#2-por-que-capacitor)
3. [Arquitetura com Capacitor](#3-arquitetura-com-capacitor)
4. [Pré-requisitos de Ambiente](#4-pré-requisitos-de-ambiente)
5. [Análise de Impacto — O que precisa mudar](#5-análise-de-impacto--o-que-precisa-mudar)
6. [Roteiro de Migração (Fase a Fase)](#6-roteiro-de-migração-fase-a-fase)
7. [Plugins Capacitor Recomendados](#7-plugins-capacitor-recomendados)
8. [Adaptações de Código Necessárias](#8-adaptações-de-código-necessárias)
9. [Configuração de Ambientes (environment.ts)](#9-configuração-de-ambientes-environmentts)
10. [Configuração do capacitor.config.ts](#10-configuração-do-capacitorconfigts)
11. [Build e Fluxo de Trabalho Diário](#11-build-e-fluxo-de-trabalho-diário)
12. [Configuração iOS (Xcode)](#12-configuração-ios-xcode)
13. [Configuração Android (Android Studio)](#13-configuração-android-android-studio)
14. [Ícone, Splash Screen e Assets Nativos](#14-ícone-splash-screen-e-assets-nativos)
15. [Push Notifications — Substituição do Polling](#15-push-notifications--substituição-do-polling)
16. [Deep Links — Verificação de E-mail](#16-deep-links--verificação-de-e-mail)
17. [CI/CD](#17-cicd)
18. [Publicação nas Lojas](#18-publicação-nas-lojas)
19. [Checklist Final de Lançamento](#19-checklist-final-de-lançamento)

---

## 1. Visão Geral do Projeto Atual

### Stack Atual

| Camada | Tecnologia | Versão | Deploy |
|--------|-----------|--------|--------|
| Frontend | Angular (Standalone Components) | 19.2 | Vercel |
| Backend | NestJS + Prisma | — | Render |
| Banco de dados | PostgreSQL | — | Render |
| Autenticação | JWT (Bearer Token) | — | — |
| Estilização | SCSS puro com CSS Variables | — | — |

### Telas Existentes

| Rota | Componente | Perfis com Acesso | Observações |
|------|-----------|-------------------|-------------|
| `/login` | `LoginComponent` | Todos | Multi-mode: login, register, forgot |
| `/verificar-email` | `VerificarEmailComponent` | Todos | Recebe token via query param |
| `/inicio` | `HomeComponent` | Todos | Dashboard com stats e escalações |
| `/calendario` | `CalendarioComponent` | Todos | Calendário mensal com cultos |
| `/repertorios` | `RepertoriosComponent` | Todos | Lista paginada |
| `/repertorios/novo` | `CadastroRepertorioComponent` | ADM, Pastor, Ministro | Blocos + escalação |
| `/repertorios/:id` | `RepertorioDetailComponent` | Todos | Detalhe + confirmação de músicas |
| `/repertorios/:id/editar` | `CadastroRepertorioComponent` | ADM, Pastor, Ministro | — |
| `/repertorios/:id/confirmacoes` | `StatusConfirmacoesComponent` | ADM, Pastor, Ministro | Visão geral das confirmações |
| `/musicas` | `MusicasComponent` | ADM, Pastor, Ministro | Biblioteca alfabética |
| `/musicas/nova` | `CadastroMusicaComponent` | ADM, Pastor, Ministro | Cadastro com links |
| `/musicas/:id/editar` | `CadastroMusicaComponent` | ADM, Pastor, Ministro | — |
| `/notificacoes` | `NotificacoesComponent` | Todos | Lista com links contextuais |
| `/aprovacoes` | `AprovacoesComponent` | ADM, Pastor | Aprovar/reprovar repertórios |
| `/igrejas` | `GestaoIgrejasComponent` | ADM | CRUD de igrejas + membros |
| `/cultos` | `GestaoCultosComponent` | ADM, Pastor, Ministro | CRUD de tipos de culto |
| `/meu-perfil` | `MeuPerfilComponent` | Todos | Edição de perfil + senha |

### Perfis de Usuário

```
ADM > Pastor > Ministro > Musico / Cantor
```

### Serviços e Dependências Relevantes

- **`AuthService`** — JWT armazenado em `localStorage` (chaves: `louvorhub_token`, `louvorhub_user`)
- **`ThemeService`** — Dark/light mode salvo em `localStorage` + `window.matchMedia`
- **`NotificacaoService`** — Polling a cada 30 segundos via `timer` do RxJS
- **`AuthInterceptor`** — Injeta `Authorization: Bearer <token>` em todas as requisições
- **`AuthGuard`** — Redireciona para `/login` se token ausente
- **`PerfisGuard`** — Restringe rotas por perfil (ex: músicas apenas para ADM/Pastor/Ministro)
- **Design System** — CSS Variables em `:root` com suporte a `[data-theme="dark"]`
- **MockApiService** — Facade que agrupa chamadas de múltiplos serviços (padrão já adequado para troca futura)

---

## 2. Por que Capacitor?

### Comparativo

| Critério | Capacitor | React Native | Flutter | Ionic (apenas) |
|---------|-----------|--------------|---------|----------------|
| Reaproveitamento do código Angular | ✅ 100% | ❌ Reescrita completa | ❌ Reescrita completa | ✅ 100% |
| Acesso a APIs nativas | ✅ Via plugins | ✅ Nativo | ✅ Nativo | ⚠️ Via Cordova |
| Performance | ✅ WebView nativa | ✅✅ | ✅✅ | ✅ WebView |
| Manutenção da equipe | ✅ Mesma stack Angular | ❌ Curva de aprendizado | ❌ Curva de aprendizado | ✅ |
| Comunidade e suporte | ✅ Ionic/Capacitor team | ✅✅ Meta | ✅✅ Google | ✅ |
| Publicação em loja | ✅ | ✅ | ✅ | ✅ |

**Decisão:** Capacitor é a escolha correta para este projeto porque permite reutilizar 100% do código Angular já existente, com adição incremental de funcionalidades nativas via plugins.

### Como o Capacitor Funciona

O Capacitor empacota o build web (pasta `dist/`) dentro de uma **WebView nativa** (WKWebView no iOS, Android System WebView no Android). A WebView carrega o `index.html` da aplicação Angular como se fosse local (sem servidor HTTP). Chamadas para APIs externas continuam funcionando via requisições HTTP normais.

A "ponte" Capacitor (JavaScript ↔ código nativo) permite que o JavaScript acesse câmera, storage seguro, push notifications, status bar, e muito mais, via plugins com API JavaScript uniforme.

---

## 3. Arquitetura com Capacitor

```
┌──────────────────────────────────────────────────────────────┐
│                        APP NATIVA                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   WebView Nativa                        │  │
│  │                                                        │  │
│  │   ┌──────────────────────────────────────────────┐    │  │
│  │   │          Angular Application (dist/)          │    │  │
│  │   │                                              │    │  │
│  │   │  Components → Services → HTTP → API REST     │    │  │
│  │   │  AuthService → @capacitor/preferences        │    │  │
│  │   │  ThemeService → StatusBar plugin             │    │  │
│  │   │  NotificacaoService → PushNotifications      │    │  │
│  │   └──────────────────────────────────────────────┘    │  │
│  │                         │                              │  │
│  │              Capacitor Bridge (JS ↔ Native)           │  │
│  └────────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Plugins Nativos                          │    │
│  │  @capacitor/preferences  @capacitor/push-notifications│    │
│  │  @capacitor/camera       @capacitor/status-bar        │    │
│  │  @capacitor/splash-screen @capacitor/app              │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
                    ┌─────────────────────┐
                    │  NestJS API (Render) │
                    │  PostgreSQL          │
                    └─────────────────────┘
```

---

## 4. Pré-requisitos de Ambiente

### Máquina de Desenvolvimento

| Ferramenta | Versão mínima | Observações |
|-----------|---------------|-------------|
| Node.js | 20 LTS | Obrigatório |
| npm | 10+ | Incluído com Node |
| Angular CLI | 19 | Já instalado no projeto |
| Capacitor CLI | 6+ | A instalar |
| Git | Qualquer | Recomendado |

### Para iOS

| Ferramenta | Obrigatório | Observações |
|-----------|-------------|-------------|
| macOS Ventura+ | ✅ Obrigatório | Xcode só roda em Mac |
| Xcode | 15+ | App Store (gratuito) |
| Xcode Command Line Tools | ✅ | `xcode-select --install` |
| Apple Developer Account | ✅ | USD 99/ano para publicar |
| CocoaPods | ✅ | `sudo gem install cocoapods` |
| Simulador iOS | Recomendado | Incluído no Xcode |

### Para Android

| Ferramenta | Obrigatório | Observações |
|-----------|-------------|-------------|
| Android Studio | ✅ | Gratuito |
| Android SDK | ✅ | Instalado via Android Studio |
| Java JDK 17 | ✅ | Incluído no Android Studio |
| Google Play Console | ✅ | USD 25 (taxa única) |
| Emulador Android | Recomendado | Criado via Android Studio |

---

## 5. Análise de Impacto — O que precisa mudar

### 5.1 Problemas Críticos (Obrigatórios resolver)

| Item | Problema Atual | Solução |
|------|---------------|---------|
| `localStorage` no AuthService | `localStorage` funciona na WebView, mas é inseguro para tokens JWT sensíveis | Migrar para `@capacitor/preferences` (storage nativo seguro) |
| `localStorage` no ThemeService | Funcional, mas ideal usar Preferences também para consistência | Migrar para `@capacitor/preferences` |
| `environment.apiUrl = 'http://localhost:3000'` | URL de desenvolvimento; em produção deve apontar para Render | Criar `environment.prod.ts` com URL do Render |
| Verificação de e-mail via link (`/verificar-email?token=...`) | Links de e-mail abrem o browser padrão do sistema, não o app | Configurar Deep Links / Universal Links |
| `window.matchMedia` no ThemeService | Funciona na WebView, mas é melhor prática detectar via plugin nativo | Ajuste opcional com StatusBar |
| CORS no backend | Atualmente pode estar restrito a domínios web | Liberar origens `capacitor://localhost` e `http://localhost` |

### 5.2 Melhorias de Experiência (Altamente Recomendadas)

| Item | Problema Atual | Solução |
|------|---------------|---------|
| Polling de notificações (30s) | Consome bateria e dados desnecessariamente | Substituir por Push Notifications nativas (FCM + APNs) |
| Avatar do usuário | Upload de imagem sem câmera nativa | `@capacitor/camera` para tirar foto ou escolher da galeria |
| Barra de status do OS | Sem controle de cor/estilo da status bar | `@capacitor/status-bar` |
| Tela de splash | Sem splash screen personalizado | `@capacitor/splash-screen` |
| Feedback háptico | Sem feedback tátil em ações | `@capacitor/haptics` |
| Controle do teclado virtual | Pode cobrir inputs | `@capacitor/keyboard` |

### 5.3 Não Precisa Mudar

- Todo o código de componentes Angular
- Todos os serviços HTTP (auth, musica, repertorio, escalacao, etc.)
- Todo o CSS/SCSS e design system
- Sistema de rotas do Angular Router
- Guards de autenticação e perfil
- Modelos TypeScript (models/index.ts)
- Sistema de build do Angular CLI
- Interceptor HTTP
- RxJS e toda lógica reativa

---

## 6. Roteiro de Migração (Fase a Fase)

### Fase 1 — Setup Inicial do Capacitor

**Objetivo:** Ter o app rodando num emulador sem quebrar nada.

**Passos:**

```bash
# 1. Dentro de /front, instalar as dependências do Capacitor
cd front
npm install @capacitor/core @capacitor/cli

# 2. Inicializar o Capacitor no projeto
npx cap init "LouvorHub" "com.louvorhub.app" --web-dir dist/louvorhub/browser

# 3. Instalar as plataformas
npm install @capacitor/ios @capacitor/android

# 4. Adicionar as plataformas (isso cria as pastas ios/ e android/)
npx cap add ios
npx cap add android

# 5. Fazer o build do Angular
ng build --configuration production

# 6. Copiar o build para as plataformas nativas
npx cap sync
```

Após a Fase 1, o app já abre no simulador iOS e emulador Android mostrando a aplicação Angular completa.

---

### Fase 2 — Ajuste de Ambientes e CORS

**Objetivo:** Garantir que as chamadas HTTP cheguem ao backend correto.

**Arquivo a criar:** `src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://SEU-APP.onrender.com/api', // URL real do Render
};
```

**Backend — ajuste de CORS no NestJS:**  
Adicionar ao `main.ts` as origens usadas pelo Capacitor:
```
'capacitor://localhost'  // iOS
'http://localhost'       // Android  
'https://louvorhub.vercel.app' // Web (produção)
```

---

### Fase 3 — Migração de Storage

**Objetivo:** Substituir `localStorage` por storage nativo seguro.

```bash
npm install @capacitor/preferences
npx cap sync
```

**Impacto:** Modificar `AuthService` e `ThemeService` para usar a API assíncrona do Preferences.

> **Atenção:** `@capacitor/preferences` é assíncrono (retorna Promises). Isso requer ajustes em métodos como `getToken()` e `isLoggedIn()` no `AuthService`, que atualmente são síncronos. O `AuthGuard` e o `AuthInterceptor` precisarão ser adaptados para trabalhar com observables/promises.

---

### Fase 4 — Push Notifications

**Objetivo:** Substituir o polling de 30 segundos por notificações push reais.

```bash
npm install @capacitor/push-notifications
npx cap sync
```

**Arquitetura de push:**

```
Firebase Cloud Messaging (FCM)     Apple Push Notification Service (APNs)
        │                                         │
        └──────────────────┬──────────────────────┘
                           ▼
                    NestJS Backend
                  (envia push via SDK)
                           │
                    ┌──────▼──────┐
                    │  Dispositivo │
                    │  do usuário  │
                    └─────────────┘
```

**O que muda no backend:**
- Criar endpoint para receber e armazenar o **FCM/APNs device token** por usuário
- Ao criar notificações (`notificacoes.service.ts`), além de salvar no banco, enviar push via Firebase Admin SDK

**O que muda no frontend:**
- `NotificacaoService.iniciarPolling()` substituído por `iniciarPush()` que registra o device token
- Listener de notificação em foreground para atualizar contador
- O polling pode ser mantido como fallback para web

---

### Fase 5 — Deep Links (Verificação de E-mail)

**Objetivo:** Links de e-mail abrirem diretamente o app.

O fluxo atual de verificação de e-mail (`/verificar-email?token=...`) depende de um link clicável no e-mail do usuário. Em mobile, esse link abre o browser padrão, não o app.

**Solução — Universal Links (iOS) + App Links (Android):**

```bash
npm install @capacitor/app
npx cap sync
```

**Configuração necessária:**
- iOS: arquivo `apple-app-site-association` servido pelo backend na rota `/.well-known/apple-app-site-association`
- Android: arquivo `assetlinks.json` servido pelo backend na rota `/.well-known/assetlinks.json`
- Ambos devem estar no domínio do backend (ex: `louvorhub.onrender.com`)
- O Angular Router precisa tratar a rota com o token ao receber o deep link

**Alternativa mais simples:** Usar um **Custom URL Scheme** (`louvorhub://verificar-email?token=...`) configurado no `capacitor.config.ts`. Menos seguro, mas mais fácil de implementar.

---

### Fase 6 — Camera (Avatar do Perfil)

```bash
npm install @capacitor/camera
npx cap sync
```

**Impacto no `MeuPerfilComponent`:**
- O input `<input type="file">` atual funciona na WebView, mas a experiência é degradada em mobile
- Usar `Camera.getPhoto()` para abrir nativo (câmera ou galeria)
- Resultado é base64 ou URI; deve ser enviado ao backend para upload

---

### Fase 7 — Status Bar e Splash Screen

```bash
npm install @capacitor/status-bar @capacitor/splash-screen
npx cap sync
```

**Status Bar:**
- Sincronizar cor da barra de status do OS com o tema do app (roxa `#6B3FA0` / escuro `#0E0E1A`)
- Chamar `StatusBar.setStyle()` no `ThemeService.toggle()`

**Splash Screen:**
- Configurada no `capacitor.config.ts`
- Assets: ícone centralizado sobre fundo roxo `#6B3FA0`
- Ocultar programaticamente após o Angular inicializar (no `AppComponent.ngOnInit`)

---

## 7. Plugins Capacitor Recomendados

| Plugin | Pacote npm | Prioridade | Uso no LouvorHub |
|--------|-----------|-----------|-----------------|
| Preferences | `@capacitor/preferences` | 🔴 Crítico | Substituir localStorage para token JWT e tema |
| Push Notifications | `@capacitor/push-notifications` | 🟠 Alta | Substituir polling de notificações |
| App | `@capacitor/app` | 🟠 Alta | Deep links para verificação de e-mail |
| Status Bar | `@capacitor/status-bar` | 🟡 Média | Sincronizar cor com tema do app |
| Splash Screen | `@capacitor/splash-screen` | 🟡 Média | Tela de abertura personalizada |
| Camera | `@capacitor/camera` | 🟡 Média | Upload de avatar de perfil |
| Keyboard | `@capacitor/keyboard` | 🟡 Média | Ajustar layout quando teclado aparece |
| Haptics | `@capacitor/haptics` | 🟢 Baixa | Feedback tátil em ações (confirmar, aprovar) |
| Network | `@capacitor/network` | 🟢 Baixa | Detectar offline e mostrar aviso |
| Local Notifications | `@capacitor/local-notifications` | 🟢 Baixa | Lembretes locais sem backend |

---

## 8. Adaptações de Código Necessárias

### 8.1 AuthService — Migração de localStorage para Preferences

**Estado atual:**
```typescript
// Síncrono — funciona na web, mas inseguro em mobile
getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

isLoggedIn(): boolean {
  return !!this.getToken();
}
```

**Estado necessário após migração:**
```typescript
// Assíncrono — usando Preferences do Capacitor
async getToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: TOKEN_KEY });
  return value;
}

async isLoggedIn(): Promise<boolean> {
  const token = await this.getToken();
  return !!token;
}
```

**Impacto em cascata:**
- `AuthGuard` precisará ser `async CanActivateFn`
- `AuthInterceptor` precisará usar `from(authService.getToken())` para converter Promise em Observable
- `LoginComponent` (verificação inicial `if (this.authService.isLoggedIn())`) precisará ser async

**Estratégia recomendada:** Criar um `AuthStateService` separado que mantenha o estado do token em memória (BehaviorSubject) após a primeira leitura assíncrona, para que o resto do código possa continuar síncrono.

---

### 8.2 ThemeService — Adaptar para Capacitor

**Mudanças necessárias:**

1. Trocar `localStorage.getItem/setItem` por `Preferences.get/set`
2. Adicionar chamada ao `StatusBar.setStyle()` ao alternar tema:
   - Tema claro → `StatusBar.setStyle({ style: Style.Light })`
   - Tema escuro → `StatusBar.setStyle({ style: Style.Dark })`
3. Detectar plataforma antes de chamar `StatusBar` (não existe na web)

**Utilitário de plataforma:**
```typescript
import { Capacitor } from '@capacitor/core';
const isNative = Capacitor.isNativePlatform(); // true em iOS/Android
```

---

### 8.3 NotificacaoService — Polling vs Push

**Estratégia de transição recomendada:**

Manter o polling como fallback e adicionar push por cima:

```
Plataforma web → manter polling de 30s (comportamento atual)
Plataforma nativa → registrar push token + desativar polling
```

Isso garante compatibilidade com a versão web existente (Vercel) enquanto o app nativo usa push.

---

### 8.4 Responsividade CSS — Ajustes para Mobile

O projeto já usa CSS Variables e design system próprio. Os principais ajustes necessários:

1. **Viewport:** Adicionar meta tag no `index.html`:
   ```html
   <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```

2. **Safe Areas (notch/Dynamic Island):** Aplicar `env(safe-area-inset-*)` no CSS:
   ```scss
   // No main-layout, topbar e sidebar
   padding-top: env(safe-area-inset-top);
   padding-bottom: env(safe-area-inset-bottom);
   ```

3. **Sidebar:** O drawer lateral atual é adequado para tablet. Em mobile (tela menor), considerar navbar inferior com os ítens principais do menu.

4. **Touch targets:** Garantir que botões tenham mínimo 44×44px (guideline iOS) / 48×48dp (Android).

5. **Scroll:** Remover `:hover` states que não fazem sentido em touch. Considerar `-webkit-overflow-scrolling: touch` em listas longas.

6. **Formulários:** Testar todos os inputs com teclado virtual (especialmente `CadastroRepertorioComponent` que é complexo).

---

## 9. Configuração de Ambientes (environment.ts)

### Estrutura recomendada

```
src/environments/
  environment.ts          ← desenvolvimento (localhost)
  environment.prod.ts     ← produção web + app nativo
  environment.staging.ts  ← (opcional) staging/homologação
```

### environment.prod.ts

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://louvourhub-back.onrender.com/api',
};
```

### Seleção no angular.json

O `angular.json` já tem configurações de `fileReplacements` para builds de produção. Verificar que o arquivo `environment.prod.ts` está referenciado corretamente na seção `configurations.production`.

---

## 10. Configuração do capacitor.config.ts

```typescript
// front/capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.louvorhub.app',
  appName: 'LouvorHub',
  webDir: 'dist/louvorhub/browser',
  
  server: {
    // Em desenvolvimento, pode apontar para o ng serve local
    // Em produção, remover esta seção (carrega arquivos locais)
    // androidScheme: 'https', // obrigatório para Android 9+
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#6B3FA0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#6B3FA0',
    },
  },

  ios: {
    scheme: 'louvorhub',         // para deep links custom scheme
    contentInset: 'automatic',   // respeita safe areas automaticamente
  },

  android: {
    allowMixedContent: false,    // bloquear HTTP em produção
  },
};

export default config;
```

---

## 11. Build e Fluxo de Trabalho Diário

### Build de Desenvolvimento (Hot Reload)

```bash
# Terminal 1 — Angular com live reload
cd front
ng serve

# Terminal 2 — Apontar Capacitor para o dev server
# Modificar temporariamente capacitor.config.ts com:
# server: { url: 'http://192.168.X.X:4200', cleartext: true }

npx cap run ios --live-reload --external
# ou
npx cap run android --live-reload --external
```

### Build de Produção

```bash
cd front

# 1. Build Angular de produção
ng build --configuration production

# 2. Sincronizar com plataformas nativas
npx cap sync

# 3. Abrir IDE nativa para finalizar o build
npx cap open ios      # abre Xcode
npx cap open android  # abre Android Studio
```

### Script recomendado em package.json

```json
{
  "scripts": {
    "build:mobile": "ng build --configuration production && cap sync",
    "open:ios": "ng build --configuration production && cap sync && cap open ios",
    "open:android": "ng build --configuration production && cap sync && cap open android"
  }
}
```

---

## 12. Configuração iOS (Xcode)

### Após `npx cap open ios`:

1. **Bundle Identifier:** Confirmar `com.louvorhub.app`
2. **Signing & Capabilities:**
   - Team: selecionar o Apple Developer Account
   - Ativar: `Push Notifications`, `Associated Domains` (para Universal Links)
3. **Deployment Target:** iOS 16.0+
4. **Permissões (Info.plist):**

```xml
<!-- Câmera -->
<key>NSCameraUsageDescription</key>
<string>O LouvorHub usa a câmera para atualizar sua foto de perfil.</string>

<!-- Galeria de fotos -->
<key>NSPhotoLibraryUsageDescription</key>
<string>O LouvorHub acessa sua galeria para que você escolha uma foto de perfil.</string>

<!-- Notificações push — solicitadas programaticamente, não no plist -->
```

5. **Associated Domains** (para Universal Links):
   - Adicionar: `applinks:louvourhub-back.onrender.com`

6. **CocoaPods:**
   ```bash
   cd ios/App
   pod install
   ```

### Build para TestFlight

1. No Xcode: Product → Archive
2. Distribute App → App Store Connect → Upload
3. Aguardar processamento (~15 min)
4. Em App Store Connect → TestFlight → Adicionar testadores

---

## 13. Configuração Android (Android Studio)

### Após `npx cap open android`:

1. **applicationId:** `com.louvorhub.app` (em `android/app/build.gradle`)
2. **Versão mínima do SDK:** 29 (Android 10)
3. **Versão alvo:** 34 (Android 14)
4. **Permissões (AndroidManifest.xml):**

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

5. **Firebase — google-services.json:**
   - Criar projeto no Firebase Console
   - Baixar `google-services.json`
   - Colocar em `android/app/google-services.json`

6. **Keystore para assinatura:**
   ```bash
   keytool -genkey -v -keystore louvorhub-release.keystore \
     -alias louvorhub -keyalg RSA -keysize 2048 -validity 10000
   ```
   - Armazenar keystore com segurança (nunca comitar no Git)
   - Configurar no `android/app/build.gradle`:
   ```groovy
   signingConfigs {
     release {
       storeFile file('louvorhub-release.keystore')
       storePassword System.getenv("KEYSTORE_PASSWORD")
       keyAlias 'louvorhub'
       keyPassword System.getenv("KEY_PASSWORD")
     }
   }
   ```

### Build para Internal Testing

1. No Android Studio: Build → Generate Signed Bundle/APK → Android App Bundle (.aab)
2. Upload do `.aab` no Google Play Console → Internal Testing
3. Adicionar testadores pelo e-mail

---

## 14. Ícone, Splash Screen e Assets Nativos

### Ferramenta recomendada: `@capacitor/assets`

```bash
npm install -g @capacitor/assets

# Estrutura de arquivos de origem:
# assets/icon.png         → 1024×1024px, fundo transparente ou roxo
# assets/splash.png       → 2732×2732px, logo centralizado, fundo #6B3FA0

npx capacitor-assets generate
```

Esse comando gera automaticamente todos os tamanhos de ícone e splash screen para iOS e Android.

### Especificações de design

| Asset | Dimensão mínima | Formato | Notas |
|-------|----------------|---------|-------|
| Ícone app | 1024×1024px | PNG | Sem transparência (App Store não aceita) |
| Splash screen | 2732×2732px | PNG | Centralizar logo; bordas podem ser cortadas |
| Ícone notificação (Android) | 96×96px | PNG | Branco monocromático sobre transparente |

---

## 15. Push Notifications — Substituição do Polling

### Fluxo Completo

```
1. App abre pela 1ª vez
   → Solicitar permissão de notificação ao usuário
   → Se concedido, registrar device com FCM/APNs
   → Receber device token
   → Enviar token ao backend: POST /api/notificacoes/device-token

2. Backend cria uma notificação para o usuário
   → Salva no banco (tabela notificacoes)  ← comportamento atual mantido
   → Envia push via Firebase Admin SDK    ← novo

3. Dispositivo recebe push
   → Em foreground: atualizar contador na topbar
   → Em background: exibir notificação nativa
   → Ao clicar: abrir o app na tela correta via deep link
```

### Mudanças necessárias no backend

1. Novo campo no model `Usuario`: `pushTokens String[] @default([])`
2. Novo endpoint: `POST /api/push-tokens` (recebe e armazena o device token)
3. Instalar Firebase Admin SDK: `npm install firebase-admin`
4. No `notificacoes.service.ts`: após criar notificação no banco, disparar push

### Tipos de notificação e deep links

| `TipoNotificacao` | Deep Link no app |
|-------------------|-----------------|
| `escalacao` | `/repertorios/:id` |
| `lembrete_culto` | `/repertorios/:id` |
| `confirmacao_pendente` | `/repertorios/:id` |
| `musico_confirmou` | `/repertorios/:id/confirmacoes` |
| `repertorio_aprovado` | `/repertorios/:id` |
| `repertorio_reprovado` | `/repertorios/:id` |
| `repertorio_pendente_aprovacao` | `/aprovacoes` |

---

## 16. Deep Links — Verificação de E-mail

### Problema atual

O e-mail de verificação contém um link como:
```
https://louvorhub.vercel.app/verificar-email?token=abc123
```

Em mobile, esse link abre o navegador padrão (Safari/Chrome), não o app.

### Solução recomendada: Universal Links + App Links

**iOS — Universal Links:**
1. No servidor backend: servir em `https://louvourhub-back.onrender.com/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.com.louvorhub.app",
      "paths": ["/verificar-email*", "/reset-senha*"]
    }]
  }
}
```
2. No Xcode: ativar `Associated Domains` com `applinks:louvourhub-back.onrender.com`

**Android — App Links:**
1. No servidor: servir em `https://louvourhub-back.onrender.com/.well-known/assetlinks.json`
2. No AndroidManifest.xml: adicionar `intent-filter` com `autoVerify="true"`

**Alternativa rápida — Custom URL Scheme:**
- Alterar link do e-mail para `louvorhub://verificar-email?token=abc123`
- Configurar no `capacitor.config.ts` o scheme `louvorhub`
- Funciona sem servidor, mas não abre o app se não estiver instalado

---

## 17. CI/CD

### GitHub Actions — Build Automatizado

**Arquivo sugerido:** `.github/workflows/mobile-build.yml`

```yaml
name: Mobile Build

on:
  push:
    branches: [main]
    paths:
      - 'front/**'

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd front && npm ci
      - name: Build Angular
        run: cd front && ng build --configuration production
      - name: Capacitor Sync
        run: cd front && npx cap sync android
      - name: Build Android AAB
        run: |
          cd front/android
          ./gradlew bundleRelease
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      # ... configuração mais complexa com certificados e provisioning profiles
```

> **Nota:** O build de iOS em CI requer armazenamento seguro de certificados de desenvolvimento e provisioning profiles. Ferramentas como **Fastlane** simplificam muito esse processo.

### Fastlane (Recomendado)

```bash
# Instalar fastlane
gem install fastlane

# Inicializar no projeto iOS
cd front/ios/App
fastlane init
```

O Fastlane pode automatizar:
- Incremento de versão
- Build e assinatura
- Upload para TestFlight e Google Play
- Screenshots automáticos

---

## 18. Publicação nas Lojas

### Apple App Store

**Pré-requisitos:**
- Apple Developer Account ativa ($99/ano)
- App criado no App Store Connect
- Certificados de distribuição e Provisioning Profile de produção
- Pelo menos 1 rodada de TestFlight aprovada

**Processo:**
1. Xcode → Product → Archive
2. Distribute App → App Store Connect
3. App Store Connect → Preparar para envio
4. Preencher metadados: nome, descrição, categorias, screenshots (obrigatório: 6.5", 5.5")
5. Definir preço (Gratuito)
6. Enviar para revisão (prazo médio: 1-3 dias úteis)
7. Aprovado → Release manual ou automático

**Screenshots obrigatórios:**
- iPhone 6.7" (iPhone 15 Pro Max): 1290×2796
- iPhone 6.5" (iPhone 14 Plus): 1284×2778
- iPhone 5.5" (iPhone 8 Plus): 1242×2208
- iPad Pro 12.9" (3a geração): 2048×2732 (se suportar iPad)

---

### Google Play Store

**Pré-requisitos:**
- Google Play Console ($25, taxa única)
- App criado no Console
- Keystore de produção

**Processo:**
1. Android Studio → Build → Generate Signed Bundle (.aab)
2. Play Console → Criar app → Upload do .aab
3. Internal Testing → Closed Testing → Open Testing → Production
4. Preencher: título, descrição, ícone (512×512), feature graphic (1024×500)
5. Declarar uso de permissões (câmera, notificações)
6. Política de privacidade obrigatória (URL pública)
7. Enviar para revisão (prazo médio: 1-7 dias)

---

## 19. Checklist Final de Lançamento

### Técnico

- [ ] `environment.prod.ts` com URL correta do Render
- [ ] CORS do backend configurado para origens Capacitor
- [ ] `localStorage` migrado para `@capacitor/preferences`
- [ ] Deep links configurados para verificação de e-mail
- [ ] Push notifications integradas (FCM + APNs)
- [ ] Ícone e splash screen gerados para todas as densidades
- [ ] Bundle ID / applicationId definido: `com.louvorhub.app`
- [ ] Versão do app definida (semver: 1.0.0)
- [ ] Safe areas (notch) aplicadas nos layouts
- [ ] Permissões declaradas com strings descritivas
- [ ] Keystore Android gerada e armazenada com segurança
- [ ] Build de produção testado em dispositivo físico iOS
- [ ] Build de produção testado em dispositivo físico Android
- [ ] Todos os fluxos críticos testados: login, repertório, confirmação, notificação

### Loja

- [ ] Política de Privacidade publicada em URL pública
- [ ] Conta Apple Developer ativa
- [ ] App criado no App Store Connect
- [ ] Conta Google Play Console ativa
- [ ] App criado no Play Console
- [ ] Screenshots criadas nos tamanhos corretos
- [ ] Descrição do app escrita (PT-BR)
- [ ] Categoria definida (Produtividade / Música)
- [ ] Rating de conteúdo preenchido
- [ ] Preço definido (Gratuito)
- [ ] Beta testing concluído (TestFlight / Internal Testing)
