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
| Testes           | Jest + React Native Testing Library |
| Design Tokens    | Itaú brand (orange / blue)         |

---

## 📂 Arquitetura

```
app/                    ← Expo Router (file-based routing)
  _layout.tsx           ← Root layout + providers
  index.tsx             ← Chat screen (tab 1)
  metrics.tsx           ← Observability dashboard (tab 2)

src/
  config/env.ts         ← Environment config via Constants
  lib/                  ← Infra layer
    errors.ts           ← AppError + ErrorCode hierarchy
    http-client.ts      ← Axios instance + interceptors
    query-client.ts     ← TanStack Query defaults
    utils.ts            ← Formatting, sanitization, ID gen
  types/                ← Shared TypeScript interfaces
  services/             ← API service layer (1 file per domain)
  stores/               ← Zustand stores (chat, customer)
  hooks/                ← React Query custom hooks
  theme/tokens.ts       ← Design tokens (colors, spacing, etc.)
  components/
    chat/               ← ChatBubble, ChatInput, TypingIndicator, EmptyChat
    metrics/            ← HealthCard, MetricTile, SectionHeader
    ui/                 ← Card, Badge, Avatar
  __tests__/            ← Unit tests
```

### Princípios

1. **Separation of Concerns** — cada pasta tem responsabilidade única
2. **Dependency Rule** — fluxo unidirecional: `screen → hook → service → http`
3. **No raw `fetch`** — toda comunicação HTTP passa pelo `http-client.ts`
4. **Error hierarchy** — `AppError` com `isRetryable`, `requiresAuth`, retry inteligente
5. **XSS prevention** — `sanitizeInput()` em toda entrada do usuário
6. **Correlation ID** — `X-Request-ID` UUID v4 em cada request para tracing

---

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Iniciar o dev server
npx expo start

# 3. Abrir no Expo Go (scan QR code no terminal)
# ou pressionar 'a' para Android / 'i' para iOS
```

### Variáveis de Ambiente

O app espera o BFA rodando em `localhost:8080`. Para customizar, edite `src/config/env.ts` ou configure no `app.json`:

```json
{
  "expo": {
    "extra": {
      "API_BASE_URL": "http://<IP>:8080",
      "APP_ENV": "development"
    }
  }
}
```

---

## 🧪 Testes

```bash
# Rodar todos
npm test

# Watch mode
npm run test:watch

# Com coverage
npx jest --coverage
```

**29 testes cobrindo:**
- `utils.ts` — formatação BRL, datas, sanitização, UUID generation
- `errors.ts` — AppError hierarchy, retryable/auth classification, serialization
- `http-client.ts` — Axios instance config validation
- `chat.store.ts` — Zustand store: send/clear/error flow, empty input guard

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

Shadows com suporte cross-platform (iOS `shadowX` + Android `elevation`).

---

## 🔗 Integração com o BFA

O app consome os endpoints do Backend For App (Go):

| Endpoint                      | Uso                           |
| ----------------------------- | ----------------------------- |
| `POST /v1/assistant/{id}`     | Enviar mensagem ao agente     |
| `GET /v1/customers/{id}`      | Perfil do cliente PJ          |
| `GET /v1/transactions/{id}`   | Transações do cliente         |
| `GET /v1/transactions/{id}/summary` | Resumo financeiro       |
| `GET /healthz`                | Health check dos serviços     |
| `GET /v1/metrics/agent`       | Métricas do agente IA         |

Todos os requests incluem:
- `X-Request-ID` (UUID v4) para correlação de traces
- Timeout configurável (default 30s)
- Retry automático para erros transientes (network, timeout, 429, 503)

---

## 📱 Funcionalidades

### 💬 Chat (Tab 1)
- Conversa com o assistente IA financeiro PJ
- Chips de sugestão na tela vazia
- Indicador de digitação animado
- Metadados da resposta: latência, tools usadas, fontes RAG com relevância, reasoning expandível
- Haptic feedback no envio

### 📊 Métricas (Tab 2)
- Health status dos serviços (BFA, Agent, Vector Store)
- KPIs do agente: latência P50/P95, tokens/req, custo estimado, precisão RAG, taxa de erro, cache hit rate
- Pull-to-refresh com auto-refresh a cada 30s

---

## 📄 Licença

Projeto desenvolvido como case técnico. Uso interno.
