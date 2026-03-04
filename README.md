# 📱 PJ Assistant — Mobile App

> Front-end mobile (React Native + Expo) para o case **Engenheiro(a) Sênior – BFA em Go + IA Generativa** do time de Inteligência Itaú.

---

## 🏗️ Stack

| Camada           | Tecnologia                         |
| ---------------- | ---------------------------------- |
| Framework        | Expo SDK 52 + React Native 0.76    |
| Linguagem        | TypeScript 5 (strict)              |
| Roteamento       | Expo Router v4 (file-based)        |
| Estado servidor  | TanStack React Query v5            |
| Estado cliente   | Zustand v5                         |
| HTTP             | Axios (single instance, interceptors) |
| Testes           | Jest (8 suites, 68 testes)         |
| Deploy           | EAS Update (branch `preview`)      |
| Design Tokens    | Itaú brand (orange / blue)         |

---

## 📂 Arquitetura

```
app/                         ← Expo Router (file-based routing)
  _layout.tsx                ← Root layout + providers
  auth.tsx                   ← Login / Cadastro (multi-step)
  (tabs)/
    _layout.tsx              ← Tab navigator (Chat, Home, Métricas, DevTools)
    index.tsx                ← Home (saldo, transações, atalhos)
    chat.tsx                 ← Chat com assistente IA
    metrics.tsx              ← Dashboard de observabilidade
    devtools.tsx             ← DevTools (saldo, transações, Network Inspector)
  credit-card.tsx            ← Cartões (meus + catálogo via API)
  pix.tsx                    ← Pix (enviar, chaves)
  pix-receipt.tsx            ← Comprovante de Pix
  pix-credit.tsx             ← Pix via crédito
  pix-scheduled.tsx          ← Pix agendado
  extrato.tsx                ← Extrato de transações
  bill-payment.tsx           ← Pagamento de boletos
  barcode-scanner.tsx        ← Scanner de código de barras
  financial-summary.tsx      ← Resumo financeiro
  debit-purchase.tsx         ← Compra no débito

src/
  config/env.ts              ← Environment config via Constants
  lib/
    errors.ts                ← AppError + ErrorCode hierarchy
    http-client.ts           ← Axios instance + interceptors + Network Log
    query-client.ts          ← TanStack Query defaults
    barcode.ts               ← Validação/formatação de boletos
    device-id.ts             ← Device ID (AsyncStorage + UUID)
    utils.ts                 ← Formatação, sanitização, ID gen
  types/                     ← Shared TypeScript interfaces (11 arquivos)
  services/                  ← API service layer (10 serviços)
  stores/                    ← Zustand stores (auth, chat, customer, pix, network-log, etc.)
  hooks/                     ← React Query custom hooks (8 hooks)
  theme/tokens.ts            ← Design tokens (colors, spacing, etc.)
  components/
    chat/                    ← ChatBubble, ChatInput, TypingIndicator, EmptyChat
    metrics/                 ← HealthCard, MetricTile, SectionHeader
    ui/                      ← Card, Badge, BottomSheet, ActionButton, etc.
  __tests__/                 ← 8 suites, 68 testes unitários
```

### Princípios

1. **Separation of Concerns** — cada pasta tem responsabilidade única
2. **Dependency Rule** — fluxo unidirecional: `screen → hook → service → http`
3. **No raw `fetch`** — toda comunicação HTTP passa pelo `http-client.ts`
4. **Error hierarchy** — `AppError` com `isRetryable`, `requiresAuth`, retry inteligente
5. **XSS prevention** — `sanitizeInput()` em toda entrada do usuário
6. **Correlation ID** — `X-Request-ID` UUID v4 em cada request para tracing
7. **Backend-first** — sem lógica de negócio no front-end, dados vêm do backend

---

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Iniciar o dev server
npx expo start

# 3. Abrir no Expo Go (scan QR code no terminal)
```

### Variáveis de Ambiente

O app se conecta ao BFA em produção no Railway. Para customizar, edite `src/config/env.ts`:

```typescript
API_BASE_URL: 'https://pj-assistant-bfa-go-production.up.railway.app'
```

### Deploy via EAS Update

```bash
npx eas update --branch preview --message "descrição"
```

---

## 🧪 Testes

```bash
# Rodar todos (68 testes, 8 suites)
npm test

# Watch mode
npm run test:watch

# Com coverage
npx jest --coverage
```

**8 suites cobrindo:**
- `utils.ts` — formatação BRL, datas, sanitização, UUID generation
- `errors.ts` — AppError hierarchy, retryable/auth classification
- `http-client.ts` — Axios instance config validation
- `device-id.ts` — AsyncStorage persistence, cache, fallback
- `barcode.ts` — Validação de boletos, formatação, máscara de documentos
- `chat-store.ts` — send/clear/error flow, error bubble on failure
- `onboarding-chat-store.ts` — fluxo de onboarding, history enrichment, error handling
- `onboarding-progress.ts` — cálculo de progresso por step

---

## 📱 Funcionalidades

### 🔐 Login & Cadastro
- Autenticação com CPF + senha (6 dígitos)
- Cadastro multi-step (dados empresa → representante → senha)
- **Retry automático** com backoff exponencial (4 tentativas, ~15s)
- Diferenciação de erro (credenciais vs. conexão)
- Persistência de sessão com AsyncStorage

### 💬 Chat com Assistente IA
- Conversa com o assistente PJ (autenticado e anônimo/onboarding)
- Flag `is_authenticated` enviada ao backend
- Chips de sugestão na tela vazia
- Indicador de digitação animado
- **Mensagem amigável** quando a API falha (_"Poxa! Acho que perdi a conexão..."_)
- Metadados da resposta: latência, tools usadas, fontes RAG

### 🏠 Home
- Saldo da conta e atalhos rápidos (Pix, Boletos, Cartões, Extrato)
- Últimas transações com pull-to-refresh

### 💳 Cartões de Crédito
- Meus cartões (ativos, bloqueados — ações: bloquear/desbloquear/cancelar)
- **Catálogo via API** (`GET /v1/customers/{id}/cards/available`)
- Contratação com slider de limite e escolha de vencimento
- Fatura e pagamento de fatura
- Visual premium (gradients, badges por bandeira)

### 📊 Métricas de Observabilidade
- Health status dos serviços (BFA, Agent, Vector Store)
- KPIs do agente: latência P50/P95, tokens/req, custo estimado, precisão RAG
- **Sem polling automático** — dados atualizam apenas com pull-to-refresh

### 🛠️ DevTools
- Adicionar saldo, gerar transações, simular compras
- Configurar limite de crédito
- Compra com cartão de crédito (selecionar cartão, parcelamento)
- **Network Inspector** — intercepta requests/responses como bubbles de chat
  - Toggle on/off
  - Modal fullscreen com tema escuro
  - Bubbles coloridos (azul=request, verde=response, vermelho=erro)
  - Clear e auto-scroll

### 💸 Pix
- Enviar Pix (saldo ou crédito), com chaves cadastradas
- Comprovante de transferência
- Pix agendado

### 📄 Boletos & Extrato
- Scanner de código de barras
- Pagamento de boletos com validação
- Extrato completo com filtros

---

## 🔗 Integração com o BFA

O app consome o Backend For App (Go) hospedado no Railway:

| Endpoint                              | Uso                           |
| ------------------------------------- | ----------------------------- |
| `POST /v1/auth/login`                 | Login (com retry)             |
| `POST /v1/auth/register`             | Cadastro de conta PJ          |
| `POST /v1/chat/{customerId}`          | Chat autenticado              |
| `POST /v1/chat`                       | Chat anônimo (onboarding)     |
| `GET /v1/customers/{id}`              | Perfil do cliente             |
| `GET /v1/customers/{id}/accounts`     | Contas e saldo                |
| `GET /v1/customers/{id}/cards`        | Cartões contratados           |
| `GET /v1/customers/{id}/cards/available` | Catálogo de cartões        |
| `POST /v1/cards/request`              | Contratar cartão              |
| `GET /v1/customers/{id}/transactions` | Transações                    |
| `GET /v1/customers/{id}/financial-summary` | Resumo financeiro       |
| `POST /v1/pix/transfer`              | Transferência Pix             |
| `GET /healthz`                        | Health check                  |
| `GET /v1/metrics/agent`               | Métricas do agente IA         |

Todos os requests incluem:
- `X-Request-ID` (UUID v4) para correlação de traces
- Timeout configurável (default 30s)
- Interceptors para Network Inspector (dev)

---

## 📐 Design System

Tokens baseados na identidade visual Itaú:

| Token          | Valor       |
| -------------- | ----------- |
| `itauOrange`   | `#F37021`   |
| `itauBlue`     | `#003399`   |
| `spacing.md`   | `16`        |
| `radius.lg`    | `16`        |
| `fontSize.md`  | `16`        |

---

## 📄 Licença

Projeto desenvolvido como case técnico. Uso interno.
